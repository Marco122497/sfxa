export const APP_VERSION = "1.1.1.35-beta";

export const APP_DEVELOPER = "D O R I G";

export const APP_BUILD_TIME =
  process.env.NEXT_PUBLIC_BUILD_TIME ?? "2026-01-01T00:00:00.000Z";

/** Display version matching the sidebar footer, e.g. `v1.1.1.24-beta`. */
export function formatAppVersion() {
  return `v${APP_VERSION}`;
}

export function formatAppFooterLabel() {
  return `Generated from SFXA Finance (${formatAppVersion()})`;
}
