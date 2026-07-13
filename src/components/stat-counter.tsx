"use client";

import { useEffect, useRef } from "react";

/**
 * A number that counts up the first time it scrolls into view.
 *
 * The final value is rendered on the server, so it's correct for crawlers and
 * for visitors without JS. The count-up then drives the text node directly
 * rather than through state: the figure never changes after mount, so this is
 * an animation on an external system (the DOM), not React state to sync.
 */
export function StatCounter({
  value,
  label,
  duration = 1100,
}: {
  value: number;
  label: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || value === 0 || typeof IntersectionObserver === "undefined") return;

    let frame = 0;
    let start = 0;

    const step = (now: number) => {
      start ||= now;
      const t = Math.min((now - start) / duration, 1);
      // easeOutExpo — quick off the line, gently settling on the final figure.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      el.textContent = String(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        io.disconnect();
        el.textContent = "0";
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (frame) cancelAnimationFrame(frame);
      // Leave the true figure behind if we unmount mid-animation.
      el.textContent = String(value);
    };
  }, [value, duration]);

  return (
    <div>
      <p className="text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl">
        <span ref={ref}>{value}</span>
      </p>
      <p className="mt-1 text-xs font-medium uppercase tracking-widest text-zinc-500">
        {label}
      </p>
    </div>
  );
}
