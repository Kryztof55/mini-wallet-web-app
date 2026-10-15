/**
 * Completion marker (TS-04 §8): set when a transfer succeeds, so browser Back from the receipt
 * into the flow lands on Home instead of a half-empty step (AC-CONF-11). Cleared when the user
 * starts a new transfer on purpose. Storage can be unavailable; then Back simply restarts the
 * flow at step 1, which is still safe.
 */
const KEY = 'mw.transfer.completed';

export function markTransferCompleted(): void {
  try {
    window.sessionStorage.setItem(KEY, '1');
  } catch {
    // Private mode or blocked storage: degrade to the step guard's normal behavior.
  }
}

export function hasTransferCompleted(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function clearTransferCompleted(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
