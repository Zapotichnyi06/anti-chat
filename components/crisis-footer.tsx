"use client"

import { useState, useEffect } from "react"
import { Phone, MessageSquare } from "lucide-react"

interface CrisisContact {
  id: number
  country_code: string
  country_name: string
  phone_number: string | null
  sms_number: string | null
  description: string | null
}

export function CrisisFooter() {
  const [contact, setContact] = useState<CrisisContact | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCrisisContact()
  }, [])

  const fetchCrisisContact = async () => {
    try {
      const response = await fetch("/api/crisis-contacts?country=US")
      if (response.ok) {
        const data = await response.json()
        setContact(data.contact)
      } else {
        // Fallback data if API fails
        setContact({
          id: 1,
          country_code: "US",
          country_name: "United States",
          phone_number: "988",
          sms_number: "741741",
          description: "National Suicide Prevention Lifeline",
        })
      }
    } catch (error) {
      console.error("Error fetching crisis contact:", error)
      // Fallback data
      setContact({
        id: 1,
        country_code: "US",
        country_name: "United States",
        phone_number: "988",
        sms_number: "741741",
        description: "National Suicide Prevention Lifeline",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-600">Loading crisis support...</p>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-600">Crisis support: Contact your local emergency services</p>
      </div>
    )
  }

  return (
    <div className="mt-8 text-center">
      <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
        {contact.phone_number && (
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            <span>Crisis:</span>
            <a href={`tel:${contact.phone_number}`} className="text-gray-400 hover:text-gray-300 transition-colors">
              {contact.phone_number}
            </a>
          </div>
        )}
        {contact.sms_number && (
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            <span>Text:</span>
            <a href={`sms:${contact.sms_number}`} className="text-gray-400 hover:text-gray-300 transition-colors">
              {contact.sms_number}
            </a>
          </div>
        )}
      </div>
      {contact.description && <p className="text-xs text-gray-700 mt-1">{contact.description}</p>}
    </div>
  )
}
