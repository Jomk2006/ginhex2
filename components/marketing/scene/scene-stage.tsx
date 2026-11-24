"use client";

import { useState, type MutableRefObject, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { SceneMode, SceneProgress } from "./honeycomb-scene";

// WebGL never renders on the server; the static fallback is the SSR output.
const SceneCanvas = dynamic(() => import("./scene-canvas"), { ssr: false, loading: () => null });

/** Static fallback underneath, lazy WebGL canvas on top; the fallback fades out once WebGL is live. */
export function SceneStage({
  mode,
  progress,
  side,
  fallback,
  className = "",
}: {
  mode: SceneMode;
  progress: MutableRefObject<SceneProgress>;
  side: 1 | -1;
  fallback: ReactNode;
  className?: string;
}) {
  const [ready, setReady] = useState(false);
  return (
    <div className={`scene-layer ${className}`} aria-hidden="true">
      <div className={`scene-fallback${ready ? " is-hidden" : ""}`}>{fallback}</div>
      <SceneCanvas mode={mode} progress={progress} side={side} onReady={setReady} />
    </div>
  );
}
