"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { DAYS } from "@/lib/types";

const noopSubscribe = () => () => {};
const getTodayWeekday = () => new Date().getDay();
const getServerWeekday = () => null;

export default function Home() {
  const todayWeekday = useSyncExternalStore(noopSubscribe, getTodayWeekday, getServerWeekday);

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black min-h-screen">
      <main className="flex w-full max-w-md flex-col gap-4 px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Home Gym Workouts
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Dumbbells + bodyweight, upper/lower split
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {DAYS.map((day) => {
            const isToday = day.weekday === todayWeekday;
            return (
              <Link
                key={day.key}
                href={`/day/${day.key}`}
                className={`flex items-center justify-between rounded-xl border px-4 py-4 shadow-sm transition-colors ${
                  isToday
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                    : "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                }`}
              >
                <div>
                  <div className="font-semibold">{day.label}</div>
                  {isToday && <div className="text-xs opacity-80">Today</div>}
                </div>
                <span aria-hidden>&rarr;</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center gap-4 text-sm font-medium">
          <Link
            href="/history"
            className="text-zinc-500 underline dark:text-zinc-400"
          >
            History
          </Link>
          <Link
            href="/progress"
            className="text-zinc-500 underline dark:text-zinc-400"
          >
            Progress
          </Link>
        </div>
      </main>
    </div>
  );
}
