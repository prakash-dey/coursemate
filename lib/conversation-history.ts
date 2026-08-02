export type ConversationHistoryEntry<TMessage, TQuiz> =
  | { kind: "message"; value: TMessage }
  | { kind: "quiz"; value: TQuiz };

export function orderConversation<TMessage, TQuiz>(messages: TMessage[], quiz: TQuiz | null, quizIndex: number | null) {
  const entries: ConversationHistoryEntry<TMessage, TQuiz>[] = messages.map((value) => ({ kind: "message", value }));
  if (quiz) entries.splice(Math.min(Math.max(quizIndex ?? messages.length, 0), messages.length), 0, { kind: "quiz", value: quiz });
  return entries;
}
