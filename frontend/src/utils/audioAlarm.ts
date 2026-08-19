// Web Audio API hardware siren sound generator
let audioCtx: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let isSirenPlaying = false;

export function startSirenSound() {
  if (isSirenPlaying) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    audioCtx = new AudioContextClass();
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    oscillator.type = 'sawtooth';
    
    // Siren frequency modulation: sweep between 600Hz and 1400Hz
    const now = audioCtx.currentTime;
    oscillator.frequency.setValueAtTime(600, now);
    
    // Repeat frequency ramp
    let high = false;
    const interval = setInterval(() => {
      if (!audioCtx || !oscillator || !isSirenPlaying) {
        clearInterval(interval);
        return;
      }
      const t = audioCtx.currentTime;
      oscillator.frequency.exponentialRampToValueAtTime(high ? 600 : 1300, t + 0.4);
      high = !high;
    }, 450);

    gainNode.gain.setValueAtTime(0.25, now);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    isSirenPlaying = true;
  } catch (err) {
    console.error('Audio siren error:', err);
  }
}

export function stopSirenSound() {
  if (!isSirenPlaying) return;
  try {
    if (oscillator) {
      oscillator.stop();
      oscillator.disconnect();
      oscillator = null;
    }
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
  } catch (err) {
    console.error('Stop siren error:', err);
  } finally {
    isSirenPlaying = false;
  }
}

export function isSirenActive(): boolean {
  return isSirenPlaying;
}
