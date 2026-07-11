import axios from 'axios';
import { Capacitor } from '@capacitor/core';

function resolveBaseUrl() {
  if (Capacitor.getPlatform() === 'android') return 'http://10.0.2.2:8000';
  // iOS Simulator only: "localhost" is the Mac's own loopback here (the
  // simulator shares the host's network stack), so it bypasses the
  // corporate-managed Mac's firewall entirely. The LAN IP does NOT work —
  // this Mac is MDM-managed and inbound LAN connections to the local
  // backend are blocked with no way to add a firewall exception.
  if (Capacitor.isNativePlatform()) return 'http://localhost:8000';
  return import.meta.env.VITE_URL_BADI_API || '/api';
}

const BASE_URL = resolveBaseUrl();

const cache = {};

export async function fetchBadiYear(gregYear, lang = 'es') {
  const key = `${gregYear}_${lang}`;
  if (cache[key]) return cache[key];

  const promise = axios
    .get(`${BASE_URL}/complete/${gregYear}?lang=${lang}`)
    .then((res) => {
      const data = res.data;
      if (!data?.months?.length) throw new Error('Invalid API response');
      return data;
    })
    .catch((err) => {
      delete cache[key];
      throw err;
    });
  cache[key] = promise;
  return promise;
}

export function clearCache() {
  Object.keys(cache).forEach((k) => delete cache[k]);
}
