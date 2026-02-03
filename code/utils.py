from pathlib import Path
import pandas as pd

DATA_PATH = Path("data/raw/ObesityDataSet_raw_and_data_sinthetic.csv")
TARGET_COL = "NObeyesdad"

def load_data(path: Path = DATA_PATH) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {path.resolve()}")
    return pd.read_csv(path)

def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)
