"use client";

import { useCallback, useRef, useState } from "react";
import { BookOpenCheck, TerminalSquare, Timer, BadgeCheck } from "lucide-react";
import { SceneStage } from "../scene/scene-stage";
import { useSceneProgress } from "../scene/use-scene-progress";
import { JourneyFallback } from "./journey-fallback";

export interface JourneyStep {
  title: string;
  body: string;
}

const ICONS = [BookOpenCheck, TerminalSquare, Timer, BadgeCheck];

/**
 * Sticky scroll journey. The track is tall, the stage sticks; scroll position
 * only feeds a progress value (CSS var + 3D scene). Native scrolling is never
 * intercepted.
 */
export function JourneyStage({
  eyebrow,
  title,
  steps,
  side,
}: {
  eyebrow: string;
  title: string;
  steps: JourneyStep[];
  side: 1 | -1;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const progress = useSceneProgress("journey", track, setStep);

  const goTo = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    const p = 0.04 + (i / 3) * 0.92;
    const top = el.getBoundingClientRect().top + window.scrollY + total * p;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  }, []);

  return (
    <section className="journey lp-dark" data-step={step} aria-labelledby="journey-title">
      <div ref={track} className="journey-track">
        <div className="journey-stage">
          <SceneStage
            className="journey-canvas"
            mode="journey"
            progress={progress}
            side={side}
            fallback={<JourneyFallback />}
          />
          <div className="journey-shade" aria-hidden="true" />
          <div className="journey-ui">
            <header className="journey-head">
              <span className="lp-eyebrow">{eyebrow}</span>
              <h2 id="journey-title" className="journey-title">
                {title}
              </h2>
            </header>

            <div className="journey-panel lp-glass-dark">
              <ol className="journey-cards">
                {steps.map((s, i) => {
                  const Icon = ICONS[i] ?? BadgeCheck;
                  return (
                    <li key={i} className="journey-card" data-active={i === step}>
                      <div className="journey-card-top">
                        <span className="journey-icon" aria-hidden="true">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="journey-num" aria-hidden="true">
                          0{i + 1}
                        </span>
                      </div>
                      <h3 className="journey-card-title">{s.title}</h3>
                      <p className="journey-card-body">{s.body}</p>
                    </li>
                  );
                })}
              </ol>
              <div className="journey-rail" role="group">
                {steps.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className="journey-dot"
                    data-on={i <= step}
                    aria-label={s.title}
                    aria-current={i === step ? "step" : undefined}
                    onClick={() => goTo(i)}
                  />
                ))}
                <span className="journey-bar" aria-hidden="true">
                  <span className="journey-bar-fill" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
