"use client"

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset?: () => void
  unstable_retry?: () => void
}

export default function GlobalError({ error, reset, unstable_retry }: GlobalErrorProps) {
  const retry = unstable_retry ?? reset

  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <main className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <h1 className="text-xl font-semibold">Ocurrió un error inesperado</h1>
          <p className="text-sm text-slate-300">
            No te preocupes, ya estamos trabajando en eso. Podés reintentar en unos segundos.
          </p>
          {error?.digest && (
            <p className="text-xs text-slate-500">Código de error: {error.digest}</p>
          )}

          <div className="flex gap-2">
            {retry && (
              <button
                onClick={() => retry()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                Reintentar
              </button>
            )}
            <a
              href="/"
              className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm"
            >
              Ir al inicio
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
