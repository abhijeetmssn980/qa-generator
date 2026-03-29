import React from 'react';
import type { Product } from '../services/database';

interface ProductsListProps {
  products: Product[];
  goAdd: () => void;
  onView: (product: Product) => void;
}

const ProductsList: React.FC<ProductsListProps> = ({ products, goAdd, onView }) => {
  return (
    <div className="products-list-page">
      <div className="products-list-header">
        <h1>Product List</h1>
        <div className="products-list-actions">
          <button className="export-btn">Export</button>
          <button className="primary-btn" onClick={goAdd}>Add Product +</button>
        </div>
      </div>

      <div className="products-table-card">
        <div className="table-top">
          <label>
            Show
            <select defaultValue="10">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            entries
          </label>
          <input className="search-input" placeholder="Search" />
        </div>
        <div style={{overflowX: 'auto', width: '100%', flex: 1}}>
          <table className="products-table" style={{minWidth: '1100px'}}>
            <thead>
              <tr>
                <th>S.N.</th>
                <th>Unique Id</th>
                <th>Product Name</th>
                <th>Batch Number</th>
                <th>Manufacturing Date</th>
                <th>Expiry Date</th>
                <th>Short Url</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.uniqueId}</td>
                  <td>{product.name}</td>
                  <td>{product.batch}</td>
                  <td>{product.mfg}</td>
                  <td>{product.expiry}</td>
                  <td>
                    {product.shortUrl} <button className="icon-btn copy">Copy</button>
                  </td>
                  <td>
                    <button className="icon-btn view" onClick={() => onView(product)}>View</button>
                    <button className="icon-btn edit">Edit</button>
                    <button className="icon-btn delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductsList;
