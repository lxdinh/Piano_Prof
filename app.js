// ══════════════════════════════════════════════
//  SPEECH ENGINE — ElevenLabs neural TTS
//  Falls back to Web Speech API if no key set
// ══════════════════════════════════════════════

// ElevenLabs config — user sets key once, saved to localStorage
const EL_VOICES = {
  'Rachel (Female, calm)':  '21m00Tio9RAMJtAXASs3a',
  'Adam (Male, deep)':      'pNInz6obpgDQGcFmaJgB',
  'Antoni (Male, warm)':    'ErXwobaYiN019PkySvjV',
  'Bella (Female, warm)':   'EXAVITQu4vr4xnSDxMaL',
  'Josh (Male, young)':     'TxGEqnHWrfWFTfGW9XjX',
};
let EL_KEY = localStorage.getItem('el_key') || '';
let EL_VOICE_ID = localStorage.getItem('el_voice') || '21m00Tio9RAMJtAXASs3a'; // Rachel — calm, clear
const audioCache = new Map(); // in-memory L1 cache (per session)

// Persistent voice cache (IndexedDB) — survives reloads, saves ElevenLabs TTS quota
const VOICE_DB='luminakeys-voice', VOICE_STORE='clips';
let _voiceDB=null;
function _openVoiceDB(){
  return new Promise((resolve,reject)=>{
    if(_voiceDB) return resolve(_voiceDB);
    const req=indexedDB.open(VOICE_DB,1);
    req.onupgradeneeded=()=>req.result.createObjectStore(VOICE_STORE);
    req.onsuccess=()=>{ _voiceDB=req.result; resolve(_voiceDB); };
    req.onerror=()=>reject(req.error);
  });
}
async function voiceCacheGet(key){
  try{
    const db=await _openVoiceDB();
    return await new Promise((resolve,reject)=>{
      const r=db.transaction(VOICE_STORE,'readonly').objectStore(VOICE_STORE).get(key);
      r.onsuccess=()=>resolve(r.result||null);
      r.onerror=()=>reject(r.error);
    });
  }catch(e){ return null; }
}
async function voiceCachePut(key,blob){
  try{
    const db=await _openVoiceDB();
    db.transaction(VOICE_STORE,'readwrite').objectStore(VOICE_STORE).put(blob,key);
  }catch(e){}
}
let currentAudio = null;

function saveELSettings(key, voiceId){
  EL_KEY = key.trim(); EL_VOICE_ID = voiceId;
  localStorage.setItem('el_key', EL_KEY);
  localStorage.setItem('el_voice', EL_VOICE_ID);
}

// Fallback: Web Speech API
let _wsvVoices=[], _bestVoice=null;
const _loadVoices=()=>{
  _wsvVoices=speechSynthesis.getVoices();
  const picks=[v=>v.name==='Google US English',v=>v.name.includes('Samantha'),v=>v.name.includes('Google')&&v.lang.startsWith('en'),v=>v.lang.startsWith('en-US'),v=>v.lang.startsWith('en')];
  for(const p of picks){const f=_wsvVoices.find(p);if(f){_bestVoice=f;break;}}
};
speechSynthesis.onvoiceschanged=_loadVoices; _loadVoices();

function _fallbackSay(text, onEnd){
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.voice=_bestVoice; u.rate=0.9; u.pitch=1.05; u.volume=1;
  u.onstart=()=>setAvatar(true);
  u.onend=()=>{ setAvatar(false); if(!_segStop&&onEnd) onEnd(); };
  u.onerror=()=>{ setAvatar(false); if(!_segStop&&onEnd) onEnd(); };
  speechSynthesis.speak(u);
}

async function _elSay(text, onEnd){
  const cacheKey = EL_VOICE_ID+':'+text;
  let blobUrl = audioCache.get(cacheKey);
  if(!blobUrl){
    const stored = await voiceCacheGet(cacheKey);
    if(stored){ blobUrl = URL.createObjectURL(stored); audioCache.set(cacheKey, blobUrl); }
  }
  if(!blobUrl){
    try{
      const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${EL_VOICE_ID}/stream`,{
        method:'POST',
        headers:{'xi-api-key':EL_KEY,'Content-Type':'application/json','Accept':'audio/mpeg'},
        body:JSON.stringify({
          text,
          model_id:'eleven_multilingual_v2',
          voice_settings:{ stability:0.35, similarity_boost:0.88, style:0.45, use_speaker_boost:true }
        })
      });
      if(!resp.ok) throw new Error('EL API '+resp.status);
      const blob = await resp.blob();
      blobUrl = URL.createObjectURL(blob);
      audioCache.set(cacheKey, blobUrl);
      voiceCachePut(cacheKey, blob);
    }catch(e){
      console.warn('ElevenLabs failed, falling back:',e);
      _fallbackSay(text, onEnd); return;
    }
  }
  if(_segStop){ if(onEnd) onEnd(); return; }
  if(currentAudio){ currentAudio.pause(); currentAudio=null; }
  const audio = new Audio(blobUrl);
  currentAudio = audio;
  audio.onplay = ()=>setAvatar(true);
  audio.onended = ()=>{ setAvatar(false); currentAudio=null; if(!_segStop&&onEnd) onEnd(); };
  audio.onerror = ()=>{ setAvatar(false); currentAudio=null; if(!_segStop&&onEnd) onEnd(); };
  audio.play();
}

let _segStop=false;
function stopAll(){
  _segStop=true;
  speechSynthesis.cancel();
  if(currentAudio){ currentAudio.pause(); currentAudio=null; }
  setAvatar(false); clearSeq();
}
const LUMI_SVG = `<svg class="lumi" viewBox="0 0 100 100">
  <g class="lumi-ears">
    <polygon class="lumi-ear" points="25,34 32,12 48,31"/>
    <polygon class="lumi-ear" points="75,34 68,12 52,31"/>
    <polygon class="lumi-ear-in" points="31,30 34,19 42,29"/>
    <polygon class="lumi-ear-in" points="69,30 66,19 58,29"/>
  </g>
  <circle class="lumi-head" cx="50" cy="56" r="32"/>
  <g class="lumi-eyes">
    <ellipse class="lumi-eye" cx="39" cy="53" rx="6" ry="7.5"/>
    <ellipse class="lumi-eye" cx="61" cy="53" rx="6" ry="7.5"/>
    <circle class="lumi-shine" cx="41" cy="50" r="2"/>
    <circle class="lumi-shine" cx="63" cy="50" r="2"/>
  </g>
  <path class="lumi-happy" d="M33 54 q6 -8 12 0 M55 54 q6 -8 12 0"/>
  <polygon class="lumi-nose" points="50,65 46,60 54,60"/>
  <path class="lumi-mouth" d="M50 65 q-5 6 -10 2 M50 65 q5 6 10 2"/>
  <g class="lumi-whiskers">
    <line x1="16" y1="58" x2="32" y2="60"/>
    <line x1="16" y1="66" x2="32" y2="64"/>
    <line x1="84" y1="58" x2="68" y2="60"/>
    <line x1="84" y1="66" x2="68" y2="64"/>
  </g>
</svg>`;
function setAvatar(speaking){ document.getElementById('teacher-avatar')?.classList.toggle('speaking',speaking); }
function setMascotMood(mood){
  const av = document.getElementById('teacher-avatar');
  if(!av) return;
  av.classList.remove('cheer','sad');
  if(mood==='cheer' || mood==='sad'){
    void av.offsetWidth;
    av.classList.add(mood);
    setTimeout(()=>av.classList.remove(mood), 1400);
  }
}

// Main speak function — uses ElevenLabs if key set, else fallback
function sayPart(text, rate=0.88, pitch=1.05, onEnd){
  if(EL_KEY){ _elSay(text, onEnd); }
  else { _fallbackSay(text, onEnd); }
}

// Run a list of segments sequentially:
// { type:'say', text, rate?, pitch? }
// { type:'chord', notes[], color?, snd? }
// { type:'seq', notes[][], color, delay? }  ← notes is array of names, lit in order
// { type:'pause', ms }
// { type:'quiz', quiz }    ← shows quiz, waits for answer then continues
// { type:'clear' }
function runSegs(segs, idx, onDone){
  if(_segStop) return;
  if(idx>=segs.length){ if(onDone) onDone(); return; }
  const s=segs[idx];
  const next=()=>runSegs(segs,idx+1,onDone);

  if(s.type==='say'){
    // Typewriter only shows text — speech plays, then next seg
    appendBubble(s.text);
    sayPart(s.text, s.rate||0.88, s.pitch||1.05, ()=>{ setTimeout(next, s.gap||200); });

  }else if(s.type==='chord'){
    clearAllLEDs();
    const ns=s.notes; const col=s.color||'cyan';
    ns.forEach(n=>setLED(n,col));
    if(s.snd!==false) ns.forEach((n,i)=>{ const f=noteFreq(n); if(f) setTimeout(()=>playNote(f),i*35); });
    setTimeout(next, s.wait||1400);

  }else if(s.type==='seq'){
    clearAllLEDs(); clearSeq();
    const d=s.delay||420;
    s.notes.forEach((n,i)=>{
      const t=setTimeout(()=>{
        clearAllLEDs();
        setLED(n, s.color||'cyan');
        const f=noteFreq(n); if(f&&s.snd!==false) playNote(f);
      },d*i);
      seqTimers.push(t);
    });
    setTimeout(next, d*s.notes.length + (s.wait||500));

  }else if(s.type==='seqAll'){
    // light all cumulatively, don't clear between
    clearAllLEDs(); clearSeq();
    const d=s.delay||420;
    s.notes.forEach((n,i)=>{
      const t=setTimeout(()=>{
        setLED(n, s.color||'cyan');
        const f=noteFreq(n); if(f&&s.snd!==false) playNote(f);
      },d*i);
      seqTimers.push(t);
    });
    setTimeout(next, d*s.notes.length + (s.wait||500));

  }else if(s.type==='pause'){
    setTimeout(next, s.ms||700);

  }else if(s.type==='clear'){
    clearAllLEDs(); next();

  }else if(s.type==='quiz'){
    renderQuiz(s.quiz, next);
  }
}

// ════════════════════════
//  AUDIO ENGINE
// ════════════════════════
let ctx=null, reverb=null;
function initAudio(){
  if(ctx) return;
  ctx=new(window.AudioContext||window.webkitAudioContext)();
  const len=ctx.sampleRate*1.6;
  const buf=ctx.createBuffer(2,len,ctx.sampleRate);
  for(let c=0;c<2;c++){const d=buf.getChannelData(c);for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.5);}
  reverb=ctx.createConvolver(); reverb.buffer=buf;
  const rg=ctx.createGain(); rg.gain.value=0.16; reverb.connect(rg); rg.connect(ctx.destination);
}
function playNote(freq,dur=1.8){
  if(!ctx) return;
  const H=[{m:1,g:.5},{m:2,g:.18},{m:3,g:.09},{m:4,g:.05},{m:6,g:.02}];
  const master=ctx.createGain(); const now=ctx.currentTime;
  master.gain.setValueAtTime(0,now);
  master.gain.linearRampToValueAtTime(0.38,now+0.009);
  master.gain.setTargetAtTime(0.12,now+0.009,0.22);
  master.gain.setTargetAtTime(0,now+dur*0.4,dur*0.5);
  master.connect(ctx.destination); if(reverb) master.connect(reverb);
  H.forEach(h=>{ const o=ctx.createOscillator(),g=ctx.createGain(); o.type=h.m===1?'triangle':'sine'; o.frequency.value=freq*h.m; g.gain.value=h.g; o.connect(g); g.connect(master); o.start(now); o.stop(now+dur+0.4); });
}

// ════════════════════════
//  NOTE FREQUENCY MAP
// ════════════════════════
const N12=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
function midiFreq(m){ return 440*Math.pow(2,(m-69)/12); }
const ALL_NOTES=[];
for(let oct=2;oct<=6;oct++) for(let i=0;i<12;i++) ALL_NOTES.push({name:N12[i]+oct,base:N12[i],oct,type:N12[i].length===1?'white':'black',freq:midiFreq((oct+1)*12+i)});
const FREQ_MAP={}; ALL_NOTES.forEach(n=>FREQ_MAP[n.name]=n.freq);
function noteFreq(name){ return FREQ_MAP[name]; }

// ════════════════════════
//  LED & KEY CONTROL
// ════════════════════════
function setLED(name,color){ const l=document.getElementById('led-'+name); if(l) l.className='led '+color; const k=document.getElementById('key-'+name); if(k) k.classList.add('lit'); }
function clearLED(name){ const l=document.getElementById('led-'+name); if(l) l.className='led'; const k=document.getElementById('key-'+name); if(k) k.classList.remove('lit'); }
function clearAllLEDs(){ document.querySelectorAll('.led').forEach(l=>l.className='led'); document.querySelectorAll('.key-white,.key-black').forEach(k=>k.classList.remove('lit')); }
let seqTimers=[];
function clearSeq(){ seqTimers.forEach(t=>clearTimeout(t)); seqTimers=[]; }

// ════════════════════════
//  BUILD KEYBOARD
// ════════════════════════
function buildPiano(){
  const piano=document.getElementById('piano'), ledRow=document.getElementById('led-row');
  piano.innerHTML=''; ledRow.innerHTML=''; let wi=0;
  ALL_NOTES.forEach(note=>{
    const key=document.createElement('div');
    key.className='key-'+(note.type)+(note.base==='C'?' c-key':'');
    key.id='key-'+note.name;
    if(note.base==='C'){ const lb=document.createElement('span'); lb.className='note-label'; lb.textContent=note.name; key.appendChild(lb); }
    const led=document.createElement('div'); led.className='led'; led.id='led-'+note.name;
    if(note.type==='white'){ led.style.left=(wi*40+15)+'px'; piano.appendChild(key); wi++; }
    else{ key.style.left=(wi*40-13)+'px'; led.style.left=(wi*40-13+8)+'px'; piano.appendChild(key); }
    ledRow.appendChild(led);
    key.addEventListener('mousedown',()=>{ initAudio(); playNote(note.freq); key.classList.add('playing'); setLED(note.name,'green'); if(window._quizKey===note.name) onKeyQuizHit(note.name); });
    key.addEventListener('mouseup',()=>{ key.classList.remove('playing'); clearLED(note.name); });
    key.addEventListener('mouseleave',()=>{ key.classList.remove('playing'); clearLED(note.name); });
  });
  const tw=ALL_NOTES.filter(n=>n.type==='white').length;
  piano.style.minWidth=(tw*40)+'px';
}

// ════════════════════════
//  SPEECH BUBBLE
// ════════════════════════
let bubbleLines=[];
function appendBubble(text){
  const el=document.getElementById('speech-text'); if(!el) return;
  bubbleLines.push(text);
  if(bubbleLines.length>4) bubbleLines.shift();
  el.innerHTML='';
  bubbleLines.forEach((line,i)=>{
    const sp=document.createElement('span');
    sp.style.opacity=i===bubbleLines.length-1?'1':'0.45';
    sp.textContent=(i>0?' ':'') + line;
    el.appendChild(sp);
  });
}
function clearBubble(){ bubbleLines=[]; const el=document.getElementById('speech-text'); if(el) el.innerHTML=''; }

// ════════════════════════
//  STATUS BAR
// ════════════════════════
function setStatus(msg,dot=false){
  const b=document.getElementById('status-bar');
  if(b) b.innerHTML=dot?`<span class="dot-anim"></span>${msg}`:msg;
}

// ════════════════════════
//  GAMIFICATION
// ════════════════════════
const DAILY_GOAL = 30;
const _today = () => new Date().toISOString().slice(0,10);
function _ls(k, def){ const v = localStorage.getItem(k); return v===null ? def : v; }
function _lsj(k, def){ try{ const v = localStorage.getItem(k); return v===null ? def : JSON.parse(v); }catch{ return def; } }

let xp = +_ls('xp', 0);
let streak = +_ls('streak', 0);
let hearts = +_ls('hearts', 5);
let dailyXP = +_ls('dailyXP', 0);
let lastActiveDay = _ls('lastActiveDay', '') || null;
let freezes = +_ls('freezes', 2);
const completedGrades = new Set(_lsj('completedGrades', []));
let session = { correct:0, wrong:0, startMs:0 };

function persistState(){
  localStorage.setItem('xp', xp);
  localStorage.setItem('streak', streak);
  localStorage.setItem('hearts', hearts);
  localStorage.setItem('dailyXP', dailyXP);
  localStorage.setItem('lastActiveDay', lastActiveDay || '');
  localStorage.setItem('freezes', freezes);
  localStorage.setItem('completedGrades', JSON.stringify([...completedGrades]));
}

function _dayDiff(d1, d2){
  return Math.round((new Date(d2).getTime() - new Date(d1).getTime()) / 86400000);
}

function checkDailyStreak(){
  if(!lastActiveDay) return;
  const today = _today();
  if(lastActiveDay === today) return;
  const gap = _dayDiff(lastActiveDay, today);
  if(gap > 1){
    const missed = gap - 1;
    if(freezes >= missed){ freezes -= missed; }
    else { streak = 0; freezes = 0; }
  }
  dailyXP = 0;
  persistState();
}

function addXP(n){
  xp += n;
  const today = _today();
  let streakBumped = false;
  if(lastActiveDay !== today){
    streak++;
    streakBumped = true;
    lastActiveDay = today;
    dailyXP = 0;
  }
  dailyXP += n;
  persistState();
  refreshGamificationUI();
  if(streakBumped && typeof playSfx==='function') playSfx('streak');
}

function loseHeart(){
  if(hearts>0) hearts--;
  persistState();
  refreshGamificationUI();
}

function refreshGamificationUI(){
  const xpEl = document.getElementById('xp-val'); if(xpEl) xpEl.textContent = xp;
  const stEl = document.getElementById('streak-val'); if(stEl) stEl.textContent = streak;
  const hEl = document.getElementById('hearts-val'); if(hEl) hEl.textContent = '❤️'.repeat(hearts)+'🖤'.repeat(5-hearts);
  const xpBar = document.getElementById('xp-bar'); if(xpBar) xpBar.style.width = Math.min(100,(xp%200)/2)+'%';
  const chip = document.querySelector('.stat-chip.streak');
  if(chip) chip.classList.toggle('goal-met', dailyXP >= DAILY_GOAL);
  completedGrades.forEach(g=>{
    const btn = document.getElementById('grade-btn-'+g);
    if(btn && !btn.querySelector('.check')){
      const c = document.createElement('span'); c.className='check'; c.textContent='✓'; btn.appendChild(c);
    }
  });
}

// ════════════════════════
//  MISTAKES QUEUE
// ════════════════════════
function pushMistake(m){
  const list = _lsj('mistakes', []);
  list.push({...m, ts: Date.now()});
  if(list.length > 50) list.shift();
  localStorage.setItem('mistakes', JSON.stringify(list));
}
function getMistakes(){ return _lsj('mistakes', []); }
function clearMistakes(){ localStorage.removeItem('mistakes'); showHome(); }
function showMistakes(){
  stopAll();
  const list = getMistakes();
  const la = document.getElementById('lesson-area');
  if(!list.length){
    la.innerHTML = `<div class="home-screen"><h2>No mistakes to review</h2><p>You're crushing it. Try a tougher grade to earn one.</p><button class="btn btn-ghost" onclick="showHome()">← Back to Menu</button></div>`;
    return;
  }
  const items = list.slice().reverse().map(m=>`
    <div class="mistake-item">
      <div class="mistake-meta">Grade ${m.grade} · ${new Date(m.ts).toLocaleDateString()}</div>
      <div class="mistake-q">${m.question||'(no prompt)'}</div>
      <div class="mistake-ans"><span class="x">You said:</span> ${m.given||'—'} &nbsp;·&nbsp; <span class="ok">Correct:</span> ${m.answer||'—'}</div>
    </div>`).join('');
  la.innerHTML = `<div class="mistakes-page">
    <div class="mistakes-header">
      <h2>Mistakes to Review</h2>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost" onclick="clearMistakes()">Clear all</button>
        <button class="btn btn-ghost" onclick="showHome()">← Back</button>
      </div>
    </div>
    <div class="mistake-list">${items}</div>
  </div>`;
}

// ════════════════════════
//  LESSON ENGINE
// ════════════════════════
let currentGrade=null, currentStep=0, currentLesson=null;

function showStep(){
  if(!currentLesson) return;
  const steps=currentLesson.steps;
  if(currentStep>=steps.length){ showComplete(); return; }
  const step=steps[currentStep];
  const pct=Math.round((currentStep/steps.length)*100);
  document.getElementById('lp-bar').style.width=pct+'%';
  document.getElementById('lp-label').textContent=`${currentStep+1} / ${steps.length}`;

  // Clear UI
  document.getElementById('content-area').innerHTML='';
  document.getElementById('action-row').innerHTML='';
  document.querySelectorAll('.quiz-prompt,.quiz-opts,.feedback-banner').forEach(e=>e.remove());
  clearBubble(); clearAllLEDs(); clearSeq(); _segStop=false; window._quizKey=null;
  setStatus('Listening to your teacher...',true);

  // Run segments, then show Continue button
  runSegs(step.segments||[], 0, ()=>{
    setStatus('');
    if(!_segStop) renderContinue();
  });
}

function renderContinue(){
  const row=document.getElementById('action-row'); row.innerHTML='';
  const btn=document.createElement('button'); btn.className='btn btn-green'; btn.textContent='Continue →';
  btn.onclick=()=>{ _segStop=true; stopAll(); currentStep++; showStep(); };
  row.appendChild(btn);
  // Replay button
  const rb=document.createElement('button'); rb.className='btn btn-ghost'; rb.style.marginLeft='8px'; rb.textContent='🔁 Replay';
  rb.onclick=()=>{ _segStop=false; showStep(); };
  row.appendChild(rb);
}

// ════════════════════════
//  QUIZ SYSTEM
// ════════════════════════
function renderQuiz(quiz, onAnswered){
  const la=document.getElementById('lesson-area');
  const p=document.createElement('div'); p.className='quiz-prompt'; p.style.margin='4px 32px 12px';
  p.innerHTML=`<div class="q-text">${quiz.question}</div><div class="q-sub">${quiz.sub||''}</div>`;
  la.appendChild(p);

  if(quiz.type==='mcq'){
    const row=document.createElement('div'); row.className='quiz-opts'; la.appendChild(row);
    quiz.options.forEach(opt=>{
      const b=document.createElement('button'); b.className='quiz-opt'; b.textContent=opt;
      b.onclick=()=>{
        const correct=opt===quiz.answer;
        row.querySelectorAll('button').forEach(x=>x.disabled=true);
        b.classList.add(correct?'correct':'wrong');
        if(!correct){ const ans=Array.from(row.querySelectorAll("button")).find(x=>x.textContent===quiz.answer); if(ans) ans.classList.add("correct"); }
        showFB(correct, correct ? ("Correct! " + (quiz.explain||"")) : ("Not quite. " + (quiz.explain||"")));
        if(correct){ session.correct++; addXP(10); sayPart(quiz.explain||'Correct! Great job.',0.88,1.1, ()=>setTimeout(onAnswered,400)); }
        else{ session.wrong++; loseHeart(); pushMistake({grade:currentGrade, question:quiz.question, given:opt, answer:quiz.answer}); sayPart('Not quite. '+(quiz.explain||''),0.88,0.9, ()=>setTimeout(onAnswered,400)); }
      };
      row.appendChild(b);
    });
  }

  if(quiz.type==='key'){
    window._quizKey=quiz.target;
    setLED(quiz.target,'yellow');
    setStatus(`👆 Find and press ${quiz.target} on the keyboard below!`,true);
    window._onKeyAnswered=onAnswered;
  }
  p.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function onKeyQuizHit(name){
  window._quizKey=null;
  session.correct++;
  showFB(true,'✅ Perfect! You found it!');
  addXP(10);
  sayPart('Nice work! You found the key!',0.88,1.1, ()=>{ const cb=window._onKeyAnswered; window._onKeyAnswered=null; if(cb) setTimeout(cb,400); });
}

function showFB(ok,msg){
  if(typeof playSfx==='function') playSfx(ok?'correct':'wrong');
  setMascotMood(ok?'cheer':'sad');
  document.querySelectorAll('.feedback-banner').forEach(e=>e.remove());
  const fb=document.createElement('div'); fb.className='feedback-banner '+(ok?'correct-fb':'wrong-fb'); fb.style.margin='4px 32px';
  fb.textContent=msg; fb.id='feedback-banner';
  document.getElementById('lesson-area').appendChild(fb);
  fb.scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ════════════════════════
//  COMPLETE SCREEN
// ════════════════════════
function showComplete(){
  stopAll(); completedGrades.add(currentGrade); addXP(50);
  if(typeof playSfx==='function') playSfx('levelup');
  const btn=document.getElementById('grade-btn-'+currentGrade);
  if(btn&&!btn.querySelector('.check')){ const c=document.createElement('span'); c.className='check'; c.textContent='✓'; btn.appendChild(c); }
  const total = session.correct + session.wrong;
  const accuracy = total ? Math.round((session.correct/total)*100) : 100;
  const elapsedSec = Math.max(1, Math.round((Date.now() - session.startMs)/1000));
  const timeStr = elapsedSec >= 60 ? `${Math.floor(elapsedSec/60)}m ${elapsedSec%60}s` : `${elapsedSec}s`;
  const reviewLine = session.wrong ? `<div class="summary-review">📝 ${session.wrong} to review in Practice</div>` : '';
  const la=document.getElementById('lesson-area');
  la.innerHTML=`<div class="complete-screen">
    <div class="trophy">🏆</div>
    <h2>Grade ${currentGrade} Complete!</h2>
    <p>${currentLesson.complete||'Outstanding!'}</p>
    <div class="summary-stats">
      <div class="stat-card"><div class="stat-value">${accuracy}%</div><div class="stat-label">Accuracy</div></div>
      <div class="stat-card"><div class="stat-value">${timeStr}</div><div class="stat-label">Time</div></div>
      <div class="stat-card"><div class="stat-value">+50</div><div class="stat-label">XP</div></div>
    </div>
    ${reviewLine}
    <div class="xp-reward" style="margin-top:14px">⭐ ${session.correct} of ${total} correct</div>
    <button class="btn btn-green" style="font-size:1rem;margin-top:18px" onclick="loadGrade(${Math.min(currentGrade+1,12)})">Next Grade →</button>
    <button class="btn btn-ghost" style="margin-top:10px" onclick="showHome()">← Back to Menu</button>
  </div>`;
  sayPart(currentLesson.complete||'Grade '+currentGrade+' complete! Amazing work! You earned 50 XP!',0.88,1.1);
}

// ════════════════════════
//  HOME SCREEN
// ════════════════════════
const GNAMES=['Meet the Piano','Finding Notes','Half & Whole Steps','Major Scale','Minor Scale','Major Chords','Minor Chords','Progressions','Circle of Fifths','7th Chords','Inversions','Play Songs'];
const GICONS=['🎹','🗺️','👣','☀️','🌙','🎵','💜','🔄','⭕','✨','🔀','🎶'];

function _buildPathNodes(){
  const W = 360, gapY = 110, padTop = 60, amp = 100;
  const nodes = Array.from({length:12}, (_,i)=>({
    n: i+1,
    x: W/2 + amp * Math.sin(i * 0.85),
    y: padTop + i*gapY
  }));
  const H = padTop + 12*gapY + 30;
  return { W, H, nodes };
}

function showHome(){
  stopAll(); clearSeq(); clearAllLEDs(); currentLesson=null; currentGrade=null;
  document.querySelectorAll('.grade-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('grade-badge').textContent='Select Grade';
  const la=document.getElementById('lesson-area');

  const { W, H, nodes } = _buildPathNodes();
  const highest = completedGrades.size ? Math.max(...completedGrades) : 0;
  const currentNode = Math.min(12, highest + 1);

  let pathD = '';
  let pathDone = '';
  nodes.forEach((n, idx)=>{
    if(idx === 0){ pathD += `M ${n.x} ${n.y}`; pathDone += `M ${n.x} ${n.y}`; }
    else {
      const prev = nodes[idx-1];
      const my = (prev.y + n.y)/2;
      const seg = ` C ${prev.x} ${my}, ${n.x} ${my}, ${n.x} ${n.y}`;
      pathD += seg;
      if(completedGrades.has(n.n) || n.n === currentNode) pathDone += seg;
    }
  });

  const nodeHTML = nodes.map(n=>{
    const completed = completedGrades.has(n.n);
    const current = !completed && n.n === currentNode;
    const locked = !completed && !current;
    const cls = completed ? 'completed' : current ? 'current' : 'locked';
    const icon = completed ? '✓' : GICONS[n.n-1];
    const click = locked ? '' : `onclick="loadGrade(${n.n})"`;
    return `<div class="path-node ${cls}" style="left:${n.x}px;top:${n.y}px" ${click}>
      <div class="path-node-circle">${icon}</div>
      <div class="path-node-label">G${n.n} · ${GNAMES[n.n-1]}</div>
    </div>`;
  }).join('');

  const mistakeCount = getMistakes().length;
  const reviewCard = mistakeCount > 0 ? `
    <div class="review-card" onclick="showMistakes()">
      <div class="rc-icon">📝</div>
      <div class="rc-text">
        <div class="rc-title">Review ${mistakeCount} mistake${mistakeCount===1?'':'s'}</div>
        <div class="rc-sub">Tap to see questions you got wrong</div>
      </div>
      <div class="rc-arrow">→</div>
    </div>` : '';

  la.innerHTML=`<div class="home-screen">
    <h2>Your Piano Journey</h2>
    <p>One small lesson at a time. Real songs by Grade 12.</p>
    ${reviewCard}
    <div class="path-container" style="width:${W}px;height:${H}px">
      <svg class="path-connector" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <path d="${pathD}" stroke="rgba(255,255,255,0.08)" stroke-width="6" fill="none" stroke-dasharray="3,10" stroke-linecap="round"/>
        <path d="${pathDone}" stroke="var(--green)" stroke-opacity="0.55" stroke-width="6" fill="none" stroke-linecap="round"/>
      </svg>
      ${nodeHTML}
    </div>
  </div>`;
  sayPart('Welcome back! Pick up where you left off, or start at the top.',0.88,1.05);
}

// ════════════════════════
//  LOAD GRADE
// ════════════════════════
function loadGrade(g){
  stopAll(); clearSeq(); clearAllLEDs();
  currentGrade=g; currentStep=0; currentLesson=LESSONS[g];
  session = { correct:0, wrong:0, startMs:Date.now() };
  document.querySelectorAll('.grade-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('grade-btn-'+g)?.classList.add('active');
  document.getElementById('grade-badge').textContent='Grade '+g;
  const la=document.getElementById('lesson-area');
  la.innerHTML=`
    <div class="lesson-progress">
      <button id="close-lesson-btn" onclick="showHome()" title="Menu">✕</button>
      <div class="lp-bar-wrap"><div class="lp-bar" id="lp-bar" style="width:0%"></div></div>
      <span class="lp-label" id="lp-label">1 / ${currentLesson.steps.length}</span>
    </div>
    <div class="teacher-row">
      <div class="teacher-avatar" id="teacher-avatar">${LUMI_SVG}<div class="speaking-ring"></div></div>
      <div class="speech-bubble"><span id="speech-text"></span></div>
    </div>
    <div class="content-area" id="content-area"></div>
    <div class="action-row" id="action-row"></div>`;
  showStep();
}

// ════════════════════════
//  SIDEBAR
// ════════════════════════
function buildSidebar(){
  const list=document.getElementById('grade-list'); list.innerHTML='';
  for(let g=1;g<=12;g++){
    const btn=document.createElement('button'); btn.className='grade-btn'; btn.id='grade-btn-'+g;
    btn.innerHTML=`<span class="gnum">G${g}</span>${GNAMES[g-1]}`;
    btn.onclick=()=>loadGrade(g); list.appendChild(btn);
  }
}

window.addEventListener('DOMContentLoaded',()=>{
  buildPiano(); buildSidebar(); initAudio();
  checkDailyStreak();
  refreshGamificationUI();
  showHome();
  if(!EL_KEY && !localStorage.getItem('el_first_run_dismissed')){
    localStorage.setItem('el_first_run_dismissed','1');
    setTimeout(()=>{ if(typeof openSettings==='function') openSettings(); }, 1500);
  }
});
