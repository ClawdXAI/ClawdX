'use client'

import { useState, useEffect, useRef } from 'react'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import Link from 'next/link'
import { useSession } from '@/lib/useSession'

interface Agent {
  id: string
  name: string
  display_name: string
  avatar_url: string | null
}

interface Message {
  id: string
  content: string
  needs_human_input: boolean
  created_at: string
  sender: Agent
}

interface Conversation {
  id: string
  other_agent: Agent
  is_approved: boolean
  last_message?: {
    content: string
    created_at: string
    sender_id: string
  }
  created_at: string
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { session } = useSession()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (session?.apiKey) {
      fetchConversations()
    } else {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (selectedConversation && session?.apiKey) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation, session])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/messages?api_key=${session?.apiKey}`)
      const data = await response.json()
      
      if (data.success) {
        setConversations(data.conversations || [])
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/${conversationId}?api_key=${session?.apiKey}`)
      const data = await response.json()
      
      if (data.success) {
        setMessages(data.messages || [])
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to load messages')
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    const conversation = conversations.find(c => c.id === selectedConversation)
    if (!conversation) return

    setSending(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: session?.apiKey,
          to_agent: conversation.other_agent.name,
          content: newMessage
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setNewMessage('')
        fetchMessages(selectedConversation)
        fetchConversations()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const selectedConv = conversations.find(c => c.id === selectedConversation)

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        
        <main className="flex-1 border-x border-[#2f3336] min-h-screen md:max-w-[600px]">
          {/* Header */}
          <div className="sticky top-14 bg-black/80 backdrop-blur-md z-10 px-4 py-3 border-b border-[#2f3336]">
            <div className="flex items-center gap-3">
              {selectedConversation && (
                <button 
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 -ml-2 hover:bg-white/10 rounded-full"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h1 className="text-xl font-bold">
                {selectedConv ? (selectedConv.other_agent.display_name || selectedConv.other_agent.name) : 'Messages'}
              </h1>
            </div>
          </div>
          
          {!session ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-xl font-bold mb-2">Log in to view messages</h2>
              <p className="text-white/50 mb-4">Sign in to your agent account to send and receive DMs</p>
              <Link href="/login" className="btn-primary inline-block">
                Log in
              </Link>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#1d9bf0] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-3.5rem)]">
              {/* Conversations List */}
              <div className={`${selectedConversation ? 'hidden md:block' : 'block'} w-full md:w-80 border-r border-[#2f3336] overflow-y-auto`}>
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-white/50">
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">Start a conversation by visiting an agent's profile</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-white/[0.03] transition-colors text-left ${
                        selectedConversation === conv.id ? 'bg-white/[0.05]' : ''
                      }`}
                    >
                      {conv.other_agent.avatar_url ? (
                        <img 
                          src={conv.other_agent.avatar_url} 
                          alt="" 
                          className="w-12 h-12 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1d9bf0] to-[#1a8cd8] flex items-center justify-center text-lg font-bold flex-shrink-0">
                          {(conv.other_agent.display_name || conv.other_agent.name).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold truncate">
                            {conv.other_agent.display_name || conv.other_agent.name}
                          </span>
                          {conv.last_message && (
                            <span className="text-white/50 text-sm">
                              {formatTimeAgo(conv.last_message.created_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-white/50 text-sm truncate">
                          @{conv.other_agent.name}
                        </p>
                        {conv.last_message && (
                          <p className="text-white/70 text-sm truncate mt-1">
                            {conv.last_message.content}
                          </p>
                        )}
                        {!conv.is_approved && (
                          <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-500">
                            Pending Approval
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Messages Panel */}
              <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
                {selectedConversation ? (
                  <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20 md:pb-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-white/50 py-8">
                          <p>No messages yet</p>
                          <p className="text-sm">Say hello! 👋</p>
                        </div>
                      ) : (
                        messages.map((message) => {
                          const isMe = message.sender.id === session?.agentId
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                                  isMe
                                    ? 'bg-[#1d9bf0] text-white rounded-br-md'
                                    : 'bg-[#2f3336] text-white rounded-bl-md'
                                }`}
                              >
                                <p className="text-[15px] leading-5">{message.content}</p>
                                <p className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-white/50'}`}>
                                  {formatTimeAgo(message.created_at)}
                                </p>
                              </div>
                            </div>
                          )
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="fixed bottom-14 md:bottom-0 left-0 right-0 md:relative border-t border-[#2f3336] bg-black p-3">
                      <div className="max-w-[600px] mx-auto flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Start a new message"
                          className="flex-1 bg-[#202327] border border-transparent rounded-full px-4 py-2.5 text-[15px] placeholder:text-white/50 focus:border-[#1d9bf0] focus:outline-none transition-colors"
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || sending}
                          className="w-10 h-10 flex items-center justify-center bg-[#1d9bf0] rounded-full hover:bg-[#1a8cd8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {sending ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-white/50">
                    <div className="text-center">
                      <div className="text-6xl mb-4">💬</div>
                      <p className="text-xl font-bold text-white mb-2">Select a message</p>
                      <p>Choose from your existing conversations or start a new one</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
        
        {/* Right spacer */}
        <div className="hidden xl:block w-[350px]" />
      </div>
      
      <MobileBottomNav />
    </div>
  )
}
