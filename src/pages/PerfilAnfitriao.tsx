import { useState, useEffect } from 'react'
import { PawPrint, Star, Save, Check, DollarSign, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import Pill from '../components/Pill'
import { api } from '../lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────
type YesNo = '' | 'sim' | 'nao'
type Capacidade = '' | '1' | '2' | '3' | '4+'
type TempoCuidado = '' | 'nunca' | 'menos1' | '1a3' | 'mais3'

interface FormState {
  outrosAnimais: YesNo; descricaoAnimais: string; criancas: YesNo; faixaEtaria: string
  trabalhaFora: YesNo; capacidadeMaxima: Capacidade
  portesAceitos: string[]; especiesAceitas: string[]
  adminMedicamentos: YesNo; experienciaEspeciais: YesNo
  cuidouAntes: YesNo; tempoCuidado: TempoCuidado; racasExperiencia: string; sobreVoce: string
  pricePerDay: string
  availableDates: string[]
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CAPACIDADE_OPTS: { value: Exclude<Capacidade, ''>; label: string }[] = [
  { value: '1', label: '1 pet' }, { value: '2', label: '2 pets' },
  { value: '3', label: '3 pets' }, { value: '4+', label: '4+ pets' },
]
const TEMPO_OPTS: { value: Exclude<TempoCuidado, ''>; label: string }[] = [
  { value: 'nunca', label: 'Nunca (primeira vez)' }, { value: 'menos1', label: 'Menos de 1 ano' },
  { value: '1a3', label: '1 a 3 anos' }, { value: 'mais3', label: 'Mais de 3 anos' },
]
const PORTES = ['Pequeno', 'Médio', 'Grande', 'Gigante']
const ESPECIES = ['Cachorro', 'Gato', 'Pássaro', 'Coelho', 'Outro']
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS_PT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const INIT: FormState = {
  outrosAnimais: '', descricaoAnimais: '', criancas: '', faixaEtaria: '',
  trabalhaFora: '', capacidadeMaxima: '',
  portesAceitos: [], especiesAceitas: [],
  adminMedicamentos: '', experienciaEspeciais: '',
  cuidouAntes: '', tempoCuidado: '', racasExperiencia: '', sobreVoce: '',
  pricePerDay: '150', availableDates: [],
}

// ── Calendar helpers ──────────────────────────────────────────────────────────
function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function todayIso() {
  const t = new Date()
  return isoDate(t.getFullYear(), t.getMonth(), t.getDate())
}

// ── Host date picker calendar ─────────────────────────────────────────────────
function HostCalendar({ selected, onChange }: { selected: string[]; onChange: (d: string[]) => void }) {
  const today = todayIso()
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

  const toggle = (iso: string) => {
    if (iso < today) return
    onChange(selected.includes(iso) ? selected.filter(d => d !== iso) : [...selected, iso])
  }

  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => isoDate(viewYear, viewMonth, i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const selectedThisMonth = selected.filter(d => d.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`)).length

  return (
    <div className="select-none">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-subtle text-muted hover:text-text transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-text">{MONTHS_PT[viewMonth]} {viewYear}</p>
          {selectedThisMonth > 0 && (
            <p className="text-xs text-primary mt-0.5">{selectedThisMonth} dia{selectedThisMonth > 1 ? 's' : ''} selecionado{selectedThisMonth > 1 ? 's' : ''}</p>
          )}
        </div>
        <button type="button" onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-subtle text-muted hover:text-text transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_PT.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-muted py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((iso, idx) => {
          if (!iso) return <div key={idx} />
          const isPast = iso < today
          const isSelected = selected.includes(iso)
          return (
            <button
              key={iso}
              type="button"
              disabled={isPast}
              onClick={() => toggle(iso)}
              className={`h-9 w-full rounded-lg text-sm font-medium transition-all
                ${isPast ? 'text-muted/30 cursor-not-allowed' : ''}
                ${isSelected && !isPast ? 'text-white shadow-sm' : ''}
                ${!isSelected && !isPast ? 'text-text hover:bg-primary/10 hover:text-primary' : ''}
              `}
              style={isSelected && !isPast ? { backgroundColor: '#FF7E5F' } : {}}
            >
              {new Date(iso + 'T12:00:00').getDate()}
            </button>
          )
        })}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-subtle">
        <button type="button"
          onClick={() => {
            const toAdd: string[] = []
            for (let d = 1; d <= daysInMonth; d++) {
              const iso = isoDate(viewYear, viewMonth, d)
              if (iso >= today && !selected.includes(iso)) toAdd.push(iso)
            }
            onChange([...selected, ...toAdd])
          }}
          className="text-xs text-primary hover:underline">
          Selecionar mês todo
        </button>
        <span className="text-muted text-xs">·</span>
        <button type="button"
          onClick={() => {
            const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
            onChange(selected.filter(d => !d.startsWith(prefix)))
          }}
          className="text-xs text-muted hover:text-text hover:underline">
          Limpar mês
        </button>
        {selected.length > 0 && (
          <>
            <span className="text-muted text-xs">·</span>
            <button type="button" onClick={() => onChange([])}
              className="text-xs text-red-400 hover:underline">
              Limpar tudo ({selected.length})
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title }: { icon: typeof PawPrint; title: string }) {
  return (
    <div className="flex items-center gap-3 pb-5 mb-5 border-b border-subtle">
      <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
        <Icon size={17} className="text-primary" />
      </div>
      <h2 className="text-base font-bold text-text font-display leading-tight">{title}</h2>
    </div>
  )
}

function FieldLabel({ htmlFor, children, required }: { htmlFor?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function YesNoField({ name, value, onChange }: { name: string; value: YesNo; onChange: (v: YesNo) => void }) {
  return (
    <div className="flex gap-4 mt-1">
      {(['sim', 'nao'] as const).map(opt => (
        <label key={opt} className="flex items-center gap-2.5 cursor-pointer select-none">
          <input type="radio" name={name} value={opt} checked={value === opt} onChange={() => onChange(opt)} className="sr-only" />
          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${value === opt ? 'border-primary bg-primary' : 'border-medium'}`}>
            {value === opt && <span className="w-2 h-2 rounded-full bg-white" />}
          </span>
          <span className="text-sm text-text">{opt === 'sim' ? 'Sim' : 'Não'}</span>
        </label>
      ))}
    </div>
  )
}

function RadioPills<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {options.map(opt => (
        <label key={opt.value} className="cursor-pointer select-none">
          <input type="radio" value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} className="sr-only" />
          <span className={`inline-flex px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
            value === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-medium text-muted hover:border-strong hover:text-text'
          }`}>{opt.label}</span>
        </label>
      ))}
    </div>
  )
}

function CheckboxPills({ options, selected, onChange }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void
}) {
  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {options.map(opt => (
        <label key={opt} className="cursor-pointer select-none">
          <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="sr-only" />
          <span className={`inline-flex px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
            selected.includes(opt) ? 'border-primary bg-primary/10 text-primary' : 'border-medium text-muted hover:border-strong hover:text-text'
          }`}>{opt}</span>
        </label>
      ))}
    </div>
  )
}

interface ApiHost {
  hasOtherAnimals?: boolean; otherAnimalsDesc?: string; hasChildren?: boolean; childrenAge?: string
  worksOutside?: boolean; maxPets?: string; acceptedSizes?: string[]; acceptedSpecies?: string[]
  canAdminMeds?: boolean; specialNeedsExp?: boolean
  hasHostedBefore?: boolean; hostingTime?: string; experiencedBreeds?: string; bio?: string
  pricePerDay?: number; availableDates?: string[]
}

function apiToForm(h: ApiHost): Partial<FormState> {
  return {
    outrosAnimais: h.hasOtherAnimals ? 'sim' : h.hasOtherAnimals === false ? 'nao' : '',
    descricaoAnimais: h.otherAnimalsDesc ?? '',
    criancas: h.hasChildren ? 'sim' : h.hasChildren === false ? 'nao' : '',
    faixaEtaria: h.childrenAge ?? '',
    trabalhaFora: h.worksOutside ? 'sim' : h.worksOutside === false ? 'nao' : '',
    capacidadeMaxima: (h.maxPets as Capacidade) ?? '',
    portesAceitos: h.acceptedSizes ?? [],
    especiesAceitas: h.acceptedSpecies ?? [],
    adminMedicamentos: h.canAdminMeds ? 'sim' : h.canAdminMeds === false ? 'nao' : '',
    experienciaEspeciais: h.specialNeedsExp ? 'sim' : h.specialNeedsExp === false ? 'nao' : '',
    cuidouAntes: h.hasHostedBefore ? 'sim' : h.hasHostedBefore === false ? 'nao' : '',
    tempoCuidado: (h.hostingTime as TempoCuidado) ?? '',
    racasExperiencia: h.experiencedBreeds ?? '',
    sobreVoce: h.bio ?? '',
    pricePerDay: h.pricePerDay != null ? String(h.pricePerDay) : '150',
    availableDates: h.availableDates ?? [],
  }
}

function formToApi(f: FormState) {
  const price = parseFloat(f.pricePerDay)
  return {
    hasOtherAnimals: f.outrosAnimais === '' ? undefined : f.outrosAnimais === 'sim',
    otherAnimalsDesc: f.descricaoAnimais || undefined,
    hasChildren: f.criancas === '' ? undefined : f.criancas === 'sim',
    childrenAge: f.faixaEtaria || undefined,
    worksOutside: f.trabalhaFora === '' ? undefined : f.trabalhaFora === 'sim',
    maxPets: f.capacidadeMaxima || undefined,
    acceptedSizes: f.portesAceitos,
    acceptedSpecies: f.especiesAceitas,
    canAdminMeds: f.adminMedicamentos === '' ? undefined : f.adminMedicamentos === 'sim',
    specialNeedsExp: f.experienciaEspeciais === '' ? undefined : f.experienciaEspeciais === 'sim',
    hasHostedBefore: f.cuidouAntes === '' ? undefined : f.cuidouAntes === 'sim',
    hostingTime: f.tempoCuidado || undefined,
    experiencedBreeds: f.racasExperiencia || undefined,
    bio: f.sobreVoce || undefined,
    pricePerDay: isNaN(price) || price <= 0 ? undefined : price,
    availableDates: f.availableDates,
  }
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PerfilAnfitriao() {
  const [form, setForm] = useState<FormState>(INIT)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get<ApiHost>('/hosts/me')
      .then(h => setForm(prev => ({ ...prev, ...apiToForm(h) })))
      .catch(() => {})
  }, [])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(p => ({ ...p, [key]: value }))
    setSaved(false)
  }

  function field(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      set(key as keyof FormState, e.target.value as FormState[typeof key])
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/hosts/me', formToApi(form))
      setSaved(true)
    } catch { /* ignore */ } finally { setSaving(false) }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <Pill>Anfitrião</Pill>
        <h1 className="font-display text-3xl font-bold text-text mt-3">Meu Espaço</h1>
        <p className="text-muted text-sm mt-1">Edite as informações do seu espaço e perfil de anfitrião.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* ── Preço e Disponibilidade ───────────────────────────────────── */}
        <div className="card p-6">
          <SectionHeader icon={Calendar} title="Preço e Disponibilidade" />

          <div className="mb-6">
            <FieldLabel htmlFor="pricePerDay" required>Valor por diária (R$)</FieldLabel>
            <div className="relative max-w-xs">
              <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="pricePerDay" type="number" min="1" step="0.01"
                className="input-field pl-9"
                placeholder="Ex.: 150"
                value={form.pricePerDay}
                onChange={field('pricePerDay')}
              />
            </div>
            <p className="text-xs text-muted mt-1.5">Este valor será exibido aos tutores ao buscar anfitriões.</p>
          </div>

          <div>
            <FieldLabel>Datas disponíveis para receber pets</FieldLabel>
            <p className="text-xs text-muted mb-4">
              Clique nas datas em que você pode receber pets. Os tutores só poderão reservar datas que você marcar.
            </p>
            <div className="bg-surface-2 rounded-2xl p-4">
              <HostCalendar
                selected={form.availableDates}
                onChange={dates => set('availableDates', dates)}
              />
            </div>
            {form.availableDates.length > 0 && (
              <p className="text-xs text-primary mt-2">
                {form.availableDates.length} data{form.availableDates.length > 1 ? 's' : ''} marcada{form.availableDates.length > 1 ? 's' : ''} como disponível{form.availableDates.length > 1 ? 'is' : ''}
              </p>
            )}
          </div>
        </div>

        {/* ── Sobre a Hospedagem ────────────────────────────────────────── */}
        <div className="card p-6">
          <SectionHeader icon={PawPrint} title="Sobre a Hospedagem" />

          <div className="mb-5">
            <FieldLabel>Você tem outros animais em casa?</FieldLabel>
            <YesNoField name="outrosAnimais" value={form.outrosAnimais} onChange={v => set('outrosAnimais', v)} />
            {form.outrosAnimais === 'sim' && (
              <input type="text" className="input-field mt-3" placeholder="Quais animais e quantos?"
                value={form.descricaoAnimais} onChange={field('descricaoAnimais')} />
            )}
          </div>

          <div className="mb-5">
            <FieldLabel>Há crianças no lar?</FieldLabel>
            <YesNoField name="criancas" value={form.criancas} onChange={v => set('criancas', v)} />
            {form.criancas === 'sim' && (
              <input type="text" className="input-field mt-3" placeholder="Faixa etária das crianças"
                value={form.faixaEtaria} onChange={field('faixaEtaria')} />
            )}
          </div>

          <div className="mb-5">
            <FieldLabel>Você trabalha fora durante o dia?</FieldLabel>
            <YesNoField name="trabalhaFora" value={form.trabalhaFora} onChange={v => set('trabalhaFora', v)} />
          </div>

          <div className="mb-5">
            <FieldLabel>Capacidade máxima de pets</FieldLabel>
            <RadioPills<Exclude<Capacidade, ''>>
              options={CAPACIDADE_OPTS}
              value={form.capacidadeMaxima as Exclude<Capacidade, ''>}
              onChange={v => set('capacidadeMaxima', v)}
            />
          </div>

          <div className="mb-5">
            <FieldLabel>Portes aceitos</FieldLabel>
            <CheckboxPills options={PORTES} selected={form.portesAceitos} onChange={v => set('portesAceitos', v)} />
          </div>

          <div className="mb-5">
            <FieldLabel>Espécies aceitas</FieldLabel>
            <CheckboxPills options={ESPECIES} selected={form.especiesAceitas} onChange={v => set('especiesAceitas', v)} />
          </div>

          <div className="mb-5">
            <FieldLabel>Você pode administrar medicamentos?</FieldLabel>
            <YesNoField name="adminMedicamentos" value={form.adminMedicamentos} onChange={v => set('adminMedicamentos', v)} />
          </div>

          <div>
            <FieldLabel>Tem experiência com pets com necessidades especiais?</FieldLabel>
            <YesNoField name="experienciaEspeciais" value={form.experienciaEspeciais} onChange={v => set('experienciaEspeciais', v)} />
          </div>
        </div>

        {/* ── Experiência ───────────────────────────────────────────────── */}
        <div className="card p-6">
          <SectionHeader icon={Star} title="Experiência" />

          <div className="mb-5">
            <FieldLabel>Já cuidou de pets de outras pessoas?</FieldLabel>
            <YesNoField name="cuidouAntes" value={form.cuidouAntes} onChange={v => set('cuidouAntes', v)} />
          </div>

          {form.cuidouAntes === 'sim' && (
            <div className="mb-5">
              <FieldLabel>Há quanto tempo você cuida de pets?</FieldLabel>
              <RadioPills<Exclude<TempoCuidado, ''>>
                options={TEMPO_OPTS}
                value={form.tempoCuidado as Exclude<TempoCuidado, ''>}
                onChange={v => set('tempoCuidado', v)}
              />
            </div>
          )}

          <div className="mb-5">
            <FieldLabel htmlFor="racasExperiencia">Raças com que já trabalhou</FieldLabel>
            <input id="racasExperiencia" type="text" className="input-field"
              placeholder="Ex.: Golden Retriever, Poodle, Labrador (opcional)"
              value={form.racasExperiencia} onChange={field('racasExperiencia')} />
          </div>

          <div>
            <FieldLabel htmlFor="sobreVoce">Sobre você</FieldLabel>
            <textarea id="sobreVoce" className="input-field resize-none" rows={4}
              placeholder="Conte um pouco sobre você, sua rotina com pets e o que te motiva a ser anfitrião..."
              value={form.sobreVoce} onChange={field('sobreVoce')} />
          </div>
        </div>

        {/* ── Save ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-primary">
              <Check size={15} /> Alterações salvas
            </span>
          )}
          <button type="submit" disabled={saving} className="btn-gradient flex items-center gap-2 px-8 disabled:opacity-60">
            <Save size={16} /> {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>

      </form>
    </div>
  )
}
