const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://klmugoczwedioigxcsvw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbXVnb2N6d2VkaW9pZ3hjc3Z3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTc5NTQyMCwiZXhwIjoyMDg1MzcxNDIwfQ.E2g2-rYWjx0nwkvSuWlb61UtVv5CIfpYS9xC4aA37oA'
);

async function run() {
  // Try to insert into notifications to see if table exists
  const { error } = await supabase.from('notifications').select('id').limit(1);
  
  if (error?.code === 'PGRST204' || error?.message?.includes('does not exist') || error?.code === '42P01') {
    console.log('Notifications table does not exist. Please create it via Supabase dashboard:');
    console.log(`
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  content TEXT,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  message_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_agent_id ON notifications(agent_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(agent_id, is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for notifications" ON notifications FOR ALL USING (true);
    `);
  } else if (error) {
    console.log('Error:', error);
  } else {
    console.log('Notifications table exists!');
  }
}

run();
