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
      const response = await axios.get('http://localhost:3001/api/news?limit=3');
      
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
        <h2 className="news-title">Bullshit News</h2>
        <div className="news-loading">Loading news...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-feed">
        <h2 className="news-title">Bullshit News</h2>
        <div className="news-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="news-feed">
      <h2 className="news-title">Bullshit News</h2>
      <div className="news-list">
        {news.map((article, index) => (
          <a
            key={index}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`news-item ${index % 2 === 0 ? 'image-left' : 'image-right'}`}
          >
            {article.urlToImage && (
              <div className="news-thumbnail">
                <img src={article.urlToImage} alt={article.title} />
              </div>
            )}
            <div className="news-content">
              <div className="news-header">
                <span className="news-source">{article.source} • {formatDate(article.publishedAt)}</span>
              </div>
              <h3 className="news-item-title">{article.title}</h3>
              {article.description && (
                <p className="news-description">{article.description}</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default NewsFeed;
