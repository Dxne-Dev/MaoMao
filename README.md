<div align="center">

# 🐱 MaoMao

**Un compagnon intelligent et discret au sommet de votre écran — gardant un œil en direct sur vos sessions d'agents IA, vos déploiements et vos services cloud.**

Validez les permissions, observez vos agents travailler, glissez-déposez des fichiers pour une analyse IA instantanée, et suivez vos services — sans jamais quitter votre espace de travail.

![Windows 10/11](https://img.shields.io/badge/Windows-10%2F11-0078D4?logo=windows&logoColor=white)
![macOS 15+](https://img.shields.io/badge/macOS-15%2B-black?logo=apple)
![Linux](https://img.shields.io/badge/Linux-AppImage%20%7C%20deb%20%7C%20rpm-FCC624?logo=linux&logoColor=black)
![Tauri 2](https://img.shields.io/badge/Tauri-2-FFC131?logo=tauri&logoColor=black)
![Rust](https://img.shields.io/badge/Rust-1.80%2B-DEA584?logo=rust&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

</div>

---

## ✨ Fonctionnalités & Points forts

### 🤖 Suivi Dynamique des Agents IA (Claude Code & autres)
- **Détection automatique de l'IDE / Terminal source :** MaoMao identifie en temps réel d'où provient votre session de code :
  - 🟣 **`Claude (Cursor)`**
  - ⚡ **`Claude (Antigravity)`**
  - 🔷 **`Claude (VS Code)`**
  - 🟦 **`Claude (PowerShell / Windows Terminal)`**
  - 🚀 **`Claude (Warp / Ghostty / Git Bash)`**
- **Défilé des actions en direct (Ticker) :** Suivez chaque action étape par étape (*« Modifie canvas.ts »*, *« Exécute npm test »*, *« Lit state.ts »*).
- **Validation des permissions en 1 clic :** Approuvez ou refusez les commandes sensibles (`Allow` / `Deny`) directement depuis l'Island avec les raccourcis clavier (`Y` / `N`).
- **Réponses aux questions interactives :** Répondez aux questions à choix multiples de Claude directement dans l'Island sans avoir à basculer vers votre terminal.

### 🔌 Intégrations Modulaires & Intégrations Personnalisées
- **Intégrations principales par défaut :** Préconfiguré d'origine avec **GitHub** (suivi des dépôts et étoiles ⭐) et **Vercel** (statut des déploiements en temps réel).
- **Services natifs activables :** Activez à la demande **Stripe**, **n8n**, **Resend**, **Notion** et **Cal.com**.
- **✨ Intégrations personnalisées (Custom Integrations) :** Ajoutez vos propres APIs, microservices, endpoints ou webhooks avec votre propre nom, URL et couleur d'accentuation !
- **Hooks d'agents tiers :** Reliez n'importe quel script ou CLI externe via `coucou-hook.exe --agent <nom>`.

### 💬 Chat IA Direct & Analyse de Fichiers (Glisser-Déposer)
- **Chat Claude intégré :** Accès direct aux modèles Claude 3.7 / 3.5 Sonnet, Opus et Haiku via votre clé API Anthropic officielle.
- **Glisser-Déposer de fichiers (Upload) :** Déposez n'importe quelle image, PDF, log ou fichier de code sur l'Island pour obtenir instantanément une analyse, un résumé ou une aide au débogage.

### 🎭 Mochi : Une Mascotte Vivante et Réactive
- Animations fluides en Canvas 2D à 60 FPS, yeux sphériques suivant votre curseur, émotions dynamiques (*en réflexion*, *au travail*, *terminé*, *étourdi*) et 28 effets sonores artisanaux.
- **Consommation CPU quasi nulle (0%)** en veille et lorsque l'Island est masquée.

### 🔒 Confidentialité & Sécurité Intégrée
- Zéro télémétrie, aucun compte requis.
- Toutes vos clés API et secrets sont conservés de manière chiffrée dans le **Gestionnaire d'identification Windows** (*Windows Credential Manager*), le **Trousseau macOS** ou le **Secret Service Linux**, jamais stockés en clair sur le disque.

---

## 🚀 Démarrage Rapide (Windows)

### Prérequis
- [Node.js](https://nodejs.org/) (v20+)
- [Rust](https://rustup.rs/) (dernière version stable)
- Outils de build C++ Visual Studio

### Lancer en mode Développement
```powershell
# Cloner le dépôt
git clone https://github.com/Dxne-Dev/MaoMao.git
cd MaoMao/windows

# Installer les dépendances
npm install

# Démarrer MaoMao
npm run tauri dev
```

### Compiler pour la Production
```powershell
npm run tauri build
```

---

## ⚙️ Configuration

Ouvrez les **Paramètres** (Settings) depuis l'icône de la barre des tâches ou le menu de l'Island :

| Section | Utilité | Emplacement du secret |
|---|---|---|
| **Claude Code** | Installe le relais local dans `~/.claude/settings.json` (sauvegarde automatique créée) | Pipe local Windows |
| **Claude API** | Alimente le Chat IA direct et l'analyse de fichiers déposés | Windows Credential Manager |
| **Integrations** | Connecte GitHub, Vercel, Stripe, n8n, Resend, Notion, Cal.com | Windows Credential Manager |
| **Custom Integrations** | Créez vos propres services, webhooks et agents sur-mesure | `settings.json` + Credential Manager |

---

## 📄 Licence

Code distribué sous licence [MIT](LICENSE).

