import React from 'react';
import '../ViewProduct.css';
import type { Product } from '../services/database';

type ViewProductProps = {
  product: Product;
  goBack: () => void;
};

const ViewProduct: React.FC<ViewProductProps> = ({ product, goBack }) => {
  return (
    <div className="view-product-page">
      <div className="view-header">
        <button className="back-btn" onClick={goBack}>← Back</button>
      </div>
      
      <div className="view-product-header">
        <div className="view-logo-section">
          <div className="view-logo">FAS</div>
        </div>
        <h1>Agri Input Information System (AIIS)</h1>
      </div>

      <div className="view-product-content">
        <div className="view-info-grid">
          <div className="view-info-column">
            <div className="view-info-group">
              <label>NAME OF THE MANUFACTURER</label>
              <p>{product.manufacturer || 'FRONTLINE AGRI SCIENCE'}</p>
              <small>{product.manufacturerAddress || 'Gill Patti Nehian Wale Road, Tehsil Goniana, District Bathinda, Punjab, India (151201)'}</small>
            </div>

            <div className="view-info-group">
              <label>NAME OF THE PRODUCT</label>
              <p>{product.name}</p>
            </div>

            <div className="view-info-group">
              <label>BATCH NUMBER</label>
              <p>{product.batch}</p>
            </div>

            <div className="view-info-group">
              <label>EXPIRY DATE</label>
              <p>{product.expiry}</p>
            </div>

            <div className="view-info-group">
              <label>MANUFACTURER LICENCE NO.</label>
              <p>{product.manufacturerLicence || 'PB/AGRI/PP/2021/4'}</p>
            </div>

            <div className="view-info-group">
              <label>CAUTIONARY SYMBOL AS PER THE TOXICITY CLASSIFICATION</label>
              <div className="safety-symbol">
                <div className="symbol-yellow">⚠️</div>
                <p>YELLOW</p>
              </div>
            </div>

            <div className="view-info-group">
              <label>LEAFLETS INFORMATION</label>
              <p><a href="#">CLICK TO VIEW INFORMATION</a></p>
            </div>
          </div>

          <div className="view-info-column">
            <div className="view-info-group">
              <label>UNIQUE PRODUCT IDENTIFICATION NUMBER</label>
              <p>{product.uniqueId}</p>
            </div>

            <div className="view-info-group">
              <label>TECHNICAL NAME</label>
              <p>{product.technicalName || 'Emamectin Benzoate 5% SG'}</p>
            </div>

            <div className="view-info-group">
              <label>MANUFACTURING DATE</label>
              <p>{product.mfg}</p>
            </div>

            <div className="view-info-group">
              <label>REGISTRATION NUMBER</label>
              <p>{product.registrationNumber || 'CIR-1B7889/2021-Emamectin Benzoate (SG) (4325)-2288'}</p>
            </div>

            <div className="view-info-group">
              <label>PACKING SIZE</label>
              <p>{product.packingSize || '1 KG'}</p>
            </div>

            <div className="view-info-group">
              <label>CUSTOMER CARE CONTACT DETAILS</label>
              <div className="contact-details">
                <p><strong>🏢</strong> Industrial Area,Gill Patti - Nehian Wale Road, Tehsil Goniana, District Bathinda, Punjab, India (151201)</p>
                <p><strong>📞</strong> 7609064394</p>
                <p><strong>📧</strong> <a href="mailto:frontlineasrscience@gmail.com">frontlineagrisciencia@gmail.com</a></p>
                <p><strong>🌐</strong> <a href="#">https://frontlineagrisciencia.de/</a></p>
                <div className="social-links">
                  <a href="#" className="fb-btn">Facebook</a>
                  <a href="#" className="ig-btn">Instagram</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="view-footer">
        <p>Developed by <strong>Webbird Solutions</strong></p>
      </div>
    </div>
  );
};

export default ViewProduct;
