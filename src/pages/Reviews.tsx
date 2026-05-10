export default function Reviews() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Message Reviews</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Flagged messages awaiting review.
        </p>
      </div>
      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        No flagged messages.
      </div>
    </div>
  )
}
