// Proof that syncing can never destroy a learner's progress.
import { mergeSync, mergeProfile } from '../account/merge';
import { Profile } from '../data/content';
import { SyncData } from '../account/types';

const profile = (over: Partial<Profile> = {}): Profile => ({
  id: 'p1', name: 'Ava', avatar: 'cool', bg: '#fff', color: '#000',
  streak: 3, xp: 100, gems: 20, hearts: 5, levelId: 'kg', grade: 1,
  placed: true, path: 'chords', lastUnit: 'x', lang: 'en',
  ...over,
});

const snap = (profiles: Profile[], rev: number, over: Partial<SyncData> = {}): SyncData => ({
  profiles, activeId: profiles[0]?.id ?? null, premium: false, rev, updatedAt: rev * 1000, ...over,
});

describe('mergeProfile', () => {
  it('never un-completes a lesson — progress is unioned by best stars', () => {
    const a = profile({ progress: { l1: 3, l2: 1 } });
    const b = profile({ progress: { l2: 3, l3: 2 } });
    expect(mergeProfile(a, b).progress).toEqual({ l1: 3, l2: 3, l3: 2 });
  });

  it('keeps the best XP, streak and per-day history from either device', () => {
    const a = profile({ xp: 500, streak: 10, history: { '2026-01-01': 50 } });
    const b = profile({ xp: 300, streak: 22, history: { '2026-01-01': 20, '2026-01-02': 80 } });
    const m = mergeProfile(a, b);
    expect(m.xp).toBe(500);
    expect(m.streak).toBe(22);
    expect(m.history).toEqual({ '2026-01-01': 50, '2026-01-02': 80 });
  });

  it('takes spendable balances from the primary only (no currency duplication)', () => {
    // Spent down to 5 gems on the newer device; the older copy still shows 900.
    const newer = profile({ gems: 5, hearts: 2, streakFreezes: 0 });
    const older = profile({ gems: 900, hearts: 5, streakFreezes: 2 });
    const m = mergeProfile(newer, older);
    expect(m.gems).toBe(5); // max() here would mint 895 free gems
    expect(m.hearts).toBe(2);
    expect(m.streakFreezes).toBe(0);
  });
});

describe('mergeSync', () => {
  it('orders by rev, not by wall-clock time', () => {
    // The stale device has a FAR future clock but a lower rev — it must lose.
    const local = snap([profile({ xp: 900 })], 7, { updatedAt: 1 });
    const stale = snap([profile({ xp: 100 })], 2, { updatedAt: 9_999_999_999 });
    expect((mergeSync(local, stale).profiles[0] as Profile).xp).toBe(900);
  });

  it('keeps profiles that exist on only one side', () => {
    const local = snap([profile({ id: 'a' })], 3);
    const remote = snap([profile({ id: 'b' })], 4);
    const ids = (mergeSync(local, remote).profiles as Profile[]).map((p) => p.id).sort();
    expect(ids).toEqual(['a', 'b']);
  });

  it('merges local anonymous progress into a cloud account on sign-in', () => {
    const localOnly = snap([profile({ progress: { l1: 3 }, xp: 300 })], 5);
    const cloud = snap([profile({ progress: { l9: 2 }, xp: 100 })], 4);
    const merged = mergeSync(localOnly, cloud).profiles[0] as Profile;
    expect(merged.progress).toEqual({ l1: 3, l9: 2 }); // nothing discarded
    expect(merged.xp).toBe(300);
  });

  it('preserves a premium entitlement held by either side', () => {
    const a = snap([profile()], 2, { premium: true });
    const b = snap([profile()], 9, { premium: false });
    expect(mergeSync(a, b).premium).toBe(true);
  });

  it('advances rev past both inputs so the result wins the next merge', () => {
    const merged = mergeSync(snap([profile()], 4), snap([profile()], 9));
    expect(merged.rev).toBe(10);
  });
});
