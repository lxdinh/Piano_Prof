// Piano Professor — LessonEngine, ported from "Lesson 1.html" BLOCK 3.
// Steps through LESSON.steps[].segments[] in order; talks only to the HW
// facade. Global rules: never advance on a miss · wrong key = 150ms red
// flash, progress kept · chord window 200ms · C7 has no LED but counts as
// a key press · typeSay text persists until the next line.
import * as ExpoSpeech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Lesson1, Segment, SongConfig, WrongOpts,
  CHORDS, CHORD_WINDOW_MS, LED_RGB, ALL_LED_NOTES, SONG_TITLES, SONG_BPM, SONG_BEATS,
  noteToMidi, chordDisplayName,
} from './data';
import { HwFacade } from './hal';
import * as pianoEngine from '../audio/pianoEngine';
import * as haptics from '../feedback/haptics';

export const LS_NS = 'pp_lesson1_';
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ── cues (Synth port): voice + piano only by default; chime always on ── */
export const Cues = {
  enabled: false,
  chime() { pianoEngine.playMidi(79, 0.5).catch(() => {}); setTimeout(() => pianoEngine.playMidi(84, 0.55).catch(() => {}), 90); },
  correct() { if (!this.enabled) return; pianoEngine.playMidi(76, 0.5).catch(() => {}); setTimeout(() => pianoEngine.playMidi(81, 0.4).catch(() => {}), 80); },
  success() { if (!this.enabled) return; [72, 76, 79, 84].forEach((m, i) => setTimeout(() => pianoEngine.playMidi(m, 0.55).catch(() => {}), i * 90)); },
  wrong() { haptics.error(); },
  tap() { if (this.enabled) haptics.tap(); },
  star(i: number) { pianoEngine.playMidi(72 + i * 4, 0.6).catch(() => {}); },
};

/* ── speech (expo-speech port; estimate mirrors the spec) ── */
export const Speech = {
  muted: false,
  estimate(text: string, rate = 1) { return (500 + text.length * 62) / rate; },
  speak(text: string, opts: { rate?: number } = {}): Promise<void> {
    return new Promise((resolve) => {
      if (this.muted) { setTimeout(resolve, Math.min(this.estimate(text, opts.rate), 350 + text.length * 30)); return; }
      let done = false;
      const finish = () => { if (!done) { done = true; clearTimeout(safety); resolve(); } };
      const safety = setTimeout(finish, this.estimate(text, opts.rate) * 1.8 + 1600);
      try {
        ExpoSpeech.speak(text, {
          language: 'en-US', rate: opts.rate ?? 1.0, pitch: 1.12,
          onDone: finish, onStopped: finish, onError: finish,
        });
      } catch { finish(); }
    });
  },
  cancel() { try { ExpoSpeech.stop(); } catch { /* ignore */ } },
  setMuted(m: boolean) { this.muted = m; if (m) this.cancel(); },
};

/* backing beat for playAlong (sampled piano approximation of the spec synth) */
const Backing = {
  timers: [] as ReturnType<typeof setTimeout>[],
  bar(chordName: string, barMs: number, force?: boolean) {
    if (!force && !Cues.enabled) return;
    const ch = CHORDS[chordName];
    if (!ch) return;
    const beat = barMs / 4;
    const bass = noteToMidi(ch.left) - 12;
    const triad = ch.right.map(noteToMidi);
    pianoEngine.playMidi(bass, 0.32).catch(() => {});
    this.timers.push(setTimeout(() => pianoEngine.playMidi(bass, 0.26).catch(() => {}), beat * 2));
    for (let b = 0; b < 4; b++) {
      triad.forEach((mm, i) => {
        this.timers.push(setTimeout(() => pianoEngine.playMidi(mm + 12, 0.09).catch(() => {}), b * beat + i * 12));
      });
    }
  },
  stop() { this.timers.forEach(clearTimeout); this.timers = []; },
};

/* ── UI adapter the Lesson screen implements ── */
export interface TicksCtl { fill(n: number): void; success(): void; }
export interface QuizCtl { wrong(i: number, label: string): void; correct(i: number): void; }
export interface FollowCtl { current(i: number, name: string): void; done(i: number): void; all(): void; }
export interface SongCtl { gate(i: number): void; hit(i: number): void; preview(i: number): void; beat(b: number): void; end(): void; }

export interface EngineUI {
  KB: { setDown(note: string, on: boolean): void; clearDowns(): void };
  progress(step: number, seg: number, total: number): void;
  mood(m: string, revertMs: number): void;
  mascotTalking(on: boolean): void;
  mascotAppear(): void;
  typeText(text: string): Promise<void>;
  typeTextInstant(text: string): void;
  setPaused(on: boolean): void;
  setTypePaused(on: boolean): void;
  clearStage(): void;
  clearStageSoon(ms: number): void;
  showTicks(count: number): TicksCtl;
  showQuiz(options: string[], onPick: (i: number) => void): QuizCtl;
  showNext(cb: () => void): void;
  showFollow(n: number): FollowCtl;
  showSong(seg: SongConfig, title: string, showLyrics: boolean): SongCtl;
  awardXP(amount: number, total: number): void;
  completeScreen(xp: number): void;
  hideComplete(): void;
  prefLyrics(): boolean;
}

interface Waiter { init?(): void; down?(note: string, t: number): void; up?(note: string): void; }

export class LessonEngine {
  L: Lesson1; hal: HwFacade; ui: EngineUI;
  stepIdx = 0; run = 0; xp = 0;
  paused = false;
  private waiter: Waiter | null = null;
  private skipFn: (() => void) | null = null;
  private skipAll = false;
  private held = new Map<string, number>();
  private lastInterject = 0;
  private lastLine = '';
  private segSpeaking = false;
  private resumeFn: (() => void) | null = null;
  private trail: { step: number; seg: number }[] = [];

  constructor(lesson: Lesson1, hal: HwFacade, ui: EngineUI) {
    this.L = lesson; this.hal = hal; this.ui = ui;
    hal.onNoteOn((note) => this.noteOn(note));
    hal.onNoteOff((note) => this.noteOff(note));
  }
  private noteOn(note: string) {
    const t = Date.now();
    this.held.set(note, t);
    const w = this.waiter;
    if (w?.down) { try { w.down(note, t); } catch { /* ignore */ } }
  }
  private noteOff(note: string) {
    this.held.delete(note);
    const w = this.waiter;
    if (w?.up) { try { w.up(note); } catch { /* ignore */ } }
  }

  start(step = 0) { void this.gotoStep(step); }
  stop() { this.run++; Speech.cancel(); Backing.stop(); this.hal.ledClear(); }

  async gotoStep(i: number, fromSeg = 0) {
    const tk = ++this.run;
    this.waiter = null; this.skipFn = null; this.skipAll = false;
    this.paused = false;
    if (this.resumeFn) { const r = this.resumeFn; this.resumeFn = null; r(); }
    this.ui.setPaused(false); this.ui.setTypePaused(false);
    Speech.cancel(); this.hal.ledClear(); Backing.stop();
    this.ui.clearStage(); this.ui.hideComplete(); this.ui.mascotTalking(false);
    this.stepIdx = i;
    this.trail = this.trail.filter((e) => e.step < i || (e.step === i && e.seg < fromSeg));
    AsyncStorage.setItem(LS_NS + 'step', String(i)).catch(() => {});
    const step = this.L.steps[i];
    for (let s = 0; s < fromSeg; s++) { // jumping mid-step: rebuild LED state instantly
      const sg = step.segments[s];
      if (sg.type === 'ledOn') this.segLedOn(sg);
      else if (sg.type === 'ledOff') sg.notes === 'all' ? this.hal.ledClear() : this.hal.ledOffMany(sg.notes);
    }
    for (let s = fromSeg; s < step.segments.length; s++) {
      if (this.run !== tk) return;
      while (this.paused) { await this.gate(); if (this.run !== tk) return; }
      const sg = step.segments[s];
      if (sg.type === 'typeSay' || sg.type === 'say' || sg.type === 'sayWithSeq' || sg.type === 'quiz') this.trailPush(i, s);
      this.ui.progress(i, s, step.segments.length);
      try { await this.exec(sg, tk); } catch (e) { console.error('segment failed', sg, e); }
      if (this.run !== tk) return;
      this.skipAll = false;
    }
    this.ui.progress(i, step.segments.length, step.segments.length);
    if (i + 1 < this.L.steps.length) void this.gotoStep(i + 1);
  }

  skip() { const f = this.skipFn; if (f) { this.skipFn = null; f(); } }

  private skippable(promise: Promise<unknown>, onSkip?: () => void): Promise<void> {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        if (this.skipFn === hook) this.skipFn = null;
        this.waiter = null;
        resolve();
      };
      const hook = () => { try { onSkip?.(); } catch { /* ignore */ } finish(); };
      this.skipFn = hook;
      promise.then(finish, finish);
    });
  }
  private waitSegment(setup: (done: () => void) => Waiter | undefined, onSkip?: () => void): Promise<void> {
    let resolveDone!: () => void;
    const p = new Promise<void>((r) => { resolveDone = r; });
    const waiter = setup(() => resolveDone()) ?? {};
    this.waiter = waiter;
    waiter.init?.();
    return this.skippable(p, onSkip);
  }
  private sleep(ms: number, onSkip?: () => void) { return this.skippable(delay(ms), onSkip); }
  private gate(): Promise<void> {
    return this.paused ? new Promise((r) => { this.resumeFn = r; }) : Promise.resolve();
  }

  private async exec(seg: Segment, tk: number): Promise<void> {
    switch (seg.type) {
      case 'mascot': this.ui.mascotAppear(); return this.sleep(400);
      case 'typeSay': return this.typeSay(seg.text, seg.rate);
      case 'say': return this.typeSay(seg.text, seg.rate); // every spoken line is written out
      case 'pause': return this.sleep(seg.ms);
      case 'ledOn': this.segLedOn(seg); return;
      case 'ledOff': seg.notes === 'all' ? this.hal.ledClear() : this.hal.ledOffMany(seg.notes); return;
      case 'sayWithSeq': return this.sayWithSeq(seg);
      case 'waitPressCount': return this.waitPressCount(seg);
      case 'waitPressAll': return this.waitPressAll(seg);
      case 'waitPressOrdered': return this.waitPressOrdered(seg);
      case 'waitPressAny': return this.waitPressAny(seg);
      case 'waitChord': return this.waitChord(seg);
      case 'waitChordCount': return this.waitChordCount(seg, tk);
      case 'followLight': return this.followLight(seg, tk);
      case 'songDemo': return this.songDemo(seg, tk);
      case 'playAlong': return this.playAlong(seg, tk);
      case 'quiz': return this.quiz(seg);
      case 'nextButton': return this.nextButton();
      case 'awardXP': return this.awardXP(seg.amount);
      case 'lessonCompleteScreen':
        AsyncStorage.removeItem(LS_NS + 'step').catch(() => {});
        this.ui.completeScreen(this.xp);
        return;
    }
  }

  /* ---- speech ---- */
  private async typeSay(text: string, rate?: number) {
    this.lastLine = text;
    this.segSpeaking = true;
    this.ui.mascotTalking(true);
    const both = Promise.all([Speech.speak(text, { rate }), this.ui.typeText(text)]);
    await this.skippable(both, () => { Speech.cancel(); this.ui.typeTextInstant(text); });
    this.segSpeaking = false;
    this.ui.mascotTalking(false);
  }
  replayLine() {
    if (this.paused || !this.lastLine || this.segSpeaking) return;
    Speech.cancel();
    this.ui.mascotTalking(true);
    void this.ui.typeText(this.lastLine);
    Speech.speak(this.lastLine).then(() => { if (!this.segSpeaking) this.ui.mascotTalking(false); });
  }
  prevLine() {
    if (this.trail.length > 1) this.trail.pop();
    const t = this.trail[this.trail.length - 1];
    if (t) void this.gotoStep(t.step, t.seg);
  }
  pauseToggle() {
    if (this.paused) {
      this.paused = false;
      this.ui.setPaused(false); this.ui.setTypePaused(false);
      const r = this.resumeFn; this.resumeFn = null; r?.();
    } else {
      this.paused = true;
      this.ui.setPaused(true); this.ui.setTypePaused(true);
      Speech.cancel(); // RN speech can't freeze mid-word; the line resumes at the next segment
    }
  }
  private trailPush(step: number, seg: number) {
    const last = this.trail[this.trail.length - 1];
    if (last && last.step === step && last.seg === seg) return;
    this.trail.push({ step, seg });
    if (this.trail.length > 300) this.trail.shift();
  }
  private sayInterject(text: string) {
    const now = Date.now();
    if (now - this.lastInterject < 1600) return;
    this.lastInterject = now;
    void this.ui.typeText(text);
    this.ui.mascotTalking(true);
    Speech.cancel();
    Speech.speak(text).then(() => this.ui.mascotTalking(false));
  }

  /* ---- LEDs ---- */
  private segLedOn(seg: { notes: string[] | 'all'; color?: string; effect?: string }) {
    if (seg.effect || seg.color === 'rainbow') {
      this.hal.ledEffect(seg.effect ?? 'rainbow', seg.notes === 'all' ? ALL_LED_NOTES : seg.notes);
      return;
    }
    const rgb = LED_RGB[seg.color ?? 'green'] ?? LED_RGB.green;
    const notes = seg.notes === 'all' ? ALL_LED_NOTES : seg.notes;
    this.hal.ledSet(notes.map((n) => ({ note: n, r: rgb[0], g: rgb[1], b: rgb[2] })));
  }
  /* speaks the line in chunks — each note-name/number word is its own
     utterance; its LED lights the instant that word is spoken */
  private async sayWithSeq(seg: { text: string; notes: string[]; color: string; syncPerWord?: boolean; rate?: number }) {
    const rgb = LED_RGB[seg.color] ?? LED_RGB.green;
    const notes = seg.notes;
    this.lastLine = seg.text;
    this.segSpeaking = true;
    this.ui.mascotTalking(true);
    const allOn = () => this.hal.ledSet(notes.map((n) => ({ note: n, r: rgb[0], g: rgb[1], b: rgb[2] })));
    if (!seg.syncPerWord) {
      allOn();
      await this.skippable(
        Promise.all([Speech.speak(seg.text, { rate: seg.rate }), this.ui.typeText(seg.text)]),
        () => { Speech.cancel(); this.ui.typeTextInstant(seg.text); },
      );
    } else {
      this.hal.ledOffMany(notes); // re-light one-by-one even if already lit
      const parts: { text: string; note: number }[] = [];
      const re = /\S+/g; let m: RegExpExecArray | null; let buf = ''; let ni = 0;
      while ((m = re.exec(seg.text))) {
        const cleaned = m[0].replace(/[^A-G0-9#]/g, '');
        if (ni < notes.length && (/^[A-G]$/.test(cleaned) || /^[1-9]$/.test(cleaned))) {
          if (buf) parts.push({ text: buf, note: -1 });
          parts.push({ text: m[0], note: ni++ });
          buf = '';
        } else buf = buf ? `${buf} ${m[0]}` : m[0];
      }
      if (buf) parts.push({ text: buf, note: -1 });
      let cancelled = false;
      const r = this.run;
      const speakSeq = (async () => {
        for (const p of parts) {
          while (this.paused && this.run === r && !cancelled) await this.gate();
          if (cancelled || this.run !== r) return;
          if (p.note >= 0) this.hal.ledOn(notes[p.note], rgb[0], rgb[1], rgb[2]);
          await Speech.speak(p.text, { rate: seg.rate });
        }
      })();
      await this.skippable(
        Promise.all([speakSeq, this.ui.typeText(seg.text)]),
        () => { cancelled = true; Speech.cancel(); this.ui.typeTextInstant(seg.text); },
      );
      allOn();
    }
    this.segSpeaking = false;
    this.ui.mascotTalking(false);
  }

  /* ---- wrong-key feedback (global rule) ---- */
  private wrongKey(note: string, opts?: WrongOpts) {
    this.hal.ledEffect('redFlash', [note]); // C7 has no LED — HAL skips silently
    Cues.wrong();
    this.ui.mood('nervous', 1100);
    if (opts?.say) this.sayInterject(opts.say);
  }

  /* ---- single-key waits ---- */
  private waitPressCount(seg: { note: string; count: number; onWrongKey?: WrongOpts }) {
    const t = this.ui.showTicks(seg.count);
    let n = 0;
    return this.waitSegment((done) => ({
      down: (note) => {
        if (note === seg.note) {
          n++; Cues.correct(); t.fill(n);
          if (n >= seg.count) { t.success(); this.ui.mood('cheer', 1200); this.ui.clearStageSoon(900); done(); }
        } else this.wrongKey(note, seg.onWrongKey);
      },
    }), () => { t.fill(seg.count); t.success(); this.ui.clearStageSoon(300); });
  }
  private waitPressAll(seg: { notes: string[]; turnOffOnPress?: boolean; onWrongKey?: WrongOpts }) {
    const remain = new Set(seg.notes);
    return this.waitSegment((done) => ({
      down: (note) => {
        if (remain.has(note)) {
          remain.delete(note); Cues.tap();
          if (seg.turnOffOnPress) this.hal.ledOff(note);
          if (!remain.size) { this.ui.mood('cheer', 1000); done(); }
        } else if (!seg.notes.includes(note)) this.wrongKey(note, seg.onWrongKey);
      },
    }), () => { this.hal.ledOffMany(seg.notes); });
  }
  private waitPressOrdered(seg: { notes: string[]; turnOffOnPress?: boolean; onWrongOrder?: WrongOpts }) {
    let k = 0;
    return this.waitSegment((done) => ({
      down: (note) => {
        if (note === seg.notes[k]) {
          if (seg.turnOffOnPress) this.hal.ledOff(note);
          k++; Cues.tap();
          if (k >= seg.notes.length) { this.ui.mood('cheer', 1000); done(); }
        } else this.wrongKey(note, seg.onWrongOrder); // LED stays on, red flash only
      },
    }), () => { this.hal.ledOffMany(seg.notes); });
  }
  private waitPressAny(seg: { notes: string[]; onWrongKey?: WrongOpts }) {
    return this.waitSegment((done) => ({
      down: (note) => {
        if (seg.notes.includes(note)) { Cues.correct(); this.ui.mood('cheer', 900); done(); }
        else this.wrongKey(note, seg.onWrongKey);
      },
    }), () => {});
  }

  /* ---- chord waits ----
     success = every target down within `win`, no extra keys held
     (extras ignored during songs). Sloppy attempt → must fully release. */
  private makeChordWaiter(
    targetNotes: string[],
    opts: { win?: number; ignoreWrong?: boolean; allowPreHeld?: boolean; onNotSim?: { say: string }; wrongOpts?: WrongOpts },
    onSuccess: () => void,
  ): Waiter {
    const win = this.hal.chordWindowMs(opts.win ?? CHORD_WINDOW_MS);
    const target = new Set(targetNotes);
    let blocked = false;
    const anyHeld = () => targetNotes.some((n) => this.held.has(n));
    const tryComplete = () => {
      if (blocked) return;
      for (const n of target) if (!this.held.has(n)) return;
      const times = targetNotes.map((n) => this.held.get(n)!);
      const spread = Math.max(...times) - Math.min(...times);
      const extras = [...this.held.keys()].filter((n) => !target.has(n));
      if (spread <= win && (opts.ignoreWrong || extras.length === 0)) {
        blocked = true;
        onSuccess();
      } else {
        blocked = true; // retry only after full release
        if (spread > win && opts.onNotSim) { this.sayInterject(opts.onNotSim.say); this.ui.mood('nervous', 1200); }
      }
    };
    return {
      init: () => {
        if (!anyHeld()) return;
        if (opts.allowPreHeld) tryComplete(); // song look-ahead: early correct hold passes
        else blocked = true;                  // stale hold from last segment: release first
      },
      down: (note) => {
        if (!target.has(note)) { if (!opts.ignoreWrong) this.wrongKey(note, opts.wrongOpts); return; }
        tryComplete();
      },
      up: () => { if (!anyHeld()) blocked = false; },
    };
  }
  private waitChord(seg: { notes: string[]; windowMs: number; onNotSimultaneous?: { say: string } }) {
    return this.waitSegment(
      (done) => this.makeChordWaiter(seg.notes, { win: seg.windowMs, onNotSim: seg.onNotSimultaneous },
        () => { Cues.correct(); this.ui.mood('cheer', 1000); done(); }),
      () => {},
    );
  }
  private async waitChordCount(seg: { notes: string[]; count: number; windowMs: number }, tk: number) {
    const t = this.ui.showTicks(seg.count);
    for (let n = 1; n <= seg.count; n++) {
      await this.waitSegment(
        (done) => this.makeChordWaiter(seg.notes, { win: seg.windowMs }, () => done()),
        () => { this.skipAll = true; },
      );
      if (this.run !== tk) return;
      if (this.skipAll) { t.fill(seg.count); break; }
      Cues.correct(); t.fill(n);
    }
    t.success(); this.ui.mood('cheer', 1200); this.ui.clearStageSoon(900);
  }
  private async followLight(seg: { sequence: { chord: string[] }[]; color: string; windowMs: number; turnOffOnPress?: boolean }, tk: number) {
    const fl = this.ui.showFollow(seg.sequence.length);
    const rgb = LED_RGB[seg.color] ?? LED_RGB.cyan;
    for (let i = 0; i < seg.sequence.length; i++) {
      if (this.run !== tk) return;
      const chord = seg.sequence[i].chord;
      this.hal.ledSet(chord.map((n) => ({ note: n, r: rgb[0], g: rgb[1], b: rgb[2] })));
      fl.current(i, chordDisplayName(chord));
      await this.waitSegment(
        (done) => this.makeChordWaiter(chord, { win: seg.windowMs }, () => done()),
        () => { this.skipAll = true; },
      );
      if (this.run !== tk) return;
      Cues.correct();
      if (seg.turnOffOnPress !== false) this.hal.ledOffMany(chord);
      fl.done(i);
      if (this.skipAll) { fl.all(); this.hal.ledClear(); break; }
      await this.sleep(260);
      if (this.run !== tk) return;
    }
    this.ui.mood('cheer', 1200);
    this.ui.clearStageSoon(700);
  }

  /* ---- play-along songs ---- */
  private lightChord(seg: SongConfig, notes: string[], brightness: number) {
    const rc = LED_RGB[seg.ledColor] ?? LED_RGB.cyan;
    const lc = LED_RGB[seg.leftHandColor ?? 'orange'] ?? LED_RGB.orange;
    this.hal.ledSet(notes.map((n, i) => {
      const c = seg.leftHandColor && i === 0 ? lc : rc; // chordMap puts the left-hand note first
      return { note: n, r: (c[0] * brightness) | 0, g: (c[1] * brightness) | 0, b: (c[2] * brightness) | 0 };
    }));
  }
  private async songDemo(seg: SongConfig, tk: number) {
    const chart = seg.chart;
    const showLyrics = seg.displayMode === 'lyrics' && this.ui.prefLyrics();
    const ctrl = this.ui.showSong(seg, `Demo · ${SONG_TITLES[seg.song] ?? 'Song'}`, showLyrics);
    const barMs = (60000 / SONG_BPM) * SONG_BEATS;
    this.ui.mood('conduct', 0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const skipHook = () => { this.skipAll = true; };
    for (let i = 0; i < chart.length; i++) {
      if (this.run !== tk || this.skipAll) break;
      while (this.paused && this.run === tk) await this.gate();
      if (this.run !== tk || this.skipAll) break;
      const notes = seg.chordMap[chart[i].chord];
      this.lightChord(seg, notes, 1);
      ctrl.gate(i); ctrl.hit(i);
      notes.forEach((n) => { pianoEngine.playMidi(noteToMidi(n), 0.5).catch(() => {}); this.ui.KB.setDown(n, true); });
      timers.push(setTimeout(() => notes.forEach((n) => this.ui.KB.setDown(n, false)), barMs * 0.65));
      Backing.bar(chart[i].chord, barMs, true); // beat always on for the demo
      for (let b = 0; b < SONG_BEATS; b++) timers.push(setTimeout(() => ctrl.beat(b), (b * barMs) / SONG_BEATS));
      await this.sleep(barMs, skipHook);
      if (this.run !== tk) break;
      const keep = chart[i + 1] ? seg.chordMap[chart[i + 1].chord] : [];
      this.hal.ledOffMany(notes.filter((n) => !keep.includes(n)));
    }
    timers.forEach(clearTimeout);
    Backing.stop();
    this.hal.ledClear();
    this.ui.KB.clearDowns();
    ctrl.end();
    this.ui.mood('teach', 0);
    this.ui.clearStageSoon(600);
  }
  private async playAlong(seg: SongConfig, tk: number) {
    const chart = seg.chart;
    const showLyrics = seg.displayMode === 'lyrics' && this.ui.prefLyrics();
    const ctrl = this.ui.showSong(seg, SONG_TITLES[seg.song] ?? 'Song', showLyrics);
    const barMs = (60000 / SONG_BPM) * SONG_BEATS;
    const look = seg.ledLookAheadMs || 500;
    this.ui.mood('conduct', 0);
    const beatTimers: ReturnType<typeof setTimeout>[] = [];
    const skipHook = () => { this.skipAll = true; };
    for (let i = 0; i < chart.length; i++) {
      if (this.run !== tk) break;
      const notes = seg.chordMap[chart[i].chord];
      this.lightChord(seg, notes, 1);
      this.hal.ledEffect('pulse', notes); // pulse until the right chord lands
      ctrl.gate(i);
      await this.waitSegment(
        (done) => this.makeChordWaiter(notes, { win: seg.windowMs, ignoreWrong: true, allowPreHeld: true }, () => done()),
        skipHook,
      );
      if (this.run !== tk || this.skipAll) break;
      this.lightChord(seg, notes, 1); // solid again (stops pulse)
      ctrl.hit(i);
      Backing.bar(chart[i].chord, barMs);
      for (let b = 0; b < SONG_BEATS; b++) beatTimers.push(setTimeout(() => ctrl.beat(b), (b * barMs) / SONG_BEATS));
      await this.sleep(barMs - look, skipHook);
      if (this.run !== tk || this.skipAll) break;
      const next = chart[i + 1];
      if (next) { this.lightChord(seg, seg.chordMap[next.chord], 0.35); ctrl.preview(i + 1); } // 500ms dim look-ahead
      await this.sleep(look, skipHook);
      if (this.run !== tk || this.skipAll) break;
      const keep = next ? seg.chordMap[next.chord] : [];
      this.hal.ledOffMany(notes.filter((n) => !keep.includes(n)));
    }
    beatTimers.forEach(clearTimeout);
    Backing.stop();
    this.hal.ledClear();
    ctrl.end();
    this.ui.mood('teach', 0);
    this.ui.clearStageSoon(900);
  }

  /* ---- quiz / flow / rewards ---- */
  private async quiz(seg: { question: string; options: string[]; answer: number; onWrong?: { label: string }; onCorrect?: { typeSay: string } }) {
    this.lastLine = seg.question;
    void this.ui.typeText(seg.question);
    void Speech.speak(seg.question);
    this.ui.mascotTalking(true);
    setTimeout(() => this.ui.mascotTalking(false), Speech.estimate(seg.question));
    let api: QuizCtl | null = null;
    await this.waitSegment((done) => {
      api = this.ui.showQuiz(seg.options, (idx) => {
        if (idx === seg.answer) {
          api?.correct(idx); Cues.chime(); this.ui.mood('cheer', 1400);
          setTimeout(done, 750);
        } else {
          api?.wrong(idx, seg.onWrong?.label ?? 'Incorrect'); Cues.wrong(); this.ui.mood('nervous', 1100);
        }
      });
      return {};
    }, () => { api?.correct(seg.answer); });
    if (seg.onCorrect?.typeSay) await this.typeSay(seg.onCorrect.typeSay);
    this.ui.clearStageSoon(300);
  }
  private async nextButton() {
    await this.waitSegment((done) => { this.ui.showNext(() => done()); return {}; }, () => {});
    this.ui.clearStage();
  }
  private async awardXP(amount: number) {
    this.xp += amount;
    this.ui.awardXP(amount, this.xp);
    Cues.success();
    await this.sleep(1700);
  }
}
