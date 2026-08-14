export interface Avaliacao {
  id: string
  sitterName: string
  sitterPhoto: string
  petName: string
  service: string
  date: string
  rating: number
  comment: string
  response?: string
}

export const avaliacoes: Avaliacao[] = [
  {
    id: 'av1',
    sitterName: 'Clara Martins',
    sitterPhoto: 'https://randomuser.me/api/portraits/women/44.jpg',
    petName: 'Thor',
    service: 'Hospedagem',
    date: '2026-06-15',
    rating: 5,
    comment: 'Excelente anfitriã! O Thor ficou muito bem, mandou fotos todos os dias. Super recomendo!',
    response: 'Obrigada Marina! O Thor é um amor, foi um prazer cuidar dele. Até a próxima! 🐾',
  },
  {
    id: 'av2',
    sitterName: 'Ana Lima',
    sitterPhoto: 'https://randomuser.me/api/portraits/women/68.jpg',
    petName: 'Thor',
    service: 'Hospedagem',
    date: '2026-05-28',
    rating: 5,
    comment: 'Pontual, atenciosa e o Thor ficou muito bem hospedado. Voltaremos com certeza!',
  },
  {
    id: 'av3',
    sitterName: 'Fernanda Costa',
    sitterPhoto: 'https://randomuser.me/api/portraits/women/32.jpg',
    petName: 'Mia',
    service: 'Hospedagem',
    date: '2026-05-10',
    rating: 4,
    comment: 'A Mia ficou bem cuidada. A Fernanda foi muito paciente com ela que é tímida.',
    response: 'Que gata linda a Mia! Foi um prazer tê-la aqui. 😺',
  },
]
