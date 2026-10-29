import { MulterError } from 'multer'
import { Prisma } from '@prisma/client'
import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public fields?: Record<string, string>,
  ) {
    super(message)
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof SyntaxError && 'status' in err && err.status === 400) return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'JSON inválido.' } })
  if (typeof err === 'object' && err && 'status' in err && err.status === 413) return res.status(413).json({ error: { code: 'TOO_LARGE', message: 'Solicitação muito grande.' } })
  if (err instanceof MulterError) return res.status(400).json({ error: { code: err.code, message: err.code === 'LIMIT_FILE_SIZE' ? 'Arquivo muito grande. Máximo: 5 MB.' : 'Quantidade de arquivos ou campos excedida.' } })
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Este registro já existe.' } })
    if (err.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registro não encontrado.' } })
    if (err.code === 'P2003') return res.status(409).json({ error: { code: 'IN_USE', message: 'Registro possui vínculos e não pode ser removido.' } })
  }
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {}
    err.issues.forEach(e => {
      const key = e.path.join('.')
      fields[key] = e.message
    })
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos', fields },
    })
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, fields: err.fields },
    })
  }

  console.error('Unhandled API error', { name: err instanceof Error ? err.name : 'UnknownError' })
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
  })
}
