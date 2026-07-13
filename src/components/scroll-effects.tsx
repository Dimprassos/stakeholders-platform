"use client";

import { useEffect, useRef } from "react";
import { PUBLIC_THEME_ROOT_ID } from "@/lib/site-themes";

/**
 * Two scroll-driven touches on the public site:
 *   - a reading-progress bar pinned to the very top of the viewport;
 *   - `data-scrolled` on the sticky header, which condenses it (globals.css).
 *
 * Reads are batched into one rAF frame so the scroll listener stays cheap.
 */
export function ScrollEffects() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const header = document
      .getElementById(PUBLIC_THEME_ROOT_ID)
      ?.querySelector(":scope > header");
    let frame = 0;

    const update = () => {
      frame = 0;
      const scrolled = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(scrolled / max, 1) : 0;
      barRef.current?.style.setProperty("--scroll-progress", String(progress));
      if (header instanceof HTMLElement) {
        header.dataset.scrolled = scrolled > 8 ? "true" : "false";
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={barRef} className="scroll-progress" aria-hidden />;
}
