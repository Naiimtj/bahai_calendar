import { Capacitor } from '@capacitor/core';
import { Haptics } from '@capacitor/haptics';

/**
 * Thin wrapper around @capacitor/haptics for the wheel-picker "tick" feedback.
 * No-ops on web or if the device doesn't support haptics.
 *
 * iOS requires `selectionStart()` before `selectionChanged()` will produce any
 * feedback — the native UISelectionFeedbackGenerator is only created on start,
 * so calling `selectionChanged()` alone is a silent no-op.
 */
export function isHapticsSupported() {
  return Capacitor.isNativePlatform();
}

/** Prepares the selection feedback generator — call once when a scroll gesture begins. */
export async function hapticSelectionStart() {
  if (!isHapticsSupported()) return;
  try {
    await Haptics.selectionStart();
  } catch {
    // Haptics unsupported on this device — ignore.
  }
}

/** Ticks a light haptic pulse — call each time a scrolled value changes. */
export async function hapticSelectionChanged() {
  if (!isHapticsSupported()) return;
  try {
    await Haptics.selectionChanged();
  } catch {
    // Haptics unsupported on this device — ignore.
  }
}

/** Releases the selection feedback generator — call once when the wheel settles. */
export async function hapticSelectionEnd() {
  if (!isHapticsSupported()) return;
  try {
    await Haptics.selectionEnd();
  } catch {
    // Haptics unsupported on this device — ignore.
  }
}
