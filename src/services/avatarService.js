import { storage, db } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export const avatarService = {
  /**
   * Fazer upload de uma nova imagem de avatar
   * @param {string} userId - ID do usuário
   * @param {string} imageUri - URI da imagem selecionada
   * @returns {Object} - Resultado da operação
   */
  uploadAvatar: async (userId, imageUri) => {
    try {
      console.log('Iniciando upload de avatar para usuário:', userId);
      
      // Criar referência no Storage
      const avatarRef = ref(storage, `avatars/${userId}/avatar.jpg`);
      
      // Converter URI para blob (para web) ou usar diretamente (mobile)
      let blob;
      if (imageUri.startsWith('data:')) {
        // Se é base64
        const response = await fetch(imageUri);
        blob = await response.blob();
      } else if (imageUri.startsWith('file://')) {
        // Se é arquivo local (mobile)
        const response = await fetch(imageUri);
        blob = await response.blob();
      } else {
        // URL remota
        const response = await fetch(imageUri);
        blob = await response.blob();
      }
      
      // Fazer upload
      const snapshot = await uploadBytes(avatarRef, blob);
      console.log('Upload concluído:', snapshot);
      
      // Obter URL de download
      const downloadURL = await getDownloadURL(avatarRef);
      console.log('URL de download obtida:', downloadURL);
      
      // Atualizar documento do usuário no Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        avatarUrl: downloadURL,
        updatedAt: new Date()
      });
      
      console.log('Avatar atualizado no Firestore');
      
      return {
        success: true,
        avatarUrl: downloadURL
      };
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Remover avatar do usuário
   * @param {string} userId - ID do usuário
   * @returns {Object} - Resultado da operação
   */
  removeAvatar: async (userId) => {
    try {
      console.log('Removendo avatar do usuário:', userId);
      
      // Primeiro, verificar se o usuário tem um avatar
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists() && userDoc.data().avatarUrl) {
        // Remover arquivo do Storage
        const avatarRef = ref(storage, `avatars/${userId}/avatar.jpg`);
        try {
          await deleteObject(avatarRef);
          console.log('Arquivo removido do Storage');
        } catch (storageError) {
          // Se o arquivo não existir no Storage, continuar mesmo assim
          console.log('Arquivo não encontrado no Storage:', storageError.message);
        }
      }
      
      // Remover URL do avatar do Firestore
      await updateDoc(userRef, {
        avatarUrl: null,
        updatedAt: new Date()
      });
      
      console.log('Avatar removido do Firestore');
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Erro ao remover avatar:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obter URL do avatar do usuário
   * @param {string} userId - ID do usuário
   * @returns {Object} - Resultado da operação
   */
  getUserAvatar: async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          success: true,
          avatarUrl: userData.avatarUrl || null
        };
      }
      
      return {
        success: true,
        avatarUrl: null
      };
    } catch (error) {
      console.error('Erro ao obter avatar do usuário:', error);
      return {
        success: false,
        error: error.message,
        avatarUrl: null
      };
    }
  }
};
