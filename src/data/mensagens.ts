export interface Message {
  id: string
  senderId: string
  text: string
  time: string
  isMe: boolean
}

export interface Conversation {
  id: string
  name: string
  sitterName: string
  photo: string
  lastMessage: string
  time: string
  unread: number
  messages: Message[]
}

export const conversations: Conversation[] = [
  {
    id: 'c1',
    name: 'Clara Martins',
    sitterName: 'Clara Martins',
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    lastMessage: 'Ótimo! Vejo vocês na quinta-feira 😊',
    time: '14:32',
    unread: 0,
    messages: [
      { id: 'm1', senderId: 'c1', text: 'Olá! Quero confirmar a hospedagem do Thor.', time: '14:10', isMe: true },
      { id: 'm2', senderId: 'c1', text: 'Olá Marina! Claro, tudo confirmado para o período.', time: '14:15', isMe: false },
      { id: 'm3', senderId: 'c1', text: 'Pode trazer a ração dele e os brinquedos favoritos.', time: '14:20', isMe: false },
      { id: 'm4', senderId: 'c1', text: 'Perfeito, obrigada! Ele adora o cobertor azul.', time: '14:25', isMe: true },
      { id: 'm5', senderId: 'c1', text: 'Ótimo! Vejo vocês na quinta-feira 😊', time: '14:32', isMe: false },
    ],
  },
  {
    id: 'c2',
    name: 'Ana Lima',
    sitterName: 'Ana Lima',
    photo: 'https://randomuser.me/api/portraits/women/68.jpg',
    lastMessage: 'O passeio de amanhã está confirmado!',
    time: '12:01',
    unread: 2,
    messages: [
      { id: 'm1', senderId: 'c2', text: 'Oi Marina, tudo bem?', time: '11:45', isMe: false },
      { id: 'm2', senderId: 'c2', text: 'O passeio de amanhã está confirmado!', time: '12:01', isMe: false },
    ],
  },
  {
    id: 'c3',
    name: 'Fernanda Costa',
    sitterName: 'Fernanda Costa',
    photo: 'https://randomuser.me/api/portraits/women/32.jpg',
    lastMessage: 'A Mia ficou ótima, manda foto dela!',
    time: '10:30',
    unread: 0,
    messages: [
      { id: 'm1', senderId: 'c3', text: 'A creche foi ótima, a Mia adorou brincar com os outros pets!', time: '10:25', isMe: false },
      { id: 'm2', senderId: 'c3', text: 'A Mia ficou ótima, manda foto dela!', time: '10:30', isMe: false },
    ],
  },
]
