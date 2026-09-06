import { useEffect } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';

const AndroidNavigationInsets = registerPlugin('AndroidNavigationInsets');
const BOTTOM_INSET_PROPERTY = '--android-navigation-bar-inset-bottom';

function toValidInset(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const rounded = Math.round(num);
  if (rounded < 0 || rounded > 1000) return null;
  return rounded;
}

export function useAndroidNavigationInset() {
  useEffect(() => {
    const root = document.documentElement;

    if (
      Capacitor.getPlatform() !== 'android' ||
      !Capacitor.isPluginAvailable('AndroidNavigationInsets')
    ) {
      root.style.removeProperty(BOTTOM_INSET_PROPERTY);
      return undefined;
    }

    let active = true;
    let listenerHandle;

    const clearInset = () => {
      if (active) root.style.removeProperty(BOTTOM_INSET_PROPERTY);
    };

    const applyInset = (payload) => {
      if (!active) return;
      const inset = toValidInset(payload?.bottom);
      if (inset === null) {
        clearInset();
        return;
      }
      root.style.setProperty(BOTTOM_INSET_PROPERTY, `${inset}px`);
    };

    void AndroidNavigationInsets.getBottomInset().then(applyInset, clearInset);
    void AndroidNavigationInsets.addListener('insetsChanged', applyInset).then(
      (handle) => {
        if (active) listenerHandle = handle;
        else void handle.remove();
      },
      clearInset,
    );

    return () => {
      active = false;
      root.style.removeProperty(BOTTOM_INSET_PROPERTY);
      if (listenerHandle) void listenerHandle.remove();
    };
  }, []);
}
