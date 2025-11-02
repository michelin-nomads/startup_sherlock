import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, Bot, Briefcase, TrendingUp, Target } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getApiUrl } from "@/lib/config"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AIChatbotProps {
  startupId: string
  startupData: any
}

type Persona = "general" | "vc" | "angel" | "combined"

export function AIChatbot({ startupId, startupData }: AIChatbotProps) {
  const [activePersona, setActivePersona] = useState<Persona>("general")
  const [messages, setMessages] = useState<Record<Persona, Message[]>>({
    general: [],
    vc: [],
    angel: [],
    combined: []
  })
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, activePersona])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date()
    }

    // Add user message to current persona's history
    setMessages(prev => ({
      ...prev,
      [activePersona]: [...prev[activePersona], userMessage]
    }))
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch(getApiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupId,
          persona: activePersona,
          message: input,
          context: startupData,
          conversationHistory: messages[activePersona]
        })
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => ({
        ...prev,
        [activePersona]: [...prev[activePersona], assistantMessage]
      }))
    } catch (error) {
      console.error("Chat error:", error)
      toast({
        title: "Error",
        description: "Sorry, I encountered an error. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      sendMessage()
    }
  }

  const personaConfig = {
    general: {
      icon: Bot,
      label: "General QA",
      color: "blue",
      description: "Clear, concise answers about the analysis"
    },
    vc: {
      icon: Briefcase,
      label: "VC Analyst",
      color: "purple",
      description: "Focus on scalability and metrics"
    },
    angel: {
      icon: TrendingUp,
      label: "Angel Investor",
      color: "green",
      description: "Focus on team and early traction"
    },
    combined: {
      icon: Target,
      label: "Combined",
      color: "orange",
      description: "Holistic investment perspective"
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={activePersona} onValueChange={(v) => setActivePersona(v as Persona)}>
        <TabsList className="grid w-full grid-cols-4">
          {(Object.keys(personaConfig) as Persona[]).map((persona) => {
            const config = personaConfig[persona]
            const Icon = config.icon
            return (
              <TabsTrigger key={persona} value={persona} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {(Object.keys(personaConfig) as Persona[]).map((persona) => {
          const config = personaConfig[persona]
          return (
            <TabsContent key={persona} value={persona} className="space-y-4">
              {/* Persona description */}
              <Card className="p-3 bg-muted/50">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">
                    {config.label}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {config.description}
                  </p>
                </div>
              </Card>

              {/* Chat messages */}
              <div className="space-y-4 min-h-[300px] max-h-[500px] overflow-y-auto pr-2">
                {messages[persona].length === 0 ? (
                  <div className="flex items-center justify-center h-[200px] text-center">
                    <div className="space-y-2">
                      <p className="text-muted-foreground">
                        Ask me anything about this startup analysis
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Example: "Should I invest?" or "What are the biggest risks?"
                      </p>
                    </div>
                  </div>
                ) : (
                  messages[persona].map((message, idx) => (
                    <div
                      key={idx}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question... (Ctrl/Cmd + Enter to send)"
                  className="min-h-[60px] resize-none"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-[60px] w-[60px]"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}

