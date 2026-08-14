import { z } from 'zod'

export const reservaSchema = z.object({
  petId: z.string().min(1, 'Pet obrigatório'),
  hostId: z.string().min(1, 'Anfitrião obrigatório'),
  startDate: z.string().datetime({ message: 'Data de início inválida' }),
  endDate: z.string().datetime({ message: 'Data de término inválida' }),
  price: z.number().positive('Preço deve ser positivo'),
})

export type ReservaInput = z.infer<typeof reservaSchema>
