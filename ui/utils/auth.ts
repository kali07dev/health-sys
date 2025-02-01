export const setToken = (token: string): void => {
    localStorage.setItem('token', token);
  };
  
  export const getToken = (): string | null => {
    return localStorage.getItem('token');
  };
  
  export const removeToken = (): void => {
    localStorage.removeItem('token');
  };
  
  export const isAuthenticated = (): boolean => {
    return !!getToken();
  };
  
  interface JWTPayload {
    role: string;
    [key: string]: any;  // For other potential JWT claims
  }
  
  export const getUserRole = (): string | null => {
    const token = getToken();
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as JWTPayload;
      return payload.role;
    } catch {
      return null;
    }
  };