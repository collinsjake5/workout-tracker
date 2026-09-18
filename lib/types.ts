export type DayKey = "push" | "pull" | "lower" | "upper";

export interface Exercise {
  id: number;
  day_key: DayKey;
  order_index: number;
  name: string;
  target_sets: number;
  target_reps: string;
  cue: string | null;
  bodyweight: boolean;
  archived: boolean;
}

/** Plank-style targets ('45-60s') are held for time, so the rep box means seconds. */
export const isTimed = (targetReps: string) => /\d\s*s$/.test(targetReps);

export interface WorkoutLog {
  id: number;
  exercise_id: number;
  logged_date: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  notes: string | null;
  created_at: string;
}

export const DAYS: { key: DayKey; label: string; weekday: number }[] = [
  { key: "push", label: "Push", weekday: 1 },
  { key: "pull", label: "Pull", weekday: 2 },
  { key: "lower", label: "Lower + Core", weekday: 4 },
  { key: "upper", label: "Full Upper", weekday: 5 },
];
