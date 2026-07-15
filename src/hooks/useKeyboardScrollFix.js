import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

function isTextField(el) {
  return el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA';
}

function isInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.bottom > 0 &&
    rect.top < window.innerHeight &&
    rect.right > 0 &&
    rect.left < window.innerWidth
  );
}

/**
 * WKWebView only resizes `document.body` when the native keyboard opens, not
 * nested `overflow-y-auto` containers used throughout this app (modals,
 * Settings page). Content behind the keyboard becomes both hidden and
 * unreachable by scroll. This hook exposes the live keyboard height as the
 * `--kb-height` CSS variable (consumed via `pb-[var(--kb-height)]` on
 * scrollable containers, so their scrollable area grows to clear the
 * keyboard), scrolls the focused field into view once the keyboard finishes
 * animating in, and blurs (dismissing the keyboard) if the focused field
 * scrolls off-screen.
 */
export function useKeyboardScrollFix() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    const root = document.documentElement;
    let showHandle;
    let hideHandle;

    // Scroll events don't bubble, but a capture-phase listener on `document`
    // still receives them from any nested `overflow-y-auto` container.
    const blurIfOffscreen = () => {
      const active = document.activeElement;
      if (isTextField(active) && !isInViewport(active)) active.blur();
    };
    document.addEventListener('scroll', blurIfOffscreen, true);

    const handleKeyboardWillShow = (info) => {
      root.style.setProperty('--kb-height', `${info.keyboardHeight}px`);
      const active = document.activeElement;
      if (isTextField(active)) {
        setTimeout(
          () => active.scrollIntoView({ block: 'center', behavior: 'smooth' }),
          300,
        );
      }
    };

    const handleKeyboardWillHide = () => {
      root.style.setProperty('--kb-height', '0px');
    };

    import('@capacitor/keyboard').then(({ Keyboard }) => {
      Keyboard.addListener('keyboardWillShow', handleKeyboardWillShow).then(
        (handle) => {
          showHandle = handle;
        },
      );
      Keyboard.addListener('keyboardWillHide', handleKeyboardWillHide).then(
        (handle) => {
          hideHandle = handle;
        },
      );
    });

    return () => {
      document.removeEventListener('scroll', blurIfOffscreen, true);
      showHandle?.remove();
      hideHandle?.remove();
      root.style.setProperty('--kb-height', '0px');
    };
  }, []);
}
