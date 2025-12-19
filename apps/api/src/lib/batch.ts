/**
 * Batch utility functions for Trigger.dev operations
 * Helpers for chunking arrays to respect Trigger.dev batch limits
 */

/**
 * Chunk an array into smaller arrays of a specified size
 * Used to batch trigger calls within Trigger.dev limits (500 tasks per batchTrigger)
 *
 * @param array - The array to chunk
 * @param chunkSize - The maximum size of each chunk
 * @returns An array of chunks
 *
 * @example
 * const items = [1, 2, 3, 4, 5, 6];
 * const chunks = chunkArray(items, 2);
 * // Returns: [[1, 2], [3, 4], [5, 6]]
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
