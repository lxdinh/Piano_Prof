// ════════════════════════════════════════════════════════════════
//  Piano Professor v0.8.6 — web UI reference
//  Mirrors the Flutter app structure (HomeShell → 4 tabs, LessonScreen).
//  No audio; visual-only reference for React development.
// ════════════════════════════════════════════════════════════════

// ── STATE ────────────────────────────────────────────────────────────────────
const state = {
  streak: 0, xp: 0, gems: 0, hearts: 5,
  todayXp: 0, dailyGoal: 30,
  completed: new Set(), stars: {},     // lessonId → 0-3
  currentLesson: null, currentStep: 0,
  litMidi: {},                          // midi → color string
};

// ── NOTE MAPPING (mirrors note_mapping.dart) ─────────────────────────────────
const NOTE_NAMES = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
function midiFreq(m){ return 440 * Math.pow(2, (m - 69) / 12); }
function isBlack(m){ return [1,3,6,8,10].includes(m % 12); }

const NOTE_TO_MIDI = {};
for (let oct = 2; oct <= 6; oct++) {
  for (let i = 0; i < 12; i++) {
    const midi = (oct + 1) * 12 + i;
    NOTE_TO_MIDI[NOTE_NAMES[i] + oct] = midi;
  }
}

function colorHex(name) {
  const map = { cyan:'#5BB8E3', orange:'#FF7A1C', green:'#58CC02',
                yellow:'#F5B800', red:'#FF4B4B', white:'#FFFFFF' };
  return map[name] || '#5BB8E3';
}

// ── GAMIFICATION ─────────────────────────────────────────────────────────────
function load() {
  try {
    const s = JSON.parse(localStorage.getItem('pp_state') || '{}');
    if (s.streak !== undefined)   state.streak   = s.streak;
    if (s.xp !== undefined)       state.xp       = s.xp;
    if (s.gems !== undefined)     state.gems     = s.gems;
    if (s.hearts !== undefined)   state.hearts   = s.hearts;
    if (s.todayXp !== undefined)  state.todayXp  = s.todayXp;
    if (s.completed) state.completed = new Set(s.completed);
    if (s.stars)     state.stars     = s.stars;
  } catch (_) {}
}
function save() {
  localStorage.setItem('pp_state', JSON.stringify({
    streak:state.streak, xp:state.xp, gems:state.gems, hearts:state.hearts,
    todayXp:state.todayXp, completed:[...state.completed], stars:state.stars,
  }));
}
function addXP(n) {
  state.xp += n; state.todayXp += n;
  if (state.todayXp >= state.dailyGoal && state.todayXp - n < state.dailyGoal) state.streak++;
  save(); refreshStats();
}
function loseHeart() {
  if (state.hearts > 0) state.hearts--;
  save(); refreshStats();
}
function refreshStats() {
  document.getElementById('stat-streak').textContent = state.streak;
  document.getElementById('stat-xp').textContent     = state.xp;
  document.getElementById('stat-gems').textContent   = state.gems;
  document.getElementById('stat-hearts').textContent = state.hearts;
  const pct = Math.min(1, state.todayXp / state.dailyGoal);
  const bar = document.getElementById('goal-bar');
  if (bar) { bar.style.width = (pct * 100) + '%'; bar.classList.toggle('met', pct >= 1); }
  const lbl = document.getElementById('goal-label');
  if (lbl) lbl.textContent = `${state.todayXp}/${state.dailyGoal} XP`;
  const ico = document.getElementById('goal-icon');
  if (ico) ico.textContent = pct >= 1 ? '🏆' : '🏁';
  if (document.getElementById('screen-profile').classList.contains('active')) renderProfile();
}

// ── TAB SWITCHING ─────────────────────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.screen[id^="screen-"]').forEach(s => {
    if (s.id === 'screen-lesson') return;
    s.classList.toggle('active', s.id === 'screen-' + tab);
  });
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab));
  if (tab === 'profile') renderProfile();
}

// ── LESSON PATH ───────────────────────────────────────────────────────────────
const KIND_ICON = { concept:'💡', song:'🎵', exercise:'💪' };

function renderPath() {
  const container = document.getElementById('path-list');
  container.innerHTML = '';

  // Determine current lesson (first authored, not completed)
  let currentId = null;
  for (const m of LESSON_CATALOG) {
    if (m.authored && !state.completed.has(m.id)) { currentId = m.id; break; }
  }
  // Build ordered index for lock logic
  const catalogIndex = {};
  LESSON_CATALOG.forEach((m, i) => catalogIndex[m.id] = i);
  const currentIdx = currentId ? catalogIndex[currentId] : LESSON_CATALOG.length;

  for (const level of LEVELS) {
    // Level header
    const lh = document.createElement('div');
    lh.className = 'level-header';
    lh.innerHTML = `
      <div class="level-header-row">
        <div class="level-idx">${level.index}</div>
        <div class="level-name">${level.name}</div>
      </div>
      <div class="level-obj">${level.objective}</div>
      <div class="level-dur">⏱ ${level.duration}</div>`;
    container.appendChild(lh);

    // Lesson nodes for this level
    const levelLessons = LESSON_CATALOG.filter(m => m.levelId === level.id);
    for (const m of levelLessons) {
      const done      = state.completed.has(m.id);
      const isCurrent = m.id === currentId;
      const comingSoon= !m.authored;
      const idx       = catalogIndex[m.id];
      const locked    = !done && !isCurrent && !comingSoon && idx > currentIdx;

      const node = document.createElement('div');
      const stateClass = done ? 'done' : isCurrent ? 'current' : comingSoon ? 'soon' : locked ? 'locked' : '';
      node.className = 'lesson-node ' + stateClass;
      node.dataset.id = m.id;

      // Icon
      const iconEl = document.createElement('div');
      iconEl.className = 'node-icon';
      iconEl.textContent = done ? '✓' : comingSoon ? '🕐' : locked ? '🔒' : KIND_ICON[m.kind] || '💡';
      node.appendChild(iconEl);

      // Body
      const body = document.createElement('div');
      body.className = 'node-body';
      const title = document.createElement('div');
      title.className = 'node-title';
      title.textContent = m.title;
      body.appendChild(title);
      if (done && (state.stars[m.id] || 0) > 0) {
        const stars = document.createElement('div');
        stars.className = 'node-stars';
        for (let i = 0; i < 3; i++) stars.innerHTML += `<span>${i < state.stars[m.id] ? '⭐' : '☆'}</span>`;
        body.appendChild(stars);
      }
      node.appendChild(body);

      // Right slot
      if (isCurrent) {
        const btn = document.createElement('button');
        btn.className = 'chunky-btn butter-btn';
        btn.textContent = 'Start';
        btn.onclick = (e) => { e.stopPropagation(); openLesson(m.id); };
        node.appendChild(btn);
      } else if (comingSoon) {
        const chip = document.createElement('div');
        chip.className = 'node-chip';
        chip.textContent = 'SOON';
        node.appendChild(chip);
      }

      // Click handler
      if (!locked && !comingSoon) {
        node.addEventListener('click', () => openLesson(m.id));
      } else if (locked) {
        node.addEventListener('click', () =>
          alert('Finish the earlier lessons to unlock this one.'));
      } else {
        node.addEventListener('click', () =>
          alert('Full lesson coming soon! 🎵'));
      }

      container.appendChild(node);
    }
  }

  const footer = document.createElement('div');
  footer.className = 'mastery-footer';
  footer.textContent = '~ MASTERY ~';
  container.appendChild(footer);
}

// ── LESSON SCREEN ─────────────────────────────────────────────────────────────
let lessonId = null;
let lessonSteps = [];
let stepIdx = 0;

function openLesson(id) {
  lessonId = id;
  lessonSteps = (id === 'g1') ? G1_STEPS : [];
  stepIdx = 0;
  state.litMidi = {};

  document.getElementById('screen-lesson').style.display = 'flex';
  document.querySelector('.bottom-nav').style.display = 'none';
  showStep();
}

function closeLesson() {
  document.getElementById('screen-lesson').style.display = 'none';
  document.querySelector('.bottom-nav').style.display = 'flex';
  state.litMidi = {};
  drawPiano();
  renderPath();
}

function replayStep() { showStep(); }

function showStep() {
  if (stepIdx >= lessonSteps.length) { showComplete(); return; }
  const step = lessonSteps[stepIdx];
  const total = lessonSteps.length;

  // Progress bar
  document.getElementById('lesson-prog').style.width = ((stepIdx / total) * 100) + '%';
  document.getElementById('lesson-hearts').textContent = state.hearts;

  // Mascot mood
  setMascotMood(step.complete ? 'trophy' : step.quiz ? 'wow' : 'teach');

  // Speech
  document.getElementById('speech-text').textContent = step.text;

  // Chord chips
  const chips = document.getElementById('chord-chips');
  chips.innerHTML = '';
  state.litMidi = {};
  if (step.chords) {
    step.chords.forEach((chord, ci) => {
      chord.notes.forEach(name => {
        const m = NOTE_TO_MIDI[name];
        if (m !== undefined) state.litMidi[m] = chord.color;
        const chip = document.createElement('div');
        chip.className = 'chord-chip' + (ci > 0 ? ' alt' : '');
        chip.textContent = name;
        chips.appendChild(chip);
      });
    });
  }
  drawPiano();

  // Quiz
  const quizArea = document.getElementById('quiz-area');
  quizArea.innerHTML = '';
  document.getElementById('wrong-msg').style.display = 'none';
  document.getElementById('complete-area').innerHTML = '';

  if (step.quiz) {
    renderQuiz(step.quiz);
    document.getElementById('lesson-bottom').style.display = 'none';
  } else {
    document.getElementById('lesson-bottom').style.display = 'flex';
    const cont = document.getElementById('continue-btn');
    cont.classList.toggle('dim', false);
  }

  if (step.complete) {
    document.getElementById('lesson-bottom').style.display = 'none';
    showComplete();
    return;
  }

  document.getElementById('lesson-scroll').scrollTop = 0;
}

function nextStep() {
  stepIdx++;
  showStep();
}

function renderQuiz(quiz) {
  const area = document.getElementById('quiz-area');
  area.innerHTML = '';
  if (quiz.type === 'mcq') {
    const opts = document.createElement('div');
    opts.className = 'quiz-opts';
    quiz.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt';
      btn.textContent = opt;
      btn.onclick = () => {
        opts.querySelectorAll('button').forEach(b => b.disabled = true);
        const correct = opt === quiz.answer;
        btn.classList.add(correct ? 'correct' : 'wrong');
        if (!correct) {
          const ans = Array.from(opts.querySelectorAll('button')).find(b => b.textContent === quiz.answer);
          if (ans) ans.classList.add('correct');
          loseHeart();
          document.getElementById('wrong-msg').style.display = 'block';
          setTimeout(() => {
            document.getElementById('wrong-msg').style.display = 'none';
            stepIdx++;
            showStep();
          }, 1800);
        } else {
          addXP(10);
          setTimeout(() => { stepIdx++; showStep(); }, 800);
        }
      };
      opts.appendChild(btn);
    });
    area.appendChild(opts);
  }
}

function showComplete() {
  // Mark lesson done
  if (lessonId) {
    state.completed.add(lessonId);
    const stars = 3; // full stars for demo
    state.stars[lessonId] = stars;
    addXP(50);
    state.gems += 5;
    save();
  }

  document.getElementById('lesson-prog').style.width = '100%';
  setMascotMood('cheer');
  document.getElementById('speech-text').textContent = "Amazing work! Grade 1 complete. You earned 50 XP!";
  document.getElementById('chord-chips').innerHTML = '';
  document.getElementById('quiz-area').innerHTML = '';
  document.getElementById('wrong-msg').style.display = 'none';
  document.getElementById('piano-wrap').style.display = 'none';

  const area = document.getElementById('complete-area');
  area.innerHTML = `
    <div class="reward-card">
      <div class="reward-stars"><span>⭐</span><span>⭐</span><span>⭐</span></div>
      <div class="reward-row">
        <div class="reward-item"><div class="ri-icon">⚡</div><div class="ri-val">+50</div><div class="ri-lbl">XP</div></div>
        <div class="reward-item"><div class="ri-icon">💎</div><div class="ri-val">+5</div><div class="ri-lbl">GEMS</div></div>
        <div class="reward-item"><div class="ri-icon">🔥</div><div class="ri-val">${state.streak}</div><div class="ri-lbl">STREAK</div></div>
      </div>
      ${state.todayXp >= state.dailyGoal ? '<div class="daily-goal-badge">🎯 Daily goal complete!</div>' : ''}
    </div>`;

  const bottom = document.getElementById('lesson-bottom');
  bottom.style.display = 'flex';
  bottom.innerHTML = `<button class="chunky-btn primary large lesson-continue" onclick="closeLesson()">Finish</button>`;
}

// ── MASCOT MOOD ───────────────────────────────────────────────────────────────
function setMascotMood(mood) {
  const img = document.getElementById('mascot-img');
  const fb  = document.getElementById('mascot-fallback');
  if (!img) return;
  img.src = `../assets/mascots/${mood}.png`;
  img.onerror = () => { img.style.display = 'none'; if (fb) fb.style.display = 'block'; };
  img.onload  = () => { img.style.display = 'block'; if (fb) fb.style.display = 'none'; };
}

// ── PIANO CANVAS (mirrors _KeyboardPainter in pp_keyboard.dart) ───────────────
const LOW_MIDI  = 36; // C2
const HIGH_MIDI = 95; // B6
const LED_H     = 18; // matches PpKeyboard.ledStripH

function getWhites() {
  const w = [];
  for (let m = LOW_MIDI; m <= HIGH_MIDI; m++) if (!isBlack(m)) w.push(m);
  return w;
}

function drawPiano() {
  const canvas = document.getElementById('piano-canvas');
  if (!canvas) return;
  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;
  if (W === 0 || H === 0) return;
  canvas.width  = W * devicePixelRatio;
  canvas.height = H * devicePixelRatio;
  const ctx = canvas.getContext('2d');
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const whites = getWhites();
  const ww = W / whites.length;
  const keyH  = H - LED_H;
  const blackH = keyH * 0.62;
  const blackW = ww * 0.62;
  const indexOfWhite = {};
  whites.forEach((m, i) => indexOfWhite[m] = i);

  // Background (piano-black behind LED strip)
  ctx.fillStyle = '#1A1410';
  ctx.roundRect(0, 0, W, H, 14);
  ctx.fill();

  // White keys
  for (let i = 0; i < whites.length; i++) {
    const m   = whites[i];
    const lit = state.litMidi[m];
    const x   = i * ww;
    ctx.fillStyle = lit ? '#FFFAEC' : '#FFFAEC';
    ctx.fillRect(x, LED_H, ww - 0.5, keyH);
    if (lit) {
      ctx.fillStyle = colorHex(lit) + '4D'; // 30% opacity tint
      ctx.fillRect(x, LED_H, ww - 0.5, keyH);
    }
    ctx.strokeStyle = '#1A1410';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(x, LED_H, ww - 0.5, keyH);

    // C label
    if (m % 12 === 0) {
      const oct = Math.floor(m / 12) - 1;
      const label = 'C' + oct;
      const isMiddle = m === 60;
      ctx.fillStyle = isMiddle ? '#C2410C' : '#7C6446';
      ctx.font = (isMiddle ? '900 9.5px' : '700 8.5px') + " 'Nunito', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(label, x + ww / 2, H - 5);
    }
  }

  // Black keys
  for (let m = LOW_MIDI; m <= HIGH_MIDI; m++) {
    if (!isBlack(m)) continue;
    const lw = indexOfWhite[m - 1];
    if (lw == null) continue;
    const x   = (lw + 1) * ww - blackW / 2;
    const lit = state.litMidi[m];
    ctx.fillStyle = '#1A1410';
    ctx.fillRect(x, LED_H, blackW, blackH);
    if (lit) {
      ctx.fillStyle = colorHex(lit) + '8C'; // 55% opacity
      ctx.fillRect(x, LED_H, blackW, blackH);
    }
  }

  // LED dot strip
  const cy = LED_H / 2;
  const radius = Math.max(2, Math.min(5, ww * 0.16));
  const dim = '#2A2A2A';

  function dot(cx, lit) {
    if (!lit) {
      ctx.fillStyle = dim;
      ctx.beginPath(); ctx.arc(cx, cy, radius * 0.8, 0, Math.PI * 2); ctx.fill();
      return;
    }
    const hex = colorHex(lit);
    // Glow
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2.5);
    grd.addColorStop(0, hex + 'CC');
    grd.addColorStop(1, hex + '00');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(cx, cy, radius * 2.5, 0, Math.PI * 2); ctx.fill();
    // Dot body
    ctx.fillStyle = hex;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
    // White highlight
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(cx, cy, radius * 0.42, 0, Math.PI * 2); ctx.fill();
  }

  // White-key dots
  for (let i = 0; i < whites.length; i++) {
    dot(i * ww + ww / 2, state.litMidi[whites[i]]);
  }
  // Black-key dots
  for (let m = LOW_MIDI; m <= HIGH_MIDI; m++) {
    if (!isBlack(m)) continue;
    const lw = indexOfWhite[m - 1];
    if (lw == null) continue;
    dot((lw + 1) * ww, state.litMidi[m]);
  }
}

// Piano touch/click → highlight key
function setupPianoInteraction() {
  const canvas = document.getElementById('piano-canvas');
  if (!canvas) return;

  function midiAt(x, y) {
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    const whites = getWhites();
    const ww = W / whites.length;
    const keyH  = H - LED_H;
    const blackH = keyH * 0.62;
    const blackW = ww * 0.62;
    const indexOfWhite = {};
    whites.forEach((m, i) => indexOfWhite[m] = i);

    // Check black keys first (they're on top)
    if (y >= LED_H && y <= LED_H + blackH) {
      for (let m = LOW_MIDI; m <= HIGH_MIDI; m++) {
        if (!isBlack(m)) continue;
        const lw = indexOfWhite[m - 1];
        if (lw == null) continue;
        const kx = (lw + 1) * ww - blackW / 2;
        if (x >= kx && x <= kx + blackW) return m;
      }
    }
    const i = Math.floor(x / ww);
    return whites[Math.max(0, Math.min(whites.length - 1, i))];
  }

  function onDown(x, y) {
    const m = midiAt(x, y);
    if (m == null) return;
    state.litMidi[m] = 'green';
    drawPiano();
    // Key quiz answer check
    if (window._quizTarget === m) {
      window._quizTarget = null;
      addXP(10);
      setTimeout(() => { stepIdx++; showStep(); }, 600);
    }
  }
  function onUp() {
    // Only clear green (user-pressed) dots, not lesson-set ones
    Object.keys(state.litMidi).forEach(k => {
      if (state.litMidi[k] === 'green') delete state.litMidi[k];
    });
    drawPiano();
  }

  canvas.addEventListener('mousedown', e => {
    const r = canvas.getBoundingClientRect();
    onDown(e.clientX - r.left, e.clientY - r.top);
  });
  canvas.addEventListener('mouseup',   onUp);
  canvas.addEventListener('mouseleave', onUp);
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const t = e.touches[0];
    onDown(t.clientX - r.left, t.clientY - r.top);
  }, { passive: false });
  canvas.addEventListener('touchend', onUp);
}

// ── PROFILE SCREEN ────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id:'first_steps',   title:'First Steps',   emoji:'🎓', color:'#58CC02', metric:'lessons',       threshold:1  },
  { id:'getting_started',title:'Getting Started',emoji:'📖',color:'#5BB8E3', metric:'lessons',       threshold:5  },
  { id:'dedicated',     title:'Dedicated',     emoji:'👑', color:'#F5B800', metric:'lessons',       threshold:10 },
  { id:'on_fire',       title:'On Fire',       emoji:'🔥', color:'#FF7A1C', metric:'streak',        threshold:3  },
  { id:'week_warrior',  title:'Week Warrior',  emoji:'💥', color:'#C2410C', metric:'streak',        threshold:7  },
  { id:'perfectionist', title:'Perfectionist', emoji:'⭐', color:'#F5B800', metric:'perfectLessons',threshold:5  },
  { id:'songbird',      title:'Songbird',      emoji:'🎵', color:'#8B5CF6', metric:'songs',         threshold:5  },
  { id:'virtuoso',      title:'Virtuoso',      emoji:'⚡', color:'#FF7A9C', metric:'xp',            threshold:250},
];

function renderProfile() {
  const lessons         = state.completed.size;
  const perfectLessons  = Object.values(state.stars).filter(s => s >= 3).length;
  const songs           = [...state.completed].filter(id =>
    (LESSON_CATALOG.find(m => m.id === id) || {}).kind === 'song').length;
  const stats = { lessons, perfectLessons, songs, streak: state.streak, xp: state.xp };

  const achievements = ACHIEVEMENTS.map(a => ({
    ...a,
    current: stats[a.metric] || 0,
    unlocked: (stats[a.metric] || 0) >= a.threshold,
  }));
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const body = document.getElementById('profile-body');
  body.innerHTML = `
    <div class="profile-hero">
      <div class="mascot-profile">
        <img src="../assets/mascots/cheer.png" alt=""
             onerror="this.style.display='none';this.nextSibling.style.display='block'">
        <span style="display:none">🐧</span>
      </div>
      <div>
        <div class="profile-handle">Piano Learner</div>
        <div class="plan-badge free">FREE PLAN</div>
      </div>
    </div>

    <div class="profile-stats">
      <div class="pstat"><span class="pstat-e">🔥</span><span class="pstat-v">${state.streak}</span><span class="pstat-l">STREAK</span></div>
      <div class="pstat"><span class="pstat-e">⭐</span><span class="pstat-v">${state.xp}</span><span class="pstat-l">XP</span></div>
      <div class="pstat"><span class="pstat-e">💎</span><span class="pstat-v">${state.gems}</span><span class="pstat-l">GEMS</span></div>
      <div class="pstat"><span class="pstat-e">❤️</span><span class="pstat-v">${state.hearts}</span><span class="pstat-l">HEARTS</span></div>
    </div>

    <div class="pp-card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:20px">⭐</span>
        <span style="font-size:16px;font-weight:900">Go Premium</span>
      </div>
      <div style="font-size:14px;font-weight:700;color:var(--ink-500);margin-bottom:12px">
        Unlimited hearts, OMR uploads, and AI feedback.
      </div>
      <button class="chunky-btn butter-btn expand">See plans</button>
    </div>

    <div class="pp-card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="font-size:20px">🏅</span>
        <span style="font-size:16px;font-weight:900;flex:1">Achievements</span>
        <span style="font-size:13px;font-weight:900;color:var(--ink-500)">${unlockedCount}/${achievements.length}</span>
      </div>
      <div class="ach-grid">
        ${achievements.map(a => `
          <div class="badge-item">
            <div class="badge-circle ${a.unlocked ? 'on' : ''}"
                 style="${a.unlocked ? `background:${a.color};border-color:${a.color}` : ''}">
              ${a.emoji}
            </div>
            <div class="badge-title">${a.title}</div>
            ${!a.unlocked ? `<div class="badge-prog">${a.current}/${a.threshold}</div>` : ''}
          </div>`).join('')}
      </div>
    </div>

    <div class="pp-card" style="padding:0">
      <div class="settings-tile"><span class="stile-icon">🔵</span><span class="stile-label">Piano Lights (LED strip)</span><span class="stile-arrow">›</span></div>
      <div class="settings-tile"><span class="stile-icon">📄</span><span class="stile-label">OMR scan server</span><span class="stile-arrow">›</span></div>
      <div class="settings-tile"><span class="stile-icon">🎤</span><span class="stile-label">AI Voice (Google Gemini)</span><span class="stile-arrow">›</span></div>
      <div class="settings-tile"><span class="stile-icon">❓</span><span class="stile-label">Help center</span><span class="stile-arrow">›</span></div>
      <div class="settings-tile"><span class="stile-icon">🔒</span><span class="stile-label">Terms &amp; privacy</span><span class="stile-arrow">›</span></div>
    </div>

    <div class="version-footer">Piano Professor v0.8.6 · made with ♥ for slow learners</div>
  `;
}

// ── INIT ──────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  load();
  refreshStats();
  renderPath();
  setupPianoInteraction();
  drawPiano();

  // Re-draw piano on resize
  window.addEventListener('resize', () => {
    drawPiano();
    // Re-render piano wrap visibility
    const wrap = document.getElementById('piano-wrap');
    if (wrap && wrap.style.display !== 'none') drawPiano();
  });
});
