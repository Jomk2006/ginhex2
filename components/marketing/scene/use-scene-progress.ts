"use client";

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import type { SceneProgress } from "./honeycomb-scene";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Turns native scroll position into scene progress. It only READS scroll
 * (passive listener, rAF-throttled) — it never moves it.
 *  - "hero":    p = how far the hero has scrolled away (0..1)
 *  - "journey": asm = how far the section has entered the viewport,
 *               p = progress through the sticky track (0..1)
 */
export function useSceneProgress(
  kind: "hero" | "journey",
  trackRef: RefObject<HTMLElement | null>,
  onStep?: (step: number) => void
): MutableRefObject<SceneProgress> {
  const progress = useRef<SceneProgress>({ p: 0, asm: kind === "hero" ? 1 : 0 });
  const stepCb = useRef(onStep);
  useEffect(() => {
    stepCb.current = onStep;
  });

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    let lastStep = -1;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      let p: number;
      let asm = 1;
      if (kind === "hero") {
        p = clamp01(-rect.top / Math.max(1, rect.height));
      } else {
        asm = clamp01((vh - rect.top) / (vh * 0.85));
        p = clamp01(-rect.top / Math.max(1, rect.height - vh));
        el.style.setProperty("--p", p.toFixed(4));
        const step = Math.min(3, Math.round(p * 3));
        if (step !== lastStep) {
          lastStep = step;
          stepCb.current?.(step);
        }
      }
      progress.current.p = p;
      progress.current.asm = asm;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [kind, trackRef]);

  return progress;
}
