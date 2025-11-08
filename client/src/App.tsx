import React, { useState } from 'react';
import './App.css';
import BlogForm from './components/BlogForm';
import BlogList from './components/BlogList';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePostCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="App">
      <header className="header">
        <h1>I Smell Bullshit</h1>
        <p>Say what you're thinking. Read what others think.</p>
      </header>

      <div className="hero-section">
        <div className="hero-illustration">
          <div className="illustration-placeholder">💩👑</div>
        </div>
        <BlogForm onPostCreated={handlePostCreated} />
      </div>

      <div className="main-content">
        <h2 style={{ color: '#f5deb3', fontSize: '2rem', marginBottom: '20px' }}>
          What others are saying
        </h2>
      </div>

      <BlogList refreshTrigger={refreshTrigger} />
    </div>
  );
}

export default App;
