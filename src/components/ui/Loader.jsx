export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="relative">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-primary" />
        <div className="absolute inset-0 rounded-full bg-brand-gradient opacity-20 blur-lg" />
      </div>
    </div>
  )
}
