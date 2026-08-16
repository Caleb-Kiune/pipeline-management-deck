import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMonthYear(dateString: string) {
  if (!dateString) return "";
  try {
    const [year, month] = dateString.split('-');
    if (!year || !month) return dateString;
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase();
  } catch (e) {
    return dateString;
  }
}
