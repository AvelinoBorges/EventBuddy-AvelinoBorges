import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export const eventService = {
  // Buscar todos os eventos
  async getAllEvents() {
    try {
      const q = query(collection(db, 'events'), orderBy('datetime', 'asc'));
      const querySnapshot = await getDocs(q);
      const events = [];
      
      querySnapshot.forEach((doc) => {
        events.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, data: events };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Buscar evento específico
  async getEventById(eventId) {
    try {
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      
      if (eventDoc.exists()) {
        return { 
          success: true, 
          data: { id: eventDoc.id, ...eventDoc.data() } 
        };
      } else {
        return { success: false, error: 'Evento não encontrado' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Participar de um evento
  async participateInEvent(eventId, userId) {
    try {
      // Adicionar usuário à lista de participantes do evento
      await updateDoc(doc(db, 'events', eventId), {
        participants: arrayUnion(userId)
      });

      // Adicionar evento à lista de participações do usuário
      await updateDoc(doc(db, 'users', userId), {
        participations: arrayUnion(eventId)
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Cancelar participação em um evento
  async cancelParticipation(eventId, userId) {
    try {
      // Remover usuário da lista de participantes do evento
      await updateDoc(doc(db, 'events', eventId), {
        participants: arrayRemove(userId)
      });

      // Remover evento da lista de participações do usuário
      await updateDoc(doc(db, 'users', userId), {
        participations: arrayRemove(eventId)
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Adicionar evento aos favoritos
  async addToFavorites(eventId, userId) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        favorites: arrayUnion(eventId)
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Remover evento dos favoritos
  async removeFromFavorites(eventId, userId) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        favorites: arrayRemove(eventId)
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Buscar dados do usuário
  async getUserData(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        return { 
          success: true, 
          data: userDoc.data() 
        };
      } else {
        return { success: false, error: 'Usuário não encontrado' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
