import { useNavigate } from 'react-router-dom'
import { Star, MapPin, ShieldCheck, Home } from 'lucide-react'
import type { Sitter } from '../data/sitters'

interface SitterCardProps {
  sitter: Sitter
}

export default function SitterCard({ sitter }: SitterCardProps) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/perfil-sitter/${sitter.id}`)}
      className="card p-5 w-full text-left hover:border-strong hover:bg-surface-2 transition-all group"
    >
      <div className="flex gap-4">
        <div className="relative flex-shrink-0">
          <img
            src={sitter.photo}
            alt={sitter.name}
            className="w-16 h-16 rounded-2xl object-cover"
          />
          {/* Match badge */}
          <div
            className="absolute -top-2 -right-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: '#FF7E5F' }}
          >
            {sitter.matchPercent}%
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-text group-hover:text-primary transition-colors">{sitter.name}</p>
              <div className="flex items-center gap-1 text-xs text-muted mt-0.5">
                <MapPin size={11} />
                <span>{sitter.location} · {sitter.distance}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-text">R$ {sitter.pricePerDay}</p>
              <p className="text-[10px] text-muted">/diária</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {sitter.verified && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-medium">
                <ShieldCheck size={10} /> Identidade verificada
              </span>
            )}
            {sitter.homeInspected && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-medium">
                <Home size={10} /> Casa vistoriada
              </span>
            )}
          </div>

          {/* Rating + services */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-medium text-text">{sitter.rating}</span>
              <span className="text-xs text-muted">({sitter.reviewCount})</span>
            </div>
            <p className="text-[10px] text-muted truncate max-w-[160px]">{sitter.services.join(' · ')}</p>
          </div>
        </div>
      </div>
    </button>
  )
}
