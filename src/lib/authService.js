// API Base URL
const API_BASE_URL = 'http://localhost:5001/api';

// JWT Authentication Service
class AuthService {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = null;
    
    // Load user from localStorage if token exists
    if (this.token) {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          this.user = JSON.parse(userData);
        } catch (error) {
          console.error('Error parsing user data:', error);
          this.clearAuth();
        }
      }
    }
  }

  // Get current token
  getToken() {
    return this.token;
  }

  // Get current user
  getUser() {
    return this.user;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  // Set authentication data
  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Clear authentication data
  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Get authorization headers
  getAuthHeaders() {
    if (!this.token) {
      return {};
    }
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  // Make authenticated API request
  async makeRequest(url, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, config);
      const data = await response.json();

      // Handle token expiration
      if (response.status === 401 && data.message === 'Token expired') {
        this.clearAuth();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Sign up user
  async signUp(fullName, email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName,
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Set authentication data
      this.setAuth(data.data.token, data.data.user);

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  }

  // Sign in user
  async signIn(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Set authentication data
      this.setAuth(data.data.token, data.data.user);

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Signin error:', error);
      return { success: false, error: error.message };
    }
  }

  // Sign out user
  async signOut() {
    try {
      this.clearAuth();
      return { success: true };
    } catch (error) {
      console.error('Signout error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      const data = await this.makeRequest('/auth/me');
      
      // Update user data
      this.user = data.data.user;
      localStorage.setItem('user', JSON.stringify(this.user));
      
      return { success: true, data: data.data };
    } catch (error) {
      console.error('Get user error:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify token validity
  async verifyToken() {
    try {
      if (!this.token) {
        return { success: false, error: 'No token found' };
      }

      const data = await this.makeRequest('/auth/verify-token', {
        method: 'POST'
      });

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Token verification error:', error);
      // Clear invalid token
      this.clearAuth();
      return { success: false, error: error.message };
    }
  }

  // Initialize authentication state
  async initializeAuth() {
    try {
      if (!this.token) {
        return { success: false, error: 'No token found' };
      }

      // Verify token and get fresh user data
      const verifyResult = await this.verifyToken();
      
      if (verifyResult.success) {
        return { success: true, user: this.user };
      } else {
        this.clearAuth();
        return { success: false, error: 'Token verification failed' };
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.clearAuth();
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;