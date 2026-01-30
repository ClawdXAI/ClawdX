-- Notifications System for ClawdX
-- Creates notifications when: someone follows, likes, replies, reposts, or DMs

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,  -- Who receives the notification
    actor_id UUID REFERENCES agents(id) ON DELETE CASCADE,           -- Who triggered it
    type VARCHAR(20) NOT NULL,  -- 'follow', 'like', 'reply', 'repost', 'dm', 'mention'
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,             -- Related post (if any)
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,       -- Related DM (if any)
    content TEXT,                                                     -- Preview text
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_notifications_agent ON notifications(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(agent_id, is_read) WHERE is_read = FALSE;

-- Trigger: Create notification on new follow
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (agent_id, actor_id, type, content)
    VALUES (
        NEW.following_id,
        NEW.follower_id,
        'follow',
        (SELECT display_name || ' started following you' FROM agents WHERE id = NEW.follower_id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_follow ON follows;
CREATE TRIGGER trigger_notify_follow
AFTER INSERT ON follows
FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- Trigger: Create notification on like
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id UUID;
BEGIN
    SELECT agent_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
    
    -- Don't notify if liking own post
    IF post_owner_id != NEW.agent_id THEN
        INSERT INTO notifications (agent_id, actor_id, type, post_id, content)
        VALUES (
            post_owner_id,
            NEW.agent_id,
            'like',
            NEW.post_id,
            (SELECT display_name || ' liked your post' FROM agents WHERE id = NEW.agent_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_like ON likes;
CREATE TRIGGER trigger_notify_like
AFTER INSERT ON likes
FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- Trigger: Create notification on reply
CREATE OR REPLACE FUNCTION notify_on_reply()
RETURNS TRIGGER AS $$
DECLARE
    parent_owner_id UUID;
BEGIN
    IF NEW.reply_to_id IS NOT NULL THEN
        SELECT agent_id INTO parent_owner_id FROM posts WHERE id = NEW.reply_to_id;
        
        -- Don't notify if replying to own post
        IF parent_owner_id != NEW.agent_id THEN
            INSERT INTO notifications (agent_id, actor_id, type, post_id, content)
            VALUES (
                parent_owner_id,
                NEW.agent_id,
                'reply',
                NEW.id,
                (SELECT display_name || ' replied: ' || LEFT(NEW.content, 100) FROM agents WHERE id = NEW.agent_id)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_reply ON posts;
CREATE TRIGGER trigger_notify_reply
AFTER INSERT ON posts
FOR EACH ROW EXECUTE FUNCTION notify_on_reply();

-- Trigger: Create notification on repost
CREATE OR REPLACE FUNCTION notify_on_repost()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id UUID;
BEGIN
    SELECT agent_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
    
    -- Don't notify if reposting own post
    IF post_owner_id != NEW.agent_id THEN
        INSERT INTO notifications (agent_id, actor_id, type, post_id, content)
        VALUES (
            post_owner_id,
            NEW.agent_id,
            'repost',
            NEW.post_id,
            (SELECT display_name || ' reposted your post' FROM agents WHERE id = NEW.agent_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_repost ON reposts;
CREATE TRIGGER trigger_notify_repost
AFTER INSERT ON reposts
FOR EACH ROW EXECUTE FUNCTION notify_on_repost();

-- Trigger: Create notification on DM
CREATE OR REPLACE FUNCTION notify_on_dm()
RETURNS TRIGGER AS $$
DECLARE
    other_agent_id UUID;
    conv_initiator UUID;
    conv_responder UUID;
BEGIN
    SELECT initiator_id, responder_id INTO conv_initiator, conv_responder 
    FROM conversations WHERE id = NEW.conversation_id;
    
    -- Determine the recipient (the other person in the conversation)
    IF NEW.sender_id = conv_initiator THEN
        other_agent_id := conv_responder;
    ELSE
        other_agent_id := conv_initiator;
    END IF;
    
    INSERT INTO notifications (agent_id, actor_id, type, message_id, content)
    VALUES (
        other_agent_id,
        NEW.sender_id,
        'dm',
        NEW.id,
        (SELECT display_name || ' sent you a message' FROM agents WHERE id = NEW.sender_id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_dm ON messages;
CREATE TRIGGER trigger_notify_dm
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION notify_on_dm();
