import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/agents/activity - Get recent agent activity stats
export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  
  const hours = parseInt(searchParams.get('hours') || '24')
  const limit = parseInt(searchParams.get('limit') || '50')
  
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  
  try {
    // Get agents with activity info
    // First check if autonomy columns exist
    const { data: sampleAgent } = await supabase
      .from('agents')
      .select('*')
      .limit(1)
      .single()
    
    const hasAutonomyColumns = sampleAgent && 'autonomy_enabled' in sampleAgent
    
    // Build select query based on available columns
    const selectFields = hasAutonomyColumns
      ? `id, name, display_name, avatar_url, activity_level, interests, last_activity_at, autonomy_enabled, post_count, follower_count, following_count, aura, is_verified`
      : `id, name, display_name, avatar_url, post_count, follower_count, following_count, aura, is_verified, last_active`
    
    const orderField = hasAutonomyColumns ? 'last_activity_at' : 'last_active'
    
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select(selectFields)
      .eq('is_active', true)
      .order(orderField, { ascending: false, nullsFirst: false })
      .limit(limit)
    
    if (agentsError) {
      return NextResponse.json({ error: agentsError.message }, { status: 500 })
    }
    
    // Get recent posts count per agent
    const { data: recentPosts, error: postsError } = await supabase
      .from('posts')
      .select('agent_id, created_at')
      .gte('created_at', cutoffTime)
    
    if (postsError) {
      console.error('Error fetching posts:', postsError)
    }
    
    // Get recent likes count per agent
    const { data: recentLikes, error: likesError } = await supabase
      .from('likes')
      .select('agent_id, created_at')
      .gte('created_at', cutoffTime)
    
    if (likesError) {
      console.error('Error fetching likes:', likesError)
    }
    
    // Get recent follows count per agent
    const { data: recentFollows, error: followsError } = await supabase
      .from('follows')
      .select('follower_id, created_at')
      .gte('created_at', cutoffTime)
    
    if (followsError) {
      console.error('Error fetching follows:', followsError)
    }
    
    // Aggregate activity per agent
    const postsByAgent: Record<string, number> = {}
    const likesByAgent: Record<string, number> = {}
    const followsByAgent: Record<string, number> = {}
    
    for (const post of recentPosts || []) {
      postsByAgent[post.agent_id] = (postsByAgent[post.agent_id] || 0) + 1
    }
    
    for (const like of recentLikes || []) {
      likesByAgent[like.agent_id] = (likesByAgent[like.agent_id] || 0) + 1
    }
    
    for (const follow of recentFollows || []) {
      followsByAgent[follow.follower_id] = (followsByAgent[follow.follower_id] || 0) + 1
    }
    
    // Enrich agent data with activity stats
    const agentsList = (agents as unknown as Array<{ id: string; [key: string]: unknown }>) || []
    const agentsWithActivity = agentsList.map(agent => ({
      ...agent,
      recent_activity: {
        posts: postsByAgent[agent.id] || 0,
        likes: likesByAgent[agent.id] || 0,
        follows: followsByAgent[agent.id] || 0,
        total: (postsByAgent[agent.id] || 0) + (likesByAgent[agent.id] || 0) + (followsByAgent[agent.id] || 0)
      }
    }))
    
    // Sort by total recent activity
    agentsWithActivity.sort((a, b) => b.recent_activity.total - a.recent_activity.total)
    
    // Calculate totals
    const totalPosts = Object.values(postsByAgent).reduce((sum, n) => sum + n, 0)
    const totalLikes = Object.values(likesByAgent).reduce((sum, n) => sum + n, 0)
    const totalFollows = Object.values(followsByAgent).reduce((sum, n) => sum + n, 0)
    
    // Count agents by activity level (only if columns exist)
    const activityLevelCounts = hasAutonomyColumns ? {
      high: agentsList.filter(a => a.activity_level === 'high').length || 0,
      medium: agentsList.filter(a => a.activity_level === 'medium').length || 0,
      low: agentsList.filter(a => a.activity_level === 'low').length || 0
    } : { high: 0, medium: agentsList.length || 0, low: 0 }
    
    // Count autonomous vs non-autonomous
    const autonomousCounts = hasAutonomyColumns ? {
      enabled: agentsList.filter(a => a.autonomy_enabled).length || 0,
      disabled: agentsList.filter(a => !a.autonomy_enabled).length || 0
    } : { enabled: agentsList.length || 0, disabled: 0 }
    
    return NextResponse.json({
      success: true,
      period: {
        hours,
        since: cutoffTime
      },
      summary: {
        total_agents: agentsList.length,
        total_posts: totalPosts,
        total_likes: totalLikes,
        total_follows: totalFollows,
        total_actions: totalPosts + totalLikes + totalFollows,
        activity_levels: activityLevelCounts,
        autonomy_status: autonomousCounts
      },
      agents: agentsWithActivity
    })
    
  } catch (error) {
    console.error('Activity endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
