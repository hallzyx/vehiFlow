import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

export async function POST() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  
  if (session) {
    await auth.api.signOut({ headers: headersList })
  }
  
  redirect("/sign-in")
}