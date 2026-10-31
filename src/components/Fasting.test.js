import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Fasting from './Fasting';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

vi.mock('../context/SettingsContext', () => ({
  useSettings: () => ({ lang: 'en' }),
}));

vi.mock('../lib/badiDate', () => ({
  formatGregorianDate: (date) => date.toISOString().slice(0, 10),
}));

vi.mock('../hooks/useFastingAlarms', () => ({
  useFastingAlarms: () => ({ supported: true }),
}));

vi.mock('../hooks/useFastingSunTimes', () => ({
  useFastingSunTimes: () => ({
    today: new Date('2026-03-01T12:00:00Z'),
    fast: {
      start: new Date('2026-03-01T12:00:00Z'),
      end: new Date('2026-03-19T12:00:00Z'),
    },
    fastYear: 183,
    isFasting: true,
    daysUntil: 0,
    daysRemaining: 19,
    loading: false,
    location: { lat: 40.4, lon: -3.7, name: 'Madrid' },
    saveLocation: vi.fn(),
    clearLocation: vi.fn(),
    sunTimes: null,
    loadingSun: false,
  }),
}));

vi.mock('../utils/devPreview', () => ({
  shouldPreviewNativeSettings: () => false,
}));

vi.mock('./base', () => ({
  BaseIcon: ({ icon }) => createElement('span', null, icon),
}));

vi.mock('./base/BaseSpinner', () => ({
  default: () => createElement('span', null, 'spinner'),
}));

vi.mock('./FastingAlarmsModal', () => ({
  default: () => null,
}));

vi.mock('./LocationPicker', () => ({
  default: () => null,
}));

afterEach(() => vi.unstubAllGlobals());

describe('Fasting', () => {
  it('renders a saved location with an alarm control', () => {
    vi.stubGlobal('React', React);
    const html = renderToStaticMarkup(createElement(Fasting));

    expect(html).toContain('Madrid');
    expect(html).toContain('alarm');
  });
});
