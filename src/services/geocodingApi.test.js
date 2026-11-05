import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  isNativePlatform: vi.fn(),
  getPlatform: vi.fn(),
  searchMapPlaces: vi.fn(),
  reverseGeocode: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: mockState.isNativePlatform,
    getPlatform: mockState.getPlatform,
  },
}));

vi.mock('../native/bahaiCalendarNative', () => ({
  CapacitorCalendar: {
    searchMapPlaces: mockState.searchMapPlaces,
    reverseGeocode: mockState.reverseGeocode,
  },
}));

import { reverseGeocode, searchEventLocations } from './geocodingApi';

function photonResponse(features) {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue({
      type: 'FeatureCollection',
      features,
    }),
  };
}

describe('searchEventLocations', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockState.isNativePlatform.mockReset();
    mockState.getPlatform.mockReset();
    mockState.searchMapPlaces.mockReset();
    mockState.isNativePlatform.mockReturnValue(false);
    mockState.getPlatform.mockReturnValue('web');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('requests Photon on web and returns normalized places', async () => {
    fetch.mockResolvedValueOnce(
      photonResponse([
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-3.8708597, 40.3392242] },
          properties: {
            osm_type: 'W',
            osm_id: 171935388,
            osm_key: 'amenity',
            osm_value: 'hospital',
            name: 'Hospital Rey Juan Carlos I',
            street: 'Calle Gladiolo',
            city: 'Móstoles',
            state: 'Comunidad de Madrid',
            country: 'España',
            postcode: '28933',
            countrycode: 'ES',
          },
        },
      ]),
    );

    const result = await searchEventLocations('Hospital rey juan carlos', {
      language: 'es',
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    const requestUrl = new URL(fetch.mock.calls[0][0]);
    expect(`${requestUrl.origin}${requestUrl.pathname}`).toBe(
      'https://photon.komoot.io/api/',
    );
    expect(requestUrl.searchParams.get('q')).toBe('Hospital rey juan carlos');
    expect(requestUrl.searchParams.get('limit')).toBe('5');
    expect(requestUrl.searchParams.get('lang')).toBe('default');

    expect(result).toEqual([
      {
        id: 'W171935388',
        name: 'Hospital Rey Juan Carlos I',
        address: 'Calle Gladiolo, 28933 Móstoles, Comunidad de Madrid, España',
        latitude: 40.3392242,
        longitude: -3.8708597,
      },
    ]);
  });

  it.each(['en', 'de', 'fr'])(
    'passes through supported Photon language %s',
    async (language) => {
      fetch.mockResolvedValueOnce(photonResponse([]));

      await searchEventLocations('Hospital rey juan carlos', { language });

      expect(fetch).toHaveBeenCalledTimes(1);
      const requestUrl = new URL(fetch.mock.calls[0][0]);
      expect(requestUrl.searchParams.get('lang')).toBe(language);
    },
  );

  it('drops invalid Photon features and derives house name without repeating it in address', async () => {
    fetch.mockResolvedValueOnce(
      photonResponse([
        {
          type: 'Feature',
          properties: {
            name: 'Missing geometry',
          },
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: ['-3.8708597', '40.3392242'],
          },
          properties: {
            name: 'String coordinates',
          },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-3.87, 40.33] },
          properties: {},
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-3.8708597, 40.3392242] },
          properties: {
            osm_type: 'W',
            osm_id: 99,
            street: 'Calle Gladiolo',
            housenumber: '5',
            postcode: '28933',
            city: 'Móstoles',
            state: 'Comunidad de Madrid',
            country: 'España',
          },
        },
      ]),
    );

    const result = await searchEventLocations('Hospital rey juan carlos');

    expect(result).toEqual([
      {
        id: 'W99',
        name: 'Calle Gladiolo 5',
        address: '28933 Móstoles, Comunidad de Madrid, España',
        latitude: 40.3392242,
        longitude: -3.8708597,
      },
    ]);
  });

  it.each([
    {
      caseName: 'non-OK Photon response',
      firstFetch: () => ({ ok: false, status: 503 }),
    },
    {
      caseName: 'rejected Photon request',
      firstFetch: () => Promise.reject(new Error('network error')),
    },
  ])('falls back to Open-Meteo on $caseName', async ({ firstFetch }) => {
    fetch.mockImplementationOnce(firstFetch);
    fetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        results: [
          {
            id: 3117814,
            name: 'Móstoles',
            admin1: 'Madrid',
            country: 'España',
            latitude: 40.32,
            longitude: -3.86,
          },
        ],
      }),
    });

    const result = await searchEventLocations('Móstoles', {
      count: 5,
      language: 'es',
    });

    expect(fetch).toHaveBeenCalledTimes(2);

    const fallbackUrl = new URL(fetch.mock.calls[1][0]);
    expect(`${fallbackUrl.origin}${fallbackUrl.pathname}`).toBe(
      'https://geocoding-api.open-meteo.com/v1/search',
    );
    expect(fallbackUrl.searchParams.get('name')).toBe('Móstoles');
    expect(fallbackUrl.searchParams.get('count')).toBe('5');
    expect(fallbackUrl.searchParams.get('language')).toBe('es');

    expect(result).toEqual([
      {
        id: '3117814',
        name: 'Móstoles',
        address: 'Madrid, España',
        latitude: 40.32,
        longitude: -3.86,
      },
    ]);
  });

  it('uses native iOS MapKit first and skips fetch when native returns places', async () => {
    mockState.isNativePlatform.mockReturnValue(true);
    mockState.getPlatform.mockReturnValue('ios');
    mockState.searchMapPlaces.mockResolvedValueOnce({
      result: [
        {
          id: '0-40.33-(-3.87)',
          name: 'Hospital Universitario Rey Juan Carlos',
          admin1: 'Comunidad de Madrid',
          country: 'España',
          latitude: 40.33,
          longitude: -3.87,
        },
      ],
    });

    const result = await searchEventLocations('Hospital rey juan carlos', {
      count: 5,
    });

    expect(mockState.searchMapPlaces).toHaveBeenCalledTimes(1);
    expect(mockState.searchMapPlaces).toHaveBeenCalledWith({
      query: 'Hospital rey juan carlos',
      count: 5,
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(result).toEqual([
      {
        id: '0-40.33-(-3.87)',
        name: 'Hospital Universitario Rey Juan Carlos',
        address: 'Comunidad de Madrid, España',
        latitude: 40.33,
        longitude: -3.87,
      },
    ]);
  });

  it('uses native address preserving municipality and strips a leading name prefix', async () => {
    mockState.isNativePlatform.mockReturnValue(true);
    mockState.getPlatform.mockReturnValue('ios');
    mockState.searchMapPlaces.mockResolvedValueOnce({
      result: [
        {
          id: 'item-1',
          name: 'Centro de Salud la Princesa',
          address: 'Calle de Severo Ochoa, 4, 28932 Móstoles, Madrid, España',
          admin1: 'Madrid',
          country: 'España',
          latitude: 40.3227,
          longitude: -3.8649,
        },
        {
          id: 'item-2',
          name: 'Calle de Severo Ochoa, 4',
          address: 'Calle de Severo Ochoa, 4, 28932 Móstoles, Madrid, España',
          admin1: 'Madrid',
          country: 'España',
          latitude: 40.3227,
          longitude: -3.8649,
        },
      ],
    });

    const result = await searchEventLocations('Centro de Salud la Princesa', {
      count: 5,
    });

    expect(result).toEqual([
      {
        id: 'item-1',
        name: 'Centro de Salud la Princesa',
        address: 'Calle de Severo Ochoa, 4, 28932 Móstoles, Madrid, España',
        latitude: 40.3227,
        longitude: -3.8649,
      },
      {
        id: 'item-2',
        name: 'Calle de Severo Ochoa, 4',
        address: '28932 Móstoles, Madrid, España',
        latitude: 40.3227,
        longitude: -3.8649,
      },
    ]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    {
      caseName: 'native returns empty list',
      setupNative: () =>
        mockState.searchMapPlaces.mockResolvedValueOnce({ result: [] }),
    },
    {
      caseName: 'native search rejects',
      setupNative: () =>
        mockState.searchMapPlaces.mockRejectedValueOnce(
          new Error('MapKit error'),
        ),
    },
  ])('falls back to Photon when $caseName', async ({ setupNative }) => {
    mockState.isNativePlatform.mockReturnValue(true);
    mockState.getPlatform.mockReturnValue('ios');
    setupNative();
    fetch.mockResolvedValueOnce(photonResponse([]));

    await searchEventLocations('Hospital rey juan carlos', { count: 5 });

    expect(fetch).toHaveBeenCalledTimes(1);
    const requestUrl = new URL(fetch.mock.calls[0][0]);
    expect(`${requestUrl.origin}${requestUrl.pathname}`).toBe(
      'https://photon.komoot.io/api/',
    );
  });

  it.each(['', '   ', '\n\t'])(
    'returns an empty array for blank query %j without network or native calls',
    async (query) => {
      const result = await searchEventLocations(query, { count: 5 });

      expect(result).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
      expect(mockState.searchMapPlaces).not.toHaveBeenCalled();
    },
  );
});

describe('reverseGeocode', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockState.isNativePlatform.mockReset();
    mockState.getPlatform.mockReset();
    mockState.reverseGeocode.mockReset();
    mockState.isNativePlatform.mockReturnValue(false);
    mockState.getPlatform.mockReturnValue('web');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('uses Apple geocoding on iOS and never calls BigDataCloud', async () => {
    mockState.isNativePlatform.mockReturnValue(true);
    mockState.getPlatform.mockReturnValue('ios');
    mockState.reverseGeocode.mockResolvedValueOnce({
      result: {
        city: 'Madrid',
        region: 'Comunidad de Madrid',
        country: 'España',
      },
    });

    const result = await reverseGeocode(40.4168, -3.7038, 'es');

    expect(result).toBe('Madrid, Comunidad de Madrid, España');
    expect(mockState.reverseGeocode).toHaveBeenCalledWith({
      latitude: 40.4168,
      longitude: -3.7038,
      language: 'es',
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('drops empty and repeated names on iOS', async () => {
    mockState.isNativePlatform.mockReturnValue(true);
    mockState.getPlatform.mockReturnValue('ios');
    mockState.reverseGeocode.mockResolvedValueOnce({
      result: {
        city: ' Madrid ',
        region: 'Madrid',
        country: '',
      },
    });

    const result = await reverseGeocode(40.4168, -3.7038, 'es');

    expect(result).toBe('Madrid');
  });

  it('returns null on iOS when Apple geocoding fails, without falling back to BigDataCloud', async () => {
    mockState.isNativePlatform.mockReturnValue(true);
    mockState.getPlatform.mockReturnValue('ios');
    mockState.reverseGeocode.mockRejectedValueOnce(new Error('offline'));

    const result = await reverseGeocode(40.4168, -3.7038, 'es');

    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses BigDataCloud outside iOS', async () => {
    fetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({
        city: 'Madrid',
        principalSubdivision: 'Comunidad de Madrid',
        countryName: 'España',
      }),
    });

    const result = await reverseGeocode(40.4168, -3.7038, 'es');

    expect(result).toBe('Madrid, Comunidad de Madrid, España');
    expect(mockState.reverseGeocode).not.toHaveBeenCalled();

    const requestUrl = new URL(fetch.mock.calls[0][0]);
    expect(`${requestUrl.origin}${requestUrl.pathname}`).toBe(
      'https://api.bigdatacloud.net/data/reverse-geocode-client',
    );
    expect(requestUrl.searchParams.get('latitude')).toBe('40.4168');
    expect(requestUrl.searchParams.get('longitude')).toBe('-3.7038');
    expect(requestUrl.searchParams.get('localityLanguage')).toBe('es');
  });
});
