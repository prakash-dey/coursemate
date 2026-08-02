import { describe, expect, it } from "vitest";

import { orderConversation } from "./conversation-history";

describe("conversation history ordering", () => {
  it("keeps a quiz before messages sent afterward", () => {
    expect(orderConversation(["later question", "later answer"], ["quiz"], 0)).toEqual([
      { kind: "quiz", value: ["quiz"] },
      { kind: "message", value: "later question" },
      { kind: "message", value: "later answer" },
    ]);
  });

  it("places a quiz after the messages that already existed", () => {
    expect(orderConversation(["question", "answer"], ["quiz"], 2).map((entry) => entry.kind)).toEqual(["message", "message", "quiz"]);
  });
});
