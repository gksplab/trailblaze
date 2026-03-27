import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDistance(km: number, unit: 'km' | 'miles'): string {
  if (unit === 'miles') {
    return `${(km * 0.621371).toFixed(1)} mi`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Calculate the current daily streak from an array of log objects.
 * Each log must have a `date` string (YYYY-MM-DD).
 * Returns { current, longest }.
 */
export function calculateStreak(logs: { date: string }[]): { current: number; longest: number } {
  if (logs.length === 0) return { current: 0, longest: 0 };

  // Get unique sorted dates (newest first)
  const uniqueDays = [...new Set(logs.map(l => l.date))].sort().reverse();

  // Check if the streak includes today or yesterday (still alive)
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let current = 0;
  let longest = 0;
  let streak = 0;

  // Walk through dates chronologically (oldest first)
  const sorted = [...uniqueDays].reverse();
  let prev: Date | null = null;
  for (const d of sorted) {
    const date = new Date(d + 'T00:00:00');
    if (prev) {
      const diff = (date.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 1) {
        streak++;
      } else {
        streak = 1;
      }
    } else {
      streak = 1;
    }
    longest = Math.max(longest, streak);
    prev = date;
  }

  // Current streak: count backwards from the most recent day,
  // but only if the most recent day is today or yesterday
  if (uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr) {
    current = 1;
    for (let i = 0; i < uniqueDays.length - 1; i++) {
      const a = new Date(uniqueDays[i] + 'T00:00:00');
      const b = new Date(uniqueDays[i + 1] + 'T00:00:00');
      const diff = (a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 1) {
        current++;
      } else {
        break;
      }
    }
  }

  return { current, longest };
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
