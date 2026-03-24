export interface VocabCard {
  id: string;
  hanzi: string;
  pinyin: string;
  english: string;
  storyId?: string;
  sentenceContext?: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReview?: string;
  stage: 'new' | 'learning' | 'mature' | 'mastered';
  createdAt: string;
  updatedAt: string;
}

function computeStage(repetitions: number): VocabCard['stage'] {
  if (repetitions === 0) return 'new';
  if (repetitions <= 2) return 'learning';
  if (repetitions <= 5) return 'mature';
  return 'mastered';
}

/**
 * SM-2 algorithm: grade a card and return the updated card.
 * quality: 1=Again, 2=Hard, 3=Good, 5=Easy
 */
export function gradeCard(card: VocabCard, quality: number): VocabCard {
  const now = new Date().toISOString();
  let { easeFactor, interval, repetitions } = card;

  // Update ease factor
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  if (quality < 3) {
    // Failed — reset
    repetitions = 0;
    interval = 0;
  } else {
    // Passed
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  const nextDate = new Date();
  if (interval === 0) {
    nextDate.setMinutes(nextDate.getMinutes() + 1);
  } else {
    nextDate.setDate(nextDate.getDate() + interval);
  }

  return {
    ...card,
    easeFactor,
    interval,
    repetitions,
    nextReview: nextDate.toISOString(),
    lastReview: now,
    stage: computeStage(repetitions),
    updatedAt: now,
  };
}

/** Human-readable interval preview */
export function formatInterval(days: number): string {
  if (days === 0) return '< 1分钟';
  if (days === 1) return '1天';
  if (days < 7) return `${days}天`;
  if (days < 30) return `${Math.round(days / 7)}周`;
  if (days < 365) return `${Math.round(days / 30)}个月`;
  return `${Math.round(days / 365)}年`;
}

/** Preview what interval each quality score would produce */
export function previewIntervals(card: VocabCard): Record<number, string> {
  const previews: Record<number, string> = {};
  for (const q of [1, 2, 3, 5]) {
    const result = gradeCard(card, q);
    previews[q] = formatInterval(result.interval);
  }
  return previews;
}

/** Get cards due for review, sorted most overdue first */
export function getDueCards(cards: VocabCard[]): VocabCard[] {
  const now = new Date().toISOString();
  return cards
    .filter((c) => c.nextReview <= now)
    .sort((a, b) => a.nextReview.localeCompare(b.nextReview));
}
