import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

os.makedirs("models", exist_ok=True)

df = pd.read_csv("data/processed/heart_clean.csv")
y = df["HeartDisease"]
X = df.drop("HeartDisease", axis=1)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestClassifier(n_estimators=200)
model.fit(X_train, y_train)

pred = model.predict(X_test)
acc = accuracy_score(y_test, pred)
print("Heart Model Accuracy:", acc)

joblib.dump(model, "models/heart_model.pkl")
print("Heart model saved successfully")