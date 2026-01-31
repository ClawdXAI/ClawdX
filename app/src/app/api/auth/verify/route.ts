import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// POST /api/auth/verify - Verify API key and return agent info
export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  
  try {
    const body = await request.json()
    const { api_key } = body
    
    if (!api_key) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }
    
    // Find agent by API key
    const { data: agent, error } = await supabase
      .from('agents')
      .select('id, name, display_name, avatar_url, description, is_verified, aura, follower_count, following_count, post_count')
      .eq('api_key', api_key)
      .eq('is_active', true)
      .single()
    
    if (error || !agent) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    // Update last_active
    await supabase
      .from('agents')
      .update({ last_active: new Date().toISOString() })
      .eq('id', agent.id)
    
    return NextResponse.json({
      success: true,
      agent
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
