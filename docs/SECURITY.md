# Security Implementation

This document explains the security measures implemented for protecting user data, especially sensitive API credentials.

## 🔐 Encryption Overview

### What Gets Encrypted

The following sensitive data is **encrypted before storage** in Firebase Firestore:

1. **Twitter API Bearer Token**
2. **Instagram Username**
3. **Instagram Password**
4. **Gemini AI API Key**

### What's NOT Encrypted

Regular user data (stored in plaintext in Firestore):
- Name, email, bio
- Learning preferences
- Settings (notifications, privacy, appearance)
- Dictionary words
- Flashcard progress

These don't require encryption because:
- They're not sensitive credentials
- Firestore security rules prevent unauthorized access
- Users can only access their own data

## 🛡️ Encryption Method

### Algorithm: AES-GCM 256-bit

**Why AES-GCM?**
- Industry standard for authenticated encryption
- Provides both confidentiality and integrity
- Resistant to tampering
- Built into Web Crypto API (no external dependencies)

**Key Derivation:**
- Uses PBKDF2 with 100,000 iterations
- Derives unique encryption key from user's Firebase auth token
- Each user has their own encryption key
- Key is never stored - regenerated from auth token each time

### Implementation Details

```javascript
// Client-side encryption (src/services/encryptionService.js)

1. User signs in → Gets Firebase auth token
2. Token → PBKDF2 (100k iterations) → Encryption key
3. Data + Key → AES-GCM encryption → Encrypted data
4. Encrypted data → Base64 → Stored in Firestore

// Decryption works in reverse:
1. Fetch encrypted data from Firestore
2. Get auth token → Derive encryption key
3. Encrypted data + Key → AES-GCM decryption → Original data
```

## 🔒 Security Layers

### Layer 1: Firebase Authentication
- Users must be authenticated to access any data
- JWT tokens for session management
- Automatic token refresh

### Layer 2: Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can ONLY access their own data
      allow read, write: if request.auth != null
                        && request.auth.uid == userId;
    }
  }
}
```

### Layer 3: Client-Side Encryption
- Sensitive credentials encrypted before upload
- Encryption key derived from user's auth token
- Key never leaves the client
- Even if Firestore is compromised, data is unreadable

### Layer 4: HTTPS/TLS
- All communication encrypted in transit
- Firebase enforces HTTPS

## 📊 Data Flow

### Saving Credentials (Profile Settings)

```
User enters API key
       ↓
Gets Firebase auth token
       ↓
PBKDF2 derives encryption key
       ↓
AES-GCM encrypts data
       ↓
Base64 encoding
       ↓
Stored in Firestore: users/{uid}/credentials
       ↓
Also saved to sessionStorage (plaintext, for current session only)
```

### Loading Credentials

```
Page loads
       ↓
Gets Firebase auth token
       ↓
Fetches encrypted data from Firestore
       ↓
PBKDF2 derives decryption key
       ↓
AES-GCM decrypts data
       ↓
Displayed in UI + saved to sessionStorage
```

## 🔑 Key Management

### Key Generation
- **No hardcoded keys** - All keys derived dynamically
- **User-specific** - Each user has unique encryption key
- **Token-based** - Key derived from Firebase auth token
- **Ephemeral** - Key only exists in memory during operation

### Key Rotation
- When user's auth token refreshes (automatic), key is re-derived
- Old encrypted data remains compatible (uses same token-based derivation)
- No manual key rotation needed

## 🚨 Threat Model

### What We Protect Against

✅ **Database Breach**
- Even if someone gains access to Firestore, encrypted credentials are unreadable
- Attacker would need both encrypted data AND user's Firebase auth token

✅ **Man-in-the-Middle**
- All traffic encrypted with HTTPS/TLS
- Firebase enforces secure connections

✅ **Unauthorized Access**
- Firestore rules prevent users from accessing other users' data
- Authentication required for all operations

✅ **Browser Cache/Storage Leaks**
- Credentials stored encrypted in Firestore
- SessionStorage cleared on logout
- LocalStorage not used for sensitive data

### What We DON'T Protect Against

❌ **Client-Side XSS**
- If attacker runs JavaScript in user's browser, they can access decrypted data
- **Mitigation**: Use Content Security Policy, sanitize all inputs

❌ **Compromised User Device**
- If user's device is compromised, attacker can steal auth token
- **Mitigation**: Users should use secure devices, enable 2FA (future feature)

❌ **User Phishing**
- If user gives credentials to attacker
- **Mitigation**: User education, never ask for passwords outside app

## 📝 Best Practices Followed

### Industry Standards

✅ **AES-256-GCM** - NIST recommended encryption
✅ **PBKDF2** - NIST recommended key derivation
✅ **100,000 iterations** - OWASP recommended minimum
✅ **Random IV** - New IV for each encryption operation
✅ **Authenticated encryption** - GCM mode provides integrity check
✅ **No password storage** - Instagram credentials encrypted, not hashed
✅ **Principle of least privilege** - Users only access their own data
✅ **Defense in depth** - Multiple security layers

### Code Security

✅ **No hardcoded secrets** - All config in environment variables
✅ **Error handling** - Graceful failure, no sensitive data in errors
✅ **Input validation** - All user inputs validated
✅ **Secure defaults** - All security features enabled by default

## 🔍 Audit & Compliance

### What's Logged
- Authentication events (login/logout)
- Profile updates
- Data access (Firestore automatically logs)

### What's NOT Logged
- Decrypted credentials
- Encryption keys
- User passwords

### GDPR Compliance
- Users can delete their account (future feature)
- Data is user-owned and isolated
- Clear privacy policy in app
- Users control their data

## 🛠️ For Developers

### Adding New Sensitive Fields

To add a new sensitive field that needs encryption:

```javascript
// 1. Add to encryption in Profile.jsx
const credentials = {
  twitterBearerToken: formData.twitterBearerToken,
  newSensitiveField: formData.newSensitiveField, // Add here
}

// 2. Encrypt it
const encryptedCreds = await encryptCredentials(credentials, token)

// 3. That's it! Decryption is automatic
```

### Testing Encryption

```javascript
import { encryptData, decryptData } from '@/services/encryptionService'

// Test
const token = await user.getIdToken()
const encrypted = await encryptData("secret", token)
const decrypted = await decryptData(encrypted, token)

console.log(decrypted === "secret") // true
```

### Common Pitfalls

❌ **Don't store encryption key**
```javascript
// Bad
const key = deriveKey(token)
localStorage.setItem('key', key) // Never do this!
```

❌ **Don't log decrypted data**
```javascript
// Bad
const decrypted = await decryptData(encrypted, token)
console.log(decrypted) // Don't log sensitive data
```

✅ **Do derive key on-demand**
```javascript
// Good
const token = await user.getIdToken()
const key = await deriveKey(token) // Derive when needed
// Use key
// Key discarded after use
```

## 🔮 Future Enhancements

### Planned Security Features
- [ ] Two-factor authentication (2FA)
- [ ] Session timeout and auto-logout
- [ ] Account activity log
- [ ] Password strength meter
- [ ] Rate limiting on auth attempts
- [ ] Email verification for new accounts
- [ ] Backup codes for account recovery
- [ ] Data export/import with encryption

### Advanced Security (Optional)
- [ ] Hardware security key support (WebAuthn)
- [ ] Biometric authentication (fingerprint/face)
- [ ] End-to-end encryption for messages (if messaging feature added)
- [ ] Certificate pinning for mobile app

## 📚 References

- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [NIST Encryption Standards](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines)
- [OWASP Security Cheat Sheet](https://cheatsheetseries.owasp.org/)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [AES-GCM Specification](https://csrc.nist.gov/publications/detail/sp/800-38d/final)

## 🆘 Security Concerns?

If you discover a security vulnerability:
1. **DO NOT** open a public issue
2. Email security concerns privately
3. Wait for response before disclosure
4. Responsible disclosure appreciated

---

**Bottom line: Your sensitive API credentials are encrypted using industry-standard AES-256-GCM before being stored in Firebase. Even in a database breach scenario, your credentials remain protected.** 🔐
