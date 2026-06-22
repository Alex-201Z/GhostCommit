# GhostCommit — Spécification produit et plan de développement
**Version :** 1.0  
**Date :** 22 juin 2026  
**Statut :** Document directeur de développement  
**Public :** Codex, développeur principal, futur contributeur  
**Repository cible :** `Alex-201Z/GhostCommit`

---

## 1. Rôle de ce document

Ce document est le contrat de développement de GhostCommit. Il doit être utilisé comme référence avant toute nouvelle fonctionnalité.

L'objectif n'est pas de créer un tracker de productivité ou un outil de surveillance. GhostCommit doit devenir un produit **privacy-first** qui transforme des signaux de développement non sensibles en rapports de travail clairs, vérifiables et contrôlés par la personne qui les produit.

La règle produit centrale :

> **Le développeur possède ses données, décide ce qui apparaît dans un rapport, et valide chaque partage.**

Ce document décrit :
- la vision produit et le périmètre ;
- les personas et parcours ;
- les écrans, interactions et règles UX ;
- l'architecture cible ;
- les données et API nécessaires ;
- les phases de développement ;
- les user stories et critères d'acceptation ;
- les règles de qualité, confidentialité, sécurité et tests ;
- le protocole de travail attendu de Codex.

---

# 2. Vision produit

## 2.1 Proposition de valeur

GhostCommit aide les développeurs, étudiants et freelances à expliquer et prouver leur travail sans rédiger manuellement un compte-rendu à partir de zéro.

L'agent local détecte uniquement des signaux techniques autorisés :
- sessions de travail ;
- projets Git actifs ;
- fichiers modifiés sous forme de chemins relatifs filtrés ;
- statistiques Git agrégées ;
- commits ;
- notes ajoutées volontairement par l'utilisateur ;
- blocages ou livrables déclarés manuellement.

GhostCommit transforme ensuite ces signaux en :
- une timeline personnelle ;
- un brouillon de bilan quotidien ;
- un rapport hebdomadaire ;
- des preuves associées à un livrable ;
- un export partageable après validation explicite.

## 2.2 Promesse utilisateur

> **Le travail que tu fais vraiment. Enfin compréhensible, prouvable et partageable.**

## 2.3 Positionnement

GhostCommit est :
- un outil personnel de reporting développeur ;
- un journal de travail automatisé ;
- un générateur de rapports révisables ;
- un lien entre activité technique et langage humain.

GhostCommit n'est pas :
- un keylogger ;
- un outil de présence ;
- un outil de surveillance à distance ;
- un écran d'espionnage des développeurs ;
- un classement de productivité ;
- un calculateur de “lignes de code = performance” ;
- un outil qui partage automatiquement le travail à un manager.

## 2.4 Public de lancement

### Persona A — Développeur indépendant
**Objectif :** envoyer à un client un compte-rendu clair sans devoir se souvenir de chaque modification.  
**Frictions actuelles :** reporting manuel, tâches invisibles, difficulté à justifier du temps non visible dans les commits.  
**Valeur GhostCommit :** rapport journalier/hebdomadaire révisable et exportable.

### Persona B — Étudiant ou alternant en informatique
**Objectif :** tenir un journal de bord de projet, préparer une soutenance et démontrer ses compétences.  
**Frictions actuelles :** pertes d'informations, journal rempli tardivement, difficulté à expliquer sa progression.  
**Valeur GhostCommit :** historique de travail, preuves de progression, export pour professeur/maître de stage.

### Persona C — Développeur d'une petite équipe
**Objectif :** clarifier l'avancement sans micro-management.  
**Frictions actuelles :** commits incomplets, standups redondants, tickets pas toujours à jour.  
**Valeur GhostCommit :** partage volontaire d'un rapport lisible, pas d'activité brute imposée.

## 2.5 Décision produit de base : Personal-first

La V1 est **personnelle**. Une équipe est techniquement possible dans le modèle de données, mais les écrans de management, le suivi collectif et les permissions complexes sont retardés.

Raison :
- réduire la méfiance ;
- réduire la complexité ;
- permettre une utilisation réelle par le créateur du produit ;
- construire une preuve de valeur avant les fonctionnalités B2B.

---

# 3. Périmètre fonctionnel

## 3.1 Ce qui doit être livré dans la V1

1. Compte utilisateur et espace personnel.
2. Dashboard “Aujourd'hui”.
3. Configuration de l'agent local.
4. Détection de projets locaux Git et gestion des projets suivis.
5. Sessions d'activité générées localement et synchronisées avec reprise hors ligne.
6. Timeline et détails de sessions.
7. Brouillon quotidien généré à partir de métadonnées filtrées.
8. Édition, suppression et validation du brouillon par l'utilisateur.
9. Rapport hebdomadaire avec livrables, blocages, statistiques descriptives et preuves.
10. Export Markdown et PDF.
11. Centre de confidentialité : chemins surveillés, exclusions, pause, suppression, rétention.
12. Journal d'audit des partages et exports.

## 3.2 Hors périmètre V1

Ne pas développer avant que la V1 soit réellement utilisable :
- GitLab ;
- Slack, Teams, Discord ;
- facturation SaaS ;
- administration multi-tenant avancée ;
- tableau de bord de performance manager ;
- présence en temps réel ;
- classement de développeurs ;
- scoring individuel ;
- analyse de contenu de code ;
- lecture de fichiers ou envoi de code à un LLM ;
- intégration Jira/Linear ;
- application mobile ;
- collaboration temps réel ;
- modèle de permissions entreprise détaillé ;
- recommandations de productivité ;
- IA autonome prenant des décisions à la place de l'utilisateur.

---

# 4. Principes produit non négociables

## 4.1 Confidentialité par défaut
- Ne jamais collecter le contenu d'un fichier.
- Ne jamais envoyer de chemins absolus locaux au serveur.
- Ne jamais transmettre `hostname` brut par défaut.
- Ne jamais collecter les frappes clavier, captures, microphone, webcam, navigation web ou activité hors projets explicitement suivis.
- Toute collecte doit être affichée dans l'interface avant activation.
- Un utilisateur peut mettre le suivi en pause à tout moment.
- Un utilisateur peut supprimer une session, un rapport ou toutes ses données.

## 4.2 Contrôle humain obligatoire
- Tous les rapports sont initialement `DRAFT`.
- Aucun rapport n'est envoyé, publié ou partagé automatiquement.
- Une phrase générée par IA peut être modifiée ou supprimée.
- Une preuve n'est jointe à un rapport que si l'utilisateur la conserve.
- Les exports doivent afficher un aperçu avant téléchargement.

## 4.3 Les statistiques sont descriptives, jamais évaluatives
Autorisé :
- durée estimée d'une session ;
- nombre de commits ;
- nombre de projets touchés ;
- nombre de fichiers concernés ;
- jours avec session active.

Interdit :
- score de performance ;
- classement ;
- nombre de lignes de code présenté comme qualité ;
- évaluation de “temps perdu” ;
- détection d'inactivité comme faute ;
- conclusions sur la motivation ou la présence.

## 4.4 IA sous contrainte
Le LLM ne reçoit que :
- nom du projet choisi par l'utilisateur ;
- résumé des sessions ;
- chemins relatifs déjà filtrés ;
- commits/messages Git ;
- statistiques agrégées ;
- notes et blocages explicitement ajoutés ;
- livrables déclarés.

Le LLM ne reçoit jamais :
- contenu du code ;
- secrets ;
- `.env` ;
- chemins absolus ;
- nom de machine ;
- identifiants ;
- données personnelles non nécessaires.

---

# 5. Parcours utilisateur principal

## 5.1 Premier lancement

1. L'utilisateur crée un compte ou se connecte avec GitHub.
2. GhostCommit crée un espace personnel.
3. L'utilisateur lit et accepte l'écran “Ce que GhostCommit collecte / ne collecte jamais”.
4. L'utilisateur télécharge ou ouvre l'agent local.
5. L'agent demande un ou plusieurs dossiers à surveiller.
6. L'utilisateur voit une liste de projets Git détectés et sélectionne ceux à suivre.
7. L'agent reçoit un jeton de liaison limité à l'appareil.
8. Le dashboard confirme que le suivi est prêt, avec l'agent en état `CONNECTED`.

## 5.2 Utilisation quotidienne

1. L'utilisateur travaille normalement.
2. L'agent détecte des changements dans un projet autorisé.
3. Il ouvre une session locale, regroupe les événements et la ferme après inactivité ou fermeture manuelle.
4. Les données sont synchronisées si Internet est disponible ; sinon elles restent chiffrées/localement en file d'attente.
5. Le dashboard affiche une session active ou les dernières sessions.
6. En fin de journée, l'utilisateur ouvre “Brouillon du jour”.
7. Il modifie le rapport, ajoute un livrable ou un blocage, puis valide ou garde en brouillon.

## 5.3 Utilisation hebdomadaire

1. Le vendredi ou sur demande, l'utilisateur ouvre “Rapport hebdomadaire”.
2. GhostCommit agrège les journées et sessions sélectionnées.
3. Le système propose un rapport structuré.
4. L'utilisateur vérifie les preuves liées à chaque affirmation importante.
5. L'utilisateur exporte le rapport en Markdown ou PDF, ou crée un lien privé à durée limitée.

---

# 6. Architecture cible

## 6.1 État initial du repository

Le repository existant contient déjà :
- `backend/` : API NestJS, PostgreSQL, Prisma, Redis/BullMQ ;
- `agent/` : agent Electron TypeScript ;
- `shared/` : types partagés ;
- un schéma Prisma avec `User`, `Team`, `Repo`, `ActivitySession` et `DailySummary`.

La structure doit évoluer sans réécriture inutile.

## 6.2 Structure recommandée

```text
GhostCommit/
├── backend/                 # NestJS API
├── agent/                   # Electron local agent
├── dashboard/               # React + TypeScript + Vite
├── shared/
│   ├── types/               # DTOs, enums, contrats
│   └── config/              # constantes communes sûres
├── docs/
│   ├── GHOSTCOMMIT_DEVELOPMENT_SPEC.md
│   ├── API_CONTRACTS.md
│   ├── PRIVACY_MODEL.md
│   └── BUILD_LOG.md
├── docker-compose.yml
├── package.json
└── README.md
```

### Règle
Ne pas migrer vers une architecture plus complexe (`Nx`, microservices, Kubernetes, Tauri, event sourcing complet, etc.) avant que les flux V1 fonctionnent de bout en bout.

## 6.3 Stack recommandée

### Dashboard
- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind CSS
- composants accessibles, simples et cohérents
- Recharts seulement si une visualisation apporte une compréhension réelle

### Backend
- NestJS
- Prisma
- PostgreSQL
- BullMQ/Redis uniquement pour les tâches de génération, export et retry
- JWT court + refresh token sécurisé
- Swagger/OpenAPI maintenu

### Agent
- Electron
- TypeScript
- Chokidar
- simple-git
- stockage local SQLite ou fichier chiffré selon la solution la plus stable
- file d'attente locale idempotente
- communication HTTPS avec token de liaison d'appareil

## 6.4 Flux de données

```text
Dossier explicitement autorisé
        ↓
Agent local : filtre + ignore + détection Git
        ↓
Session locale avec identifiant UUID
        ↓
File d'attente locale idempotente
        ↓
API NestJS : validation + déduplication
        ↓
PostgreSQL : sessions, projets, rapports, preuves
        ↓
Worker BullMQ : brouillon IA / export
        ↓
Dashboard React : revue, édition, validation, export
```

## 6.5 Règles de synchronisation

- Toute session créée par l'agent possède un `clientSessionId` UUID généré localement.
- L'API traite `clientSessionId` comme une clé d'idempotence par appareil.
- Une tentative de synchronisation répétée ne doit jamais dupliquer une session.
- L'agent conserve les données non synchronisées jusqu'à confirmation serveur.
- La suppression locale d'une session non synchronisée la retire de la file.
- Une session n'est jamais écrasée silencieusement : en cas de conflit, la session la plus récente est conservée avec un état `CONFLICT` visible.

---

# 7. Modèle de données cible

## 7.1 Évolution des modèles existants

### `Team` devient conceptuellement `Workspace`
Pour limiter la migration, le modèle Prisma peut rester `Team` temporairement. Dans l'interface, le terme affiché est **Espace**.

À la création de compte :
- créer automatiquement un espace personnel ;
- rôle du créateur : `OWNER`;
- aucune autre personne n'est invitée en V1.

### `Repo`
Ajouter :
- `displayName`
- `localPathAlias` : libellé local choisi par l'utilisateur, jamais chemin absolu
- `trackingEnabled`
- `ignoredPatterns`
- `lastActivityAt`
- `privacyMode`
- `archivedAt`

### `ActivitySession`
Conserver les champs existants et ajouter :
- `clientSessionId` unique par appareil ;
- `agentInstallationId` ;
- `status` : `PENDING`, `SYNCED`, `CONFLICT`, `DELETED`;
- `source` : `AGENT`, `MANUAL`;
- `projectRelativeFiles` : liste filtrée, jamais chemins absolus ;
- `commitReferences` : hashes courts, branche, messages filtrés ;
- `manualNote` ;
- `privacyRedactions` ;
- `endedBy` : `INACTIVITY`, `MANUAL`, `APP_QUIT`, `SYSTEM_SLEEP`;
- `isExcludedFromReports`.

### `DailySummary`
Remplacer progressivement `isGenerated` / `isValidated` par :
- `status` : `DRAFT`, `REVIEWED`, `FINAL`, `ARCHIVED`;
- `generatedContent`;
- `editedContent`;
- `inputSnapshot` : données agrégées sans contenu de fichiers ;
- `generationVersion`;
- `approvedAt`;
- `excludedSessionIds`.

## 7.2 Nouveaux modèles requis

```prisma
model AgentInstallation {
  id                String   @id @default(uuid())
  userId            String
  deviceLabel       String
  osFamily          String?
  agentVersion      String?
  status            AgentStatus @default(PENDING)
  lastSeenAt        DateTime?
  revokedAt         DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User @relation(fields: [userId], references: [id], onDelete: Cascade)
  activitySessions  ActivitySession[]

  @@index([userId])
  @@map("agent_installations")
}

model WorkItem {
  id                String   @id @default(uuid())
  workspaceId       String
  userId            String
  repoId            String?
  title             String
  description       String?
  status            WorkItemStatus @default(IN_PROGRESS)
  visibility        Visibility @default(PRIVATE)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  completedAt       DateTime?

  evidenceLinks     EvidenceLink[]

  @@index([workspaceId])
  @@index([userId])
  @@index([repoId])
  @@map("work_items")
}

model EvidenceLink {
  id                String   @id @default(uuid())
  workItemId        String
  sessionId         String?
  evidenceType      EvidenceType
  label             String
  metadata          Json?
  createdAt         DateTime @default(now())

  workItem          WorkItem @relation(fields: [workItemId], references: [id], onDelete: Cascade)
  session           ActivitySession? @relation(fields: [sessionId], references: [id], onDelete: SetNull)

  @@index([workItemId])
  @@index([sessionId])
  @@map("evidence_links")
}

model Report {
  id                String   @id @default(uuid())
  userId            String
  workspaceId       String
  type              ReportType
  periodStart       DateTime
  periodEnd         DateTime
  status            ReportStatus @default(DRAFT)
  title             String
  generatedContent  String   @db.Text
  editedContent     String?  @db.Text
  visibility        Visibility @default(PRIVATE)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  approvedAt        DateTime?
  sharedAt          DateTime?
  expiresAt         DateTime?

  @@index([userId])
  @@index([workspaceId])
  @@index([periodStart, periodEnd])
  @@map("reports")
}

model AuditEvent {
  id                String   @id @default(uuid())
  userId            String
  action            AuditAction
  entityType        String
  entityId          String?
  metadata          Json?
  createdAt         DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
  @@map("audit_events")
}
```

### Enums minimales

```prisma
enum AgentStatus { PENDING CONNECTED PAUSED REVOKED }
enum WorkItemStatus { IN_PROGRESS BLOCKED DONE ARCHIVED }
enum Visibility { PRIVATE LINK_SHARED WORKSPACE_SHARED }
enum EvidenceType { SESSION COMMIT FILE_GROUP MANUAL_NOTE }
enum ReportType { DAILY WEEKLY CUSTOM }
enum ReportStatus { DRAFT REVIEWED FINAL ARCHIVED }
enum AuditAction { AGENT_LINKED AGENT_REVOKED SESSION_DELETED REPORT_EXPORTED REPORT_SHARED DATA_EXPORTED DATA_DELETED }
```

---

# 8. Design UX et navigation

## 8.1 Navigation principale

```text
Logo GhostCommit
├── Aujourd'hui
├── Activité
├── Projets
├── Rapports
├── Confidentialité
└── Paramètres
```

En bas du menu :
- état agent : `Connecté`, `En pause`, `Hors ligne`, `Non installé`;
- bouton “Mettre en pause” ;
- avatar et espace courant.

## 8.2 Ton visuel

Le produit doit inspirer :
- calme ;
- maîtrise ;
- transparence ;
- sérieux ;
- confidentialité.

À éviter :
- écrans type “surveillance” ;
- chronomètres agressifs ;
- compteurs rouges d'inactivité ;
- graphiques de performance sans contexte ;
- badges de classement ;
- vocabulaire “employé”, “contrôle”, “rendement”.

Vocabulaire recommandé :
- activité ;
- session ;
- brouillon ;
- validation ;
- preuve ;
- rapport ;
- projet ;
- confidentialité ;
- données collectées.

## 8.3 État vide

Chaque page doit être utile même avant que l'agent ait produit des données.

Exemple Dashboard sans agent :
- carte principale “Connecter GhostCommit Agent” ;
- explication courte ;
- bouton “Voir ce qui est collecté” ;
- lien “Utiliser des données de démonstration” pour tester le dashboard ;
- checklist d'onboarding.

---

# 9. Phases de développement

## Vue d'ensemble

| Phase | Nom | Résultat tangible |
|---|---|---|
| 0 | Fondations et contrat technique | Projet lançable, documentation, sécurité de base |
| 1 | Compte, espace personnel, app shell | Connexion et navigation utilisables |
| 2 | Dashboard Aujourd'hui | Vue claire de la journée et interactions principales |
| 3 | Projets suivis et agent | Agent lié, dossiers/projets contrôlés |
| 4 | Sessions et timeline | Activité utile et explicable |
| 5 | Bilan quotidien et Explain this work | Premier rapport révisable |
| 6 | Livrables et preuves | Rapport vérifiable, pas seulement narratif |
| 7 | Rapport hebdomadaire et export | Valeur partageable concrète |
| 8 | Confidentialité, robustesse et release | V1 fiable, sûre, présentable |

---

## PHASE 0 — Fondations, conventions et environnement

### Objectif
Rendre le repository stable, compréhensible et prêt à évoluer avant de construire des écrans.

### User stories
- **En tant que développeur**, je veux lancer backend, dashboard, agent et services locaux avec une documentation fiable afin de contribuer sans deviner la configuration.
- **En tant que mainteneur**, je veux des conventions communes de code, de validation et de sécurité afin que chaque ajout reste cohérent.
- **En tant qu'utilisateur**, je veux que le produit soit sûr dès ses premières versions, même avant les fonctions visibles.

### Travaux à réaliser

#### A. Ajouter le dashboard
Créer `dashboard/` avec :
- React + TypeScript + Vite ;
- routing de base ;
- Tailwind ;
- TanStack Query ;
- variables d'environnement documentées ;
- page de santé minimale.

Mettre à jour le root `package.json` :
- ajouter `dashboard` aux workspaces ;
- scripts `dev:dashboard`, `build:dashboard`, `test:dashboard`;
- script global `dev` qui documente clairement les services attendus, sans lancer de processus instables en silence.

#### B. Documentation
Créer :
- `docs/GHOSTCOMMIT_DEVELOPMENT_SPEC.md` ;
- `docs/API_CONTRACTS.md` ;
- `docs/PRIVACY_MODEL.md` ;
- `docs/BUILD_LOG.md`.

Créer `.env.example` à la racine et des `.env.example` par application si nécessaire.

#### C. Qualité
- ESLint + Prettier cohérents ;
- `npm run lint` ;
- `npm run typecheck` ;
- `npm run test` ;
- `npm run build` ;
- CI GitHub Actions minimale pour lint, typecheck, test et build.

#### D. Sécurité minimale
- interdire les secrets dans les logs ;
- valider toutes les entrées API ;
- définir CORS explicitement ;
- ne jamais mettre une clé LLM côté dashboard ;
- stocker les refresh tokens de façon sécurisée ;
- préparer un mécanisme d'identifiant d'appareil sans hostname brut.

### Critères d'acceptation
- [ ] Un nouveau développeur suit le README et lance les dépendances sans étape implicite.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` et `npm run build` sont documentés et exécutables.
- [ ] Le dashboard affiche une page “GhostCommit is running”.
- [ ] Les variables d'environnement nécessaires sont décrites.
- [ ] Aucun secret de développement réel n'est committé.
- [ ] La CI passe sur une branche propre.

### Hors périmètre
- aucun écran métier finalisé ;
- aucune génération IA ;
- aucune intégration GitHub avancée.

---

## PHASE 1 — Compte, espace personnel et app shell

### Objectif
Permettre à un utilisateur de créer son espace GhostCommit, de se connecter et de comprendre immédiatement que l'outil est conçu pour lui, pas contre lui.

### Pages à construire

#### 1. Page publique `/`
Contenu :
- promesse GhostCommit ;
- trois bénéfices : “comprendre”, “prouver”, “partager” ;
- section confidentialité ;
- bouton “Commencer” ;
- bouton “Voir un exemple de rapport”.

Interactions :
- “Commencer” dirige vers l'authentification ;
- “Voir un exemple” ouvre un exemple statique sans compte.

#### 2. Authentification `/login`
Contenu :
- bouton “Continuer avec GitHub” ;
- éventuellement connexion email/password si elle est déjà simple à sécuriser ;
- explication : GitHub sert à l'identité et pourra enrichir les projets, mais GhostCommit ne lit pas le contenu de code.

Interactions :
- après connexion, redirection vers onboarding ;
- erreurs OAuth lisibles ;
- utilisateur déjà connecté redirigé vers `/app/today`.

#### 3. Onboarding `/onboarding`
Étapes :
1. bienvenue ;
2. créer ou confirmer l'espace personnel ;
3. écran de transparence de collecte ;
4. installer/lier l'agent ;
5. terminer.

L'écran de transparence doit contenir exactement deux colonnes :
- **Collecté avec votre accord** : sessions, projets Git autorisés, chemins relatifs filtrés, statistiques Git agrégées.
- **Jamais collecté** : contenu de fichiers, frappes, captures, navigateur, mots de passe, fichiers hors dossiers autorisés.

L'utilisateur doit cocher :
- “J'ai lu ce que GhostCommit collecte.”
- “Je comprends que je peux mettre en pause ou supprimer mes données.”

#### 4. App shell `/app/*`
Contenu :
- sidebar ;
- header avec espace courant ;
- état agent ;
- menu profil ;
- zone de notifications non intrusive.

### User stories
- **En tant que nouvel utilisateur**, je veux comprendre immédiatement quelles données seront traitées afin de décider en connaissance de cause.
- **En tant qu'utilisateur connecté**, je veux disposer d'un espace personnel automatiquement créé afin de ne pas configurer une équipe avant de voir la valeur du produit.
- **En tant qu'utilisateur prudent**, je veux voir le statut de mon agent en permanence afin de savoir si le suivi est actif ou non.

### API / données
- `POST /auth/github/start`
- `GET /auth/github/callback`
- `GET /auth/me`
- `POST /workspaces/personal`
- `GET /onboarding/status`
- `PATCH /onboarding/status`

### Critères d'acceptation
- [ ] Après la première connexion, un espace personnel existe.
- [ ] L'utilisateur ne peut pas terminer l'onboarding sans avoir lu l'écran de transparence.
- [ ] La sidebar est accessible au clavier et responsive.
- [ ] L'état agent est visible dans le shell, même si l'agent n'est pas installé.
- [ ] Les erreurs OAuth ne révèlent pas de données sensibles.

### Hors périmètre
- invitation d'autres membres ;
- dashboard d'équipe ;
- GitLab.

---

## PHASE 2 — Dashboard “Aujourd'hui”

### Objectif
Créer la page la plus importante du produit : une vue immédiate qui répond à “qu'est-ce que j'ai fait aujourd'hui et que dois-je valider ?”.

### Page `/app/today`

#### Structure

##### A. En-tête de journée
- date actuelle ;
- message contextuel neutre : “Voici votre activité de développement du jour” ;
- statut agent ;
- bouton principal :
  - `Installer l'agent` si absent ;
  - `Reprendre le suivi` si en pause ;
  - `Terminer ma journée` si agent connecté.

##### B. Carte “Session actuelle”
États :
1. `Agent non connecté` :
   - explication ;
   - bouton installation ;
   - lien “Pourquoi un agent local ?”.
2. `Suivi en pause` :
   - date/heure de pause ;
   - bouton reprise ;
   - bouton “Voir les données collectées”.
3. `Aucune session aujourd'hui` :
   - encouragement neutre ;
   - bouton “Ajouter une note manuelle”.
4. `Session active` :
   - projet actif ;
   - heure de début ;
   - nombre de fichiers filtrés ;
   - bouton `Mettre en pause` ;
   - bouton `Terminer la session`.
5. `Session terminée` :
   - dernier projet ;
   - durée ;
   - bouton “Voir la session”.

##### C. Carte “Brouillon du jour”
- état `Pas encore généré`, `À relire`, `Validé` ;
- aperçu de 2 ou 3 lignes ;
- bouton `Générer le brouillon` ;
- bouton `Ouvrir et modifier`.

##### D. Bloc “Activité du jour”
- total de sessions ;
- projets concernés ;
- commits détectés ;
- livrables ou blocages ajoutés ;
- jamais un “score”.

##### E. Liste “Dernières sessions”
- maximum 5 ;
- heure, projet, durée, état de synchronisation ;
- clic vers le détail.

##### F. Checklist d'onboarding
Visible seulement avant complétion :
- compte créé ;
- agent lié ;
- premier projet suivi ;
- première session synchronisée ;
- premier brouillon généré.

### Interactions
- `Mettre en pause` doit toujours demander une confirmation légère et arrêter l'enregistrement côté agent.
- `Terminer la session` ferme la session active avec cause `MANUAL`.
- `Générer le brouillon` est désactivé si aucune session/note n'existe.
- Toutes les cartes doivent afficher un état vide explicite.
- Un clic sur une session ouvre la page de détail.
- La page se rafraîchit régulièrement sans clignotement.

### User stories
- **En tant qu'utilisateur**, je veux voir en moins de dix secondes si GhostCommit suit bien mon activité afin de garder le contrôle.
- **En tant qu'utilisateur**, je veux voir les éléments utiles de ma journée sans être noyé sous des métriques inutiles.
- **En tant qu'utilisateur**, je veux accéder directement au brouillon de rapport afin de terminer ma journée sans chercher dans plusieurs menus.

### API / données
- `GET /dashboard/today`
- `POST /agent/pause`
- `POST /agent/resume`
- `POST /activity/active-session/stop`
- `GET /activity/sessions?date=YYYY-MM-DD`
- `POST /reports/daily/generate`

### Critères d'acceptation
- [ ] Les cinq états de la carte session sont supportés.
- [ ] Aucun compteur n'est formulé comme un score de performance.
- [ ] L'utilisateur peut mettre en pause ou reprendre en moins de deux clics.
- [ ] Le dashboard fonctionne avec données réelles et données de démonstration.
- [ ] Le dashboard est utilisable sur écran desktop et tablette.

### Hors périmètre
- graphes historiques complexes ;
- rapports d'équipe ;
- exports.

---

## PHASE 3 — Projets suivis et liaison agent

### Objectif
Permettre à l'utilisateur de contrôler précisément quels projets sont suivis et sur quel appareil.

### Pages

#### 1. Projets `/app/projects`
Contenu :
- liste des projets ;
- nom affiché ;
- fournisseur Git ;
- activité récente ;
- statut suivi `Actif`, `En pause`, `Archivé`;
- bouton `Ajouter un projet`;
- filtre par statut ;
- recherche.

État vide :
- expliquer que GhostCommit ne suit aucun dossier avant autorisation ;
- bouton `Configurer l'agent`.

#### 2. Détail projet `/app/projects/:projectId`
Onglets :
- `Aperçu` ;
- `Sessions` ;
- `Livrables` ;
- `Confidentialité`.

Aperçu :
- dernière activité ;
- sessions de la semaine ;
- commits détectés ;
- dernier rapport qui mentionne le projet ;
- bouton `Mettre le suivi en pause`.

Confidentialité :
- alias local affiché ;
- patterns ignorés ;
- option ne pas inclure les chemins de fichiers dans les rapports ;
- option exclure le projet de tout rapport ;
- suppression/archivage.

#### 3. Agent `/app/settings/agent`
Contenu :
- appareils liés ;
- version de l'agent ;
- dernier contact ;
- état de synchronisation ;
- file d'attente locale estimée ;
- bouton `Révoquer cet appareil`;
- bouton `Télécharger / relancer l'agent`.

### Flux de liaison agent

1. Dashboard crée une demande de liaison.
2. Backend retourne un code court ou deep link à durée limitée.
3. L'agent ouvre le lien, l'utilisateur confirme l'espace cible.
4. Backend crée `AgentInstallation`.
5. L'agent reçoit un token appareil limité et renouvelable.
6. L'agent envoie un heartbeat.
7. Dashboard affiche l'appareil `CONNECTED`.

### Règles agent

- L'utilisateur sélectionne explicitement les dossiers à surveiller.
- L'agent découvre les repositories Git dans ces dossiers, mais n'active pas automatiquement le suivi d'un nouveau projet sans confirmation.
- L'agent ignore par défaut :
  - `.git/`
  - `node_modules/`
  - `dist/`
  - `build/`
  - `.next/`
  - `coverage/`
  - `.env*`
  - fichiers binaires
  - répertoires configurés comme sensibles.
- Les chemins envoyés sont relatifs à la racine du repo et passent par un filtre de redaction.
- Les fichiers sensibles sont remplacés par un libellé générique, par exemple `[fichier sensible exclu]`.

### User stories
- **En tant qu'utilisateur**, je veux choisir les projets suivis afin que GhostCommit ne voie jamais un dossier personnel ou non pertinent.
- **En tant qu'utilisateur**, je veux suspendre un projet sans désinstaller l'agent afin de garder le contrôle.
- **En tant qu'utilisateur**, je veux révoquer un appareil perdu ou ancien afin qu'il ne puisse plus synchroniser.

### API / données
- `POST /agent/link-request`
- `POST /agent/link/confirm`
- `GET /agent/installations`
- `POST /agent/installations/:id/revoke`
- `POST /projects`
- `GET /projects`
- `GET /projects/:id`
- `PATCH /projects/:id`
- `POST /projects/:id/pause`
- `POST /projects/:id/resume`
- `POST /projects/:id/archive`

### Critères d'acceptation
- [ ] Aucun projet n'est suivi sans action explicite.
- [ ] Un projet peut être suspendu ou archivé depuis son détail.
- [ ] La révocation d'un agent invalide immédiatement ses nouveaux appels API.
- [ ] Les patterns ignorés sont appliqués avant l'envoi de données.
- [ ] Les chemins absolus ne sont jamais enregistrés côté API.
- [ ] Le statut d'agent passe à hors ligne après un délai configurable sans heartbeat.

### Hors périmètre
- installation automatique de l'agent ;
- GitLab ;
- partage de projet avec une équipe.

---

## PHASE 4 — Sessions, timeline et qualité de collecte

### Objectif
Transformer les événements de l'agent en sessions fiables, compréhensibles et révisables.

### Page `/app/activity`

#### Filtres
- période : aujourd'hui, 7 jours, 30 jours, personnalisé ;
- projet ;
- état de synchronisation ;
- sessions exclues des rapports ;
- type : agent ou manuel.

#### Timeline
Chaque session affiche :
- heure début/fin ;
- projet ;
- durée ;
- état de synchronisation ;
- nombre de fichiers filtrés ;
- commits ;
- lignes ajoutées/supprimées en contexte descriptif ;
- notes manuelles ;
- icône de confidentialité si des fichiers ont été masqués ;
- menu : exclure des rapports, ajouter une note, supprimer.

#### Page détail `/app/activity/:sessionId`
Contenu :
- métadonnées de session ;
- résumé factuel ;
- fichiers regroupés par dossier, pas liste brute interminable ;
- commits associés ;
- note manuelle ;
- raison de fermeture ;
- état de synchronisation ;
- actions :
  - modifier note ;
  - ajouter au rapport ;
  - exclure de tous les rapports ;
  - supprimer la session ;
  - signaler une donnée incorrecte.

### Logique de session agent

#### Ouverture
- première modification pertinente dans un projet suivi ;
- générer `clientSessionId` ;
- enregistrer l'heure de début ;
- démarrer un buffer d'événements.

#### Agrégation
- dédupliquer les modifications du même fichier ;
- ignorer les rafales générées par un build ;
- grouper les fichiers par dossier ;
- mettre à jour uniquement les métriques agrégées nécessaires.

#### Fermeture
- après 15 minutes d'inactivité configurable ;
- sur arrêt manuel ;
- sur fermeture de l'application ;
- sur veille système ;
- sur changement explicite de projet si la session précédente est inactive.

#### Synchronisation
- ajout dans une file locale ;
- retry exponentiel ;
- clé d'idempotence `clientSessionId`;
- aperçu de file locale dans l'agent et dashboard ;
- aucune perte silencieuse.

### User stories
- **En tant qu'utilisateur**, je veux comprendre ce qu'une session contient afin de corriger ou exclure ce qui ne doit pas apparaître dans un rapport.
- **En tant qu'utilisateur**, je veux que les dossiers de build et fichiers sensibles soient ignorés afin que les données collectées restent propres.
- **En tant qu'utilisateur hors ligne**, je veux que mes sessions soient conservées et synchronisées plus tard afin de ne pas perdre mon travail.
- **En tant qu'utilisateur**, je veux supprimer une session erronée afin que mes rapports restent exacts.

### API / données
- `POST /activity/sessions` avec idempotency key
- `GET /activity/sessions`
- `GET /activity/sessions/:id`
- `PATCH /activity/sessions/:id`
- `POST /activity/sessions/:id/exclude`
- `DELETE /activity/sessions/:id`
- `GET /activity/sync-status`

### Critères d'acceptation
- [ ] Deux synchronisations du même `clientSessionId` ne créent qu'une seule session.
- [ ] Un dossier ignoré ne génère pas de données serveur.
- [ ] Une session peut être exclue d'un rapport sans être supprimée.
- [ ] Une session supprimée disparaît du dashboard, des agrégats et des futurs rapports.
- [ ] Les données hors ligne sont synchronisées après retour du réseau.
- [ ] La timeline reste performante pour au moins 1 000 sessions par utilisateur.

### Hors périmètre
- analyse de contenu de code ;
- détection de l'IDE réel de manière intrusive ;
- évaluation du temps passé.

---

## PHASE 5 — Bilan quotidien et “Explain this work”

### Objectif
Créer la première valeur claire de GhostCommit : un brouillon de rapport quotidien que l'utilisateur peut comprendre, modifier et valider.

### Pages

#### 1. Rapport quotidien `/app/reports/daily/:date`
Structure :
- titre et date ;
- état : `Brouillon`, `À relire`, `Validé`;
- sélecteur de sessions incluses ;
- section “Travail réalisé” ;
- section “Impact / résultat” ;
- section “Livrables” ;
- section “Blocages” ;
- section “Prochaine priorité” ;
- panneau preuves ;
- actions : `Modifier`, `Régénérer`, `Valider`, `Exporter`.

#### 2. Modal “Explain this work”
Accessible depuis :
- session ;
- groupe de fichiers ;
- livrable ;
- rapport quotidien.

Choix de cible :
- manager non technique ;
- client ;
- recruteur ;
- professeur ;
- développeur technique ;
- changelog / README.

Données visibles :
- ce que le modèle recevra ;
- avertissement : “Aucun contenu de fichier n'est transmis” ;
- texte généré ;
- édition manuelle ;
- bouton `Copier` ;
- bouton `Ajouter au rapport`.

### Comportement de génération

Entrée LLM :
- période ;
- projet ;
- sessions non exclues ;
- noms de branches ;
- messages de commits ;
- groupes de fichiers filtrés ;
- statistiques ;
- notes utilisateur ;
- work items ;
- blocages.

Sortie exigée :
- factuelle ;
- non spéculative ;
- sans jugement de performance ;
- pas d'affirmation non soutenue par les preuves ;
- courte ;
- en français par défaut ;
- chaque phrase importante doit référencer les sessions/work items sources en interne.

### Exemple de format de sortie

```text
Travail réalisé
- Ajout d'un mécanisme de synchronisation différée des sessions lorsque la connexion est indisponible.
- Mise à jour de la configuration de suivi pour exclure les fichiers sensibles.

Impact
- Les sessions peuvent maintenant être conservées localement puis envoyées lorsque la connexion revient.

Blocage
- Aucun blocage déclaré.

Prochaine priorité
- Mettre en place l'écran de validation des rapports.
```

### User stories
- **En tant qu'utilisateur**, je veux obtenir un brouillon basé sur mon activité afin de ne pas repartir d'une page blanche.
- **En tant qu'utilisateur**, je veux modifier chaque phrase avant validation afin que le rapport reste vrai et personnel.
- **En tant qu'utilisateur**, je veux expliquer le même travail pour un client ou un recruteur afin de ne pas réécrire le contexte à chaque fois.
- **En tant qu'utilisateur**, je veux exclure une session avant génération afin d'éviter toute information hors sujet.

### API / données
- `POST /reports/daily/generate`
- `GET /reports/daily/:date`
- `PATCH /reports/:id`
- `POST /reports/:id/regenerate`
- `POST /reports/:id/approve`
- `POST /explain`
- `GET /reports/:id/evidence`

### Critères d'acceptation
- [ ] Un rapport ne peut pas être auto-partagé.
- [ ] L'utilisateur peut éditer intégralement le texte généré.
- [ ] Les sessions exclues n'apparaissent jamais dans le prompt de génération.
- [ ] L'interface indique si le brouillon est généré ou édité.
- [ ] “Explain this work” produit des textes adaptés aux six cibles.
- [ ] Une génération échouée ne détruit jamais la version déjà éditée par l'utilisateur.

### Hors périmètre
- génération entièrement automatique sans validation ;
- analyse de diff ou du contenu de fichiers ;
- recommandations de productivité.

---

## PHASE 6 — Livrables et preuves

### Objectif
Empêcher GhostCommit de devenir un simple générateur de texte IA. Chaque rapport doit pouvoir être relié à des éléments concrets et contrôlables.

### Pages

#### 1. Livrables `/app/work-items`
Contenu :
- liste de livrables ;
- statut : en cours, bloqué, terminé, archivé ;
- projet associé ;
- date de création / complétion ;
- nombre de preuves liées ;
- filtre par statut et projet ;
- bouton `Créer un livrable`.

#### 2. Détail livrable `/app/work-items/:id`
Contenu :
- titre ;
- description ;
- statut ;
- projet ;
- sessions liées ;
- commits liés ;
- note manuelle ;
- preuves ;
- présence dans des rapports ;
- actions : modifier, marquer terminé, ajouter preuve, archiver.

#### 3. Panneau de preuves dans les rapports
Pour chaque bloc de texte :
- afficher les sources associées ;
- permettre d'enlever une preuve ;
- permettre d'ajouter une session/livrable ;
- ne jamais faire semblant qu'une phrase a une preuve si elle n'en a pas.

### Règles
- Un `WorkItem` est créé manuellement ; le système peut seulement proposer une création, jamais inférer un livrable comme certain.
- Une preuve peut être :
  - une session ;
  - un commit ;
  - un groupe de fichiers filtrés ;
  - une note manuelle.
- L'utilisateur décide de l'inclusion dans les rapports.
- Les preuves restent privées sauf partage du rapport qui les utilise.

### User stories
- **En tant qu'utilisateur**, je veux associer un livrable aux sessions qui le prouvent afin de montrer un avancement concret.
- **En tant qu'utilisateur**, je veux corriger les preuves retenues par l'outil afin que le rapport ne simplifie pas excessivement mon travail.
- **En tant qu'utilisateur**, je veux déclarer un blocage afin de documenter une difficulté sans que cela soit interprété comme un échec.

### API / données
- `POST /work-items`
- `GET /work-items`
- `GET /work-items/:id`
- `PATCH /work-items/:id`
- `POST /work-items/:id/evidence`
- `DELETE /work-items/:id/evidence/:evidenceId`
- `GET /reports/:id/evidence`

### Critères d'acceptation
- [ ] Un livrable peut être créé, modifié, terminé, archivé.
- [ ] Une session supprimée retire ou marque clairement ses liens de preuve.
- [ ] Un rapport indique les éléments qui soutiennent une affirmation.
- [ ] L'utilisateur peut retirer une preuve d'un rapport sans supprimer la session source.
- [ ] Aucun livrable ne devient public sans action explicite.

### Hors périmètre
- synchronisation Jira/Linear ;
- assignation à des collègues ;
- estimation automatique de travail.

---

## PHASE 7 — Rapport hebdomadaire, partage et export

### Objectif
Transformer l'activité validée en un document concret à utiliser pour un client, une école ou une équipe.

### Page `/app/reports`

#### Liste de rapports
- rapports quotidiens ;
- rapports hebdomadaires ;
- statut ;
- période ;
- dernière modification ;
- mode de partage ;
- actions : ouvrir, dupliquer, exporter, supprimer.

#### Création d'un rapport hebdomadaire
L'utilisateur choisit :
- période ;
- projets inclus ;
- sessions/livrables inclus ;
- audience ;
- modèle :
  - client ;
  - recruteur ;
  - professeur ;
  - équipe technique ;
  - personnel.

Le système génère un brouillon structuré :
1. objectifs et contexte ;
2. réalisations ;
3. impact ;
4. livrables ;
5. blocages et décisions ;
6. prochaines priorités ;
7. annexes/preuves facultatives.

#### Export
Formats V1 :
- Markdown ;
- PDF.

Le PDF doit être propre, imprimable, avec :
- titre ;
- période ;
- informations du créateur ;
- sections ;
- footer “Généré avec GhostCommit” optionnel et désactivable ;
- aucune donnée privée brute (fichiers, chemin, appareil) par défaut.

#### Partage par lien privé
V1.1 si le temps le permet, sinon après le PDF :
- lien à durée limitée ;
- révocable ;
- lecture seule ;
- pas d'indexation ;
- pas d'accès aux sessions sans autorisation claire.

### User stories
- **En tant que freelance**, je veux exporter un rapport hebdomadaire clair afin de tenir mon client informé.
- **En tant qu'étudiant**, je veux générer une version orientée professeur afin d'alimenter mon journal de bord.
- **En tant qu'utilisateur**, je veux voir un aperçu avant export afin d'éviter de partager des données inutiles.
- **En tant qu'utilisateur**, je veux révoquer un lien partagé afin de récupérer le contrôle sur une information diffusée.

### API / données
- `POST /reports/weekly/generate`
- `GET /reports`
- `GET /reports/:id`
- `PATCH /reports/:id`
- `POST /reports/:id/approve`
- `POST /reports/:id/export`
- `POST /reports/:id/share`
- `DELETE /reports/:id/share`
- `GET /shares/:token` (lecture limitée, si V1.1)

### Critères d'acceptation
- [ ] L'utilisateur peut produire un rapport sur une période personnalisée.
- [ ] L'export Markdown est conforme au contenu approuvé.
- [ ] Le PDF ne contient ni chemins absolus, ni hostname, ni contenu de fichiers.
- [ ] Le rapport ne peut être exporté qu'après prévisualisation.
- [ ] La suppression d'un rapport supprime son accès partagé.
- [ ] Les exports et partages créent un événement d'audit.

### Hors périmètre
- envoi automatique par email ;
- intégration Teams/Slack ;
- exports de performance d'équipe.

---

## PHASE 8 — Confidentialité, robustesse et release V1

### Objectif
Rendre GhostCommit digne d'être installé quotidiennement et montré publiquement.

### Pages

#### 1. Confidentialité `/app/privacy`
Sections :
- résumé de collecte ;
- dossiers/projets suivis ;
- patterns ignorés ;
- sessions exclues ;
- état de l'agent ;
- rétention des données ;
- export de données ;
- suppression de données ;
- journal d'audit.

Actions :
- pause globale ;
- reprendre ;
- exporter mes données ;
- supprimer une session ;
- supprimer un projet ;
- supprimer mon compte ;
- révoquer un appareil ;
- modifier rétention.

#### 2. Paramètres `/app/settings`
- profil ;
- langue ;
- fuseau horaire ;
- préférences de rapport ;
- fournisseur LLM ;
- modèle LLM ;
- option de désactivation totale de l'IA ;
- gestion des tokens/liens appareils ;
- informations de version.

### Sécurité et fiabilité

#### Authentification
- token access court ;
- refresh token révocable ;
- token appareil séparé du token utilisateur ;
- révocation effective ;
- rate limiting sur endpoints sensibles ;
- validation DTO stricte.

#### Données
- chiffrement en transit HTTPS ;
- configuration de production sans secrets dans le repository ;
- nettoyage des logs ;
- séparation entre identifiants d'appareil et données utilisateur ;
- rétention configurable ;
- sauvegardes base de données documentées.

#### Agent
- mise à jour version visible ;
- dossier de données local documenté ;
- file d'attente locale robuste ;
- bouton “effacer les données locales” ;
- comportement sûr en cas de crash ;
- pas de suivi quand l'utilisateur est déconnecté, révoqué ou en pause.

#### Tests
- tests unitaires sur filtrage de chemins ;
- tests unitaires sur déduplication ;
- tests d'intégration API ;
- tests de migration Prisma ;
- tests E2E dashboard pour parcours essentiel ;
- test manuel offline → reconnect ;
- test de révocation d'appareil ;
- test d'export sans données privées.

### User stories
- **En tant qu'utilisateur**, je veux voir et contrôler mes données afin de faire confiance au produit.
- **En tant qu'utilisateur**, je veux récupérer ou supprimer mes données afin de ne pas dépendre de GhostCommit.
- **En tant que mainteneur**, je veux des tests sur les chemins sensibles et l'idempotence afin d'éviter une régression de confidentialité ou de perte de données.

### Critères d'acceptation release
- [ ] Les parcours onboarding → agent → session → rapport → export fonctionnent de bout en bout.
- [ ] Une déconnexion réseau ne provoque aucune perte de session.
- [ ] La révocation agent bloque les synchronisations suivantes.
- [ ] Les données privées définies comme interdites ne sont ni stockées, ni envoyées, ni exportées.
- [ ] Le produit peut être installé sur une machine de test propre avec le README.
- [ ] Une démonstration de 3 minutes est possible avec données de démonstration.
- [ ] Tous les tests requis passent avant tag de release.

---

# 10. Contrats API détaillés

## 10.1 Convention générale
- Préfixe : `/api/v1`
- JSON en entrée/sortie
- réponses d'erreur cohérentes :
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Human-readable message",
      "details": []
    }
  }
  ```
- toutes les dates ISO 8601 UTC ;
- timezone préférée stockée côté utilisateur pour l'affichage ;
- pagination curseur pour longues listes ;
- tous les endpoints utilisateurs vérifient l'appartenance à l'espace.

## 10.2 Création de session

`POST /api/v1/activity/sessions`

Headers :
```text
Authorization: Bearer <agent-token>
Idempotency-Key: <clientSessionId>
```

Payload :
```json
{
  "clientSessionId": "8e8e1e1b-6c93-4658-80ef-a4a47994e882",
  "projectId": "uuid",
  "startedAt": "2026-06-22T09:00:00.000Z",
  "endedAt": "2026-06-22T10:30:00.000Z",
  "endedBy": "INACTIVITY",
  "files": [
    {
      "path": "src/services/activityTracker.ts",
      "changeCount": 4
    }
  ],
  "git": {
    "branch": "feature/session-sync",
    "commitCount": 1,
    "commits": [
      {
        "shortHash": "a1b2c3d",
        "message": "feat(agent): queue offline sessions"
      }
    ],
    "linesAdded": 54,
    "linesDeleted": 12
  },
  "manualNote": null,
  "redactionsApplied": ["ENV_FILE_PATTERN"]
}
```

Règles :
- `path` est relatif au projet ;
- la validation refuse les chemins absolus ;
- les fichiers interdits sont refusés/remplacés côté agent avant l'appel, puis revalidés côté API ;
- `duration` est calculée côté serveur ou vérifiée selon la durée max raisonnable ;
- réponse 201 ou 200 si même clé d'idempotence.

## 10.3 Génération rapport quotidien

`POST /api/v1/reports/daily/generate`

```json
{
  "date": "2026-06-22",
  "workspaceId": "uuid",
  "projectIds": ["uuid"],
  "sessionIds": ["uuid"],
  "audience": "CLIENT",
  "language": "fr"
}
```

Réponse :
```json
{
  "reportId": "uuid",
  "status": "DRAFT",
  "content": {
    "completedWork": [],
    "impact": [],
    "deliverables": [],
    "blockers": [],
    "nextPriorities": []
  },
  "evidence": []
}
```

## 10.4 Explain this work

`POST /api/v1/explain`

```json
{
  "sourceType": "SESSION",
  "sourceId": "uuid",
  "audience": "RECRUITER",
  "language": "fr"
}
```

Réponse :
```json
{
  "text": "Mise en œuvre d'une stratégie offline-first...",
  "inputPreview": {
    "includedFields": ["project", "commitMessages", "filteredFileGroups", "stats"],
    "excludedFields": ["fileContents", "absolutePaths", "hostname"]
  }
}
```

---

# 11. Règles de sécurité et de confidentialité techniques

## 11.1 Filtrage obligatoire côté agent
Le filtrage est une défense principale, mais pas la seule. L'API doit aussi valider et rejeter les données non conformes.

Patterns minimaux :
```text
.git/**
node_modules/**
dist/**
build/**
.next/**
coverage/**
.env
.env.*
*.pem
*.key
*.p12
*.pfx
**/secrets/**
**/private/**
```

## 11.2 Données strictement interdites au serveur
- contenus de fichiers ;
- diff de code ;
- path absolu ;
- nom de machine brut ;
- identifiants système ;
- token Git ;
- token OAuth ;
- clé API ;
- variables `.env` ;
- contenu clipboard ;
- fichiers binaires.

## 11.3 Logs
- logger avec redaction des tokens ;
- pas de dump HTTP complet ;
- pas de logs de payload de session brut en production ;
- erreur LLM : log de l'identifiant de requête, pas du prompt complet.

## 11.4 Suppression
- supprimer une session supprime ses données visibles et la retire des agrégats ;
- les rapports doivent afficher une source manquante si une preuve a été supprimée ;
- la suppression de compte est asynchrone, confirmée, auditable et documentée ;
- l'agent local doit pouvoir supprimer son cache sans demander au serveur.

---

# 12. Tests et critères de qualité

## 12.1 Pyramide de tests

### Unitaires
- filtre de chemins ;
- masque de fichiers sensibles ;
- agrégation de session ;
- idempotence ;
- calcul de périodes ;
- génération d'état UI ;
- permissions ;
- format export.

### Intégration backend
- OAuth mocké ;
- création espace personnel ;
- liaison agent ;
- envoi session ;
- retry/déduplication ;
- génération et édition rapport ;
- révocation agent ;
- suppression session/rapport.

### E2E dashboard
Parcours critique :
1. login ;
2. onboarding ;
3. dashboard sans agent ;
4. agent simulé connecté ;
5. session synchronisée ;
6. rapport quotidien généré ;
7. texte modifié ;
8. rapport validé ;
9. export Markdown ;
10. session supprimée et vérification qu'elle disparaît des agrégats.

### Manuels
- Windows ;
- macOS ;
- Linux si l'agent est annoncé compatible ;
- offline ;
- veille/réveil ;
- mise en pause ;
- gros repository avec `node_modules`;
- projets contenant `.env`.

## 12.2 Definition of Done d'une fonctionnalité
Une fonctionnalité n'est terminée que si :
- code compilable ;
- types corrects ;
- tests utiles ajoutés ;
- erreur et états vides traités ;
- interface accessible au clavier ;
- aucune donnée interdite exposée ;
- API documentée ;
- changelog/BUILD_LOG mis à jour ;
- captures ou vidéo de validation ajoutées lorsque pertinent.

---

# 13. Backlog priorisé

## P0 — indispensable à la première démo
1. Dashboard React et app shell.
2. Authentification + espace personnel.
3. Liaison agent.
4. Projets explicitement suivis.
5. Sessions agent idempotentes et offline.
6. Timeline de sessions.
7. Rapport quotidien en brouillon.
8. Édition / validation humaine.
9. Export Markdown.
10. Paramètres confidentialité.

## P1 — nécessaire à une V1 partageable
1. Livrables/work items.
2. Preuves liées aux sessions.
3. Rapport hebdomadaire.
4. Export PDF.
5. Révocation d'agent.
6. Suppression/export de données.
7. Tests E2E.
8. CI complète.

## P2 — après validation réelle
1. Lien de partage privé révocable.
2. GitLab.
3. Invitations d'équipe.
4. Intégration Slack/Discord.
5. Jira/Linear.
6. Modèles de rapports personnalisés.
7. Local LLM optionnel.
8. Déploiement SaaS multi-tenant.

---

# 14. Plan de démonstration V1

La démo doit montrer une histoire complète, pas des écrans isolés.

1. Ouvrir GhostCommit Dashboard.
2. Montrer la carte confidentialité et le statut agent.
3. Simuler ou effectuer une petite modification dans un repo test.
4. Montrer la session qui remonte dans la timeline.
5. Ouvrir le brouillon quotidien généré.
6. Modifier une phrase et ajouter un livrable.
7. Voir la preuve liée à la session.
8. Valider le rapport.
9. Exporter un Markdown ou PDF.
10. Ouvrir Confidentialité et montrer pause / exclusion / suppression.

Durée cible : 3 minutes.

---

# 15. Protocole d'exécution pour Codex

## 15.1 Règle de travail
Codex doit implémenter **une phase à la fois**. Il ne doit pas “anticiper” les phases suivantes avec des fonctionnalités vagues, non testées ou inutilisées.

Avant chaque phase :
1. lire ce document ;
2. inspecter le code existant ;
3. produire un plan de fichiers à modifier ;
4. identifier les risques techniques ;
5. implémenter uniquement le périmètre annoncé ;
6. lancer les tests/lint/typecheck/build ;
7. corriger avant de déclarer la phase terminée ;
8. mettre à jour `docs/BUILD_LOG.md`.

## 15.2 Instructions Codex à utiliser

```text
Tu travailles sur le repository GhostCommit.

Lis d'abord :
- docs/GHOSTCOMMIT_DEVELOPMENT_SPEC.md
- README.md
- les fichiers liés à la phase demandée.

Objectif : implémenter uniquement la PHASE [NUMÉRO] du document.

Contraintes absolues :
- Ne collecte jamais le contenu de fichiers, les frappes clavier, screenshots, navigation web, chemins absolus, hostname brut, secrets ou .env.
- Toute donnée d'activité doit être contrôlable par l'utilisateur.
- Aucun rapport ne doit être partagé automatiquement.
- Ne crée pas de métrique de performance ou de classement.
- Préserve l'architecture existante backend/agent/shared et ajoute dashboard sans réécriture inutile.
- Écris des tests pour la logique nouvelle.
- Mets à jour l'API et docs si nécessaire.
- N'implémente aucune fonctionnalité hors de la phase.

Processus :
1. Donne un plan court.
2. Liste les fichiers à créer/modifier.
3. Implémente.
4. Exécute lint, typecheck, tests et build.
5. Résume les résultats, risques restants et fichiers modifiés.
6. Mets à jour docs/BUILD_LOG.md avec la phase, les décisions et commandes de validation.
```

## 15.3 Ordre conseillé de lancement
- Prompt Codex 1 : Phase 0.
- Prompt Codex 2 : Phase 1.
- Prompt Codex 3 : Phase 2.
- Prompt Codex 4 : Phase 3.
- Prompt Codex 5 : Phase 4.
- Prompt Codex 6 : Phase 5.
- Prompt Codex 7 : Phase 6.
- Prompt Codex 8 : Phase 7.
- Prompt Codex 9 : Phase 8.

Ne pas lancer plusieurs phases en parallèle avant que les interfaces et contrats de la phase précédente soient validés.

---

# 16. Décisions à conserver pendant le développement

1. **Personal-first** : l'utilisateur reste la personne centrale.
2. **Privacy-first** : la minimisation de données n'est pas une fonctionnalité secondaire.
3. **Human approval** : aucun rapport n'est automatiquement diffusé.
4. **Evidence-first** : pas de narration IA non reliée à des éléments concrets.
5. **Local agent, cloud optional** : l'activité est captée localement et envoyée de manière minimale.
6. **No productivity scoring** : des données descriptives ne deviennent jamais un jugement.
7. **Finir avant d'élargir** : une bonne V1 vaut plus qu'un faux produit B2B tentaculaire.

---

# 17. Résultat attendu après V1

Un utilisateur peut :

1. créer son compte ;
2. installer/lier un agent ;
3. choisir un projet local Git ;
4. travailler normalement ;
5. voir des sessions synchronisées ;
6. comprendre et corriger les données retenues ;
7. générer un bilan quotidien ;
8. créer un rapport hebdomadaire ;
9. joindre des preuves ;
10. exporter un document propre ;
11. contrôler, supprimer et mettre en pause ses données.

Quand ces onze points fonctionnent de bout en bout, GhostCommit a une V1 crédible.
