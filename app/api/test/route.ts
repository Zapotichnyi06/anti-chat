export async function GET() {
  const groqKey = process.env.GROQ_API_KEY || "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"

  return Response.json({
    status: "API working",
    timestamp: new Date().toISOString(),
    groqKey: groqKey ? `Present (${groqKey.substring(0, 10)}...)` : "Missing",
    envVarExists: !!process.env.GROQ_API_KEY,
    fallbackUsed: !process.env.GROQ_API_KEY,
  })
}

export async function POST() {
  return Response.json({
    message: "POST endpoint working",
    groqKey: process.env.GROQ_API_KEY ? "Present" : "Using fallback",
  })
}
