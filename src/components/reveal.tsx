"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Reveals its content as it scrolls into view (see the `.reveal` rules in
 * globals.css). A single module-level IntersectionObserver serves every Reveal
 * on the page, so a grid of cards costs one observer, not one per card.
 *
 * Without JS nothing ever registers and the CSS leaves the content visible, so
 * this only ever adds motion — it can't hide content.
 */

let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === "undefined") return null;
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.reveal = "in";
        // Reveal once — re-animating on every scroll-by is noise, not polish.
        observer?.unobserve(entry.target);
      }
    },
    // Fire a little before the element is fully on screen, and don't wait for
    // tall sections (a full-height hero never reaches a high threshold).
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
  );
  return observer;
}

export function Reveal({
  as: Tag = "div",
  delay = 0,
  y,
  className = "",
  children,
}: {
  /** Element to render — use "li" inside a <ul>, "section" for a landmark, … */
  as?: ElementType;
  /** Stagger offset in ms; pass `index * 70` across a grid. */
  delay?: number;
  /** Distance travelled on entry, e.g. "0.75rem" for small items. */
  y?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = getObserver();
    if (!io) {
      // No IntersectionObserver (very old browser): show it immediately.
      el.dataset.reveal = "in";
      return;
    }
    io.observe(el);
    return () => io.unobserve(el);
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={
        {
          "--reveal-delay": `${delay}ms`,
          ...(y ? { "--reveal-y": y } : {}),
        } as React.CSSProperties
      }
    >
      {children}
    </Tag>
  );
}
