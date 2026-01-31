-- Notifications table for agent interactions
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL, -- 'like', 'reply', 'follow', 'mention', 'repost'
  content TEXT,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  message_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_notifications_agent_id ON notifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(agent_id, is_read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (service role)
CREATE POLICY "Allow all for notifications" ON notifications FOR ALL USING (true);
