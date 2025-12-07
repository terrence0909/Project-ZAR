// src/contexts/AuthContext.tsx - Working version
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: 'admin' | 'compliance' | 'viewer';
}

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for development
const mockUsers: UserProfile[] = [
  {
    email: 'admin@projectzar.com',
    firstName: 'Admin',
    lastName: 'User',
    phoneNumber: '+27123456789',
    role: 'admin'
  },
  {
    email: 'compliance@projectzar.com',
    firstName: 'Compliance',
    lastName: 'Officer',
    phoneNumber: '+27123456788',
    role: 'compliance'
  },
  {
    email: 'viewer@projectzar.com',
    firstName: 'Read',
    lastName: 'Only',
    phoneNumber: '+27123456787',
    role: 'viewer'
  }
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = async () => {
    try {
      const storedUser = localStorage.getItem('project-zar-user');
      const storedProfile = localStorage.getItem('project-zar-profile');
      
      if (storedUser && storedProfile) {
        setUser(JSON.parse(storedUser));
        setProfile(JSON.parse(storedProfile));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userProfile = mockUsers.find(u => u.email === email);
      
      if (userProfile) {
        const mockUser = {
          username: email,
          attributes: {
            email: userProfile.email,
            given_name: userProfile.firstName,
            family_name: userProfile.lastName,
            phone_number: userProfile.phoneNumber
          }
        };
        
        setUser(mockUser);
        setProfile(userProfile);
        
        localStorage.setItem('project-zar-user', JSON.stringify(mockUser));
        localStorage.setItem('project-zar-profile', JSON.stringify(userProfile));
        
        toast.success('Successfully signed in!');
        navigate('/dashboard');
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('project-zar-user');
    localStorage.removeItem('project-zar-profile');
    setUser(null);
    setProfile(null);
    toast.success('Successfully signed out');
    navigate('/auth');
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};