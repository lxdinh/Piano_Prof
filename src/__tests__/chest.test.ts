import { chestTier, canOpenChest, applyChestOpen, CHEST_TIERS } from '../data/chest';
import { applyPremiumWelcome, hasPremiumWelcome, PREMIUM_WELCOME_GEMS } from '../data/premium';
import { Profile } from '../data/content';

const profile = (over: Partial<Profile> = {}): Profile => ({
  id: 'p1', name: 'Ava', avatar: 'cool', bg: '#fff', color: '#000',
  streak: 1, xp: 0, gems: 50, hearts: 5, levelId: 'kg', grade: 1,
  placed: true, path: 'chords', lastUnit: 'x', lang: 'en',
  ...over,
});

describe('daily chest', () => {
  it('gives a stable reward per profile+day (cannot be rerolled)', () => {
    const a = chestTier('p1', '2026-03-04');
    const b = chestTier('p1', '2026-03-04');
    expect(a).toEqual(b); // force-quitting and retrying changes nothing
  });

  it('varies across days — an unpredictable payout, not a fixed one', () => {
    const days = Array.from({ length: 60 }, (_, i) => chestTier('p1', `2026-03-${String(i % 28 + 1).padStart(2, '0')}`));
    expect(new Set(days.map((t) => t.gems)).size).toBeGreaterThan(1);
  });

  it('only ever pays a defined tier', () => {
    const allowed = new Set(CHEST_TIERS.map((t) => t.gems));
    for (let i = 0; i < 200; i++) {
      expect(allowed.has(chestTier(`user${i}`, '2026-05-05').gems)).toBe(true);
    }
  });

  it('opens once a day and is idempotent', () => {
    const p = profile({ gems: 0 });
    const opened = applyChestOpen(p, '2026-03-04');
    expect(opened.gems).toBeGreaterThan(0);
    expect(canOpenChest(opened, '2026-03-04')).toBe(false);
    expect(applyChestOpen(opened, '2026-03-04').gems).toBe(opened.gems); // no double pay
  });

  it('is available again the next day', () => {
    const opened = applyChestOpen(profile({ gems: 0 }), '2026-03-04');
    expect(canOpenChest(opened, '2026-03-05')).toBe(true);
  });

  it('is withheld while the clock looks tampered with', () => {
    const p = profile({ gems: 0 });
    expect(canOpenChest(p, '2026-03-04', true)).toBe(false);
    expect(applyChestOpen(p, '2026-03-04', true).gems).toBe(0);
  });
});

describe('premium welcome bonus', () => {
  it('grants the bonus once', () => {
    const p = profile({ gems: 10 });
    const granted = applyPremiumWelcome(p, 1000);
    expect(granted.gems).toBe(10 + PREMIUM_WELCOME_GEMS);
    expect(hasPremiumWelcome(granted)).toBe(true);
  });

  it('never pays twice (resubscribing or revisiting the screen)', () => {
    const once = applyPremiumWelcome(profile({ gems: 0 }), 1000);
    const twice = applyPremiumWelcome(once, 2000);
    expect(twice.gems).toBe(once.gems);
    expect(twice.premiumGrantedAt).toBe(1000);
  });
});
