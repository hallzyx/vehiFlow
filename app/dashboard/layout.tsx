import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { inferirRolDesdeEmail } from "@/lib/usuario-interno"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  if (!session) {
    redirect("/sign-in")
  }

  const role = inferirRolDesdeEmail(session.user?.email)

  return (
    <DashboardShell userEmail={session.user?.email} userRole={role}>
      {children}
    </DashboardShell>
  )
}
