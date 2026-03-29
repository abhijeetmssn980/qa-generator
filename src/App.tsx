import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
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

  useEffect(() => {
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

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}

export default App
