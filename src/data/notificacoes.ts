export type NotificationType = 'reserva' | 'mensagem' | 'avaliacao' | 'sistema'
export type NotificationGroup = 'hoje' | 'esta_semana' | 'anteriores'

export interface Notificacao {
  id: string
  type: NotificationType
  group: NotificationGroup
  title: string
  body: string
  time: string
  unread: boolean
}

export const notificacoes: Notificacao[] = [
  {
    id: 'n1',
    type: 'reserva',
    group: 'hoje',
    title: 'Reserva confirmada!',
    body: 'Clara Martins confirmou a hospedagem do Thor para 10-14 de julho.',
    time: 'Agora há pouco',
    unread: true,
  },
  {
    id: 'n2',
    type: 'mensagem',
    group: 'hoje',
    title: 'Nova mensagem de Ana Lima',
    body: 'A hospedagem de amanhã está confirmada!',
    time: '12:01',
    unread: true,
  },
  {
    id: 'n3',
    type: 'reserva',
    group: 'esta_semana',
    title: 'Lembrete de reserva',
    body: 'Sua reserva com Clara Martins começa em 3 dias.',
    time: 'Ontem',
    unread: false,
  },
  {
    id: 'n4',
    type: 'avaliacao',
    group: 'esta_semana',
    title: 'Avalie seu último serviço',
    body: 'Como foi a hospedagem com Fernanda Costa? Deixe sua avaliação!',
    time: '2 dias atrás',
    unread: false,
  },
  {
    id: 'n5',
    type: 'sistema',
    group: 'anteriores',
    title: 'Novos anfitriões na sua região',
    body: '5 novos perfis foram adicionados perto de você.',
    time: '3 dias atrás',
    unread: false,
  },
  {
    id: 'n6',
    type: 'avaliacao',
    group: 'anteriores',
    title: 'Nova resposta à sua avaliação',
    body: 'Fernanda Costa respondeu sua avaliação sobre a Mia.',
    time: '5 dias atrás',
    unread: false,
  },
  {
    id: 'n7',
    type: 'sistema',
    group: 'anteriores',
    title: 'Bem-vinda ao Pet House!',
    body: 'Complete seu perfil para receber recomendações personalizadas.',
    time: '2 semanas atrás',
    unread: false,
  },
]
