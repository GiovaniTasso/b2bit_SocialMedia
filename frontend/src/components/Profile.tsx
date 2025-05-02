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
  const { user, loading: authLoading } = useContext(AuthContext);
  const { userId } = useParams<{ userId?: string }>();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const isOwnProfile = !userId || (user && userId === user.id.toString());

  useEffect(() => {
    if (!authLoading && user) {
      fetchUserProfile();
      fetchUserPosts();
      if (!isOwnProfile) {
        checkFollowStatus();
      }
    }
  }, [user, userId, authLoading]);

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
      const targetUserId = userId ? userId : user?.id;
      const url = `/api/users/${targetUserId}/posts/`;
      const response = await axios.get(url);
      setUserPosts(response.data);
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

      fetchUserProfile();
    } catch (err) {
      console.error('Error toggling follow status:', err);
      setError('Failed to update follow status. Please try again.');
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

  const handleEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setEditedContent(post.content);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditedContent('');
  };

  const handleSaveEdit = async (postId: number) => {
    try {
      const response = await axios.put(`/api/posts/${postId}/`, {
        content: editedContent
      });

      // Update the post in the local state
      setUserPosts(userPosts.map(post => 
        post.id === postId ? { ...post, content: editedContent } : post
      ));

      // Reset editing state
      setEditingPostId(null);
      setEditedContent('');
      setError(null);
    } catch (err) {
      console.error('Error updating post:', err);
      setError('Failed to update post. Please try again.');
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
              <div style={{textAlign: 'center', marginBottom: '15px'}}>
                <p><strong>Username:</strong> {userProfile.username}</p>
                <p><strong>Email:</strong> {userProfile.email}</p>
                <p><strong>Followers:</strong> {userProfile.followers_count}</p>
                <p><strong>Following:</strong> {userProfile.following_count}</p>
              </div>
              {!isOwnProfile && (
                  <div style={{textAlign: 'center'}}>
                    <button
                        onClick={handleFollowToggle}
                        className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                  </div>
              )}
            </div>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}


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

            {editingPostId === post.id ? (
              <div className="edit-form">
                <textarea 
                  className="form-control" 
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={4}
                />
                <div className="post-actions" style={{ marginTop: '10px' }}>
                  <button onClick={() => handleSaveEdit(post.id)}>
                    Save
                  </button>
                  <button onClick={handleCancelEdit}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p>{post.content}</p>
                <div className="post-actions">
                  {isOwnProfile && (
                    <>
                      <button onClick={() => handleEditPost(post)}>
                        Edit
                      </button>
                      <button onClick={() => handleDeletePost(post.id)}>
                        Delete
                      </button>
                    </>
                  )}
                  <span>Likes: {post.likes_count}</span>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Profile;
