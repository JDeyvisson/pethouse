import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { api } from '../lib/api'
import type { Sitter } from '../data/sitters'
import SitterCard from '../components/SitterCard'
import Pill from '../components/Pill'

const petTypes = ['cachorro', 'gato', 'passaro', 'coelho', 'outro']
const petTypeLabels: Record<string, string> = {
  cachorro: 'Cachorro', gato: 'Gato', passaro: 'Pássaro', coelho: 'Coelho', outro: 'Outro',
}
const sizes = ['pequeno', 'medio', 'grande', 'gigante']
const sizeLabels: Record<string, string> = {
  pequeno: 'Pequeno', medio: 'Médio', grande: 'Grande', gigante: 'Gigante',
}

interface ApiHost {
  id: string
  city: string
  pricePerDay: number
  averageRating?: number | null
  reviewCount?: number | null
  bio?: string | null
  housePhotos?: string[]
  spacePhotos?: string[]
  acceptedSizes?: string[]
  acceptedSpecies?: string[]
  hasHostedBefore?: boolean
  user: { id: string; name: string }
}

const BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:3001'

function hostToSitter(h: ApiHost): Sitter {
  const photo = h.housePhotos?.[0] || h.spacePhotos?.[0]
  return {
    id: h.id,
    name: h.user.name,
    photo: photo ? `${BASE}${photo}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(h.user.name)}&background=5E8B7E&color=fff&size=128`,
    location: h.city,
    distance: '–',
    rating: h.averageRating ?? 0,
    reviewCount: h.reviewCount ?? 0,
    pricePerDay: h.pricePerDay ?? 0,
    services: ['Hospedagem'],
    matchPercent: 95,
    verified: true,
    homeInspected: true,
    bio: h.bio ?? '',
    experience: h.hasHostedBefore ? 'Com experiência' : 'Sem experiência anterior',
    vetPartner: false,
    availability: [],
    availableDates: [],
    gallery: (h.housePhotos ?? []).map(p => `${BASE}${p}`),
    reviews: [],
    policies: [],
    likesCount: 0,
  }
}

export default function Buscar() {
  const [query, setQuery] = useState('')
  const [maxPrice, setMaxPrice] = useState(500)
  const [petType, setPetType] = useState('')
  const [size, setSize] = useState('')
  const [sitters, setSitters] = useState<Sitter[]>([])
  const [loading, setLoading] = useState(true)

  const clearFilters = () => {
    setQuery('')
    setMaxPrice(500)
    setPetType('')
    setSize('')
  }

  const fetchHosts = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (petType) params.set('species', petType)
    if (size) params.set('size', size)
    api.get<ApiHost[]>(`/hosts?${params}`)
      .then(data => setSitters(data.map(hostToSitter)))
      .catch(() => { /* keep empty */ })
      .finally(() => setLoading(false))
  }, [petType, size])

  useEffect(() => { fetchHosts() }, [fetchHosts])

  const filtered = sitters.filter(s => {
    const matchQuery = !query || s.name.toLowerCase().includes(query.toLowerCase()) || s.location.toLowerCase().includes(query.toLowerCase())
    const matchPrice = s.pricePerDay <= maxPrice || s.pricePerDay === 0
    return matchQuery && matchPrice
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Pill>Tela da busca</Pill>
        <h1 className="font-display text-3xl font-bold text-text mt-3">
          Busca de anfitriões para hospedagem
        </h1>
        <p className="text-muted text-sm mt-1">
          Encontre anfitriões verificados próximos de você com filtros inteligentes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Filters panel */}
        <div className="card p-6 h-fit">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-primary" />
                <span className="font-semibold text-text text-sm">Filtros inteligentes</span>
              </div>
              <p className="text-xs text-muted mt-0.5">Busque do seu jeito</p>
            </div>
            <button onClick={clearFilters} className="text-xs text-muted hover:text-text flex items-center gap-1 transition-colors">
              <X size={12} /> Limpar
            </button>
          </div>

          <div className="space-y-5">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Nome ou cidade..."
                className="w-full bg-surface-2 border border-medium rounded-xl pl-9 pr-3 py-2.5 text-sm text-text placeholder-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Price slider */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-medium text-muted uppercase tracking-wider">Preço máximo</span>
                <span className="text-xs text-primary font-semibold">Até R$ {maxPrice}</span>
              </div>
              <input
                type="range"
                min={30}
                max={1000}
                step={10}
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            {/* Pet type */}
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wider">Tipo de pet</label>
              <select
                value={petType}
                onChange={e => setPetType(e.target.value)}
                className="mt-2 w-full bg-surface-2 border border-medium rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Todos</option>
                {petTypes.map(t => <option key={t} value={t}>{petTypeLabels[t]}</option>)}
              </select>
            </div>

            {/* Size */}
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wider">Porte</label>
              <select
                value={size}
                onChange={e => setSize(e.target.value)}
                className="mt-2 w-full bg-surface-2 border border-medium rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Todos</option>
                {sizes.map(s => <option key={s} value={s}>{sizeLabels[s]}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              <span className="text-text font-semibold">{loading ? '…' : filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span> atualizados em tempo real
            </p>
            <Pill variant="coral">Filtros inteligentes</Pill>
          </div>

          {loading ? (
            <div className="card p-12 text-center text-muted text-sm">Carregando anfitriões…</div>
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-muted">Nenhum anfitrião encontrado com os filtros selecionados.</p>
              <button onClick={clearFilters} className="mt-4 text-primary text-sm hover:underline">Limpar filtros</button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(sitter => (
                <SitterCard key={sitter.id} sitter={sitter} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
