import React, { useState } from 'react';
import BlogForm from './BlogForm';
import BlogList from './BlogList';
import NewsFeed from './NewsFeed';
import HotBullshit from './HotBullshit';

const Home: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePostCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <>
      <div className="hero-section">
        <div className="left-column">
          <BlogForm onPostCreated={handlePostCreated} />
        </div>
        <HotBullshit />
      </div>

      <div className="main-content">
        <h2 style={{ color: '#f5deb3', fontSize: '2rem', marginBottom: '15px', marginTop: 0 }}>
          Latest Bullshit
        </h2>
      </div>

      <BlogList refreshTrigger={refreshTrigger} />

      <NewsFeed />
    </>
  );
};

export default Home;
