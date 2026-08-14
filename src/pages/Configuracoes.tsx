import { useState } from 'react'
import {
  Moon, Sun, KeyRound, CreditCard,
  AlertTriangle, Trash2, ChevronRight, HelpCircle,
} from 'lucide-react'
import Pill from '../components/Pill'
import { useTheme } from '../context/ThemeContext'


export default function Configuracoes() {
  const { theme, setTheme } = useTheme()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Pill>Configurações</Pill>
        <h1 className="font-display text-3xl font-bold text-text mt-3">Configurações</h1>
        <p className="text-muted text-sm mt-1">Personalize sua experiência no Pet House.</p>
      </div>

      {/* Aparência */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Moon size={16} className="text-primary" />
          <p className="font-semibold text-text text-sm">Aparência</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: 'dark',  label: 'Escuro', icon: Moon },
            { key: 'light', label: 'Claro',  icon: Sun },
          ] as const).map(opt => {
            const Icon = opt.icon
            return (
              <button
                key={opt.key}
                onClick={() => setTheme(opt.key)}
                className={`flex flex-col items-center gap-2 py-3 rounded-xl border text-xs font-medium transition-all ${
                  theme === opt.key
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-medium text-muted hover:border-stronger hover:text-text'
                }`}
              >
                <Icon size={16} />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

{/* Conta */}
      <div className="card overflow-hidden">
        <div className="px-6 pt-6 pb-4 flex items-center gap-2">
          <KeyRound size={16} className="text-primary" />
          <p className="font-semibold text-text text-sm">Conta</p>
        </div>
        <div>
          <button className="w-full flex items-center gap-4 px-6 py-4 hover:bg-subtle transition-colors text-left border-t border-subtle">
            <div className="p-2 rounded-xl bg-subtle">
              <KeyRound size={16} className="text-muted" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text">Alterar senha</p>
              <p className="text-xs text-muted">Última alteração há 3 meses</p>
            </div>
            <ChevronRight size={14} className="text-muted flex-shrink-0" />
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-4 hover:bg-subtle transition-colors text-left border-t border-subtle">
            <div className="p-2 rounded-xl bg-subtle">
              <CreditCard size={16} className="text-muted" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text">Gerenciar assinatura</p>
              <p className="text-xs text-muted">Plano gratuito</p>
            </div>
            <ChevronRight size={14} className="text-muted flex-shrink-0" />
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-4 hover:bg-subtle transition-colors text-left border-t border-subtle">
            <div className="p-2 rounded-xl bg-subtle">
              <HelpCircle size={16} className="text-muted" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text">Central de ajuda</p>
              <p className="text-xs text-muted">Dúvidas frequentes e suporte</p>
            </div>
            <ChevronRight size={14} className="text-muted flex-shrink-0" />
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-6 border-red-500/20">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-red-400" />
          <p className="font-semibold text-text text-sm">Zona de risco</p>
        </div>

        {!confirmingDelete ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text">Excluir conta</p>
              <p className="text-xs text-muted">Remove permanentemente seus dados, pets e histórico</p>
            </div>
            <button
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:underline flex-shrink-0"
            >
              <Trash2 size={13} /> Excluir conta
            </button>
          </div>
        ) : (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-sm text-text font-medium">Tem certeza que deseja excluir sua conta?</p>
            <p className="text-xs text-muted mt-1">Essa ação não pode ser desfeita. Todos os seus dados serão removidos permanentemente.</p>
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => setConfirmingDelete(false)}
                className="btn-outline text-xs py-2 px-4"
              >
                Cancelar
              </button>
              <button className="flex items-center gap-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl py-2 px-4 transition-colors">
                <Trash2 size={13} /> Confirmar exclusão
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card p-5">
        <p className="text-xs text-muted text-center">Pet House v1.0.0 · pet.house.digipet@gmail.com</p>
      </div>
    </div>
  )
}
