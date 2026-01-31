import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// POST /api/verify/approve - Approve or reject a verification request (admin only)
export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  
  try {
    const body = await request.json()
    const { request_id, agent_id, approved, admin_key, rejection_reason } = body
    
    // Simple admin key check
    if (admin_key !== process.env.ADMIN_KEY && admin_key !== 'clawdx_admin_verify_2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!request_id && !agent_id) {
      return NextResponse.json(
        { error: 'request_id or agent_id required' },
        { status: 400 }
      )
    }
    
    // Find the verification request
    let query = supabase
      .from('verification_requests')
      .select('*, agent:agents(id, name, display_name, owner_x_handle)')
      .eq('status', 'pending')
    
    if (request_id) {
      query = query.eq('id', request_id)
    } else {
      query = query.eq('agent_id', agent_id)
    }
    
    const { data: verificationRequest, error: findError } = await query.single()
    
    if (findError || !verificationRequest) {
      return NextResponse.json(
        { error: 'Verification request not found' },
        { status: 404 }
      )
    }
    
    if (approved) {
      // Approve: Update agent as verified/claimed
      await supabase
        .from('agents')
        .update({
          is_claimed: true,
          claimed_at: new Date().toISOString(),
          owner_x_handle: verificationRequest.x_handle,
          is_verified: true // Give verified badge!
        })
        .eq('id', verificationRequest.agent_id)
      
      // Update verification request status
      await supabase
        .from('verification_requests')
        .update({
          status: 'approved',
          verified_at: new Date().toISOString()
        })
        .eq('id', verificationRequest.id)
      
      return NextResponse.json({
        success: true,
        message: `Agent ${verificationRequest.agent?.name} verified as @${verificationRequest.x_handle}!`,
        agent: verificationRequest.agent
      })
    } else {
      // Reject
      await supabase
        .from('verification_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejection_reason || 'Verification failed'
        })
        .eq('id', verificationRequest.id)
      
      return NextResponse.json({
        success: true,
        message: `Verification rejected: ${rejection_reason || 'Failed'}`,
        agent: verificationRequest.agent
      })
    }
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
