import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  const inrValue = value * 83.5;

  if (inrValue >= 10000000) {
    return `₹${(inrValue / 10000000).toFixed(1)}Cr`
  } else if (inrValue >= 100000) {
    return `₹${(inrValue / 100000).toFixed(1)}L`
  } else if (inrValue >= 1000) {
    return `₹${(inrValue / 1000).toFixed(1)}K`
  } else {
    return `₹${inrValue.toFixed(0)}`
  }
}