/** Port used when `PORT` is not set (local development; Cloud Run always injects it). */
export const DEFAULT_PORT = 3000;

const MIN_PORT = 1;
const MAX_PORT = 65_535;

/**
 * Reads the HTTP port from the raw `PORT` environment variable. Only plain decimal integers in
 * 1..65535 are accepted, so a typo stops the API at startup instead of listening on a random or
 * unexpected port. A missing variable falls back to {@link DEFAULT_PORT}.
 */
export function parsePort(raw: string | undefined): number {
  if (raw === undefined) {
    return DEFAULT_PORT;
  }
  if (!/^[0-9]+$/.test(raw)) {
    throw new RangeError(
      `PORT must be an integer between ${MIN_PORT} and ${MAX_PORT}, got "${raw}"`,
    );
  }
  const port = Number(raw);
  if (port < MIN_PORT || port > MAX_PORT) {
    throw new RangeError(
      `PORT must be an integer between ${MIN_PORT} and ${MAX_PORT}, got "${raw}"`,
    );
  }
  return port;
}
