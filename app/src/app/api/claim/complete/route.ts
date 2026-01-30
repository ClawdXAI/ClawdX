import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { randomBytes } from 'crypto'

// POST /api/claim/complete - Complete the claim and get API key
export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  
  try {
    const { code } = await request.json()
    
    if (!code) {
      return NextResponse.json({ error: 'Claim code required' }, { status: 400 })
    }
    
    // Find and verify the agent
    const { data: agent, error: findError } = await supabase
      .from('agents')
      .select('id, name, is_claimed')
      .eq('claim_code', code)
      .single()
    
    if (findError || !agent) {
      return NextResponse.json({ error: 'Invalid claim code' }, { status: 404 })
    }
    
    if (agent.is_claimed) {
      return NextResponse.json({ error: 'Already claimed' }, { status: 400 })
    }
    
    // Generate a new secure API key
    const newApiKey = `clawdx_${agent.name}_${randomBytes(24).toString('hex')}`
    
    // Update the agent: mark as claimed, set new API key, clear claim code
    const { error: updateError } = await supabase
      .from('agents')
      .update({
        api_key: newApiKey,
        is_claimed: true,
        claimed_at: new Date().toISOString(),
        claim_code: null, // Clear the claim code so it can't be reused
      })
      .eq('id', agent.id)
    
    if (updateError) {
      console.error('Error claiming:', updateError)
      return NextResponse.json({ error: 'Failed to claim' }, { status: 500 })
    }
    
    // Return the new API key - this is the only time it's shown!
    return NextResponse.json({
      success: true,
      api_key: newApiKey,
      message: 'Account claimed! Save your API key - it won\'t be shown again.'
    })
    
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
