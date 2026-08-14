import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet } from 'lucide-react'
import Pill from '../components/Pill'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

interface ApiTransaction {
  id: string
  type: 'income' | 'expense'
  description: string
  amount: number
  date: string
  status: string
  hostName?: string
  tutorName?: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function FinanceiroTutor() {
  const [transactions, setTransactions] = useState<ApiTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ApiTransaction[]>('/financeiro/transactions')
      .then(setTransactions)
      .catch(() => { /* keep empty */ })
      .finally(() => setLoading(false))
  }, [])

  const saidas = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
  const creditos = transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Pill>Financeiro</Pill>
        <h1 className="font-display text-3xl font-bold text-text mt-3">Financeiro</h1>
        <p className="text-muted text-sm mt-1">Acompanhe seus gastos e pagamentos.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-muted" />
            <p className="text-xs text-muted uppercase tracking-wider">Total gasto</p>
          </div>
          <p className="text-2xl font-bold text-text">R$ {saidas.toFixed(0)}</p>
          <p className="text-xs text-muted mt-1">Histórico completo</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={14} className="text-red-400" />
            <p className="text-xs text-muted uppercase tracking-wider">Saídas</p>
          </div>
          <p className="text-2xl font-bold text-text">R$ {saidas.toFixed(0)}</p>
          <p className="text-xs text-muted mt-1">Este período</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-primary" />
            <p className="text-xs text-muted uppercase tracking-wider">Créditos</p>
          </div>
          <p className="text-2xl font-bold text-text">R$ {creditos.toFixed(0)}</p>
          <p className="text-xs text-muted mt-1">Recebidos</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-subtle flex items-center justify-between">
          <p className="font-semibold text-text text-sm">Histórico de transações</p>
          <CreditCard size={16} className="text-muted" />
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-muted text-sm">Carregando…</div>
        ) : transactions.length === 0 ? (
          <div className="px-5 py-8 text-center text-muted text-sm">Nenhuma transação registrada ainda.</div>
        ) : (
          <div>
            {transactions.map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center justify-between px-5 py-4 ${i < transactions.length - 1 ? 'border-b border-subtle' : ''}`}
              >
                <div>
                  <p className="text-sm text-text">{t.description}{t.hostName ? ` — ${t.hostName}` : ''}</p>
                  <p className="text-xs text-muted">{formatDate(t.date)}</p>
                </div>
                <p className={`text-sm font-semibold ${t.type === 'expense' ? 'text-red-400' : 'text-green-400'}`}>
                  {t.type === 'expense' ? '−' : '+'}R$ {t.amount.toFixed(0)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FinanceiroCuidador() {
  const [transactions, setTransactions] = useState<ApiTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ApiTransaction[]>('/financeiro/transactions')
      .then(setTransactions)
      .catch(() => { /* keep empty */ })
      .finally(() => setLoading(false))
  }, [])

  const totalRecebido = transactions.reduce((a, t) => a + t.amount, 0)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const mesAtual = transactions
    .filter(t => new Date(t.date) >= monthStart)
    .reduce((a, t) => a + t.amount, 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Pill>Financeiro</Pill>
        <h1 className="font-display text-3xl font-bold text-text mt-3">Financeiro</h1>
        <p className="text-muted text-sm mt-1">Acompanhe seus ganhos e recebimentos.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={14} className="text-primary" />
            <p className="text-xs text-muted uppercase tracking-wider">Total recebido</p>
          </div>
          <p className="text-2xl font-bold text-text">R$ {totalRecebido.toFixed(0)}</p>
          <p className="text-xs text-muted mt-1">Histórico completo</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-primary" />
            <p className="text-xs text-muted uppercase tracking-wider">Este mês</p>
          </div>
          <p className="text-2xl font-bold text-text">R$ {mesAtual.toFixed(0)}</p>
          <p className="text-xs text-muted mt-1">{now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-subtle flex items-center justify-between">
          <p className="font-semibold text-text text-sm">Histórico de recebimentos</p>
          <CreditCard size={16} className="text-muted" />
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-muted text-sm">Carregando…</div>
        ) : transactions.length === 0 ? (
          <div className="px-5 py-8 text-center text-muted text-sm">Nenhum recebimento registrado ainda.</div>
        ) : (
          <div>
            {transactions.map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center justify-between px-5 py-4 ${i < transactions.length - 1 ? 'border-b border-subtle' : ''}`}
              >
                <div>
                  <p className="text-sm text-text">{t.description}{t.tutorName ? ` — ${t.tutorName}` : ''}</p>
                  <p className="text-xs text-muted">{formatDate(t.date)}</p>
                </div>
                <p className="text-sm font-semibold text-green-400">
                  +R$ {t.amount.toFixed(0)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Financeiro() {
  const { user } = useAuth()
  return user?.role === 'cuidador' ? <FinanceiroCuidador /> : <FinanceiroTutor />
}
