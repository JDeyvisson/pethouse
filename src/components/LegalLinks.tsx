export default function LegalLinks() {
  return <>Li e aceito os <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-primary underline" onClick={e => e.stopPropagation()}>Termos de Uso</a> e a <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-primary underline" onClick={e => e.stopPropagation()}>Política de Privacidade</a> (abrem em nova aba).</>
}
