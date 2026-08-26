"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DAYS, type Exercise } from "@/lib/types";
import LineChart, { type ChartPoint } from "./LineChart";

export default function ProgressPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [points, setPoints] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("exercises")
        .select("*")
        .order("day_key", { ascending: true })
        .order("order_index", { ascending: true });
      const list = data ?? [];
      setExercises(list);
      if (list.length > 0) setSelectedId(list[0].id);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (selectedId === null) return;
    const load = async () => {
      const { data } = await supabase
        .from("workout_logs")
        .select("logged_date, weight, reps, set_number")
        .eq("exercise_id", selectedId)
        .not("weight", "is", null)
        .order("logged_date", { ascending: true })
        .order("set_number", { ascending: true });

      const byDate = new Map<string, { weight: number; reps: number | null }>();
      for (const row of data ?? []) {
        const existing = byDate.get(row.logged_date);
        if (!existing || (row.weight ?? 0) > existing.weight) {
          byDate.set(row.logged_date, { weight: row.weight, reps: row.reps });
        }
      }
      const chartPoints: ChartPoint[] = Array.from(byDate.entries()).map(([date, v]) => ({
        date,
        weight: v.weight,
        reps: v.reps,
      }));
      setPoints(chartPoints);
    };
    load();
  }, [selectedId]);

  const grouped = useMemo(() => {
    return DAYS.map((day) => ({
      day,
      exercises: exercises.filter((e) => e.day_key === day.key),
    }));
  }, [exercises]);

  const selectedExercise = exercises.find((e) => e.id === selectedId);

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black min-h-screen">
      <main className="flex w-full max-w-md flex-col gap-4 px-4 py-8">
        <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400">
          &larr; Back
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Progress</h1>

        {loading && <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>}

        {!loading && (
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            {grouped.map(({ day, exercises: dayExercises }) =>
              dayExercises.length > 0 ? (
                <optgroup key={day.key} label={day.label}>
                  {dayExercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </optgroup>
              ) : null
            )}
          </select>
        )}

        {!loading && selectedExercise && (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
              {selectedExercise.name}
            </h2>
            {points.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No logged weight yet for this exercise.
              </p>
            ) : (
              <LineChart data={points} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
