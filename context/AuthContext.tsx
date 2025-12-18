import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { auth, db } from '../firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { 
  doc, getDoc, setDoc, updateDoc, deleteDoc, 
  collection, query, where, getDocs, onSnapshot 
} from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  usersList: User[]; 
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  changePassword: (oldPass: string, newPass: string) => Promise<{success: boolean, message: string}>;
  resetPasswordRequest: (email: string) => Promise<{success: boolean, message: string}>;
  verifyOtpAndResetPassword: (email: string, otp: string, newPass: string) => Promise<{success: boolean, message: string}>;
  inviteUser: (email: string, name: string, role: UserRole) => Promise<void>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUserProfile: (data: { name?: string; avatar?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState<User[]>([]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser({ ...userData, id: firebaseUser.uid, email: firebaseUser.email! });
        } else {
          // Check for pending invite by email
          const q = query(
            collection(db, "users"), 
            where("email", "==", firebaseUser.email), 
            where("isInvited", "==", true)
          );
          const inviteSnapshot = await getDocs(q);
          
          let newUser: User;

          if (!inviteSnapshot.empty) {
            // Claim invite
            const inviteDoc = inviteSnapshot.docs[0];
            const inviteData = inviteDoc.data() as User;
            
            newUser = {
              ...inviteData,
              id: firebaseUser.uid,
              isInvited: false, // Activate user
              avatar: firebaseUser.photoURL || inviteData.avatar || `https://ui-avatars.com/api/?name=${firebaseUser.email}&background=random`
            };

            // Remove temporary invite doc
            await deleteDoc(doc(db, "users", inviteDoc.id));
          } else {
            // New User Fallback
            newUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              role: 'EDITOR', // Default role
              avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.email}&background=random`
            };
          }

          // Create real user doc
          await setDoc(userDocRef, newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
        setUsersList([]); // Clear list on logout
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch Users List (Realtime) if Admin
  useEffect(() => {
    if (user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')) {
      const q = query(collection(db, "users"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
        setUsersList(users);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const changePassword = async (oldPass: string, newPass: string) => {
    return { success: false, message: 'Please use the "Forgot Password" flow for Firebase security.' };
  };

  const resetPasswordRequest = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent!' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  const verifyOtpAndResetPassword = async () => {
    return { success: false, message: 'Check your email to complete the reset.' };
  };

  const inviteUser = async (email: string, name: string, role: UserRole) => {
    // Check if user already exists
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error("User with this email already exists.");
    }

    const tempId = `invite_${Date.now()}`;
    const newUser: User = {
      id: tempId,
      email,
      name,
      role,
      avatar: `https://ui-avatars.com/api/?name=${name}&background=random`,
      isInvited: true
    };
    
    await setDoc(doc(db, "users", tempId), newUser);
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    await updateDoc(doc(db, "users", userId), { role: newRole });
  };

  const deleteUser = async (userId: string) => {
    await deleteDoc(doc(db, "users", userId));
  };

  const updateUserProfile = async (data: { name?: string; avatar?: string }) => {
    if (!auth.currentUser || !user) return;

    try {
      await updateProfile(auth.currentUser, {
        displayName: data.name || user.name,
        photoURL: data.avatar || user.avatar
      });

      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        ...(data.name && { name: data.name }),
        ...(data.avatar && { avatar: data.avatar })
      });

      setUser(prev => prev ? ({ ...prev, ...data }) : null);
    } catch (error) {
      console.error("Failed to update profile", error);
      throw error;
    }
  };

  if (loading) {
    return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Loading Network...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      user, usersList, login, logout, isAuthenticated: !!user,
      changePassword, resetPasswordRequest, verifyOtpAndResetPassword,
      inviteUser, updateUserRole, deleteUser, updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};