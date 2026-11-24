/**
 * Capability gate for the WebGL scene. Everything 3D sits behind this: if it
 * says no, the page keeps its static SVG fallback (no canvas, no three.js).
 */
export interface SceneTier {
  canRun: boolean;
  reason: "ok" | "reduced-motion" | "no-webgl" | "low-power";
  mobile: boolean;
  rings: number;
  dpr: number;
  antialias: boolean;
}

let webglCache: boolean | null = null;

function hasWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    webglCache = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglCache = false;
  }
  return webglCache;
}

export function getTier(): SceneTier {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
  const mem = nav.deviceMemory;
  const low = !!nav.connection?.saveData || (typeof mem === "number" && mem <= 2);
  const webgl = hasWebGL();
  const reason = reduced ? "reduced-motion" : !webgl ? "no-webgl" : low ? "low-power" : "ok";
  return {
    canRun: reason === "ok",
    reason,
    mobile,
    rings: mobile ? 5 : 8,
    dpr: Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2),
    antialias: !mobile,
  };
}
