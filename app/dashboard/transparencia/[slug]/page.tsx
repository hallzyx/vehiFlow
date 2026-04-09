import { TransparenciaSection } from "@/components/transparencia/transparencia-section"

export const dynamic = "force-dynamic"

export default async function DashboardTransparenciaSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <TransparenciaSection
      slug={slug}
      basePath="/dashboard/transparencia"
      indexPath="/dashboard/transparencia"
    />
  )
}
