"use client";

import { useRef, type ReactNode } from "react";
import { SceneStage } from "./scene-stage";
import { useSceneProgress } from "./use-scene-progress";

/** Hero 3D layer: fills the hero, depth changes as the hero scrolls away. */
export function HeroScene({ side, fallback }: { side: 1 | -1; fallback: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const progress = useSceneProgress("hero", track);
  return (
    <div ref={track} className="absolute inset-0">
      <SceneStage mode="hero" progress={progress} side={side} fallback={fallback} />
    </div>
  );
}
