# Phase 1A — Authentification et fondations de données

## Périmètre

Implémenter uniquement OAuth GitHub, les sessions sécurisées, le consentement privacy-first, le workspace personnel et le statut d'onboarding. Aucune collecte d'activité, connexion de dépôt, interface dashboard, logique agent ou génération de rapport.

## Architecture retenue

- OAuth GitHub explicite côté backend, sans session Passport : état CSRF aléatoire, hashé en base, expirant et à usage unique.
- Callback serveur : validation de l'état, échange du code, lecture du profil GitHub, création ou reconnexion idempotente de l'utilisateur, création du workspace personnel et émission d'une session.
- Aucun jeton dans l'URL : le callback pose le cookie refresh puis redirige vers une URL frontend fixe. L'access token court est obtenu via `/auth/refresh`.
- Refresh token opaque à forte entropie ; seul son hash SHA-256 est persisté. Rotation atomique et révocation de toute la famille en cas de rejeu.
- Consentement versionné, horodaté en UTC et associé à une source. Son acceptation ne déclenche aucun traitement de collecte.
- Toutes les opérations protégées utilisent l'identité portée par le JWT ; aucun identifiant utilisateur client ne choisit la cible.

## Modèle Prisma

- `OAuthState` : `stateHash`, `expiresAt`, `consumedAt`, timestamps.
- `AuthSession` : `tokenHash`, `familyId`, `expiresAt`, `revokedAt`, `replacedById`, relation utilisateur.
- `PrivacyConsent` : utilisateur, version de politique, date d'acceptation, source, unicité utilisateur/version.
- `OnboardingStatus` : relation utilisateur 1:1, étape courante et date de fin facultative.
- `Team.personalOwnerId @unique` : garantit au niveau PostgreSQL un seul workspace personnel par utilisateur.

## Étapes TDD

1. Ajouter la migration Prisma initiale incluant les fondations 1A et rendre les migrations versionnées.
2. Ajouter une suite Jest d'intégration utilisant une vraie base PostgreSQL et un client GitHub injecté simulé.
3. Vérifier le rouge : routes absentes, schéma ou comportements sécurisés non implémentés.
4. Implémenter les DTO stricts, services et contrôleurs auth avec cookie sécurisé, rotation et révocation.
5. Implémenter les modules workspace personnel et onboarding/consentement.
6. Vérifier les scénarios utilisateur, reconnexion, unicité, consentement, contrôle d'accès A/B, rotation, rejeu, logout et absence de secrets dans URL/erreurs.
7. Ajouter PostgreSQL au workflow CI, déployer la migration avant les tests et supprimer `--passWithNoTests` du backend.
8. Documenter les contrats API, le modèle privacy-first, les cinq vulnérabilités hautes et le journal de build.
9. Exécuter migration sur PostgreSQL de test, lint, typecheck, tests et build complets.

## Fichiers principaux

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260622_phase_1a_auth_foundations/migration.sql`
- `backend/src/auth/**`
- `backend/src/workspaces/**`
- `backend/src/onboarding/**`
- `backend/test/**`
- `backend/package.json`, `.env.example`, `.github/workflows/ci.yml`, `.gitignore`
- `docs/API_CONTRACTS.md`, `docs/PRIVACY_MODEL.md`, `docs/DEPENDENCY_RISK_ASSESSMENT.md`, `docs/BUILD_LOG.md`

## Conditions de sortie

Toutes les routes 1A sont testées sur PostgreSQL réel ; les refresh tokens ne sont jamais stockés en clair ; aucun secret ou jeton n'apparaît dans une URL ou une erreur ; le consentement n'active aucune collecte ; aucune tâche 1B n'est commencée.
