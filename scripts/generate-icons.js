import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const src = join(root, 'src', 'assets', 'icon.svg')
const out = join(root, 'public', 'icons')

mkdirSync(out, { recursive: true })

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

await Promise.all(sizes.map(size =>
  sharp(src).resize(size, size).png().toFile(join(out, `icon-${size}.png`))
))

// Maskable: add 10% padding (safe zone)
const mkPad = (size) => {
  const pad = Math.round(size * 0.1)
  const inner = size - pad * 2
  return sharp(src).resize(inner, inner).extend({
    top: pad, bottom: pad, left: pad, right: pad,
    background: { r: 99, g: 102, b: 241, alpha: 1 }, // #6366f1
  }).png().toFile(join(out, `icon-maskable-${size}.png`))
}
await Promise.all([192, 512].map(mkPad))

// Apple touch icon 180x180
await sharp(src).resize(180, 180).png().toFile(join(out, 'apple-touch-icon.png'))

// favicon 32x32 (save as PNG, rename handled manually or rename to .ico)
await sharp(src).resize(32, 32).png().toFile(join(out, 'favicon-32.png'))

console.log('Icons generated in public/icons/')
