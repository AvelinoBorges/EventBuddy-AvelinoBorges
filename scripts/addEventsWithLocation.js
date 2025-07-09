const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Você precisa baixar isso do Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const eventsWithLocation = [
  {
    title: "Festival de Música de Verão",
    description: "Um incrível festival de música ao ar livre com artistas nacionais e internacionais. Venha desfrutar de um dia inteiro de música, comida e diversão em família.",
    location: "Parque da Cidade, Lisboa",
    latitude: 38.7589,
    longitude: -9.1507,
    date: "2025-07-15",
    time: "18:00",
    datetime: new Date("2025-07-15T18:00:00.000Z"),
    category: "música",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
    participants: [],
    price: "Gratuito",
    organizer: "Câmara Municipal de Lisboa"
  },
  {
    title: "Workshop de Programação React Native",
    description: "Aprenda a desenvolver aplicações móveis com React Native neste workshop prático de 8 horas. Inclui material didático e certificado.",
    location: "Centro de Inovação, Porto",
    latitude: 41.1579,
    longitude: -8.6291,
    date: "2025-08-10",
    time: "09:00",
    datetime: new Date("2025-08-10T09:00:00.000Z"),
    category: "tecnologia",
    imageUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800",
    participants: [],
    price: "€50",
    organizer: "TechHub Porto"
  },
  {
    title: "Conferência de Tecnologia 2025",
    description: "A maior conferência de tecnologia do país! Três dias de palestras inspiradoras, networking e tendências em IA, blockchain e desenvolvimento.",
    location: "Centro de Congressos, Coimbra",
    latitude: 40.2033,
    longitude: -8.4103,
    date: "2025-09-05",
    time: "08:30",
    datetime: new Date("2025-09-05T08:30:00.000Z"),
    category: "tecnologia",
    imageUrl: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800",
    participants: [],
    price: "€120",
    organizer: "Tech Conference PT"
  },
  {
    title: "Feira Gastronômica Internacional",
    description: "Experimente sabores de todo o mundo! Mais de 50 stands com comidas típicas de diferentes países, shows culturais e atividades familiares.",
    location: "Praça do Comércio, Lisboa",
    latitude: 38.7071,
    longitude: -9.1364,
    date: "2025-07-20",
    time: "11:00",
    datetime: new Date("2025-07-20T11:00:00.000Z"),
    category: "gastronomia",
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
    participants: [],
    price: "Gratuito",
    organizer: "Turismo de Lisboa"
  },
  {
    title: "Corrida Solidária da Cidade",
    description: "Participe na corrida solidária anual! 5km e 10km para todos os níveis. Inscrições revertem para caridade local.",
    location: "Marginal de Cascais",
    latitude: 38.6979,
    longitude: -9.4215,
    date: "2025-08-25",
    time: "07:00",
    datetime: new Date("2025-08-25T07:00:00.000Z"),
    category: "esportes",
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
    participants: [],
    price: "€15",
    organizer: "Município de Cascais"
  },
  {
    title: "Exposição de Arte Contemporânea",
    description: "Uma fascinante exposição com obras de artistas portugueses contemporâneos. Entrada livre para estudantes.",
    location: "Museu Nacional de Arte Antiga, Lisboa",
    latitude: 38.7032,
    longitude: -9.1625,
    date: "2025-07-30",
    time: "10:00",
    datetime: new Date("2025-07-30T10:00:00.000Z"),
    category: "arte",
    imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
    participants: [],
    price: "€8",
    organizer: "Museu Nacional de Arte Antiga"
  },
  {
    title: "Workshop de Culinária Portuguesa",
    description: "Aprenda a cozinhar pratos tradicionais portugueses com chefs experientes. Inclui degustação e receitas para casa.",
    location: "Escola de Hotelaria, Faro",
    latitude: 37.0194,
    longitude: -7.9322,
    date: "2025-08-15",
    time: "14:00",
    datetime: new Date("2025-08-15T14:00:00.000Z"),
    category: "gastronomia",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
    participants: [],
    price: "€35",
    organizer: "Escola de Hotelaria do Algarve"
  },
  {
    title: "Conferência de Negócios e Empreendedorismo",
    description: "Conecte-se com empreendedores e investidores. Palestras sobre inovação, startups e tendências de mercado.",
    location: "Centro de Congressos, Braga",
    latitude: 41.5518,
    longitude: -8.4229,
    date: "2025-09-12",
    time: "09:30",
    datetime: new Date("2025-09-12T09:30:00.000Z"),
    category: "negócios",
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800",
    participants: [],
    price: "€80",
    organizer: "Associação Empresarial de Braga"
  }
];

async function addEventsWithLocation() {
  try {
    console.log('Adicionando eventos com localização...');
    
    for (const eventData of eventsWithLocation) {
      await db.collection('events').add(eventData);
      console.log(`✅ Evento "${eventData.title}" adicionado com sucesso!`);
    }
    
    console.log('🎉 Todos os eventos foram adicionados com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar eventos:', error);
    process.exit(1);
  }
}

addEventsWithLocation();
