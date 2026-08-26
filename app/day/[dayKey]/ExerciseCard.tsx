"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Exercise } from "@/lib/types";

interface SetInput {
  weight: string;
  reps: string;
  saved: boolean;
}

const todayIso = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

export default function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const [sets, setSets] = useState<SetInput[]>(
    Array.from({ length: exercise.target_sets }, () => ({
      weight: "",
      reps: "",
      saved: false,
    }))
  );
  const [lastPerformance, setLastPerformance] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    const loadExisting = async () => {
      const today = todayIso();

      // Prefill any sets already logged today
      const { data: todayLogs } = await supabase
        .from("workout_logs")
        .select("set_number, weight, reps")
        .eq("exercise_id", exercise.id)
        .eq("logged_date", today);

      if (todayLogs && todayLogs.length > 0) {
        setSets((prev) =>
          prev.map((s, i) => {
            const match = todayLogs.find((l) => l.set_number === i + 1);
            return match
              ? {
                  weight: match.weight?.toString() ?? "",
                  reps: match.reps?.toString() ?? "",
                  saved: true,
                }
              : s;
          })
        );
      }

      // Show the most recent prior session's top set as a reference
      const { data: lastLog } = await supabase
        .from("workout_logs")
        .select("weight, reps, logged_date")
        .eq("exercise_id", exercise.id)
        .lt("logged_date", today)
        .order("logged_date", { ascending: false })
        .order("set_number", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (lastLog) {
        setLastPerformance(`${lastLog.weight ?? "?"}lb x ${lastLog.reps ?? "?"}`);
      }
    };

    loadExisting();
  }, [exercise.id]);

  const updateSet = (index: number, field: "weight" | "reps", value: string) => {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value, saved: false } : s))
    );
  };

  const saveSet = async (index: number) => {
    const set = sets[index];
    if (set.weight === "" && set.reps === "") return;

    setSaving(index);
    const { error } = await supabase.from("workout_logs").upsert(
      {
        exercise_id: exercise.id,
        logged_date: todayIso(),
        set_number: index + 1,
        weight: set.weight === "" ? null : Number(set.weight),
        reps: set.reps === "" ? null : Number(set.reps),
      },
      { onConflict: "exercise_id,logged_date,set_number" }
    );
    setSaving(null);

    if (!error) {
      setSets((prev) => prev.map((s, i) => (i === index ? { ...s, saved: true } : s)));
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">{exercise.name}</h2>
        <span className="whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
          {exercise.target_sets}x{exercise.target_reps}
        </span>
      </div>
      {exercise.cue && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{exercise.cue}</p>
      )}
      {lastPerformance && (
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Last time: {lastPerformance}
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {sets.map((set, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-10 text-xs text-zinc-500 dark:text-zinc-400">
              Set {i + 1}
            </span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="lb"
              value={set.weight}
              onChange={(e) => updateSet(i, "weight", e.target.value)}
              className="w-16 rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="reps"
              value={set.reps}
              onChange={(e) => updateSet(i, "reps", e.target.value)}
              className="w-16 rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
            />
            <button
              onClick={() => saveSet(i)}
              disabled={saving === i}
              className={`ml-auto rounded-md px-3 py-1 text-xs font-medium ${
                set.saved
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                  : "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
              }`}
            >
              {saving === i ? "..." : set.saved ? "Saved" : "Log"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
