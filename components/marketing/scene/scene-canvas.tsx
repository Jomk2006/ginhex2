"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { getTier } from "./tier";
import type { SceneHandle, SceneMode, SceneProgress } from "./honeycomb-scene";

interface Props {
  mode: SceneMode;
  progress: MutableRefObject<SceneProgress>;
  side: 1 | -1;
  onReady: (ready: boolean) => void;
}

/**
 * Owns the WebGL lifetime. three.js is imported only when the canvas is near
 * the viewport; the renderer is disposed when it is far away; the loop runs
 * only while the canvas is actually visible and the tab is foregrounded.
 */
export default function SceneCanvas({ mode, progress, side, onReady }: Props) {
  const wrapRef = useRef<HTMLCanvasElement>(null);
  const [gen, setGen] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = wrapRef.current;
    if (!canvas) return;
    const tier = getTier();
    if (!tier.canRun) return; // static fallback stays

    let handle: SceneHandle | null = null;
    let loading = false;
    let near = false;
    let inView = false;
    let cancelled = false;
    let dead = false;

    const sync = () => {
      if (!handle) return;
      if (inView && !document.hidden) handle.start();
      else handle.stop();
    };

    const teardown = () => {
      if (!handle) return;
      handle.dispose();
      handle = null;
      setReady(false);
      onReady(false);
      setGen((g) => g + 1); // a disposed canvas cannot be reused: mount a fresh one
    };

    const build = async () => {
      if (handle || loading || dead) return;
      loading = true;
      try {
        const mod = await import("./honeycomb-scene");
        if (cancelled || !near || !canvas.isConnected) return;
        handle = mod.createScene({
          canvas,
          mode,
          rings: tier.rings,
          dpr: tier.dpr,
          antialias: tier.antialias,
          side,
          progress,
          onContextLost: () => {
            dead = true;
            teardown();
          },
        });
        setReady(true);
        onReady(true);
        sync();
      } catch {
        dead = true; // keep the static fallback
      } finally {
        loading = false;
      }
    };

    const nearIO = new IntersectionObserver(
      ([e]) => {
        near = e.isIntersecting;
        if (near) void build();
        else teardown();
      },
      { rootMargin: tier.mobile ? "35% 0px" : "70% 0px" }
    );
    const viewIO = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        sync();
      },
      { rootMargin: "0px" }
    );
    nearIO.observe(canvas);
    viewIO.observe(canvas);

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onMove = (e: PointerEvent) => {
      if (!handle || e.pointerType === "touch") return;
      handle.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", sync);

    return () => {
      cancelled = true;
      nearIO.disconnect();
      viewIO.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", sync);
      if (handle) {
        handle.dispose();
        handle = null;
      }
    };
    // gen: re-run with the fresh canvas element after a teardown
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gen, mode, side]);

  return (
    <canvas
      key={gen}
      ref={wrapRef}
      className={`scene-canvas${ready ? " is-ready" : ""}`}
      aria-hidden="true"
    />
  );
}
