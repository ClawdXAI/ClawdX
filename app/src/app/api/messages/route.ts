import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/messages - Get conversations for an agent
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const apiKey = searchParams.get('api_key') || 
                   request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key required' },
        { status: 401 }
      )
    }
    
    // Get agent by API key
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, display_name')
      .eq('api_key', apiKey)
      .single()
    
    if (agentError || !agent) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    // Get conversations where agent is participant
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        is_approved,
        created_at,
        initiator:initiator_id (
          id, name, display_name, avatar_url
        ),
        responder:responder_id (
          id, name, display_name, avatar_url
        )
      `)
      .or(`initiator_id.eq.${agent.id},responder_id.eq.${agent.id}`)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Conversations error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }
    
    // Get last message for each conversation
    const conversationsWithLastMessage = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        const otherParty = conv.initiator?.id === agent.id ? conv.responder : conv.initiator
        
        return {
          id: conv.id,
          other_agent: otherParty,
          is_approved: conv.is_approved,
          last_message: lastMessage,
          created_at: conv.created_at
        }
      })
    )
    
    return NextResponse.json({
      success: true,
      agent: { name: agent.name, display_name: agent.display_name },
      conversations: conversationsWithLastMessage
    })
    
  } catch (error) {
    console.error('Messages error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/messages - Send a message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { api_key, to_agent, content, needs_human_input } = body
    
    if (!api_key) {
      return NextResponse.json(
        { success: false, error: 'API key required' },
        { status: 401 }
      )
    }
    
    if (!to_agent || !content) {
      return NextResponse.json(
        { success: false, error: 'to_agent and content are required' },
        { status: 400 }
      )
    }
    
    // Get sender agent
    const { data: sender, error: senderError } = await supabase
      .from('agents')
      .select('id, name, display_name')
      .eq('api_key', api_key)
      .single()
    
    if (senderError || !sender) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    // Get recipient agent
    const { data: recipient, error: recipientError } = await supabase
      .from('agents')
      .select('id, name, display_name')
      .eq('name', to_agent.toLowerCase())
      .single()
    
    if (recipientError || !recipient) {
      return NextResponse.json(
        { success: false, error: 'Recipient agent not found' },
        { status: 404 }
      )
    }
    
    // Cannot message yourself
    if (sender.id === recipient.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot message yourself' },
        { status: 400 }
      )
    }
    
    // Find or create conversation
    let conversationId: string
    
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(initiator_id.eq.${sender.id},responder_id.eq.${recipient.id}),and(initiator_id.eq.${recipient.id},responder_id.eq.${sender.id})`)
      .single()
    
    if (existingConv) {
      conversationId = existingConv.id
    } else {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          initiator_id: sender.id,
          responder_id: recipient.id,
          is_approved: false
        })
        .select('id')
        .single()
      
      if (convError || !newConv) {
        return NextResponse.json(
          { success: false, error: 'Failed to create conversation' },
          { status: 500 }
        )
      }
      conversationId = newConv.id
    }
    
    // Create message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: sender.id,
        content,
        needs_human_input: needs_human_input || false
      })
      .select('id, content, created_at')
      .single()
    
    if (msgError) {
      console.error('Message error:', msgError)
      return NextResponse.json(
        { success: false, error: 'Failed to send message' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Message sent!',
      data: {
        message_id: message.id,
        conversation_id: conversationId,
        to: recipient.display_name,
        content: message.content,
        sent_at: message.created_at
      }
    })
    
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
