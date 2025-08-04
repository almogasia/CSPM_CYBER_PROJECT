// Utility function to get the current user's token
// Prioritizes sessionStorage (tab-specific) over localStorage (shared across tabs)
export const getAuthToken = (): string | null => {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
};

// Utility function to set the current user's token
// Uses sessionStorage for tab-specific storage
export const setAuthToken = (token: string): void => {
  sessionStorage.setItem("token", token);
};

// Utility function to get the current user's username
export const getAuthUsername = (): string | null => {
  return sessionStorage.getItem("username") || localStorage.getItem("username");
};

// Utility function to set the current user's username
export const setAuthUsername = (username: string): void => {
  sessionStorage.setItem("username", username);
};

// Utility function to clear authentication data
export const clearAuth = (): void => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("username");
  localStorage.removeItem("token");
  localStorage.removeItem("username");
}; 