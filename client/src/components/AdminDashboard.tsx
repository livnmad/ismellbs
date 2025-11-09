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

const AdminDashboard: React.FC = () => {
  const [posts, setPosts] = useState<PostWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    verifyAuth();
    fetchPosts();
  }, []);

  const verifyAuth = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }

    try {
      await axios.post(
        'http://localhost:3001/api/admin/verify',
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
      const response = await axios.get('http://localhost:3001/api/admin/posts', {
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

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    try {
      await axios.delete(`http://localhost:3001/api/admin/posts/${postId}`, {
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
    </div>
  );
};

export default AdminDashboard;
