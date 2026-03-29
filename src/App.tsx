import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import PublicProduct from './pages/PublicProduct';
import { apiGetMe, apiLogout } from './services/api';
import type { UserRole } from './services/api';
import './App.css';

interface User {
  email: string;
  uid: string;
  companyName?: string;
  companyLogo?: string;
  companyAddress?: string;
  role?: UserRole;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [publicProductId, setPublicProductId] = useState<string | null>(null);

  useEffect(() => {
    // Check if viewing a public product by hash
    const hash = window.location.hash;
    if (hash.startsWith('#product/')) {
      const productId = hash.replace('#product/', '');
      setPublicProductId(productId);
      setLoading(false);
      return;
    }

    // Verify token with API on load
    const token = localStorage.getItem('token');
    if (token) {
      apiGetMe()
        .then((data) => setUser(data.user))
        .catch(() => {
          apiLogout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Listen for hash changes to support public product links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#product/')) {
        const productId = hash.replace('#product/', '');
        setPublicProductId(productId);
      } else {
        setPublicProductId(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
    apiLogout();
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fb 0%, #e8eef8 100%)',
      }}>
        <div style={{
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
            animation: 'spin 2s linear infinite',
          }}>
            ⏳
          </div>
          <p style={{
            fontSize: '18px',
            color: '#666',
            fontWeight: '500',
          }}>
            Loading...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If viewing a public product, show it without requiring login
  if (publicProductId) {
    return <PublicProduct uniqueId={publicProductId} />;
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}

export default App
