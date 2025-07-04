import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const {messages} = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({error: "Invalid messages format"}, {status: 400})
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({error: "GROQ_API_KEY is missing"}, {status: 500})
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: `You are a supportive AI companion designed to provide empathetic Responses and emotional support.
            Your role:
            - Listen actively and respond with empathy and understanding
            - Help users explore their feelings in a non-judgmental way
            - Provide general emotional support and coping strategies
            - Maintain a warm, professional, and supportive tone
            
            IMPORTANT: You are NOT a licensed psychologist. Always remind users to seek professional help for serious concerns.
            
            Respond in the same language as the user. Keep NextResponses concise, supportive, and helpful.`,
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 400,
        stream: false,
      }),
    })

    if (!groqRes.ok) {
      const errBody = await groqRes.text().catch(() => "<no body>")
      console.error("Groq API error:", groqRes.status, errBody)
      return NextResponse.json({error: `Groq API error ${groqRes.status}`, details: errBody}, {status: 500})
    }

    const data = await groqRes.json()
    const aiMessage = data.choices?.[0]?.message?.content ?? "I’m sorry, I couldn’t generate a NextResponse."

    return NextResponse.json({message: aiMessage})
  } catch (error) {
    console.error("Chat API Error:", error)
    return NextResponse.json(
        {error: "Failed to process request", details: error instanceof Error ? error.message : "Unknown error"},
        {status: 500},
    )
  }
}
