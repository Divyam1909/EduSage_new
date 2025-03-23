import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export const getInitials = (name: string) =>
  name.split(" ").map((word) => word[0]).join("")

// Level configuration
export const LEVELS = [
  { name: "Novice", threshold: 1000 },
  { name: "Adept", threshold: 2500 },
  { name: "Sage", threshold: 4000 },
  { name: "Expert", threshold: 5500 },
  { name: "Master", threshold: 7000 },
]

// Calculate level info based on experience points
export const calculateLevel = (experience: number) => {
  let levelName = LEVELS[0].name
  let progress = 0
  let levelNumber = 1

  for (let i = 0; i < LEVELS.length; i++) {
    if (experience < LEVELS[i].threshold) {
      if (i === 0) {
        progress = (experience / LEVELS[i].threshold) * 100
        levelName = LEVELS[i].name
        levelNumber = 1
      } else {
        const prevThreshold = LEVELS[i - 1].threshold
        const range = LEVELS[i].threshold - prevThreshold
        progress = ((experience - prevThreshold) / range) * 100
        levelName = LEVELS[i].name
        levelNumber = i + 1
      }
      break
    } else if (i === LEVELS.length - 1) {
      // If experience exceeds the highest threshold, cap progress at 100%
      progress = 100
      levelName = LEVELS[i].name
      levelNumber = i + 1
    }
  }
  return { levelName, progress, levelNumber }
}
