# 📊 Guide des Outputs de Modélisation

## 📁 Structure des Dossiers

```
reports/
└── model_comparison/
    └── run_YYYYMMDD_HHMMSS/
        ├── 00_MODELS_COMPARISON.png       # Graphique comparatif des modèles
        ├── 00_RESULTATS_COMPARAISON.csv   # Tableau récapitulatif
        ├── 01_confusion_matrix_RandomForest_SMOTE.png
        ├── 01_confusion_matrix_XGBoost_SMOTE.png
        ├── 01_confusion_matrix_LightGBM_SMOTE.png
        ├── 02_classification_report_RandomForest_SMOTE.txt
        ├── 02_classification_report_XGBoost_SMOTE.txt
        └── 02_classification_report_LightGBM_SMOTE.txt

models/
├── best_model_latest.pkl              # Meilleur modèle (version actuelle)
└── best_model_YYYYMMDD_HHMMSS.pkl    # Meilleur modèle (avec timestamp)
```

## 📝 Description des Fichiers

### 🔹 Fichiers de Comparaison (préfixe `00_`)
- **00_MODELS_COMPARISON.png** : Graphique comparant l'Accuracy et le F1-Score de tous les modèles
- **00_RESULTATS_COMPARAISON.csv** : Tableau CSV avec les performances de chaque modèle

### 🔹 Matrices de Confusion (préfixe `01_`)
- Visualisation des prédictions vs réalité pour chaque modèle
- Format : `01_confusion_matrix_{nom_modèle}.png`

### 🔹 Rapports Détaillés (préfixe `02_`)
- Métriques détaillées par classe (précision, recall, F1-score)
- Format : `02_classification_report_{nom_modèle}.txt`

## 🚀 Utilisation

Les fichiers sont automatiquement générés à chaque exécution de `modeling.py`. Le timestamp dans le nom du dossier permet de garder l'historique de toutes les exécutions.

Le fichier `best_model_latest.pkl` est toujours mis à jour avec le meilleur modèle de la dernière exécution.
