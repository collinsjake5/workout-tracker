"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface LogRow {
  id: number;
  logged_date: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  exercises: { name: string } | null;
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("workout_logs")
        .select("id, logged_date, set_number, weight, reps, exercises(name)")
        .order("logged_date", { ascending: false })
        .order("set_number", { ascending: true })
        .limit(300);
      setLogs((data as unknown as LogRow[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const grouped = logs.reduce<Record<string, LogRow[]>>((acc, log) => {
    (acc[log.logged_date] ??= []).push(log);
    return acc;
  }, {});

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black min-h-screen">
      <main className="flex w-full max-w-md flex-col gap-4 px-4 py-8">
        <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400">
          &larr; Back
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">History</h1>

        {loading && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
        )}

        {!loading && Object.keys(grouped).length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No logged sets yet. Go log a workout.
          </p>
        )}

        <div className="flex flex-col gap-5">
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {new Date(date + "T00:00:00").toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </h2>
              <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                {entries.map((log) => (
                  <div
                    key={log.id}
                    className="flex justify-between text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    <span>
                      {log.exercises?.name ?? "Exercise"}{" "}
                      <span className="text-zinc-400">set {log.set_number}</span>
                    </span>
                    <span>
                      {log.weight ?? "-"}lb x {log.reps ?? "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
