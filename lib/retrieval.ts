export const CHAT_MATCH_THRESHOLD = 0.1;
export const SUMMARY_MATCH_THRESHOLD = 0.05;
export const QUIZ_MATCH_THRESHOLD = 0.1;

export function isConversationalMessage(input: string) {
  const normalized = input.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
  return /^(hi|hello|hey|hey there|good morning|good afternoon|good evening|thanks|thank you)$/.test(normalized);
}

export function isSummaryRequest(input: string) {
  return /\b(summar(?:y|ize|ise)|overview|what is (?:this|the) (?:document|course|material) about)\b/i.test(input);
}

export function chatMatchThreshold(input: string) {
  return isSummaryRequest(input) ? SUMMARY_MATCH_THRESHOLD : CHAT_MATCH_THRESHOLD;
}
