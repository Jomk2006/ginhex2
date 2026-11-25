/**
 * Content-Security-Policy builder (per-request nonce, generated in proxy.ts).
 *
 * script-src: nonce + 'strict-dynamic' (no 'unsafe-inline'). Next.js applies the
 * nonce to its bootstrap scripts automatically because every page here renders
 * dynamically (the locale layout reads cookies()).
 * style-src keeps 'unsafe-inline': React/Tailwind/three.js UI rely on inline
 * style attributes, which a nonce cannot cover.
 */
export function buildCsp(nonce: string, opts: { isDev: boolean; secure: boolean }): string {
  let supabaseHttps = "";
  let supabaseWss = "";
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host;
    if (host) {
      supabaseHttps = `https://${host}`;
      supabaseWss = `wss://${host}`;
    }
  } catch {
    /* env validated elsewhere */
  }

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      "'wasm-unsafe-eval'", // Pyodide (labs) WebAssembly
      ...(opts.isDev ? ["'unsafe-eval'"] : []), // React dev tooling only
    ],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
    "img-src": ["'self'", "blob:", "data:", "https:"], // Supabase storage, avatars, YouTube thumbs
    "media-src": ["'self'", "blob:", "https:"],
    "connect-src": ["'self'", supabaseHttps, supabaseWss, "https://cdn.jsdelivr.net"].filter(Boolean),
    "frame-src": [
      "https://www.youtube.com",
      "https://www.youtube-nocookie.com",
      "https://drive.google.com",
    ],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    // Chrome applies form-action to redirects after a form POST, so the Google
    // OAuth hop (app -> Supabase -> accounts.google.com) must be allowed.
    "form-action": ["'self'", supabaseHttps, "https://accounts.google.com"].filter(Boolean),
    "frame-ancestors": ["'none'"],
  };

  const parts = Object.entries(directives).map(([k, v]) => `${k} ${v.join(" ")}`);
  if (opts.secure) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}
