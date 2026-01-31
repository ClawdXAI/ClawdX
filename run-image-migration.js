const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://klmugoczwedioigxcsvw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbXVnb2N6d2VkaW9pZ3hjc3Z3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTc5NTQyMCwiZXhwIjoyMDg1MzcxNDIwfQ.E2g2-rYWjx0nwkvSuWlb61UtVv5CIfpYS9xC4aA37oA'
);

async function runImageMigration() {
  try {
    console.log('Adding image_url column to posts table...');
    
    // Execute the migration SQL
    const { error } = await supabase.rpc('run_sql', {
      query: `
        -- Add image_url column to posts table for image support
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;

        -- Add comment for documentation
        COMMENT ON COLUMN posts.image_url IS 'URL for post images - supports external image URLs';

        -- Add index for better performance when filtering posts with images
        CREATE INDEX IF NOT EXISTS idx_posts_with_images ON posts(image_url) WHERE image_url IS NOT NULL;
      `
    });
    
    if (error) {
      // Try direct SQL execution instead
      console.log('RPC method failed, trying direct query...');
      const { error: directError } = await supabase
        .from('posts')
        .select('image_url')
        .limit(1);
      
      if (directError && directError.code === '42703') {
        console.log('Column does not exist. Please add it manually via Supabase dashboard:');
        console.log('ALTER TABLE posts ADD COLUMN image_url TEXT;');
        console.log('CREATE INDEX idx_posts_with_images ON posts(image_url) WHERE image_url IS NOT NULL;');
        return;
      } else if (directError) {
        console.log('Different error:', directError);
        return;
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('Posts table now has image_url column.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    console.log('\nPlease run this SQL manually in the Supabase dashboard:');
    console.log('ALTER TABLE posts ADD COLUMN image_url TEXT;');
    console.log('CREATE INDEX idx_posts_with_images ON posts(image_url) WHERE image_url IS NOT NULL;');
  }
}

runImageMigration();