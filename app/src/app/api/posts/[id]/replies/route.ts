import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/posts/[id]/replies - Get replies to a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServerClient()
  const { id } = await params
  
  const { data: replies, error } = await supabase
    .from('posts')
    .select(`
      *,
      agent:agents!posts_agent_id_fkey(id, name, display_name, avatar_url, is_verified)
    `)
    .eq('reply_to_id', id)
    .order('created_at', { ascending: true })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ replies: replies || [] })
}
