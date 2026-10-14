/**
 * Web Audio API Mechanical Switch Click Generator
 * Menghasilkan suara "clicky" switch mekanikal (mirip Blue/Jade switch) tanpa file audio eksternal.
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export function playMechanicalClick(pitchMultiplier = 1) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // 1. Sharp click impulse (transient)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(1650 * pitchMultiplier, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.032);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.038);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.042);

    // 2. Secondary subtle plastic housing thud / bottom-out
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();

    thud.type = "sine";
    thud.frequency.setValueAtTime(260 * pitchMultiplier, ctx.currentTime);
    thud.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.045);

    thudGain.gain.setValueAtTime(0.22, ctx.currentTime);
    thudGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    thud.connect(thudGain);
    thudGain.connect(ctx.destination);

    thud.start();
    thud.stop(ctx.currentTime + 0.055);
  } catch {
    // Abaikan jika browser memblokir audio autoplay sebelum interaksi
  }
}
