import { Capacitor } from '@capacitor/core';
import { searchEventLocations } from './geocodingApi';
import { CapacitorCalendar } from '../native/bahaiCalendarNative';

/** Default zoom level used for map previews. */
export const MAP_PREVIEW_ZOOM = 16;

const TILE_SIZE = 256;
const MAX_MERCATOR_LATITUDE = 85.0511287798;

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function hasValidCoordinates(latitude, longitude) {
  return (
    isFiniteNumber(latitude) &&
    isFiniteNumber(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}

function isDataImageUrl(value) {
  return typeof value === 'string' && value.startsWith('data:image/');
}

/**
 * Build ordered location query candidates from a location label.
 * @param {string} location
 * @returns {string[]}
 */
export function locationQueryCandidates(location) {
  if (typeof location !== 'string') return [];
  const compact = location
    .replace(/\r?\n+/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!compact) return [];

  const parts = compact
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const candidates = [compact];
  if (parts.length >= 2) candidates.push(`${parts[0]}, ${parts[1]}`);
  if (parts.length >= 1) candidates.push(parts[0]);

  return [...new Set(candidates)].filter((candidate) => candidate.length >= 3);
}

/**
 * Compute OSM tile URLs and draw offsets for a viewport centered at given coords.
 * @param {{ latitude: number, longitude: number, zoom: number, width: number, height: number }} options
 * @returns {Array<{ url: string, x: number, y: number }>}
 */
export function osmTileLayout({ latitude, longitude, zoom, width, height }) {
  if (
    !isFiniteNumber(latitude) ||
    !isFiniteNumber(longitude) ||
    !isFiniteNumber(zoom) ||
    !isFiniteNumber(width) ||
    !isFiniteNumber(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return [];
  }

  const n = 2 ** zoom;
  if (!Number.isFinite(n) || n <= 0) return [];

  const clampedLatitude = Math.max(
    -MAX_MERCATOR_LATITUDE,
    Math.min(MAX_MERCATOR_LATITUDE, latitude),
  );
  const latRad = (clampedLatitude * Math.PI) / 180;
  const worldX = ((longitude + 180) / 360) * n * TILE_SIZE;
  const worldY =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    n *
    TILE_SIZE;

  const left = worldX - width / 2;
  const top = worldY - height / 2;
  const right = left + width;
  const bottom = top + height;

  const minTileX = Math.floor(left / TILE_SIZE);
  const maxTileX = Math.floor((right - 1) / TILE_SIZE);
  const minTileY = Math.floor(top / TILE_SIZE);
  const maxTileY = Math.floor((bottom - 1) / TILE_SIZE);

  const tiles = [];
  for (let ty = minTileY; ty <= maxTileY; ty += 1) {
    if (ty < 0 || ty >= n) continue;
    for (let tx = minTileX; tx <= maxTileX; tx += 1) {
      const wrappedX = ((tx % n) + n) % n;
      tiles.push({
        url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${ty}.png`,
        x: tx * TILE_SIZE - left,
        y: ty * TILE_SIZE - top,
      });
    }
  }

  return tiles;
}

function supportsNativeAppleMapPreview() {
  return (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === 'ios' &&
    typeof CapacitorCalendar.appleMapsPreview === 'function'
  );
}

function parseNativePreviewResult(response) {
  const imageDataUrl = response?.result?.imageDataUrl;
  const latitude = response?.result?.latitude;
  const longitude = response?.result?.longitude;

  if (!isDataImageUrl(imageDataUrl)) return null;
  if (!isFiniteNumber(latitude) || !isFiniteNumber(longitude)) return null;

  return { imageUrl: imageDataUrl, latitude, longitude };
}

async function callNativeAppleMapPreview({
  query,
  latitude,
  longitude,
  width,
  height,
  dark,
}) {
  const payload = {
    query,
    width,
    height,
    scale: Math.min(globalThis.devicePixelRatio || 2, 3),
    zoom: MAP_PREVIEW_ZOOM,
    dark,
  };

  if (hasValidCoordinates(latitude, longitude)) {
    payload.latitude = latitude;
    payload.longitude = longitude;
  }

  const response = await CapacitorCalendar.appleMapsPreview(payload);
  return parseNativePreviewResult(response);
}

async function getNativeAppleMapPreview({
  location,
  queries,
  latitude,
  longitude,
  width,
  height,
  dark,
}) {
  if (!supportsNativeAppleMapPreview()) return null;

  const fallbackQuery = typeof location === 'string' ? location : '';
  if (hasValidCoordinates(latitude, longitude)) {
    try {
      return await callNativeAppleMapPreview({
        query: queries[0] || fallbackQuery,
        latitude,
        longitude,
        width,
        height,
        dark,
      });
    } catch {
      return null;
    }
  }

  for (const query of queries) {
    try {
      const preview = await callNativeAppleMapPreview({
        query,
        width,
        height,
        dark,
      });
      if (preview) return preview;
    } catch {
      // Try next query candidate.
    }
  }

  return null;
}

async function renderOsmPreview({ latitude, longitude, width, height }) {
  const scale = Math.min(globalThis.devicePixelRatio || 1, 2);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  const tiles = osmTileLayout({
    latitude,
    longitude,
    zoom: MAP_PREVIEW_ZOOM,
    width,
    height,
  });

  const loadedTiles = await Promise.all(
    tiles.map(
      (tile) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          // Required so toDataURL is not blocked by a tainted canvas.
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve({ tile, img });
          img.onerror = () =>
            reject(new Error(`Failed to load tile: ${tile.url}`));
          img.src = tile.url;
        }),
    ),
  );

  loadedTiles.forEach(({ tile, img }) => {
    // Snap edges to device pixels so neighbouring tiles share them (no hairline seams).
    const left = Math.round(tile.x * scale);
    const top = Math.round(tile.y * scale);
    ctx.drawImage(
      img,
      left,
      top,
      Math.round((tile.x + TILE_SIZE) * scale) - left,
      Math.round((tile.y + TILE_SIZE) * scale) - top,
    );
  });

  return canvas.toDataURL('image/jpeg', 0.85);
}

async function resolveCoordinatesFromQueries(queries, language) {
  for (const query of queries) {
    try {
      const results = await searchEventLocations(query, { count: 1, language });
      const first = Array.isArray(results) ? results[0] : null;
      const latitude = first?.latitude;
      const longitude = first?.longitude;
      if (isFiniteNumber(latitude) && isFiniteNumber(longitude)) {
        return { latitude, longitude };
      }
    } catch {
      // Try next query candidate.
    }
  }
  return null;
}

/**
 * Resolve a map preview image and coordinates for a location label.
 * @param {string} location
 * @param {{ latitude?: number, longitude?: number, width?: number, height?: number, dark?: boolean, language?: string }} options
 * @returns {Promise<{ imageUrl: string, latitude: number, longitude: number, source: 'apple' | 'osm' } | null>}
 */
export async function getLocationMapPreview(
  location,
  {
    latitude,
    longitude,
    width = 768,
    height = 320,
    dark = false,
    language = 'en',
  } = {},
) {
  try {
    const queries = locationQueryCandidates(location);
    const hasCoords = hasValidCoordinates(latitude, longitude);
    if (!hasCoords && queries.length === 0) return null;

    const nativePreview = await getNativeAppleMapPreview({
      location,
      queries,
      latitude,
      longitude,
      width,
      height,
      dark,
    });

    if (nativePreview) {
      return {
        imageUrl: nativePreview.imageUrl,
        latitude: nativePreview.latitude,
        longitude: nativePreview.longitude,
        source: 'apple',
      };
    }

    let coords = null;
    if (hasCoords) {
      coords = { latitude, longitude };
    } else {
      coords = await resolveCoordinatesFromQueries(queries, language);
    }
    if (!coords) return null;

    const imageUrl = await renderOsmPreview({
      latitude: coords.latitude,
      longitude: coords.longitude,
      width,
      height,
    });

    return {
      imageUrl,
      latitude: coords.latitude,
      longitude: coords.longitude,
      source: 'osm',
    };
  } catch {
    return null;
  }
}
