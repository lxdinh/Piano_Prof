// ════════════════════════
//  SOUND EFFECTS
//  Uses the AudioContext (ctx) initialized by app.js.
//  Safe to call before ctx exists — early calls silently no-op.
// ════════════════════════

function _sfxBlip(freqs, totalMs=200, wave='triangle', peak=0.13){
  if(typeof ctx === 'undefined' || !ctx) return;
  const c = ctx;
  const now = c.currentTime;
  const stepSec = (totalMs / freqs.length) / 1000;
  freqs.forEach((f, i)=>{
    const o = c.createOscillator();
    const g = c.createGain();
    const t = now + i*stepSec;
    o.type = wave;
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + stepSec * 0.95);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + stepSec + 0.05);
  });
}

function playSfx(type){
  switch(type){
    case 'correct':
      _sfxBlip([523.25, 659.25, 783.99], 220, 'triangle', 0.13); break;
    case 'wrong':
      _sfxBlip([220.00, 207.65], 260, 'sawtooth', 0.10); break;
    case 'levelup':
      _sfxBlip([523.25, 659.25, 783.99, 1046.50], 420, 'triangle', 0.14); break;
    case 'streak':
      _sfxBlip([1046.50, 1318.51], 160, 'sine', 0.10); break;
  }
}
