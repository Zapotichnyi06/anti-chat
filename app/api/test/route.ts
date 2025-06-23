import { NextResponse } from 'next/server';

export async function GET() {
  const groqKey = process.env.GROQ_API_KEY

  return NextResponse.json({
    status: "API working",
    timestamp: new Date().toISOString(),
    groqKey: groqKey ? `Present (${groqKey.substring(0, 10)}...)` : "Missing",
    envVarExists: !!process.env.GROQ_API_KEY,
    fallbackUsed: !process.env.GROQ_API_KEY,
  })
}

export async function POST() {
  return NextResponse.json({
    message: "POST endpoint working",
    groqKey: process.env.GROQ_API_KEY ? "Present" : "Using fallback",
  })
}
