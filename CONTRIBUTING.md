# Contribuer à MaoMao

Merci de vouloir aider MaoMao à grandir ! 🫶

## Démarrage rapide

```powershell
# Cloner le dépôt
git clone https://github.com/Dxne-Dev/MaoMao.git
cd MaoMao/windows

# Installer les dépendances
npm install

# Lancer en mode développement
npm run tauri dev
```

> **macOS / Linux** : Le support multi-plateforme est en cours. Consultez `docs/PLATFORMS.md` pour l'état d'avancement.

## Bonnes premières contributions

- **Une nouvelle intégration de service** : un poller + une entrée dans `windows/src/views/integrations.ts` + une carte de détail. Regardez l'intégration `github` pour un exemple compact.
- **Un nouvel agent externe** : tout agent peut envoyer des événements via `coucou-hook.exe --agent <nom>` (voir `docs/AGENTS.md`). Ajoutez une entrée dans les intégrations uniquement si vous souhaitez qu'il soit déclarable dans Paramètres → Agents.
- **Une nouvelle émotion ou un son pour Mochi** : les animations sont dans `windows/src/mochi/`, les sons dans `windows/src-tauri/src/sounds/`.
- **Des corrections de bugs** — décrivez comment reproduire le problème.

## Règles de la maison

- TypeScript (frontend) + Rust / Tauri 2 (backend), **aucune dépendance tierce** sauf si vraiment incontournable.
- Les secrets vont dans le **Windows Credential Manager** (ou le Trousseau macOS / Secret Service Linux), jamais sur le disque ni dans git.
- Aucune télémétrie, aucun appel réseau vers des services non configurés par l'utilisateur.
- Ne jamais bloquer Claude Code : si l'app ne répond pas, le hook doit sortir immédiatement.
- Ne jamais écrire dans `~/.claude/settings.json` sans sauvegarde préalable et confirmation de l'utilisateur.
- Consommation CPU : **0 % lorsque l'Island est masquée**.

## Pull requests

- Un sujet par PR, avec un court GIF ou capture d'écran pour tout ce qui est visuel.
- Le build doit passer sans nouveaux avertissements (`npm run tauri build`).
- Respectez le style de code existant (ESLint + `rustfmt`).

## Structure du projet

```
MaoMao/
├── windows/                  # App principale (Tauri 2 + TypeScript)
│   ├── src/                  # Frontend TypeScript
│   │   ├── island/           # L'Island flottante
│   │   ├── mochi/            # Mascotte animée (Canvas 2D)
│   │   ├── settings/         # Interface des paramètres
│   │   ├── views/            # Vues des intégrations
│   │   └── upload/           # Glisser-déposer de fichiers
│   └── src-tauri/            # Backend Rust
│       └── src/
│           ├── island.rs     # Logique de l'Island
│           ├── integrations.rs
│           └── settings.rs
├── docs/                     # Documentation technique
├── scripts/                  # Scripts utilitaires
└── tests/                    # Tests
```
