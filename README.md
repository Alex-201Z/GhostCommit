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
npm run install:all
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
   - **Callback URL**: `http://localhost:3000/auth/github/callback`
4. Copier `Client ID` et `Client Secret` dans `.env`

### Configuration GitLab OAuth

1. Aller sur https://gitlab.com/-/profile/applications
2. Créer une nouvelle application
3. Configuration:
   - **Redirect URI**: `http://localhost:3000/auth/gitlab/callback`
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
npm run build:agent         # Build agent

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
