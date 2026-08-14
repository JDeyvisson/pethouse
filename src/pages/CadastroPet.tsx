import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, PawPrint, Heart, Zap, Phone,
  Camera, CheckCircle2, Upload,
} from 'lucide-react'
import Pill from '../components/Pill'
import { api, ApiError } from '../lib/api'

// ── Type definitions ──────────────────────────────────────────────────────────

type YesNo = '' | 'sim' | 'nao'
type Behavior = '' | 'muito_sociavel' | 'sociavel' | 'indiferente' | 'agressivo'
type Energy = '' | '1' | '2' | '3' | '4' | '5'

interface FormData {
  // S1 — Identificação
  nome: string
  rg: string
  dataNascimento: string
  especie: string
  raca: string
  sexo: string
  porte: string
  foto: File | null

  // S2 — Saúde e Cuidados
  vacinasEmDia: YesNo
  usaMedicamento: YesNo
  descricaoMedicamento: string
  condicaoSaude: string
  restricaoAlimentar: YesNo
  descricaoRestricao: string
  racaoConsome: string

  // S3 — Comportamento
  comportamentoCaes: Behavior
  comportamentoGatos: Behavior
  comportamentoCriancas: Behavior
  nivelEnergia: Energy
  jaFugiu: YesNo
  descricaoFuga: string
  medoBarulho: YesNo
  ficaSozinho: YesNo
  dormeSozinho: YesNo
  castrado: YesNo
  infoComportamento: string

  // S4 — Contato de Emergência
  nomeContato: string
  telefoneContato: string
  parentesco: string
  clinicaVet: string
  telefoneClinica: string
  enderecoClinica: string
}

type Errors = Partial<Record<keyof FormData | 'fotoErro', string>>

// ── Constants ─────────────────────────────────────────────────────────────────

const SPECIES = ['Cachorro', 'Gato', 'Coelho', 'Ave', 'Réptil', 'Roedor', 'Outro']
const SEXO = ['Macho', 'Fêmea', 'Indeterminado']
const PORTE = ['Pequeno (até 10 kg)', 'Médio (10–25 kg)', 'Grande (25–45 kg)', 'Gigante (acima de 45 kg)']

const BEHAVIOR_LABELS: Record<string, string> = {
  muito_sociavel: 'Muito sociável',
  sociavel: 'Sociável',
  indiferente: 'Indiferente',
  agressivo: 'Agressivo',
}
const BEHAVIOR_OPTIONS = Object.entries(BEHAVIOR_LABELS).map(([value, label]) => ({ value, label }))

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

const emptyForm: FormData = {
  nome: '', rg: '', dataNascimento: '', especie: '', raca: '',
  sexo: '', porte: '', foto: null,
  vacinasEmDia: '', usaMedicamento: '', descricaoMedicamento: '',
  condicaoSaude: '', restricaoAlimentar: '', descricaoRestricao: '', racaoConsome: '',
  comportamentoCaes: '', comportamentoGatos: '', comportamentoCriancas: '',
  nivelEnergia: '', jaFugiu: '', descricaoFuga: '', medoBarulho: '',
  ficaSozinho: '', dormeSozinho: '', castrado: '', infoComportamento: '',
  nomeContato: '', telefoneContato: '', parentesco: '',
  clinicaVet: '', telefoneClinica: '', enderecoClinica: '',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Req() {
  return <span className="text-red-500 ml-0.5" aria-hidden>*</span>
}

function FieldLabel({ htmlFor, children, required }: {
  htmlFor?: string; children: React.ReactNode; required?: boolean
}) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">
      {children}{required && <Req />}
    </label>
  )
}

function Helper({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted italic mt-1.5">{children}</p>
}

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-xs text-red-500 mt-1.5" role="alert">{msg}</p>
}

function SectionHeader({ icon: Icon, num, title }: {
  icon: typeof PawPrint; num: number; title: string
}) {
  return (
    <div className="flex items-center gap-3 pb-5 mb-5 border-b border-subtle">
      <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
        <Icon size={17} className="text-primary" />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">Seção {num}</p>
        <h2 className="text-base font-bold text-text font-display leading-tight">{title}</h2>
      </div>
    </div>
  )
}

// Generic yes/no radio pair
function YesNoField({ name, value, onChange, error }: {
  name: string; value: YesNo; onChange: (v: YesNo) => void; error?: string
}) {
  return (
    <fieldset>
      <div className="flex gap-4 mt-1">
        {(['sim', 'nao'] as const).map(opt => (
          <label key={opt} className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="radio" name={name} value={opt}
              checked={value === opt} onChange={() => onChange(opt)}
              className="sr-only"
            />
            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              value === opt ? 'border-primary bg-primary' : 'border-medium'
            }`}>
              {value === opt && <span className="w-2 h-2 rounded-full bg-white" />}
            </span>
            <span className="text-sm text-text">{opt === 'sim' ? 'Sim' : 'Não'}</span>
          </label>
        ))}
      </div>
      <ErrorText msg={error} />
    </fieldset>
  )
}

// 4-option behavior radio pills
function BehaviorField({ name, value, onChange, error }: {
  name: string; value: Behavior; onChange: (v: Behavior) => void; error?: string
}) {
  return (
    <fieldset>
      <div className="flex flex-wrap gap-2 mt-1">
        {BEHAVIOR_OPTIONS.map(opt => (
          <label key={opt.value} className="cursor-pointer select-none">
            <input
              type="radio" name={name} value={opt.value}
              checked={value === opt.value} onChange={() => onChange(opt.value as Behavior)}
              className="sr-only"
            />
            <span className={`inline-flex px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
              value === opt.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-medium text-muted hover:border-strong hover:text-text'
            }`}>
              {opt.label}
            </span>
          </label>
        ))}
      </div>
      <ErrorText msg={error} />
    </fieldset>
  )
}

// 1–5 energy scale
function EnergyField({ value, onChange, error }: {
  value: Energy; onChange: (v: Energy) => void; error?: string
}) {
  return (
    <fieldset>
      <div className="flex items-center gap-3 mt-1 flex-wrap">
        <span className="text-xs text-muted whitespace-nowrap">1 – Muito tranquilo</span>
        <div className="flex gap-2">
          {(['1', '2', '3', '4', '5'] as Energy[]).map(v => (
            <label key={v} className="cursor-pointer select-none">
              <input
                type="radio" name="nivelEnergia" value={v}
                checked={value === v} onChange={() => onChange(v)}
                className="sr-only"
              />
              <span className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center text-sm font-bold transition-all ${
                value === v
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-medium text-muted hover:border-strong hover:text-text'
              }`}>
                {v}
              </span>
            </label>
          ))}
        </div>
        <span className="text-xs text-muted whitespace-nowrap">5 – Muito agitado</span>
      </div>
      <ErrorText msg={error} />
    </fieldset>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CadastroPet() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [errors, setErrors] = useState<Errors>({})
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api.get<Record<string, unknown>>(`/pets/${id}`)
      .then(p => {
        const b = (v: unknown): YesNo => v === true ? 'sim' : v === false ? 'nao' : ''
        setForm(prev => ({
          ...prev,
          // S1 — Identificação
          nome: (p.name as string) ?? '',
          especie: (p.species as string) ?? '',
          raca: (p.breed as string) ?? '',
          sexo: (p.sex as string) ?? '',
          porte: (p.size as string) ?? '',
          rg: (p.rg as string) ?? '',
          dataNascimento: p.birthDate ? (p.birthDate as string).slice(0, 10) : '',
          // S2 — Saúde
          vacinasEmDia: b(p.vaccinesUpToDate),
          usaMedicamento: b(p.usesMedication),
          descricaoMedicamento: (p.medicationDesc as string) ?? '',
          condicaoSaude: (p.healthCondition as string) ?? '',
          restricaoAlimentar: b(p.foodRestriction),
          descricaoRestricao: (p.foodRestDesc as string) ?? '',
          racaoConsome: (p.foodBrand as string) ?? '',
          // S3 — Comportamento
          comportamentoCaes: (p.behaviorDogs as Behavior) ?? '',
          comportamentoGatos: (p.behaviorCats as Behavior) ?? '',
          comportamentoCriancas: (p.behaviorKids as Behavior) ?? '',
          nivelEnergia: p.energyLevel ? (String(p.energyLevel) as Energy) : '',
          jaFugiu: b(p.hasEscaped),
          descricaoFuga: (p.escapeDesc as string) ?? '',
          medoBarulho: b(p.fearOfNoise),
          ficaSozinho: b(p.staysAlone),
          dormeSozinho: b(p.sleepsAlone),
          castrado: b(p.neutered),
          infoComportamento: (p.behaviorNotes as string) ?? '',
          // S4 — Contato de emergência
          nomeContato: (p.emergencyName as string) ?? '',
          telefoneContato: (p.emergencyPhone as string) ?? '',
          parentesco: (p.emergencyRelation as string) ?? '',
          clinicaVet: (p.vetClinic as string) ?? '',
          telefoneClinica: (p.vetPhone as string) ?? '',
          enderecoClinica: (p.vetAddress as string) ?? '',
        }))
        if (p.photoUrl) {
          const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace('/api', '')
          setFotoPreview(`${base}${p.photoUrl}`)
        }
      })
      .catch(() => {})
  }, [id])
  // ── Field handlers ───────────────────────────────────────────────────────

  function field(key: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(p => ({ ...p, [key]: e.target.value }))
      if (errors[key]) setErrors(p => ({ ...p, [key]: undefined }))
    }
  }

  function phoneField(key: 'telefoneContato' | 'telefoneClinica') {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(p => ({ ...p, [key]: formatPhone(e.target.value) }))
      if (errors[key]) setErrors(p => ({ ...p, [key]: undefined }))
    }
  }

  function radioField<T extends string>(key: keyof FormData) {
    return (v: T) => {
      setForm(p => ({ ...p, [key]: v }))
      if (errors[key]) setErrors(p => ({ ...p, [key]: undefined }))
    }
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setErrors(p => ({ ...p, fotoErro: 'Formato inválido. Aceitos: JPG ou PNG.' }))
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors(p => ({ ...p, fotoErro: 'Arquivo muito grande. Máximo: 5 MB.' }))
      return
    }
    setErrors(p => ({ ...p, fotoErro: undefined }))
    setForm(p => ({ ...p, foto: file }))
    setFotoPreview(URL.createObjectURL(file))
  }

  // ── Validation ───────────────────────────────────────────────────────────

  function validate(): Errors {
    const e: Errors = {}
    const req = (k: keyof FormData, msg = 'Campo obrigatório') => {
      if (!form[k]) e[k] = msg
    }

    // S1
    req('nome', 'Informe o nome do pet')
    req('especie', 'Selecione a espécie')
    req('raca', 'Informe a raça')
    req('sexo', 'Selecione o sexo')
    req('porte', 'Selecione o porte')

    // S2
    req('vacinasEmDia', 'Selecione uma opção')
    req('usaMedicamento', 'Selecione uma opção')
    if (form.usaMedicamento === 'sim' && !form.descricaoMedicamento.trim())
      e.descricaoMedicamento = 'Descreva o medicamento, dosagem e horários'
    req('restricaoAlimentar', 'Selecione uma opção')
    if (form.restricaoAlimentar === 'sim' && !form.descricaoRestricao.trim())
      e.descricaoRestricao = 'Descreva a dieta e alimentos proibidos'
    req('racaoConsome', 'Informe a ração ou alimento consumido')

    // S3
    req('comportamentoCaes', 'Selecione uma opção')
    req('comportamentoGatos', 'Selecione uma opção')
    req('comportamentoCriancas', 'Selecione uma opção')
    req('nivelEnergia', 'Selecione o nível de energia')
    req('jaFugiu', 'Selecione uma opção')
    if (form.jaFugiu === 'sim' && !form.descricaoFuga.trim())
      e.descricaoFuga = 'Descreva as situações em que isso ocorreu'
    req('medoBarulho', 'Selecione uma opção')
    req('ficaSozinho', 'Selecione uma opção')
    req('dormeSozinho', 'Selecione uma opção')
    req('castrado', 'Selecione uma opção')

    // S4
    req('nomeContato', 'Informe o nome do contato')
    req('telefoneContato', 'Informe o telefone do contato')
    req('parentesco', 'Informe o parentesco ou relação')

    return e
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      setTimeout(() => {
        const el = document.querySelector('[data-error="true"]')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      return
    }

    const f = form
    const fd = new FormData()
    fd.append('name', f.nome)
    fd.append('species', f.especie)
    fd.append('breed', f.raca)
    fd.append('sex', f.sexo)
    fd.append('size', f.porte)
    if (f.rg) fd.append('rg', f.rg)
    if (f.dataNascimento) fd.append('birthDate', f.dataNascimento)
    if (f.foto) fd.append('photo', f.foto)
    fd.append('vaccinesUpToDate', String(f.vacinasEmDia === 'sim'))
    fd.append('usesMedication', String(f.usaMedicamento === 'sim'))
    if (f.descricaoMedicamento) fd.append('medicationDesc', f.descricaoMedicamento)
    if (f.condicaoSaude) fd.append('healthCondition', f.condicaoSaude)
    fd.append('foodRestriction', String(f.restricaoAlimentar === 'sim'))
    if (f.descricaoRestricao) fd.append('foodRestDesc', f.descricaoRestricao)
    if (f.racaoConsome) fd.append('foodBrand', f.racaoConsome)
    if (f.comportamentoCaes) fd.append('behaviorDogs', f.comportamentoCaes)
    if (f.comportamentoGatos) fd.append('behaviorCats', f.comportamentoGatos)
    if (f.comportamentoCriancas) fd.append('behaviorKids', f.comportamentoCriancas)
    if (f.nivelEnergia) fd.append('energyLevel', f.nivelEnergia)
    fd.append('hasEscaped', String(f.jaFugiu === 'sim'))
    if (f.descricaoFuga) fd.append('escapeDesc', f.descricaoFuga)
    fd.append('fearOfNoise', String(f.medoBarulho === 'sim'))
    fd.append('staysAlone', String(f.ficaSozinho === 'sim'))
    fd.append('sleepsAlone', String(f.dormeSozinho === 'sim'))
    fd.append('neutered', String(f.castrado === 'sim'))
    if (f.infoComportamento) fd.append('behaviorNotes', f.infoComportamento)
    if (f.nomeContato) fd.append('emergencyName', f.nomeContato)
    if (f.telefoneContato) fd.append('emergencyPhone', f.telefoneContato)
    if (f.parentesco) fd.append('emergencyRelation', f.parentesco)
    if (f.clinicaVet) fd.append('vetClinic', f.clinicaVet)
    if (f.telefoneClinica) fd.append('vetPhone', f.telefoneClinica)
    if (f.enderecoClinica) fd.append('vetAddress', f.enderecoClinica)

    try {
      if (isEdit && id) {
        await api.upload(`/pets/${id}`, fd, 'PUT')
      } else {
        await api.upload('/pets', fd)
      }
      navigate('/meus-pets')
    } catch (err) {
      setErrors({ nome: err instanceof ApiError ? err.message : isEdit ? 'Erro ao salvar pet.' : 'Erro ao cadastrar pet.' })
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  // Mark wrapper divs for scroll-to-error
  const errAttr = (key: keyof FormData | 'fotoErro') =>
    errors[key] ? { 'data-error': 'true' } : {}

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/meus-pets')}
          className="flex items-center gap-2 text-muted hover:text-text transition-colors text-sm mb-4"
        >
          <ArrowLeft size={16} /> Voltar para Meus Pets
        </button>
        <Pill>Meus Pets</Pill>
        <h1 className="font-display text-3xl font-bold text-text mt-3">{isEdit ? 'Editar Pet' : 'Cadastro de Pet'}</h1>
        <p className="text-muted text-sm mt-1">
          {isEdit ? 'Atualize as informações do seu pet.' : 'Preencha as informações do seu pet para encontrar o anfitrião ideal.'}{' '}
          <span className="text-red-500">*</span> Campos obrigatórios.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">

        {/* ── SECTION 1 — Identificação ─────────────────────────────────── */}
        <div className="card p-6">
          <SectionHeader icon={PawPrint} num={1} title="Identificação" />

          {/* Nome */}
          <div className="mb-5" {...errAttr('nome')}>
            <FieldLabel htmlFor="nome" required>Nome do Pet</FieldLabel>
            <input id="nome" type="text" className="input-field" placeholder="Ex.: Thor"
              value={form.nome} onChange={field('nome')} aria-required />
            <ErrorText msg={errors.nome} />
          </div>

          {/* RG | Data de Nascimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <FieldLabel htmlFor="rg">RG do Pet</FieldLabel>
              <input id="rg" type="text" className="input-field" placeholder="Número do registro (opcional)"
                value={form.rg} onChange={field('rg')} />
            </div>
            <div>
              <FieldLabel htmlFor="dataNascimento">Data de Nascimento</FieldLabel>
              <input id="dataNascimento" type="date" className="input-field"
                value={form.dataNascimento} onChange={field('dataNascimento')} />
            </div>
          </div>

          {/* Espécie | Raça */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div {...errAttr('especie')}>
              <FieldLabel htmlFor="especie" required>Espécie</FieldLabel>
              <select id="especie" className="input-field"
                value={form.especie} onChange={field('especie')} aria-required>
                <option value="">Selecione</option>
                {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ErrorText msg={errors.especie} />
            </div>
            <div {...errAttr('raca')}>
              <FieldLabel htmlFor="raca" required>Raça</FieldLabel>
              <input id="raca" type="text" className="input-field" placeholder="Ex.: Golden Retriever"
                value={form.raca} onChange={field('raca')} aria-required />
              <ErrorText msg={errors.raca} />
            </div>
          </div>

          {/* Sexo | Porte */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div {...errAttr('sexo')}>
              <FieldLabel htmlFor="sexo" required>Sexo</FieldLabel>
              <select id="sexo" className="input-field"
                value={form.sexo} onChange={field('sexo')} aria-required>
                <option value="">Selecione</option>
                {SEXO.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ErrorText msg={errors.sexo} />
            </div>
            <div {...errAttr('porte')}>
              <FieldLabel htmlFor="porte" required>Porte</FieldLabel>
              <select id="porte" className="input-field"
                value={form.porte} onChange={field('porte')} aria-required>
                <option value="">Selecione</option>
                {PORTE.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <ErrorText msg={errors.porte} />
            </div>
          </div>

          {/* Foto */}
          <div {...errAttr('fotoErro')}>
            <FieldLabel>Foto de perfil do Pet</FieldLabel>
            <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-medium rounded-2xl cursor-pointer hover:border-primary transition-colors group">
              {fotoPreview ? (
                <div className="relative">
                  <img src={fotoPreview} alt="Preview da foto do pet"
                    className="w-28 h-28 rounded-2xl object-cover shadow" />
                  <div className="absolute inset-0 rounded-2xl bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={20} className="text-white" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-subtle-md flex items-center justify-center">
                    <Upload size={24} className="text-muted" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-text">Clique para enviar uma foto</p>
                    <p className="text-xs text-muted mt-0.5">ou arraste e solte aqui</p>
                  </div>
                </>
              )}
              <input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={handleFoto} />
            </label>
            <Helper>Formatos aceitos: JPG ou PNG. Tamanho máximo: 5 MB.</Helper>
            <ErrorText msg={errors.fotoErro} />
          </div>
        </div>

        {/* ── SECTION 2 — Saúde e Cuidados ─────────────────────────────── */}
        <div className="card p-6">
          <SectionHeader icon={Heart} num={2} title="Saúde e Cuidados" />

          {/* Vacinas em dia */}
          <div className="mb-6" {...errAttr('vacinasEmDia')}>
            <FieldLabel required>O pet está com as vacinas em dia?</FieldLabel>
            <YesNoField name="vacinasEmDia" value={form.vacinasEmDia}
              onChange={radioField('vacinasEmDia')} error={errors.vacinasEmDia} />
          </div>

          {/* Medicamento */}
          <div className="mb-6" {...errAttr('usaMedicamento')}>
            <FieldLabel required>O pet faz uso de algum medicamento?</FieldLabel>
            <YesNoField name="usaMedicamento" value={form.usaMedicamento}
              onChange={radioField('usaMedicamento')} error={errors.usaMedicamento} />
            {form.usaMedicamento === 'sim' && (
              <div className="mt-3" {...errAttr('descricaoMedicamento')}>
                <textarea
                  className="input-field resize-none" rows={3}
                  placeholder="Descreva o medicamento, dosagem e horários de administração."
                  value={form.descricaoMedicamento}
                  onChange={field('descricaoMedicamento')}
                  aria-required
                />
                <ErrorText msg={errors.descricaoMedicamento} />
              </div>
            )}
          </div>

          {/* Condição de saúde */}
          <div className="mb-6">
            <FieldLabel htmlFor="condicaoSaude">O pet possui alguma condição de saúde especial?</FieldLabel>
            <textarea id="condicaoSaude" className="input-field resize-none" rows={3}
              placeholder="Deixe em branco se não houver."
              value={form.condicaoSaude} onChange={field('condicaoSaude')} />
            <Helper>Ex: diabetes, problemas cardíacos, alergias respiratórias.</Helper>
          </div>

          {/* Restrição alimentar */}
          <div className="mb-6" {...errAttr('restricaoAlimentar')}>
            <FieldLabel required>O pet possui restrições alimentares?</FieldLabel>
            <YesNoField name="restricaoAlimentar" value={form.restricaoAlimentar}
              onChange={radioField('restricaoAlimentar')} error={errors.restricaoAlimentar} />
            {form.restricaoAlimentar === 'sim' && (
              <div className="mt-3" {...errAttr('descricaoRestricao')}>
                <textarea
                  className="input-field resize-none" rows={3}
                  placeholder="Descreva a dieta e os alimentos proibidos."
                  value={form.descricaoRestricao}
                  onChange={field('descricaoRestricao')}
                  aria-required
                />
                <ErrorText msg={errors.descricaoRestricao} />
              </div>
            )}
          </div>

          {/* Ração */}
          <div {...errAttr('racaoConsome')}>
            <FieldLabel htmlFor="racaoConsome" required>Qual ração ou alimento o pet consome?</FieldLabel>
            <input id="racaoConsome" type="text" className="input-field"
              placeholder="Ex.: Royal Canin Golden Retriever"
              value={form.racaoConsome} onChange={field('racaoConsome')} aria-required />
            <ErrorText msg={errors.racaoConsome} />
          </div>
        </div>

        {/* ── SECTION 3 — Comportamento ─────────────────────────────────── */}
        <div className="card p-6">
          <SectionHeader icon={Zap} num={3} title="Comportamento" />

          {/* Com outros cães */}
          <div className="mb-6" {...errAttr('comportamentoCaes')}>
            <FieldLabel required>Como o pet se comporta com outros cães?</FieldLabel>
            <BehaviorField name="comportamentoCaes" value={form.comportamentoCaes}
              onChange={radioField('comportamentoCaes')} error={errors.comportamentoCaes} />
          </div>

          {/* Com gatos */}
          <div className="mb-6" {...errAttr('comportamentoGatos')}>
            <FieldLabel required>Como o pet se comporta com gatos?</FieldLabel>
            <BehaviorField name="comportamentoGatos" value={form.comportamentoGatos}
              onChange={radioField('comportamentoGatos')} error={errors.comportamentoGatos} />
          </div>

          {/* Com crianças */}
          <div className="mb-6" {...errAttr('comportamentoCriancas')}>
            <FieldLabel required>Como o pet se comporta com crianças?</FieldLabel>
            <BehaviorField name="comportamentoCriancas" value={form.comportamentoCriancas}
              onChange={radioField('comportamentoCriancas')} error={errors.comportamentoCriancas} />
          </div>

          {/* Nível de energia */}
          <div className="mb-6" {...errAttr('nivelEnergia')}>
            <FieldLabel required>Nível de energia do pet</FieldLabel>
            <EnergyField value={form.nivelEnergia}
              onChange={radioField('nivelEnergia')} error={errors.nivelEnergia} />
          </div>

          {/* Já fugiu */}
          <div className="mb-6" {...errAttr('jaFugiu')}>
            <FieldLabel required>O pet já fugiu ou tentou fugir?</FieldLabel>
            <YesNoField name="jaFugiu" value={form.jaFugiu}
              onChange={radioField('jaFugiu')} error={errors.jaFugiu} />
            {form.jaFugiu === 'sim' && (
              <div className="mt-3" {...errAttr('descricaoFuga')}>
                <textarea
                  className="input-field resize-none" rows={2}
                  placeholder="Descreva as situações em que isso ocorreu."
                  value={form.descricaoFuga} onChange={field('descricaoFuga')} aria-required
                />
                <ErrorText msg={errors.descricaoFuga} />
              </div>
            )}
          </div>

          {/* Medo de barulho */}
          <div className="mb-6" {...errAttr('medoBarulho')}>
            <FieldLabel required>O pet tem medo de barulhos altos (trovões, fogos)?</FieldLabel>
            <YesNoField name="medoBarulho" value={form.medoBarulho}
              onChange={radioField('medoBarulho')} error={errors.medoBarulho} />
          </div>

          {/* Fica sozinho */}
          <div className="mb-6" {...errAttr('ficaSozinho')}>
            <FieldLabel required>O pet consegue ficar sozinho sem ansiedade?</FieldLabel>
            <YesNoField name="ficaSozinho" value={form.ficaSozinho}
              onChange={radioField('ficaSozinho')} error={errors.ficaSozinho} />
          </div>

          {/* Dorme sozinho */}
          <div className="mb-6" {...errAttr('dormeSozinho')}>
            <FieldLabel required>O pet dorme sozinho?</FieldLabel>
            <YesNoField name="dormeSozinho" value={form.dormeSozinho}
              onChange={radioField('dormeSozinho')} error={errors.dormeSozinho} />
          </div>

          {/* Castrado */}
          <div className="mb-6" {...errAttr('castrado')}>
            <FieldLabel required>O pet é castrado?</FieldLabel>
            <YesNoField name="castrado" value={form.castrado}
              onChange={radioField('castrado')} error={errors.castrado} />
          </div>

          {/* Info adicional */}
          <div>
            <FieldLabel htmlFor="infoComportamento">Informações adicionais sobre o comportamento</FieldLabel>
            <textarea id="infoComportamento" className="input-field resize-none" rows={3}
              placeholder="Deixe em branco se não houver."
              value={form.infoComportamento} onChange={field('infoComportamento')} />
            <Helper>
              Conte o que os anfitriões precisam saber para cuidar bem do seu pet.
            </Helper>
          </div>
        </div>

        {/* ── SECTION 4 — Contato de Emergência ────────────────────────── */}
        <div className="card p-6">
          <SectionHeader icon={Phone} num={4} title="Contato de Emergência" />

          {/* Nome do contato */}
          <div className="mb-5" {...errAttr('nomeContato')}>
            <FieldLabel htmlFor="nomeContato" required>Nome do contato</FieldLabel>
            <input id="nomeContato" type="text" className="input-field" placeholder="Ex.: João Silva"
              value={form.nomeContato} onChange={field('nomeContato')} aria-required />
            <ErrorText msg={errors.nomeContato} />
          </div>

          {/* Telefone | Parentesco */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div {...errAttr('telefoneContato')}>
              <FieldLabel htmlFor="telefoneContato" required>Telefone</FieldLabel>
              <input id="telefoneContato" type="tel" className="input-field"
                placeholder="(11) 99999-8888"
                value={form.telefoneContato} onChange={phoneField('telefoneContato')} aria-required />
              <ErrorText msg={errors.telefoneContato} />
            </div>
            <div {...errAttr('parentesco')}>
              <FieldLabel htmlFor="parentesco" required>Parentesco / Relação</FieldLabel>
              <input id="parentesco" type="text" className="input-field" placeholder="Ex.: Cônjuge, Pai, Irmão"
                value={form.parentesco} onChange={field('parentesco')} aria-required />
              <ErrorText msg={errors.parentesco} />
            </div>
          </div>

          {/* Clínica vet */}
          <div className="mb-5">
            <FieldLabel htmlFor="clinicaVet">Clínica veterinária de preferência</FieldLabel>
            <input id="clinicaVet" type="text" className="input-field" placeholder="Ex.: Clínica Bicho Feliz"
              value={form.clinicaVet} onChange={field('clinicaVet')} />
          </div>

          {/* Telefone clínica | Endereço clínica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="telefoneClinica">Telefone da Clínica</FieldLabel>
              <input id="telefoneClinica" type="tel" className="input-field"
                placeholder="(11) 3333-4444"
                value={form.telefoneClinica} onChange={phoneField('telefoneClinica')} />
            </div>
            <div>
              <FieldLabel htmlFor="enderecoClinica">Endereço da Clínica</FieldLabel>
              <input id="enderecoClinica" type="text" className="input-field"
                placeholder="Rua, número e bairro"
                value={form.enderecoClinica} onChange={field('enderecoClinica')} />
            </div>
          </div>
        </div>

        {/* ── Submit ────────────────────────────────────────────────────── */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/meus-pets')}
            className="btn-outline flex-1 sm:flex-none sm:px-8"
          >
            Cancelar
          </button>
          <button type="submit" className="btn-gradient flex-1 flex items-center justify-center gap-2">
            <CheckCircle2 size={16} />
            {isEdit ? 'Salvar alterações' : 'Cadastrar pet'}
          </button>
        </div>
      </form>

    </div>
  )
}
