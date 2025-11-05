/**
 * Supabase Authentication Service
 * Replaces Firebase Authentication
 */

import { supabase } from '@/lib/supabase';

/**
 * Register a new user with email and password
 */
export const registerWithEmail = async (email, password, displayName) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          name: displayName,
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      user: data.user,
      isNewUser: true,
    };
  } catch (error) {
    console.error('Error registering user:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
      isNewUser: false,
    };
  } catch (error) {
    console.error('Error signing in:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Note: OAuth redirects, so this return won't be reached immediately
    // The actual user data will be available after redirect
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Sign out the current user
 */
export const signOutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Update user password
 */
export const updatePassword = async (newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Update user profile metadata
 */
export const updateUserMetadata = async (metadata) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    console.error('Error updating user metadata:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Listen to authentication state changes
 */
export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      const user = session?.user || null;
      callback(user);
    }
  );

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Get current session
 */
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting current session:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
};

/**
 * Refresh session
 */
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      session: data.session,
    };
  } catch (error) {
    console.error('Error refreshing session:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
