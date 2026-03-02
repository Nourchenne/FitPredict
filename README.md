# FitPredict

🎯 Objectif du projet

Le but de ce projet est de développer un modèle de Machine Learning capable de prédire le niveau d’obésité d’une personne à partir de ses habitudes alimentaires, de son mode de vie et de son activité physique.


🛠 Outils utilisés

- Pandas & NumPy — manipulation et traitement des données
- Matplotlib / Seaborn — visualisation des données
- Scikit-learn — modèles de Machine Learning
- MLflow — suivi des expériences et gestion des modèles
- FastAPI — création d’une API pour exposer le modèle
- Angular — interface utilisateur (frontend)


## 🚀 Containerisation Docker

Le projet inclut maintenant une stack conteneurisée complète :

- `backend` (FastAPI + modèle ML)
- `frontend` (Angular build + Nginx)
- `mlflow` (tracking des expériences)

### Prérequis (Windows)

Avant de lancer la stack, il faut installer **Docker Desktop** et s'assurer qu'il est démarré.

Vérification rapide dans PowerShell :

- `docker --version`
- `docker compose version`

Ou en une seule commande avec le script de precheck :

- `./scripts/docker-precheck.ps1`

Si ces commandes ne sont pas reconnues, Docker n'est pas encore installé (ou pas démarré).

### Lancer en local

Depuis la racine du projet :

- `docker compose up --build`

Alternative recommandée (précheck + lancement) :

- `./scripts/docker-precheck.ps1 -Start`

Services disponibles :

- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:8000`
- Backend health: `http://localhost:8000/health`
- MLflow: `http://localhost:5000`

### Arrêter la stack

- `docker compose down`


## 🤖 GitHub Actions

Deux workflows sont configurés dans `.github/workflows` :

1. `ci.yml`
	- lint + syntax check Python
	- build Angular
	- smoke build des images Docker backend/frontend

2. `docker-publish.yml`
	- build + push des images Docker vers **GHCR**
	- images publiées:
	  - `ghcr.io/<owner>/fitpredict-backend`
	  - `ghcr.io/<owner>/fitpredict-frontend`

Le push est déclenché sur `main` / `master`, tags `v*`, et manuellement (`workflow_dispatch`).

