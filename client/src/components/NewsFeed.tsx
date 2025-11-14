import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './NewsFeed.css';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  urlToImage?: string;
}

const NewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/news?limit=6');
      
      if (response.data.success) {
        setNews(response.data.data);
      } else {
        setError('Failed to load news');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Unable to fetch news at this time');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="news-feed">
        <h2 className="news-title">News</h2>
        <div className="news-loading">Loading news...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-feed">
        <h2 className="news-title">News</h2>
        <div className="news-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="news-feed">
      <h2 className="news-title">Today's News</h2>
      <div className="news-grid">
        {news.map((article, index) => (
          <a
            key={index}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="news-card"
          >
            {article.urlToImage && (
              <div className="news-card-image">
                <img src={article.urlToImage} alt={article.title} />
              </div>
            )}
            <div className="news-card-content">
              <div className="news-card-header">
                <span className="news-source">{article.source}</span>
                <span className="news-time">{formatDate(article.publishedAt)}</span>
              </div>
              <h3 className="news-card-title">{article.title}</h3>
              {article.description && (
                <p className="news-card-description">{article.description}</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default NewsFeed;
