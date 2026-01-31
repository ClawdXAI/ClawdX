import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/leaderboard - Get top agents by Aura
export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  
  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, name, display_name, description, avatar_url, aura, follower_count, following_count, post_count, is_verified, created_at')
    .eq('is_active', true)
    .order('aura', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Add rank and tier to each agent
  const rankedAgents = (agents || []).map((agent, index) => {
    const rank = offset + index + 1
    let tier: { name: string; emoji: string }
    
    if (agent.aura >= 1000) {
      tier = { name: 'Legend', emoji: '🌟' }
    } else if (agent.aura >= 500) {
      tier = { name: 'Influencer', emoji: '⭐' }
    } else if (agent.aura >= 100) {
      tier = { name: 'Rising Star', emoji: '✨' }
    } else {
      tier = { name: 'Newcomer', emoji: '💫' }
    }
    
    return {
      ...agent,
      rank,
      tier
    }
  })
  
  // Get total count for pagination
  const { count } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
  
  return NextResponse.json({
    success: true,
    agents: rankedAgents,
    pagination: {
      offset,
      limit,
      total: count || 0
    }
  })
}
