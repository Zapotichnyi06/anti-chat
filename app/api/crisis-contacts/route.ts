import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const countryCode = searchParams.get("country") || "US"

    // First check if the table exists, if not create it
    await sql`
      CREATE TABLE IF NOT EXISTS crisis_contacts (
          id SERIAL PRIMARY KEY,
          country_code VARCHAR(10) NOT NULL,
          country_name VARCHAR(100) NOT NULL,
          phone_number VARCHAR(50),
          sms_number VARCHAR(50),
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Insert default data if table is empty
    const existingContacts = await sql`SELECT COUNT(*) as count FROM crisis_contacts`
    if (existingContacts[0].count === 0) {
      await sql`
        INSERT INTO crisis_contacts (country_code, country_name, phone_number, sms_number, description) VALUES
        ('US', 'United States', '988', '741741', 'National Suicide Prevention Lifeline'),
        ('UK', 'United Kingdom', '116 123', NULL, 'Samaritans'),
        ('CA', 'Canada', '1-833-456-4566', '45645', 'Talk Suicide Canada'),
        ('AU', 'Australia', '13 11 14', NULL, 'Lifeline Australia'),
        ('DE', 'Germany', '0800 111 0 111', NULL, 'Telefonseelsorge'),
        ('FR', 'France', '3114', NULL, 'Numéro national français de prévention du suicide')
      `
    }

    const contacts = await sql`
      SELECT * FROM crisis_contacts 
      WHERE country_code = ${countryCode} AND is_active = true
      ORDER BY id ASC
      LIMIT 1
    `

    if (contacts.length === 0) {
      // Fallback to US if country not found
      const fallbackContacts = await sql`
        SELECT * FROM crisis_contacts 
        WHERE country_code = 'US' AND is_active = true
        ORDER BY id ASC
        LIMIT 1
      `
      return Response.json({ contact: fallbackContacts[0] || null })
    }

    return Response.json({ contact: contacts[0] })
  } catch (error) {
    console.error("Error fetching crisis contacts:", error)
    // Return fallback data if database fails
    return Response.json({
      contact: {
        id: 1,
        country_code: "US",
        country_name: "United States",
        phone_number: "988",
        sms_number: "741741",
        description: "National Suicide Prevention Lifeline",
      },
    })
  }
}

export async function POST(req: Request) {
  try {
    const { countryCode, countryName, phoneNumber, smsNumber, description } = await req.json()

    if (!countryCode || !countryName) {
      return Response.json({ error: "Country code and name are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO crisis_contacts (country_code, country_name, phone_number, sms_number, description)
      VALUES (${countryCode}, ${countryName}, ${phoneNumber || null}, ${smsNumber || null}, ${description || null})
      RETURNING *
    `

    return Response.json({ contact: result[0] })
  } catch (error) {
    console.error("Error creating crisis contact:", error)
    return Response.json({ error: "Failed to create crisis contact" }, { status: 500 })
  }
}
