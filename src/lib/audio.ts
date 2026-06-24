/** Play a short placeholder sound effect */
export function playSfx(type: 'attack' | 'hit' | 'skill' | 'victory' | 'defeat' | 'click' | 'loot'): void {
  const enabled = localStorage.getItem('aetherveil_sound') !== 'false'
  if (!enabled) return

  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    const configs: Record<string, { freq: number; duration: number; type: OscillatorType }> = {
      attack: { freq: 440, duration: 0.08, type: 'square' },
      hit: { freq: 180, duration: 0.12, type: 'sawtooth' },
      skill: { freq: 660, duration: 0.2, type: 'sine' },
      victory: { freq: 523, duration: 0.4, type: 'sine' },
      defeat: { freq: 130, duration: 0.5, type: 'triangle' },
      click: { freq: 800, duration: 0.05, type: 'sine' },
      loot: { freq: 880, duration: 0.15, type: 'sine' },
    }

    const cfg = configs[type]
    osc.type = cfg.type
    osc.frequency.setValueAtTime(cfg.freq, ctx.currentTime)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + cfg.duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + cfg.duration)
    setTimeout(() => ctx.close(), (cfg.duration + 0.1) * 1000)
  } catch {
    // Audio not available
  }
}

let bgmOsc: OscillatorNode | null = null
let bgmCtx: AudioContext | null = null

/** Simple ambient background drone — placeholder for real BGM */
export function startBgm(): void {
  const enabled = localStorage.getItem('aetherveil_music') !== 'false'
  if (!enabled || bgmOsc) return

  try {
    bgmCtx = new AudioContext()
    bgmOsc = bgmCtx.createOscillator()
    const gain = bgmCtx.createGain()
    bgmOsc.type = 'sine'
    bgmOsc.frequency.value = 110
    gain.gain.value = 0.015
    bgmOsc.connect(gain)
    gain.connect(bgmCtx.destination)
    bgmOsc.start()
  } catch {
    // Audio not available
  }
}

export function stopBgm(): void {
  try {
    bgmOsc?.stop()
    bgmOsc = null
    bgmCtx?.close()
    bgmCtx = null
  } catch {
    // ignore
  }
}

export function toggleMusic(enabled: boolean): void {
  localStorage.setItem('aetherveil_music', String(enabled))
  if (enabled) startBgm()
  else stopBgm()
}

export function toggleSound(enabled: boolean): void {
  localStorage.setItem('aetherveil_sound', String(enabled))
}
