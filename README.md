# GhostCommit

> **Le travail que tu fais vraiment. Enfin visible.**

GhostCommit est une application B2B qui détecte, structure et documente automatiquement le travail réel effectué par les développeurs et les équipes techniques, sans demander de saisie manuelle.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-UNLICENSED-red)

## 📋 Table des matières

- [Présentation](#présentation)
- [Architecture](#architecture)
- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [API Documentation](#api-documentation)
- [Développement](#développement)
- [Privacy & Sécurité](#privacy--sécurité)

## 🎯 Présentation

GhostCommit transforme les signaux faibles (commits, fichiers modifiés, temps actif) en **journaux de travail clairs, auditables et exploitables** :

- 📊 Rapports d'activité automatiques
- 📝 Changelogs humains
- ✅ Preuves d'avancement
- 🚫 **Zéro saisie manuelle**

### Problème résolu

- Les commits Git ne racontent pas toute l'histoire
- Le reporting est chronophage et souvent incomplet
- Les managers ne voient pas l'avancement réel
- Les développeurs détestent expliquer ce qu'ils ont déjà fait

### Solution

GhostCommit **observe → structure → résume** automatiquement.

## 🏗 Architecture

Le projet est organisé en monorepo avec trois composants principaux :

```
GhostCommit/
├── backend/          # API NestJS + PostgreSQL + Prisma
├── agent/            # Agent desktop Electron
├── dashboard/        # Dashboard React + TypeScript + Vite
├── shared/           # Types partagés
├── docker-compose.yml
└── package.json
```

### Stack technique

**Backend:**
- NestJS (TypeScript)
- PostgreSQL
- Prisma ORM
- Redis (BullMQ)
- JWT + OAuth (GitHub/GitLab)
- OpenAI/Anthropic API (génération de résumés)

**Agent Desktop:**
- Electron
- TypeScript
- Chokidar (file watching)
- Simple-git (Git integration)

**Infrastructure:**
- Docker & Docker Compose
- Node.js 18+

## Parcours dashboard actuel

### Fondations API Phase 3A

La Phase 3A ajoute les fondations backend pour :

- créer et confirmer une liaison agent locale avec code court (`POST /api/v1/agent/link-request`, `POST /api/v1/agent/link/confirm`) ;
- lister et révoquer les installations agent de l’utilisateur (`GET /api/v1/agent/installations`, `POST /api/v1/agent/installations/:id/revoke`) ;
- créer, lister, consulter, suspendre, reprendre et archiver des projets explicitement autorisés (`/api/v1/projects`).

Ces routes restent privacy-first : pas de hostname brut, pas d’identifiant machine stable, pas de chemin absolu, pas de contenu de fichiers et pas de token agent exposé après la confirmation initiale.

La Phase 1B-A fournit les premières routes dashboard utilisables :

- `/` : page publique privacy-first avec promesse produit, bénéfices et exemple statique de rapport.
- `/login` : connexion GitHub via `POST /api/v1/auth/github/start`.
- `/auth/callback` : finalisation de session via cookie HttpOnly et `POST /api/v1/auth/refresh`, sans token dans l'URL ni Web Storage.
- `/onboarding` : parcours privacy-first en cinq étapes, relié à `GET/PATCH /api/v1/onboarding/status`.
- `/app` et `/app/today` : tableau Aujourd’hui consent-gated, alimenté par `GET /api/v1/dashboard/today`, avec état agent non installé, session actuelle, brouillon du jour, compteurs neutres, dernières sessions, checklist et données de démonstration locales.
- `/app/projects`, `/app/activity`, `/app/reports`, `/app/settings` : shell protégé avec navigation, workspace courant, profil, notifications, statut permanent `Agent non installé — aucune activité collectée` et états vides utiles.

## ✨ Fonctionnalités

### MVP (v0.1.0)

- ✅ Authentification équipe (GitHub/GitLab OAuth)
- ✅ Connexion de repositories Git
- ✅ Agent desktop léger (macOS/Windows/Linux)
- ✅ Détection automatique des sessions de travail
- ✅ Timeline d'activité personnelle
- ✅ Génération automatique de résumé journalier (LLM)
- ✅ Export rapport (Markdown/PDF)

### Ce que GhostCommit NE fait PAS

- ❌ Pas de keylogging
- ❌ Pas de capture d'écran
- ❌ Pas de surveillance temps réel
- ❌ Pas de scoring individuel

**Positionnement** : Outil de clarté, pas de contrôle.

## 📦 Prérequis

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose
- PostgreSQL 16+ (via Docker ou local)
- Redis 7+ (via Docker ou local)

### Compte OAuth (au moins un)

- GitHub OAuth App (recommandé)
- GitLab OAuth App (optionnel)
- OpenAI API Key OU Anthropic API Key (pour les résumés)

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/your-org/GhostCommit.git
cd GhostCommit
```

### 2. Installer les dépendances

```bash
npm install
```

Ou manuellement :

```bash
# Root
npm install

# Backend
cd backend && npm install

# Agent
cd ../agent && npm install
```

### 3. Configurer l'environnement

```bash
cp .env.example .env
```

Éditez `.env` avec vos configurations :

```env
# Database
DATABASE_URL="postgresql://ghostcommit:ghostcommit@localhost:5432/ghostcommit?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# LLM (choisir OpenAI OU Anthropic)
OPENAI_API_KEY="your-openai-api-key"
# OU
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

### 4. Démarrer les services (PostgreSQL + Redis)

```bash
npm run docker:up
```

### 5. Initialiser la base de données

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 6. Démarrer l'application

**Backend:**
```bash
npm run dev:backend
# API disponible sur http://localhost:3000
# Documentation: http://localhost:3000/api/docs
```

**Agent Desktop:**
```bash
npm run dev:agent
```

## ⚙️ Configuration

### Configuration GitHub OAuth

1. Aller sur https://github.com/settings/developers
2. Créer une nouvelle OAuth App
3. Configuration:
   - **Homepage URL**: `http://localhost:3000`
   - **Callback URL**: `http://localhost:3000/api/v1/auth/github/callback`
4. Copier `Client ID` et `Client Secret` dans `.env`

### Configuration GitLab OAuth

1. Aller sur https://gitlab.com/-/profile/applications
2. Créer une nouvelle application
3. Configuration:
   - **Redirect URI**: `http://localhost:3000/api/v1/auth/gitlab/callback`
   - **Scopes**: `read_user`, `read_api`
4. Copier `Application ID` et `Secret` dans `.env`

### Configuration LLM

**Option 1: OpenAI**
```env
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4"
```

**Option 2: Anthropic**
```env
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"
```

## 📖 Utilisation

### 1. Authentification

**Via navigateur:**
```
http://localhost:3000/auth/github
```

Vous serez redirigé vers GitHub pour autoriser l'application.

### 2. Créer une équipe

```bash
POST /api/v1/teams
{
  "name": "Mon Équipe",
  "slug": "mon-equipe",
  "description": "Description de l'équipe"
}
```

### 3. Connecter un repository

```bash
POST /api/v1/repos
{
  "name": "my-project",
  "fullName": "owner/my-project",
  "url": "https://github.com/owner/my-project",
  "provider": "GITHUB",
  "externalId": "123456",
  "teamId": "team-uuid"
}
```

### 4. Installer l'agent desktop

L'agent détecte automatiquement les changements de fichiers et envoie les sessions d'activité à l'API.

**Fonctionnement:**
1. Surveille les dossiers configurés
2. Détecte les modifications de fichiers
3. Identifie les repositories Git
4. Crée des sessions d'activité (15 min d'inactivité = fin de session)
5. Synchronise avec l'API (toutes les 5 minutes)
6. Stocke localement si hors ligne

### 5. Générer un résumé journalier

```bash
POST /api/v1/summary/generate
{
  "date": "2024-01-23"
}
```

Le système génère automatiquement un résumé court et factuel de votre journée.

### 6. Exporter un rapport

```bash
POST /api/v1/summary/export
{
  "startDate": "2024-01-20",
  "endDate": "2024-01-27",
  "format": "markdown"  # ou "pdf"
}
```

## 📚 API Documentation

La documentation complète de l'API est disponible via Swagger :

```
http://localhost:3000/api/docs
```

### Endpoints principaux

**Authentication:**
- `GET /api/v1/auth/github` - OAuth GitHub
- `GET /api/v1/auth/gitlab` - OAuth GitLab
- `GET /api/v1/auth/me` - Utilisateur courant

**Teams:**
- `POST /api/v1/teams` - Créer équipe
- `GET /api/v1/teams/:id` - Détails équipe
- `POST /api/v1/teams/:id/members` - Ajouter membre

**Repositories:**
- `POST /api/v1/repos` - Connecter repository
- `GET /api/v1/repos/:id` - Détails repository
- `GET /api/v1/repos/team/:teamId` - Repos d'une équipe

**Activity:**
- `POST /api/v1/activity/sessions` - Créer session (agent)
- `GET /api/v1/activity/sessions` - Liste sessions
- `GET /api/v1/activity/statistics` - Statistiques

**Summary:**
- `POST /api/v1/summary/generate` - Générer résumé
- `GET /api/v1/summary` - Liste résumés
- `POST /api/v1/summary/export` - Exporter rapport

## 🛠 Développement

### Structure du backend

```
backend/src/
├── auth/           # Authentification (JWT, OAuth)
├── users/          # Gestion utilisateurs
├── teams/          # Gestion équipes
├── repos/          # Gestion repositories
├── activity/       # Sessions d'activité
├── summary/        # Génération résumés + exports
├── prisma/         # Prisma service
└── main.ts         # Entry point
```

### Structure de l'agent

```
agent/src/
├── services/
│   ├── fileWatcher.ts      # Surveillance fichiers
│   ├── gitDetector.ts      # Détection Git
│   ├── apiClient.ts        # Communication API
│   ├── storage.ts          # Stockage local
│   └── activityTracker.ts  # Coordination
├── utils/
│   └── config.ts           # Configuration
└── main.ts                 # Electron main process
```

### Commandes utiles

```bash
# Développement
npm run dev:backend         # Backend en mode watch
npm run dev:agent           # Agent en mode développement

# Base de données
npm run db:migrate          # Migrer la DB
npm run db:studio           # Ouvrir Prisma Studio

# Build
npm run build:backend       # Build backend
npm run build:agent         # Compile agent TypeScript
npm run lint                # Lint all workspaces
npm run typecheck           # Typecheck all workspaces
npm test                    # Run all tests
npm run build               # Build all workspaces

# Docker
npm run docker:up           # Démarrer PostgreSQL + Redis
npm run docker:down         # Arrêter services
```

## 🔒 Privacy & Sécurité

### Données collectées

GhostCommit collecte **uniquement** :
- ✅ Chemins de fichiers modifiés (pas le contenu)
- ✅ Horodatage des sessions
- ✅ Statistiques Git (commits, lignes ajoutées/supprimées)
- ✅ Métadonnées système (OS, hostname)

### Données NON collectées

- ❌ Contenu des fichiers
- ❌ Frappes clavier
- ❌ Captures d'écran
- ❌ Activité navigateur
- ❌ Données personnelles sensibles

### Sécurité

- Authentification JWT
- Tokens stockés de manière sécurisée (keytar)
- Communication HTTPS en production
- Données au repos chiffrées (PostgreSQL)
- Audit logs disponibles

### RGPD Compliance

- Droit à l'accès : API pour récupérer ses données
- Droit à l'effacement : DELETE endpoints
- Consentement explicite requis
- Données minimales collectées

## 📄 License

UNLICENSED - Propriétaire

## 🤝 Support

Pour toute question ou problème :
- 📧 Email: support@ghostcommit.com
- 🐛 Issues: GitHub Issues
- 📖 Documentation: [docs.ghostcommit.com](https://docs.ghostcommit.com)

---

**GhostCommit** - Parce que votre travail mérite d'être vu. 👻✨
## Etat dashboard Phase 3B

La Phase 3B ajoute les ecrans dashboard consent-gated suivants, sans activer la collecte locale :

- `/app/projects` : liste les projets explicitement autorises via `GET /api/v1/projects`, avec alias local safe, statut, recherche et etat vide.
- `/app/projects/:id` : affiche le detail privacy-first d'un projet, limite aux metadonnees safe et reglages de confidentialite.
- `/app/settings/agent` : liste les installations agent via `GET /api/v1/agent/installations`, sans token, hostname brut ni identifiant machine stable.

Cette phase ne demarre pas l'agent Electron, la surveillance de fichiers, la synchronisation de sessions, la generation de rapports, l'export ou le partage.

## Fondations agent Phase 3C

La Phase 3C ajoute des fondations locales cote agent pour preparer une selection de projet sans demarrer la collecte :

- un dossier ne peut devenir un brouillon d'autorisation que s'il s'agit d'un repository Git ;
- le chemin absolu reste local-only et n'est jamais present dans le payload `POST /projects` ;
- le payload projet contient uniquement nom affiche, provider `LOCAL`, alias safe et patterns ignores filtres ;
- la creation du payload exige une confirmation explicite ;
- l'agent ne surveille plus automatiquement les chemins deja configures au demarrage ;
- `ActivityTracker` ne synchronise plus de sessions en attente des sa construction.

Cette phase ne branche pas encore l'UI Electron de selection, le heartbeat, la synchronisation de sessions, la timeline, les rapports, l'export ou le partage.

## Flux projet Phase 3D

La Phase 3D branche le bouton `Ajouter un projet` de `/app/projects` sur `POST /api/v1/projects` :

- l'utilisateur ouvre volontairement le formulaire ;
- il renseigne uniquement un nom affiche, un alias local safe, une branche optionnelle et des patterns ignores ;
- une confirmation explicite est obligatoire avant l'appel API ;
- aucun chemin absolu, contenu de fichier, diff, hostname, identifiant machine, token ou secret n'est demande ou affiche ;
- la creation du projet n'active pas le watcher Electron, le heartbeat, la synchronisation de sessions, les rapports, l'export ou le partage.

## Contrôles Phase 3E

La Phase 3E branche les contrôles utilisateur déjà exposés par le backend :

- pause, reprise et archivage depuis `/app/projects/:id` ;
- révocation d'un agent depuis `/app/settings/agent`.

Ces actions mettent à jour les statuts visibles depuis les réponses API. Elles n'envoient aucun chemin local, contenu de fichier, diff, hostname, identifiant machine, token ou secret, et ne démarrent pas le watcher, le heartbeat, la synchronisation de sessions, les rapports, l'export ou le partage.

## Heartbeat agent Phase 3F

La Phase 3F ajoute `POST /api/v1/agent/heartbeat` avec le token appareil `gca_*` issu de la liaison agent :

- le token reste hash-only en base ;
- les tokens absents, invalides, expirés ou révoqués sont rejetés ;
- le heartbeat met à jour uniquement `lastSeenAt` et le statut public de l'installation ;
- les agents connectés sans heartbeat récent deviennent `OFFLINE` lors du listing ;
- aucun hostname, identifiant machine, chemin local, contenu de fichier, diff, secret, session ou rapport n'est accepté.

## Liaison agent dashboard Phase 3G

La Phase 3G branche `/app/settings/agent` sur `POST /api/v1/agent/link-request` :

- l'utilisateur crée volontairement une demande de liaison ;
- le formulaire envoie uniquement un libellé appareil, une famille OS et une version agent ;
- le dashboard affiche le code temporaire, le deep link et l'expiration ;
- aucun token appareil, hash de token, hostname, identifiant machine, chemin local, contenu de fichier, diff, session ou rapport n'est affiché ;
- la création du code ne confirme pas l'installation, ne démarre pas le heartbeat, le watcher, la synchronisation de sessions, les rapports, l'export ou le partage.

## Fondations confirmation agent Phase 3H

La Phase 3H ajoute les primitives locales côté agent pour confirmer une liaison :

- parsing strict de `ghostcommit://agent/link?code=GC-XXXXXX` ;
- rejet générique des liens ou codes invalides ;
- confirmation impossible sans action explicite utilisateur ;
- appel préparé vers `POST /api/v1/agent/link/confirm` avec uniquement code, libellé appareil, OS et version agent ;
- aucun watcher, heartbeat, scan local, synchronisation de sessions, rapport, export ou partage n'est démarré par cette fondation.

## Stockage token agent et heartbeat Phase 3I

La Phase 3I ajoute les primitives locales suivantes :

- stockage du token appareil via une interface de coffre sécurisé injectable ;
- aucune écriture du token appareil dans `config.json` ;
- suppression du token via la même interface ;
- heartbeat explicite vers `POST /api/v1/agent/heartbeat` avec le token appareil ;
- aucun body de heartbeat, watcher, scan local, synchronisation de sessions, rapport, export ou partage déclenché.

## Protocole Electron Phase 3J

La Phase 3J branche les fondations de liaison dans l'agent Electron :

- gestion de `ghostcommit://agent/link?code=GC-XXXXXX` au démarrage ou via seconde instance ;
- mise en file des liens jusqu'à initialisation de l'agent ;
- confirmation utilisateur obligatoire avant appel backend ;
- envoi d'un heartbeat explicite après liaison réussie ;
- aucun watcher, scan local, synchronisation de sessions, rapport, export ou partage déclenché.

## Déconnexion agent locale Phase 3K

La Phase 3K ajoute un contrôle local utilisateur dans l'agent Electron :

- action explicite `Effacer la liaison agent locale` dans le menu tray ;
- suppression du token appareil via le coffre sécurisé ;
- effacement du token utilisateur legacy encore présent dans `config.json` ;
- arrêt des watchers et du tracker local actifs ;
- aucun appel heartbeat, synchronisation de sessions, révocation distante, rapport, export ou partage déclenché.

Cette action est locale. La révocation serveur reste contrôlée depuis le dashboard via l'endpoint propriétaire existant.

## Durcissement tray legacy Phase 3L

La Phase 3L neutralise les anciens contrôles Electron qui pouvaient démarrer une surveillance locale hors flux explicite :

- le menu tray n'affiche plus les chemins absolus des dossiers configurés ;
- le sous-menu affiche uniquement un résumé par nombre ;
- l'action legacy `Ajouter un dossier` devient une guidance vers le dashboard ;
- aucun picker local, watcher, scan, synchronisation de sessions, rapport, export ou partage n'est déclenché.

## Autorisation projet locale Phase 3M

La Phase 3M branche l'action tray `Autoriser un projet Git local` sur le flux d'autorisation local :

- le picker de dossier ne s'ouvre qu'après une action utilisateur explicite ;
- seul un repository Git local peut produire un brouillon d'autorisation ;
- la confirmation Electron affiche uniquement nom, alias safe, nombre de patterns ignorés et branche optionnelle ;
- après confirmation, l'agent appelle `POST /api/v1/projects` avec le token utilisateur et le payload safe ;
- le chemin absolu reste local-only et n'est jamais envoyé au backend ;
- aucun watcher, scan local, heartbeat automatique, synchronisation de sessions, rapport, export ou partage n'est déclenché.

## Mapping projet local Phase 3N

La Phase 3N conserve localement le lien entre le projet backend autorisé et le dossier Git choisi :

- le mapping est écrit uniquement après retour d'un `projectId` valide par `POST /api/v1/projects` ;
- le fichier local contient l'id projet, le nom affiché, l'alias safe, le chemin local root, `collectionEnabled: false` et la date d'autorisation ;
- le chemin absolu reste dans l'agent Electron et n'est pas transmis au backend ;
- une nouvelle autorisation du même projet met à jour le mapping sans doublon ;
- cette étape n'active toujours aucun watcher, scan local, heartbeat automatique, synchronisation de sessions, rapport, export ou partage.
