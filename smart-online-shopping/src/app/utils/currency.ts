/**
 * Currency utility functions for the Smart Online Shopping application
 * Uses South African Rand (ZAR) as the default currency
 */

/**
 * Formats a price value in South African Rands
 * @param price - The price value to format
 * @returns Formatted price string with ZAR currency symbol
 * @example formatPrice(1299.99) => "R 1,299.99"
 */
export function formatPrice(price: number): string {
  return `R ${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/**
 * Formats a price value in South African Rands without decimal places
 * Useful for whole number prices
 * @param price - The price value to format
 * @returns Formatted price string without decimals
 * @example formatPriceWhole(1299) => "R 1,299"
 */
export function formatPriceWhole(price: number): string {
  return `R ${Math.round(price).toLocaleString('en-ZA')}`;
}

/**
 * Currency symbol for South African Rand
 */
export const CURRENCY_SYMBOL = "R";

/**
 * Currency code for South African Rand
 */
export const CURRENCY_CODE = "ZAR";

/**
 * Currency name
 */
export const CURRENCY_NAME = "South African Rand";
