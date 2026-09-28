/**
 * Heuristic spam scoring. A high score routes the enquiry to `rejected_spam`
 * instead of discarding it, so a false positive stays recoverable.
 */

const URL_PATTERN = /https?:\/\/|www\./gi;
const REPEATED_WORD = /\b(\w{3,})\b(?:\s+\1){4,}/i;

export function spamScore(message: string): number {
  let score = 0;
  const links = message.match(URL_PATTERN)?.length ?? 0;
  if (links >= 3) score += 3;
  else if (links >= 1) score += 1;
  if (REPEATED_WORD.test(message)) score += 3;
  if (
    message.length > 0 &&
    message.replace(/\s/g, '').length / message.length > 0.92 &&
    links > 0
  ) {
    score += 1;
  }
  return score;
}

export function looksLikeSpam(message: string): boolean {
  return spamScore(message) >= 3;
}
