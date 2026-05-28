import { refillHearts, spendHeart, grantFullHearts, makeHearts } from '../gamification/hearts';
import { HEART_REFILL_MS } from '../services/types';

describe('hearts economy', () => {
  it('spends a heart and arms the refill timer', () => {
    const h = spendHeart(makeHearts(), 1000);
    expect(h.count).toBe(4);
    expect(h.nextRefillAt).toBe(1000 + HEART_REFILL_MS);
  });

  it('does not go below zero', () => {
    let h = makeHearts();
    for (let i = 0; i < 10; i++) h = spendHeart(h, 1000);
    expect(h.count).toBe(0);
  });

  it('refills one heart after the interval elapses', () => {
    const spent = spendHeart(makeHearts(), 0); // count 4, next at REFILL
    const refilled = refillHearts(spent, HEART_REFILL_MS);
    expect(refilled.count).toBe(5);
    expect(refilled.nextRefillAt).toBeNull(); // full → timer cleared
  });

  it('refills multiple hearts for long absences', () => {
    let h = makeHearts();
    h = spendHeart(h, 0);
    h = spendHeart(h, 0);
    h = spendHeart(h, 0); // count 2, next at REFILL
    const refilled = refillHearts(h, HEART_REFILL_MS * 3);
    expect(refilled.count).toBe(5);
  });

  it('unlimited hearts never decrement', () => {
    const u = { ...makeHearts(), unlimited: true, count: 5 };
    expect(spendHeart(u).count).toBe(5);
  });

  it('grantFullHearts tops up to max', () => {
    const h = grantFullHearts(spendHeart(makeHearts(), 0));
    expect(h.count).toBe(5);
    expect(h.nextRefillAt).toBeNull();
  });
});
