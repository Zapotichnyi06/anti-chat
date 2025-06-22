"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Send, AlertCircle, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { ConversationHistory } from "@/components/conversation-history"
import { CrisisFooter } from "@/components/crisis-footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

export default function PsychologyBot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDisclaimer, setShowDisclaimer] = useState(true)
  const [apiStatus, setApiStatus] = useState<"checking" | "working" | "error">("checking")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    testApiConnection()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const testApiConnection = async () => {
    try {
      const response = await fetch("/api/test")
      const data = await response.json()
      setApiStatus(data.status === "API working" ? "working" : "error")
    } catch (error) {
      console.error("API Test Failed:", error)
      setApiStatus("error")
    }
  }

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, newUserMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, newUserMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Send message error:", error)
      setError(error instanceof Error ? error.message : "Failed to send message")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleRetry = () => {
    if (messages.length > 0) {
      const lastUserMessage = messages.filter((m) => m.role === "user").pop()
      if (lastUserMessage) {
        const filteredMessages = messages.filter((m) => m.id !== messages[messages.length - 1]?.id)
        setMessages(filteredMessages)
        setError(null)
        sendMessage(lastUserMessage.content)
      }
    }
  }

  const startNewChat = () => {
    setMessages([])
    setError(null)
  }

  const loadConversation = (conversationMessages: Message[]) => {
    setMessages(conversationMessages)
    setError(null)
  }

  const getStatusIcon = () => {
    switch (apiStatus) {
      case "checking":
        return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
      case "working":
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case "error":
        return <XCircle className="h-3 w-3 text-red-500" />
    }
  }

  const getStatusText = () => {
    switch (apiStatus) {
      case "checking":
        return "Checking connection..."
      case "working":
        return "Connected"
      case "error":
        return "Connection failed"
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light text-gray-100 mb-2">Anti Chat</h1>
          <div className="w-12 h-px bg-gray-600 mx-auto mb-2"></div>
          <div className="flex items-center justify-center gap-2">
            {getStatusIcon()}
            <p className="text-xs text-gray-500">{getStatusText()}</p>
          </div>
        </div>

        {/* Disclaimer */}
        {showDisclaimer && (
          <div className="mb-8 p-4 border border-gray-800 bg-gray-900/50 rounded">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  AI companion for emotional support. Not a replacement for professional mental health care.
                </p>
                <button
                  onClick={() => setShowDisclaimer(false)}
                  className="text-xs text-gray-500 hover:text-gray-400 mt-2 underline"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="bg-gray-900 border border-gray-800 p-1">
            <TabsTrigger
              value="chat"
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400"
            >
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="h-[600px] overflow-y-auto p-6 space-y-6">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-32">
                    <div className="w-1 h-1 bg-gray-600 rounded-full mx-auto mb-6"></div>
                    <p className="text-sm">What's on your mind?</p>
                    <p className="text-xs text-gray-600 mt-2">I'm here to listen and support you</p>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] p-4 rounded-lg ${
                        message.role === "user"
                          ? "bg-gray-800 text-gray-100"
                          : "bg-gray-850 text-gray-200 border border-gray-700"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-850 border border-gray-700 p-4 rounded-lg max-w-[75%]">
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse"></div>
                        <div
                          className="w-1 h-1 bg-gray-500 rounded-full animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="w-1 h-1 bg-gray-500 rounded-full animate-pulse"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-center p-4 border border-red-900/50 bg-red-900/20 rounded">
                    <p className="text-red-400 text-sm mb-2">Message failed to send</p>
                    <p className="text-gray-500 text-xs mb-3">{error}</p>
                    <Button
                      onClick={handleRetry}
                      size="sm"
                      variant="outline"
                      className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </CardContent>

              <CardFooter className="border-t border-gray-800 bg-gray-900/50 p-4">
                <form onSubmit={handleSubmit} className="flex w-full gap-3">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-gray-600"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <ConversationHistory
              userId="user-123"
              currentMessages={messages}
              onLoadConversation={loadConversation}
              onNewChat={startNewChat}
            />
          </TabsContent>
        </Tabs>

        {/* Crisis Footer */}
        <CrisisFooter />
      </div>
    </div>
  )
}
