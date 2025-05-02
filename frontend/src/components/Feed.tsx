import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

interface Post {
  id: number;
  user: number;
  username: string;
  content: string;
  created_at: string;
  likes_count: number;
  liked?: boolean;
}

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/feed/');
      setPosts(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError('Failed to load feed. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      const response = await axios.post('/api/posts/', { content: newPostContent });
      setPosts([response.data, ...posts]);
      setNewPostContent('');
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    }
  };

  const handleLikePost = async (postId: number) => {
    try {
      const response = await axios.post(`/api/posts/${postId}/like/`);
      const { liked, likes_count } = response.data;

      setPosts(posts.map(post =>
        post.id === postId ? { ...post, liked, likes_count } : post
      ));
    } catch (err) {
      console.error('Error toggling like on post:', err);
      setError('Failed to toggle like on post. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading feed...</div>;
  }

  return (
    <div>
      <h2>Feed</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>Create Post</h3>
        <form onSubmit={handleCreatePost}>
          <div className="form-group">
            <textarea
              className="form-control"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
            />
          </div>
          <button type="submit" className="btn btn-primary">Post</button>
        </form>
      </div>

      {posts.length === 0 ? (
        <p>No posts in your feed. Try following some users!</p>
      ) : (
        posts.map(post => (
          <div key={post.id} className="card post">
            <div className="post-header">
              <Link to={`/profile/${post.user}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>{post.username}</strong>
              </Link>
              <small>{new Date(post.created_at).toLocaleString()}</small>
            </div>
            <p>{post.content}</p>
            <div className="post-actions">
              <button 
                onClick={() => handleLikePost(post.id)}
                className={post.liked ? "liked-button" : ""}
              >
                {post.liked ? "Unlike" : "Like"} ({post.likes_count})
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Feed;
