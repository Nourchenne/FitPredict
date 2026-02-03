import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from pathlib import Path


def run_advanced_eda(file_path="data/raw/ObesityDataSet_raw_and_data_sinthetic.csv",
                     target_col="NObeyesdad",
                     out_dir="data"):
    """
    Performs Advanced Exploratory Data Analysis on the Obesity dataset.
    Saves plots into out_dir.
    """
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(file_path)

    print("--- Dataset Shape ---")
    print(df.shape)

    print("\n--- Columns ---")
    print(df.columns.tolist())

    print("\n--- Dtypes ---")
    print(df.dtypes)

    print("\n--- Missing Values ---")
    print(df.isna().sum().sort_values(ascending=False).head(30))

    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in dataset.")

    # 1) Target Distribution (Multi-class)
    plt.figure(figsize=(10, 5))
    df[target_col].value_counts(normalize=True).plot(kind="bar")
    plt.title("Target Proportion (Obesity Classes)")
    plt.ylabel("Percentage")
    plt.tight_layout()
    plt.savefig(out_dir / "target_distribution.png")
    plt.close()

    # Identify categorical vs numerical columns (excluding target)
    feature_cols = [c for c in df.columns if c != target_col]
    num_cols = df[feature_cols].select_dtypes(include=["int64", "float64"]).columns.tolist()
    cat_cols = df[feature_cols].select_dtypes(include=["object", "bool"]).columns.tolist()

    # 2) Categorical Analysis: impact on target (top 6 categorical)
    top_cat = cat_cols[:6]  # keep it readable
    if len(top_cat) > 0:
        rows = int(np.ceil(len(top_cat) / 2))
        fig, axes = plt.subplots(rows, 2, figsize=(16, 5 * rows))
        axes = np.array(axes).reshape(-1)

        for i, col in enumerate(top_cat):
            sns.countplot(data=df, x=col, hue=target_col, ax=axes[i])
            axes[i].set_title(f"{target_col} by {col}")
            axes[i].tick_params(axis="x", rotation=30)

        # hide unused axes
        for j in range(i + 1, len(axes)):
            axes[j].axis("off")

        plt.tight_layout()
        plt.savefig(out_dir / "categorical_impact.png")
        plt.close()

    # 3) Numerical Analysis: boxplots by target (top 6 numeric)
    top_num = num_cols[:6]
    if len(top_num) > 0:
        rows = int(np.ceil(len(top_num) / 2))
        plt.figure(figsize=(16, 5 * rows))

        for i, col in enumerate(top_num):
            plt.subplot(rows, 2, i + 1)
            sns.boxplot(data=df, x=target_col, y=col)
            plt.title(f"{col} distribution by {target_col}")
            plt.xticks(rotation=30)

        plt.tight_layout()
        plt.savefig(out_dir / "numerical_boxplots.png")
        plt.close()

    # 4) Multivariate: pairplot on a small subset (numeric only)
    # Pairplot can be heavy; sample + limit columns
    if len(num_cols) >= 2:
        pair_cols = num_cols[:4]  # keep only 4 numeric features for performance
        df_pair = df[pair_cols + [target_col]].sample(min(800, len(df)), random_state=42)
        sns.pairplot(df_pair, hue=target_col, diag_kind="kde")
        plt.savefig(out_dir / "multivariate_pairplot.png")
        plt.close()

    # 5) Correlation Heatmap (numeric features only)
    if len(num_cols) >= 2:
        plt.figure(figsize=(10, 8))
        corr = df[num_cols].corr()
        sns.heatmap(corr, annot=True, cmap="coolwarm", fmt=".2f", linewidths=0.5)
        plt.title("Numeric Feature Correlation Heatmap")
        plt.tight_layout()
        plt.savefig(out_dir / "correlation_heatmap.png")
        plt.close()

    print(f"\nAdvanced EDA completed. Plots saved in: {out_dir.resolve()}")
    print("Generated files:")
    for f in ["target_distribution.png", "categorical_impact.png", "numerical_boxplots.png",
              "multivariate_pairplot.png", "correlation_heatmap.png"]:
        p = out_dir / f
        if p.exists():
            print(" -", p)


if __name__ == "__main__":
    run_advanced_eda()
