import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

interface User {
  id: number;
  username: string;
  email: string;
  followers_count: number;
  following_count: number;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useContext(AuthContext);
  const [followingStatus, setFollowingStatus] = useState<{[key: number]: boolean}>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await axios.get('/api/users/');
      const userData = response.data;

      setUsers(userData);


      if (currentUser) {
        const followStatusObj: {[key: number]: boolean} = {};
        for (const user of userData) {
          if (user.id !== currentUser.id) {
            try {
              const followResponse = await axios.get(`/api/users/${user.id}/follow-status/`);
              followStatusObj[user.id] = followResponse.data.is_following;
            } catch (err) {
              console.error(`Error checking follow status for user ${user.id}:`, err);
              followStatusObj[user.id] = false;
            }
          }
        }
        setFollowingStatus(followStatusObj);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (userId: number) => {
    try {
      if (followingStatus[userId]) {

        await axios.post(`/api/users/${userId}/unfollow/`);
        setFollowingStatus({
          ...followingStatus,
          [userId]: false
        });
      } else {

        await axios.post(`/api/users/${userId}/follow/`);
        setFollowingStatus({
          ...followingStatus,
          [userId]: true
        });
      }


      fetchUsers();
    } catch (err) {
      console.error('Error toggling follow status:', err);
      setError('Failed to update follow status. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div>
      <h2>Users</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div className="user-list">
          {users.map(user => (
            <div key={user.id} className="card" style={{ marginBottom: '10px', padding: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Link to={`/profile/${user.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3>{user.username}</h3>
                    <p>Followers: {user.followers_count} | Following: {user.following_count}</p>
                  </Link>
                </div>
                {currentUser && user.id !== currentUser.id && (
                  <button 
                    onClick={() => handleFollowToggle(user.id)}
                    className={`btn ${followingStatus[user.id] ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {followingStatus[user.id] ? 'Unfollow' : 'Follow'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserList;
