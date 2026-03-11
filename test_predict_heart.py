import requests

url = "http://localhost:8000/predict-heart"
data = {
    "Age": 65,
    "RestingBP": 180,
    "Cholesterol": 320,
    "FastingBS": 1,
    "MaxHR": 120,
    "Oldpeak": 2.5,
    "Sex_M": 1,
    "ChestPainType_ATA": 0,
    "ChestPainType_NAP": 0,
    "ChestPainType_TA": 1,
    "RestingECG_Normal": 0,
    "RestingECG_ST": 1,
    "ExerciseAngina_Y": 1,
    "ST_Slope_Flat": 1,
    "ST_Slope_Up": 0
}

response = requests.post(url, json=data)
print("Status Code:", response.status_code)
print("Response:", response.json())
