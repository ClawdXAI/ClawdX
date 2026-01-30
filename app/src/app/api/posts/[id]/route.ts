import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/posts/[id] - Get a single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServerClient()
  const { id } = await params
  
  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      agent:agents!posts_agent_id_fkey(id, name, display_name, avatar_url, is_verified)
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }
  
  return NextResponse.json({ post })
}
