"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DAYS, type DayKey, type Exercise } from "@/lib/types";
import ExerciseCard from "./ExerciseCard";

export default function DayPage() {
  const params = useParams<{ dayKey: string }>();
  const dayKey = params.dayKey as DayKey;
  const day = DAYS.find((d) => d.key === dayKey);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("exercises")
        .select("*")
        .eq("day_key", dayKey)
        .order("order_index", { ascending: true });
      setExercises(data ?? []);
      setLoading(false);
    };
    load();
  }, [dayKey]);

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black min-h-screen">
      <main className="flex w-full max-w-md flex-col gap-4 px-4 py-8">
        <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400">
          &larr; Back
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {day?.label ?? dayKey}
        </h1>

        {loading && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
        )}

        {!loading && exercises.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No exercises found. Did you run supabase/schema.sql?
          </p>
        )}

        <div className="flex flex-col gap-3">
          {exercises.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} />
          ))}
        </div>
      </main>
    </div>
  );
}
