import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const src = resolve(root, 'public/favicon.png')
const out = resolve(root, 'public/favicon.ico')
const sizes = [16, 32, 48]

const pngs = await Promise.all(
  sizes.map(async (size) => ({
    size,
    data: await sharp(src)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer(),
  })),
)

const head = Buffer.alloc(6)
head.writeUInt16LE(0, 0)
head.writeUInt16LE(1, 2)
head.writeUInt16LE(pngs.length, 4)

const dir = Buffer.alloc(16 * pngs.length)
let offset = 6 + 16 * pngs.length
pngs.forEach((p, i) => {
  const e = 16 * i
  dir.writeUInt8(p.size === 256 ? 0 : p.size, e + 0)
  dir.writeUInt8(p.size === 256 ? 0 : p.size, e + 1)
  dir.writeUInt8(0, e + 2)
  dir.writeUInt8(0, e + 3)
  dir.writeUInt16LE(1, e + 4)
  dir.writeUInt16LE(32, e + 6)
  dir.writeUInt32LE(p.data.length, e + 8)
  dir.writeUInt32LE(offset, e + 12)
  offset += p.data.length
})

const ico = Buffer.concat([head, dir, ...pngs.map((p) => p.data)])
await writeFile(out, ico)
console.log(`Wrote ${out} (${ico.length} bytes, ${pngs.length} sizes)`)
