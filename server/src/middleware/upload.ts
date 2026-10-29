import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { mkdirSync } from 'fs'
import { randomUUID } from 'crypto'
import { RequestHandler } from 'express'
import { AppError } from './error'

export const publicUploadDir = path.resolve(process.env.UPLOAD_DIR ?? './uploads')
export const privateUploadDir = path.resolve(process.env.PRIVATE_UPLOAD_DIR ?? './private-uploads')
mkdirSync(publicUploadDir, { recursive: true })
mkdirSync(privateUploadDir, { recursive: true })
const storage = multer.diskStorage({
  destination: (_req, file, cb) => cb(null, file.fieldname === 'docPhoto' ? privateUploadDir : publicUploadDir),
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${file.mimetype === 'image/png' ? '.png' : '.jpg'}`),
})
const raw = multer({ storage, limits: { fileSize: 5 * 1024 * 1024, files: 16, fields: 80 }, fileFilter: (_req, file, cb) => {
  if (['image/jpeg', 'image/png'].includes(file.mimetype)) cb(null, true)
  else cb(new AppError('INVALID_FILE_TYPE', 'Apenas JPG e PNG são aceitos'))
} })
function checked(handler: RequestHandler): RequestHandler {
  return (req, res, next) => handler(req, res, async err => {
    const files = req.file ? [req.file] : Object.values(req.files ?? {}).flat() as Express.Multer.File[]
    const cleanup = () => Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})))
    if (err) { await cleanup(); next(err); return }
    try {
      for (const file of files) {
        const data = await fs.readFile(file.path)
        const png = data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
        const jpg = data[0] === 255 && data[1] === 216 && data[2] === 255
        if (!(file.mimetype === 'image/png' ? png : jpg)) throw new AppError('INVALID_IMAGE', 'Conteúdo da imagem inválido')
      }
      res.on('finish', () => { if (res.statusCode >= 400) void cleanup() })
      next()
    } catch (error) { await cleanup(); next(error) }
  })
}
export const upload = {
  single: (name: string) => checked(raw.single(name)),
  fields: (fields: multer.Field[]) => checked(raw.fields(fields)),
}
