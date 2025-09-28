import React, { useState, useEffect } from 'react';
import { fetchPosts } from '../services/newsService';

export default function RealNewsFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getData() {
      const postsData = await fetchPosts();
      setPosts(postsData);
      setLoading(false);
    }
    getData();
  }, []);

  if (loading) {
    return <div>Loading posts...</div>;
  }

  return (
    <div>
      <h2>Real-Time Posts</h2>
      <ul>
        {posts.map(post => (
          <li key={post.id}>
            <a
              href={post.url ? post.url : '#'}
              target="_blank"
              rel="noopener noreferrer"
            >
              {post.title ? post.title : 'Untitled Post'}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
