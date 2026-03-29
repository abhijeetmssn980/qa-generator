import React, { useState, useRef } from 'react';
import { apiCreateUser, apiUploadLogo } from '../services/api';
import type { UserRole } from '../services/api';

interface ManageUsersProps {
  adminCompanyName?: string;
}

const ManageUsers: React.FC<ManageUsersProps> = ({ adminCompanyName }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState(adminCompanyName || '');
  const [companyLogo, setCompanyLogo] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to server
    setLogoUploading(true);
    try {
      const { url } = await apiUploadLogo(file);
      setCompanyLogo(url);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Logo upload failed' });
      setLogoPreview(null);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email || !password) {
      setMessage({ type: 'error', text: 'Email and password are required.' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    try {
      const result = await apiCreateUser(email, password, companyName || undefined, companyLogo || undefined, companyAddress || undefined, role);
      setMessage({ type: 'success', text: `User "${result.user.email}" created as ${role}!` });
      // Reset form
      setEmail('');
      setPassword('');
      setCompanyLogo('');
      setCompanyAddress('');
      setLogoPreview(null);
      setRole('viewer');
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Keep companyName pre-filled
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create user.' });
    } finally {
      setLoading(false);
    }
  };

  const roleDescriptions: Record<UserRole, string> = {
    admin: 'Full access — manage users, bulk upload, add/edit/delete products',
    editor: 'Can add, edit, and delete products',
    viewer: 'View-only — can only browse existing products',
  };

  return (
    <div className="manage-users-page">
      <h2 style={{ marginBottom: '8px', color: '#1e293b' }}>Create New User</h2>
      <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
        Add a new user account with specific permissions.
      </p>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: message.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            fontSize: '14px',
          }}
        >
          {message.type === 'success' ? '✅ ' : '❌ '}
          {message.text}
        </div>
      )}

      <form className="add-product-form" onSubmit={handleCreateUser}>
        <div className="form-grid">
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
          </div>

          {/* Role Selection */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>User Role *</label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
              {(['viewer', 'editor', 'admin'] as UserRole[]).map((r) => (
                <label
                  key={r}
                  style={{
                    flex: '1',
                    minWidth: '160px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: role === r ? '2px solid #4f46e5' : '2px solid #e2e8f0',
                    background: role === r ? '#eef2ff' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, textTransform: 'capitalize', color: '#1e293b', fontSize: '14px' }}>
                      {r === 'viewer' ? '👁️ Viewer' : r === 'editor' ? '✏️ Editor' : '🔑 Admin'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {roleDescriptions[r]}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company Name"
            />
          </div>
          <div className="form-group">
            <label>Company Logo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoSelect}
                style={{ flex: 1 }}
              />
              {logoUploading && <span style={{ fontSize: '13px', color: '#6366f1' }}>⏳ Uploading...</span>}
              {logoPreview && !logoUploading && (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  style={{
                    width: '40px',
                    height: '40px',
                    objectFit: 'contain',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                  }}
                />
              )}
            </div>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Company Address</label>
            <input
              type="text"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="Full address"
            />
          </div>
        </div>

        <div style={{ marginTop: '24px' }}>
          <button type="submit" className="primary-btn" disabled={loading || logoUploading}>
            {loading ? '⏳ Creating...' : '➕ Create User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManageUsers;
