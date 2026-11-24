"use client";

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import type { SceneProgress } from "./honeycomb-scene";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const EPS = 5e-4;

/**
 * Turns native scroll position into scene progress. It only READS scroll
 * (passive listener, rAF-throttled) — it never moves it.
 *  - "hero":    p = how far the hero has scrolled away (0..1)
 *  - "journey": asm = how far the section has entered the viewport,
 *               p = progress through the sticky track (0..1)
 *
 * No layout reads while scrolling: the track's document offset/height are cached and only
 * refreshed from a ResizeObserver; the scroll listener is attached only while the track is
 * near the viewport (IntersectionObserver), and writes are skipped when nothing moved.
 */
export function useSceneProgress(
  kind: "hero" | "journey",
  trackRef: RefObject<HTMLElement | null>,
  onStep?: (step: number) => void
): MutableRefObject<SceneProgress> {
  const progress = useRef<SceneProgress>({ p: 0, asm: kind === "hero" ? 1 : 0, wake: null });
  const stepCb = useRef(onStep);
  useEffect(() => {
    stepCb.current = onStep;
  });

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const fill = kind === "journey" ? el.querySelector<HTMLElement>(".journey-bar-fill") : null;

    let raf = 0;
    let lastStep = -1;
    let top = 0; // document offset of the track
    let height = 1;
    let vh = window.innerHeight || 1;
    let lastP = -1;
    let lastAsm = -1;
    let lastFill = -1;
    let attached = false;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      top = rect.top + window.scrollY;
      height = Math.max(1, rect.height);
      vh = window.innerHeight || 1;
    };

    const update = () => {
      raf = 0;
      const rel = top - window.scrollY; // == rect.top, from cached values
      let p: number;
      let asm = 1;
      if (kind === "hero") {
        p = clamp01(-rel / height);
      } else {
        asm = clamp01((vh - rel) / (vh * 0.85));
        p = clamp01(-rel / Math.max(1, height - vh));
        if (fill && Math.abs(p - lastFill) > 0.002) {
          lastFill = p;
          fill.style.transform = `scaleX(${p.toFixed(4)})`;
        }
        const step = Math.min(3, Math.round(p * 3));
        if (step !== lastStep) {
          lastStep = step;
          stepCb.current?.(step);
        }
      }
      if (Math.abs(p - lastP) < EPS && Math.abs(asm - lastAsm) < EPS) return;
      lastP = p;
      lastAsm = asm;
      progress.current.p = p;
      progress.current.asm = asm;
      progress.current.wake?.();
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const attach = () => {
      if (attached) return;
      attached = true;
      measure();
      update();
      window.addEventListener("scroll", onScroll, { passive: true });
    };
    const detach = () => {
      if (!attached) return;
      attached = false;
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      update(); // settle on the final value (section is off-screen, so this is cheap)
    };

    measure();
    update();

    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? attach() : detach()),
      { rootMargin: "100% 0px 100% 0px" }
    );
    io.observe(el);

    // Layout above/inside the track can change (fonts, images, breakpoint): re-cache, never per scroll.
    const ro = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    ro.observe(el);
    ro.observe(document.body);
    window.addEventListener("resize", onScroll);

    return () => {
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [kind, trackRef]);

  return progress;
}
