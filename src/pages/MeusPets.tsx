import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit3, Stethoscope, Weight, Pill as PillIcon, Syringe, History, CheckCircle2, Clock, X, Camera } from 'lucide-react'
import { api } from '../lib/api'
import Pill from '../components/Pill'
import PawPrintDecor from '../components/PawPrint'

interface ApiPet {
  id: string
  name: string
  species: string
  breed: string
  sex: string
  size: string
  birthDate?: string | null
  photoUrl?: string | null
  vaccinesUpToDate?: boolean
  usesMedication?: boolean
  medicationDesc?: string | null
  healthCondition?: string | null
  vetClinic?: string | null
  vetPhone?: string | null
  behaviorNotes?: string | null
}

interface Pet {
  id: string
  name: string
  species: string
  breed: string
  age: string
  size: string
  weight: string
  photo: string
  vet: string
  notes: string
  medication: string
  vaccines: { name: string; status: 'em_dia' | 'pendente' }[]
  careHistory: { date: string; service: string; sitterName: string }[]
  preferences: string[]
}

function apiPetToLocal(p: ApiPet): Pet {
  let age = 'Não informado'
  if (p.birthDate) {
    const years = Math.floor((Date.now() - new Date(p.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
    age = years <= 0 ? 'Menos de 1 ano' : `${years} ${years === 1 ? 'ano' : 'anos'}`
  }
  const vetParts = [p.vetClinic, p.vetPhone].filter(Boolean)
  return {
    id: p.id,
    name: p.name,
    species: p.species,
    breed: p.breed,
    age,
    size: p.size,
    weight: 'Não informado',
    photo: p.photoUrl ? `${(import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace('/api', '')}${p.photoUrl}` : '',
    vet: vetParts.length > 0 ? vetParts.join(' · ') : 'Não informado',
    notes: p.behaviorNotes || p.healthCondition || 'Nenhuma observação cadastrada.',
    medication: p.usesMedication && p.medicationDesc ? p.medicationDesc : 'Nenhuma medicação contínua.',
    vaccines: p.vaccinesUpToDate ? [{ name: 'Vacinas', status: 'em_dia' }] : [],
    careHistory: [],
    preferences: [],
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const speciesOptions = ['Cachorro', 'Gato', 'Pássaro', 'Coelho', 'Outro']
const sizeOptions = ['Pequeno', 'Médio', 'Grande', 'Gigante']

const emptyForm = {
  name: '',
  species: speciesOptions[0],
  breed: '',
  age: '',
  size: sizeOptions[0],
  weight: '',
  notes: '',
  photo: '',
}

export default function MeusPets() {
  const navigate = useNavigate()
  const [pets, setPets] = useState<Pet[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    api.get<ApiPet[]>('/pets')
      .then(data => {
        const mapped = data.map(apiPetToLocal)
        setPets(mapped)
        if (mapped.length > 0) setSelected(mapped[0].id)
      })
      .catch(() => { /* keep empty */ })
      .finally(() => setLoading(false))
  }, [])

  const pet = pets.find(p => p.id === selected) ?? null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handlePetPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setForm(prev => ({ ...prev, photo: URL.createObjectURL(file) }))
  }

  const closeModal = () => {
    setShowAddModal(false)
    setForm(emptyForm)
  }

  const handleAddPet = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.breed) return

    const newPet: Pet = {
      id: `p${Date.now()}`,
      name: form.name,
      species: form.species,
      breed: form.breed,
      age: form.age || 'Não informado',
      size: form.size,
      weight: form.weight || 'Não informado',
      photo: form.photo || 'https://images.unsplash.com/photo-1517849845537-4d257902861a?w=300&h=300&fit=crop',
      vet: 'Não informado',
      notes: form.notes || 'Nenhuma observação cadastrada.',
      medication: 'Nenhuma medicação contínua.',
      vaccines: [],
      careHistory: [],
      preferences: [],
    }

    setPets(prev => [...prev, newPet])
    setSelected(newPet.id)
    closeModal()
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div><Pill>Meus Pets</Pill><h1 className="font-display text-3xl font-bold text-text mt-3">Meus pets</h1></div>
        </div>
        <div className="card p-12 text-center text-muted text-sm">Carregando…</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Pill>Meus Pets</Pill>
          <h1 className="font-display text-3xl font-bold text-text mt-3">Meus pets</h1>
          <p className="text-muted text-sm mt-1">Gerencie os perfis dos seus companheiros.</p>
        </div>
        <button onClick={() => navigate('/meus-pets/novo')} className="btn-gradient flex items-center gap-2">
          <Plus size={16} /> Adicionar pet
        </button>
      </div>

      {pets.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-muted text-sm">Você ainda não tem pets cadastrados.</p>
          <button onClick={() => navigate('/meus-pets/novo')} className="btn-gradient mt-4 mx-auto">Cadastrar pet</button>
        </div>
      )}

      {/* Pet selector */}
      <div className="flex gap-3 flex-wrap">
        {pets.map(p => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
              selected === p.id
                ? 'border-primary bg-primary/10'
                : 'border-medium bg-surface hover:border-stronger'
            }`}
          >
            {p.photo ? (
              <img src={p.photo} alt={p.name} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">{p.name.charAt(0)}</div>
            )}
            <div className="text-left">
              <p className="text-sm font-semibold text-text">{p.name}</p>
              <p className="text-xs text-muted">{p.breed}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Pet detail */}
      {pet && <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          {/* Profile card */}
          <div className="card p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                {pet.photo ? (
                  <img src={pet.photo} alt={pet.name} className="w-20 h-20 rounded-2xl object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold text-3xl">{pet.name.charAt(0)}</div>
                )}
                <div>
                  <h2 className="text-2xl font-display font-bold text-text">{pet.name}</h2>
                  <p className="text-muted text-sm">{pet.species} · {pet.breed}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-lg bg-subtle text-xs text-muted">{pet.age}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-subtle text-xs text-muted">Porte {pet.size}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-subtle text-xs text-muted">{pet.weight}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => navigate(`/editar-pet/${pet.id}`)} className="p-2 rounded-xl bg-subtle text-muted hover:text-text transition-colors">
                <Edit3 size={16} />
              </button>
            </div>

            <div className="border-t border-subtle pt-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Observações</p>
              <p className="text-sm text-text leading-relaxed">{pet.notes}</p>
            </div>

            <div className="border-t border-subtle pt-4">
              <div className="flex items-center gap-2 mb-2">
                <PillIcon size={14} className="text-primary" />
                <p className="text-xs font-medium text-muted uppercase tracking-wider">Medicação</p>
              </div>
              <p className="text-sm text-text">{pet.medication}</p>
            </div>

            <div className="border-t border-subtle pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope size={14} className="text-primary" />
                <p className="text-xs font-medium text-muted uppercase tracking-wider">Veterinário</p>
              </div>
              <p className="text-sm text-text">{pet.vet}</p>
            </div>
          </div>

          {/* Histórico de cuidados */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <History size={14} className="text-primary" />
              <p className="text-xs font-medium text-muted uppercase tracking-wider">Histórico de cuidados</p>
            </div>
            {pet.careHistory.length === 0 ? (
              <p className="text-sm text-muted flex items-center gap-2">
                <PawPrintDecor size={14} className="text-primary/40 flex-shrink-0" />
                Nenhum cuidado registrado ainda — o histórico aparece após a primeira hospedagem.
              </p>
            ) : (
              <div className="space-y-3">
                {pet.careHistory.map((h, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between text-sm ${i < pet.careHistory.length - 1 ? 'pb-3 border-b border-subtle' : ''}`}
                  >
                    <div>
                      <p className="text-text font-medium">{h.service}</p>
                      <p className="text-xs text-muted">com {h.sitterName}</p>
                    </div>
                    <span className="text-xs text-muted">{formatDate(h.date)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Weight size={14} className="text-primary" />
              <p className="text-xs font-medium text-muted uppercase tracking-wider">Dados físicos</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Peso</span>
                <span className="text-text font-medium">{pet.weight}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Idade</span>
                <span className="text-text font-medium">{pet.age}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Porte</span>
                <span className="text-text font-medium">{pet.size}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Espécie</span>
                <span className="text-text font-medium">{pet.species}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Syringe size={14} className="text-primary" />
              <p className="text-xs font-medium text-muted uppercase tracking-wider">Status vacinas</p>
            </div>
            {pet.vaccines.length === 0 ? (
              <p className="text-sm text-muted flex items-center gap-2">
                <PawPrintDecor size={14} className="text-primary/40 flex-shrink-0" />
                Nenhuma vacina registrada ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {pet.vaccines.map(v => (
                  <div key={v.name} className="flex items-center justify-between text-sm">
                    <span className="text-muted">{v.name}</span>
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                        v.status === 'em_dia' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'
                      }`}
                    >
                      {v.status === 'em_dia' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                      {v.status === 'em_dia' ? 'Em dia' : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>}

      {/* Add pet modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <div
            className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-text">Adicionar pet</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg bg-subtle text-muted hover:text-text transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddPet} className="space-y-4">
              {/* Pet photo upload */}
              <div className="flex justify-center">
                <label className="relative cursor-pointer group">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-subtle flex items-center justify-center border-2 border-dashed border-medium group-hover:border-primary transition-colors">
                    {form.photo ? (
                      <img src={form.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={24} className="text-muted" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-primary text-white">
                    <Plus size={10} />
                  </div>
                  <input type="file" accept="image/*" className="sr-only" onChange={handlePetPhoto} />
                </label>
              </div>

              <div>
                <label className="text-xs font-medium text-muted uppercase tracking-wider">Nome*</label>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ex.: Bidu"
                  className="input-field mt-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Espécie</label>
                  <select name="species" value={form.species} onChange={handleChange} className="input-field mt-2">
                    {speciesOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Raça*</label>
                  <input
                    name="breed"
                    type="text"
                    value={form.breed}
                    onChange={handleChange}
                    placeholder="Ex.: Vira-lata"
                    className="input-field mt-2"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Idade</label>
                  <input
                    name="age"
                    type="text"
                    value={form.age}
                    onChange={handleChange}
                    placeholder="Ex.: 2 anos"
                    className="input-field mt-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Peso</label>
                  <input
                    name="weight"
                    type="text"
                    value={form.weight}
                    onChange={handleChange}
                    placeholder="Ex.: 12 kg"
                    className="input-field mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted uppercase tracking-wider">Porte</label>
                <select name="size" value={form.size} onChange={handleChange} className="input-field mt-2">
                  {sizeOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted uppercase tracking-wider">Observações</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Alergias, comportamento, cuidados especiais..."
                  rows={3}
                  className="input-field mt-2 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="btn-outline flex-1">
                  Cancelar
                </button>
                <button type="submit" className="btn-gradient flex-1">
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
