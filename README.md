# 📱 Event Buddy - Instalação e Execução

Aplicação React Native para descobrir e participar em eventos locais. Desenvolvida com Expo e Firebase.

## 🚀 Instalação Rápida

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Firebase
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative Authentication (Email/Password) e Firestore Database
3. Copie as credenciais para o arquivo `.env`:

```env
FIREBASE_API_KEY=sua_api_key
FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
FIREBASE_PROJECT_ID=seu_projeto_id
FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
FIREBASE_APP_ID=seu_app_id
```

### 3. Executar
```bash
# Iniciar o servidor
npx expo start

# Escanear QR code com Expo Go app
# ou executar em simulador
npx expo start --android
npx expo start --ios
```

## 📊 Adicionar Dados de Teste
```bash
# Adicionar eventos de exemplo
node scripts/addSampleEvents.js
```

## 🔧 Regras do Firestore
No Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.createdBy;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/favorites/{favoriteId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/participations/{participationId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🌟 Funcionalidades
- ✅ Autenticação segura
- ✅ Lista de eventos com filtros
- ✅ Mapa interativo
- ✅ Navegação externa (Google Maps, Waze, Apple Maps)
- ✅ Sistema de favoritos
- ✅ Participação em eventos
- ✅ Notificações push
- ✅ Tema escuro/claro
- ✅ Perfil personalizado

## 🐛 Problemas Comuns
- **Erro @env**: Verifique se o arquivo `.env` existe e reinicie com `npx expo start --clear`
- **Firebase não inicializado**: Confirme as credenciais no `.env`

## 👨‍💻 Desenvolvedor
**Avelino Borges**  
📧 borges94avelino@gmail.com  
📱 +351 920 490 411

---
**Desenvolvido com React Native + Firebase**


