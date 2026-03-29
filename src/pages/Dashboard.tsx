import React, { useState, useEffect } from 'react';
import '../Dashboard.css';
import AddProduct from './AddProduct';
import ProductsList from './ProductsList';
import ViewProduct from './ViewProduct';
import Logo from '../components/Logo';
import { db } from '../services/database';
import type { Product } from '../services/database';

type Page = 'dashboard' | 'add' | 'list' | 'trash' | 'view';

interface User {
  email: string;
  uid: string;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [page, setPage] = useState<Page>('dashboard');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  useEffect(() => {
    // Load products from the database service
    const loadProducts = async () => {
      try {
        const products = await db.getAllProducts();
        setAllProducts(products);
      } catch (error) {
        console.error('Failed to load products:', error);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    // Check if URL contains a product ID to view (from QR code scan)
    const hash = window.location.hash;
    if (hash.startsWith('#product/')) {
      const productId = hash.replace('#product/', '');
      const product = allProducts.find(p => p.uniqueId === productId);
      if (product) {
        setSelectedProduct(product);
        setPage('view');
      }
    }
  }, [allProducts]);

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setPage('view');
  };

  const handleProductAdded = async (newProduct: Product) => {
    try {
      await db.addProduct(newProduct);
      setAllProducts(prev => [...prev, newProduct]);
    } catch (error) {
      console.error('Failed to add product:', error);
    }
  };

  const renderPage = () => {
    switch (page) {
      case 'add':
        return <AddProduct onProductAdded={handleProductAdded} />;
      case 'list':
        return <ProductsList products={allProducts} goAdd={() => setPage('add')} onView={handleViewProduct} />;
      case 'view':
        return selectedProduct ? (
          <ViewProduct product={selectedProduct} goBack={() => setPage('list')} />
        ) : null;
      case 'trash':
        return <div className="page-placeholder">Trash management is under construction.</div>;
      default:
        return (
          <div className="card">
            <div className="card-icon">📋</div>
            <div>
              <div className="card-title">Total Products</div>
              <div className="card-value">{allProducts.length}</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo-section">
          <Logo size="medium" showText={true} />
        </div>
        <nav className="sidebar-nav">
          <a
            href="#"
            className={page === 'dashboard' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setPage('dashboard');
            }}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </a>
          <a
            href="#"
            className={page === 'add' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setPage('add');
            }}
          >
            <span className="nav-icon">➕</span>
            Add Products
          </a>
          <a
            href="#"
            className={page === 'list' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setPage('list');
            }}
          >
            <span className="nav-icon">📋</span>
            Products List
          </a>
          <a
            href="#"
            className={page === 'trash' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setPage('trash');
            }}
          >
            <span className="nav-icon">🗑️</span>
            Trash
          </a>
        </nav>
        <div className="powered-by">
          Powered By <a href="#">Ap Solutions</a>
        </div>
      </aside>
      <main className="main-content">
        <header className="header">
          <div className="menu-icon">☰</div>
          <div className="header-right">
            {user && (
              <div className="user-profile">
                <button
                  className="admin-dropdown"
                  onClick={() => setShowLogoutMenu(!showLogoutMenu)}
                >
                  👤 {user.email?.split('@')[0] || 'User'} ▼
                </button>
                {showLogoutMenu && (
                  <div className="logout-menu">
                    <div className="menu-item-email">{user.email}</div>
                    <button
                      onClick={() => {
                        setShowLogoutMenu(false);
                        onLogout();
                      }}
                      className="menu-item logout-btn"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
        <section className="dashboard-main">{renderPage()}</section>
      </main>
    </div>
  );
};

export default Dashboard;
