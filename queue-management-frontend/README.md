# Système Intelligent de Gestion Dynamique des Files d'Attente — Frontend

Application Angular 17 (standalone components) + Angular Material + SignalR, consommant l'API backend ASP.NET Core.

## 1. Prérequis

- Node.js 18+ (testé avec Node 22)
- Le backend ASP.NET Core doit tourner (voir le README du projet backend)

## 2. Installation

```bash
cd queue-management-frontend
npm install
```

## 3. Configuration de l'URL de l'API

Fichier `src/environments/environment.development.ts` :

```ts
export const environment = {
  production: false,
  apiUrl: 'https://localhost:5101/api',
  hubUrl: 'https://localhost:5101/hubs/queue'
};
```

Adaptez le port si votre API backend tourne sur un autre port (`dotnet run` affiche l'URL exacte au démarrage).

## 4. Lancer l'application

```bash
npm start
```

Ouvrez `http://localhost:4200`.

> Si le navigateur bloque les requêtes à cause du certificat HTTPS de développement de l'API .NET, exécutez une fois côté backend : `dotnet dev-certs https --trust`.

## 5. Comptes de test

- **Admin** (créé automatiquement par le backend) : `admin@queuemanagement.tn` / `Admin@123`
- **Agent** : à créer depuis `/admin/users` une fois connecté en Admin
- **Client** : inscription libre depuis `/auth/register`, ou prise de ticket anonyme sans compte

## 6. Structure du projet

```
src/app/
├── core/
│   ├── models/         -> Interfaces TypeScript (miroir des DTOs backend)
│   ├── services/        -> Services HTTP (Auth, Service, Guichet, Ticket, Agent, User, Stats, SignalR)
│   ├── guards/           -> authGuard / roleGuard
│   └── interceptors/     -> Intercepteur JWT
├── layout/
│   └── main-layout/      -> Layout avec navbar
├── shared/components/navbar/
├── features/
│   ├── auth/             -> login, register
│   ├── client/            -> take-ticket, track-ticket, my-tickets, public-display
│   ├── agent/             -> workspace (connexion guichet, appel, actions sur ticket)
│   └── admin/             -> dashboard, services, guichets, users, stats
├── app.routes.ts          -> Routes avec lazy loading + roleGuard
└── app.config.ts          -> HttpClient + intercepteur + Material + Router
```

## 7. Fonctionnalités couvertes

### Module Client
- Sélection du service et prise de ticket (avec impression)
- Suivi en temps réel (position, temps estimé, alerte "votre tour approche") via SignalR + polling de secours
- Historique "Mes tickets" (clients authentifiés)
- Écran public d'affichage (ticket en cours / dernier appelé par service), pensé pour un affichage TV en salle d'attente

### Module Agent
- Connexion/déconnexion à un guichet
- Appel du prochain ticket, rappel, mise en attente, remise en file, annulation, démarrage et clôture du traitement
- Pause / reprise du guichet
- Visualisation de la file d'attente du guichet en temps réel

### Module Admin
- Tableau de bord temps réel (KPIs, mis à jour via SignalR)
- CRUD services (activation/désactivation)
- CRUD guichets + affectation dynamique des services + suivi du statut
- Gestion des comptes agents/admin (création, activation, suppression)
- Statistiques journalières / hebdomadaires / mensuelles + **export PDF et Excel**

## 8. Notes techniques

- Composants **standalone** (pas de NgModules), conformément à Angular 17.
- État réactif via **signals** (`signal`, `computed`) plutôt que des `BehaviorSubject` pour l'état simple des composants.
- Authentification : token JWT stocké dans `localStorage`, injecté automatiquement par `authInterceptor`. Une réponse 401 déconnecte automatiquement l'utilisateur.
- `SignalrService` gère une connexion unique réutilisée entre les pages (groupes par service / guichet / admin).

## 9. Prochaines étapes suggérées

- Ajouter un intercepteur de chargement global (spinner) pour toutes les requêtes HTTP.
- Ajouter des tests unitaires (Jasmine/Karma déjà configurés par défaut).
- Gérer le renouvellement du token (refresh token) si des sessions longues sont nécessaires.
- Ajouter la pagination sur les tableaux (utilisateurs, guichets) si le volume grandit.
