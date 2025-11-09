import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import PostDetail from './components/PostDetail';
import BullshitFact from './components/BullshitFact';

function App() {
  return (
    <div className="App">
      <BullshitFact />
      
      <header className="header">
        <h1 onClick={() => window.location.href = '/'} style={{ cursor: 'pointer' }}>
          I Smell Bullshit
        </h1>
        <p>Welcome to I Smell Bullshit! We're your daily dose of "did they really just say that?" We call it like we smell it from politics to pop culture, corporate nonsense to conspiracy clowns. If it stinks, we're on it.</p>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/post/:postId" element={<PostDetail />} />
      </Routes>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>I Smell Bullshit HQ</h3>
            <p>1600 Bullshit Boulevard</p>
            <p>Swamp City, DC 20500</p>
            <p>United States of Absurdity</p>
          </div>
          
          <div className="footer-section">
            <h3>Contact Us</h3>
            <p> tips@ismellbullshit.gov</p>
            <p> complaints@noonecares.org</p>
          </div>
          
          <div className="footer-section">
            <h3>Business Hours</h3>
            <p>Monday - Friday: 9 AM - Never</p>
            <p>Saturday: When we feel like it</p>
            <p>Sunday: Closed (unlike Congress)</p>
            <p>Holidays: All lies, all the time</p>
          </div>
          
          <div className="footer-section">
            <h3>Keywords</h3>
            <p className="keywords">
              Politics Corruption Lies Spin Propaganda Fake News 
              Cover-ups Scandals Hypocrisy Double Standards 
              Gaslighting Taxpayer Waste Lobbyists Special Interests 
              Empty Promises Political Theater Smoke and Mirrors
            </p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p> 2025 I Smell Bullshit. All wrongs reserved.</p>
          <p className="disclaimer">
            Disclaimer: Everything on this site may or may not be true. 
            We can't tell the difference anymore, and neither can you. 
            If you're offended, you're probably guilty. 
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
