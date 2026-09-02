# Système Intelligent de Gestion Dynamique des Files d'Attente — Backend

API REST développée en **ASP.NET Core 9**, **Entity Framework Core**, **SQL Server**, **JWT** et **SignalR**, conforme au cahier des charges (modules Client / Agent / Administrateur).

## 1. Prérequis

- .NET 9 SDK
- SQL Server (LocalDB, Express ou complet) / SSMS
- Visual Studio 2022 ou VS Code

## 2. Installation

```bash
cd QueueManagementAPI
dotnet restore
```

Modifiez la chaîne de connexion dans `QueueManagementAPI/appsettings.json` si nécessaire :

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=.\\SQLEXPRESS;Database=QueueManagementDB;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
}
```

Changez aussi `JwtSettings:SecretKey` par une valeur secrète longue et aléatoire avant la mise en production.

## 3. Créer la base de données (migrations EF Core)

```bash
cd QueueManagementAPI
dotnet tool install --global dotnet-ef   # si pas déjà installé
dotnet ef migrations add InitialCreate
dotnet ef database update
```

Au premier démarrage, l'application :
- applique automatiquement les migrations (`Database.MigrateAsync`),
- crée les rôles `Admin`, `Agent`, `Client`,
- crée un compte admin par défaut : **admin@queuemanagement.tn / Admin@123**,
- crée 3 services de démonstration.

## 4. Lancer l'API

```bash
dotnet run --project QueueManagementAPI
```

Swagger sera disponible sur `https://localhost:5101/swagger` (ou le port affiché dans la console).

## 5. Architecture du projet

```
QueueManagementAPI/
├── Controllers/
│   ├── AuthController.cs        -> Inscription / connexion / JWT
│   ├── UsersController.cs       -> Gestion des utilisateurs (Admin)
│   ├── ServicesController.cs    -> CRUD des services (Admin) + lecture publique
│   ├── GuichetsController.cs    -> CRUD guichets, affectation services, connexion agent
│   ├── TicketsController.cs     -> Prise de ticket, suivi, file d'attente (Client)
│   ├── AgentController.cs       -> Appel, rappel, hold, cancel, close (Agent)
│   └── StatsController.cs       -> Dashboard, stats journalières/hebdo/mensuelles, exports PDF/Excel
├── Models/                      -> Entités EF Core (Service, Guichet, Ticket, ApplicationUser...)
├── DTOs/                        -> Contrats d'entrée/sortie de l'API
├── Data/
│   ├── ApplicationDbContext.cs
│   └── DbSeeder.cs
├── Services/
│   ├── TokenService.cs          -> Génération des tokens JWT
│   └── TicketQueueService.cs    -> Numérotation des tickets, position, estimation du temps d'attente
├── Hubs/
│   └── QueueHub.cs              -> SignalR (temps réel)
└── Program.cs
```

## 6. Rôles et sécurité

Trois rôles : `Admin`, `Agent`, `Client`, gérés par ASP.NET Identity + JWT.
Chaque endpoint sensible est protégé par `[Authorize(Roles = "...")]`. Un agent est lié à un `GuichetId`, injecté comme claim dans le token (`guichetId`), ce qui permet de vérifier qu'il n'agit que sur son propre guichet.

## 7. Temps réel (SignalR)

Hub exposé sur `/hubs/queue`. Le front-end doit :
1. Se connecter avec le token JWT (`?access_token=...` ou header Authorization selon le client SignalR utilisé).
2. Rejoindre un groupe : `JoinServiceGroup(serviceId)`, `JoinGuichetGroup(guichetId)` ou `JoinAdminGroup()`.
3. Écouter les évènements : `TicketCree`, `TicketAppele`, `TicketMisAJour`, `GuichetStatutChange`, `DashboardMisAJour`.

## 8. Principaux endpoints

### Auth
- `POST /api/auth/register` — inscription client
- `POST /api/auth/register-agent` — création agent/admin (Admin)
- `POST /api/auth/login`
- `GET /api/auth/me`

### Services (Admin + lecture publique)
- `GET /api/services`
- `POST /api/services` / `PUT /api/services/{id}` / `DELETE /api/services/{id}`
- `PATCH /api/services/{id}/toggle`

### Guichets
- `GET /api/guichets`
- `POST /api/guichets` (Admin)
- `POST /api/guichets/{id}/services` — affectation dynamique (Admin)
- `PATCH /api/guichets/{id}/statut` (Agent/Admin)
- `POST /api/guichets/{id}/connect` / `disconnect` (Agent)

### Tickets (public/client)
- `POST /api/tickets` — prise de ticket
- `GET /api/tickets/{id}/statut` — suivi position + temps estimé
- `GET /api/tickets/service/{serviceId}/en-cours`
- `GET /api/tickets/service/{serviceId}/dernier-appele`
- `GET /api/tickets/mes-tickets` (Client authentifié)

### Agent
- `POST /api/agent/guichets/{guichetId}/next` — appeler le prochain
- `POST /api/agent/tickets/{id}/recall|hold|requeue|cancel|start|close`
- `PATCH /api/agent/guichets/{id}/pause|resume`

### Statistiques (Admin)
- `GET /api/admin/stats/dashboard`
- `GET /api/admin/stats/daily|weekly|monthly`
- `GET /api/admin/stats/export/pdf?debut=...&fin=...`
- `GET /api/admin/stats/export/excel?debut=...&fin=...`

## 9. Prochaines étapes suggérées

- Ajouter FluentValidation pour des règles de validation plus poussées.
- Ajouter des tests unitaires (xUnit) sur `TicketQueueService` et les contrôleurs.
- Brancher un vrai système de notifications push (Web Push / e-mail) en plus de SignalR.
- Ajouter la pagination sur les listes (tickets, utilisateurs).
