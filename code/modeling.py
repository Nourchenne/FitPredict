import os
import joblib
import pandas as pd
import mlflow
import mlflow.sklearn
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix

from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.over_sampling import SMOTE

from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier


EXPERIMENT_NAME = "Obesity_Optimized"
RAW_PATH = "data/raw/ObesityDataSet_raw_and_data_sinthetic.csv"
TARGET_COL = "NObeyesdad"

# Create timestamped directories for better organization
TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")
BASE_REPORTS_DIR = "reports/model_comparison"
ARTIFACT_DIR = os.path.join(BASE_REPORTS_DIR, f"run_{TIMESTAMP}")
MODELS_DIR = "models"
BEST_MODEL_PATH = os.path.join(MODELS_DIR, f"best_model_{TIMESTAMP}.pkl")


def prepare_data(file_path=RAW_PATH):
    df = pd.read_csv(file_path)

    if TARGET_COL not in df.columns:
        raise ValueError(f"Target '{TARGET_COL}' not found. Columns: {list(df.columns)}")

    X = df.drop(columns=[TARGET_COL])
    y = df[TARGET_COL]

    # detect columns
    categorical_features = X.select_dtypes(include=["object", "bool"]).columns.tolist()
    numerical_features = X.select_dtypes(include=["int64", "float64", "int32", "float32"]).columns.tolist()

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", Pipeline(steps=[("scaler", StandardScaler())]), numerical_features),
            ("cat", Pipeline(steps=[("onehot", OneHotEncoder(handle_unknown="ignore"))]), categorical_features),
        ],
        remainder="drop"
    )

    # encode target
    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
    )

    return (X_train, X_test, y_train, y_test), preprocessor, le


def plot_confusion_matrix(y_true, y_pred, class_names, model_name):
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(9, 7))
    sns.heatmap(cm, annot=True, fmt='d', cmap="Blues", cbar=True)
    plt.title(f"Matrice de Confusion - {model_name}", fontsize=14, fontweight='bold')
    plt.ylabel("Classe Réelle", fontsize=12)
    plt.xlabel("Classe Prédite", fontsize=12)
    plt.tight_layout()

    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    filename = os.path.join(ARTIFACT_DIR, f"01_confusion_matrix_{model_name}.png")
    plt.savefig(filename, dpi=200, bbox_inches='tight')
    plt.close()
    return filename


def plot_models_comparison(results_df):
    """Create comparison plots for all models"""
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    # Plot 1: Accuracy comparison
    axes[0].bar(results_df['Model'], results_df['Accuracy'], color='skyblue', edgecolor='navy')
    axes[0].set_title('Comparaison de l\'Accuracy', fontsize=14, fontweight='bold')
    axes[0].set_ylabel('Accuracy', fontsize=12)
    axes[0].set_xlabel('Modèle', fontsize=12)
    axes[0].set_ylim([0, 1.0])
    axes[0].tick_params(axis='x', rotation=45)
    for i, v in enumerate(results_df['Accuracy']):
        axes[0].text(i, v + 0.02, f'{v:.4f}', ha='center', va='bottom', fontweight='bold')
    
    # Plot 2: F1-Score comparison
    axes[1].bar(results_df['Model'], results_df['F1_Macro'], color='lightcoral', edgecolor='darkred')
    axes[1].set_title('Comparaison du F1-Score (Macro)', fontsize=14, fontweight='bold')
    axes[1].set_ylabel('F1-Score', fontsize=12)
    axes[1].set_xlabel('Modèle', fontsize=12)
    axes[1].set_ylim([0, 1.0])
    axes[1].tick_params(axis='x', rotation=45)
    for i, v in enumerate(results_df['F1_Macro']):
        axes[1].text(i, v + 0.02, f'{v:.4f}', ha='center', va='bottom', fontweight='bold')
    
    plt.tight_layout()
    filename = os.path.join(ARTIFACT_DIR, '00_MODELS_COMPARISON.png')
    plt.savefig(filename, dpi=200, bbox_inches='tight')
    plt.close()
    return filename


def run_experiment(model_name, model, param_grid, use_smote=True):
    (X_train, X_test, y_train, y_test), preprocessor, label_encoder = prepare_data()

    mlflow.set_experiment(EXPERIMENT_NAME)

    with mlflow.start_run(run_name=model_name):
        os.makedirs(ARTIFACT_DIR, exist_ok=True)

        # Build Pipeline (SMOTE only during fit)
        if use_smote:
            pipeline = ImbPipeline(steps=[
                ("preprocessor", preprocessor),
                ("smote", SMOTE(random_state=42)),
                ("classifier", model),
            ])
        else:
            pipeline = Pipeline(steps=[
                ("preprocessor", preprocessor),
                ("classifier", model),
            ])

        grid = GridSearchCV(
            pipeline,
            param_grid=param_grid,
            cv=3,
            scoring="f1_macro", 
            verbose=1,
            n_jobs=-1
        )

        grid.fit(X_train, y_train)

        best_model = grid.best_estimator_
        best_params = grid.best_params_

        mlflow.log_params(best_params)

        # Predictions
        y_pred = best_model.predict(X_test)

        # Metrics
        acc = accuracy_score(y_test, y_pred)
        f1m = f1_score(y_test, y_pred, average="macro")

        mlflow.log_metric("accuracy", acc)
        mlflow.log_metric("f1_macro", f1m)

        # Report
        class_names = list(label_encoder.classes_)
        report = classification_report(y_test, y_pred, target_names=class_names)
        report_path = os.path.join(ARTIFACT_DIR, f"02_classification_report_{model_name}.txt")
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(f"="*60 + "\n")
            f.write(f"RAPPORT DE CLASSIFICATION - {model_name}\n")
            f.write(f"="*60 + "\n\n")
            f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Accuracy: {acc:.4f}\n")
            f.write(f"F1-Score (Macro): {f1m:.4f}\n")
            f.write("\n" + "="*60 + "\n")
            f.write(report)
        mlflow.log_artifact(report_path)

        # Confusion matrix plot
        cm_path = plot_confusion_matrix(y_test, y_pred, class_names, model_name)
        mlflow.log_artifact(cm_path)

        # Log model
        mlflow.sklearn.log_model(best_model, "model")

        print(f"\n[{model_name}] Best Params: {best_params}")
        print(f"[{model_name}] Accuracy: {acc:.4f} | F1_macro: {f1m:.4f}")

        return best_model, {"accuracy": acc, "f1_macro": f1m}


if __name__ == "__main__":
    models_config = {
        "RandomForest_SMOTE": {
            "model": RandomForestClassifier(random_state=42),
            "params": {
                "classifier__n_estimators": [200, 400],
                "classifier__max_depth": [None, 20, 40],
                "classifier__min_samples_split": [2, 5]
            }
        },
        "XGBoost_SMOTE": {
            "model": XGBClassifier(
                random_state=42,
                eval_metric="mlogloss",
                tree_method="hist"
            ),
            "params": {
                "classifier__learning_rate": [0.05, 0.1],
                "classifier__n_estimators": [300, 500],
                "classifier__max_depth": [3, 6]
            }
        },
        "LightGBM_SMOTE": {
            "model": LGBMClassifier(
                random_state=42,
                verbose=-1,
                force_col_wise=True
            ),
            "params": {
                "classifier__learning_rate": [0.05, 0.1],
                "classifier__n_estimators": [300, 500],
                "classifier__max_depth": [3, 6, 10],
                "classifier__num_leaves": [31, 50]
            }
        }
    }

    best_overall_model = None
    best_overall_f1 = -1
    results = []

    print("\n" + "="*70)
    print("🚀 DÉMARRAGE DE L'ENTRAÎNEMENT DES MODÈLES")
    print("="*70)

    for name, config in models_config.items():
        print(f"\n{'='*70}")
        print(f"📊 Entraînement: {name}")
        print(f"{'='*70}")
        model, metrics = run_experiment(name, config["model"], config["params"], use_smote=True)
        
        # Store results for comparison
        results.append({
            'Model': name,
            'Accuracy': metrics['accuracy'],
            'F1_Macro': metrics['f1_macro']
        })
        
        if metrics['f1_macro'] > best_overall_f1:
            best_overall_f1 = metrics['f1_macro']
            best_overall_model = model

    # Create comparison report
    print("\n" + "="*70)
    print("📈 CRÉATION DU RAPPORT DE COMPARAISON")
    print("="*70)
    
    results_df = pd.DataFrame(results)
    results_df = results_df.sort_values('F1_Macro', ascending=False)
    
    # Save comparison table
    comparison_file = os.path.join(ARTIFACT_DIR, '00_RESULTATS_COMPARAISON.csv')
    results_df.to_csv(comparison_file, index=False, encoding='utf-8')
    
    # Create comparison plot
    plot_models_comparison(results_df)
    
    # Print summary
    print("\n" + "="*70)
    print("📊 RÉSUMÉ DES PERFORMANCES")
    print("="*70)
    print(results_df.to_string(index=False))
    print("="*70)

    # Save best overall model pipeline
    if best_overall_model is not None:
        os.makedirs(MODELS_DIR, exist_ok=True)
        joblib.dump(best_overall_model, BEST_MODEL_PATH)
        
        # Also save with a fixed name for easy access
        latest_model_path = os.path.join(MODELS_DIR, "best_model_latest.pkl")
        joblib.dump(best_overall_model, latest_model_path)
        
        print(f"\n✅ Meilleur modèle sauvegardé:")
        print(f"   📁 Avec timestamp: {BEST_MODEL_PATH}")
        print(f"   📁 Version latest: {latest_model_path}")
        print(f"   🎯 F1-Score (Macro): {best_overall_f1:.4f}")
        print(f"\n📊 Tous les rapports disponibles dans: {ARTIFACT_DIR}")
        print("="*70)
