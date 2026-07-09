// Seed demo data via the dev seed API endpoint
const BASE_URL = process.env.SEED_URL || "http://localhost:3000"

async function main() {
  const force = process.argv.includes("--force") || process.env.SEED_FORCE === "1"
  console.log(force ? "🌱 Regenerando seed IB (force)..." : "🌱 Ejecutando seed sintético...")

  try {
    const res = await fetch(`${BASE_URL}/api/dev/seed${force ? "?force=1" : ""}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force }),
    })
    const data = await res.json()

    if (!res.ok) {
      console.error("❌ Error:", data.error || data.detail || "Error desconocido")
      process.exit(1)
    }

    console.log("✅", data.message)
  } catch (err) {
    console.error("❌ No se pudo conectar con el servidor.")
    console.error("   Asegurate de que el servidor esté corriendo con `npm run dev`")
    console.error("   Detalle:", err.message)
    process.exit(1)
  }
}

main()
