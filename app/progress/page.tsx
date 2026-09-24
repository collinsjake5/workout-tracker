"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import { DAYS, isTimed, type DayKey, type Exercise } from "@/lib/types";
import LineChart, { type ChartPoint } from "./LineChart";

type PointsByExercise = Map<number, ChartPoint[]>;

const noopSubscribe = () => () => {};
const getTodayWeekday = () => new Date().getDay();
const getServerWeekday = () => null;

export default function ProgressPage() {
  const todayWeekday = useSyncExternalStore(noopSubscribe, getTodayWeekday, getServerWeekday);
  const [pickedDay, setPickedDay] = useState<DayKey | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [charts, setCharts] = useState<{ dayKey: DayKey; points: PointsByExercise } | null>(null);
  const [loading, setLoading] = useState(true);

  // Open on today's workout when it's a training day, until the user picks another.
  const activeDay =
    pickedDay ?? DAYS.find((d) => d.weekday === todayWeekday)?.key ?? DAYS[0].key;

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("exercises")
        .select("*")
        .order("day_key", { ascending: true })
        .order("order_index", { ascending: true });
      setExercises(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const dayExercises = useMemo(
    () => exercises.filter((e) => e.day_key === activeDay),
    [exercises, activeDay]
  );

  // One query per day covers every chart on the screen.
  useEffect(() => {
    if (dayExercises.length === 0) return;
    const bodyweightById = new Map(dayExercises.map((e) => [e.id, e.bodyweight]));
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from("workout_logs")
        .select("exercise_id, logged_date, weight, reps")
        .in("exercise_id", Array.from(bodyweightById.keys()))
        .order("logged_date", { ascending: true })
        .order("set_number", { ascending: true });
      if (cancelled) return;

      // Keep each day's best set, per exercise. Bodyweight moves have no weight
      // to track, so they chart reps (or seconds) instead.
      const best = new Map<number, Map<string, { value: number; reps: number | null }>>();
      for (const row of data ?? []) {
        const bodyweight = bodyweightById.get(row.exercise_id) ?? false;
        const value = bodyweight ? row.reps : row.weight;
        if (value == null) continue;
        let byDate = best.get(row.exercise_id);
        if (!byDate) {
          byDate = new Map();
          best.set(row.exercise_id, byDate);
        }
        const existing = byDate.get(row.logged_date);
        if (!existing || value > existing.value) {
          byDate.set(row.logged_date, { value, reps: bodyweight ? null : row.reps });
        }
      }

      // Rows arrive oldest-first, so Map insertion order is already chart order.
      const points: PointsByExercise = new Map();
      for (const [id, byDate] of best) {
        points.set(
          id,
          Array.from(byDate.entries()).map(([date, v]) => ({
            date,
            value: v.value,
            reps: v.reps,
          }))
        );
      }
      setCharts({ dayKey: activeDay, points });
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [dayExercises, activeDay]);

  // Tagging the fetch with its day lets a day switch fall straight back to loading.
  const points = charts?.dayKey === activeDay ? charts.points : null;
  const busy = loading || (dayExercises.length > 0 && points === null);

  // Retired moves stay on the page only while they still have history to show.
  const visible = dayExercises.filter(
    (e) => !e.archived || (points?.get(e.id)?.length ?? 0) > 0
  );

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black min-h-screen">
      <main className="flex w-full max-w-5xl flex-col gap-4 px-4 py-8">
        <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400">
          &larr; Back
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Progress</h1>

        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => {
            const isActive = day.key === activeDay;
            return (
              <button
                key={day.key}
                onClick={() => setPickedDay(day.key)}
                aria-pressed={isActive}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                    : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>

        {busy && <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>}

        {!busy && visible.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No exercises on this day yet.
          </p>
        )}

        {!busy && visible.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((ex) => {
              const exPoints = points?.get(ex.id) ?? [];
              const timed = isTimed(ex.target_reps);
              return (
                <div
                  key={ex.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <h2 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
                    {ex.name}
                    {ex.archived && (
                      <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                        retired
                      </span>
                    )}
                  </h2>
                  {exPoints.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No logged sets yet.
                    </p>
                  ) : ex.bodyweight ? (
                    <LineChart
                      data={exPoints}
                      unit={timed ? "s" : " reps"}
                      label={timed ? "Hold" : "Reps"}
                    />
                  ) : (
                    <LineChart data={exPoints} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
