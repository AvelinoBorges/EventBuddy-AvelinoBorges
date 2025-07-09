import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Buscar dados adicionais do usuário no Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUser({ ...user, ...userDoc.data() });
        } else {
          setUser(user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Criar documento do usuário no Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        favorites: [],
        participations: [],
        createdAt: new Date().toISOString(),
      });
      
      return { success: true };
    } catch (error) {
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      
      // Traduzir erros comuns do Firebase para mensagens amigáveis
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este email já está em uso. Tente fazer login ou use outro email.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido. Verifique o formato do email.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres com letras e números.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
          break;
        default:
          errorMessage = `Erro ao criar conta. Tente novamente.`;
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      let errorMessage = 'Erro desconhecido. Tente novamente.';
      
      // Traduzir erros comuns do Firebase para mensagens amigáveis
      switch (error.code) {
        case 'auth/invalid-credential':
          errorMessage = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado. Verifique o email ou crie uma nova conta.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta. Tente novamente ou redefina sua senha.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido. Verifique o formato do email.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta conta foi desabilitada. Entre em contato com o suporte.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas de login. Tente novamente em alguns minutos.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
          break;
        default:
          errorMessage = `Erro na autenticação. Tente novamente.`;
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      let errorMessage = 'Erro ao sair da conta. Tente novamente.';
      
      switch (error.code) {
        case 'auth/network-request-failed':
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          break;
        default:
          errorMessage = 'Erro ao sair da conta. Tente novamente.';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    register,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
