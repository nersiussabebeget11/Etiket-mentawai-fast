import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toTitleCase(str: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());
}
