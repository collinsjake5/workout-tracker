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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editReps, setEditReps] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

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

  const startEdit = (log: LogRow) => {
    setEditingId(log.id);
    setEditWeight(log.weight?.toString() ?? "");
    setEditReps(log.reps?.toString() ?? "");
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: number) => {
    setBusyId(id);
    const { error } = await supabase
      .from("workout_logs")
      .update({
        weight: editWeight === "" ? null : Number(editWeight),
        reps: editReps === "" ? null : Number(editReps),
      })
      .eq("id", id);
    setBusyId(null);
    if (!error) {
      setLogs((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                weight: editWeight === "" ? null : Number(editWeight),
                reps: editReps === "" ? null : Number(editReps),
              }
            : l
        )
      );
      setEditingId(null);
    }
  };

  const deleteLog = async (id: number) => {
    if (!window.confirm("Delete this set?")) return;
    setBusyId(id);
    const { error } = await supabase.from("workout_logs").delete().eq("id", id);
    setBusyId(null);
    if (!error) {
      setLogs((prev) => prev.filter((l) => l.id !== id));
    }
  };

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
                    className="flex items-center justify-between gap-2 py-1 text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {log.exercises?.name ?? "Exercise"}{" "}
                      <span className="text-zinc-400">set {log.set_number}</span>
                    </span>

                    {editingId === log.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          inputMode="decimal"
                          value={editWeight}
                          onChange={(e) => setEditWeight(e.target.value)}
                          className="w-14 rounded-md border border-zinc-300 bg-transparent px-1 py-0.5 text-sm dark:border-zinc-700"
                        />
                        <input
                          type="number"
                          inputMode="numeric"
                          value={editReps}
                          onChange={(e) => setEditReps(e.target.value)}
                          className="w-14 rounded-md border border-zinc-300 bg-transparent px-1 py-0.5 text-sm dark:border-zinc-700"
                        />
                        <button
                          onClick={() => saveEdit(log.id)}
                          disabled={busyId === log.id}
                          className="rounded-md bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-xs text-zinc-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap">
                          {log.weight ?? "-"}lb x {log.reps ?? "-"}
                        </span>
                        <button
                          onClick={() => startEdit(log)}
                          className="text-xs text-zinc-400 underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteLog(log.id)}
                          disabled={busyId === log.id}
                          className="text-xs text-red-500 underline"
                        >
                          Delete
                        </button>
                      </div>
                    )}
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
