import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize text for accent/Turkish-insensitive search matching.
 * Handles İ/ı dotted-i issue, strips combining diacritics, and maps
 * Turkish-specific chars to ASCII equivalents.
 * e.g. "İstanbul" → "istanbul", "Beyoğlu" → "beyoglu", "Şişli" → "sisli"
 */
export function turkishNormalize(text: string): string {
  return text
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u");
}

/**
 * Check if `text` contains `query` using Turkish/accent-insensitive matching.
 */
export function turkishIncludes(text: string, query: string): boolean {
  return turkishNormalize(text).includes(turkishNormalize(query));
}
