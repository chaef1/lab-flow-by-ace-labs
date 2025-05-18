
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Calculate days between two dates
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const diffDays = Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
  return diffDays;
}

// Format date to relative time (e.g., "2 days ago", "in 3 days")
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const days = daysBetween(date, today);
  
  if (date < today) {
    return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
  } else {
    return days === 0 ? "Today" : days === 1 ? "Tomorrow" : `in ${days} days`;
  }
}
