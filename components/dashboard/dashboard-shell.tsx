"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo, useState } from "react"

type DashboardShellProps = {
  children: React.ReactNode
  userEmail?: string | null
  userRole?: "ADMIN" | "ASESOR" | "ANALISTA" | "AUDITOR"
}

const navItems = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/dashboard/overview", label: "Dashboard KPI" },
  { href: "/dashboard/cotizaciones", label: "Cotizaciones" },
  { href: "/dashboard/clientes", label: "Clientes" },
  { href: "/dashboard/vehiculos", label: "Vehículos" },
  { href: "/dashboard/pagos", label: "Pagos anticipados" },
  { href: "/dashboard/transparencia", label: "Transparencia" },
]

const navByRole: Record<"ADMIN" | "ASESOR" | "ANALISTA" | "AUDITOR", string[]> = {
  ADMIN: navItems.map((n) => n.href),
  ASESOR: navItems.map((n) => n.href),
  ANALISTA: [
    "/dashboard",
    "/dashboard/overview",
    "/dashboard/cotizaciones",
    "/dashboard/pagos",
    "/dashboard/transparencia",
  ],
  AUDITOR: [
    "/dashboard",
    "/dashboard/overview",
    "/dashboard/cotizaciones",
    "/dashboard/clientes",
    "/dashboard/vehiculos",
    "/dashboard/pagos",
    "/dashboard/transparencia",
  ],
}

export function DashboardShell({ children, userEmail, userRole = "ASESOR" }: DashboardShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const allowedHrefs = navByRole[userRole] || navByRole.ASESOR
  const visibleNav = navItems.filter((n) => allowedHrefs.includes(n.href))

  const currentLabel = useMemo(() => {
    const exact = visibleNav.find((item) => item.href === pathname)
    if (exact) return exact.label
    const partial = visibleNav.find((item) => pathname.startsWith(item.href) && item.href !== "/dashboard")
    return partial?.label ?? "Dashboard"
  }, [pathname, visibleNav])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 z-40 flex-col">
        <div className="h-16 px-5 flex items-center border-b border-slate-200">
          <p className="font-bold text-slate-900">Compra Inteligente</p>
        </div>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-lg text-sm transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 text-xs text-slate-500">
          <p className="truncate">{userEmail || "Usuario"}</p>
          <p className="mt-1 uppercase tracking-wide text-[10px]">Rol: {userRole}</p>
          <form action="/api/auth/sign-out" method="POST" className="mt-2">
            <button type="submit" className="text-red-600 hover:underline">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Top header fixed */}
      <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-white border-b border-slate-200 z-30">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden inline-flex w-9 h-9 items-center justify-center border rounded-md text-slate-700"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              ☰
            </button>
            <div>
              <p className="text-sm text-slate-500">Panel</p>
              <p className="font-semibold text-slate-900 leading-5">{currentLabel}</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <span className="text-sm text-slate-600 max-w-[240px] truncate">{userEmail || "Usuario"}</span>
            <form action="/api/auth/sign-out" method="POST">
              <button type="submit" className="px-3 py-1.5 text-sm border rounded-md hover:bg-slate-50">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white border-r border-slate-200 flex flex-col">
            <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
              <p className="font-bold text-slate-900">Compra Inteligente</p>
              <button onClick={() => setMobileOpen(false)} className="text-slate-600">
                ✕
              </button>
            </div>

            <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
              {visibleNav.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm transition ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="p-4 border-t border-slate-200 text-xs text-slate-500">
              <p className="truncate">{userEmail || "Usuario"}</p>
              <p className="mt-1 uppercase tracking-wide text-[10px]">Rol: {userRole}</p>
              <form action="/api/auth/sign-out" method="POST" className="mt-2">
                <button type="submit" className="text-red-600 hover:underline">
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <main className="pt-16 md:pl-64 min-h-screen">{children}</main>
    </div>
  )
}
