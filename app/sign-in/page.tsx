"use client"

import { createAuthClient } from "better-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const authClient = createAuthClient()

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [seedLoading, setSeedLoading] = useState(false)
  const [seedMessage, setSeedMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      })

      if (result.error) {
        setError(result.error.message || "Error al iniciar sesión")
      } else {
        router.push("/dashboard")
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Compra Inteligente</h1>
          <p className="text-slate-600 mt-2">Ingresa a tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>
        </form>

        {seedMessage && (
          <div className="mt-4 p-3 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs">
            {seedMessage}
          </div>
        )}

        <div className="mt-6 p-4 border rounded-lg bg-slate-50">
          <p className="text-sm font-semibold text-slate-800">Acceso rápido demo por rol</p>
          <p className="text-xs text-slate-600 mt-1">
            Para probar vistas por rol usá estas cuentas (password: <code>12345678</code>)
          </p>
          <button
            type="button"
            onClick={async () => {
              setSeedLoading(true)
              setSeedMessage("")
              try {
                const [resSeed, resAuth] = await Promise.all([
                  fetch("/api/dev/seed", { method: "POST" }),
                  fetch("/api/dev/setup-demo-auth", { method: "POST" }),
                ])
                const dataSeed = await resSeed.json()
                const dataAuth = await resAuth.json()
                if (!resSeed.ok) throw new Error(dataSeed.error || "No se pudo ejecutar seed")
                if (!resAuth.ok) throw new Error(dataAuth.error || "No se pudieron crear cuentas demo")
                setSeedMessage("Seed sintético ejecutado. Ya podés probar el dashboard por rol.")
              } catch (e: any) {
                setSeedMessage(e.message || "Error ejecutando seed")
              } finally {
                setSeedLoading(false)
              }
            }}
            className="mt-3 w-full px-3 py-2 rounded border text-xs bg-white hover:bg-slate-100"
          >
            {seedLoading ? "Preparando data sintética..." : "Preparar data sintética demo"}
          </button>
          <div className="mt-3 space-y-2 text-xs text-slate-700">
            <QuickFill label="ADMIN" email="admin@demo.pe" onFill={(mail) => { setEmail(mail); setPassword("12345678") }} />
            <QuickFill label="ASESOR" email="asesor@demo.pe" onFill={(mail) => { setEmail(mail); setPassword("12345678") }} />
            <QuickFill label="ANALISTA" email="analista@demo.pe" onFill={(mail) => { setEmail(mail); setPassword("12345678") }} />
            <QuickFill label="AUDITOR" email="auditor@demo.pe" onFill={(mail) => { setEmail(mail); setPassword("12345678") }} />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿No tienes cuenta?{" "}
          <Link href="/sign-up" className="text-blue-600 hover:underline font-medium">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}

function QuickFill({
  label,
  email,
  onFill,
}: {
  label: string
  email: string
  onFill: (email: string) => void
}) {
  return (
    <button
      type="button"
      className="w-full text-left px-3 py-2 border rounded hover:bg-white"
      onClick={() => onFill(email)}
    >
      <span className="font-semibold">{label}</span> — {email}
    </button>
  )
}
