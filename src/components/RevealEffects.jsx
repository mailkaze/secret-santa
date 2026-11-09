import { useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import { colors } from '../theme'
import '../animation.css'

const TAU = Math.PI * 2
const GREEN = '#2a9d5c'
const DEEP_GREEN = '#1b7a4a'
const DEEP_GOLD = '#f4b942'
const PALE_GOLD = '#fff3c4'
const CONFETTI_COLORS = [colors.red, colors.brightRed, colors.gold, DEEP_GOLD, GREEN, DEEP_GREEN, colors.snow]
const MAX_CONFETTI = 150
const MAX_SNOW = 60
const SNOW_AFTER_REVEAL_MS = 15000
const CONFETTI_DELAY_MS = 150
const GRAVITY = 560
const DRAG = 2.8

const random = (min, max) => min + Math.random() * (max - min)
const pick = list => list[Math.floor(Math.random() * list.length)]

function createFlake(width, height, anywhere) {
  const r = random(0.8, 2.6)
  return {
    x: random(0, width),
    y: anywhere ? random(0, height) : random(-20, -4),
    r,
    speed: 14 + r * 12,
    sway: random(4, 14),
    phase: random(0, TAU),
    alpha: random(0.35, 0.85),
  }
}

function createConfetti(x, y) {
  const angle = -Math.PI / 2 + random(-1.25, 1.25)
  const speed = random(280, 820)
  const roll = Math.random()
  const shape = roll < 0.6 ? 'rect' : roll < 0.74 ? 'circle' : roll < 0.88 ? 'star' : 'flake'
  return {
    x: x + random(-14, 14),
    y: y + random(-6, 6),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    rotation: random(0, TAU),
    spin: random(-8, 8),
    flip: random(0, TAU),
    flipSpeed: random(6, 14),
    size: shape === 'rect' ? random(7, 11) : random(4, 7),
    color: shape === 'flake' ? colors.snow : shape === 'star' ? pick([colors.gold, PALE_GOLD]) : pick(CONFETTI_COLORS),
    shape,
    age: 0,
    life: random(3.6, 5.6),
  }
}

function drawStar(ctx, r) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.45
    const angle = (Math.PI / 5) * i - Math.PI / 2
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
  }
  ctx.closePath()
  ctx.fill()
}

function drawFlake(ctx, r) {
  ctx.beginPath()
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI / 3) * i
    ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r)
    ctx.lineTo(-Math.cos(angle) * r, -Math.sin(angle) * r)
  }
  ctx.stroke()
}

function drawConfetti(ctx, piece) {
  const fade = Math.min(1, (piece.life - piece.age) / 0.8)
  ctx.save()
  // Las estrellas centellean mientras caen
  ctx.globalAlpha = piece.shape === 'star' ? fade * (0.65 + 0.35 * Math.sin(piece.age * 18)) : fade
  ctx.translate(piece.x, piece.y)
  ctx.rotate(piece.rotation)
  ctx.fillStyle = piece.color
  ctx.strokeStyle = piece.color
  if (piece.shape === 'rect') {
    // Girar sobre sí mismo: se estrecha y se ensancha como un papelito
    ctx.scale(1, Math.cos(piece.flip))
    ctx.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2)
  } else if (piece.shape === 'circle') {
    ctx.beginPath()
    ctx.arc(0, 0, piece.size / 2, 0, TAU)
    ctx.fill()
  } else if (piece.shape === 'star') {
    drawStar(ctx, piece.size)
  } else {
    ctx.lineWidth = 1.4
    drawFlake(ctx, piece.size)
  }
  ctx.restore()
}

// Nieve continua y explosión de confeti al abrir el regalo, en un único canvas.
// El bucle se para al desmontar o cuando ya no queda nada que dibujar.
export default function RevealEffects({ burst, originRef }) {
  const canvasRef = useRef(null)
  const launchRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    let ctx = null
    try {
      ctx = canvas?.getContext('2d') ?? null
    } catch {
      ctx = null
    }
    if (!ctx) return undefined

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = 0
    let height = 0
    let frame = 0
    let previous = null
    let snowUntil = Infinity
    let flakes = []
    let confetti = []

    function resize() {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w === width && h === height) return
      width = w
      height = h
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const target = Math.min(MAX_SNOW, Math.round((w * h) / 4500))
      while ((previous ?? 0) < snowUntil && flakes.length < target) flakes.push(createFlake(w, h, true))
    }

    function tick(now) {
      const dt = previous === null ? 0 : Math.min((now - previous) / 1000, 0.05)
      previous = now
      resize()
      ctx.clearRect(0, 0, width, height)

      flakes = flakes.filter(flake => {
        flake.y += flake.speed * dt
        flake.phase += dt * 1.2
        if (flake.y <= height + 6) return true
        // Pasado el tiempo de nieve, los copos que salen ya no vuelven a caer
        if (now >= snowUntil) return false
        Object.assign(flake, createFlake(width, height, false))
        return true
      })
      ctx.fillStyle = '#ffffff'
      for (const flake of flakes) {
        ctx.globalAlpha = flake.alpha
        ctx.beginPath()
        ctx.arc(flake.x + Math.sin(flake.phase) * flake.sway, flake.y, flake.r, 0, TAU)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      confetti = confetti.filter(piece => {
        piece.age += dt
        piece.vx -= piece.vx * DRAG * dt
        piece.vy += (GRAVITY - piece.vy * DRAG) * dt
        piece.x += (piece.vx + Math.sin(piece.flip) * 30) * dt
        piece.y += piece.vy * dt
        piece.rotation += piece.spin * dt
        piece.flip += piece.flipSpeed * dt
        return piece.age < piece.life && piece.y < height + 30
      })
      for (const piece of confetti) drawConfetti(ctx, piece)

      if (now >= snowUntil && flakes.length === 0 && confetti.length === 0) {
        frame = 0
        return
      }
      frame = requestAnimationFrame(tick)
    }

    launchRef.current = (x, y) => {
      for (let i = confetti.length; i < MAX_CONFETTI; i++) confetti.push(createConfetti(x, y))
      snowUntil = (previous ?? performance.now()) + SNOW_AFTER_REVEAL_MS
      if (!frame) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      launchRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!burst) return undefined
    // El confeti sale justo cuando la tapa salta, desde la boca del regalo
    const timer = setTimeout(() => {
      const canvas = canvasRef.current
      if (!launchRef.current || !canvas) return
      const area = canvas.getBoundingClientRect()
      const origin = originRef?.current?.getBoundingClientRect() ?? area
      launchRef.current(origin.left + origin.width / 2 - area.left, origin.top + origin.height * 0.4 - area.top)
    }, CONFETTI_DELAY_MS)
    return () => clearTimeout(timer)
  }, [burst, originRef])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
    />
  )
}

const RAYS = 'repeating-conic-gradient(from 0deg, rgba(255, 209, 102, 0.3) 0deg 7deg, rgba(255, 209, 102, 0) 7deg 22.5deg)'
const RAYS_MASK = 'radial-gradient(closest-side, #000 30%, transparent 100%)'
const GLOW = 'radial-gradient(closest-side, rgba(255, 209, 102, 0.6) 0%, rgba(255, 209, 102, 0.22) 45%, rgba(255, 209, 102, 0) 100%)'

const centered = size => ({
  position: 'absolute',
  width: size,
  height: size,
  left: `calc(50% - ${size / 2}px)`,
  top: `calc(50% - ${size / 2}px)`,
  borderRadius: '50%',
  pointerEvents: 'none',
  zIndex: -1,
})

// Regalo envuelto con la tapa en un grupo aparte para poder hacerla saltar
function GiftSvg({ open }) {
  return (
    <svg viewBox="0 0 140 140" width="140" height="140" focusable="false" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="reveal-gift-body" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={colors.brightRed} />
          <stop offset="0.55" stopColor={colors.red} />
          <stop offset="1" stopColor="#a4031f" />
        </linearGradient>
        <linearGradient id="reveal-gift-lid" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#ff5a6b" />
          <stop offset="0.5" stopColor={colors.brightRed} />
          <stop offset="1" stopColor="#c1031f" />
        </linearGradient>
        <linearGradient id="reveal-gift-ribbon" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#ffe39a" />
          <stop offset="0.5" stopColor={colors.gold} />
          <stop offset="1" stopColor={DEEP_GOLD} />
        </linearGradient>
        <linearGradient id="reveal-gift-light" x1="0" x2="0" y1="1" y2="0">
          <stop offset="0" stopColor={PALE_GOLD} stopOpacity="0.95" />
          <stop offset="0.45" stopColor={colors.gold} stopOpacity="0.45" />
          <stop offset="1" stopColor={colors.gold} stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="70" cy="131" rx="46" ry="5" fill="rgba(0, 0, 0, 0.3)" />
      {open && <path className="gift-beam" d="M30 66 L110 66 L134 -16 L6 -16 Z" fill="url(#reveal-gift-light)" />}
      <rect x="26" y="64" width="88" height="64" rx="6" fill="url(#reveal-gift-body)" />
      <rect x="26" y="64" width="88" height="7" fill="rgba(0, 0, 0, 0.18)" />
      <g fill={colors.gold} opacity="0.55">
        <circle cx="40" cy="84" r="2.5" />
        <circle cx="50" cy="110" r="2" />
        <circle cx="94" cy="88" r="2" />
        <circle cx="102" cy="114" r="2.5" />
        <circle cx="38" cy="120" r="1.6" />
      </g>
      <rect x="62" y="64" width="16" height="64" fill="url(#reveal-gift-ribbon)" />
      {open && <ellipse className="gift-beam" cx="70" cy="66" rx="40" ry="5" fill={PALE_GOLD} />}
      <g className={open ? 'gift-lid gift-lid--off' : 'gift-lid'}>
        <rect x="20" y="48" width="100" height="20" rx="5" fill="url(#reveal-gift-lid)" />
        <rect x="24" y="50" width="92" height="3" rx="1.5" fill="rgba(255, 255, 255, 0.28)" />
        <rect x="61" y="48" width="18" height="20" fill="url(#reveal-gift-ribbon)" />
        <path d="M70 48 C58 24 32 27 41 44 C46 51 60 50 70 48 Z" fill="url(#reveal-gift-ribbon)" stroke="#e0a526" strokeWidth="1.2" />
        <path d="M70 48 C82 24 108 27 99 44 C94 51 80 50 70 48 Z" fill="url(#reveal-gift-ribbon)" stroke="#e0a526" strokeWidth="1.2" />
        <path d="M66 46 C58 34 46 34 48 42 C52 46 60 47 66 46 Z" fill="#e0a526" opacity="0.55" />
        <path d="M74 46 C82 34 94 34 92 42 C88 46 80 47 74 46 Z" fill="#e0a526" opacity="0.55" />
        <rect x="63" y="41" width="14" height="11" rx="4" fill={DEEP_GOLD} />
      </g>
    </svg>
  )
}

const GIFT_MOTION = { spin: 'gift-wobble', landed: 'gift-heartbeat', open: 'gift-open' }

// Escena central: rayos de luz y resplandor detrás del regalo, que tiembla, late y se abre según la fase
export function GiftScene({ phase, spinMs, ref }) {
  const open = phase === 'open'
  return (
    <Box aria-hidden="true" sx={{ position: 'relative', height: 160, display: 'grid', placeItems: 'center' }}>
      {open && <Box className="reveal-rays" sx={{ ...centered(360), background: RAYS, maskImage: RAYS_MASK, WebkitMaskImage: RAYS_MASK }} />}
      {phase !== 'spin' && <Box className={open ? 'gift-glow gift-glow--open' : 'gift-glow'} sx={{ ...centered(240), background: GLOW }} />}
      <Box
        ref={ref}
        className={GIFT_MOTION[phase]}
        style={phase === 'spin' ? { animationDuration: `${spinMs}ms` } : undefined}
        sx={{ position: 'relative', width: 140, height: 140 }}
      >
        <GiftSvg open={open} />
      </Box>
    </Box>
  )
}
