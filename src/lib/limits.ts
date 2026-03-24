/**
 * LongLore Free/Pro Limit Enforcement
 * Utilities for checking and enforcing free vs pro user limits
 */

const FREE_WORD_LIMIT = 50;
const FREE_DAILY_REVIEW_LIMIT = 20;

/**
 * Check if user is a pro subscriber
 * Checks localStorage for plan status (pro or scholar)
 */
export function isProUser(): boolean {
  if (typeof window === 'undefined') return false;
  const plan = localStorage.getItem('longlore_plan');
  return plan === 'pro' || plan === 'scholar';
}

/**
 * Get the word limit for the current user
 */
export function getWordLimit(): number {
  return isProUser() ? Infinity : FREE_WORD_LIMIT;
}

/**
 * Get the daily review limit for the current user
 */
export function getDailyReviewLimit(): number {
  return isProUser() ? Infinity : FREE_DAILY_REVIEW_LIMIT;
}

/**
 * Get the number of reviews completed today
 */
export function getTodayReviewCount(): number {
  if (typeof window === 'undefined') return 0;
  const today = new Date().toISOString().slice(0, 10);
  const key = `longlore_reviews_${today}`;
  return parseInt(localStorage.getItem(key) || '0', 10);
}

/**
 * Increment the review count for today
 */
export function incrementTodayReviewCount(): void {
  if (typeof window === 'undefined') return;
  const today = new Date().toISOString().slice(0, 10);
  const key = `longlore_reviews_${today}`;
  const count = getTodayReviewCount() + 1;
  localStorage.setItem(key, String(count));
}

/**
 * Check if a word can be added given the current word count
 */
export function canAddWord(currentCount: number): boolean {
  return isProUser() || currentCount < FREE_WORD_LIMIT;
}

/**
 * Check if the user can perform a review
 */
export function canReview(): boolean {
  return isProUser() || getTodayReviewCount() < FREE_DAILY_REVIEW_LIMIT;
}
