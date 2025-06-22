"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Clock, Trash2, Edit2, Save, X, MessageCircle, Eye } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

interface Conversation {
  id: string
  user_id: string
  title: string
  summary: string
  message_count: number
  created_at: string
  updated_at: string
  messages?: Message[]
}

interface ConversationHistoryProps {
  userId: string
  currentMessages?: Message[]
  onLoadConversation?: (messages: Message[]) => void
  onNewChat?: () => void
}

export function ConversationHistory({
  userId,
  currentMessages = [],
  onLoadConversation,
  onNewChat,
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [viewingConversation, setViewingConversation] = useState<Conversation | null>(null)
  const [loadingConversation, setLoadingConversation] = useState<string | null>(null)

  useEffect(() => {
    fetchConversations()
  }, [userId])

  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/conversations?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      } else {
        console.error("Failed to fetch conversations:", response.status)
        setConversations([])
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const saveCurrentConversation = async () => {
    if (currentMessages.length === 0) return

    try {
      const userMessages = currentMessages.filter((m) => m.role === "user")
      const title = userMessages[0]?.content.substring(0, 50) + "..." || "New Conversation"

      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          title,
          messages: currentMessages,
          summary: userMessages[0]?.content.substring(0, 100) + "..." || "",
        }),
      })

      if (response.ok) {
        fetchConversations()
      }
    } catch (error) {
      console.error("Error saving conversation:", error)
    }
  }

  const viewConversation = async (conversationId: string) => {
    setLoadingConversation(conversationId)
    try {
      const response = await fetch(`/api/conversations?userId=${userId}&conversationId=${conversationId}`)
      const data = await response.json()

      if (data.conversation) {
        setViewingConversation(data.conversation)
      }
    } catch (error) {
      console.error("Error loading conversation:", error)
    } finally {
      setLoadingConversation(null)
    }
  }

  const deleteConversation = async (conversationId: string) => {
    if (!confirm("Delete this conversation?")) return

    try {
      const response = await fetch(`/api/conversations?conversationId=${conversationId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))
        if (viewingConversation?.id === conversationId) {
          setViewingConversation(null)
        }
      }
    } catch (error) {
      console.error("Error deleting conversation:", error)
    }
  }

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id)
    setEditTitle(conversation.title)
  }

  const saveTitle = async (conversationId: string) => {
    try {
      const response = await fetch("/api/conversations", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          title: editTitle,
        }),
      })

      if (response.ok) {
        setConversations((prev) =>
          prev.map((conv) => (conv.id === conversationId ? { ...conv, title: editTitle } : conv)),
        )
        setEditingId(null)
        setEditTitle("")
      }
    } catch (error) {
      console.error("Error updating title:", error)
    }
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditTitle("")
  }

  const loadConversation = (conversation: Conversation) => {
    if (onLoadConversation && conversation.messages) {
      onLoadConversation(conversation.messages)
      setViewingConversation(null)
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-3 bg-gray-800 rounded w-3/4"></div>
            <div className="h-3 bg-gray-800 rounded w-1/2"></div>
            <div className="h-3 bg-gray-800 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // View specific conversation
  if (viewingConversation) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-light text-gray-100">{viewingConversation.title}</CardTitle>
              <div className="w-8 h-px bg-gray-700 mt-2"></div>
              <p className="text-xs text-gray-500 mt-2">{formatDate(viewingConversation.created_at)}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => loadConversation(viewingConversation)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Load to Chat
              </Button>
              <Button
                onClick={() => setViewingConversation(null)}
                size="sm"
                variant="outline"
                className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              >
                Back
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="max-h-[500px] overflow-y-auto space-y-4">
          {viewingConversation.messages?.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  message.role === "user"
                    ? "bg-gray-800 text-gray-100"
                    : "bg-gray-850 text-gray-200 border border-gray-700"
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-light text-gray-100">Conversation History</CardTitle>
            <div className="w-8 h-px bg-gray-700 mt-2"></div>
          </div>
          <div className="flex gap-2">
            {currentMessages.length > 0 && (
              <Button
                onClick={saveCurrentConversation}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
            )}
            {onNewChat && (
              <Button onClick={onNewChat} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                New Chat
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {conversations.length === 0 ? (
          <p className="text-gray-500 text-center py-12 text-sm">No saved conversations</p>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="border border-gray-800 rounded p-4 hover:bg-gray-800/50 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-3 w-3 text-gray-600" />
                <span className="text-xs text-gray-500">{formatDate(conversation.updated_at)}</span>
                <MessageCircle className="h-3 w-3 text-gray-600" />
                <span className="text-xs text-gray-500">{conversation.message_count} messages</span>
                <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={() => viewConversation(conversation.id)}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-500 hover:text-blue-400"
                    disabled={loadingConversation === conversation.id}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={() => startEditing(conversation)}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-500 hover:text-gray-300"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={() => deleteConversation(conversation.id)}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {editingId === conversation.id ? (
                <div className="flex gap-2 mb-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 h-8 bg-gray-800 border-gray-700 text-gray-100 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveTitle(conversation.id)
                      if (e.key === "Escape") cancelEditing()
                    }}
                  />
                  <Button
                    onClick={() => saveTitle(conversation.id)}
                    size="sm"
                    className="h-8 px-2 bg-gray-800 hover:bg-gray-700 text-gray-300"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={cancelEditing}
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-gray-500 hover:text-gray-300"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <h3 className="text-sm font-medium text-gray-200 mb-2 cursor-pointer hover:text-gray-100">
                  {conversation.title}
                </h3>
              )}

              {conversation.summary && (
                <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">{conversation.summary}</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
