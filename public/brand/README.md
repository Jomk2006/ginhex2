Place the official GENHEX logo files here, exactly as supplied (no
regeneration/redesign), e.g.:

  genhex-logo.png          — full lockup (icon + wordmark), for light backgrounds
  genhex-logo-dark.png     — full lockup for dark backgrounds, if a separate export exists
  genhex-icon.png          — icon-only mark, for compact spaces (favicon, collapsed nav)

components/shared/logo.tsx already references genhex-logo.png / genhex-logo-dark.png —
drop the real exported files in from the brand asset upload and it will pick them up
with no code changes.
