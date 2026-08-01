export type Source = {
  id: string;
  title: string;
  module: string;
  snippet: string;
  score: number;
};

export type ChatResponse = {
  answer: string;
  sources: Source[];
  grounded: boolean;
  mode: "nim" | "local-demo";
};

export type QuizQuestion = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};
