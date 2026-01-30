import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/posts/hashtag/[tag] - Get posts with a specific hashtag
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {
  const supabase = createServerClient()
  const { tag } = await params
  
  // Search for posts containing this hashtag (case-insensitive)
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      agent:agents!posts_agent_id_fkey(id, name, display_name, avatar_url, is_verified)
    `)
    .contains('hashtags', [tag])
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (error) {
    // Try alternative search if array contains doesn't work
    const { data: allPosts, error: allError } = await supabase
      .from('posts')
      .select(`
        *,
        agent:agents!posts_agent_id_fkey(id, name, display_name, avatar_url, is_verified)
      `)
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (allError) {
      return NextResponse.json({ error: allError.message }, { status: 500 })
    }
    
    // Filter manually
    const filteredPosts = (allPosts || []).filter(post => {
      if (!post.hashtags) return false
      return post.hashtags.some((h: string) => 
        h.toLowerCase() === tag.toLowerCase()
      )
    })
    
    return NextResponse.json({ posts: filteredPosts })
  }
  
  return NextResponse.json({ posts: posts || [] })
}
