import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar" style={{ 
      backgroundColor: '#007bff', 
      padding: '10px 20px',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      color: 'white'
    }}>
      <div className="navbar-brand">
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.5rem' }}>
          Social Media
        </Link>
      </div>
      <div className="navbar-menu" style={{ display: 'flex', gap: '20px' }}>
        {isAuthenticated ? (
          <>
            <Link to="/feed" style={{ color: 'white', textDecoration: 'none' }}>Feed</Link>
            <Link to="/profile" style={{ color: 'white', textDecoration: 'none' }}>Profile</Link>
            <Link to="/users" style={{ color: 'white', textDecoration: 'none' }}>Users</Link>
            <span style={{ color: 'white' }}>Welcome, {user?.username}</span>
            <button 
              onClick={handleLogout} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'white', 
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
