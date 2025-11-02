import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { exchangeRateManager } from "./exchangeRate"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * USD to INR conversion rate (FALLBACK ONLY)
 * Actual rate is fetched dynamically from API via exchangeRateManager
 * This is only used if API is unavailable
 * Last updated: November 2024 - 1 USD = 89 INR
 */
export const USD_TO_INR_RATE = 89;

/**
 * Convert USD amount to INR using live exchange rate
 * @param usdAmount - Amount in USD
 * @returns Amount in INR
 */
export function convertUSDtoINR(usdAmount: number): number {
  // Use dynamic rate from API, fallback to constant if not initialized
  const rate = exchangeRateManager.getRate();
  return usdAmount * rate;
}

/**
 * Format INR amount with Indian numbering system (Cr, L, K)
 * @param inrAmount - Amount in INR
 * @returns Formatted string like ₹5.2Cr, ₹12.5L, ₹50K
 */
export function formatINR(inrAmount: number): string {
  if (!inrAmount && inrAmount !== 0) return '₹0';
  
  const absAmount = Math.abs(inrAmount);
  
  if (absAmount >= 10000000) {
    return `₹${(inrAmount / 10000000).toFixed(2)}Cr`;
  } else if (absAmount >= 100000) {
    return `₹${(inrAmount / 100000).toFixed(2)}L`;
  } else if (absAmount >= 1000) {
    return `₹${(inrAmount / 1000).toFixed(2)}K`;
  } else {
    return `₹${inrAmount.toFixed(0)}`;
  }
}

/**
 * Convert USD to INR and format with Indian numbering system
 * @param usdAmount - Amount in USD
 * @returns Formatted INR string
 */
export function formatUSDasINR(usdAmount: number): string {
  if (!usdAmount && usdAmount !== 0) return '₹0';
  const inrAmount = convertUSDtoINR(usdAmount);
  return formatINR(inrAmount);
}

/**
 * Format currency (assumes input is in USD, converts to INR)
 * Legacy function - kept for backward compatibility
 * @param value - Amount in USD
 * @returns Formatted INR string
 */
export function formatCurrency(value: number): string {
  return formatUSDasINR(value);
}