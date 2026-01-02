import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  addWordToDictionary,
  getUserDictionary,
  removeWordFromDictionary,
  createCollection,
  getCollections,
  addWordToCollection,
  savePost,
  getSavedPosts,
  removeSavedPost
} from '@/services/firebaseDatabaseService';

export default function DatabaseTest() {
  const { currentUser, loading } = useAuth();
  const [dictionary, setDictionary] = useState([]);
  const [collections, setCollections] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [log, setLog] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message, type = 'info') => {
    const entry = {
      message,
      type,
      time: new Date().toLocaleTimeString()
    };
    setLog(prev => [...prev, entry]);
    console.log(`[${entry.time}] ${message}`);
  };

  // Load data on mount
  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser]);

  const loadAllData = async () => {
    await loadDictionary();
    await loadCollections();
    await loadSavedPosts();
  };

  // Test 1: Add word to dictionary
  const testAddWord = async () => {
    addLog('🧪 Test: Adding word to dictionary...', 'test');
    const testWord = {
      targetLanguage: 'Japanese',
      language: 'Japanese',
      word: '猫',
      japanese: '猫',
      hiragana: 'ねこ',
      romaji: 'neko',
      english: 'cat',
      meaning: 'A small domesticated carnivorous mammal',
      partOfSpeech: 'noun',
      level: 1,
      jlptLevel: 'N5',
      example: 'この猫はかわいいです。',
      exampleEn: 'This cat is cute.'
    };

    const result = await addWordToDictionary(currentUser.id, testWord);
    if (result.success) {
      addLog('✅ Word added successfully!', 'success');
      await loadDictionary();
      return result.data;
    } else {
      addLog(`❌ Failed to add word: ${result.error}`, 'error');
      return null;
    }
  };

  // Test 2: Get dictionary
  const loadDictionary = async () => {
    if (!currentUser) return;

    const result = await getUserDictionary(currentUser.id);
    if (result.success) {
      setDictionary(result.data || []);
      addLog(`📚 Dictionary loaded: ${result.data?.length || 0} words`, 'info');
    } else {
      addLog(`❌ Failed to load dictionary: ${result.error}`, 'error');
    }
  };

  // Test 3: Remove word from dictionary
  const testRemoveWord = async (wordId) => {
    addLog(`🗑️ Test: Removing word ${wordId}...`, 'test');
    const result = await removeWordFromDictionary(currentUser.id, wordId);
    if (result.success) {
      addLog('✅ Word removed successfully!', 'success');
      await loadDictionary();
    } else {
      addLog(`❌ Failed to remove word: ${result.error}`, 'error');
    }
  };

  // Test 4: Create collection
  const testCreateCollection = async () => {
    addLog('🧪 Test: Creating collection...', 'test');
    const result = await createCollection(currentUser.id, {
      name: `Test Collection ${Date.now()}`,
      description: 'A test collection for JLPT N5 vocabulary',
      isDefault: false
    });

    if (result.success) {
      addLog('✅ Collection created successfully!', 'success');
      await loadCollections();
      return result.data;
    } else {
      addLog(`❌ Failed to create collection: ${result.error}`, 'error');
      return null;
    }
  };

  // Test 5: Get collections
  const loadCollections = async () => {
    if (!currentUser) return;

    const result = await getCollections(currentUser.id);
    if (result.success) {
      setCollections(result.data || []);
      addLog(`📁 Collections loaded: ${result.data?.length || 0} collections`, 'info');
    } else {
      addLog(`❌ Failed to load collections: ${result.error}`, 'error');
    }
  };

  // Test 6: Add word to collection
  const testAddWordToCollection = async () => {
    addLog('🧪 Test: Adding word to collection...', 'test');

    // First ensure we have a word and collection
    let word = dictionary[0];
    if (!word) {
      word = await testAddWord();
      if (!word) return;
    }

    let collection = collections[0];
    if (!collection) {
      collection = await testCreateCollection();
      if (!collection) return;
    }

    const result = await addWordToCollection(currentUser.id, collection.id, word.id);
    if (result.success) {
      addLog(`✅ Word added to collection "${collection.name}"!`, 'success');
      await loadCollections();
    } else {
      addLog(`❌ Failed to add word to collection: ${result.error}`, 'error');
    }
  };

  // Test 7: Save post
  const testSavePost = async () => {
    addLog('🧪 Test: Saving post...', 'test');
    const testPost = {
      postId: `test_post_${Date.now()}`,
      title: 'Test Post: Japanese Learning Tips',
      content: 'これは日本語学習のためのテスト投稿です。This is a test post for Japanese learning.',
      url: 'https://reddit.com/r/LearnJapanese/test',
      author: 'test_user',
      publishedAt: new Date().toISOString(),
      source: 'reddit',
      tags: ['test', 'japanese', 'learning'],
      difficulty: 2
    };

    const result = await savePost(currentUser.id, testPost);
    if (result.success) {
      addLog('✅ Post saved successfully!', 'success');
      await loadSavedPosts();
    } else {
      addLog(`❌ Failed to save post: ${result.error}`, 'error');
    }
  };

  // Test 8: Get saved posts
  const loadSavedPosts = async () => {
    if (!currentUser) return;

    const result = await getSavedPosts(currentUser.id);
    if (result.success) {
      setSavedPosts(result.data || []);
      addLog(`💾 Saved posts loaded: ${result.data?.length || 0} posts`, 'info');
    } else {
      addLog(`❌ Failed to load saved posts: ${result.error}`, 'error');
    }
  };

  // Test 9: Remove saved post
  const testRemovePost = async (postId) => {
    addLog(`🗑️ Test: Removing post ${postId}...`, 'test');
    const result = await removeSavedPost(currentUser.id, postId);
    if (result.success) {
      addLog('✅ Post removed successfully!', 'success');
      await loadSavedPosts();
    } else {
      addLog(`❌ Failed to remove post: ${result.error}`, 'error');
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    setLog([]);
    addLog('🚀 Starting comprehensive database tests...', 'info');
    addLog('════════════════════════════════════════', 'info');

    try {
      await testAddWord();
      await new Promise(r => setTimeout(r, 500));

      await testCreateCollection();
      await new Promise(r => setTimeout(r, 500));

      await testAddWordToCollection();
      await new Promise(r => setTimeout(r, 500));

      await testSavePost();
      await new Promise(r => setTimeout(r, 500));

      addLog('════════════════════════════════════════', 'info');
      addLog('🎉 All tests completed successfully!', 'success');
    } catch (error) {
      addLog(`❌ Test suite failed: ${error.message}`, 'error');
    }

    setIsRunning(false);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={styles.container}>
        <div style={styles.notLoggedIn}>
          <h2>🔒 Please Login First</h2>
          <p>You need to be logged in to test database operations.</p>
          <p>Go to the Auth Test page to login or create an account.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🗄️ Database Operations Testing</h1>
        <p style={styles.subtitle}>Test Firebase Firestore operations and access rules</p>
        <div style={styles.userInfo}>
          Logged in as: <strong>{currentUser.email}</strong>
        </div>
      </div>

      <div style={styles.controlPanel}>
        <button
          onClick={runAllTests}
          disabled={isRunning}
          style={{...styles.buttonPrimary, ...styles.runAllButton}}
        >
          {isRunning ? '⏳ Running Tests...' : '🧪 Run All Tests'}
        </button>
        <button onClick={loadAllData} style={styles.buttonRefresh}>
          🔄 Refresh All Data
        </button>
      </div>

      <div style={styles.gridContainer}>
        <div style={styles.dataCard}>
          <div style={styles.cardHeader}>
            <h3>📚 Dictionary ({dictionary.length})</h3>
            <div style={styles.buttonGroup}>
              <button onClick={testAddWord} style={styles.buttonSmall} disabled={isRunning}>
                ➕ Add
              </button>
              <button onClick={loadDictionary} style={styles.buttonSmallSecondary}>
                🔄
              </button>
            </div>
          </div>
          <div style={styles.dataList}>
            {dictionary.length === 0 ? (
              <div style={styles.emptyState}>No words yet. Add one!</div>
            ) : (
              dictionary.slice(0, 5).map(word => (
                <div key={word.id} style={styles.dataItem}>
                  <div style={styles.dataItemContent}>
                    <strong>{word.word || word.japanese}</strong>
                    <span style={styles.dataItemMeta}>
                      {word.romaji} - {word.english}
                    </span>
                  </div>
                  <button
                    onClick={() => testRemoveWord(word.id)}
                    style={styles.buttonDelete}
                    disabled={isRunning}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
            {dictionary.length > 5 && (
              <div style={styles.moreItems}>+{dictionary.length - 5} more</div>
            )}
          </div>
        </div>

        <div style={styles.dataCard}>
          <div style={styles.cardHeader}>
            <h3>📁 Collections ({collections.length})</h3>
            <div style={styles.buttonGroup}>
              <button onClick={testCreateCollection} style={styles.buttonSmall} disabled={isRunning}>
                ➕ Add
              </button>
              <button onClick={loadCollections} style={styles.buttonSmallSecondary}>
                🔄
              </button>
            </div>
          </div>
          <div style={styles.dataList}>
            {collections.length === 0 ? (
              <div style={styles.emptyState}>No collections yet.</div>
            ) : (
              collections.slice(0, 5).map(coll => (
                <div key={coll.id} style={styles.dataItem}>
                  <div style={styles.dataItemContent}>
                    <strong>{coll.name}</strong>
                    <span style={styles.dataItemMeta}>
                      {coll.collectionWords?.length || 0} words
                    </span>
                  </div>
                </div>
              ))
            )}
            {collections.length > 5 && (
              <div style={styles.moreItems}>+{collections.length - 5} more</div>
            )}
          </div>
        </div>

        <div style={styles.dataCard}>
          <div style={styles.cardHeader}>
            <h3>💾 Saved Posts ({savedPosts.length})</h3>
            <div style={styles.buttonGroup}>
              <button onClick={testSavePost} style={styles.buttonSmall} disabled={isRunning}>
                ➕ Add
              </button>
              <button onClick={loadSavedPosts} style={styles.buttonSmallSecondary}>
                🔄
              </button>
            </div>
          </div>
          <div style={styles.dataList}>
            {savedPosts.length === 0 ? (
              <div style={styles.emptyState}>No saved posts yet.</div>
            ) : (
              savedPosts.slice(0, 5).map(post => (
                <div key={post.id} style={styles.dataItem}>
                  <div style={styles.dataItemContent}>
                    <strong>{post.title.substring(0, 50)}...</strong>
                    <span style={styles.dataItemMeta}>
                      Difficulty: {post.difficulty || 'N/A'}
                    </span>
                  </div>
                  <button
                    onClick={() => testRemovePost(post.postId)}
                    style={styles.buttonDelete}
                    disabled={isRunning}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
            {savedPosts.length > 5 && (
              <div style={styles.moreItems}>+{savedPosts.length - 5} more</div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.logCard}>
        <div style={styles.logHeader}>
          <h3>📋 Test Log</h3>
          <button onClick={() => setLog([])} style={styles.clearButton}>
            Clear Log
          </button>
        </div>
        <div style={styles.logContent}>
          {log.length === 0 ? (
            <div style={styles.emptyLog}>No logs yet. Run some tests!</div>
          ) : (
            log.map((entry, i) => (
              <div
                key={i}
                style={{
                  ...styles.logEntry,
                  color: entry.type === 'error' ? '#ff6b6b' :
                         entry.type === 'success' ? '#51cf66' :
                         entry.type === 'test' ? '#ffd43b' : '#fff'
                }}
              >
                [{entry.time}] {entry.message}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={styles.instructionsCard}>
        <h3 style={styles.sectionTitle}>📖 Testing Instructions</h3>
        <ol style={styles.list}>
          <li>Click "Run All Tests" to test all database operations</li>
          <li>Or test individual operations using the buttons in each section</li>
          <li>Check Firebase Console → Firestore Database to verify data is created</li>
          <li>Verify access rules: other users shouldn't see your data</li>
          <li>Watch the Test Log for real-time operation feedback</li>
        </ol>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
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
    margin: '0 0 10px 0',
  },
  userInfo: {
    fontSize: '14px',
    color: '#495057',
  },
  controlPanel: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '30px',
  },
  runAllButton: {
    fontSize: '16px',
    padding: '15px 30px',
  },
  buttonPrimary: {
    padding: '12px 24px',
    background: '#4c6ef5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  buttonRefresh: {
    padding: '12px 24px',
    background: '#2b8a3e',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  dataCard: {
    background: '#fff',
    border: '2px solid #dee2e6',
    borderRadius: '8px',
    padding: '20px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '2px solid #e9ecef',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
  },
  buttonSmall: {
    padding: '6px 12px',
    background: '#4c6ef5',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },
  buttonSmallSecondary: {
    padding: '6px 12px',
    background: '#adb5bd',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  dataList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  dataItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: '#f8f9fa',
    marginBottom: '8px',
    borderRadius: '6px',
  },
  dataItemContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  dataItemMeta: {
    fontSize: '12px',
    color: '#868e96',
  },
  buttonDelete: {
    padding: '6px 10px',
    background: '#fa5252',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '30px',
    color: '#adb5bd',
    fontStyle: 'italic',
  },
  moreItems: {
    textAlign: 'center',
    padding: '10px',
    color: '#868e96',
    fontSize: '12px',
    fontStyle: 'italic',
  },
  logCard: {
    background: '#1e1e1e',
    border: '2px solid #333',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    color: '#fff',
  },
  clearButton: {
    padding: '6px 12px',
    background: '#495057',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  logContent: {
    maxHeight: '400px',
    overflowY: 'auto',
  },
  logEntry: {
    fontFamily: 'monospace',
    fontSize: '13px',
    padding: '4px 0',
  },
  emptyLog: {
    textAlign: 'center',
    padding: '30px',
    color: '#666',
    fontStyle: 'italic',
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
  list: {
    paddingLeft: '20px',
    lineHeight: '1.8',
    margin: 0,
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666',
  },
  notLoggedIn: {
    textAlign: 'center',
    padding: '60px 20px',
    background: '#fff3cd',
    border: '2px solid #ffc107',
    borderRadius: '8px',
    margin: '40px auto',
    maxWidth: '600px',
  },
};
