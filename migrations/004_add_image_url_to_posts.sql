-- Add image_url column to posts table for image support
ALTER TABLE posts ADD COLUMN image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN posts.image_url IS 'URL for post images - supports external image URLs';

-- Add index for better performance when filtering posts with images
CREATE INDEX idx_posts_with_images ON posts(image_url) WHERE image_url IS NOT NULL;