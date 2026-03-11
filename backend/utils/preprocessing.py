import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_PATH = os.path.join(BASE_DIR, "../../data/raw/")
PROCESSED_PATH = os.path.join(BASE_DIR, "../../data/processed/")

os.makedirs(PROCESSED_PATH, exist_ok=True)


def process_framingham():

    df = pd.read_csv(RAW_PATH + "framingham.csv")

    df = df.dropna()

    df.to_csv(PROCESSED_PATH + "framingham_clean.csv", index=False)

    # ...existing code...


def process_heart():

    df = pd.read_csv(RAW_PATH + "heart_dataset.csv")

    df = df.dropna()

    df.to_csv(PROCESSED_PATH + "heart_clean.csv", index=False)

    # ...existing code...


def process_cardiac():

    df = pd.read_csv(RAW_PATH + "cardiac_failure.csv")

    if "id" in df.columns:
        df = df.drop("id", axis=1)

    df = df.dropna()

    df.to_csv(PROCESSED_PATH + "cardiac_clean.csv", index=False)

    # ...existing code...


if __name__ == "__main__":

    process_framingham()
    process_heart()
    process_cardiac()