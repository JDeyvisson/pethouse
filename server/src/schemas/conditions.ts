import { AppError } from '../middleware/error'
export function checkConditions(data: Record<string, unknown>, kind: 'pet' | 'host') {
  const pairs = kind === 'pet'
    ? [['usesMedication', 'medicationDesc'], ['foodRestriction', 'foodRestDesc'], ['hasEscaped', 'escapeDesc']]
    : [['hasOtherAnimals', 'otherAnimalsDesc'], ['hasChildren', 'childrenAge']]
  const fields: Record<string, string> = {}
  for (const [flag, description] of pairs) {
    if (data[flag] === true && (typeof data[description] !== 'string' || !(data[description] as string).trim())) fields[description] = 'Descreva a opção marcada como sim'
  }
  if (Object.keys(fields).length) throw new AppError('VALIDATION_ERROR', 'Confira os campos obrigatórios', 400, fields)
}
