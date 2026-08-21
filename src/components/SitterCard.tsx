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
      className="card p-4 w-full text-left transition-all group"
    >
      <div className="flex gap-4">
        <div className="relative flex-shrink-0 overflow-hidden rounded-2xl w-24 h-24 sm:w-28 sm:h-28">
          <img
            src={sitter.photo}
            alt={sitter.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Match badge */}
          <div className="absolute top-1.5 left-1.5 bg-coral text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            {sitter.matchPercent}% match
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
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
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-info/15 text-info text-[10px] font-medium">
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
