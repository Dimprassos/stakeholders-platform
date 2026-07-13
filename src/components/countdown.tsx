"use client";

import { useEffect, useState } from "react";

/**
 * Live countdown to the event's first day — the one element that makes the
 * landing page feel like it's running rather than sitting still.
 *
 * The remaining time depends on the visitor's clock, so it can't be rendered on
 * the server without a hydration mismatch: it renders nothing until mounted and
 * fades in on the client.
 */

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

/** Dates are stored as `yyyy-mm-dd` (see lib/format.ts); treat them as UTC. */
function toDate(value: string): number {
  return new Date(value.includes("T") ? value : `${value}T00:00:00Z`).getTime();
}

function remainingUntil(target: number): Remaining | null {
  const ms = target - Date.now();
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor(totalSeconds / 3600) % 24,
    minutes: Math.floor(totalSeconds / 60) % 60,
    seconds: totalSeconds % 60,
  };
}

function Unit({ value, label }: { value: number; label: string }) {
  const text = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <span className="tabular-nums text-3xl font-semibold tracking-tight sm:text-4xl">
        {/* Keying on the value remounts the span, replaying the tick animation. */}
        <span key={text} className="tick">
          {text}
        </span>
      </span>
      <span className="mt-1 text-[0.625rem] font-medium uppercase tracking-widest text-zinc-500">
        {label}
      </span>
    </div>
  );
}

export function Countdown({
  startDate,
  endDate,
}: {
  /** ISO `yyyy-mm-dd` — the event's first day. */
  startDate: string;
  /** ISO `yyyy-mm-dd` — used to show "Happening now" while the event runs. */
  endDate?: string | null;
}) {
  const [remaining, setRemaining] = useState<Remaining | null>(null);
  const [phase, setPhase] = useState<"pending" | "counting" | "live" | "over">("pending");

  useEffect(() => {
    const start = toDate(startDate);
    if (Number.isNaN(start)) return;
    // The event runs through the whole of its last day.
    const end = endDate ? toDate(endDate) + 86400_000 : start + 86400_000;

    const tick = () => {
      const left = remainingUntil(start);
      if (left) {
        setRemaining(left);
        setPhase("counting");
        return;
      }
      setRemaining(null);
      setPhase(Date.now() < end ? "live" : "over");
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startDate, endDate]);

  if (phase === "pending" || phase === "over") return null;

  if (phase === "live") {
    return (
      <p className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/15">
        <span className="live-dot inline-block h-2 w-2 rounded-full bg-brand-accent" />
        Happening now
      </p>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-5 rounded-2xl border border-black/10 px-6 py-4 dark:border-white/15 sm:gap-7"
      role="timer"
      aria-live="off"
      aria-label={`${remaining!.days} days until the event`}
    >
      <Unit value={remaining!.days} label="Days" />
      <Unit value={remaining!.hours} label="Hours" />
      <Unit value={remaining!.minutes} label="Min" />
      <Unit value={remaining!.seconds} label="Sec" />
    </div>
  );
}
