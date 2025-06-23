import { neon } from "@neondatabase/serverless"
import { NextResponse } from 'next/server';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const conversationId = searchParams.get("conversationId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Ensure tables exist
    await sql`
      CREATE TABLE IF NOT EXISTS conversations (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          title VARCHAR(500) NOT NULL,
          summary TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
          role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
          content TEXT NOT NULL,
          timestamp BIGINT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // If requesting specific conversation with messages
    if (conversationId) {
      const conversation = await sql`
        SELECT c.*, 
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', m.id::text,
                     'role', m.role,
                     'content', m.content,
                     'timestamp', m.timestamp
                   ) ORDER BY m.timestamp ASC
                 ) FILTER (WHERE m.id IS NOT NULL),
                 '[]'::json
               ) as messages
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id
        WHERE c.id = ${conversationId}::integer AND c.user_id = ${userId}
        GROUP BY c.id
      `

      if (conversation.length === 0) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
      }

      return NextResponse.json({ conversation: conversation[0] })
    }

    // Get all user conversations
    const conversations = await sql`
      SELECT c.id, c.user_id, c.title, c.summary, c.created_at, c.updated_at,
             COUNT(m.id)::integer as message_count
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE c.user_id = ${userId}
      GROUP BY c.id, c.user_id, c.title, c.summary, c.created_at, c.updated_at
      ORDER BY c.updated_at DESC
      LIMIT 50
    `

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json({ conversations: [] })
  }
}

export async function POST(req: Request) {
  try {
    const { userId, title, messages, summary } = await req.json()

    if (!userId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create conversation
    const conversation = await sql`
      INSERT INTO conversations (user_id, title, summary)
      VALUES (${userId}, ${title || "New Conversation"}, ${summary || ""})
      RETURNING *
    `

    const conversationId = conversation[0].id

    // Add messages if any
    if (messages.length > 0) {
      for (const msg of messages) {
        await sql`
          INSERT INTO messages (conversation_id, role, content, timestamp)
          VALUES (${conversationId}, ${msg.role}, ${msg.content}, ${msg.timestamp || Date.now()})
        `
      }
    }

    return NextResponse.json({ conversation: conversation[0] })
  } catch (error) {
    console.error("Error saving conversation:", error)
    return NextResponse.json({ error: "Failed to save conversation" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { conversationId, title } = await req.json()

    if (!conversationId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await sql`
      UPDATE conversations 
      SET title = ${title}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${conversationId}::integer
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    return NextResponse.json({ conversation: result[0] })
  } catch (error) {
    console.error("Error updating conversation:", error)
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 })
    }

    await sql`DELETE FROM conversations WHERE id = ${conversationId}::integer`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting conversation:", error)
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 })
  }
}
