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
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {}
    err.errors.forEach(e => {
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

  console.error(err)
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
  })
}
