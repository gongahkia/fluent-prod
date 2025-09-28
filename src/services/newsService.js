export async function fetchPosts() {
  // Example using Hacker News API to get top stories.
  // This function fetches the top 10 stories.
  const topStoriesUrl = 'https://hacker-news.firebaseio.com/v0/topstories.json';
  try {
    const response = await fetch(topStoriesUrl);
    const storyIds = await response.json();
    const top10Ids = storyIds.slice(0, 10);
    const posts = await Promise.all(
      top10Ids.map(async (id) => {
        const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        return res.json();
      })
    );
    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}
