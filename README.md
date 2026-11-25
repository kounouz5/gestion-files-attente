# Système intelligent de gestion dynamique des files d'attente

Application web full-stack de gestion des files d'attente pour les organismes publics et privés
(Poste Tunisienne, CNSS, Tunisie Télécom, banques, administrations).
Les clients prennent un ticket et suivent leur position en temps réel, les agents gèrent les appels
depuis leur guichet, et les administrateurs supervisent tout le système via un tableau de bord.

> Projet réalisé en binôme par **Kounouz Derbel** et **Eya Abid** — stage chez **ASM, Sfax** (juin – août 2026).

## Fonctionnalités

| Espace | Fonctionnalités |
|---|---|
| **Client** | Choix du service, génération du ticket, suivi de la file en temps réel, estimation du temps d'attente, notifications quand le tour approche |
| **Agent** | Appel du prochain ticket, rappel, mise en attente, pause du guichet, clôture du traitement |
| **Administrateur** | Gestion des services, guichets et agents, rôles et permissions, tableau de bord, statistiques journalières / hebdomadaires / mensuelles, export PDF et Excel |

## Technologies

| Partie | Outils |
|---|---|
| Front-end | **Angular 17**, TypeScript, Angular Material, client SignalR |
| Back-end | **ASP.NET Core** Web API, Entity Framework Core, ASP.NET Identity |
| Sécurité | Authentification **JWT**, gestion des rôles (Admin, Agent, Client) |
| Temps réel | **SignalR** |
| Base de données | **SQL Server** (migrations EF Core) |
| Exports | QuestPDF (PDF), ClosedXML (Excel) |
| Documentation API | Swagger |
| Outils | Visual Studio 2022, VS Code, SSMS, Git, Postman |

## Structure

```
QueueManagementAPI/          API REST ASP.NET Core
  Controllers/  Services/  Hubs/  Models/  DTOs/  Data/  Migrations/
queue-management-frontend/   Application Angular 17
  src/app/core  features  layout  shared
```

## Lancer le projet

**Back-end**

```bash
cd QueueManagementAPI/QueueManagementAPI
dotnet restore
dotnet ef database update
dotnet run
```

Vérifier la chaîne de connexion SQL Server dans `appsettings.json`. Swagger est disponible au démarrage.

**Front-end**

```bash
cd queue-management-frontend
npm install
ng serve
```

Puis ouvrir <http://localhost:4200>.

## Répartition du travail

Projet développé entièrement à deux, en travail collaboratif, par **Kounouz Derbel** et **Eya Abid** :
analyse du cahier des charges, conception UML et base de données, API ASP.NET Core, interface Angular,
temps réel SignalR, tests et intégration.
