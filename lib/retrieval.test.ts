import { describe, expect, it } from "vitest";

import {
  CHAT_MATCH_THRESHOLD,
  QUIZ_MATCH_THRESHOLD,
  SUMMARY_MATCH_THRESHOLD,
  chatMatchThreshold,
  isConversationalMessage,
  isSummaryRequest,
} from "./retrieval";

describe("retrieval intent and confidence", () => {
  it("recognizes short conversational messages without classifying questions as greetings", () => {
    expect(isConversationalMessage("Hey")).toBe(true);
    expect(isConversationalMessage("Hello! ")).toBe(true);
    expect(isConversationalMessage("Good morning")).toBe(true);
    expect(isConversationalMessage("Hey, what is the notice period?")).toBe(false);
  });

  it("recognizes course summary requests", () => {
    expect(isSummaryRequest("Summarize this document")).toBe(true);
    expect(isSummaryRequest("Give me an overview")).toBe(true);
    expect(isSummaryRequest("What is the material about?")).toBe(true);
    expect(isSummaryRequest("What is the notice period?")).toBe(false);
  });

  it("uses a lower threshold only for broad summary retrieval", () => {
    expect(chatMatchThreshold("Summarize the course")).toBe(SUMMARY_MATCH_THRESHOLD);
    expect(chatMatchThreshold("Explain termination terms")).toBe(CHAT_MATCH_THRESHOLD);
  });

  it("ranks all ready course chunks for quiz generation", () => {
    expect(QUIZ_MATCH_THRESHOLD).toBe(-1);
  });
});
