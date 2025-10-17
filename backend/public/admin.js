const API_BASE = '/api/admin';
let currentUser = null;
let allUsers = [];

function checkAuth() {
  const credentials = sessionStorage.getItem('adminAuth');
  if (!credentials) {
    const username = prompt('Admin Username:');
    const password = prompt('Admin Password:');
    if (username && password) {
      const encoded = btoa(username + ':' + password);
      sessionStorage.setItem('adminAuth', encoded);
    }
  }
}

function getAuthHeader() {
  const encoded = sessionStorage.getItem('adminAuth');
  return { 'Authorization': 'Basic ' + encoded };
}

async function apiRequest(url, options) {
  options = options || {};
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: Object.assign({}, getAuthHeader(), {
        'Content-Type': 'application/json'
      }, options.headers || {}),
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (response.status === 401) {
      sessionStorage.removeItem('adminAuth');
      alert('Authentication failed. Please refresh the page.');
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    alert('Error: ' + error.message);
    return null;
  }
}

async function loadAllUsers() {
  document.getElementById('contentSection').innerHTML = '<p>Loading users...</p>';
  const response = await apiRequest(API_BASE + '/users');
  if (response && response.success) {
    allUsers = response.data;
    displayUsers(allUsers);
  }
}

async function searchUsers() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) {
    alert('Please enter a search query');
    return;
  }
  document.getElementById('contentSection').innerHTML = '<p>Searching...</p>';
  const response = await apiRequest(API_BASE + '/users/search?q=' + encodeURIComponent(query));
  if (response && response.success) {
    allUsers = response.data;
    displayUsers(allUsers);
  }
}

function displayUsers(users) {
  if (users.length === 0) {
    document.getElementById('contentSection').innerHTML = '<p>No users found</p>';
    return;
  }

  let html = '<h3>Found ' + users.length + ' user(s)</h3>';
  users.forEach(function(user) {
    html += '<div class="user-card" data-userid="' + user.id + '">';
    html += '<strong>' + (user.name || 'No Name') + '</strong><br>';
    html += user.email || 'No Email';
    html += '<br>Level: ' + (user.level || 1) + ' | Target: ' + (user.targetLanguage || 'N/A');
    html += ' | Followers: ' + (user.followersCount || 0) + ' | Following: ' + (user.followingCount || 0);
    html += '</div>';
  });

  document.getElementById('contentSection').innerHTML = html;

  // Add click handlers to user cards
  document.querySelectorAll('.user-card').forEach(function(card) {
    card.addEventListener('click', function() {
      selectUser(this.getAttribute('data-userid'));
    });
  });
}

async function selectUser(userId) {
  currentUser = userId;
  document.getElementById('contentSection').innerHTML = '<p>Loading all user data...</p>';

  // Load all data concurrently
  const [userRes, dictJaRes, dictKoRes, flashcardsRes, postsRes, collectionsRes, socialRes] = await Promise.all([
    apiRequest(API_BASE + '/users/' + userId),
    apiRequest(API_BASE + '/users/' + userId + '/dictionary/ja'),
    apiRequest(API_BASE + '/users/' + userId + '/dictionary/ko'),
    apiRequest(API_BASE + '/users/' + userId + '/flashcards'),
    apiRequest(API_BASE + '/users/' + userId + '/saved-posts'),
    apiRequest(API_BASE + '/users/' + userId + '/collections'),
    apiRequest(API_BASE + '/users/' + userId + '/social')
  ]);

  const user = userRes && userRes.success ? userRes.data : null;
  const dictJa = dictJaRes && dictJaRes.success ? dictJaRes.data : [];
  const dictKo = dictKoRes && dictKoRes.success ? dictKoRes.data : [];
  const flashcards = flashcardsRes && flashcardsRes.success ? flashcardsRes.data : [];
  const posts = postsRes && postsRes.success ? postsRes.data : [];
  const collections = collectionsRes && collectionsRes.success ? collectionsRes.data : [];
  const social = socialRes && socialRes.success ? socialRes.data : { following: [], followers: [], blocked: [] };

  if (!user) {
    document.getElementById('contentSection').innerHTML = '<p>Error loading user data</p>';
    return;
  }

  displayCompleteUserView(user, dictJa, dictKo, flashcards, posts, collections, social);
}

function displayCompleteUserView(user, dictJa, dictKo, flashcards, posts, collections, social) {
  let html = '<div style="max-width: 1200px;">';

  // User Profile Section
  html += renderUserProfile(user);
  html += '<hr style="margin: 30px 0;">';

  // Dictionary Section
  html += '<h2>Dictionary</h2>';
  html += '<h4>Japanese (' + dictJa.length + ')</h4>';
  html += renderDictionaryTable(user.id, 'ja', dictJa);
  html += '<h4>Korean (' + dictKo.length + ')</h4>';
  html += renderDictionaryTable(user.id, 'ko', dictKo);
  html += '<hr style="margin: 30px 0;">';

  // Flashcards Section
  html += '<h2>Flashcards (' + flashcards.length + ')</h2>';
  html += renderFlashcardsTable(user.id, flashcards);
  html += '<hr style="margin: 30px 0;">';

  // Saved Posts Section
  html += '<h2>Saved Posts (' + posts.length + ')</h2>';
  html += renderSavedPostsList(user.id, posts);
  html += '<hr style="margin: 30px 0;">';

  // Collections Section
  html += '<h2>Collections (' + collections.length + ')</h2>';
  html += renderCollectionsTable(user.id, collections);
  html += '<hr style="margin: 30px 0;">';

  // Social Connections Section
  html += '<h2>Social Connections</h2>';
  html += renderSocialConnections(user.id, social);

  html += '</div>';

  document.getElementById('contentSection').innerHTML = html;
  attachAllEventHandlers(user.id);
}

function renderUserProfile(user) {
  const simpleFields = ['name', 'email', 'bio', 'location', 'website', 'bannerImage', 'level', 'targetLanguage', 'followersCount', 'followingCount'];
  const complexFields = ['settings', 'reddit', 'credentials'];

  let html = '<h2>User Profile - ' + (user.name || 'No Name') + '</h2>';
  html += '<form id="userProfileForm">';
  html += '<h4>Basic Information</h4>';

  simpleFields.forEach(function(field) {
    const value = user[field] !== undefined ? user[field] : '';
    html += '<div style="margin: 10px 0;">';
    html += '<label style="display: inline-block; width: 150px;"><strong>' + field + ':</strong></label>';
    html += '<input type="text" name="' + field + '" value="' + escapeHtml(String(value)) + '" style="width: 400px;">';
    html += '</div>';
  });

  html += '<h4>Complex Data (JSON)</h4>';
  complexFields.forEach(function(field) {
    if (user[field]) {
      html += '<div style="margin: 10px 0;">';
      html += '<label><strong>' + field + ':</strong></label><br>';
      html += '<textarea name="' + field + '" rows="10" style="width: 100%; font-family: monospace;">';
      html += escapeHtml(JSON.stringify(user[field], null, 2));
      html += '</textarea>';
      html += '</div>';
    }
  });

  html += '<div style="margin: 20px 0;">';
  html += '<button type="button" id="saveUserBtn" data-userid="' + user.id + '">Save Changes</button>';
  html += '<button type="button" class="delete-user-btn" data-userid="' + user.id + '" style="margin-left: 10px;">Delete User</button>';
  html += '</div>';
  html += '</form>';

  return html;
}

function renderDictionaryTable(userId, lang, entries) {
  if (entries.length === 0) return '<p>No entries found</p>';

  const isJapanese = lang === 'ja';
  let html = '<table><thead><tr>';
  html += '<th>English</th>';
  html += '<th>' + (isJapanese ? 'Japanese' : 'Korean') + '</th>';
  html += '<th>' + (isJapanese ? 'Hiragana' : 'Romanization') + '</th>';
  html += '<th>Level</th>';
  html += '<th>Actions</th>';
  html += '</tr></thead><tbody>';

  entries.forEach(function(entry) {
    html += '<tr>';
    html += '<td>' + escapeHtml(entry.english || 'N/A') + '</td>';
    html += '<td>' + escapeHtml(entry[isJapanese ? 'japanese' : 'korean'] || 'N/A') + '</td>';
    html += '<td>' + escapeHtml(entry[isJapanese ? 'hiragana' : 'romanization'] || 'N/A') + '</td>';
    html += '<td>' + (entry.level || 1) + '</td>';
    html += '<td><button class="delete-dict-btn" data-userid="' + userId + '" data-lang="' + lang + '" data-entryid="' + entry.id + '">Delete</button></td>';
    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
}

function renderFlashcardsTable(userId, flashcards) {
  if (flashcards.length === 0) return '<p>No flashcards found</p>';

  let html = '<table><thead><tr>';
  html += '<th>ID</th><th>Correct</th><th>Incorrect</th><th>Proficiency</th><th>Last Reviewed</th><th>Actions</th>';
  html += '</tr></thead><tbody>';

  flashcards.forEach(function(card) {
    html += '<tr>';
    html += '<td>' + escapeHtml(card.id) + '</td>';
    html += '<td>' + (card.correctCount || 0) + '</td>';
    html += '<td>' + (card.incorrectCount || 0) + '</td>';
    html += '<td>' + (card.proficiency || 0) + '%</td>';
    html += '<td>' + (card.lastReviewed ? new Date(card.lastReviewed.seconds * 1000).toLocaleDateString() : 'Never') + '</td>';
    html += '<td><button class="delete-flashcard-btn" data-userid="' + userId + '" data-cardid="' + card.id + '">Delete</button></td>';
    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
}

function renderSavedPostsList(userId, posts) {
  if (posts.length === 0) return '<p>No saved posts found</p>';

  let html = '<div>';
  posts.forEach(function(post) {
    html += '<div style="border: 1px solid black; padding: 10px; margin: 10px 0;">';
    html += '<strong>' + escapeHtml(post.title || 'No Title') + '</strong><br>';
    html += '<p>' + escapeHtml((post.content || '').substring(0, 200)) + '...</p>';
    html += '<div style="margin-top: 10px;">';
    html += '<label>Source:</label> <input type="text" class="post-source" value="' + escapeHtml(post.source || '') + '" style="width: 200px;">';
    html += '<button class="save-post-btn" data-userid="' + userId + '" data-postid="' + post.id + '" style="margin-left: 10px;">Save Changes</button>';
    html += '<button class="delete-post-btn" data-userid="' + userId + '" data-postid="' + post.id + '" style="margin-left: 10px;">Delete</button>';
    html += '</div>';
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function renderCollectionsTable(userId, collections) {
  if (collections.length === 0) return '<p>No collections found</p>';

  let html = '<table><thead><tr>';
  html += '<th>Name</th><th>Description</th><th>Word Count</th><th>Default</th><th>Actions</th>';
  html += '</tr></thead><tbody>';

  collections.forEach(function(col) {
    html += '<tr>';
    html += '<td>' + escapeHtml(col.name || 'Unnamed') + '</td>';
    html += '<td>' + escapeHtml(col.description || 'No description') + '</td>';
    html += '<td>' + (col.wordIds ? col.wordIds.length : 0) + '</td>';
    html += '<td>' + (col.isDefault ? 'Yes' : '') + '</td>';
    html += '<td><button class="delete-collection-btn" data-userid="' + userId + '" data-colid="' + col.id + '">Delete</button></td>';
    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
}

function renderSocialConnections(userId, social) {
  let html = '<form id="socialForm">';

  html += '<h4>Following (' + social.following.length + ')</h4>';
  if (social.following.length === 0) {
    html += '<p>Not following anyone</p>';
  } else {
    social.following.forEach(function(conn, idx) {
      html += '<div style="margin: 10px 0; padding: 10px; border: 1px solid #ccc;">';
      html += '<label><strong>User ID:</strong></label> ';
      html += '<input type="text" value="' + escapeHtml(conn.userId || conn.id || '') + '" style="width: 300px;" disabled>';
      html += '<br><label><strong>Followed At:</strong></label> ';
      html += '<input type="text" value="' + (conn.followedAt ? new Date(conn.followedAt.seconds * 1000).toLocaleString() : 'N/A') + '" disabled>';
      html += '</div>';
    });
  }

  html += '<h4>Followers (' + social.followers.length + ')</h4>';
  if (social.followers.length === 0) {
    html += '<p>No followers</p>';
  } else {
    social.followers.forEach(function(conn, idx) {
      html += '<div style="margin: 10px 0; padding: 10px; border: 1px solid #ccc;">';
      html += '<label><strong>User ID:</strong></label> ';
      html += '<input type="text" value="' + escapeHtml(conn.userId || conn.id || '') + '" style="width: 300px;" disabled>';
      html += '<br><label><strong>Followed At:</strong></label> ';
      html += '<input type="text" value="' + (conn.followedAt ? new Date(conn.followedAt.seconds * 1000).toLocaleString() : 'N/A') + '" disabled>';
      html += '</div>';
    });
  }

  html += '<h4>Blocked (' + social.blocked.length + ')</h4>';
  if (social.blocked.length === 0) {
    html += '<p>No blocked users</p>';
  } else {
    social.blocked.forEach(function(conn, idx) {
      html += '<div style="margin: 10px 0; padding: 10px; border: 1px solid #ccc;">';
      html += '<label><strong>User ID:</strong></label> ';
      html += '<input type="text" value="' + escapeHtml(conn.userId || conn.id || '') + '" style="width: 300px;" disabled>';
      html += '<br><label><strong>Blocked At:</strong></label> ';
      html += '<input type="text" value="' + (conn.blockedAt ? new Date(conn.blockedAt.seconds * 1000).toLocaleString() : 'N/A') + '" disabled>';
      html += '</div>';
    });
  }

  html += '</form>';
  return html;
}

function attachAllEventHandlers(userId) {
  // User profile save
  const saveBtn = document.getElementById('saveUserBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      saveUserProfile(this.getAttribute('data-userid'));
    });
  }

  // User delete
  document.querySelectorAll('.delete-user-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      deleteUser(this.getAttribute('data-userid'));
    });
  });

  // Dictionary delete
  document.querySelectorAll('.delete-dict-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      deleteDictionaryEntry(
        this.getAttribute('data-userid'),
        this.getAttribute('data-lang'),
        this.getAttribute('data-entryid')
      );
    });
  });

  // Flashcard delete
  document.querySelectorAll('.delete-flashcard-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      deleteFlashcard(this.getAttribute('data-userid'), this.getAttribute('data-cardid'));
    });
  });

  // Post save and delete
  document.querySelectorAll('.save-post-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const postDiv = this.closest('div[style*="border"]');
      const sourceInput = postDiv.querySelector('.post-source');
      savePost(this.getAttribute('data-userid'), this.getAttribute('data-postid'), sourceInput.value);
    });
  });

  document.querySelectorAll('.delete-post-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      deleteSavedPost(this.getAttribute('data-userid'), this.getAttribute('data-postid'));
    });
  });

  // Collection delete
  document.querySelectorAll('.delete-collection-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      deleteCollection(this.getAttribute('data-userid'), this.getAttribute('data-colid'));
    });
  });
}

async function loadAllPosts() {
  document.getElementById('contentSection').innerHTML = '<p>Loading all Japanese and Korean dictionary entries from all users...</p>';

  const response = await apiRequest(API_BASE + '/all-posts');
  if (!response || !response.success) {
    document.getElementById('contentSection').innerHTML = '<p>Error loading dictionary entries</p>';
    return;
  }

  displayAllPosts(response.data);
}

function displayAllPosts(posts) {
  if (posts.length === 0) {
    document.getElementById('contentSection').innerHTML = '<p>No dictionary entries found</p>';
    return;
  }

  // Count by language
  const japaneseCount = posts.filter(p => p.language === 'Japanese').length;
  const koreanCount = posts.filter(p => p.language === 'Korean').length;

  let html = '<h2>All Dictionary Entries (' + posts.length + ')</h2>';
  html += '<p>Japanese: ' + japaneseCount + ' | Korean: ' + koreanCount + '</p>';
  html += '<div>';

  posts.forEach(function(post) {
    const isJapanese = post.language === 'Japanese';

    html += '<div style="border: 1px solid black; padding: 15px; margin: 10px 0;">';
    html += '<div style="background: #f0f0f0; padding: 5px; margin-bottom: 10px;">';
    html += '<strong>User:</strong> ' + escapeHtml(post.userName) + ' (' + escapeHtml(post.userEmail) + ')';
    html += ' | <strong>Language:</strong> ' + escapeHtml(post.language);
    html += ' | <strong>Level:</strong> ' + (post.level || 1);
    html += '</div>';

    // Show fields based on language
    html += '<div style="margin: 10px 0;">';
    html += '<label style="display: inline-block; width: 120px;"><strong>English:</strong></label>';
    html += '<input type="text" class="entry-english" value="' + escapeHtml(post.english || '') + '" style="width: 300px;">';
    html += '</div>';

    html += '<div style="margin: 10px 0;">';
    html += '<label style="display: inline-block; width: 120px;"><strong>' + (isJapanese ? 'Japanese:' : 'Korean:') + '</strong></label>';
    html += '<input type="text" class="entry-target" value="' + escapeHtml(post[isJapanese ? 'japanese' : 'korean'] || '') + '" style="width: 300px;">';
    html += '</div>';

    html += '<div style="margin: 10px 0;">';
    html += '<label style="display: inline-block; width: 120px;"><strong>' + (isJapanese ? 'Hiragana:' : 'Romanization:') + '</strong></label>';
    html += '<input type="text" class="entry-reading" value="' + escapeHtml(post[isJapanese ? 'hiragana' : 'romanization'] || '') + '" style="width: 300px;">';
    html += '</div>';

    html += '<div style="margin: 10px 0;">';
    html += '<label style="display: inline-block; width: 120px;"><strong>Level:</strong></label>';
    html += '<input type="number" class="entry-level" value="' + (post.level || 1) + '" min="1" max="5" style="width: 100px;">';
    html += '</div>';

    if (post.example) {
      html += '<div style="margin: 10px 0;">';
      html += '<label style="display: inline-block; width: 120px;"><strong>Example:</strong></label>';
      html += '<input type="text" class="entry-example" value="' + escapeHtml(post.example || '') + '" style="width: 500px;">';
      html += '</div>';
    }

    if (post.exampleEn) {
      html += '<div style="margin: 10px 0;">';
      html += '<label style="display: inline-block; width: 120px;"><strong>Example (EN):</strong></label>';
      html += '<input type="text" class="entry-exampleEn" value="' + escapeHtml(post.exampleEn || '') + '" style="width: 500px;">';
      html += '</div>';
    }

    html += '<div style="margin-top: 10px;">';
    html += '<button class="save-entry-btn" data-userid="' + post.userId + '" data-entryid="' + post.id + '" data-lang="' + (isJapanese ? 'ja' : 'ko') + '">Save Changes</button>';
    html += '<button class="delete-entry-btn" data-userid="' + post.userId + '" data-entryid="' + post.id + '" data-lang="' + (isJapanese ? 'ja' : 'ko') + '" style="margin-left: 10px;">Delete</button>';
    html += '</div>';
    html += '</div>';
  });

  html += '</div>';
  document.getElementById('contentSection').innerHTML = html;

  // Attach save handlers
  document.querySelectorAll('.save-entry-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const entryDiv = this.closest('div[style*="border"]');
      const userId = this.getAttribute('data-userid');
      const entryId = this.getAttribute('data-entryid');
      const lang = this.getAttribute('data-lang');
      const isJa = lang === 'ja';

      const updateData = {
        english: entryDiv.querySelector('.entry-english').value,
        level: parseInt(entryDiv.querySelector('.entry-level').value) || 1
      };

      if (isJa) {
        updateData.japanese = entryDiv.querySelector('.entry-target').value;
        updateData.hiragana = entryDiv.querySelector('.entry-reading').value;
      } else {
        updateData.korean = entryDiv.querySelector('.entry-target').value;
        updateData.romanization = entryDiv.querySelector('.entry-reading').value;
      }

      const exampleInput = entryDiv.querySelector('.entry-example');
      if (exampleInput) updateData.example = exampleInput.value;

      const exampleEnInput = entryDiv.querySelector('.entry-exampleEn');
      if (exampleEnInput) updateData.exampleEn = exampleEnInput.value;

      saveDictionaryEntry(userId, lang, entryId, updateData);
    });
  });

  // Attach delete handlers
  document.querySelectorAll('.delete-entry-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const userId = this.getAttribute('data-userid');
      const entryId = this.getAttribute('data-entryid');
      const lang = this.getAttribute('data-lang');

      if (confirm('Delete this dictionary entry?')) {
        deleteDictionaryEntryFromAllPosts(userId, lang, entryId);
      }
    });
  });
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

async function saveUserProfile(userId) {
  const form = document.getElementById('userProfileForm');
  const formData = new FormData(form);
  const updateData = {};

  const simpleFields = ['name', 'email', 'bio', 'location', 'website', 'bannerImage', 'level', 'targetLanguage', 'followersCount', 'followingCount'];

  try {
    simpleFields.forEach(function(field) {
      let value = formData.get(field);

      if (field === 'level') {
        value = parseInt(value);
        if (isNaN(value) || value < 1 || value > 5) {
          throw new Error('Level must be a number between 1 and 5');
        }
      }

      if (field === 'targetLanguage') {
        if (value && value !== 'Japanese' && value !== 'Korean' && value !== '') {
          throw new Error('Target Language must be either "Japanese" or "Korean" (or empty)');
        }
      }

      if (field === 'email') {
        if (value && !value.includes('@')) {
          throw new Error('Email must be a valid email address');
        }
      }

      if (field === 'followersCount' || field === 'followingCount') {
        value = parseInt(value) || 0;
      }

      updateData[field] = value;
    });

    const complexFields = ['settings', 'reddit', 'credentials'];
    complexFields.forEach(function(field) {
      const jsonValue = formData.get(field);
      if (jsonValue) {
        updateData[field] = JSON.parse(jsonValue);
      }
    });

    const response = await apiRequest(API_BASE + '/users/' + userId, {
      method: 'PUT',
      body: updateData
    });

    if (response && response.success) {
      alert('SUCCESS: User profile updated successfully!');
      selectUser(userId);
    } else {
      alert('ERROR: Failed to update user profile. ' + (response ? response.error : 'Unknown error'));
    }
  } catch (e) {
    alert('ERROR: ' + e.message);
  }
}

async function saveDictionaryEntry(userId, lang, entryId, updateData) {
  try {
    // Validate level
    if (updateData.level < 1 || updateData.level > 5) {
      alert('ERROR: Level must be between 1 and 5');
      return;
    }

    const response = await apiRequest(API_BASE + '/users/' + userId + '/dictionary/' + lang + '/' + entryId, {
      method: 'PUT',
      body: updateData
    });

    if (response && response.success) {
      alert('SUCCESS: Dictionary entry updated successfully!');
    } else {
      alert('ERROR: Failed to update dictionary entry. ' + (response ? response.error : 'Unknown error'));
    }
  } catch (e) {
    alert('ERROR: ' + e.message);
  }
}

async function deleteDictionaryEntryFromAllPosts(userId, lang, entryId) {
  const response = await apiRequest(API_BASE + '/users/' + userId + '/dictionary/' + lang + '/' + entryId, { method: 'DELETE' });
  if (response && response.success) {
    alert('SUCCESS: Dictionary entry deleted successfully!');
    loadAllPosts(); // Reload all posts view
  } else {
    alert('ERROR: Failed to delete dictionary entry. ' + (response ? response.error : 'Unknown error'));
  }
}

async function deleteUser(userId) {
  if (!confirm('Delete this user and ALL their data? This cannot be undone!')) {
    return;
  }
  const response = await apiRequest(API_BASE + '/users/' + userId, { method: 'DELETE' });
  if (response && response.success) {
    alert('SUCCESS: User deleted successfully!');
    currentUser = null;
    loadAllUsers();
  } else {
    alert('ERROR: Failed to delete user. ' + (response ? response.error : 'Unknown error'));
  }
}

async function deleteDictionaryEntry(userId, lang, entryId) {
  if (!confirm('Delete this dictionary entry?')) return;
  const response = await apiRequest(API_BASE + '/users/' + userId + '/dictionary/' + lang + '/' + entryId, { method: 'DELETE' });
  if (response && response.success) {
    alert('SUCCESS: Dictionary entry deleted successfully!');
    selectUser(userId);
  } else {
    alert('ERROR: Failed to delete dictionary entry. ' + (response ? response.error : 'Unknown error'));
  }
}

async function deleteFlashcard(userId, flashcardId) {
  if (!confirm('Delete this flashcard?')) return;
  const response = await apiRequest(API_BASE + '/users/' + userId + '/flashcards/' + flashcardId, { method: 'DELETE' });
  if (response && response.success) {
    alert('SUCCESS: Flashcard deleted successfully!');
    selectUser(userId);
  } else {
    alert('ERROR: Failed to delete flashcard. ' + (response ? response.error : 'Unknown error'));
  }
}

async function deleteSavedPost(userId, postId, reloadAllPosts) {
  if (!confirm('Delete this saved post?')) return;
  const response = await apiRequest(API_BASE + '/users/' + userId + '/saved-posts/' + postId, { method: 'DELETE' });
  if (response && response.success) {
    alert('SUCCESS: Saved post deleted successfully!');
    if (reloadAllPosts) {
      loadAllPosts();
    } else {
      selectUser(userId);
    }
  } else {
    alert('ERROR: Failed to delete saved post. ' + (response ? response.error : 'Unknown error'));
  }
}

async function deleteCollection(userId, collectionId) {
  if (!confirm('Delete this collection?')) return;
  const response = await apiRequest(API_BASE + '/users/' + userId + '/collections/' + collectionId, { method: 'DELETE' });
  if (response && response.success) {
    alert('SUCCESS: Collection deleted successfully!');
    selectUser(userId);
  } else {
    alert('ERROR: Failed to delete collection. ' + (response ? response.error : 'Unknown error'));
  }
}

async function loadNewsCachePosts() {
  document.getElementById('contentSection').innerHTML = '<p>Loading all posts from news-cache...</p>';

  const response = await apiRequest(API_BASE + '/news-cache-posts');
  if (!response || !response.success) {
    document.getElementById('contentSection').innerHTML = '<p>Error loading news-cache posts</p>';
    return;
  }

  displayNewsCachePosts(response.data);
}

function displayNewsCachePosts(posts) {
  if (posts.length === 0) {
    document.getElementById('contentSection').innerHTML = '<p>No posts found in news-cache</p>';
    return;
  }

  let html = '<h2>All News-Cache Posts (' + posts.length + ')</h2>';
  html += '<div>';

  posts.forEach(function(post) {
    html += '<div style="border: 1px solid black; padding: 15px; margin: 10px 0;">';
    html += '<div style="background: #f0f0f0; padding: 5px; margin-bottom: 10px;">';
    html += '<strong>Document:</strong> ' + escapeHtml(post.docId);
    html += ' | <strong>Index:</strong> ' + post.postIndex;
    html += '</div>';

    // Title
    html += '<div style="margin: 10px 0;">';
    html += '<label style="display: inline-block; width: 120px;"><strong>Title:</strong></label>';
    html += '<input type="text" class="news-title" value="' + escapeHtml(post.title || '') + '" style="width: 600px;">';
    html += '</div>';

    // URL
    html += '<div style="margin: 10px 0;">';
    html += '<label style="display: inline-block; width: 120px;"><strong>URL:</strong></label>';
    html += '<input type="text" class="news-url" value="' + escapeHtml(post.url || '') + '" style="width: 600px;">';
    html += '</div>';

    // Author
    html += '<div style="margin: 10px 0;">';
    html += '<label style="display: inline-block; width: 120px;"><strong>Author:</strong></label>';
    html += '<input type="text" class="news-author" value="' + escapeHtml(post.author || '') + '" style="width: 300px;">';
    html += '</div>';

    // Subreddit
    html += '<div style="margin: 10px 0;">';
    html += '<label style="display: inline-block; width: 120px;"><strong>Subreddit:</strong></label>';
    html += '<input type="text" class="news-subreddit" value="' + escapeHtml(post.subreddit || '') + '" style="width: 300px;">';
    html += '</div>';

    // Score
    html += '<div style="margin: 10px 0;">';
    html += '<label style="display: inline-block; width: 120px;"><strong>Score:</strong></label>';
    html += '<input type="number" class="news-score" value="' + (post.score || 0) + '" style="width: 150px;">';
    html += '</div>';

    // Created
    html += '<div style="margin: 10px 0;">';
    html += '<label style="display: inline-block; width: 120px;"><strong>Created:</strong></label>';
    html += '<input type="text" class="news-created" value="' + (post.created ? new Date(post.created * 1000).toLocaleString() : 'N/A') + '" style="width: 300px;" disabled>';
    html += '</div>';

    // Content preview
    if (post.content) {
      html += '<div style="margin: 10px 0;">';
      html += '<label style="display: block;"><strong>Content Preview:</strong></label>';
      html += '<textarea class="news-content" rows="3" style="width: 100%; font-family: monospace;">' + escapeHtml(post.content.substring(0, 500)) + '</textarea>';
      html += '</div>';
    }

    // Buttons
    html += '<div style="margin-top: 10px;">';
    html += '<button class="save-news-btn" data-docid="' + post.docId + '" data-postindex="' + post.postIndex + '">Save Changes</button>';
    html += '<button class="delete-news-btn" data-docid="' + post.docId + '" data-postindex="' + post.postIndex + '" style="margin-left: 10px;">Delete</button>';
    html += '</div>';
    html += '</div>';
  });

  html += '</div>';
  document.getElementById('contentSection').innerHTML = html;

  // Attach save handlers
  document.querySelectorAll('.save-news-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const postDiv = this.closest('div[style*="border"]');
      const docId = this.getAttribute('data-docid');
      const postIndex = this.getAttribute('data-postindex');

      const updateData = {
        title: postDiv.querySelector('.news-title').value,
        url: postDiv.querySelector('.news-url').value,
        author: postDiv.querySelector('.news-author').value,
        subreddit: postDiv.querySelector('.news-subreddit').value,
        score: parseInt(postDiv.querySelector('.news-score').value) || 0
      };

      const contentInput = postDiv.querySelector('.news-content');
      if (contentInput) {
        updateData.content = contentInput.value;
      }

      saveNewsCachePost(docId, postIndex, updateData);
    });
  });

  // Attach delete handlers
  document.querySelectorAll('.delete-news-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const docId = this.getAttribute('data-docid');
      const postIndex = this.getAttribute('data-postindex');

      if (confirm('Delete this news-cache post?')) {
        deleteNewsCachePost(docId, postIndex);
      }
    });
  });
}

async function saveNewsCachePost(docId, postIndex, updateData) {
  try {
    const response = await apiRequest(API_BASE + '/news-cache-posts/' + docId + '/' + postIndex, {
      method: 'PUT',
      body: updateData
    });

    if (response && response.success) {
      alert('SUCCESS: News-cache post updated successfully!');
    } else {
      alert('ERROR: Failed to update news-cache post. ' + (response ? response.error : 'Unknown error'));
    }
  } catch (e) {
    alert('ERROR: ' + e.message);
  }
}

async function deleteNewsCachePost(docId, postIndex) {
  const response = await apiRequest(API_BASE + '/news-cache-posts/' + docId + '/' + postIndex, { method: 'DELETE' });
  if (response && response.success) {
    alert('SUCCESS: News-cache post deleted successfully!');
    loadNewsCachePosts(); // Reload all news-cache posts view
  } else {
    alert('ERROR: Failed to delete news-cache post. ' + (response ? response.error : 'Unknown error'));
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('searchBtn').addEventListener('click', searchUsers);
  document.getElementById('loadAllBtn').addEventListener('click', loadAllUsers);
  document.getElementById('loadAllPostsBtn').addEventListener('click', loadAllPosts);
  document.getElementById('loadNewsCacheBtn').addEventListener('click', loadNewsCachePosts);
  document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') searchUsers();
  });

  document.getElementById('closeModalBtn').addEventListener('click', function() {
    document.getElementById('userModal').classList.remove('active');
  });

  // Initialize
  checkAuth();
  loadAllUsers();
});
