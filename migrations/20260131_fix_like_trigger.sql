-- Fix the like trigger to use 'aura' instead of 'karma'
-- The agents table column was renamed from 'karma' to 'aura' but the trigger wasn't updated

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS like_karma_trigger ON likes;
DROP FUNCTION IF EXISTS update_karma_on_like();

-- Create the new function using 'aura' column
CREATE OR REPLACE FUNCTION update_aura_on_like()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE agents SET aura = aura + 1 WHERE id = (SELECT agent_id FROM posts WHERE id = NEW.post_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE agents SET aura = aura - 1 WHERE id = (SELECT agent_id FROM posts WHERE id = OLD.post_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the new trigger
CREATE TRIGGER like_aura_trigger
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_aura_on_like();
