import joblib
import os
import logging

logger = logging.getLogger("cardioai")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")


def _load_model(name):
    path = os.path.join(MODELS_DIR, name)
    try:
        model = joblib.load(path)
        logger.info(f"Loaded model: {name}")
        return model
    except FileNotFoundError:
        logger.error(f"Model file not found: {path}")
        raise RuntimeError(f"Model file missing: {name}. Run training scripts first.")
    except Exception as e:
        logger.error(f"Failed to load model {name}: {e}")
        raise RuntimeError(f"Failed to load model {name}: {e}")


framingham_model = _load_model("framingham_model.pkl")
heart_model = _load_model("heart_model.pkl")
cardiac_model = _load_model("cardiac_model.pkl")