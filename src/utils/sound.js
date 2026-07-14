const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const playTone = (freq, duration = 0.12, type = 'sine', vol = 0.15) => {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

export const playSaleBeep = () => {
  playTone(880, 0.1, 'sine', 0.12);
  setTimeout(() => playTone(1100, 0.15, 'sine', 0.1), 100);
};

export const playErrorBeep = () => {
  playTone(200, 0.3, 'square', 0.08);
};

export const playAlertBeep = () => {
  playTone(600, 0.08, 'triangle', 0.1);
  setTimeout(() => playTone(800, 0.08, 'triangle', 0.1), 80);
  setTimeout(() => playTone(1000, 0.12, 'triangle', 0.1), 160);
};

export const playClickBeep = () => {
  playTone(1200, 0.04, 'sine', 0.05);
};
