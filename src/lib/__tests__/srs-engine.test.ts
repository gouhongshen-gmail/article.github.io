import { describe, it, expect, beforeEach } from 'vitest';
import {
  gradeCard,
  formatInterval,
  previewIntervals,
  getDueCards,
  VocabCard,
} from '../srs-engine';

describe('SRS Engine - SM-2 Algorithm', () => {
  let testCard: VocabCard;

  beforeEach(() => {
    testCard = {
      id: 'test-1',
      hanzi: '中',
      pinyin: 'zhōng',
      english: 'middle',
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: new Date().toISOString(),
      stage: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  describe('gradeCard - Failed responses (quality < 3)', () => {
    it('quality=1 (Again) should reset interval and repetitions', () => {
      testCard.repetitions = 3;
      testCard.interval = 10;

      const result = gradeCard(testCard, 1);

      expect(result.interval).toBe(0);
      expect(result.repetitions).toBe(0);
      expect(result.stage).toBe('new');
    });

    it('quality=2 (Hard) should reset interval and repetitions', () => {
      testCard.repetitions = 2;
      testCard.interval = 5;

      const result = gradeCard(testCard, 2);

      expect(result.interval).toBe(0);
      expect(result.repetitions).toBe(0);
      expect(result.stage).toBe('new');
    });

    it('should update ease factor to minimum 1.3', () => {
      testCard.easeFactor = 2.0;
      const result = gradeCard(testCard, 1);
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('should set nextReview to ~1 minute in the future when interval is 0', () => {
      const now = new Date();
      const result = gradeCard(testCard, 1);
      const nextReview = new Date(result.nextReview);
      const diffMs = nextReview.getTime() - now.getTime();
      // Should be approximately 1 minute (60000 ms)
      expect(diffMs).toBeGreaterThanOrEqual(59000);
      expect(diffMs).toBeLessThanOrEqual(65000);
    });
  });

  describe('gradeCard - Passing responses (quality >= 3)', () => {
    it('quality=3 (Good) on new card should set interval to 1 day', () => {
      testCard.repetitions = 0;
      testCard.interval = 0;

      const result = gradeCard(testCard, 3);

      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
      expect(result.stage).toBe('learning');
    });

    it('quality=3 (Good) after first repetition should set interval to 6 days', () => {
      testCard.repetitions = 1;
      testCard.interval = 1;

      const result = gradeCard(testCard, 3);

      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
      expect(result.stage).toBe('learning');
    });

    it('quality=3 (Good) after second repetition should multiply by ease factor', () => {
      testCard.repetitions = 2;
      testCard.interval = 6;
      testCard.easeFactor = 2.5;

      const result = gradeCard(testCard, 3);

      // The ease factor changes when grading, so we just check it's reasonable
      expect(result.interval).toBeGreaterThan(6);
      expect(result.repetitions).toBe(3);
      expect(result.stage).toBe('mature');
    });
  });

  describe('gradeCard - Easy response (quality = 5)', () => {
    it('quality=5 (Easy) should have longer interval than quality=3', () => {
      testCard.repetitions = 2;
      testCard.interval = 6;
      testCard.easeFactor = 2.5;

      const result3 = gradeCard(testCard, 3);
      testCard.easeFactor = 2.5; // Reset for fair comparison
      const result5 = gradeCard(testCard, 5);

      expect(result5.interval).toBeGreaterThan(result3.interval);
    });

    it('quality=5 should increase ease factor more than quality=3', () => {
      const card3 = gradeCard(testCard, 3);
      testCard.easeFactor = 2.5; // Reset
      const card5 = gradeCard(testCard, 5);

      expect(card5.easeFactor).toBeGreaterThan(card3.easeFactor);
    });
  });

  describe('Ease factor bounds', () => {
    it('should never go below 1.3', () => {
      testCard.easeFactor = 1.3;
      // Try to fail multiple times to push it lower
      let card = testCard;
      for (let i = 0; i < 5; i++) {
        card = gradeCard(card, 1);
      }
      expect(card.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('should increase with high quality scores', () => {
      const initialEF = testCard.easeFactor;
      const result = gradeCard(testCard, 5);
      expect(result.easeFactor).toBeGreaterThan(initialEF);
    });
  });

  describe('formatInterval', () => {
    it('should format 0 days as < 1分钟', () => {
      expect(formatInterval(0)).toBe('< 1分钟');
    });

    it('should format 1 day as 1天', () => {
      expect(formatInterval(1)).toBe('1天');
    });

    it('should format 3 days as 3天', () => {
      expect(formatInterval(3)).toBe('3天');
    });

    it('should format 7 days as 1周', () => {
      expect(formatInterval(7)).toBe('1周');
    });

    it('should format 14 days as 2周', () => {
      expect(formatInterval(14)).toBe('2周');
    });

    it('should format 30 days as 1个月', () => {
      expect(formatInterval(30)).toBe('1个月');
    });

    it('should format 60 days as 2个月', () => {
      expect(formatInterval(60)).toBe('2个月');
    });

    it('should format 365 days as 1年', () => {
      expect(formatInterval(365)).toBe('1年');
    });

    it('should format 730 days as 2年', () => {
      expect(formatInterval(730)).toBe('2年');
    });
  });

  describe('previewIntervals', () => {
    it('should return 4 intervals for quality 1, 2, 3, 5', () => {
      const previews = previewIntervals(testCard);

      expect(Object.keys(previews)).toEqual(['1', '2', '3', '5']);
    });

    it('should have increasing intervals from quality 1 to 5', () => {
      const previews = previewIntervals(testCard);

      // Quality 1 and 2 (failed) should reset to "< 1分钟"
      // Quality 3 (good) should be at least "1天"
      // Quality 5 (easy) should be >= quality 3
      expect(previews[1]).toBe('< 1分钟');
      expect(previews[2]).toBe('< 1分钟');
      expect(previews[3]).not.toBe('< 1分钟');
      expect(previews[5]).not.toBe('< 1分钟');
    });

    it('should return string intervals with proper units', () => {
      const previews = previewIntervals(testCard);

      Object.values(previews).forEach((interval) => {
        expect(typeof interval).toBe('string');
        expect(interval.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getDueCards', () => {
    it('should return empty array when no cards are due', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const cards: VocabCard[] = [
        { ...testCard, nextReview: futureDate.toISOString() },
      ];

      const dueCards = getDueCards(cards);
      expect(dueCards).toEqual([]);
    });

    it('should return card that is due', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const cards: VocabCard[] = [
        { ...testCard, id: 'card-1', nextReview: pastDate.toISOString() },
      ];

      const dueCards = getDueCards(cards);
      expect(dueCards).toHaveLength(1);
      expect(dueCards[0].id).toBe('card-1');
    });

    it('should sort by nextReview date (most overdue first)', () => {
      const date1 = new Date();
      date1.setDate(date1.getDate() - 2);

      const date2 = new Date();
      date2.setDate(date2.getDate() - 1);

      const date3 = new Date();
      date3.setDate(date3.getDate() + 1); // Future date, not due

      const cards: VocabCard[] = [
        { ...testCard, id: 'card-1', nextReview: date2.toISOString() },
        { ...testCard, id: 'card-2', nextReview: date1.toISOString() },
        { ...testCard, id: 'card-3', nextReview: date3.toISOString() },
      ];

      const dueCards = getDueCards(cards);
      expect(dueCards).toHaveLength(2);
      expect(dueCards[0].id).toBe('card-2'); // Most overdue
      expect(dueCards[1].id).toBe('card-1'); // Less overdue
    });
  });

  describe('Stage calculation', () => {
    it('new stage: repetitions = 0', () => {
      const card = gradeCard(testCard, 1); // Reset
      expect(card.stage).toBe('new');
    });

    it('learning stage: repetitions 1-2', () => {
      let card = testCard;
      card = gradeCard(card, 3); // repetitions = 1
      expect(card.stage).toBe('learning');

      card = gradeCard(card, 3); // repetitions = 2
      expect(card.stage).toBe('learning');
    });

    it('mature stage: repetitions 3-5', () => {
      let card = testCard;
      for (let i = 0; i < 3; i++) {
        card = gradeCard(card, 3);
      }
      expect(card.stage).toBe('mature');

      card = gradeCard(card, 3);
      expect(card.stage).toBe('mature'); // Still at 4

      card = gradeCard(card, 3);
      expect(card.stage).toBe('mature'); // At 5
    });

    it('mastered stage: repetitions > 5', () => {
      let card = testCard;
      for (let i = 0; i < 6; i++) {
        card = gradeCard(card, 3);
      }
      expect(card.stage).toBe('mastered');
    });
  });

  describe('gradeCard metadata', () => {
    it('should update lastReview to current time', () => {
      const before = new Date();
      const result = gradeCard(testCard, 3);
      const after = new Date();

      const lastReview = new Date(result.lastReview!);
      expect(lastReview.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(lastReview.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should update updatedAt to current time', () => {
      const before = new Date();
      const result = gradeCard(testCard, 3);
      const after = new Date();

      const updatedAt = new Date(result.updatedAt);
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should preserve other card properties', () => {
      testCard.storyId = 'story-1';
      testCard.sentenceContext = 'Some context';

      const result = gradeCard(testCard, 3);

      expect(result.id).toBe(testCard.id);
      expect(result.hanzi).toBe(testCard.hanzi);
      expect(result.pinyin).toBe(testCard.pinyin);
      expect(result.english).toBe(testCard.english);
      expect(result.storyId).toBe('story-1');
      expect(result.sentenceContext).toBe('Some context');
    });
  });
});
