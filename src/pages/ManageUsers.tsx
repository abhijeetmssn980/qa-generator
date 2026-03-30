import React, { useState, useEffect } from 'react';
import { apiCreateUser, apiGetAllCompanies } from '../services/api';
import type { UserRole, Company } from '../services/api';

interface ManageUsersProps {
  adminCompanyName?: string;
}

const ManageUsers: React.FC<ManageUsersProps> = ({ adminCompanyName }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyId, setCompanyId] = useState<number | string>('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      setCompaniesLoading(true);
      try {
        const data = await apiGetAllCompanies();
        setCompanies(data);
        // Pre-select first company if available
        if (data.length > 0 && adminCompanyName) {
          const adminCompany = data.find(c => c.name === adminCompanyName);
          if (adminCompany?.id) {
            setCompanyId(adminCompany.id);
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch companies:', err.message);
      } finally {
        setCompaniesLoading(false);
      }
    };
    fetchCompanies();
  }, [adminCompanyName]);

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

    if (!companyId) {
      setMessage({ type: 'error', text: 'Please select a company.' });
      return;
    }

    setLoading(true);
    try {
      const finalCompanyId = Number(companyId);

      // Create user linked to company
      const result = await apiCreateUser(
        email,
        password,
        finalCompanyId,
        role
      );
      setMessage({ type: 'success', text: `User "${result.user.email}" created as ${role}!` });
      // Reset form
      setEmail('');
      setPassword('');
      setRole('viewer');
      setCompanyId('');
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
          {/* Company Selection */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Select Company *</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white',
              }}
              disabled={companiesLoading}
              required
            >
              <option value="">-- Select a company --</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            {companiesLoading && <p style={{ fontSize: '13px', color: '#6366f1', marginTop: '4px' }}>Loading companies...</p>}
            {!companiesLoading && companies.length === 0 && (
              <p style={{ fontSize: '13px', color: '#dc2626', marginTop: '4px' }}>No companies available. Create a company first.</p>
            )}
          </div>

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
        </div>

        <div style={{ marginTop: '24px' }}>
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? '⏳ Creating...' : '➕ Create User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManageUsers;
