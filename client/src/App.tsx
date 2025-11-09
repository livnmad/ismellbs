import React, { useState } from 'react';
import './App.css';
import BlogForm from './components/BlogForm';
import BlogList from './components/BlogList';
import NewsFeed from './components/NewsFeed';
import BullshitFact from './components/BullshitFact';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePostCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="App">
      <BullshitFact />
      
      <header className="header">
        <h1>I Smell Bullshit</h1>
        <p>Say what you're thinking. Read what others think.</p>
      </header>

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
    </div>
  );
}

export default App;
