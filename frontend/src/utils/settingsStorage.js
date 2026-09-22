const AUTO_NAVIGATE_KEY = 'settings_autoNavigate';

const getStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const getAutoNavigateSetting = () => {
  const storage = getStorage();
  if (!storage) {
    return false;
  }

  try {
    return storage.getItem(AUTO_NAVIGATE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setAutoNavigateSetting = (value) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(AUTO_NAVIGATE_KEY, value ? 'true' : 'false');
  } catch {
    // Ignore storage errors so settings never block the UI.
  }
};
