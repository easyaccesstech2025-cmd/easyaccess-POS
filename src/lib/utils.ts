import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Philippine Peso currency.
 * Pure algorithm — no locale dependency.
 * Examples: formatPrice(1250) => "1,250.00", formatPrice(-0.5) => "-0.50"
 */
export function formatPrice(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const fixed = abs.toFixed(2);
  const [intPart, fracPart] = fixed.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${isNegative ? "-" : ""}${withCommas}.${fracPart}`;
}

/**
 * Format a number as Philippine Peso with currency symbol.
 */
export function formatPeso(amount: number): string {
  return `₱${formatPrice(amount)}`;
}

/**
 * Format a timestamp (ms) to a readable date string.
 */
export function formatDate(ms: number, options?: Intl.DateTimeFormatOptions): string {
  if (!ms) return "—";
  const date = new Date(ms);
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

/**
 * Format a timestamp (ms) to date and time.
 */
export function formatDateTime(ms: number): string {
  if (!ms) return "—";
  const date = new Date(ms);
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Get date filter range in milliseconds.
 */
export function getDateRange(filter: DateFilterType): { start: number; end: number } {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const end = endOfDay.getTime();

  switch (filter) {
    case "TODAY": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return { start, end };
    }
    case "YESTERDAY": {
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      return {
        start: yesterday.getTime(),
        end: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999).getTime(),
      };
    }
    case "THIS_WEEK": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(now.getFullYear(), now.getMonth(), diff).getTime();
      return { start, end };
    }
    case "THIS_MONTH": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return { start, end };
    }
    case "THIS_YEAR": {
      const start = new Date(now.getFullYear(), 0, 1).getTime();
      return { start, end };
    }
    case "ALL_TIME":
      return { start: 0, end };
    default:
      return { start: 0, end };
  }
}

export type DateFilterType = "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_YEAR" | "ALL_TIME" | "CUSTOM";
