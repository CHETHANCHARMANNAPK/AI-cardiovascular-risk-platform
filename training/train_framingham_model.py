import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

df = pd.read_csv("data/processed/framingham_clean.csv")
y = df["TenYearCHD"]
X = df.drop("TenYearCHD", axis=1)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestClassifier(n_estimators=200)
model.fit(X_train, y_train)

preds = model.predict(X_test)
accuracy = accuracy_score(y_test, preds)
print("Model Accuracy:", accuracy)

os.makedirs("models", exist_ok=True)
joblib.dump(model, "models/framingham_model.pkl")
print("Model saved successfully")