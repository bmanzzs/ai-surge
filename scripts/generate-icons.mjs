/**
 * Generates minimal valid PNG icons for PWA.
 * Creates a gradient-style square PNG using raw pixel data.
 */
import { createWriteStream } from 'fs'
import { createDeflate } from 'zlib'
import { Buffer } from 'buffer'

function crc32(buf) {
  let crc = 0xffffffff
  for (const byte of buf) {
    crc ^= byte
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.concat([typeBytes, data])
  const crcVal = Buffer.alloc(4)
  crcVal.writeUInt32BE(crc32(crcBuf), 0)
  return Buffer.concat([len, typeBytes, data, crcVal])
}

async function createPNG(size, outputPath) {
  const pixels = []
  const cx = size / 2, cy = size / 2, r = size * 0.38

  for (let y = 0; y < size; y++) {
    pixels.push(0) // filter byte
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      // background: near-black
      let R = 8, G = 8, B = 11, A = 255

      // rounded rect background: always
      const rx = 8 / 192 * size
      if (Math.abs(dx) < size / 2 - rx && Math.abs(dy) < size / 2 - rx) {
        R = 8; G = 8; B = 11
      }

      // outer ring
      if (dist > r * 1.55 && dist < r * 1.62) {
        const t = 0.5
        R = Math.round(59 + t * (168 - 59))
        G = Math.round(130 + t * (85 - 130))
        B = Math.round(246 + t * (247 - 246))
        A = 80
      }
      // middle ring
      if (dist > r * 1.08 && dist < r * 1.15) {
        const t = 0.5
        R = Math.round(59 + t * (168 - 59))
        G = Math.round(130 + t * (85 - 130))
        B = Math.round(246 + t * (247 - 246))
        A = 160
      }
      // center circle with gradient
      if (dist < r) {
        const t = (x / size + y / size) / 2
        R = Math.round(59 + t * (168 - 59))
        G = Math.round(130 + t * (85 - 130))
        B = Math.round(246 + t * (247 - 246))
        A = 255
      }

      pixels.push(R, G, B, A)
    }
  }

  const rawData = Buffer.from(pixels)

  // Compress the pixel data
  const compressed = await new Promise((resolve, reject) => {
    const chunks = []
    const deflate = createDeflate({ level: 6 })
    deflate.on('data', c => chunks.push(c))
    deflate.on('end', () => resolve(Buffer.concat(chunks)))
    deflate.on('error', reject)
    deflate.write(rawData)
    deflate.end()
  })

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 6   // color type: RGBA
  ihdr[10] = 0  // compression
  ihdr[11] = 0  // filter
  ihdr[12] = 0  // interlace

  const png = Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])

  await new Promise((resolve, reject) => {
    const ws = createWriteStream(outputPath)
    ws.on('finish', resolve)
    ws.on('error', reject)
    ws.write(png)
    ws.end()
  })

  console.log(`Created ${outputPath} (${size}x${size})`)
}

await createPNG(192, 'public/icons/icon-192.png')
await createPNG(512, 'public/icons/icon-512.png')
console.log('Icons generated successfully.')
