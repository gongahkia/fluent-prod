# Admin Dashboard

A secure admin interface for managing Firebase data without accessing the Firebase Console directly.

## Access

When running the development server with `./dev.sh`, the admin dashboard is available at:

```
http://localhost:3001/admin/admin.html
```

## Authentication

The dashboard uses Basic HTTP Authentication with credentials stored in `backend/.env`:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password_here
```

**IMPORTANT:** Change the default password before deploying to production!

## Features

### User Management
- **View all users** - Browse complete user list with profiles
- **Search users** - Find users by name or email
- **View user details** - See complete user profile in JSON format
- **Edit user data** - Update user information
- **Delete users** - Remove users and all their associated data

### Dictionary Management
- View Japanese (`dictionary_ja`) and Korean (`dictionary_ko`) entries
- Add new vocabulary entries
- Edit existing entries
- Delete entries
- Filter by language and proficiency level

### Flashcard Management
- View all flashcards for a user
- See progress metrics (correct/incorrect counts, proficiency)
- Delete flashcards

### Saved Posts
- Browse user's saved posts
- View post content and metadata
- Delete saved posts

### Collections
- View vocabulary collections
- See word counts and descriptions
- Delete collections

### Social Connections
- View followers, following, and blocked users
- See connection timestamps

## API Endpoints

All endpoints require Basic Auth and are prefixed with `/api/admin`:

### Users
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/search?q=<query>` - Search users
- `GET /api/admin/users/:userId` - Get user by ID
- `PUT /api/admin/users/:userId` - Update user
- `DELETE /api/admin/users/:userId` - Delete user (and all sub-collections)

### Dictionary
- `GET /api/admin/users/:userId/dictionary/:language` - Get entries (language: `ja` or `ko`)
- `POST /api/admin/users/:userId/dictionary/:language` - Add entry
- `PUT /api/admin/users/:userId/dictionary/:language/:entryId` - Update entry
- `DELETE /api/admin/users/:userId/dictionary/:language/:entryId` - Delete entry

### Flashcards
- `GET /api/admin/users/:userId/flashcards` - Get all flashcards
- `PUT /api/admin/users/:userId/flashcards/:flashcardId` - Update flashcard
- `DELETE /api/admin/users/:userId/flashcards/:flashcardId` - Delete flashcard

### Saved Posts
- `GET /api/admin/users/:userId/saved-posts` - Get saved posts
- `DELETE /api/admin/users/:userId/saved-posts/:postId` - Delete saved post

### Collections
- `GET /api/admin/users/:userId/collections` - Get collections
- `PUT /api/admin/users/:userId/collections/:collectionId` - Update collection
- `DELETE /api/admin/users/:userId/collections/:collectionId` - Delete collection

### Social
- `GET /api/admin/users/:userId/social` - Get following, followers, blocked lists

## Security Notes

1. **Localhost only** - This dashboard is intended for local development use only
2. **Basic Auth** - Uses HTTP Basic Authentication (credentials stored in sessionStorage)
3. **Admin credentials** - Stored in `backend/.env` (never commit real passwords to git)
4. **Firebase Admin SDK** - Uses server-side Firebase Admin SDK with full privileges
5. **No rate limiting on admin routes** - Be careful with bulk operations

## Files

```
backend/
├── middleware/
│   └── adminAuth.js          # Basic Auth middleware
├── routes/
│   └── admin.js              # Admin API routes
├── services/
│   └── adminService.js       # Firestore operations
├── public/
│   └── admin.html            # Dashboard UI
└── .env                      # Admin credentials
```

## Troubleshooting

### Authentication Loop
If you're stuck in an authentication loop:
1. Clear sessionStorage in browser DevTools
2. Refresh the page
3. Enter correct credentials

### 401 Unauthorized
Check that:
1. `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set in `backend/.env`
2. You're entering the correct credentials
3. The backend server is running

### Firebase Errors
Ensure Firebase Admin SDK is properly initialized:
1. Check `backend/.env` has Firebase credentials
2. Verify Firebase project ID is correct
3. Check backend logs for initialization errors

## Development

To test the admin dashboard locally:

```bash
# Start the dev server
./dev.sh

# Access the dashboard
# Browser will prompt for username/password
open http://localhost:3001/admin/admin.html
```

## Production Deployment

**DO NOT deploy this dashboard to production** without:

1. Implementing proper authentication (OAuth, JWT, etc.)
2. Adding HTTPS/TLS encryption
3. Implementing role-based access control (RBAC)
4. Adding audit logging for all admin actions
5. Setting up IP whitelisting
6. Implementing rate limiting on admin endpoints

For production, consider using Firebase Console directly or building a more secure admin interface.
