import { appUrl } from "./auth";

export const MAX_JSON_REQUEST_BYTES = 16 * 1024;

export function isSameOriginMutation(request: Pick<Request, "headers" | "url">) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const normalizedOrigin = new URL(origin).origin;
    return normalizedOrigin === new URL(request.url).origin || normalizedOrigin === appUrl();
  } catch {
    return false;
  }
}

export function exceedsContentLength(request: Pick<Request, "headers">, maximumBytes: number) {
  const rawLength = request.headers.get("content-length");
  if (!rawLength) return false;
  const length = Number(rawLength);
  return !Number.isSafeInteger(length) || length < 0 || length > maximumBytes;
}
