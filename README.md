# FitPredict

🎯 Objectif du projet

Le but de ce projet est de développer un modèle de Machine Learning capable de prédire le niveau d’obésité d’une personne à partir de ses habitudes alimentaires, de son mode de vie et de son activité physique.


🛠 Outils utilisés

- Python — langage principal du projet
- Pandas & NumPy — manipulation et traitement des données
- Matplotlib / Seaborn — visualisation des données
- Scikit-learn — modèles de Machine Learning
- MLflow — suivi des expériences et gestion des modèles
- FastAPI — création d’une API pour exposer le modèle
• Angular — interface utilisateur (frontend)

## ⚙️ Installations nécessaires

### Prérequis
- Python 3.10+ (recommandé 3.11)
- Node.js 18+
- Git
- (Optionnel) Docker

### Backend (API FastAPI)
1. Créer et activer un environnement virtuel:

   ```bash
   # Windows PowerShell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. Installer les dépendances Python:

   ```bash
   pip install -r requirements.txt
   ```

3. Lancer l'API (rechargement auto):

   ```bash
   python -m uvicorn code.app:app --reload --host 0.0.0.0 --port 8000
   ```

4. Endpoints principaux:
   - `GET /health` — statut de l’API et chargement du modèle
   - `POST /predict` — prédiction pour un client (JSON conforme au schéma)
   - `POST /predict_batch` — prédictions en lot via fichier CSV

### Frontend (React + Vite)
1. Installer les dépendances:

   ```bash
   cd frontend
   npm install
   ```

2. Démarrer le serveur de dev:

   ```bash
   npm run dev
   ```

> Note: Le frontend actuel est basé sur React (Vite). Si vous souhaitez migrer vers Angular, il faudra adapter la structure et les scripts du dossier `frontend/`.

### Docker (optionnel)
Des fichiers `Dockerfile.backend`, `Dockerfile.frontend` et `docker-compose.yml` sont fournis pour un lancement conteneurisé. Après avoir vérifié vos variables et chemins:

```bash
docker compose up --build
```

## 🚀 Démarrer un nouveau dépôt Git (depuis zéro)
Si vous souhaitez repartir proprement, avec un historique Git neuf:

```bash
# 1) Supprimer l'ancien dossier .git (si présent)
Remove-Item -Recurse -Force .git

# 2) Initialiser un nouveau dépôt
git init
git add .
git commit -m "Initial commit"

# 3) Créer la branche par défaut
git branch -M main

# 4) Ajouter le dépôt distant
git remote add origin https://github.com/Nourchenne/FitPredict.git

# 5) Pousser (force si le distant a déjà un commit initial)
git push -u origin main --force
```

Assurez-vous que votre `.gitignore` ignore bien l’environnement virtuel (`.venv/`) et les notebooks Jupyter (`*.ipynb`).

## 📁 Structure utile
- `code/app.py` — API FastAPI (prédictions single/batch)
- `requirements.txt` — dépendances Python
- `frontend/` — application web (React + Vite)
- `data/` — jeux de données et artefacts (ex: pipeline entraîné)
- `docker-compose.yml` — orchestration docker

## 🔒 Bonnes pratiques
- Ne versionnez pas `.venv/` ni les notebooks temporaires (`*.ipynb`).
- Évitez d’ajouter de gros fichiers générés (images, modèles) si non nécessaires.
- Utilisez des branches pour les features et pull requests pour les revues.
