import {
  SHOP_ITEMS, shopItem, canBuy, buyBlockedReason, applyPurchase, MAX_FREEZES,
} from '../data/shop';
import { Profile } from '../data/content';

const base: Profile = {
  id: 't', name: 'T', avatar: 'cool', bg: '#fff', color: '#58CC02',
  streak: 3, xp: 100, gems: 0, hearts: 5, levelId: 'kg', grade: 1,
  placed: true, path: 'chords', lastUnit: 'x', lang: 'en',
};

describe('SHOP_ITEMS', () => {
  it('has hearts (50) and freeze (100)', () => {
    expect(SHOP_ITEMS.map((i) => i.id)).toEqual(['hearts', 'freeze']);
    expect(shopItem('hearts').cost).toBe(50);
    expect(shopItem('freeze').cost).toBe(100);
  });
});

describe('canBuy', () => {
  it('hearts: needs gems AND a missing heart', () => {
    expect(canBuy({ ...base, gems: 50, hearts: 5 }, 'hearts')).toBe(false); // full
    expect(canBuy({ ...base, gems: 49, hearts: 2 }, 'hearts')).toBe(false); // too poor
    expect(canBuy({ ...base, gems: 50, hearts: 2 }, 'hearts')).toBe(true);
  });
  it('freeze: needs gems AND room under the cap', () => {
    expect(canBuy({ ...base, gems: 100, streakFreezes: MAX_FREEZES }, 'freeze')).toBe(false); // capped
    expect(canBuy({ ...base, gems: 99 }, 'freeze')).toBe(false); // too poor
    expect(canBuy({ ...base, gems: 100, streakFreezes: 0 }, 'freeze')).toBe(true);
    expect(canBuy({ ...base, gems: 100 }, 'freeze')).toBe(true); // undefined freezes → 0
  });
});

describe('buyBlockedReason', () => {
  it('explains why a purchase is blocked, or null when buyable', () => {
    expect(buyBlockedReason({ ...base, gems: 50, hearts: 5 }, 'hearts')).toBe('Hearts already full');
    expect(buyBlockedReason({ ...base, gems: 100, streakFreezes: MAX_FREEZES }, 'freeze')).toBe('Max freezes owned');
    expect(buyBlockedReason({ ...base, gems: 0, hearts: 1 }, 'hearts')).toBe('Not enough gems');
    expect(buyBlockedReason({ ...base, gems: 50, hearts: 1 }, 'hearts')).toBeNull();
  });
});

describe('applyPurchase', () => {
  it('hearts: spends 50 gems, refills to 5, clears the refill timer', () => {
    const p = applyPurchase({ ...base, gems: 60, hearts: 1, heartsAt: 123 }, 'hearts');
    expect(p.gems).toBe(10);
    expect(p.hearts).toBe(5);
    expect(p.heartsAt).toBeUndefined();
  });
  it('freeze: spends 100 gems and adds one freeze', () => {
    const p = applyPurchase({ ...base, gems: 120, streakFreezes: 0 }, 'freeze');
    expect(p.gems).toBe(20);
    expect(p.streakFreezes).toBe(1);
  });
  it('is a no-op when the item is not buyable', () => {
    const full = { ...base, gems: 60, hearts: 5 };
    expect(applyPurchase(full, 'hearts')).toBe(full); // unchanged reference
    const broke = { ...base, gems: 10, hearts: 1 };
    expect(applyPurchase(broke, 'hearts')).toBe(broke);
  });
});
