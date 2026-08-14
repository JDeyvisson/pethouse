export interface SitterReview {
  name: string
  photo: string
  rating: number
  date: string
  comment: string
}

export interface Sitter {
  id: string
  name: string
  photo: string
  location: string
  distance: string
  rating: number
  reviewCount: number
  pricePerDay: number
  services: string[]
  matchPercent: number
  verified: boolean
  homeInspected: boolean
  bio: string
  experience: string
  vetPartner: boolean
  availability: string[]
  availableDates: string[]
  gallery: string[]
  reviews: SitterReview[]
  policies: string[]
  likesCount: number
}

export const sitters: Sitter[] = [
  {
    id: '1',
    name: 'Clara Martins',
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    location: 'São Paulo',
    distance: '2,4 km',
    rating: 4.9,
    reviewCount: 158,
    pricePerDay: 120,
    services: ['Hospedagem'],
    matchPercent: 98,
    verified: true,
    homeInspected: true,
    bio: 'Apaixonada por animais desde criança, cuido de pets com amor e dedicação. Minha casa é segura e espaçosa.',
    experience: '5 anos de experiência com cães e gatos de todos os portes.',
    vetPartner: true,
    availability: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
    availableDates: [],
    gallery: [
      'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&h=400&fit=crop',
      'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=500&h=400&fit=crop',
      'https://images.unsplash.com/photo-1568572933382-74d440642117?w=500&h=400&fit=crop',
      'https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=500&h=400&fit=crop',
    ],
    reviews: [
      {
        name: 'Marina Costa',
        photo: 'https://randomuser.me/api/portraits/women/90.jpg',
        rating: 5,
        date: '15 jun 2026',
        comment: 'Excelente anfitriã! O Thor ficou muito bem, mandou fotos todos os dias. Super recomendo!',
      },
      {
        name: 'Rafael Souza',
        photo: 'https://randomuser.me/api/portraits/men/22.jpg',
        rating: 5,
        date: '02 jun 2026',
        comment: 'Casa muito segura e arejada. Minha cadela voltou tranquila e feliz.',
      },
      {
        name: 'Beatriz Alves',
        photo: 'https://randomuser.me/api/portraits/women/53.jpg',
        rating: 4,
        date: '20 mai 2026',
        comment: 'Muito atenciosa e pontual. Só achei a comunicação um pouco lenta no início.',
      },
    ],
    policies: [
      'Cancelamento gratuito até 48h antes da reserva',
      'Vacinação em dia obrigatória',
      'Visita de apresentação recomendada antes da primeira hospedagem',
      'Check-in a partir das 8h, check-out até as 19h',
    ],
    likesCount: 214,
  },
  {
    id: '2',
    name: 'Ana Lima',
    photo: 'https://randomuser.me/api/portraits/women/68.jpg',
    location: 'São Paulo',
    distance: '3,1 km',
    rating: 4.8,
    reviewCount: 92,
    pricePerDay: 95,
    services: ['Hospedagem'],
    matchPercent: 91,
    verified: true,
    homeInspected: false,
    bio: 'Pet sitter certificada com treinamento em primeiros socorros para animais.',
    experience: '3 anos cuidando de pets de clientes exigentes.',
    vetPartner: false,
    availability: ['Segunda', 'Quarta', 'Sexta', 'Sábado'],
    availableDates: [],
    gallery: [
      'https://images.unsplash.com/photo-1601758125946-6ac8acea2b9b?w=500&h=400&fit=crop',
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&h=400&fit=crop',
      'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500&h=400&fit=crop',
    ],
    reviews: [
      {
        name: 'Marina Costa',
        photo: 'https://randomuser.me/api/portraits/women/90.jpg',
        rating: 5,
        date: '28 mai 2026',
        comment: 'Pontual, atenciosa e o Thor ficou muito bem hospedado. Voltaremos com certeza!',
      },
      {
        name: 'Lucas Pereira',
        photo: 'https://randomuser.me/api/portraits/men/41.jpg',
        rating: 5,
        date: '14 mai 2026',
        comment: 'Manda relatório detalhado todos os dias da hospedagem. Muito profissional.',
      },
    ],
    policies: [
      'Cancelamento gratuito até 24h antes da reserva',
      'Vacinação em dia obrigatória',
      'Atende em horário comercial e fins de semana',
    ],
    likesCount: 137,
  },
  {
    id: '3',
    name: 'Fernanda Costa',
    photo: 'https://randomuser.me/api/portraits/women/32.jpg',
    location: 'São Paulo',
    distance: '4,7 km',
    rating: 4.7,
    reviewCount: 64,
    pricePerDay: 85,
    services: ['Hospedagem'],
    matchPercent: 87,
    verified: true,
    homeInspected: true,
    bio: 'Amo cuidar de pets! Tenho um espaço dedicado para os animais em casa.',
    experience: '2 anos de experiência, especialista em pets ansiosos.',
    vetPartner: true,
    availability: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'],
    availableDates: [],
    gallery: [
      'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=500&h=400&fit=crop',
      'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=500&h=400&fit=crop',
      'https://images.unsplash.com/photo-1583512603806-077998240c7a?w=500&h=400&fit=crop',
    ],
    reviews: [
      {
        name: 'Marina Costa',
        photo: 'https://randomuser.me/api/portraits/women/90.jpg',
        rating: 4,
        date: '10 mai 2026',
        comment: 'A Mia ficou bem cuidada. A Fernanda foi muito paciente com ela que é tímida.',
      },
      {
        name: 'Camila Rocha',
        photo: 'https://randomuser.me/api/portraits/women/61.jpg',
        rating: 5,
        date: '22 abr 2026',
        comment: 'Espaço da hospedagem é ótimo, bem espaçoso e seguro. Meu cachorro amou.',
      },
    ],
    policies: [
      'Cancelamento gratuito até 48h antes da reserva',
      'Atende pets de todos os portes',
      'Vacinação em dia obrigatória',
    ],
    likesCount: 89,
  },
  {
    id: '4',
    name: 'Julia Mendes',
    photo: 'https://randomuser.me/api/portraits/women/17.jpg',
    location: 'São Paulo',
    distance: '5,2 km',
    rating: 4.6,
    reviewCount: 43,
    pricePerDay: 75,
    services: ['Hospedagem'],
    matchPercent: 82,
    verified: false,
    homeInspected: false,
    bio: 'Estudante de medicina veterinária, apaixonada por animais.',
    experience: '1 ano de experiência voluntária em abrigo de animais.',
    vetPartner: false,
    availability: ['Sábado', 'Domingo'],
    availableDates: [],
    gallery: [
      'https://images.unsplash.com/photo-1517849845537-4d257902861a?w=500&h=400&fit=crop',
      'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=500&h=400&fit=crop',
    ],
    reviews: [
      {
        name: 'Pedro Henrique',
        photo: 'https://randomuser.me/api/portraits/men/15.jpg',
        rating: 5,
        date: '18 abr 2026',
        comment: 'Muito cuidadosa e carinhosa, indico para quem busca alguém de confiança.',
      },
      {
        name: 'Sofia Martins',
        photo: 'https://randomuser.me/api/portraits/women/29.jpg',
        rating: 4,
        date: '03 abr 2026',
        comment: 'Boa experiência, só atende fins de semana o que limitou um pouco.',
      },
    ],
    policies: [
      'Disponível apenas aos finais de semana',
      'Cancelamento gratuito até 24h antes',
      'Não atende pets com histórico de agressividade',
    ],
    likesCount: 56,
  },
]
