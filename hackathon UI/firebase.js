// Standalone Google Auth Module (Firebase-free)

export const auth = {
  onAuthStateChanged: (callback) => {
    try {
      const session = JSON.parse(localStorage.getItem('demo_session'));
      setTimeout(() => callback(session), 0);
    } catch (_) {
      setTimeout(() => callback(null), 0);
    }
    return () => {};
  }
};

export const googleProvider = null;
