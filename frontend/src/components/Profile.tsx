import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

interface Post {
  id: number;
  user: number;
  username: string;
  content: string;
  created_at: string;
  likes_count: number;
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
  followers_count: number;
  following_count: number;
}

const Profile: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { userId } = useParams<{ userId?: string }>();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const isOwnProfile = !userId || (user && userId === user.id.toString());

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUserPosts();
      if (!isOwnProfile) {
        checkFollowStatus();
      }
    }
  }, [user, userId]);

  const fetchUserProfile = async () => {
    try {
      const url = userId ? `/api/profile/${userId}/` : '/api/profile/';
      const response = await axios.get(url);
      setUserProfile(response.data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load profile. Please try again later.');
    }
  };

  const fetchUserPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/posts/');
      // Filter posts by the user ID (either the current user or the specified user)
      const targetUserId = userId ? parseInt(userId) : user?.id;
      const filteredPosts = response.data.filter((post: Post) => post.user === targetUserId);
      setUserPosts(filteredPosts);
      setError(null);
    } catch (err) {
      console.error('Error fetching user posts:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!userId) return;

    try {
      const response = await axios.get(`/api/users/${userId}/follow-status/`);
      setIsFollowing(response.data.is_following);
    } catch (err) {
      console.error('Error checking follow status:', err);
    }
  };

  const handleFollowToggle = async () => {
    if (!userId) return;

    try {
      if (isFollowing) {
        await axios.post(`/api/users/${userId}/unfollow/`);
        setIsFollowing(false);
      } else {
        await axios.post(`/api/users/${userId}/follow/`);
        setIsFollowing(true);
      }
      // Refresh the profile to update follower counts
      fetchUserProfile();
    } catch (err) {
      console.error('Error toggling follow status:', err);
      setError('Failed to update follow status. Please try again.');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      const response = await axios.post('/api/posts/', { content: newPostContent });
      setUserPosts([response.data, ...userPosts]);
      setNewPostContent('');
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      await axios.delete(`/api/posts/${postId}/`);
      setUserPosts(userPosts.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post. Please try again.');
    }
  };

  if (loading && !userProfile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2>Profile</h2>
        {userProfile && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p><strong>Username:</strong> {userProfile.username}</p>
                <p><strong>Email:</strong> {userProfile.email}</p>
                <p><strong>Followers:</strong> {userProfile.followers_count}</p>
                <p><strong>Following:</strong> {userProfile.following_count}</p>
              </div>
              {!isOwnProfile && (
                <button 
                  onClick={handleFollowToggle}
                  className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {isOwnProfile && (
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
      )}

      <h3>{isOwnProfile ? 'Your Posts' : `${userProfile?.username}'s Posts`}</h3>
      {userPosts.length === 0 ? (
        <p>You haven't created any posts yet.</p>
      ) : (
        userPosts.map(post => (
          <div key={post.id} className="card post">
            <div className="post-header">
              <strong>{userProfile?.username}</strong>
              <small>{new Date(post.created_at).toLocaleString()}</small>
            </div>
            <p>{post.content}</p>
            <div className="post-actions">
              {isOwnProfile && (
                <button onClick={() => handleDeletePost(post.id)}>
                  Delete
                </button>
              )}
              <span>Likes: {post.likes_count}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Profile;
