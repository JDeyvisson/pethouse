export default function FormFeedback({ message, retry }: { message: string | null; retry?: () => void }) {
  if (!message) return null
  return <div role="alert" tabIndex={-1} className="my-4 p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-sm text-text break-words">
    {message}{retry && <button type="button" onClick={retry} className="block mt-2 underline font-semibold">Tentar novamente</button>}
  </div>
}
