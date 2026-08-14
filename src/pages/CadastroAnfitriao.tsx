import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User, MapPin, Home, PawPrint, Star, ShieldCheck, FileText,
  Camera, X, Check, Eye, EyeOff, Loader2,
  DollarSign, Calendar, ChevronLeft, ChevronRight,
} from 'lucide-react'
import PetHouseLogo from '../components/PetHouseLogo'
import { useAuth } from '../context/AuthContext'
import { api, ApiError } from '../lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────
type YesNo = '' | 'sim' | 'nao'
type Moradia = '' | 'casa' | 'apartamento' | 'chacara' | 'outro'
type Tamanho = '' | 'pequeno' | 'medio' | 'grande'
type Capacidade = '' | '1' | '2' | '3' | '4+'
type TempoCuidado = '' | 'nunca' | 'menos1' | '1a3' | 'mais3'

interface FormData {
  nome: string; email: string; telefone: string; senha: string; confirmarSenha: string
  cep: string; cidade: string; logradouro: string; numero: string; complemento: string
  tipoMoradia: Moradia; quintalFechado: YesNo; tamanhoEspaco: Tamanho; descricaoEspaco: string
  outrosAnimais: YesNo; descricaoAnimais: string; criancas: YesNo; faixaEtaria: string
  trabalhaFora: YesNo; capacidadeMaxima: Capacidade
  portesAceitos: string[]; especiesAceitas: string[]
  adminMedicamentos: YesNo; experienciaEspeciais: YesNo
  cuidouAntes: YesNo; tempoCuidado: TempoCuidado; racasExperiencia: string; sobreVoce: string
  cpf: string; docPreview: string
  aceitaTermos: boolean; confirmaVeracidade: boolean; aceitaResponsabilidade: boolean
}

type ErrKey =
  | 'nome' | 'email' | 'telefone' | 'senha' | 'confirmarSenha'
  | 'cep' | 'cidade' | 'logradouro' | 'numero'
  | 'tipoMoradia' | 'quintalFechado' | 'tamanhoEspaco'
  | 'outrosAnimais' | 'descricaoAnimais' | 'criancas' | 'faixaEtaria'
  | 'trabalhaFora' | 'capacidadeMaxima' | 'portesAceitos' | 'especiesAceitas'
  | 'adminMedicamentos' | 'experienciaEspeciais'
  | 'cuidouAntes' | 'tempoCuidado'
  | 'cpf'
  | 'aceitaTermos' | 'confirmaVeracidade' | 'aceitaResponsabilidade'

type Errors = Partial<Record<ErrKey, string>>

// ── Constants ──────────────────────────────────────────────────────────────────
const MORADIA_OPTS: { value: Exclude<Moradia, ''>; label: string }[] = [
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'chacara', label: 'Chácara ou Sítio' },
  { value: 'outro', label: 'Outro' },
]
const TAMANHO_OPTS: { value: Exclude<Tamanho, ''>; label: string }[] = [
  { value: 'pequeno', label: 'Pequeno' },
  { value: 'medio', label: 'Médio' },
  { value: 'grande', label: 'Grande' },
]
const CAPACIDADE_OPTS: { value: Exclude<Capacidade, ''>; label: string }[] = [
  { value: '1', label: '1 pet' },
  { value: '2', label: '2 pets' },
  { value: '3', label: '3 pets' },
  { value: '4+', label: '4+ pets' },
]
const TEMPO_OPTS: { value: Exclude<TempoCuidado, ''>; label: string }[] = [
  { value: 'nunca', label: 'Nunca (primeira vez)' },
  { value: 'menos1', label: 'Menos de 1 ano' },
  { value: '1a3', label: '1 a 3 anos' },
  { value: 'mais3', label: 'Mais de 3 anos' },
]
const PORTES = ['Pequeno', 'Médio', 'Grande', 'Gigante']
const ESPECIES = ['Cachorro', 'Gato', 'Pássaro', 'Coelho', 'Outro']



const INIT: FormData = {
  nome: '', email: '', telefone: '', senha: '', confirmarSenha: '',
  cep: '', cidade: '', logradouro: '', numero: '', complemento: '',
  tipoMoradia: '', quintalFechado: '', tamanhoEspaco: '', descricaoEspaco: '',
  outrosAnimais: '', descricaoAnimais: '', criancas: '', faixaEtaria: '',
  trabalhaFora: '', capacidadeMaxima: '', portesAceitos: [], especiesAceitas: [],
  adminMedicamentos: '', experienciaEspeciais: '',
  cuidouAntes: '', tempoCuidado: '', racasExperiencia: '', sobreVoce: '',
  cpf: '', docPreview: '',
  aceitaTermos: false, confirmaVeracidade: false, aceitaResponsabilidade: false,
}

// ── Utilities ──────────────────────────────────────────────────────────────────
function formatPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function formatCep(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

function formatCpf(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function pwScore(s: string): number {
  let sc = 0
  if (s.length >= 8) sc++
  if (/[A-Z]/.test(s)) sc++
  if (/[a-z]/.test(s)) sc++
  if (/[0-9\W]/.test(s)) sc++
  return sc
}

// ── Sub-components ─────────────────────────────────────────────────────────────
const Req = () => <span className="text-red-500 ml-0.5">*</span>

const Lbl = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{children}</p>
)

const Hint = ({ text }: { text: string }) => (
  <p className="text-xs text-gray-400 italic mt-1.5">{text}</p>
)

const Err = ({ msg }: { msg?: string }) =>
  msg ? <p role="alert" className="text-xs text-red-500 mt-1.5">{msg}</p> : null

function SectionHeader({ icon, num, title }: { icon: React.ReactNode; num: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
      <div className="p-2.5 rounded-2xl" style={{ backgroundColor: 'rgba(94,139,126,0.12)' }}>
        <span className="text-primary">{icon}</span>
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider">Seção {num}</p>
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
    </div>
  )
}

function PasswordStrengthBar({ senha }: { senha: string }) {
  if (!senha) return null
  const sc = pwScore(senha)
  const labels = ['', 'Fraca', 'Regular', 'Boa', 'Forte']
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e']
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-1.5 flex-1 rounded-full transition-all"
            style={{ backgroundColor: i <= sc ? colors[sc] : '#e5e7eb' }} />
        ))}
      </div>
      {sc > 0 && <p className="text-xs font-medium" style={{ color: colors[sc] }}>Senha {labels[sc]}</p>}
    </div>
  )
}

function YesNoField({ name, value, onChange, error }: {
  name: string; value: YesNo; onChange: (v: YesNo) => void; error?: string
}) {
  return (
    <div>
      <div className="flex gap-5 mt-2">
        {(['sim', 'nao'] as const).map(v => (
          <label key={v} className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name={name} value={v} checked={value === v}
              onChange={() => onChange(v)} className="sr-only" />
            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              value === v ? 'border-primary bg-primary' : 'border-gray-300 hover:border-primary/50'
            }`}>
              {value === v && <span className="w-2 h-2 rounded-full bg-white" />}
            </span>
            <span className="text-sm text-gray-700">{v === 'sim' ? 'Sim' : 'Não'}</span>
          </label>
        ))}
      </div>
      <Err msg={error} />
    </div>
  )
}

function RadioPills<T extends string>({ name, options, value, onChange, error }: {
  name: string
  options: { value: T; label: string }[]
  value: T | ''
  onChange: (v: T) => void
  error?: string
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 mt-2">
        {options.map(opt => (
          <label key={opt.value} className="cursor-pointer">
            <input type="radio" name={name} value={opt.value} checked={value === opt.value}
              onChange={() => onChange(opt.value)} className="sr-only" />
            <span className={`block px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
              value === opt.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}>
              {opt.label}
            </span>
          </label>
        ))}
      </div>
      <Err msg={error} />
    </div>
  )
}

function CheckboxPills({ options, values, onChange, error }: {
  options: string[]; values: string[]
  onChange: (v: string[]) => void; error?: string
}) {
  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v])
  return (
    <div>
      <div className="flex flex-wrap gap-2 mt-2">
        {options.map(opt => {
          const sel = values.includes(opt)
          return (
            <label key={opt} className="cursor-pointer">
              <input type="checkbox" checked={sel} onChange={() => toggle(opt)} className="sr-only" />
              <span className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                sel
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
                {sel && <Check size={12} strokeWidth={3} />}
                {opt}
              </span>
            </label>
          )
        })}
      </div>
      <Err msg={error} />
    </div>
  )
}

function PhotoZone({ fotos, onAdd, onRemove, error, maxCount = 5 }: {
  fotos: { file: File; preview: string }[]
  onAdd: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (i: number) => void
  error?: string
  maxCount?: number
}) {
  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-2">
        {fotos.map((f, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
            <img src={f.preview} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onRemove(i)}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="p-1.5 rounded-full bg-white/90">
                <X size={13} className="text-gray-700" />
              </div>
            </button>
          </div>
        ))}
        {fotos.length < maxCount && (
          <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-gray-400 hover:text-primary">
            <Camera size={20} />
            <span className="text-xs text-center leading-tight px-1">Adicionar</span>
            <input type="file" accept="image/jpeg,image/png" multiple className="sr-only" onChange={onAdd} />
          </label>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1.5">{fotos.length}/{maxCount} fotos · JPG ou PNG · máx. 5 MB cada</p>
      {error && <p role="alert" className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ── Calendar helpers ─────────────────────────────────────────────────────────
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS_PT_MIN = ['D','S','T','Q','Q','S','S']

function calIsoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function calToday() {
  const t = new Date()
  return calIsoDate(t.getFullYear(), t.getMonth(), t.getDate())
}

function HostCalendar({ selected, onChange }: { selected: string[]; onChange: (d: string[]) => void }) {
  const today = calToday()
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => calIsoDate(viewYear, viewMonth, i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const toggle = (iso: string) => {
    if (iso < today) return
    onChange(selected.includes(iso) ? selected.filter(d => d !== iso) : [...selected, iso])
  }

  const selectedThisMonth = selected.filter(d =>
    d.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`)
  ).length

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
          <ChevronLeft size={15} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">{MONTHS_PT[viewMonth]} {viewYear}</p>
          {selectedThisMonth > 0 && (
            <p className="text-xs text-primary mt-0.5">{selectedThisMonth} dia{selectedThisMonth > 1 ? 's' : ''} selecionado{selectedThisMonth > 1 ? 's' : ''}</p>
          )}
        </div>
        <button type="button" onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS_PT_MIN.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((iso, idx) => {
          if (!iso) return <div key={idx} />
          const isPast = iso < today
          const isSel = selected.includes(iso)
          return (
            <button key={iso} type="button" disabled={isPast} onClick={() => toggle(iso)}
              className={`h-9 w-full rounded-lg text-sm font-medium transition-all
                ${isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                ${isSel && !isPast ? 'text-white shadow-sm' : ''}
                ${!isSel && !isPast ? 'text-gray-700 hover:bg-primary/10 hover:text-primary' : ''}
              `}
              style={isSel && !isPast ? { backgroundColor: '#5E8B7E' } : {}}>
              {new Date(iso + 'T12:00:00').getDate()}
            </button>
          )
        })}
      </div>

      <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100 text-xs">
        <button type="button" onClick={() => {
          const toAdd: string[] = []
          for (let d = 1; d <= daysInMonth; d++) {
            const iso = calIsoDate(viewYear, viewMonth, d)
            if (iso >= today && !selected.includes(iso)) toAdd.push(iso)
          }
          onChange([...selected, ...toAdd])
        }} className="text-primary hover:underline">
          Selecionar mês todo
        </button>
        <span className="text-gray-300">·</span>
        <button type="button" onClick={() => {
          const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
          onChange(selected.filter(d => !d.startsWith(prefix)))
        }} className="text-gray-400 hover:text-gray-600 hover:underline">
          Limpar mês
        </button>
        {selected.length > 0 && (
          <>
            <span className="text-gray-300">·</span>
            <button type="button" onClick={() => onChange([])}
              className="text-red-400 hover:underline">
              Limpar tudo ({selected.length})
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function TermCheckbox({ checked, onChange, error, children }: {
  checked: boolean; onChange: (v: boolean) => void; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only" />
        <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
          checked ? 'bg-primary border-primary' : 'border-gray-300 hover:border-gray-400'
        }`}>
          {checked && <Check size={12} className="text-white" strokeWidth={3} />}
        </div>
        <span className="text-sm text-gray-700 leading-relaxed">{children}</span>
      </label>
      {error && <p role="alert" className="text-xs text-red-500 mt-1.5 ml-8">{error}</p>}
    </div>
  )
}

// ── Pending fields summary ────────────────────────────────────────────────────
function PendingFieldsSummary({ form, isLoggedIn }: { form: FormData; isLoggedIn: boolean }) {
  const missing: string[] = []
  const f = form

  if (!isLoggedIn) {
    if (!f.nome.trim())                                         missing.push('Nome completo')
    if (!/\S+@\S+\.\S+/.test(f.email))                         missing.push('E-mail válido')
    if (f.telefone.replace(/\D/g, '').length < 10)              missing.push('Telefone')
    if (f.senha.length < 8)                                     missing.push('Senha (mín. 8 caracteres)')
    else if (pwScore(f.senha) < 3)                              missing.push('Senha mais forte')
    if (f.senha && f.confirmarSenha && f.senha !== f.confirmarSenha) missing.push('Senhas coincidem')
  }
  if (f.cep.replace(/\D/g, '').length !== 8)                missing.push('CEP')
  if (!f.cidade.trim())                                     missing.push('Cidade')
  if (!f.logradouro.trim())                                 missing.push('Logradouro')
  if (!f.numero.trim())                                     missing.push('Número')
  if (!f.tipoMoradia)                                       missing.push('Tipo de moradia')
  if (!f.quintalFechado)                                    missing.push('Quintal fechado (Sim/Não)')
  if (!f.tamanhoEspaco)                                     missing.push('Tamanho do espaço')
  if (!f.outrosAnimais)                                     missing.push('Outros animais (Sim/Não)')
  if (f.outrosAnimais === 'sim' && !f.descricaoAnimais.trim()) missing.push('Descrição dos animais')
  if (!f.criancas)                                          missing.push('Crianças no espaço (Sim/Não)')
  if (f.criancas === 'sim' && !f.faixaEtaria.trim())        missing.push('Faixa etária das crianças')
  if (!f.trabalhaFora)                                      missing.push('Trabalha fora (Sim/Não)')
  if (!f.capacidadeMaxima)                                  missing.push('Capacidade máxima de pets')
  if (f.portesAceitos.length === 0)                         missing.push('Portes aceitos')
  if (f.especiesAceitas.length === 0)                       missing.push('Espécies aceitas')
  if (!f.adminMedicamentos)                                 missing.push('Administra medicamentos (Sim/Não)')
  if (!f.experienciaEspeciais)                              missing.push('Experiência com necessidades especiais (Sim/Não)')
  if (!f.cuidouAntes)                                       missing.push('Já cuidou de pets (Sim/Não)')
  if (!f.tempoCuidado)                                      missing.push('Tempo de experiência')
  if (f.cpf.replace(/\D/g, '').length !== 11)               missing.push('CPF')
  if (!f.aceitaTermos)                                      missing.push('Aceitar Termos de Uso')
  if (!f.confirmaVeracidade)                                missing.push('Confirmar veracidade dos dados')
  if (!f.aceitaResponsabilidade)                            missing.push('Aceitar responsabilidade')

  if (missing.length === 0) return null

  return (
    <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
      <p className="text-xs font-semibold text-yellow-700 mb-2">
        {missing.length} {missing.length === 1 ? 'campo obrigatório pendente' : 'campos obrigatórios pendentes'}:
      </p>
      <ul className="space-y-1">
        {missing.map(label => (
          <li key={label} className="flex items-center gap-2 text-xs text-yellow-700">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CadastroAnfitriao() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Pre-fill credentials if coming from Cadastrar (user already logged in)
  const [form, setForm] = useState<FormData>(() => ({
    ...INIT,
    nome: user?.name || '',
    email: user?.email || '',
  }))
  const [errors, setErrors] = useState<Errors>({})
  const [housePhotos, setHousePhotos] = useState<{ file: File; preview: string }[]>([])
  const [housePhotoError, setHousePhotoError] = useState('')
  const [pricePerDay, setPricePerDay] = useState('150')
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value } as FormData))
    setErrors(p => ({ ...p, [name]: undefined }))
  }

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, telefone: formatPhone(e.target.value) }))
    setErrors(p => ({ ...p, telefone: undefined }))
  }

  const handleCep = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = formatCep(e.target.value)
    setForm(p => ({ ...p, cep: masked }))
    setErrors(p => ({ ...p, cep: undefined }))
    const digits = masked.replace(/\D/g, '')
    if (digits.length === 8) fetchViaCep(digits)
  }

  const handleCpf = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, cpf: formatCpf(e.target.value) }))
    setErrors(p => ({ ...p, cpf: undefined }))
  }

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setForm(p => ({ ...p, docPreview: URL.createObjectURL(file) }))
  }

  const fetchViaCep = async (digits: string) => {
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setForm(p => ({
          ...p,
          logradouro: data.logradouro || p.logradouro,
          cidade: data.localidade || p.cidade,
        }))
      }
    } catch {
      // fail silently — user fills manually
    } finally {
      setCepLoading(false)
    }
  }

  const handleHousePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const errs: string[] = []
    const valid: typeof housePhotos = []
    for (const file of files) {
      if (housePhotos.length + valid.length >= 4) { errs.push('Máximo de 4 fotos atingido'); break }
      if (!['image/jpeg', 'image/png'].includes(file.type)) { errs.push(`"${file.name}": apenas JPG ou PNG`); continue }
      if (file.size > 5 * 1024 * 1024) { errs.push(`"${file.name}": excede 5 MB`); continue }
      valid.push({ file, preview: URL.createObjectURL(file) })
    }
    setHousePhotos(prev => [...prev, ...valid].slice(0, 4))
    setHousePhotoError(errs[0] || '')
    e.target.value = ''
  }

  const removeHousePhoto = (i: number) => {
    setHousePhotos(prev => { URL.revokeObjectURL(prev[i].preview); return prev.filter((_, idx) => idx !== i) })
  }

  const setF = <K extends keyof FormData>(key: K, val: FormData[K]) => {
    setForm(p => ({ ...p, [key]: val }))
    setErrors(p => ({ ...p, [key]: undefined }))
  }

  function validate(): Errors {
    const e: Errors = {}
    const f = form
    if (!user) {
      if (!f.nome.trim()) e.nome = 'Nome obrigatório'
      if (!/\S+@\S+\.\S+/.test(f.email)) e.email = 'E-mail inválido'
      if (f.telefone.replace(/\D/g, '').length < 10) e.telefone = 'Telefone inválido'
      if (f.senha.length < 8) e.senha = 'Mínimo 8 caracteres'
      else if (pwScore(f.senha) < 3) e.senha = 'Senha fraca — inclua maiúsculas, números ou símbolos'
      if (f.senha !== f.confirmarSenha) e.confirmarSenha = 'As senhas não coincidem'
    }

    if (f.cep.replace(/\D/g, '').length !== 8) e.cep = 'CEP inválido'
    if (!f.cidade.trim()) e.cidade = 'Cidade obrigatória'
    if (!f.logradouro.trim()) e.logradouro = 'Logradouro obrigatório'
    if (!f.numero.trim()) e.numero = 'Número obrigatório'

    if (!f.tipoMoradia) e.tipoMoradia = 'Selecione o tipo de moradia'
    if (!f.quintalFechado) e.quintalFechado = 'Selecione uma opção'
    if (!f.tamanhoEspaco) e.tamanhoEspaco = 'Selecione o tamanho'

    if (!f.outrosAnimais) e.outrosAnimais = 'Selecione uma opção'
    else if (f.outrosAnimais === 'sim' && !f.descricaoAnimais.trim()) e.descricaoAnimais = 'Descreva os animais presentes'
    if (!f.criancas) e.criancas = 'Selecione uma opção'
    else if (f.criancas === 'sim' && !f.faixaEtaria.trim()) e.faixaEtaria = 'Informe a faixa etária'
    if (!f.trabalhaFora) e.trabalhaFora = 'Selecione uma opção'
    if (!f.capacidadeMaxima) e.capacidadeMaxima = 'Selecione a capacidade máxima'
    if (f.portesAceitos.length === 0) e.portesAceitos = 'Selecione pelo menos um porte'
    if (f.especiesAceitas.length === 0) e.especiesAceitas = 'Selecione pelo menos uma espécie'
    if (!f.adminMedicamentos) e.adminMedicamentos = 'Selecione uma opção'
    if (!f.experienciaEspeciais) e.experienciaEspeciais = 'Selecione uma opção'

    if (!f.cuidouAntes) e.cuidouAntes = 'Selecione uma opção'
    if (!f.tempoCuidado) e.tempoCuidado = 'Selecione o tempo de experiência'

    if (f.cpf.replace(/\D/g, '').length !== 11) e.cpf = 'CPF inválido'

    if (!f.aceitaTermos) e.aceitaTermos = 'Obrigatório aceitar os termos'
    if (!f.confirmaVeracidade) e.confirmaVeracidade = 'Obrigatório confirmar veracidade'
    if (!f.aceitaResponsabilidade) e.aceitaResponsabilidade = 'Obrigatório aceitar responsabilidade'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      setTimeout(() => {
        document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      return
    }
    setSubmitError(null)
    setSubmitting(true)
    try {
      const f = form
      const fd = new FormData()
      fd.append('cep', f.cep)
      fd.append('city', f.cidade)
      fd.append('street', f.logradouro)
      fd.append('number', f.numero)
      if (f.complemento) fd.append('complement', f.complemento)
      if (f.tipoMoradia) fd.append('housingType', f.tipoMoradia)
      fd.append('fencedYard', String(f.quintalFechado === 'sim'))
      if (f.tamanhoEspaco) fd.append('spaceSize', f.tamanhoEspaco)
      if (f.descricaoEspaco) fd.append('spaceDesc', f.descricaoEspaco)
      fd.append('hasOtherAnimals', String(f.outrosAnimais === 'sim'))
      if (f.descricaoAnimais) fd.append('otherAnimalsDesc', f.descricaoAnimais)
      fd.append('hasChildren', String(f.criancas === 'sim'))
      if (f.faixaEtaria) fd.append('childrenAge', f.faixaEtaria)
      fd.append('worksOutside', String(f.trabalhaFora === 'sim'))
      if (f.capacidadeMaxima) fd.append('maxPets', f.capacidadeMaxima)
      fd.append('acceptedSizes', JSON.stringify(f.portesAceitos))
      fd.append('acceptedSpecies', JSON.stringify(f.especiesAceitas))
      fd.append('canAdminMeds', String(f.adminMedicamentos === 'sim'))
      fd.append('specialNeedsExp', String(f.experienciaEspeciais === 'sim'))
      fd.append('hasHostedBefore', String(f.cuidouAntes === 'sim'))
      if (f.tempoCuidado) fd.append('hostingTime', f.tempoCuidado)
      if (f.racasExperiencia) fd.append('experiencedBreeds', f.racasExperiencia)
      if (f.sobreVoce) fd.append('bio', f.sobreVoce)
      if (f.cpf) fd.append('cpf', f.cpf)
      const price = parseFloat(pricePerDay)
      if (!isNaN(price) && price > 0) fd.append('pricePerDay', String(price))
      fd.append('availableDates', JSON.stringify(availableDates))
      housePhotos.forEach(h => fd.append('housePhotos', h.file))
      await api.upload('/hosts', fd)
      navigate('/home')
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Erro ao enviar cadastro. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const ic = (err?: string) =>
    `mt-2 w-full bg-gray-50 border ${err ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary transition-colors`

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <PetHouseLogo dark />
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Formulário de Cadastro — Anfitrião
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Preencha todas as informações para ativar seu perfil
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

          {/* ── Seção 1 — Dados Pessoais ──────────────────────────────────── */}
          {user ? (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <SectionHeader icon={<User size={18} />} num={1} title="Dados Pessoais" />
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/5 border border-primary/20">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-base flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <span className="ml-auto text-xs text-primary font-medium bg-primary/10 px-2.5 py-1 rounded-full">
                  Conta ativa
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <SectionHeader icon={<User size={18} />} num={1} title="Dados Pessoais" />

              <div className="space-y-4">
                <div data-error={errors.nome ? 'true' : undefined}>
                  <Lbl>Nome Completo <Req /></Lbl>
                  <input name="nome" type="text" value={form.nome} onChange={handleChange}
                    placeholder="Maria da Silva" className={ic(errors.nome)} />
                  <Err msg={errors.nome} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div data-error={errors.email ? 'true' : undefined}>
                    <Lbl>E-mail <Req /></Lbl>
                    <input name="email" type="email" value={form.email} onChange={handleChange}
                      placeholder="maria@email.com" className={ic(errors.email)} />
                    <Err msg={errors.email} />
                  </div>
                  <div data-error={errors.telefone ? 'true' : undefined}>
                    <Lbl>Telefone <Req /></Lbl>
                    <input name="telefone" type="tel" value={form.telefone} onChange={handlePhone}
                      placeholder="(11) 99999-9999" className={ic(errors.telefone)} />
                    <Err msg={errors.telefone} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div data-error={errors.senha ? 'true' : undefined}>
                    <Lbl>Senha <Req /></Lbl>
                    <div className="relative">
                      <input name="senha" type={showSenha ? 'text' : 'password'} value={form.senha}
                        onChange={handleChange} placeholder="••••••••"
                        className={`${ic(errors.senha)} pr-10`} />
                      <button type="button" onClick={() => setShowSenha(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <PasswordStrengthBar senha={form.senha} />
                    <Err msg={errors.senha} />
                  </div>
                  <div data-error={errors.confirmarSenha ? 'true' : undefined}>
                    <Lbl>Confirmar Senha <Req /></Lbl>
                    <div className="relative">
                      <input name="confirmarSenha" type={showConfirmar ? 'text' : 'password'}
                        value={form.confirmarSenha} onChange={handleChange} placeholder="••••••••"
                        className={`${ic(errors.confirmarSenha)} pr-10`} />
                      <button type="button" onClick={() => setShowConfirmar(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirmar ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <Err msg={errors.confirmarSenha} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Seção 2 — Endereço ────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon={<MapPin size={18} />} num={2} title="Endereço do Espaço" />

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div data-error={errors.cep ? 'true' : undefined}>
                  <Lbl>CEP <Req /></Lbl>
                  <div className="relative">
                    <input name="cep" type="text" value={form.cep} onChange={handleCep}
                      placeholder="00000-000" maxLength={9} className={ic(errors.cep)} />
                    {cepLoading && (
                      <Loader2 size={15}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                    )}
                  </div>
                  <Hint text="Preenchimento automático do endereço" />
                  <Err msg={errors.cep} />
                </div>
                <div data-error={errors.cidade ? 'true' : undefined}>
                  <Lbl>Cidade <Req /></Lbl>
                  <input name="cidade" type="text" value={form.cidade} onChange={handleChange}
                    placeholder="São Paulo" className={ic(errors.cidade)} />
                  <Err msg={errors.cidade} />
                </div>
              </div>

              <div data-error={errors.logradouro ? 'true' : undefined}>
                <Lbl>Logradouro <Req /></Lbl>
                <input name="logradouro" type="text" value={form.logradouro} onChange={handleChange}
                  placeholder="Rua das Flores" className={ic(errors.logradouro)} />
                <Err msg={errors.logradouro} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div data-error={errors.numero ? 'true' : undefined}>
                  <Lbl>Número <Req /></Lbl>
                  <input name="numero" type="text" value={form.numero} onChange={handleChange}
                    placeholder="42" className={ic(errors.numero)} />
                  <Err msg={errors.numero} />
                </div>
                <div>
                  <Lbl>Complemento</Lbl>
                  <input name="complemento" type="text" value={form.complemento} onChange={handleChange}
                    placeholder="Apto 12, Bloco B" className={ic()} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Seção 3 — Sobre o Espaço ──────────────────────────────────── */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon={<Home size={18} />} num={3} title="Sobre o Espaço" />

            <div className="space-y-5">
              <div data-error={errors.tipoMoradia ? 'true' : undefined}>
                <Lbl>Tipo de moradia <Req /></Lbl>
                <RadioPills name="tipoMoradia" options={MORADIA_OPTS} value={form.tipoMoradia}
                  onChange={v => setF('tipoMoradia', v)} error={errors.tipoMoradia} />
              </div>

              <div data-error={errors.quintalFechado ? 'true' : undefined}>
                <Lbl>Quintal fechado? <Req /></Lbl>
                <YesNoField name="quintalFechado" value={form.quintalFechado}
                  onChange={v => setF('quintalFechado', v)} error={errors.quintalFechado} />
              </div>

              <div data-error={errors.tamanhoEspaco ? 'true' : undefined}>
                <Lbl>Tamanho do espaço <Req /></Lbl>
                <RadioPills name="tamanhoEspaco" options={TAMANHO_OPTS} value={form.tamanhoEspaco}
                  onChange={v => setF('tamanhoEspaco', v)} error={errors.tamanhoEspaco} />
              </div>

              <div>
                <Lbl>Descrição do espaço</Lbl>
                <textarea name="descricaoEspaco" value={form.descricaoEspaco} onChange={handleChange}
                  placeholder="Descreva seu espaço: quintal, área de lazer, cômodos onde o pet pode circular..."
                  rows={3} className={`${ic()} resize-none`} />
                <Hint text="Opcional — uma boa descrição aumenta suas chances de ser escolhido" />
              </div>


            </div>
          </div>

          {/* ── Seção 4 — Sobre a Hospedagem ──────────────────────────────── */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon={<PawPrint size={18} />} num={4} title="Sobre a Hospedagem" />

            <div className="space-y-5">
              <div data-error={errors.outrosAnimais ? 'true' : undefined}>
                <Lbl>Há outros animais no espaço? <Req /></Lbl>
                <YesNoField name="outrosAnimais" value={form.outrosAnimais}
                  onChange={v => setF('outrosAnimais', v)} error={errors.outrosAnimais} />
                {form.outrosAnimais === 'sim' && (
                  <div className="mt-3" data-error={errors.descricaoAnimais ? 'true' : undefined}>
                    <Lbl>Quais animais? <Req /></Lbl>
                    <textarea name="descricaoAnimais" value={form.descricaoAnimais}
                      onChange={handleChange}
                      placeholder="Ex.: 1 gato castrado de 3 anos, muito tranquilo com outros animais..."
                      rows={2} className={`${ic(errors.descricaoAnimais)} resize-none`} />
                    <Err msg={errors.descricaoAnimais} />
                  </div>
                )}
              </div>

              <div data-error={errors.criancas ? 'true' : undefined}>
                <Lbl>Há crianças no espaço? <Req /></Lbl>
                <YesNoField name="criancas" value={form.criancas}
                  onChange={v => setF('criancas', v)} error={errors.criancas} />
                {form.criancas === 'sim' && (
                  <div className="mt-3" data-error={errors.faixaEtaria ? 'true' : undefined}>
                    <Lbl>Faixa etária das crianças <Req /></Lbl>
                    <input name="faixaEtaria" type="text" value={form.faixaEtaria}
                      onChange={handleChange} placeholder="Ex.: 3 e 7 anos"
                      className={ic(errors.faixaEtaria)} />
                    <Err msg={errors.faixaEtaria} />
                  </div>
                )}
              </div>

              <div data-error={errors.trabalhaFora ? 'true' : undefined}>
                <Lbl>Trabalha fora durante a hospedagem? <Req /></Lbl>
                <YesNoField name="trabalhaFora" value={form.trabalhaFora}
                  onChange={v => setF('trabalhaFora', v)} error={errors.trabalhaFora} />
              </div>

              <div data-error={errors.capacidadeMaxima ? 'true' : undefined}>
                <Lbl>Capacidade máxima de pets simultâneos <Req /></Lbl>
                <RadioPills name="capacidadeMaxima" options={CAPACIDADE_OPTS}
                  value={form.capacidadeMaxima} onChange={v => setF('capacidadeMaxima', v)}
                  error={errors.capacidadeMaxima} />
              </div>

              <div data-error={errors.portesAceitos ? 'true' : undefined}>
                <Lbl>Portes aceitos <Req /></Lbl>
                <CheckboxPills options={PORTES} values={form.portesAceitos}
                  onChange={v => setF('portesAceitos', v)} error={errors.portesAceitos} />
              </div>

              <div data-error={errors.especiesAceitas ? 'true' : undefined}>
                <Lbl>Espécies aceitas <Req /></Lbl>
                <CheckboxPills options={ESPECIES} values={form.especiesAceitas}
                  onChange={v => setF('especiesAceitas', v)} error={errors.especiesAceitas} />
              </div>

              <div data-error={errors.adminMedicamentos ? 'true' : undefined}>
                <Lbl>Sabe administrar medicamentos? <Req /></Lbl>
                <YesNoField name="adminMedicamentos" value={form.adminMedicamentos}
                  onChange={v => setF('adminMedicamentos', v)} error={errors.adminMedicamentos} />
              </div>

              <div data-error={errors.experienciaEspeciais ? 'true' : undefined}>
                <Lbl>Tem experiência com pets de necessidades especiais? <Req /></Lbl>
                <YesNoField name="experienciaEspeciais" value={form.experienciaEspeciais}
                  onChange={v => setF('experienciaEspeciais', v)} error={errors.experienciaEspeciais} />
              </div>
            </div>
          </div>

          {/* ── Seção 5 — Experiência ─────────────────────────────────────── */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon={<Star size={18} />} num={5} title="Experiência com Pets" />

            <div className="space-y-5">
              <div data-error={errors.cuidouAntes ? 'true' : undefined}>
                <Lbl>Já cuidou de pets anteriormente? <Req /></Lbl>
                <YesNoField name="cuidouAntes" value={form.cuidouAntes}
                  onChange={v => setF('cuidouAntes', v)} error={errors.cuidouAntes} />
              </div>

              <div data-error={errors.tempoCuidado ? 'true' : undefined}>
                <Lbl>Tempo de experiência com pets <Req /></Lbl>
                <RadioPills name="tempoCuidado" options={TEMPO_OPTS} value={form.tempoCuidado}
                  onChange={v => setF('tempoCuidado', v)} error={errors.tempoCuidado} />
              </div>

              <div>
                <Lbl>Raças e espécies com mais experiência</Lbl>
                <textarea name="racasExperiencia" value={form.racasExperiencia} onChange={handleChange}
                  placeholder="Ex.: Golden Retriever, Border Collie, gatos siameses..."
                  rows={2} className={`${ic()} resize-none`} />
                <Hint text="Opcional" />
              </div>

              <div>
                <Lbl>Conte sobre você e sua hospedagem</Lbl>
                <textarea name="sobreVoce" value={form.sobreVoce} onChange={handleChange}
                  placeholder="O que os tutores precisam saber sobre você? O que torna sua hospedagem especial?"
                  rows={4} className={`${ic()} resize-none`} />
                <Hint text="Opcional — este texto aparecerá no seu perfil público" />
              </div>
            </div>
          </div>

          {/* ── Seção 6 — Preço e Disponibilidade ────────────────────────── */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon={<Calendar size={18} />} num={6} title="Preço e Disponibilidade" />

            <div className="space-y-6">
              {/* Preço */}
              <div>
                <Lbl>Valor por diária (R$)</Lbl>
                <div className="relative mt-2 max-w-xs">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={pricePerDay}
                    onChange={e => setPricePerDay(e.target.value)}
                    placeholder="150"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <Hint text="Este valor aparecerá para os tutores ao buscar anfitriões" />
              </div>

              {/* Datas disponíveis */}
              <div>
                <Lbl>Datas disponíveis para receber pets</Lbl>
                <p className="text-xs text-gray-400 mt-1 mb-3">
                  Selecione os dias em que você pode receber hospedagem. Os tutores só poderão reservar as datas que você marcar.
                </p>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <HostCalendar selected={availableDates} onChange={setAvailableDates} />
                </div>
                {availableDates.length > 0 && (
                  <p className="text-xs text-primary mt-2">
                    {availableDates.length} data{availableDates.length > 1 ? 's' : ''} marcada{availableDates.length > 1 ? 's' : ''} como disponível{availableDates.length > 1 ? 'is' : ''}
                  </p>
                )}
                <Hint text="Você poderá adicionar e remover datas a qualquer momento em Meu Espaço" />
              </div>
            </div>
          </div>

          {/* ── Seção 7 — Verificação de Identidade e Espaço ─────────────── */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon={<ShieldCheck size={18} />} num={7} title="Verificação de Identidade e Espaço" />

            <div className="space-y-5">
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-xs text-primary">
                Suas informações são protegidas e usadas apenas para verificação. Sua identidade será confirmada em até 24h.
              </div>

              <div data-error={errors.cpf ? 'true' : undefined}>
                <Lbl>CPF <Req /></Lbl>
                <input name="cpf" type="text" value={form.cpf} onChange={handleCpf}
                  placeholder="000.000.000-00" maxLength={14} className={ic(errors.cpf)} />
                <Err msg={errors.cpf} />
              </div>

              <div>
                <Lbl>Documento de identidade (RG ou CNH)</Lbl>
                <label className="mt-2 flex flex-col items-center gap-3 p-5 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                  {form.docPreview ? (
                    <div className="relative">
                      <img src={form.docPreview} alt="Documento" className="h-28 object-contain rounded-xl" />
                      <span className="mt-2 block text-xs text-center text-primary font-medium">
                        Clique para substituir
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 rounded-2xl bg-gray-100 group-hover:bg-primary/10 transition-colors">
                        <Camera size={22} className="text-gray-400 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500 font-medium">Enviar foto do documento</p>
                        <p className="text-xs text-gray-400 mt-0.5">JPG ou PNG · Frente e verso</p>
                      </div>
                    </>
                  )}
                  <input type="file" accept="image/*" className="sr-only" onChange={handleDocUpload} />
                </label>
                <Hint text="Opcional — aumenta a confiança dos tutores no seu perfil" />
              </div>

              <div>
                <Lbl>Fotos da casa (área onde os pets ficarão)</Lbl>
                <PhotoZone fotos={housePhotos} onAdd={handleHousePhotos} onRemove={removeHousePhoto}
                  error={housePhotoError} maxCount={4} />
                <Hint text="Opcional — tutores preferem anfitriões com fotos do espaço verificado" />
              </div>
            </div>
          </div>

          {/* ── Seção 8 — Termos e Condições ─────────────────────────────── */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon={<FileText size={18} />} num={8} title="Termos e Condições" />

            <div className="space-y-4">
              <TermCheckbox checked={form.aceitaTermos} onChange={v => setF('aceitaTermos', v)}
                error={errors.aceitaTermos}>
                Li e aceito os{' '}
                <span className="text-primary font-medium">Termos de Uso</span>
                {' '}e a{' '}
                <span className="text-primary font-medium">Política de Privacidade</span>
                {' '}da plataforma Pet House
              </TermCheckbox>

              <TermCheckbox checked={form.confirmaVeracidade} onChange={v => setF('confirmaVeracidade', v)}
                error={errors.confirmaVeracidade}>
                Declaro que todas as informações fornecidas neste formulário são verdadeiras e precisas
              </TermCheckbox>

              <TermCheckbox checked={form.aceitaResponsabilidade} onChange={v => setF('aceitaResponsabilidade', v)}
                error={errors.aceitaResponsabilidade}>
                Aceito a responsabilidade pelo bem-estar dos pets durante toda a duração da hospedagem
              </TermCheckbox>
            </div>
          </div>

          {/* ── Submit ────────────────────────────────────────────────────── */}
          <div className="pb-10 space-y-3">
            <PendingFieldsSummary form={form} isLoggedIn={!!user} />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl font-semibold text-white text-base transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: '#5E8B7E' }}
            >
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Enviando…</> : 'Enviar cadastro'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-1">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">Fazer login</Link>
            </p>
          </div>
        </form>
      </div>

      {submitError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl bg-red-600 text-white text-sm shadow-lg z-50">
          {submitError}
        </div>
      )}
    </div>
  )
}
