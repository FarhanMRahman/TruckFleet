"use client"

import { useEffect, useRef, useState, useCallback, memo } from "react"
import { toast } from "sonner"
import { Send, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type Message = {
  id: string
  senderId: string
  senderName: string
  content: string
  createdAt: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const MessageBubble = memo(function MessageBubble({ msg, isOwn }: { msg: Message; isOwn: boolean }) {
  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isOwn ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-background border rounded-bl-sm"}`}>
        {msg.content}
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
        {!isOwn && <span className="font-medium">{msg.senderName} · </span>}
        {timeAgo(msg.createdAt)}
      </p>
    </div>
  )
})

interface Props {
  tripId: string
  currentUserId: string
}

export function TripMessageThread({ tripId, currentUserId: initialUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(initialUserId)
  const [replyOpen, setReplyOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (initialUserId) { setCurrentUserId(initialUserId); return }
    fetch("/api/auth/get-session")
      .then((r) => r.json())
      .then((s) => { if (s?.user?.id) setCurrentUserId(s.user.id) })
      .catch(() => {})
  }, [initialUserId])

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/messages`)
      if (res.ok) {
        const data: Message[] = await res.json()
        setMessages((prev) => {
          // Skip re-render if message list hasn't changed
          if (
            prev.length === data.length &&
            prev.every((m, i) => m.id === data[i]?.id && m.content === data[i]?.content)
          ) {
            return prev
          }
          return data
        })
      }
    } catch {
      // silently ignore poll failures
    }
  }, [tripId])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  function scrollToBottom() {
    const el = containerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  async function sendMessage() {
    if (!content.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      })
      if (!res.ok) throw new Error()
      const msg = await res.json()
      setMessages((prev) => [...prev, msg])
      setContent("")
      setReplyOpen(false)
      requestAnimationFrame(scrollToBottom)
    } catch {
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function openReply() {
    setReplyOpen(true)
    // Focus after render
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  return (
    <section className="border rounded-xl overflow-hidden">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          Messages
          {messages.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">({messages.length})</span>
          )}
        </div>
      </div>

      {/* Message list */}
      <div ref={containerRef} className="p-3 space-y-3 max-h-64 overflow-y-auto bg-muted/20">
        {messages.length === 0 ? (
          <p className="text-xs text-center text-muted-foreground py-4">
            No messages yet. Start the conversation.
          </p>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} isOwn={msg.senderId === currentUserId} />
          ))
        )}
      </div>

      {/* Input — only mounted when reply is open to prevent mobile auto-scroll */}
      {replyOpen ? (
        <div className="p-3 border-t flex gap-2">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={2}
            className="resize-none text-sm"
            disabled={sending}
          />
          <div className="flex flex-col gap-1.5">
            <Button size="icon" onClick={sendMessage} disabled={sending || !content.trim()}>
              <Send className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => { setReplyOpen(false); setContent("") }}>
              ✕
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t">
          <button
            onClick={openReply}
            className="w-full text-left text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2.5 hover:bg-muted/50 active:bg-muted/70 transition-colors cursor-pointer"
          >
            Tap to reply…
          </button>
        </div>
      )}
    </section>
  )
}
