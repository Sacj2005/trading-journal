export const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What was the make of your first car?",
] as const;

export type SecurityQuestion = typeof SECURITY_QUESTIONS[number];
