import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  isNativePlatform: vi.fn(),
  getPlatform: vi.fn(),
  appleMapsPreview: vi.fn(),
  searchEventLocations: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: mockState.isNativePlatform,
    getPlatform: mockState.getPlatform,
  },
}));

vi.mock('../native/bahaiCalendarNative', () => ({
  CapacitorCalendar: {
    appleMapsPreview: mockState.appleMapsPreview,
  },
}));

vi.mock('./geocodingApi', () => ({
  searchEventLocations: mockState.searchEventLocations,
}));

import {
  getLocationMapPreview,
  locationQueryCandidates,
  MAP_PREVIEW_ZOOM,
  osmTileLayout,
} from './mapPreview';

function createCanvasMocks() {
  const drawImage = vi.fn();
  const scale = vi.fn();
  const ctx = {
    drawImage,
    scale,
  };

  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn().mockReturnValue(ctx),
    toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,OSM'),
  };

  return { canvas, ctx, drawImage, scale };
}

function stubCanvasAndImage({ failingUrls = new Set() } = {}) {
  const { canvas, drawImage, scale } = createCanvasMocks();
  const createdImages = [];

  class FakeImage {
    constructor() {
      this.crossOrigin = undefined;
      this.onload = null;
      this.onerror = null;
      this._src = '';
      createdImages.push(this);
    }

    set src(value) {
      this._src = value;
      queueMicrotask(() => {
        if (failingUrls.has(value)) {
          if (this.onerror)
            this.onerror(new Error(`Failed to load tile: ${value}`));
          return;
        }
        if (this.onload) this.onload();
      });
    }

    get src() {
      return this._src;
    }
  }

  vi.stubGlobal('document', {
    createElement: vi.fn().mockImplementation((tag) => {
      if (tag === 'canvas') return canvas;
      return null;
    }),
  });
  vi.stubGlobal('Image', FakeImage);

  return { canvas, drawImage, scale, createdImages };
}

function nativeAppleResponse({
  imageDataUrl = 'data:image/png;base64,APPLE',
  latitude = 40.4168,
  longitude = -3.7038,
} = {}) {
  return {
    result: {
      imageDataUrl,
      latitude,
      longitude,
    },
  };
}

function tileCoordsFromUrl(url) {
  const match = url.match(/\/16\/(\d+)\/(\d+)\.png$/);
  if (!match) return null;
  return { x: Number(match[1]), y: Number(match[2]) };
}

describe('locationQueryCandidates', () => {
  it('normalizes newline/compression and keeps ordered deduplicated candidates', () => {
    expect(locationQueryCandidates('Name\nStreet, City')).toEqual([
      'Name, Street, City',
      'Name, Street',
      'Name',
    ]);

    expect(locationQueryCandidates('  Plaza\n\n Mayor   ,   Madrid  ')).toEqual(
      ['Plaza, Mayor , Madrid', 'Plaza, Mayor', 'Plaza'],
    );

    expect(locationQueryCandidates('Avenue, Avenue')).toEqual([
      'Avenue, Avenue',
      'Avenue',
    ]);
  });

  it('drops short candidates and handles invalid/blank inputs', () => {
    expect(locationQueryCandidates('ab')).toEqual([]);
    expect(locationQueryCandidates('')).toEqual([]);
    expect(locationQueryCandidates('   ')).toEqual([]);
    expect(locationQueryCandidates(null)).toEqual([]);
    expect(locationQueryCandidates(42)).toEqual([]);
  });
});

describe('osmTileLayout', () => {
  it('centers coordinates in viewport and fully covers target dimensions', () => {
    const latitude = 40.4168;
    const longitude = -3.7038;
    const zoom = MAP_PREVIEW_ZOOM;
    const width = 340;
    const height = 176;

    const tiles = osmTileLayout({ latitude, longitude, zoom, width, height });
    expect(tiles.length).toBeGreaterThan(0);

    const n = 2 ** zoom;
    const tileSize = 256;
    const latRad = (latitude * Math.PI) / 180;
    const worldX = ((longitude + 180) / 360) * n * tileSize;
    const worldY =
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      n *
      tileSize;

    const centerX = width / 2;
    const centerY = height / 2;

    const containingTile = tiles.find(
      (tile) =>
        tile.x <= centerX &&
        tile.x + tileSize > centerX &&
        tile.y <= centerY &&
        tile.y + tileSize > centerY,
    );
    expect(containingTile).toBeTruthy();

    const left = worldX - centerX;
    const top = worldY - centerY;
    const parsed = tileCoordsFromUrl(containingTile.url);
    expect(parsed).toBeTruthy();

    expect(worldX - parsed.x * tileSize + containingTile.x).toBeCloseTo(
      centerX,
      10,
    );
    expect(worldY - parsed.y * tileSize + containingTile.y).toBeCloseTo(
      centerY,
      10,
    );

    const minX = Math.min(...tiles.map((tile) => tile.x));
    const minY = Math.min(...tiles.map((tile) => tile.y));
    const maxX = Math.max(...tiles.map((tile) => tile.x + tileSize));
    const maxY = Math.max(...tiles.map((tile) => tile.y + tileSize));

    expect(minX).toBeLessThanOrEqual(0);
    expect(minY).toBeLessThanOrEqual(0);
    expect(maxX).toBeGreaterThanOrEqual(width);
    expect(maxY).toBeGreaterThanOrEqual(height);

    expect(left).toBeCloseTo(worldX - centerX, 10);
    expect(top).toBeCloseTo(worldY - centerY, 10);

    tiles.forEach((tile) => {
      expect(tile.url).toMatch(
        /^https:\/\/tile\.openstreetmap\.org\/16\/\d+\/\d+\.png$/,
      );
    });
  });

  it('wraps antimeridian x indexes into valid [0, 2^zoom) range and can include 0', () => {
    const zoom = 2;
    const n = 2 ** zoom;
    const tiles = osmTileLayout({
      latitude: 10,
      longitude: 179.99,
      zoom,
      width: 512,
      height: 176,
    });

    const xIndexes = tiles
      .map((tile) => tile.url.match(new RegExp(`/${zoom}/(\\d+)/`)))
      .filter(Boolean)
      .map((match) => Number(match[1]));

    expect(xIndexes.length).toBeGreaterThan(0);
    xIndexes.forEach((x) => {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(n);
    });
    expect(xIndexes).toContain(0);
  });

  it('returns empty layout for invalid numeric input', () => {
    expect(
      osmTileLayout({
        latitude: Number.NaN,
        longitude: -3.7,
        zoom: 16,
        width: 340,
        height: 176,
      }),
    ).toEqual([]);

    expect(
      osmTileLayout({
        latitude: 40,
        longitude: -3,
        zoom: 16,
        width: 0,
        height: 176,
      }),
    ).toEqual([]);
  });
});

describe('getLocationMapPreview native apple', () => {
  beforeEach(() => {
    mockState.isNativePlatform.mockReset();
    mockState.getPlatform.mockReset();
    mockState.appleMapsPreview.mockReset();
    mockState.searchEventLocations.mockReset();
    mockState.isNativePlatform.mockReturnValue(true);
    mockState.getPlatform.mockReturnValue('ios');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('returns apple preview and sends first candidate payload without coords when not provided', async () => {
    mockState.appleMapsPreview.mockResolvedValueOnce(nativeAppleResponse());

    const result = await getLocationMapPreview('Name\nStreet, City', {
      width: 600,
      height: 240,
      dark: true,
    });

    expect(result).toEqual({
      imageUrl: 'data:image/png;base64,APPLE',
      latitude: 40.4168,
      longitude: -3.7038,
      source: 'apple',
    });

    expect(mockState.appleMapsPreview).toHaveBeenCalledTimes(1);
    const payload = mockState.appleMapsPreview.mock.calls[0][0];
    expect(payload).toMatchObject({
      query: 'Name, Street, City',
      width: 600,
      height: 240,
      dark: true,
      zoom: 16,
    });
    expect(typeof payload.scale).toBe('number');
    expect(payload).not.toHaveProperty('latitude');
    expect(payload).not.toHaveProperty('longitude');
  });

  it('uses known coordinates in a single native request', async () => {
    mockState.appleMapsPreview.mockResolvedValueOnce(
      nativeAppleResponse({ latitude: 51.5, longitude: -0.12 }),
    );

    const result = await getLocationMapPreview('Somewhere', {
      latitude: 51.5,
      longitude: -0.12,
    });

    expect(result).toEqual({
      imageUrl: 'data:image/png;base64,APPLE',
      latitude: 51.5,
      longitude: -0.12,
      source: 'apple',
    });

    expect(mockState.appleMapsPreview).toHaveBeenCalledTimes(1);
    expect(mockState.appleMapsPreview).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 51.5, longitude: -0.12 }),
    );
  });

  it('tries next candidate when the first native query rejects', async () => {
    mockState.appleMapsPreview
      .mockRejectedValueOnce(new Error('first failed'))
      .mockResolvedValueOnce(
        nativeAppleResponse({ latitude: 41, longitude: 2 }),
      );

    const result = await getLocationMapPreview('Alpha, Beta, Gamma');

    expect(result).toEqual({
      imageUrl: 'data:image/png;base64,APPLE',
      latitude: 41,
      longitude: 2,
      source: 'apple',
    });

    expect(mockState.appleMapsPreview).toHaveBeenCalledTimes(2);
    expect(mockState.appleMapsPreview.mock.calls[0][0].query).toBe(
      'Alpha, Beta, Gamma',
    );
    expect(mockState.appleMapsPreview.mock.calls[1][0].query).toBe(
      'Alpha, Beta',
    );
  });

  it('rejects non-data native image and falls through to OSM preview path', async () => {
    mockState.appleMapsPreview.mockResolvedValueOnce(
      nativeAppleResponse({ imageDataUrl: 'https://not-data.example/img.png' }),
    );

    const { drawImage } = stubCanvasAndImage();

    const result = await getLocationMapPreview('Known place', {
      latitude: 40.4168,
      longitude: -3.7038,
      width: 340,
      height: 176,
    });

    expect(result).toMatchObject({
      imageUrl: 'data:image/jpeg;base64,OSM',
      latitude: 40.4168,
      longitude: -3.7038,
      source: 'osm',
    });
    expect(drawImage).toHaveBeenCalled();
  });
});

describe('getLocationMapPreview OSM rendering path', () => {
  beforeEach(() => {
    mockState.isNativePlatform.mockReset();
    mockState.getPlatform.mockReset();
    mockState.appleMapsPreview.mockReset();
    mockState.searchEventLocations.mockReset();
    mockState.isNativePlatform.mockReturnValue(false);
    mockState.getPlatform.mockReturnValue('web');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders OSM tiles, uses anonymous images, and geocodes with requested language', async () => {
    const { drawImage, createdImages } = stubCanvasAndImage();
    mockState.searchEventLocations.mockResolvedValueOnce([
      {
        latitude: 40.4168,
        longitude: -3.7038,
      },
    ]);

    const width = 340;
    const height = 176;
    const result = await getLocationMapPreview('Madrid city center', {
      language: 'es',
      width,
      height,
    });

    expect(mockState.searchEventLocations).toHaveBeenCalledTimes(1);
    expect(mockState.searchEventLocations).toHaveBeenCalledWith(
      'Madrid city center',
      {
        count: 1,
        language: 'es',
      },
    );

    expect(result).toEqual({
      imageUrl: 'data:image/jpeg;base64,OSM',
      latitude: 40.4168,
      longitude: -3.7038,
      source: 'osm',
    });

    const expectedTiles = osmTileLayout({
      latitude: 40.4168,
      longitude: -3.7038,
      zoom: 16,
      width,
      height,
    });
    expect(drawImage).toHaveBeenCalledTimes(expectedTiles.length);

    createdImages.forEach((img) => {
      expect(img.crossOrigin).toBe('anonymous');
    });
  });

  it('skips geocoding when valid coordinates are known', async () => {
    stubCanvasAndImage();

    const result = await getLocationMapPreview('Will be ignored for geocode', {
      latitude: 37.9838,
      longitude: 23.7275,
    });

    expect(result).toMatchObject({
      imageUrl: 'data:image/jpeg;base64,OSM',
      latitude: 37.9838,
      longitude: 23.7275,
      source: 'osm',
    });
    expect(mockState.searchEventLocations).not.toHaveBeenCalled();
  });

  it('returns null when any tile fails to load', async () => {
    const coords = { latitude: 40.4168, longitude: -3.7038 };
    const tiles = osmTileLayout({
      ...coords,
      zoom: 16,
      width: 340,
      height: 176,
    });
    const failingUrls = new Set([tiles[0].url]);
    stubCanvasAndImage({ failingUrls });

    const result = await getLocationMapPreview('Known coordinates path', {
      ...coords,
      width: 340,
      height: 176,
    });

    expect(result).toBeNull();
  });

  it('returns null when geocoding produces no coordinates', async () => {
    stubCanvasAndImage();
    mockState.searchEventLocations.mockResolvedValueOnce([]);

    const result = await getLocationMapPreview('Unresolvable location', {
      language: 'en',
    });

    expect(result).toBeNull();
  });

  it('returns null for blank location without coordinates and makes no native/geocode calls', async () => {
    const result = await getLocationMapPreview('   ');

    expect(result).toBeNull();
    expect(mockState.searchEventLocations).not.toHaveBeenCalled();
    expect(mockState.appleMapsPreview).not.toHaveBeenCalled();
  });

  it('never throws and resolves to null on unexpected geocoding errors', async () => {
    stubCanvasAndImage();
    mockState.searchEventLocations.mockRejectedValueOnce(new Error('boom'));

    await expect(getLocationMapPreview('Any location')).resolves.toBeNull();
  });
});
