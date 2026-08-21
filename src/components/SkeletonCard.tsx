export default function SkeletonCard() {
  return (
    <div className="card p-5 w-full">
      <div className="flex gap-4">
        <div className="skeleton w-16 h-16 rounded-2xl flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2.5 py-1">
          <div className="skeleton h-3.5 w-2/5 rounded-full" />
          <div className="skeleton h-2.5 w-3/5 rounded-full" />
          <div className="flex gap-2 pt-1">
            <div className="skeleton h-4 w-24 rounded-full" />
            <div className="skeleton h-4 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
