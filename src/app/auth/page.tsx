'use client';

// Success Class - Auth Page
// Simple token input page with glass card UI

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setAuthToken, clearSession } from '@/state/session.store';
import { Key, Trash2 } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setError('Please enter an access token');
      return;
    }
    
    // Save token and redirect
    setAuthToken(token.trim());
    router.push('/');
  };

  const handleClear = () => {
    clearSession();
    setToken('');
    setError('');
  };

  return (
    <main className="sc-auth-page">
      <div className="sc-auth-card">
        <div className="sc-auth-icon">
          <Key size={48} />
        </div>
        
        <h1 className="sc-auth-title">Success Class</h1>
        <p className="sc-auth-subtitle">Enter your API access token to continue</p>
        
        <form onSubmit={handleSubmit} className="sc-auth-form">
          <div className="sc-field">
            <label className="sc-label" htmlFor="token">
              Access Token / API Key
            </label>
            <input
              id="token"
              type="password"
              className="sc-input"
              placeholder="sk-..."
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setError('');
              }}
              autoComplete="off"
            />
            {error && <span className="sc-error">{error}</span>}
          </div>
          
          <button type="submit" className="sc-btn-primary">
            Continue
          </button>
        </form>
        
        <button
          className="sc-clear-btn"
          onClick={handleClear}
          type="button"
        >
          <Trash2 size={16} />
          Clear Session (Debug)
        </button>
        
        <p className="sc-auth-hint">
          💡 Your token is stored locally and never sent to our servers.
          <br />
          You can use placeholder keys for testing.
        </p>
      </div>
    </main>
  );
}
