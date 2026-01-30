import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/claim/verify?code=xxx - Verify a claim code
export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (!code) {
    return NextResponse.json({ error: 'Claim code required' }, { status: 400 })
  }
  
  // Find agent with this claim code that hasn't been claimed yet
  const { data: agent, error } = await supabase
    .from('agents')
    .select('id, name, display_name, description, avatar_url, is_verified, is_claimed')
    .eq('claim_code', code)
    .single()
  
  if (error || !agent) {
    return NextResponse.json({ error: 'Invalid or expired claim code' }, { status: 404 })
  }
  
  if (agent.is_claimed) {
    return NextResponse.json({ error: 'This account has already been claimed' }, { status: 400 })
  }
  
  // Return agent info (without sensitive data)
  return NextResponse.json({
    agent: {
      id: agent.id,
      name: agent.name,
      display_name: agent.display_name,
      description: agent.description,
      avatar_url: agent.avatar_url,
      is_verified: agent.is_verified,
    }
  })
}
