import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Eye, EyeOff, Camera, ChevronRight, ChevronLeft,
  Home, User, ShieldCheck, CreditCard, MapPin, Loader2,
} from 'lucide-react'
import PetHouseLogo from '../components/PetHouseLogo'
import { useAuth, roleFromApi, type UserRole } from '../context/AuthContext'
import { api, ApiError } from '../lib/api'

interface RegisterResponse {
  token: string
  user: { id: string; name: string; email: string; role: string }
}

// ── Step 1 state
const emptyBase = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  type: 'tutor' as UserRole,
}

// ── Step 2 tutor: endereço
const emptyTutorAddress = {
  cep: '',
  street: '',
  addressNum: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
}

// ── Step 3 tutor card (opcional)
const emptyTutorCard = {
  brand: '',
  last4: '',
  expiry: '',
  holder: '',
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i < step ? 'bg-primary' : 'bg-subtle-lg'}`}
        />
      ))}
    </div>
  )
}

export default function Cadastrar() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [step, setStep] = useState(1)
  const [base, setBase] = useState(emptyBase)
  const [tutorAddress, setTutorAddress] = useState(emptyTutorAddress)
  const [tutorCard, setTutorCard] = useState(emptyTutorCard)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const submittingRef = useRef(false)

  // Cuidador state (kept for the UI flow, not persisted here)
  const [cuidador, setCuidador] = useState({
    cpf: '', docPreview: '', address: '', number: '',
    neighborhood: '', city: '', maxPets: '2',
    petTypes: [] as string[], housePhotos: [] as string[],
  })

  const isTutor = base.type === 'tutor'
  const totalSteps = 3

  const passwordsMatch = base.password.length > 0 && base.password === base.confirmPassword
  const passwordLongEnough = base.password.length >= 8
  const step1Valid = base.name && base.email && base.phone && passwordsMatch && passwordLongEnough && acceptedTerms
  const step2AddressValid = tutorAddress.city.trim().length > 0

  const handleBaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'type') setBase(prev => ({ ...prev, type: value as UserRole }))
    else setBase(prev => ({ ...prev, [name]: value }))
  }

  // ── CEP lookup ──────────────────────────────────────────────────────────
  const formatCep = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 8)
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
  }

  const fetchCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setTutorAddress(p => ({
          ...p,
          street: data.logradouro || p.street,
          neighborhood: data.bairro || p.neighborhood,
          city: data.localidade || p.city,
          state: data.uf || p.state,
        }))
      }
    } catch { /* ignore */ } finally { setCepLoading(false) }
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value)
    setTutorAddress(p => ({ ...p, cep: formatted }))
    if (formatted.replace(/\D/g, '').length === 8) fetchCep(formatted)
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  const next = async () => {
    setTouched(true)
    if (step === 1) {
      if (!step1Valid) return
      if (!isTutor) { await finish(); return }
    }
    if (step === 2 && isTutor && !step2AddressValid) return
    setTouched(false)
    setStep(s => s + 1)
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  const finish = async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setApiError(null)
    setLoading(true)
    try {
      const res = await api.post<RegisterResponse>('/auth/register', {
        name: base.name,
        email: base.email,
        password: base.password,
        role: base.type === 'cuidador' ? 'CUIDADOR' : 'TUTOR',
        phone: base.phone || undefined,
        ...(isTutor ? {
          cep: tutorAddress.cep.replace(/\D/g, '') || undefined,
          street: tutorAddress.street || undefined,
          addressNum: tutorAddress.addressNum || undefined,
          complement: tutorAddress.complement || undefined,
          neighborhood: tutorAddress.neighborhood || undefined,
          city: tutorAddress.city || undefined,
          state: tutorAddress.state || undefined,
        } : {}),
      })
      login(res.token, {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: roleFromApi(res.user.role),
      })
      if (isTutor && tutorCard.brand && tutorCard.last4.length === 4 && tutorCard.expiry) {
        try {
          await api.post('/payment-cards', {
            brand: tutorCard.brand,
            last4: tutorCard.last4,
            expiry: tutorCard.expiry,
            holder: tutorCard.holder || undefined,
          })
        } catch { /* cartão inválido — não bloqueia */ }
      }
      navigate(base.type === 'cuidador' ? '/cadastro-anfitriao' : '/home')
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(
          err.fields && Object.keys(err.fields).length > 0
            ? Object.values(err.fields).join(', ')
            : err.message
        )
      } else if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
        setApiError('Sem conexão com o servidor. Verifique se o servidor está rodando e tente novamente.')
      } else {
        setApiError(err instanceof Error ? err.message : 'Erro ao criar conta. Tente novamente.')
      }
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  const fc = 'mt-2 w-full border-0 border-b-2 border-medium focus:border-primary pb-2 text-text placeholder-muted/50 outline-none bg-transparent transition-colors'
  const btnPrimary = 'bg-primary hover:bg-primary-dark text-white transition-colors'

  return (
    <div className="relative min-h-screen bg-bg flex items-center justify-center p-4 py-10 overflow-hidden bg-paw-pattern">
      <div
        className="pointer-events-none absolute -top-40 -left-20 w-[420px] h-[420px] rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(94,139,126,0.25) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-20 w-[420px] h-[420px] rounded-full blur-3xl opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(255,126,95,0.2) 0%, transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm animate-fade-in-up">
        <div className="flex justify-center mb-10">
          <PetHouseLogo />
        </div>

        <div className="card p-8">
          <ProgressBar step={step} total={totalSteps} />

          {apiError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-500">
              {apiError}
            </div>
          )}

          {/* ──────────── STEP 1: Dados básicos ──────────── */}
          {step === 1 && (
            <>
              <h1 className="text-2xl font-display font-semibold text-text mb-1">Criar conta</h1>
              <p className="text-sm text-muted mb-8">Conecte-se aos melhores anfitriões</p>

              <div className="flex flex-col gap-5">
                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Nome completo</label>
                  <input name="name" type="text" value={base.name} onChange={handleBaseChange}
                    placeholder="Marina Costa" className={fc} />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Email</label>
                  <input name="email" type="email" value={base.email} onChange={handleBaseChange}
                    placeholder="marina@email.com" className={fc} />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Telefone</label>
                  <input name="phone" type="tel" value={base.phone} onChange={handleBaseChange}
                    placeholder="(11) 99999-8888" className={fc} />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Senha</label>
                  <div className="relative mt-2">
                    <input name="password" type={showPassword ? 'text' : 'password'} value={base.password}
                      onChange={handleBaseChange} placeholder="••••••••"
                      className="w-full border-0 border-b-2 border-medium focus:border-primary pb-2 text-text placeholder-muted/50 outline-none bg-transparent transition-colors pr-8" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 bottom-2 text-muted hover:text-text transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Confirmar senha</label>
                  <div className="relative mt-2">
                    <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'}
                      value={base.confirmPassword} onChange={handleBaseChange} placeholder="••••••••"
                      className={`w-full border-0 border-b-2 pb-2 text-text placeholder-muted/50 outline-none bg-transparent transition-colors pr-8 ${
                        touched && base.confirmPassword && !passwordsMatch ? 'border-red-500' : 'border-medium focus:border-primary'
                      }`} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-0 bottom-2 text-muted hover:text-text transition-colors">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {touched && base.password && !passwordLongEnough && (
                    <p className="text-xs text-red-500 mt-1">A senha deve ter no mínimo 8 caracteres.</p>
                  )}
                  {touched && base.confirmPassword && passwordLongEnough && !passwordsMatch && (
                    <p className="text-xs text-red-500 mt-1">As senhas não coincidem.</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Tipo de conta</label>
                  <div className="mt-2 flex gap-3">
                    {(['tutor', 'cuidador'] as UserRole[]).map(type => (
                      <label key={type} className="flex-1">
                        <input type="radio" name="type" value={type}
                          checked={base.type === type} onChange={handleBaseChange} className="sr-only" />
                        <span className={`flex flex-col items-center py-2 rounded-xl text-sm font-medium cursor-pointer border-2 transition-all ${
                          base.type === type ? 'border-primary bg-primary/10 text-primary' : 'border-medium text-muted hover:border-stronger'
                        }`}>
                          {type === 'tutor' ? <User size={16} className="mb-1" /> : <Home size={16} className="mb-1" />}
                          {type === 'tutor' ? 'Tutor' : 'Anfitrião'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="sr-only" />
                  <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    acceptedTerms ? 'bg-primary border-primary' : 'border-medium'
                  }`}>
                    {acceptedTerms && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="text-xs text-muted leading-relaxed">
                    Li e aceito os <span className="text-primary font-medium">Termos de Uso</span> e a{' '}
                    <span className="text-primary font-medium">Política de Privacidade</span>.
                  </span>
                </label>
                {touched && !acceptedTerms && (
                  <p className="text-xs text-red-500 -mt-3">É necessário aceitar os termos para continuar.</p>
                )}

                <button type="button" onClick={next}
                  className={`w-full py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 mt-1 ${btnPrimary}`}>
                  Próximo <ChevronRight size={16} />
                </button>
              </div>

              <p className="mt-5 text-center text-sm text-muted">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
              </p>
            </>
          )}

          {/* ──────────── STEP 2 (Tutor): Endereço ──────────── */}
          {step === 2 && isTutor && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={20} className="text-primary" />
                <h1 className="text-xl font-display font-semibold text-text">Seu endereço</h1>
              </div>
              <p className="text-sm text-muted mb-6">
                Usamos para calcular o preço médio de hospedagem na sua região.
              </p>

              <div className="flex flex-col gap-5">
                {/* CEP */}
                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">CEP</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={tutorAddress.cep}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      maxLength={9}
                      className={fc}
                    />
                    {cepLoading && (
                      <Loader2 size={13} className="animate-spin absolute right-0 bottom-2.5 text-muted" />
                    )}
                  </div>
                </div>

                {/* Rua */}
                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Rua / Logradouro</label>
                  <input
                    type="text"
                    value={tutorAddress.street}
                    onChange={e => setTutorAddress(p => ({ ...p, street: e.target.value }))}
                    placeholder="Rua das Flores"
                    className={fc}
                  />
                </div>

                {/* Número + Complemento */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted uppercase tracking-wider">Número</label>
                    <input
                      type="text"
                      value={tutorAddress.addressNum}
                      onChange={e => setTutorAddress(p => ({ ...p, addressNum: e.target.value }))}
                      placeholder="42"
                      className={fc}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted uppercase tracking-wider">
                      Complemento <span className="text-muted/60 font-normal normal-case">(opc.)</span>
                    </label>
                    <input
                      type="text"
                      value={tutorAddress.complement}
                      onChange={e => setTutorAddress(p => ({ ...p, complement: e.target.value }))}
                      placeholder="Apto 3"
                      className={fc}
                    />
                  </div>
                </div>

                {/* Bairro */}
                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Bairro</label>
                  <input
                    type="text"
                    value={tutorAddress.neighborhood}
                    onChange={e => setTutorAddress(p => ({ ...p, neighborhood: e.target.value }))}
                    placeholder="Jardim Paulista"
                    className={fc}
                  />
                </div>

                {/* Cidade + Estado */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted uppercase tracking-wider">
                      Cidade <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={tutorAddress.city}
                      onChange={e => setTutorAddress(p => ({ ...p, city: e.target.value }))}
                      placeholder="São Paulo"
                      className={`${fc} ${touched && !step2AddressValid ? 'border-red-500' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted uppercase tracking-wider">UF</label>
                    <input
                      type="text"
                      value={tutorAddress.state}
                      onChange={e => setTutorAddress(p => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))}
                      placeholder="SP"
                      maxLength={2}
                      className={fc}
                    />
                  </div>
                </div>

                {touched && !step2AddressValid && (
                  <p className="text-xs text-red-500 -mt-3">Cidade é obrigatória para calcular o preço da região.</p>
                )}

                <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-xs text-primary leading-relaxed">
                  O endereço é usado somente para calcular o preço médio de hospedagem perto de você. Não é exibido para anfitriões.
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-2xl font-semibold border-2 border-medium text-muted flex items-center justify-center gap-1 hover:border-stronger transition-colors">
                  <ChevronLeft size={16} /> Voltar
                </button>
                <button type="button" onClick={next}
                  className={`flex-[2] py-3 px-6 rounded-2xl font-semibold flex items-center justify-center gap-1 ${btnPrimary}`}>
                  Próximo <ChevronRight size={16} />
                </button>
              </div>

              <button type="button" onClick={() => { setTouched(false); setStep(3) }}
                className="mt-3 w-full text-center text-sm text-muted hover:text-text transition-colors">
                Pular endereço
              </button>
            </>
          )}

          {/* ──────────── STEP 3 (Tutor): Cartão de pagamento ──────────── */}
          {step === 3 && isTutor && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard size={20} className="text-primary" />
                <h1 className="text-xl font-display font-semibold text-text">Método de pagamento</h1>
              </div>
              <p className="text-sm text-muted mb-6">
                Adicione um cartão para reservar com mais rapidez. <span className="text-muted">(opcional)</span>
              </p>

              <div className="flex flex-col gap-5">
                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Bandeira</label>
                  <select
                    value={tutorCard.brand}
                    onChange={e => setTutorCard(p => ({ ...p, brand: e.target.value }))}
                    className="mt-2 w-full border-0 border-b-2 border-medium focus:border-primary pb-2 text-text outline-none bg-transparent transition-colors"
                  >
                    <option value="">Selecione a bandeira</option>
                    <option>Visa</option>
                    <option>Mastercard</option>
                    <option>Elo</option>
                    <option>Amex</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Últimos 4 dígitos</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={tutorCard.last4}
                    onChange={e => setTutorCard(p => ({ ...p, last4: e.target.value.replace(/\D/g, '') }))}
                    placeholder="0000"
                    className={fc}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Validade (MM/AA)</label>
                  <input
                    type="text"
                    maxLength={5}
                    value={tutorCard.expiry}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setTutorCard(p => ({ ...p, expiry: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits }))
                    }}
                    placeholder="12/29"
                    className={fc}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">
                    Nome no cartão <span className="text-muted/60 font-normal normal-case">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={tutorCard.holder}
                    onChange={e => setTutorCard(p => ({ ...p, holder: e.target.value.toUpperCase() }))}
                    placeholder="MARINA COSTA"
                    className={fc}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-2xl font-semibold border-2 border-medium text-muted flex items-center justify-center gap-1 hover:border-stronger transition-colors">
                  <ChevronLeft size={16} /> Voltar
                </button>
                <button type="button" onClick={finish} disabled={loading}
                  className={`flex-[2] py-3 px-6 rounded-2xl font-semibold flex items-center justify-center gap-1 disabled:opacity-60 ${btnPrimary}`}>
                  {loading ? 'Criando conta…' : 'Concluir cadastro'}
                </button>
              </div>
              <button type="button" onClick={finish} disabled={loading}
                className="mt-3 w-full text-center text-sm text-muted hover:text-text transition-colors disabled:opacity-40">
                Pular e concluir sem cartão
              </button>
            </>
          )}

          {/* ──────────── STEP 2 (Cuidador): Verificação de perfil ──────────── */}
          {step === 2 && !isTutor && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={20} className="text-primary" />
                <h1 className="text-xl font-display font-semibold text-text">Verificação de perfil</h1>
              </div>
              <p className="text-sm text-muted mb-6">Sua identidade será verificada em até 24h.</p>

              <div className="flex flex-col gap-5">
                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">CPF</label>
                  <input value={cuidador.cpf}
                    onChange={e => setCuidador(p => ({ ...p, cpf: e.target.value }))}
                    placeholder="000.000.000-00" className={fc} />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-2">
                    Documento (RG ou CNH)
                  </label>
                  <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-medium rounded-xl cursor-pointer hover:border-primary transition-colors">
                    {cuidador.docPreview ? (
                      <img src={cuidador.docPreview} alt="Documento" className="h-24 object-contain rounded-lg" />
                    ) : (
                      <>
                        <Camera size={24} className="text-muted/50" />
                        <p className="text-xs text-muted text-center">Clique para enviar foto do documento</p>
                      </>
                    )}
                    <input type="file" accept="image/*" className="sr-only"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) setCuidador(p => ({ ...p, docPreview: URL.createObjectURL(file) }))
                      }} />
                  </label>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-xs text-primary">
                  Suas informações são protegidas e usadas apenas para verificação de identidade.
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-2xl font-semibold border-2 border-medium text-muted flex items-center justify-center gap-1 hover:border-stronger transition-colors">
                  <ChevronLeft size={16} /> Voltar
                </button>
                <button type="button" onClick={() => setStep(3)}
                  className={`flex-[2] py-3 px-6 rounded-2xl font-semibold flex items-center justify-center gap-1 ${btnPrimary}`}>
                  Próximo <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* ──────────── STEP 3 (Cuidador): Verificação da casa ──────────── */}
          {step === 3 && !isTutor && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Home size={20} className="text-primary" />
                <h1 className="text-xl font-display font-semibold text-text">Verificação da casa</h1>
              </div>
              <p className="text-sm text-muted mb-6">Mostre o espaço onde os pets ficarão hospedados.</p>

              <div className="flex flex-col gap-5">
                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Rua e número</label>
                  <input value={cuidador.address}
                    onChange={e => setCuidador(p => ({ ...p, address: e.target.value }))}
                    placeholder="Rua das Flores, 42" className={fc} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted uppercase tracking-wider">Bairro</label>
                    <input value={cuidador.neighborhood}
                      onChange={e => setCuidador(p => ({ ...p, neighborhood: e.target.value }))}
                      placeholder="Jardim Paulista" className={fc} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted uppercase tracking-wider">Cidade</label>
                    <input value={cuidador.city}
                      onChange={e => setCuidador(p => ({ ...p, city: e.target.value }))}
                      placeholder="São Paulo" className={fc} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-2">
                    Fotos da casa (até 4)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <label key={i} className="relative cursor-pointer group">
                        <div className="h-24 rounded-xl border-2 border-dashed border-medium group-hover:border-primary transition-colors overflow-hidden flex items-center justify-center bg-subtle">
                          {cuidador.housePhotos[i] ? (
                            <img src={cuidador.housePhotos[i]} alt={`Casa ${i + 1}`} className="w-full h-full object-cover" />
                          ) : (
                            <Camera size={20} className="text-muted/40" />
                          )}
                        </div>
                        {!cuidador.housePhotos[i] && (
                          <input type="file" accept="image/*" multiple className="sr-only"
                            onChange={e => {
                              const files = Array.from(e.target.files ?? []).slice(0, 4)
                              const urls = files.map(f => URL.createObjectURL(f))
                              setCuidador(p => ({ ...p, housePhotos: [...p.housePhotos, ...urls].slice(0, 4) }))
                            }} />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-2">
                    Máx. de pets simultâneos
                  </label>
                  <select value={cuidador.maxPets}
                    onChange={e => setCuidador(p => ({ ...p, maxPets: e.target.value }))}
                    className="w-full bg-surface-2 border border-medium rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition-colors">
                    {['1', '2', '3', '4', '5'].map(n => (
                      <option key={n} value={n}>{n} {n === '1' ? 'pet' : 'pets'}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-2">
                    Tipos de pets aceitos
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {['Cachorro', 'Gato', 'Outros'].map(type => (
                      <button key={type} type="button"
                        onClick={() => setCuidador(p => ({
                          ...p,
                          petTypes: p.petTypes.includes(type) ? p.petTypes.filter(t => t !== type) : [...p.petTypes, type],
                        }))}
                        className={`px-3 py-1.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          cuidador.petTypes.includes(type) ? 'border-primary bg-primary/10 text-primary' : 'border-medium text-muted'
                        }`}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-2xl font-semibold border-2 border-medium text-muted flex items-center justify-center gap-1 hover:border-stronger transition-colors">
                  <ChevronLeft size={16} /> Voltar
                </button>
                <button type="button" onClick={finish} disabled={loading}
                  className={`flex-[2] py-3 px-6 rounded-2xl font-semibold disabled:opacity-60 ${btnPrimary}`}>
                  {loading ? 'Criando conta…' : 'Concluir cadastro'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
