import { describe, expect, it } from "vitest";

import { isSendShortcut } from "./chat-input";

describe("chat composer shortcuts", () => {
  it("submits with Command or Control plus Enter", () => {
    expect(isSendShortcut({ key: "Enter", metaKey: true, ctrlKey: false })).toBe(true);
    expect(isSendShortcut({ key: "Enter", metaKey: false, ctrlKey: true })).toBe(true);
  });

  it("keeps plain Enter available for multiline questions", () => {
    expect(isSendShortcut({ key: "Enter", metaKey: false, ctrlKey: false })).toBe(false);
    expect(isSendShortcut({ key: "a", metaKey: true, ctrlKey: false })).toBe(false);
  });
});
