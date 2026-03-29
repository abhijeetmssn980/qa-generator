import React, { useState, useEffect } from 'react';
import { apiGetProductByUniqueId } from '../services/api';
import type { Product } from '../services/api';
import '../ViewProduct.css';

type PublicProductProps = {
  uniqueId: string;
};

const PublicProduct: React.FC<PublicProductProps> = ({ uniqueId }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const product = await apiGetProductByUniqueId(uniqueId);
        if (product) {
          setProduct(product);
          setError(null);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [uniqueId]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fb 0%, #e8eef8 100%)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px', animation: 'spin 2s linear infinite' }}>
            ⏳
          </div>
          <p style={{ fontSize: '18px', color: '#666', fontWeight: '500' }}>Loading product...</p>
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

  if (error || !product) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fb 0%, #e8eef8 100%)',
        padding: '20px',
      }}>
        <div style={{
          textAlign: 'center',
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <h2 style={{ color: '#dc2626', marginTop: 0 }}>Product Not Found</h2>
          <p style={{ color: '#666' }}>{error || 'The product you are looking for does not exist.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-product">
      <div className="view-product-header">
        <h1>{product.name}</h1>
        <p className="view-product-id">ID: {product.uniqueId}</p>
      </div>

      <div className="view-product-content">
        <div className="view-info-group">
          <label>PRODUCT DETAILS</label>
          <div className="view-info-row">
            <div className="view-info-col">
              <span className="label">Batch Number</span>
              <span className="value">{product.batch || '—'}</span>
            </div>
            <div className="view-info-col">
              <span className="label">Manufacturing Date</span>
              <span className="value">{product.mfg || '—'}</span>
            </div>
          </div>
          <div className="view-info-row">
            <div className="view-info-col">
              <span className="label">Expiry Date</span>
              <span className="value" style={{ color: '#dc2626', fontWeight: '600' }}>{product.expiry || '—'}</span>
            </div>
            <div className="view-info-col">
              <span className="label">Packing Size</span>
              <span className="value">{product.packingSize || '—'}</span>
            </div>
          </div>
        </div>

        <div className="view-info-group">
          <label>MANUFACTURER INFORMATION</label>
          <div className="view-info-row">
            <div className="view-info-col full-width">
              <span className="label">Manufacturer Name</span>
              <span className="value">{product.manufacturer || '—'}</span>
            </div>
          </div>
          <div className="view-info-row">
            <div className="view-info-col full-width">
              <span className="label">Address</span>
              <span className="value">{product.manufacturerAddress || '—'}</span>
            </div>
          </div>
          <div className="view-info-row">
            <div className="view-info-col">
              <span className="label">Registration Number</span>
              <span className="value">{product.registrationNumber || '—'}</span>
            </div>
            <div className="view-info-col">
              <span className="label">Licence</span>
              <span className="value">{product.manufacturerLicence || '—'}</span>
            </div>
          </div>
        </div>

        <div className="view-info-group">
          <label>ADDITIONAL INFORMATION</label>
          <div className="view-info-row">
            <div className="view-info-col full-width">
              <span className="label">Technical Name</span>
              <span className="value">{product.technicalName || '—'}</span>
            </div>
          </div>
        </div>

        {product.manufacturerAddress && (
          <div className="view-info-group">
            <label>CUSTOMER CARE CONTACT DETAILS</label>
            <div className="contact-details">
              <p><strong>🏢</strong> {product.manufacturerAddress}</p>
              <p><strong>📞</strong> —</p>
              <p><strong>📧</strong> —</p>
              <p><strong>🌐</strong> —</p>
            </div>
          </div>
        )}
      </div>

      <div className="view-footer">
        <p>Powered by <strong>AP Solutions</strong></p>
      </div>
    </div>
  );
};

export default PublicProduct;
