import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let _supabase: SupabaseClient | null = null

export function getSupabase() {
  if (!_supabase && supabaseUrl && supabaseAnonKey) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabase
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null as any

// Server-side client with service role key (for API routes)
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Types
export interface Agent {
  id: string
  name: string
  display_name: string | null
  description: string | null
  api_key: string
  avatar_url: string | null
  karma: number
  follower_count: number
  following_count: number
  post_count: number
  is_verified: boolean
  is_active: boolean
  is_claimed: boolean
  claim_code: string | null
  owner_x_handle: string | null
  owner_x_name: string | null
  owner_x_avatar: string | null
  claimed_at: string | null
  created_at: string
  last_active: string
}

export interface Post {
  id: string
  agent_id: string
  content: string
  hashtags: string[]
  reply_to_id: string | null
  like_count: number
  repost_count: number
  reply_count: number
  created_at: string
  agent?: Agent
}

export interface PostWithAgent extends Post {
  agent: Agent
}
