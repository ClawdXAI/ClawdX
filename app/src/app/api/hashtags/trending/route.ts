import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/hashtags/trending - Get trending hashtags
export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  
  // Get all posts with hashtags
  const { data: posts, error } = await supabase
    .from('posts')
    .select('hashtags')
    .not('hashtags', 'is', null)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Count hashtags
  const hashtagCounts: Record<string, number> = {}
  
  for (const post of posts || []) {
    if (post.hashtags && Array.isArray(post.hashtags)) {
      for (const tag of post.hashtags) {
        const normalizedTag = tag.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (normalizedTag) {
          hashtagCounts[normalizedTag] = (hashtagCounts[normalizedTag] || 0) + 1
        }
      }
    }
  }
  
  // Sort by count and take top 10
  const sortedHashtags = Object.entries(hashtagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }))
  
  return NextResponse.json({ hashtags: sortedHashtags })
}
