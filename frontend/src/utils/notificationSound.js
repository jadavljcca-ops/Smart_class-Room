// EduMark Unified Notification Sound & Hardware Vibration Manager

let globalAudioCtx = null;
let audioUnlocked = false;
let audioFileElement = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!globalAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      globalAudioCtx = new AudioContextClass();
    }
  }
  return globalAudioCtx;
}

/**
 * Physical hardware vibration trigger for mobile devices
 * @param {number[]} pattern - Milliseconds array [vibrate, pause, vibrate...]
 */
export function vibrateDevice(pattern = [400, 150, 400, 150, 400]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
      return true;
    }
  } catch (err) {
    console.warn('Vibration API error:', err);
  }
  return false;
}

/**
 * Synthesizes a crisp, melodious notification chime using Web Audio API oscillators.
 * Zero-latency, 100% offline, never blocked by missing files.
 */
export function playSynthesizedChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: 587Hz (D5) - warm base chime
    const osc0 = ctx.createOscillator();
    const gain0 = ctx.createGain();
    osc0.type = 'sine';
    osc0.frequency.setValueAtTime(587.33, now);
    gain0.gain.setValueAtTime(0.65, now);
    gain0.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc0.connect(gain0);
    gain0.connect(ctx.destination);
    osc0.start(now);
    osc0.stop(now + 0.35);

    // Tone 2: 880Hz (A5) - clear bell
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now + 0.08);
    gain1.gain.setValueAtTime(0.85, now + 0.08);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now + 0.08);
    osc1.stop(now + 0.45);

    // Tone 3: 1320Hz (E6) - harmonic melody
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, now + 0.16);
    gain2.gain.setValueAtTime(0.9, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 0.65);

    // Tone 4: 1760Hz (A6) - bright crystalline sparkle
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(1760, now + 0.24);
    gain3.gain.setValueAtTime(0.7, now + 0.24);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.24);
    osc3.stop(now + 0.75);
  } catch (err) {
    console.warn('Web Audio synthesis error:', err);
  }
}

/**
 * Play audio file (/notification.wav) with fallback to oscillator chime
 */
export function playAudioFile() {
  try {
    if (!audioFileElement && typeof window !== 'undefined') {
      audioFileElement = new Audio('/notification.wav');
      audioFileElement.volume = 1.0;
      audioFileElement.preload = 'auto';
    }

    if (audioFileElement) {
      audioFileElement.currentTime = 0;
      audioFileElement.volume = 1.0;
      const playPromise = audioFileElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          playSynthesizedChime();
        });
      }
    } else {
      playSynthesizedChime();
    }
  } catch (err) {
    playSynthesizedChime();
  }
}

/**
 * Complete alert: Physical hardware vibration + Audio chime
 */
export function triggerNotificationAlert(vibratePattern = [400, 150, 400, 150, 400]) {
  // 1. Physical hardware vibration
  vibrateDevice(vibratePattern);

  // 2. Play audible chime
  playAudioFile();
  playSynthesizedChime();
}

/**
 * Unlock mobile audio context on first user tap/click
 */
export function initAudioUnlock() {
  if (typeof window === 'undefined' || audioUnlocked) return;

  const unlock = () => {
    if (audioUnlocked) return;
    audioUnlocked = true;

    // Resume AudioContext & play silent node
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      try {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      } catch (e) {}
    }

    // Preload & prime HTML Audio element
    try {
      if (!audioFileElement) {
        audioFileElement = new Audio('/notification.wav');
        audioFileElement.volume = 1.0;
        audioFileElement.preload = 'auto';
      }
      audioFileElement.muted = true;
      const playPromise = audioFileElement.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          audioFileElement.pause();
          audioFileElement.currentTime = 0;
          audioFileElement.muted = false;
        }).catch(() => {
          audioFileElement.muted = false;
        });
      }
    } catch (e) {}

    document.removeEventListener('click', unlock);
    document.removeEventListener('touchstart', unlock);
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
  };

  document.addEventListener('click', unlock, { once: true });
  document.addEventListener('touchstart', unlock, { once: true });
  document.addEventListener('pointerdown', unlock, { once: true });
  document.addEventListener('keydown', unlock, { once: true });
}

// Auto-initialize unlock listeners on client
if (typeof window !== 'undefined') {
  initAudioUnlock();
}
