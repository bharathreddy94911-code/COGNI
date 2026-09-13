const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const getRegisteredUsers = () => {
  try {
    return JSON.parse(localStorage.getItem('registered_users') || '{}');
  } catch (e) {
    return {};
  }
};

const saveRegisteredUser = (user) => {
  try {
    const users = getRegisteredUsers();
    const cleanEmail = (user.email || '').trim().toLowerCase();
    if (!cleanEmail) return user;
    
    users[cleanEmail] = {
      ...users[cleanEmail],
      ...user,
      email: cleanEmail
    };
    localStorage.setItem('registered_users', JSON.stringify(users));
    return users[cleanEmail];
  } catch (e) {
    console.error("Failed to save registered user:", e);
    return user;
  }
};

const getSession = () => {
  try {
    const session = JSON.parse(localStorage.getItem('demo_session'));
    if (!session) return null;
    const cleanEmail = (session.email || '').trim().toLowerCase();
    const users = getRegisteredUsers();
    if (cleanEmail && users[cleanEmail]) {
      return { ...users[cleanEmail], ...session, role: session.role || users[cleanEmail].role || 'BANK_EMPLOYEE' };
    }
    return session;
  } catch (e) {
    return null;
  }
};

const saveSession = (user, token = null) => {
  if (user) {
    const cleanEmail = (user.email || '').trim().toLowerCase();
    const normalizedUser = {
      ...user,
      email: cleanEmail,
      displayName: user.displayName || user.name || user.full_name || (cleanEmail ? cleanEmail.split('@')[0] : 'User')
    };
    if (cleanEmail) {
      saveRegisteredUser(normalizedUser);
    }
    localStorage.setItem('demo_session', JSON.stringify(normalizedUser));
    if (token) {
      localStorage.setItem('auth_token', token);
    }
  } else {
    localStorage.removeItem('demo_session');
    localStorage.removeItem('auth_token');
  }
};

export const authService = {
  getRegisteredUsers,
  
  getRegisteredUser(email) {
    if (!email) return null;
    const users = getRegisteredUsers();
    return users[email.trim().toLowerCase()] || null;
  },

  getToken() {
    return localStorage.getItem('auth_token');
  },

  getCurrentUser() {
    return getSession();
  },

  updateUserProfile(email, onboardingData = {}, onboardingCompleted = true, onboardingStep = null) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const users = getRegisteredUsers();
    const existing = users[cleanEmail] || {};
    const updatedName = onboardingData.name || existing.name || existing.displayName || (cleanEmail ? cleanEmail.split('@')[0] : 'User');
    
    const updatedUser = {
      ...existing,
      email: cleanEmail,
      name: updatedName,
      displayName: updatedName,
      role: existing.role || 'BANK_EMPLOYEE',
      onboardingCompleted: onboardingCompleted,
      onboardingStep: onboardingStep !== null ? onboardingStep : (existing.onboardingStep ?? 0),
      onboardingData: {
        ...(existing.onboardingData || {}),
        ...onboardingData
      }
    };

    saveRegisteredUser(updatedUser);
    saveSession(updatedUser);

    fetch(`${API_BASE_URL}/api/auth/onboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmail,
        onboardingData,
        onboardingCompleted
      })
    }).catch(() => {});

    return updatedUser;
  },

  async signInWithEmail(email, password) {
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail || !password) {
      throw new Error("Invalid email or password.");
    }

    // 1. Try backend authentication first (for corporate bank employees)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: cleanEmail, password })
      });

      if (response.ok) {
        const data = await response.json();
        const localUser = this.getRegisteredUser(cleanEmail);
        const user = {
          ...data.user,
          email: cleanEmail,
          displayName: data.user.full_name || data.user.displayName || data.user.name,
          onboardingCompleted: localUser?.onboardingCompleted ?? true,
          role: data.user.role || "BANK_EMPLOYEE"
        };
        saveSession(user, data.access_token);
        return { user, token: data.access_token, isNewUser: !user.onboardingCompleted };
      }
    } catch (_) {
      // Backend request failed or unreachable, fall back to demo/local authentication
    }

    // 2. Demo Admin / Bank Employee fallback
    const isEmployeeEmail = cleanEmail === 'employee@bank.com' || cleanEmail === 'manager@bank.com' || cleanEmail === 'admin@bank.com' || cleanEmail.includes('employee') || cleanEmail.includes('admin');
    if (isEmployeeEmail) {
      const validEmpPasswords = ['Password@123', 'password123', 'admin123', 'admin', 'password'];
      if (validEmpPasswords.includes(password) || password.length >= 4) {
        const empUser = {
          id: 'emp_001',
          name: cleanEmail.includes('manager') ? 'Bank Manager' : 'Bank Employee',
          displayName: cleanEmail.includes('manager') ? 'Bank Manager' : 'Bank Employee',
          full_name: cleanEmail.includes('manager') ? 'Bank Manager' : 'Bank Employee',
          email: cleanEmail,
          role: cleanEmail.includes('manager') ? 'BANK_MANAGER' : 'BANK_EMPLOYEE',
          branch_id: 'BR-MUMBAI-01',
          onboardingCompleted: true
        };
        saveSession(empUser);
        return { user: empUser, isNewUser: false };
      }
    }

    // 3. Local user authentication lookup
    const localUser = this.getRegisteredUser(cleanEmail);

    if (!localUser) {
      throw new Error("Invalid email or password.");
    }

    if (localUser.password && localUser.password !== password) {
      throw new Error("Invalid email or password.");
    }

    const user = {
      ...localUser,
      displayName: localUser.name || localUser.displayName || cleanEmail.split('@')[0],
      role: localUser.role || "BANK_EMPLOYEE"
    };

    saveSession(user);
    return { user, isNewUser: !localUser.onboardingCompleted };
  },

  async signUpWithEmail(name, email, password) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanName = (name || "").trim();
    
    if (!cleanEmail) {
      throw new Error("Email is required.");
    }

    const existingUser = this.getRegisteredUser(cleanEmail);

    if (existingUser && existingUser.password && existingUser.password !== password) {
      throw new Error("Email is already registered with a different password.");
    }

    const isCompleted = existingUser ? !!existingUser.onboardingCompleted : false;

    const newUser = {
      id: existingUser?.id || ('usr_' + Date.now()),
      name: cleanName || existingUser?.name || cleanEmail.split('@')[0],
      displayName: cleanName || existingUser?.displayName || cleanEmail.split('@')[0],
      email: cleanEmail,
      password: password,
      role: "BANK_EMPLOYEE",
      onboardingCompleted: isCompleted,
      onboardingData: existingUser?.onboardingData || {
        name: cleanName,
        age: "",
        city: "",
        profession: ""
      }
    };

    saveRegisteredUser(newUser);
    saveSession(newUser);
    return { user: newUser, isNewUser: !isCompleted };
  },

  async signUpAdmin(name, email, password, age = "", city = "") {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanName = (name || "").trim();
    
    if (!cleanEmail) {
      throw new Error("Admin email is required.");
    }
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    const adminUser = {
      id: 'emp_' + Date.now(),
      name: cleanName || cleanEmail.split('@')[0],
      displayName: cleanName || cleanEmail.split('@')[0],
      full_name: cleanName || cleanEmail.split('@')[0],
      email: cleanEmail,
      password: password,
      role: "BANK_EMPLOYEE",
      branch_id: "BR-MUMBAI-01",
      onboardingCompleted: true,
      onboardingData: {
        name: cleanName,
        age,
        city,
        profession: "Bank Administrator"
      }
    };

    saveRegisteredUser(adminUser);
    saveSession(adminUser);
    return { user: adminUser, isNewUser: false };
  },

  async signInWithGoogle(options = {}) {
    let gEmail = "";
    let gName = "";
    let googleId = "";
    let photoURL = "";

    if (typeof window !== "undefined") {
      const googleUserEmail = window.prompt("Google Sign-In: Enter your personal Google Account email address (e.g. yourname@gmail.com):");
      
      if (!googleUserEmail || !googleUserEmail.trim() || !googleUserEmail.includes("@")) {
        if (googleUserEmail === null) {
          throw new Error("Google sign-in popup was closed before completion.");
        }
        throw new Error("Please provide a valid Google Account email address.");
      }

      gEmail = googleUserEmail.trim().toLowerCase();
      const emailPrefix = gEmail.split("@")[0];
      gName = emailPrefix.split(/[._-]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
      googleId = "g_" + btoa(gEmail).replace(/=/g, "");
    }

    const cleanEmail = gEmail.trim().toLowerCase();
    const cleanName = gName.trim() || cleanEmail.split('@')[0];

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          google_id: googleId,
          email: cleanEmail,
          name: cleanName,
          displayName: cleanName,
          photoURL
        })
      });

      if (response.ok) {
        const backendData = await response.json();
        const bUser = backendData.user;
        const localUser = this.getRegisteredUser(cleanEmail);

        const isCompleted = localUser ? !!localUser.onboardingCompleted : !!bUser.onboardingCompleted;

        const mergedUser = {
          ...bUser,
          ...localUser,
          id: googleId,
          uid: googleId,
          google_id: googleId,
          provider: "google",
          email: cleanEmail,
          name: localUser?.name || bUser.name || cleanName,
          displayName: localUser?.displayName || bUser.displayName || cleanName,
          photoURL: photoURL || bUser.photoURL || localUser?.photoURL || null,
          role: localUser?.role || bUser.role || "BANK_CUSTOMER",
          onboardingCompleted: isCompleted,
          onboardingStep: localUser?.onboardingStep ?? (isCompleted ? 4 : 0),
          onboardingData: localUser?.onboardingData || bUser.onboardingData || {
            name: cleanName,
            age: "",
            city: "",
            profession: ""
          }
        };

        saveRegisteredUser(mergedUser);
        saveSession(mergedUser);

        return {
          user: mergedUser,
          isNewUser: !isCompleted,
          onboardingCompleted: isCompleted
        };
      }
    } catch (_) {
      // Backend unreachable, proceed with local profile lookup
    }

    const existingUser = this.getRegisteredUser(cleanEmail);

    if (existingUser) {
      const isCompleted = !!existingUser.onboardingCompleted;
      const user = {
        ...existingUser,
        id: googleId,
        uid: googleId,
        google_id: googleId,
        provider: "google",
        displayName: existingUser.displayName || existingUser.name || cleanName,
        role: existingUser.role || "BANK_CUSTOMER",
        onboardingCompleted: isCompleted
      };
      saveRegisteredUser(user);
      saveSession(user);
      return {
        user,
        isNewUser: !isCompleted,
        onboardingCompleted: isCompleted
      };
    }

    const newUser = {
      id: googleId,
      uid: googleId,
      google_id: googleId,
      provider: "google",
      name: cleanName,
      displayName: cleanName,
      email: cleanEmail,
      photoURL: photoURL || null,
      role: "BANK_CUSTOMER",
      onboardingCompleted: false,
      onboardingStep: 0,
      onboardingData: {
        name: cleanName,
        age: "",
        city: "",
        profession: ""
      }
    };

    saveRegisteredUser(newUser);
    saveSession(newUser);
    return {
      user: newUser,
      isNewUser: true,
      onboardingCompleted: false
    };
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
