/**
 * Color Utilities
 * Functions for color manipulation
 */

/**
 * Lightens a hex color by a specified percentage
 * @param hexColor - Hex color string (e.g., "#3b82f6" or "3b82f6")
 * @param percent - Percentage to lighten (0-100). Default is 30.
 * @returns Lightened hex color
 */
export function lightenColor(hexColor: string, percent: number = 30): string {
  // Remove # if present
  const hex = hexColor.replace(/^#/, '');

  // Parse RGB components
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate lightened values (move towards 255)
  const lightenAmount = percent / 100;
  const newR = Math.round(r + (255 - r) * lightenAmount);
  const newG = Math.round(g + (255 - g) * lightenAmount);
  const newB = Math.round(b + (255 - b) * lightenAmount);

  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Darkens a hex color by a specified percentage
 * @param hexColor - Hex color string (e.g., "#3b82f6" or "3b82f6")
 * @param percent - Percentage to darken (0-100). Default is 30.
 * @returns Darkened hex color
 */
export function darkenColor(hexColor: string, percent: number = 30): string {
  // Remove # if present
  const hex = hexColor.replace(/^#/, '');

  // Parse RGB components
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate darkened values (move towards 0)
  const darkenAmount = percent / 100;
  const newR = Math.round(r * (1 - darkenAmount));
  const newG = Math.round(g * (1 - darkenAmount));
  const newB = Math.round(b * (1 - darkenAmount));

  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}
