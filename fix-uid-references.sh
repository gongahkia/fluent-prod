#!/bin/bash

# Script to fix all currentUser.uid references to currentUser.id
# Run this to complete the Firebase → Supabase migration

echo "🔧 Fixing Firebase uid → Supabase id references..."
echo ""

FILES=(
  "src/components/Flashcards.jsx"
  "src/components/NewsFeed.jsx"
  "src/components/Profile.jsx"
  "src/components/PublicProfile.jsx"
  "src/components/SavedPosts.jsx"
  "src/components/Settings.jsx"
  "src/components/UserSearch.jsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Fixing $file..."
    # Use sed to replace currentUser.uid with currentUser.id
    sed -i.bak 's/currentUser\.uid/currentUser.id/g' "$file"
    rm "${file}.bak" 2>/dev/null
    echo "   ✅ Done"
  else
    echo "   ⚠️  File not found: $file"
  fi
done

echo ""
echo "🎉 All files fixed!"
echo ""
echo "Changed:"
echo "  currentUser.uid  →  currentUser.id"
echo ""
echo "Files updated: ${#FILES[@]}"
