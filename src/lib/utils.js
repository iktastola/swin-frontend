import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatSeconds(seconds) {
  const value = Number(seconds);
  if (seconds === null || seconds === undefined || seconds === "" || !Number.isFinite(value) || value <= 0) {
    return "—";
  }

  const mins = Math.floor(value / 60);
  const secs = Math.floor(value % 60);
  const millis = Math.round((value - Math.floor(value)) * 1000);

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}
