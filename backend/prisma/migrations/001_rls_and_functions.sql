-- RLS Policies and PostgreSQL Functions for Fluent App
-- Run this in Supabase SQL Editor

-- ==================== ROW LEVEL SECURITY (RLS) ====================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE encrypted_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE dictionary_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_cache ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view public profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = "userId");

-- Encrypted credentials policies
CREATE POLICY "Users can view own credentials" ON encrypted_credentials
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own credentials" ON encrypted_credentials
  FOR ALL USING (auth.uid() = "userId");

-- Dictionary words policies
CREATE POLICY "Users can view own dictionary" ON dictionary_words
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own dictionary" ON dictionary_words
  FOR ALL USING (auth.uid() = "userId");

-- Flashcards policies
CREATE POLICY "Users can view own flashcards" ON flashcards
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own flashcards" ON flashcards
  FOR ALL USING (auth.uid() = "userId");

-- Saved posts policies
CREATE POLICY "Users can view own saved posts" ON saved_posts
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own saved posts" ON saved_posts
  FOR ALL USING (auth.uid() = "userId");

-- Collections policies
CREATE POLICY "Users can view own collections" ON collections
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own collections" ON collections
  FOR ALL USING (auth.uid() = "userId");

-- Collection words policies (inherit from collection ownership)
CREATE POLICY "Users can view own collection words" ON collection_words
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_words."collectionId"
      AND collections."userId" = auth.uid()
    )
  );

CREATE POLICY "Users can manage own collection words" ON collection_words
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_words."collectionId"
      AND collections."userId" = auth.uid()
    )
  );

-- User follows policies
CREATE POLICY "Users can view all follows" ON user_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own follows" ON user_follows
  FOR ALL USING (auth.uid() = "followerId");

-- User blocks policies
CREATE POLICY "Users can view own blocks" ON user_blocks
  FOR SELECT USING (auth.uid() = "blockerId");

CREATE POLICY "Users can manage own blocks" ON user_blocks
  FOR ALL USING (auth.uid() = "blockerId");

-- News cache policies (read-only for users)
CREATE POLICY "Users can view news cache" ON news_cache
  FOR SELECT USING (true);

-- ==================== POSTGRESQL FUNCTIONS ====================

-- Function to follow a user (atomic with counts)
CREATE OR REPLACE FUNCTION follow_user(follower_id UUID, following_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert follow relationship
  INSERT INTO user_follows ("followerId", "followingId", "followedAt")
  VALUES (follower_id, following_id, NOW())
  ON CONFLICT DO NOTHING;

  -- Update follower's following count
  UPDATE users
  SET "followingCount" = "followingCount" + 1
  WHERE id = follower_id;

  -- Update following user's followers count
  UPDATE users
  SET "followersCount" = "followersCount" + 1
  WHERE id = following_id;
END;
$$;

-- Function to unfollow a user (atomic with counts)
CREATE OR REPLACE FUNCTION unfollow_user(follower_id UUID, following_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete follow relationship
  DELETE FROM user_follows
  WHERE "followerId" = follower_id AND "followingId" = following_id;

  -- Update follower's following count
  UPDATE users
  SET "followingCount" = GREATEST("followingCount" - 1, 0)
  WHERE id = follower_id;

  -- Update following user's followers count
  UPDATE users
  SET "followersCount" = GREATEST("followersCount" - 1, 0)
  WHERE id = following_id;
END;
$$;

-- Function to block a user (atomic, removes follows)
CREATE OR REPLACE FUNCTION block_user(blocker_id UUID, blocked_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert block relationship
  INSERT INTO user_blocks ("blockerId", "blockedId", "blockedAt")
  VALUES (blocker_id, blocked_id, NOW())
  ON CONFLICT DO NOTHING;

  -- Remove follow relationships in both directions
  DELETE FROM user_follows
  WHERE ("followerId" = blocker_id AND "followingId" = blocked_id)
     OR ("followerId" = blocked_id AND "followingId" = blocker_id);

  -- Update counts (if follows were removed)
  UPDATE users
  SET "followingCount" = (
    SELECT COUNT(*) FROM user_follows WHERE "followerId" = users.id
  ),
  "followersCount" = (
    SELECT COUNT(*) FROM user_follows WHERE "followingId" = users.id
  )
  WHERE id IN (blocker_id, blocked_id);
END;
$$;

-- ==================== ENABLE REALTIME ====================

-- Enable realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE dictionary_words;
ALTER PUBLICATION supabase_realtime ADD TABLE saved_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE collections;
ALTER PUBLICATION supabase_realtime ADD TABLE collection_words;
ALTER PUBLICATION supabase_realtime ADD TABLE user_follows;

-- ==================== INDEXES FOR PERFORMANCE ====================

-- Additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_dictionary_words_user_lang ON dictionary_words("userId", language);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards("nextReview") WHERE "nextReview" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_saved ON saved_posts("userId", "savedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_collections_user_default ON collections("userId", "isDefault");
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows("followerId");
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows("followingId");
CREATE INDEX IF NOT EXISTS idx_news_cache_key_fetched ON news_cache("cacheKey", "fetchedAt" DESC);
