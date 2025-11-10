import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './AdminDashboard.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface PostWithLocation {
  id: string;
  title: string;
  content: string;
  author: string;
  email: string;
  ipAddress: string;
  createdAt: string;
  location?: {
    lat: number;
    lon: number;
    city?: string;
    region?: string;
    country?: string;
  };
}

interface AdminUser {
  username: string;
  createdAt: string;
  createdBy?: string;
}

interface AppUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

const AdminDashboard: React.FC = () => {
  const [posts, setPosts] = useState<PostWithLocation[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'posts' | 'admins' | 'appusers' | 'settings'>('posts');
  
  // Admin creation
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  
  // Password change
  const [oldPassword, setOldPassword] = useState('');
  const [newPasswordChange, setNewPasswordChange] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    verifyAuth();
    fetchPosts();
    if (activeTab === 'admins') {
      fetchAdmins();
    }
    if (activeTab === 'appusers') {
      fetchAppUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const verifyAuth = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }

    try {
      await axios.post(
        'https://ismellbullshit.com/api/admin/verify',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      localStorage.removeItem('adminToken');
      navigate('/admin');
    }
  };

  const fetchPosts = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      setLoading(true);
      const response = await axios.get('https://ismellbullshit.com/api/admin/posts', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setPosts(response.data.data);
      }
    } catch (err: any) {
      setError('Failed to load posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await axios.get('https://ismellbullshit.com/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setAdmins(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching admins:', err);
    }
  };

  const fetchAppUsers = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await axios.get('https://ismellbullshit.com/api/admin/app-users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setAppUsers(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching app users:', err);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    const token = localStorage.getItem('adminToken');
    try {
      const response = await axios.post(
        'https://ismellbullshit.com/api/admin/users/create',
        { username: newUsername, password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setCreateSuccess('Admin created successfully!');
        setNewUsername('');
        setNewPassword('');
        fetchAdmins();
      } else {
        setCreateError(response.data.message || 'Failed to create admin');
      }
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create admin');
    }
  };

  const handleDeleteAdmin = async (username: string) => {
    if (!window.confirm(`Are you sure you want to delete admin "${username}"?`)) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      const response = await axios.delete(`https://ismellbullshit.com/api/admin/users/${username}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        fetchAdmins();
      } else {
        alert(response.data.message || 'Failed to delete admin');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete admin');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPasswordChange !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      const response = await axios.post(
        'https://ismellbullshit.com/api/admin/change-password',
        { oldPassword, newPassword: newPasswordChange },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPasswordSuccess('Password changed successfully!');
        setOldPassword('');
        setNewPasswordChange('');
        setConfirmPassword('');
      } else {
        setPasswordError(response.data.message || 'Failed to change password');
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await axios.post(
        `https://ismellbullshit.com/api/admin/app-users/${userId}/toggle`,
        { isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        fetchAppUsers();
      } else {
        alert(response.data.message || 'Failed to update user status');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleDeleteAppUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      const response = await axios.delete(`https://ismellbullshit.com/api/admin/app-users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        fetchAppUsers();
      } else {
        alert(response.data.message || 'Failed to delete user');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      await axios.delete(`https://ismellbullshit.com/api/admin/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPosts(posts.filter((p) => p.id !== postId));
    } catch (err) {
      alert('Failed to delete post');
      console.error('Error deleting post:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const postsWithLocations = posts.filter((p) => p.location);

  if (loading) {
    return <div className="admin-loading">Loading dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>💩 Admin Dashboard</h1>
        <div className="admin-header-actions">
          <span className="admin-stat">Total Posts: {posts.length}</span>
          <span className="admin-stat">With Location: {postsWithLocations.length}</span>
          <button onClick={handleLogout} className="admin-logout-btn">
            Logout
          </button>
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-tabs">
        <button
          className={activeTab === 'posts' ? 'tab-active' : ''}
          onClick={() => setActiveTab('posts')}
        >
          📝 Posts & Map
        </button>
        <button
          className={activeTab === 'admins' ? 'tab-active' : ''}
          onClick={() => setActiveTab('admins')}
        >
          👥 Admin Users
        </button>
        <button
          className={activeTab === 'appusers' ? 'tab-active' : ''}
          onClick={() => setActiveTab('appusers')}
        >
          👤 App Users
        </button>
        <button
          className={activeTab === 'settings' ? 'tab-active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      {activeTab === 'posts' && (
        <>
          <div className="admin-map-container">
            <h2>Post Origins Map</h2>
            {postsWithLocations.length > 0 ? (
              <MapContainer
                center={[39.8283, -98.5795]} // Center of US
                zoom={4}
                style={{ height: '500px', width: '100%', borderRadius: '12px' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {postsWithLocations.map((post) =>
                  post.location ? (
                    <Marker key={post.id} position={[post.location.lat, post.location.lon]}>
                      <Popup>
                        <div className="map-popup">
                          <strong>{post.author}</strong>
                          <p>{post.content.substring(0, 100)}...</p>
                          <small>
                            {post.location.city}, {post.location.region}, {post.location.country}
                          </small>
                          <br />
                          <small>IP: {post.ipAddress}</small>
                        </div>
                      </Popup>
                    </Marker>
                  ) : null
                )}
              </MapContainer>
            ) : (
              <div className="no-location-data">No posts with location data yet</div>
            )}
          </div>

          <div className="admin-posts-container">
            <h2>All Posts</h2>
            <div className="admin-posts-list">
              {posts.map((post) => (
                <div key={post.id} className="admin-post-card">
                  <div className="admin-post-header">
                    <div>
                      <h3>{post.author}</h3>
                      <span className="admin-post-date">{formatDate(post.createdAt)}</span>
                    </div>
                    <button onClick={() => handleDeletePost(post.id)} className="admin-delete-btn">
                      🗑️ Delete
                    </button>
                  </div>

                  <p className="admin-post-content">{post.content}</p>

                  <div className="admin-post-meta">
                    <div className="admin-meta-item">
                      <strong>Email:</strong> {post.email}
                    </div>
                    <div className="admin-meta-item">
                      <strong>IP:</strong> {post.ipAddress}
                    </div>
                    {post.location && (
                      <div className="admin-meta-item">
                        <strong>Location:</strong> {post.location.city}, {post.location.region},{' '}
                        {post.location.country}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'admins' && (
        <div className="admin-users-container">
          <div className="admin-section">
            <h2>Create New Admin</h2>
            <form onSubmit={handleCreateAdmin} className="admin-form">
              {createError && <div className="form-error">{createError}</div>}
              {createSuccess && <div className="form-success">{createSuccess}</div>}
              
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  minLength={3}
                />
              </div>
              
              <div className="form-group">
                <label>Password (min 6 characters)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              
              <button type="submit" className="btn-primary">Create Admin</button>
            </form>
          </div>

          <div className="admin-section">
            <h2>Existing Admins</h2>
            <div className="admin-list">
              {admins.map((admin) => (
                <div key={admin.username} className="admin-card">
                  <div className="admin-info">
                    <strong>{admin.username}</strong>
                    <small>Created: {formatDate(admin.createdAt)}</small>
                    {admin.createdBy && <small>By: {admin.createdBy}</small>}
                  </div>
                  <button
                    onClick={() => handleDeleteAdmin(admin.username)}
                    className="admin-delete-btn"
                    disabled={admin.username === 'admin'}
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'appusers' && (
        <div className="admin-users-container">
          <div className="admin-section">
            <h2>Registered App Users</h2>
            <div className="admin-list">
              {appUsers.length === 0 ? (
                <p style={{ color: '#888' }}>No registered users yet</p>
              ) : (
                appUsers.map((user) => (
                  <div key={user.id} className="admin-card app-user-card">
                    <div className="admin-info">
                      <strong>{user.displayName}</strong>
                      <small>📧 {user.email}</small>
                      <small>📅 Joined: {formatDate(user.createdAt)}</small>
                      {user.lastLogin && <small>🕐 Last Login: {formatDate(user.lastLogin)}</small>}
                      <small className={user.isActive ? 'status-active' : 'status-inactive'}>
                        {user.isActive ? '✅ Active' : '❌ Inactive'}
                      </small>
                    </div>
                    <div className="user-actions">
                      <button
                        onClick={() => handleToggleUserStatus(user.id, !user.isActive)}
                        className={user.isActive ? 'btn-deactivate' : 'btn-activate'}
                      >
                        {user.isActive ? '🚫 Deactivate' : '✅ Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteAppUser(user.id)}
                        className="admin-delete-btn"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="admin-settings-container">
          <div className="admin-section">
            <h2>Change Password</h2>
            <form onSubmit={handleChangePassword} className="admin-form">
              {passwordError && <div className="form-error">{passwordError}</div>}
              {passwordSuccess && <div className="form-success">{passwordSuccess}</div>}
              
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>New Password (min 6 characters)</label>
                <input
                  type="password"
                  value={newPasswordChange}
                  onChange={(e) => setNewPasswordChange(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              
              <button type="submit" className="btn-primary">Change Password</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
