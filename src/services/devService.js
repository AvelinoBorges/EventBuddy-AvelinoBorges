import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export const devService = {
  // Função para garantir que datas dos eventos de exemplo sejam futuras
  generateFutureDate(daysFromNow, hour = 9, minute = 0) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(hour, minute, 0, 0);
    return date;
  },

  async addSampleEvents() {
    const sampleEvents = [
      {
        title: "Festival de Música de Verão",
        description: "Um incrível festival de música ao ar livre com artistas nacionais e internacionais. Venha desfrutar de um dia inteiro de música, comida e diversão em família. O evento contará com 3 palcos diferentes, área gastronômica e atividades para crianças.",
        location: "Parque da Cidade, Lisboa",
        latitude: 38.7589,
        longitude: -9.1507,
        datetime: this.generateFutureDate(15, 18, 0), // 15 dias no futuro às 18:00
        imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
        type: "cultural",
        category: "música",
        participants: [],
        price: "Gratuito",
        organizer: "Câmara Municipal de Lisboa"
      },
      {
        title: "Workshop de Programação React Native",
        description: "Aprenda a desenvolver aplicações móveis com React Native neste workshop prático de 8 horas. Incluí material didático, certificado de participação e coffee breaks. Ideal para iniciantes e desenvolvedor com experiência em React.",
        location: "Centro de Inovação, Porto",
        latitude: 41.1579,
        longitude: -8.6291,
        datetime: this.generateFutureDate(40, 9, 0), // 40 dias no futuro às 9:00
        imageUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800",
        type: "workshop",
        category: "tecnologia",
        participants: [],
        price: "€50",
        organizer: "TechHub Porto"
      },
      {
        title: "Conferência de Tecnologia 2025",
        description: "A maior conferência de tecnologia do país está de volta! Três dias repletos de palestras inspiradoras, networking e as últimas tendências em IA, blockchain e desenvolvimento de software. Speakers internacionais confirmados.",
        location: "Centro de Congressos, Coimbra",
        latitude: 40.2033,
        longitude: -8.4103,
        datetime: this.generateFutureDate(65, 8, 30), // 65 dias no futuro às 8:30
        imageUrl: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800",
        type: "conference",
        category: "tecnologia",
        participants: [],
        price: "€120",
        organizer: "Tech Conference PT"
      },
      {
        title: "Feira Gastronômica Internacional",
        description: "Experimente sabores de todo o mundo nesta feira gastronômica especial. Mais de 50 stands com comidas típicas de diferentes países, shows culturais e atividades para toda a família. Entrada gratuita.",
        location: "Praça do Comércio, Lisboa",
        latitude: 38.7071,
        longitude: -9.1364,
        datetime: this.generateFutureDate(20, 11, 0), // 20 dias no futuro às 11:00
        imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
        type: "cultural",
        category: "gastronomia",
        participants: [],
        price: "Gratuito",
        organizer: "Turismo de Lisboa"
      },
      {
        title: "Corrida Solidária da Cidade",
        description: "Participe na corrida solidária anual da cidade! 5km e 10km disponíveis para todos os níveis. As inscrições revertem para instituições de caridade locais. Inclui t-shirt oficial, medalha de participação e lanche pós-corrida.",
        location: "Marginal de Cascais",
        latitude: 38.6979,
        longitude: -9.4215,
        datetime: this.generateFutureDate(10, 7, 0), // 10 dias no futuro às 7:00 (manhã cedo para corrida)
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
        type: "sports",
        category: "esportes",
        participants: [],
        price: "€15",
        organizer: "Município de Cascais"
      },
      {
        title: "Exposição de Arte Contemporânea",
        description: "Uma exposição única com obras de artistas contemporâneos portugueses e internacionais. Explore diferentes formas de expressão artística e participe em workshops criativos aos fins de semana. Exposição aberta durante todo o mês.",
        location: "Museu Nacional de Arte Antiga, Lisboa",
        latitude: 38.7032,
        longitude: -9.1625,
        datetime: this.generateFutureDate(30, 10, 0), // 30 dias no futuro às 10:00
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
        type: "cultural",
        category: "arte",
        participants: [],
        price: "€8",
        organizer: "Museu Nacional de Arte Antiga"
      },
      {
        title: "Concerto de Jazz no Jardim",
        description: "Uma noite mágica de jazz ao ar livre com músicos renomados. Ambiente intimista no jardim botânico com vista para a cidade. Traga uma manta e desfrute de boa música sob as estrelas. Bar e petiscos disponíveis.",
        location: "Jardim Botânico, Lisboa",
        latitude: 38.7280,
        longitude: -9.1530,
        datetime: this.generateFutureDate(8, 20, 0), // 8 dias no futuro às 20:00
        imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
        type: "concert",
        category: "música",
        participants: [],
        price: "€25",
        organizer: "Jazz Club Lisboa"
      },
      {
        title: "Workshop de Fotografia Digital",
        description: "Aprenda técnicas profissionais de fotografia digital com equipamento fornecido. Inclui teoria, prática no exterior e edição básica. Ideal para iniciantes que querem melhorar suas habilidades fotográficas.",
        location: "Escola de Artes, Braga",
        latitude: 41.5518,
        longitude: -8.4229,
        datetime: this.generateFutureDate(12, 14, 0), // 12 dias no futuro às 14:00
        imageUrl: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800",
        type: "workshop",
        category: "arte",
        participants: [],
        price: "€45",
        organizer: "Escola de Artes de Braga"
      }
    ];

    try {
      const promises = sampleEvents.map(event => 
        addDoc(collection(db, 'events'), event)
      );
      
      await Promise.all(promises);
      return { success: true, message: 'Eventos de exemplo adicionados com sucesso!' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
