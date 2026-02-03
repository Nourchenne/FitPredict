import pandas as pd
import numpy as np
import mlflow
import mlflow.sklearn
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.over_sampling import SMOTE
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix, roc_curve, auc
import joblib
import os

# Set MLflow experiment name
EXPERIMENT_NAME = "Bank_Churn_Optimized"

def prepare_data(file_path="data/bank_churn.csv"):
    df = pd.read_csv(file_path)
    X = df.drop(['RowNumber', 'CustomerId', 'Surname', 'Exited'], axis=1)
    y = df['Exited']
    
    categorical_features = ['Geography', 'Gender']
    numerical_features = ['CreditScore', 'Age', 'Tenure', 'Balance', 'NumOfProducts', 'HasCrCard', 'IsActiveMember', 'EstimatedSalary']
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])
    
    return train_test_split(X, y, test_size=0.2, random_state=42, stratify=y), preprocessor

def plot_confusion_matrix(y_true, y_pred, model_name):
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False)
    plt.title(f'Confusion Matrix: {model_name}')
    plt.ylabel('Actual')
    plt.xlabel('Predicted')
    plt.tight_layout()
    filename = f"data/confusion_matrix_{model_name}.png"
    plt.savefig(filename)
    plt.close()
    return filename

def plot_roc_curve(y_true, y_prob, model_name):
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    roc_auc = auc(fpr, tpr)
    plt.figure(figsize=(6, 5))
    plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (area = {roc_auc:.2f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title(f'ROC Curve: {model_name}')
    plt.legend(loc="lower right")
    filename = f"data/roc_curve_{model_name}.png"
    plt.savefig(filename)
    plt.close()
    return filename

def run_optimized_experiment(model_name, model, param_grid):
    (X_train, X_test, y_train, y_test), preprocessor = prepare_data()
    
    mlflow.set_experiment(EXPERIMENT_NAME)
    
    with mlflow.start_run(run_name=model_name):
        # Custom handling for Stacking
        if model == "STACKING_PLACEHOLDER":
            base_learners = [
                ('rf', RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)),
                ('xgb', XGBClassifier(n_estimators=100, max_depth=3, use_label_encoder=False, eval_metric='logloss', random_state=42))
            ]
            model = StackingClassifier(
                estimators=base_learners,
                final_estimator=LogisticRegression(),
                cv=5
            )

        # Build Imbalanced Pipeline (SMOTE happens only during fit)
        pipeline = ImbPipeline(steps=[
            ('preprocessor', preprocessor),
            ('smote', SMOTE(random_state=42)),
            ('classifier', model)
        ])
        
        # Grid Search
        # Note: parameters should be prefixed with 'classifier__'
        grid_search = GridSearchCV(pipeline, param_grid, cv=3, scoring='f1', verbose=1, n_jobs=-1)
        grid_search.fit(X_train, y_train)
        
        best_model = grid_search.best_estimator_
        best_params = grid_search.best_params_
        
        # Log Best Parameters
        mlflow.log_params(best_params)
        
        # Predictions
        y_pred = best_model.predict(X_test)
        y_prob = best_model.predict_proba(X_test)[:, 1] if hasattr(best_model, "predict_proba") else None
        
        # Metrics
        acc = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        
        mlflow.log_metric("accuracy", acc)
        mlflow.log_metric("f1_score", f1)
        
        print(f"[{model_name}] Best Params: {best_params}")
        print(f"[{model_name}] Accuracy: {acc:.4f}, F1: {f1:.4f}")
        
        # Plots
        cm_path = plot_confusion_matrix(y_test, y_pred, model_name)
        mlflow.log_artifact(cm_path)
        
        if y_prob is not None:
            roc_path = plot_roc_curve(y_test, y_prob, model_name)
            mlflow.log_artifact(roc_path)
            
        # Log Model
        mlflow.sklearn.log_model(best_model, "model")
        
        return best_model, f1

if __name__ == "__main__":
    # Define models and grids
    models_config = {
        "RandomForest_SMOTE": {
            "model": RandomForestClassifier(random_state=42),
            "params": {
                'classifier__n_estimators': [100, 200],
                'classifier__max_depth': [10, 20, None],
                'classifier__min_samples_split': [2, 5]
            }
        },
        "XGBoost_SMOTE": {
            "model": XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42),
            "params": {
                'classifier__learning_rate': [0.01, 0.1],
                'classifier__n_estimators': [100, 200],
                'classifier__max_depth': [3, 6]
            }
        },
        "Stacking_Ensemble": {
            "model": "STACKING_PLACEHOLDER",  # Will handle in run_optimized_experiment
            "params": {
                'classifier__cv': [3, 5]
            }
        }
    }
    
    best_overall_model = None
    best_overall_f1 = -1
    
    for name, config in models_config.items():
        print(f"\nRunning {name}...")
        model, f1 = run_optimized_experiment(name, config["model"], config["params"])
        if f1 > best_overall_f1:
            best_overall_f1 = f1
            best_overall_model = model
            
    # Save best overall model
    if best_overall_model:
        joblib.dump(best_overall_model, "data/best_model_pipeline.pkl")
        print(f"\nBest model saved: F1={best_overall_f1:.4f}")
