import { describe, expect, it } from "vitest";

import { exceedsContentLength, isSameOriginMutation, MAX_JSON_REQUEST_BYTES } from "./security";

describe("request security boundaries", () => {
  it("rejects browser mutations from a different origin", () => {
    const request = new Request("https://coursemate.example/api/chat", { headers: { origin: "https://evil.example" } });
    expect(isSameOriginMutation(request)).toBe(false);
  });

  it("accepts same-origin and non-browser requests", () => {
    expect(isSameOriginMutation(new Request("https://coursemate.example/api/chat", { headers: { origin: "https://coursemate.example" } }))).toBe(true);
    expect(isSameOriginMutation(new Request("https://coursemate.example/api/chat"))).toBe(true);
  });

  it("rejects oversized or malformed content lengths", () => {
    expect(exceedsContentLength(new Request("https://coursemate.example", { headers: { "content-length": String(MAX_JSON_REQUEST_BYTES + 1) } }), MAX_JSON_REQUEST_BYTES)).toBe(true);
    expect(exceedsContentLength(new Request("https://coursemate.example", { headers: { "content-length": "invalid" } }), MAX_JSON_REQUEST_BYTES)).toBe(true);
    expect(exceedsContentLength(new Request("https://coursemate.example", { headers: { "content-length": "100" } }), MAX_JSON_REQUEST_BYTES)).toBe(false);
  });
});
