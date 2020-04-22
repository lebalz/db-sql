/**
 * @param ts array with potentially `undefined` members
 * @returns array without `undefined` values.
 */
export function rejectUndefined<T>(ts: (T | undefined)[]): T[] {
  return ts.filter((t: T | undefined): t is T => t !== undefined);
}