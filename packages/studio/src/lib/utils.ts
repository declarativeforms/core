import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  const timestamp = date.getTime()

  if (Number.isNaN(timestamp)) {
    return "just now"
  }

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))

  if (seconds < 45) {
    return "just now"
  }

  if (seconds < 60 * 60) {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
  }

  if (seconds < 60 * 60 * 24) {
    const hours = Math.floor(seconds / (60 * 60))
    return `${hours} hour${hours === 1 ? "" : "s"} ago`
  }

  if (seconds < 60 * 60 * 24 * 7) {
    const days = Math.floor(seconds / (60 * 60 * 24))
    return `${days} day${days === 1 ? "" : "s"} ago`
  }

  if (seconds < 60 * 60 * 24 * 30) {
    const weeks = Math.floor(seconds / (60 * 60 * 24 * 7))
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`
  }

  if (seconds < 60 * 60 * 24 * 365) {
    const months = Math.floor(seconds / (60 * 60 * 24 * 30))
    return `${months} month${months === 1 ? "" : "s"} ago`
  }

  const years = Math.floor(seconds / (60 * 60 * 24 * 365))
  return `${years} year${years === 1 ? "" : "s"} ago`
}
