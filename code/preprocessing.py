import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

RAW_PATH = "data/raw/ObesityDataSet_raw_and_data_sinthetic.csv"
PROCESSED_DIR = "data/processed"

PREPROCESSOR_PATH = os.path.join(PROCESSED_DIR, "preprocessor.pkl")
LABEL_ENCODER_PATH = os.path.join(PROCESSED_DIR, "label_encoder.pkl")
X_TRAIN_PATH = os.path.join(PROCESSED_DIR, "X_train.csv")
X_TEST_PATH = os.path.join(PROCESSED_DIR, "X_test.csv")
Y_TRAIN_PATH = os.path.join(PROCESSED_DIR, "y_train.csv")
Y_TEST_PATH = os.path.join(PROCESSED_DIR, "y_test.csv")

TARGET_COL = "NObeyesdad"  # target du dataset UCI Obesity


def main():
    # 1) Load
    if not os.path.exists(RAW_PATH):
        raise FileNotFoundError(f"Dataset not found: {RAW_PATH}")

    df = pd.read_csv(RAW_PATH)
    print("Loaded shape:", df.shape)
    print(df.head(3))

    if TARGET_COL not in df.columns:
        raise ValueError(f"Target column '{TARGET_COL}' not found. Columns: {list(df.columns)}")

    # 2) Split X/y
    X = df.drop(columns=[TARGET_COL])
    y = df[TARGET_COL]

    # 3) Identify column types
    num_cols = X.select_dtypes(include=["int64", "float64", "int32", "float32"]).columns.tolist()
    cat_cols = X.select_dtypes(include=["object", "bool"]).columns.tolist()

    print("Numeric columns:", num_cols)
    print("Categorical columns:", cat_cols)
    print("Target distribution:\n", y.value_counts())

    # 4) Train/Test split (stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    # 5) Preprocessor
    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, num_cols),
            ("cat", categorical_transformer, cat_cols),
        ],
        remainder="drop"
    )

    # 6) Fit/transform
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)

    # 7) Feature names
    feature_names = []
    if num_cols:
        feature_names.extend(num_cols)
    if cat_cols:
        ohe = preprocessor.named_transformers_["cat"].named_steps["onehot"]
        ohe_names = ohe.get_feature_names_out(cat_cols).tolist()
        feature_names.extend(ohe_names)

    # 8) Encode target (multi-class)
    le = LabelEncoder()
    y_train_enc = le.fit_transform(y_train)
    y_test_enc = le.transform(y_test)

    # 9) Save
    os.makedirs(PROCESSED_DIR, exist_ok=True)

    joblib.dump(preprocessor, PREPROCESSOR_PATH)
    joblib.dump(le, LABEL_ENCODER_PATH)

    pd.DataFrame(X_train_processed, columns=feature_names).to_csv(X_TRAIN_PATH, index=False)
    pd.DataFrame(X_test_processed, columns=feature_names).to_csv(X_TEST_PATH, index=False)

    pd.Series(y_train_enc, name="target").to_csv(Y_TRAIN_PATH, index=False)
    pd.Series(y_test_enc, name="target").to_csv(Y_TEST_PATH, index=False)

    print("\n✅ Preprocessing done.")
    print("Saved in:", PROCESSED_DIR)
    print("X_train shape:", X_train_processed.shape)
    print("X_test shape :", X_test_processed.shape)
    print("Classes:", list(le.classes_))


if __name__ == "__main__":
    main()
