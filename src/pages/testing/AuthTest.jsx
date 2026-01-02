import React, { useState } from 'react';
import {
  registerWithEmail,
  signInWithEmail,
  signOutUser,
  resetPassword,
  signInWithGoogle
} from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthTest() {
  const { currentUser, userProfile, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const displayResult = (res, operation) => {
    const formatted = JSON.stringify(res, null, 2);
    const timestamp = new Date().toLocaleTimeString();
    setResult(`[${timestamp}] ${operation}\n\n${formatted}`);
  };

  const testSignup = async () => {
    if (!email || !password || !name) {
      setResult('❌ Please fill in all fields (email, password, name)');
      return;
    }
    setIsLoading(true);
    setResult('⏳ Testing signup...');
    try {
      const res = await registerWithEmail(email, password, name);
      displayResult(res, 'SIGNUP');
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    }
    setIsLoading(false);
  };

  const testLogin = async () => {
    if (!email || !password) {
      setResult('❌ Please fill in email and password');
      return;
    }
    setIsLoading(true);
    setResult('⏳ Testing login...');
    try {
      const res = await signInWithEmail(email, password);
      displayResult(res, 'LOGIN');
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    }
    setIsLoading(false);
  };

  const testLogout = async () => {
    setIsLoading(true);
    setResult('⏳ Testing logout...');
    try {
      const res = await signOutUser();
      displayResult(res, 'LOGOUT');
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    }
    setIsLoading(false);
  };

  const testPasswordReset = async () => {
    if (!email) {
      setResult('❌ Please enter email address');
      return;
    }
    setIsLoading(true);
    setResult('⏳ Testing password reset...');
    try {
      const res = await resetPassword(email);
      displayResult(res, 'PASSWORD RESET');
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    }
    setIsLoading(false);
  };

  const testGoogleLogin = async () => {
    setIsLoading(true);
    setResult('⏳ Testing Google OAuth login...');
    try {
      const res = await signInWithGoogle();
      displayResult(res, 'GOOGLE LOGIN');
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    }
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading auth context...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🔐 Firebase Auth Testing</h1>
        <p style={styles.subtitle}>Test authentication and user management</p>
      </div>

      <div style={styles.statusCard}>
        <h3 style={styles.sectionTitle}>📊 Current Auth State</h3>
        <div style={styles.statusGrid}>
          <div style={styles.statusItem}>
            <strong>Status:</strong>
            <span style={currentUser ? styles.statusOnline : styles.statusOffline}>
              {currentUser ? '🟢 Logged In' : '🔴 Logged Out'}
            </span>
          </div>
          {currentUser && (
            <>
              <div style={styles.statusItem}>
                <strong>User ID:</strong>
                <code style={styles.code}>{currentUser.id}</code>
              </div>
              <div style={styles.statusItem}>
                <strong>Email:</strong>
                <span>{currentUser.email}</span>
              </div>
              <div style={styles.statusItem}>
                <strong>Email Verified:</strong>
                <span>{currentUser.email_confirmed_at ? '✅ Yes' : '❌ No'}</span>
              </div>
            </>
          )}
        </div>

        {userProfile && (
          <details style={styles.details}>
            <summary style={styles.summary}>View Full Profile Data</summary>
            <pre style={styles.pre}>{JSON.stringify(userProfile, null, 2)}</pre>
          </details>
        )}
      </div>

      <div style={styles.testCard}>
        <h3 style={styles.sectionTitle}>🧪 Test Controls</h3>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Email:</label>
          <input
            type="email"
            placeholder="test@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            disabled={isLoading}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Password:</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            disabled={isLoading}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Display Name (for signup):</label>
          <input
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            disabled={isLoading}
          />
        </div>

        <div style={styles.buttonGrid}>
          <button onClick={testSignup} style={styles.buttonPrimary} disabled={isLoading}>
            📝 Test Signup
          </button>
          <button onClick={testLogin} style={styles.buttonSuccess} disabled={isLoading}>
            🔑 Test Login
          </button>
          <button onClick={testLogout} style={styles.buttonWarning} disabled={isLoading}>
            🚪 Test Logout
          </button>
          <button onClick={testPasswordReset} style={styles.buttonInfo} disabled={isLoading}>
            🔄 Test Password Reset
          </button>
          <button onClick={testGoogleLogin} style={styles.buttonGoogle} disabled={isLoading}>
            🔵 Test Google Login
          </button>
        </div>
      </div>

      {result && (
        <div style={styles.resultCard}>
          <div style={styles.resultHeader}>
            <h3 style={styles.sectionTitle}>📋 Test Result</h3>
            <button onClick={() => setResult('')} style={styles.clearButton}>Clear</button>
          </div>
          <pre style={styles.resultPre}>{result}</pre>
        </div>
      )}

      <div style={styles.instructionsCard}>
        <h3 style={styles.sectionTitle}>📖 Testing Instructions</h3>
        <ol style={styles.list}>
          <li>Fill in email, password, and name fields</li>
          <li>Click "Test Signup" to create a new account</li>
          <li>Check Firebase Console → Authentication to verify user was created</li>
          <li>Check Firebase Console → Firestore Database for user data</li>
          <li>Click "Test Logout" to sign out</li>
          <li>Click "Test Login" to sign back in</li>
          <li>Test "Password Reset" (check your email)</li>
          <li>Test "Google Login" (OAuth flow)</li>
        </ol>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
  },
  statusCard: {
    background: '#f8f9fa',
    border: '2px solid #dee2e6',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  },
  testCard: {
    background: '#fff',
    border: '2px solid #dee2e6',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  },
  resultCard: {
    background: '#1e1e1e',
    border: '2px solid #333',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  },
  instructionsCard: {
    background: '#e7f5ff',
    border: '2px solid #339af0',
    borderRadius: '8px',
    padding: '20px',
  },
  sectionTitle: {
    margin: '0 0 15px 0',
    fontSize: '18px',
    fontWeight: '600',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
  },
  statusItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  statusOnline: {
    color: '#2b8a3e',
    fontWeight: '600',
  },
  statusOffline: {
    color: '#c92a2a',
    fontWeight: '600',
  },
  code: {
    background: '#f1f3f5',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
  },
  details: {
    marginTop: '15px',
  },
  summary: {
    cursor: 'pointer',
    padding: '8px',
    background: '#e9ecef',
    borderRadius: '4px',
    fontWeight: '600',
  },
  pre: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '4px',
    overflow: 'auto',
    fontSize: '12px',
    fontFamily: 'monospace',
    margin: '10px 0 0 0',
  },
  inputGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '600',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '2px solid #dee2e6',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  buttonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
    marginTop: '20px',
  },
  buttonPrimary: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    background: '#4c6ef5',
    color: 'white',
  },
  buttonSuccess: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    background: '#2b8a3e',
    color: 'white',
  },
  buttonWarning: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    background: '#e67700',
    color: 'white',
  },
  buttonInfo: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    background: '#1c7ed6',
    color: 'white',
  },
  buttonGoogle: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    background: '#4285f4',
    color: 'white',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  clearButton: {
    padding: '6px 12px',
    background: '#333',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  resultPre: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: '12px',
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  list: {
    paddingLeft: '20px',
    lineHeight: '1.8',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666',
  },
};
