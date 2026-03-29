import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

type AddProductProps = {
  onProductAdded?: (product: any) => void;
};

const AddProduct: React.FC<AddProductProps> = ({ onProductAdded }) => {
  const [form, setForm] = useState({
    name: '',
    batch: '',
    manufacturer: '',
    expiry: '',
    packing: '',
    manufacturerAddress: '',
    technicalName: '',
    registrationNumber: '',
    manufacturerLicence: '',
    imageUrl: '',
    hazardSymbol: '',
  });
  const [addedProduct, setAddedProduct] = useState<any>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Generate a unique ID based on timestamp
    const uniqueId = Date.now().toString();
    const product = {
      id: uniqueId,
      uniqueId: uniqueId,
      name: form.name,
      batch: form.batch,
      mfg: form.manufacturer,
      expiry: form.expiry,
      shortUrl: `qr-1.in/a.php?x=${uniqueId}`,
      manufacturer: form.manufacturer || '',
      manufacturerAddress: form.manufacturerAddress || '',
      technicalName: form.technicalName || '',
      registrationNumber: form.registrationNumber || '',
      packingSize: form.packing,
      manufacturerLicence: form.manufacturerLicence || '',
      imageUrl: form.imageUrl || '',
      hazardSymbol: form.hazardSymbol || '',
    };
    
    setAddedProduct(product);
    if (onProductAdded) {
      onProductAdded(product);
    }
    setForm({ name: '', batch: '', manufacturer: '', expiry: '', packing: '', manufacturerAddress: '', technicalName: '', registrationNumber: '', manufacturerLicence: '', imageUrl: '', hazardSymbol: '' });
  };

  return (
    <div className="add-product-wrapper">
      <div className="add-product-header">
        <h1>Add A New Product</h1>
        <div className="header-actions">
          <button type="button" className="secondary-btn">Products List</button>
          <button type="button" className="primary-btn">Add Extra Product +</button>
        </div>
      </div>
      <div className="content-card">
        <div className="card-section-title">Part I</div>
        <form className="add-product-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>NAME OF THE PRODUCT</label>
              <select name="name" value={form.name} onChange={handleChange}>
                <option value="">--Select--</option>
                <option value="Product A">Product A</option>
                <option value="Product B">Product B</option>
                <option value="Product C">Product C</option>
              </select>
            </div>
            <div className="form-group">
              <label>BATCH NUMBER</label>
              <input name="batch" value={form.batch} onChange={handleChange} placeholder="Enter.." />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>DATE OF MANUFACTURER</label>
              <input name="manufacturer" type="date" value={form.manufacturer} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>PACKING SIZE</label>
              <input name="packing" value={form.packing} onChange={handleChange} placeholder="Enter.." />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group single">
              <label>EXPIRY DATE</label>
              <input name="expiry" type="date" value={form.expiry} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group single">
              <label>PRODUCT IMAGE URL</label>
              <input name="imageUrl" type="url" value={form.imageUrl} onChange={handleChange} placeholder="https://example.com/image.jpg" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group single">
              <label>HAZARD SYMBOL</label>
              <select name="hazardSymbol" value={form.hazardSymbol} onChange={handleChange}>
                <option value="">--Select--</option>
                <option value="☠️ Toxic">☠️ Toxic</option>
                <option value="⚠️ Health Hazard">⚠️ Health Hazard</option>
                <option value="🧪 Irritant">🧪 Irritant</option>
                <option value="🔥 Flammable">🔥 Flammable</option>
                <option value="⚛️ Reactive">⚛️ Reactive</option>
                <option value="🌍 Environmental">🌍 Environmental</option>
              </select>
            </div>
          </div>

          <button type="submit" className="submit-btn">Submit</button>
        </form>
        
        {addedProduct && (
          <div className="qr-code-section" style={{ marginTop: '32px', padding: '24px', backgroundColor: '#f8fafb', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, color: '#222' }}>Product Added Successfully!</h3>
            <p style={{ color: '#666', marginBottom: '16px' }}>Share this QR Code with customers to view product details:</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <QRCodeSVG 
                value={`product/${addedProduct.uniqueId}`}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
            <p style={{ color: '#888', fontSize: '0.9rem' }}><strong>Product ID:</strong> {addedProduct.uniqueId}</p>
            <button 
              type="button"
              className="primary-btn"
              onClick={() => setAddedProduct(null)}
              style={{ marginTop: '12px' }}
            >
              Add Another Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddProduct;
