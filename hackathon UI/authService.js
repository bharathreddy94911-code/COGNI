const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem('demo_session'));
  } catch (e) {
    return null;
  }
};

const saveSession = (user, token = null) => {
  if (user) {
    localStorage.setItem('demo_session', JSON.stringify(user));
    if (token) {
      localStorage.setItem('auth_token', token);
    }
  } else {
    localStorage.removeItem('demo_session');
    localStorage.removeItem('auth_token');
  }
};

export const authService = {
  getToken() {
    return localStorage.getItem('auth_token');
  },

  getCurrentUser() {
    return getSession();
  },

  async signInWithEmail(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        let errMsg = "Incorrect email or password.";
        try {
          const errData = await response.json();
          if (errData.detail) errMsg = errData.detail;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      saveSession(data.user, data.access_token);
      return { user: data.user, token: data.access_token, isNewUser: false };
    } catch (err) {
      throw err;
    }
  },

  async signUpWithEmail(name, email, password) {
    // Return structured default user for local signup fallback
    const newUser = { name, email, displayName: name, role: "BANK_EMPLOYEE" };
    saveSession(newUser);
    return { user: newUser, isNewUser: true };
  },

  async signInWithGoogle() {
    const user = { name: 'Bank Employee', email: 'employee@bank.com', displayName: 'Bank Employee', role: 'BANK_EMPLOYEE' };
    saveSession(user);
    return { user, isNewUser: false };
  },

  async sendPasswordReset(email) {
    if (!email) {
      throw new Error("Email is required for password reset.");
    }
  }
};

// Auth object for session persistence
export const auth = {
  onAuthStateChanged: (callback) => {
    const session = getSession();
    setTimeout(() => callback(session), 0);
    return () => {};
  },
  signOut: async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
      } catch (_) {}
    }
    saveSession(null);
  }
};

