import { useEffect, useState } from 'react'
export default function AppFeedback() {
  const [message, setMessage] = useState<string | null>(null)
  useEffect(() => {
    const notice = sessionStorage.getItem('ph_notice')
    if (notice) { setMessage(notice); sessionStorage.removeItem('ph_notice') }
    const onError = (e: Event) => setMessage((e as CustomEvent<string>).detail)
    window.addEventListener('ph:error', onError)
    return () => window.removeEventListener('ph:error', onError)
  }, [])
  if (!message) return null
  return <div role="alert" className="relative z-[100] p-4 rounded-xl bg-surface border border-red-500 shadow-xl text-text">
    <p>{message}</p><button className="mt-2 underline" onClick={() => setMessage(null)}>Fechar aviso</button>
  </div>
}
