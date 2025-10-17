const API_BASE = '/api/admin';
let currentTab = 'users';
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

function switchTab(tab) {
  currentTab = tab;
  if (currentUser) {
    loadUserData(currentUser);
  } else {
    document.getElementById('contentSection').innerHTML = '<p>Select a user to view their data</p>';
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

function selectUser(userId) {
  currentUser = userId;
  loadUserData(userId);
}

async function loadUserData(userId) {
  document.getElementById('contentSection').innerHTML = '<p>Loading data...</p>';

  switch (currentTab) {
    case 'users':
      await loadUserProfile(userId);
      break;
    case 'dictionary':
      await loadDictionary(userId);
      break;
    case 'flashcards':
      await loadFlashcards(userId);
      break;
    case 'savedPosts':
      await loadSavedPosts(userId);
      break;
    case 'collections':
      await loadCollections(userId);
      break;
    case 'social':
      await loadSocialConnections(userId);
      break;
  }
}

async function loadUserProfile(userId) {
  const response = await apiRequest(API_BASE + '/users/' + userId);
  if (response && response.success) {
    const user = response.data;

    // Separate simple fields from complex objects
    const simpleFields = ['name', 'email', 'bio', 'location', 'website', 'bannerImage', 'level', 'targetLanguage', 'followersCount', 'followingCount'];
    const complexFields = ['settings', 'reddit', 'credentials'];

    let html = '<h3>User Profile - ' + (user.name || 'No Name') + '</h3>';
    html += '<form id="userProfileForm">';

    // Simple fields
    html += '<h4>Basic Information</h4>';
    simpleFields.forEach(function(field) {
      const value = user[field] !== undefined ? user[field] : '';
      html += '<div style="margin: 10px 0;">';
      html += '<label style="display: inline-block; width: 150px;"><strong>' + field + ':</strong></label>';
      html += '<input type="text" name="' + field + '" value="' + escapeHtml(String(value)) + '" style="width: 400px;">';
      html += '</div>';
    });

    // Complex fields as JSON
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
    html += '<button type="button" id="saveUserBtn" data-userid="' + userId + '">Save Changes</button>';
    html += '<button type="button" data-action="delete" data-userid="' + userId + '" style="margin-left: 10px;">Delete User</button>';
    html += '</div>';
    html += '</form>';

    document.getElementById('contentSection').innerHTML = html;

    // Add save handler
    document.getElementById('saveUserBtn').addEventListener('click', function() {
      saveUserProfile(this.getAttribute('data-userid'));
    });

    // Add delete handler
    document.querySelector('[data-action="delete"]').addEventListener('click', function() {
      deleteUser(this.getAttribute('data-userid'));
    });
  }
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

  // Process simple fields
  const simpleFields = ['name', 'email', 'bio', 'location', 'website', 'bannerImage', 'level', 'targetLanguage', 'followersCount', 'followingCount'];
  simpleFields.forEach(function(field) {
    let value = formData.get(field);

    // Validation
    if (field === 'level') {
      value = parseInt(value);
      if (isNaN(value) || value < 1 || value > 5) {
        alert('Error: Level must be a number between 1 and 5');
        throw new Error('Invalid level');
      }
    }

    if (field === 'targetLanguage') {
      if (value && value !== 'Japanese' && value !== 'Korean' && value !== '') {
        alert('Error: Target Language must be either "Japanese" or "Korean" (or empty)');
        throw new Error('Invalid targetLanguage');
      }
    }

    if (field === 'email') {
      if (value && !value.includes('@')) {
        alert('Error: Email must be a valid email address');
        throw new Error('Invalid email');
      }
    }

    if (field === 'followersCount' || field === 'followingCount') {
      value = parseInt(value) || 0;
    }

    updateData[field] = value;
  });

  // Process complex fields (JSON)
  const complexFields = ['settings', 'reddit', 'credentials'];
  complexFields.forEach(function(field) {
    const jsonValue = formData.get(field);
    if (jsonValue) {
      try {
        updateData[field] = JSON.parse(jsonValue);
      } catch (e) {
        alert('Error: Invalid JSON in field "' + field + '". Please check the syntax.');
        throw new Error('Invalid JSON in ' + field);
      }
    }
  });

  // Send update request
  const response = await apiRequest(API_BASE + '/users/' + userId, {
    method: 'PUT',
    body: updateData
  });

  if (response && response.success) {
    alert('SUCCESS: User profile updated successfully!');
    loadUserProfile(userId); // Reload to show updated data
  } else {
    alert('ERROR: Failed to update user profile. ' + (response ? response.error : 'Unknown error'));
  }
}

async function loadDictionary(userId) {
  const responses = await Promise.all([
    apiRequest(API_BASE + '/users/' + userId + '/dictionary/ja'),
    apiRequest(API_BASE + '/users/' + userId + '/dictionary/ko')
  ]);

  const jaEntries = responses[0] && responses[0].success ? responses[0].data : [];
  const koEntries = responses[1] && responses[1].success ? responses[1].data : [];

  let html = '<h3>Dictionary Entries</h3>';
  html += '<h4>Japanese (' + jaEntries.length + ')</h4>';
  html += renderDictionaryTable(userId, 'ja', jaEntries);
  html += '<h4>Korean (' + koEntries.length + ')</h4>';
  html += renderDictionaryTable(userId, 'ko', koEntries);

  document.getElementById('contentSection').innerHTML = html;

  // Add delete handlers
  document.querySelectorAll('[data-action="delete-dict"]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      deleteDictionaryEntry(
        this.getAttribute('data-userid'),
        this.getAttribute('data-lang'),
        this.getAttribute('data-entryid')
      );
    });
  });
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
    html += '<td>' + (entry.english || 'N/A') + '</td>';
    html += '<td>' + (entry[isJapanese ? 'japanese' : 'korean'] || 'N/A') + '</td>';
    html += '<td>' + (entry[isJapanese ? 'hiragana' : 'romanization'] || 'N/A') + '</td>';
    html += '<td>' + (entry.level || 1) + '</td>';
    html += '<td><button data-action="delete-dict" data-userid="' + userId + '" data-lang="' + lang + '" data-entryid="' + entry.id + '">Delete</button></td>';
    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
}

async function loadFlashcards(userId) {
  const response = await apiRequest(API_BASE + '/users/' + userId + '/flashcards');
  if (response && response.success) {
    const flashcards = response.data;
    let html = '<h3>Flashcards (' + flashcards.length + ')</h3>';

    if (flashcards.length === 0) {
      html += '<p>No flashcards found</p>';
    } else {
      html += '<table><thead><tr>';
      html += '<th>ID</th><th>Correct</th><th>Incorrect</th><th>Proficiency</th><th>Last Reviewed</th><th>Actions</th>';
      html += '</tr></thead><tbody>';

      flashcards.forEach(function(card) {
        html += '<tr>';
        html += '<td>' + card.id + '</td>';
        html += '<td>' + (card.correctCount || 0) + '</td>';
        html += '<td>' + (card.incorrectCount || 0) + '</td>';
        html += '<td>' + (card.proficiency || 0) + '%</td>';
        html += '<td>' + (card.lastReviewed ? new Date(card.lastReviewed.seconds * 1000).toLocaleDateString() : 'Never') + '</td>';
        html += '<td><button data-action="delete-flashcard" data-userid="' + userId + '" data-cardid="' + card.id + '">Delete</button></td>';
        html += '</tr>';
      });

      html += '</tbody></table>';
    }

    document.getElementById('contentSection').innerHTML = html;

    // Add delete handlers
    document.querySelectorAll('[data-action="delete-flashcard"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        deleteFlashcard(this.getAttribute('data-userid'), this.getAttribute('data-cardid'));
      });
    });
  }
}

async function loadSavedPosts(userId) {
  const response = await apiRequest(API_BASE + '/users/' + userId + '/saved-posts');
  if (response && response.success) {
    const posts = response.data;
    let html = '<h3>Saved Posts (' + posts.length + ')</h3>';

    if (posts.length === 0) {
      html += '<p>No saved posts found</p>';
    } else {
      posts.forEach(function(post) {
        html += '<div style="border: 1px solid black; padding: 10px; margin: 5px 0;">';
        html += '<strong>' + (post.title || 'No Title') + '</strong><br>';
        html += '<p>' + (post.content || '').substring(0, 200) + '...</p>';
        html += 'Source: ' + (post.source || 'Unknown') + ' ';
        html += '<button data-action="delete-post" data-userid="' + userId + '" data-postid="' + post.id + '">Delete</button>';
        html += '</div>';
      });
    }

    document.getElementById('contentSection').innerHTML = html;

    // Add delete handlers
    document.querySelectorAll('[data-action="delete-post"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        deleteSavedPost(this.getAttribute('data-userid'), this.getAttribute('data-postid'));
      });
    });
  }
}

async function loadCollections(userId) {
  const response = await apiRequest(API_BASE + '/users/' + userId + '/collections');
  if (response && response.success) {
    const collections = response.data;
    let html = '<h3>Collections (' + collections.length + ')</h3>';

    if (collections.length === 0) {
      html += '<p>No collections found</p>';
    } else {
      html += '<table><thead><tr>';
      html += '<th>Name</th><th>Description</th><th>Word Count</th><th>Default</th><th>Actions</th>';
      html += '</tr></thead><tbody>';

      collections.forEach(function(col) {
        html += '<tr>';
        html += '<td>' + (col.name || 'Unnamed') + '</td>';
        html += '<td>' + (col.description || 'No description') + '</td>';
        html += '<td>' + (col.wordIds ? col.wordIds.length : 0) + '</td>';
        html += '<td>' + (col.isDefault ? 'Yes' : '') + '</td>';
        html += '<td><button data-action="delete-collection" data-userid="' + userId + '" data-colid="' + col.id + '">Delete</button></td>';
        html += '</tr>';
      });

      html += '</tbody></table>';
    }

    document.getElementById('contentSection').innerHTML = html;

    // Add delete handlers
    document.querySelectorAll('[data-action="delete-collection"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        deleteCollection(this.getAttribute('data-userid'), this.getAttribute('data-colid'));
      });
    });
  }
}

async function loadSocialConnections(userId) {
  const response = await apiRequest(API_BASE + '/users/' + userId + '/social');
  if (response && response.success) {
    const data = response.data;
    let html = '<h3>Social Connections</h3>';
    html += '<h4>Following (' + data.following.length + ')</h4>';
    html += '<pre>' + JSON.stringify(data.following, null, 2) + '</pre>';
    html += '<h4>Followers (' + data.followers.length + ')</h4>';
    html += '<pre>' + JSON.stringify(data.followers, null, 2) + '</pre>';
    html += '<h4>Blocked (' + data.blocked.length + ')</h4>';
    html += '<pre>' + JSON.stringify(data.blocked, null, 2) + '</pre>';
    document.getElementById('contentSection').innerHTML = html;
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
    loadDictionary(userId);
  } else {
    alert('ERROR: Failed to delete dictionary entry. ' + (response ? response.error : 'Unknown error'));
  }
}

async function deleteFlashcard(userId, flashcardId) {
  if (!confirm('Delete this flashcard?')) return;
  const response = await apiRequest(API_BASE + '/users/' + userId + '/flashcards/' + flashcardId, { method: 'DELETE' });
  if (response && response.success) {
    alert('SUCCESS: Flashcard deleted successfully!');
    loadFlashcards(userId);
  } else {
    alert('ERROR: Failed to delete flashcard. ' + (response ? response.error : 'Unknown error'));
  }
}

async function deleteSavedPost(userId, postId) {
  if (!confirm('Delete this saved post?')) return;
  const response = await apiRequest(API_BASE + '/users/' + userId + '/saved-posts/' + postId, { method: 'DELETE' });
  if (response && response.success) {
    alert('SUCCESS: Saved post deleted successfully!');
    loadSavedPosts(userId);
  } else {
    alert('ERROR: Failed to delete saved post. ' + (response ? response.error : 'Unknown error'));
  }
}

async function deleteCollection(userId, collectionId) {
  if (!confirm('Delete this collection?')) return;
  const response = await apiRequest(API_BASE + '/users/' + userId + '/collections/' + collectionId, { method: 'DELETE' });
  if (response && response.success) {
    alert('SUCCESS: Collection deleted successfully!');
    loadCollections(userId);
  } else {
    alert('ERROR: Failed to delete collection. ' + (response ? response.error : 'Unknown error'));
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('searchBtn').addEventListener('click', searchUsers);
  document.getElementById('loadAllBtn').addEventListener('click', loadAllUsers);
  document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') searchUsers();
  });

  document.getElementById('tab-users').addEventListener('click', function() { switchTab('users'); });
  document.getElementById('tab-dictionary').addEventListener('click', function() { switchTab('dictionary'); });
  document.getElementById('tab-flashcards').addEventListener('click', function() { switchTab('flashcards'); });
  document.getElementById('tab-savedPosts').addEventListener('click', function() { switchTab('savedPosts'); });
  document.getElementById('tab-collections').addEventListener('click', function() { switchTab('collections'); });
  document.getElementById('tab-social').addEventListener('click', function() { switchTab('social'); });

  document.getElementById('closeModalBtn').addEventListener('click', function() {
    document.getElementById('userModal').classList.remove('active');
  });

  // Initialize
  checkAuth();
  loadAllUsers();
});
