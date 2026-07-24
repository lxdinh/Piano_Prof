// Piano Professor — Gem shop (pure, testable). Spend gems on heart refills and
// streak freezes. The streak-freeze *effect* lives in applyCompletion
// (progress.ts): a freeze is consumed to save the streak after a missed day.
import { Profile } from './content';

export const MAX_FREEZES = 2;

export interface ShopItem {
  id: 'hearts' | 'freeze';
  emoji: string;
  title: string;
  desc: string;
  cost: number; // gems
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'hearts', emoji: '❤️', title: 'Refill hearts', desc: 'Back to 5 hearts instantly', cost: 50 },
  { id: 'freeze', emoji: '🧊', title: 'Streak freeze', desc: 'Protects your streak on one missed day', cost: 100 },
];

export const shopItem = (id: ShopItem['id']) => SHOP_ITEMS.find((i) => i.id === id)!;

/** Whether the item is affordable AND useful right now. */
export function canBuy(p: Profile, id: ShopItem['id']): boolean {
  const item = shopItem(id);
  if (p.gems < item.cost) return false;
  if (id === 'hearts') return p.hearts < 5;
  if (id === 'freeze') return (p.streakFreezes ?? 0) < MAX_FREEZES;
  return false;
}

/** Reason a purchase is blocked (for the UI), or null if it's buyable. */
export function buyBlockedReason(p: Profile, id: ShopItem['id']): string | null {
  const item = shopItem(id);
  if (id === 'hearts' && p.hearts >= 5) return 'Hearts already full';
  if (id === 'freeze' && (p.streakFreezes ?? 0) >= MAX_FREEZES) return 'Max freezes owned';
  if (p.gems < item.cost) return 'Not enough gems';
  return null;
}

/** Apply a purchase. Returns the profile unchanged if it isn't buyable. */
export function applyPurchase(p: Profile, id: ShopItem['id']): Profile {
  if (!canBuy(p, id)) return p;
  const item = shopItem(id);
  if (id === 'hearts') {
    return { ...p, gems: p.gems - item.cost, hearts: 5, heartsAt: undefined };
  }
  return { ...p, gems: p.gems - item.cost, streakFreezes: (p.streakFreezes ?? 0) + 1 };
}
