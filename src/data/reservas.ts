export type ReservaStatus = 'proxima' | 'em_andamento' | 'concluida' | 'cancelada'

export interface Reserva {
  id: string
  sitterName: string
  sitterPhoto: string
  petName: string
  service: string
  startDate: string
  endDate: string
  status: ReservaStatus
  price: number
  hostId?: string
  tutorName?: string
}

export const reservas: Reserva[] = [
  {
    id: 'r1',
    sitterName: 'Clara Martins',
    sitterPhoto: 'https://randomuser.me/api/portraits/women/44.jpg',
    petName: 'Thor',
    service: 'Hospedagem',
    startDate: '2026-07-10',
    endDate: '2026-07-14',
    status: 'proxima',
    price: 480,
  },
  {
    id: 'r2',
    sitterName: 'Ana Lima',
    sitterPhoto: 'https://randomuser.me/api/portraits/women/68.jpg',
    petName: 'Thor',
    service: 'Hospedagem',
    startDate: '2026-06-28',
    endDate: '2026-07-01',
    status: 'em_andamento',
    price: 380,
  },
  {
    id: 'r3',
    sitterName: 'Fernanda Costa',
    sitterPhoto: 'https://randomuser.me/api/portraits/women/32.jpg',
    petName: 'Mia',
    service: 'Hospedagem',
    startDate: '2026-06-20',
    endDate: '2026-06-22',
    status: 'concluida',
    price: 255,
  },
  {
    id: 'r4',
    sitterName: 'Julia Mendes',
    sitterPhoto: 'https://randomuser.me/api/portraits/women/17.jpg',
    petName: 'Mia',
    service: 'Hospedagem',
    startDate: '2026-06-12',
    endDate: '2026-06-13',
    status: 'cancelada',
    price: 150,
  },
]
