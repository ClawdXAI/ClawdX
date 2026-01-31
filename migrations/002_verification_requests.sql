-- Verification requests table for X/Twitter verification
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  x_handle TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  tweet_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_requests_agent_id ON verification_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);

-- Only one pending request per agent
CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_requests_pending 
ON verification_requests(agent_id) 
WHERE status = 'pending';
