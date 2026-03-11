import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report

os.makedirs("models", exist_ok=True)

df = pd.read_csv("data/processed/cardiac_clean.csv")
print("Dataset Loaded Successfully")
print("Dataset Shape:", df.shape)

y = df["cardio"]
X = df.drop("cardio", axis=1)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print("Training samples:", X_train.shape[0])
print("Testing samples:", X_test.shape[0])

model = Pipeline([
    ("scaler", StandardScaler()),
    ("classifier", GradientBoostingClassifier(
        n_estimators=400,
        learning_rate=0.05,
        max_depth=3
    ))
])

model.fit(X_train, y_train)
print("Model training completed")

pred = model.predict(X_test)
acc = accuracy_score(y_test, pred)
print("\nCardiac Failure Model Accuracy:", acc)
print("\nDetailed Evaluation Report:\n")
print(classification_report(y_test, pred))

joblib.dump(model, "models/cardiac_model.pkl")
print("\nModel saved successfully in models/cardiac_model.pkl")