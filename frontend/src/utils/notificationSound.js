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
export function vibrateDevice(pattern = [500, 200, 500, 200, 500]) {
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

    // Tone 1: 880Hz (A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: 1320Hz (E6) harmonic bell
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, now + 0.12);
    gain2.gain.setValueAtTime(0.5, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);

    // Tone 3: 1760Hz (A6) high sparkle
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(1760, now + 0.22);
    gain3.gain.setValueAtTime(0.3, now + 0.22);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.22);
    osc3.stop(now + 0.65);
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
          console.log('Audio file play blocked by browser policy, falling back to Web Audio synth:', e);
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
export function triggerNotificationAlert(vibratePattern = [500, 200, 500, 200, 500]) {
  // 1. Hardware vibration
  vibrateDevice(vibratePattern);

  // 2. Audible chime
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

    // Resume AudioContext
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Preload & prime HTML Audio element
    try {
      if (!audioFileElement) {
        audioFileElement = new Audio('/notification.wav');
        audioFileElement.volume = 1.0;
        audioFileElement.preload = 'auto';
      }
      audioFileElement.load();
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
