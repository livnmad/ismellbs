import React, { useState } from 'react';
import BlogForm from './BlogForm';
import BlogList from './BlogList';
import NewsFeed from './NewsFeed';

const Home: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePostCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <>
      <div className="hero-section">
        <div className="hero-illustration">
          <img src="/bull.png" alt="Bullshit Bull" className="bull-graphic" />
        </div>
        <BlogForm onPostCreated={handlePostCreated} />
      </div>

      <NewsFeed />

      <div className="main-content">
        <h2 style={{ color: '#f5deb3', fontSize: '2rem', marginBottom: '20px' }}>
          Random Bullshit Posts
        </h2>
      </div>

      <BlogList refreshTrigger={refreshTrigger} />
    </>
  );
};

export default Home;
