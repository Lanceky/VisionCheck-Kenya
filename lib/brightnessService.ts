/**
 * brightnessService.ts
 * ---------------------
 * Locks screen brightness to 100 % before vision tests begin and
 * restores the user's original brightness when the test ends.
 *
 * ─── Why this matters ───────────────────────────────────────────
 * Low screen brightness reduces contrast of Snellen letters, making
 * them harder to read and artificially worsening acuity scores.
 * Clinical light-boxes run at a standardised 120 cd/m². We can't
 * control cd/m² on every phone, but maxing the backlight gets us
 * as close as possible to repeatable contrast conditions.
 */

import * as Brightness from 'expo-brightness';
import { Platform } from 'react-native';

let _originalBrightness: number | null = null;

/**
 * Save the current brightness and push it to 100 %.
 * Returns `true` if brightness was successfully locked.
 */
export async function lockMaxBrightness(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      const { status } = await Brightness.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[Brightness] Permission denied');
        return false;
      }
    }

    _originalBrightness = await Brightness.getBrightnessAsync();
    await Brightness.setBrightnessAsync(1.0);
    return true;
  } catch (err) {
    console.warn('[Brightness] Could not lock:', err);
    return false;
  }
}

/**
 * Restore the brightness that was active before `lockMaxBrightness()`.
 */
export async function restoreBrightness(): Promise<void> {
  try {
    if (_originalBrightness !== null) {
      await Brightness.setBrightnessAsync(_originalBrightness);
      _originalBrightness = null;
    }
  } catch (err) {
    console.warn('[Brightness] Could not restore:', err);
  }
}
