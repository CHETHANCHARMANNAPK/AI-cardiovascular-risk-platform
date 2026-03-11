# Dataset Descriptions — Cardio AI Platform

## 1. Heart Disease Dataset (`heart_dataset.csv`)

- **Source**: UCI Machine Learning Repository (Cleveland)
- **Size**: ~920 rows × 16 columns (after one-hot encoding)
- **Target**: `HeartDisease` (0 = No, 1 = Yes)
- **Features**:
  | Feature | Type | Description |
  |---------|------|-------------|
  | Age | Numeric | Patient age in years |
  | RestingBP | Numeric | Resting blood pressure (mm Hg) |
  | Cholesterol | Numeric | Serum cholesterol (mg/dL) |
  | FastingBS | Binary | Fasting blood sugar > 120 mg/dL |
  | MaxHR | Numeric | Maximum heart rate achieved |
  | Oldpeak | Numeric | ST depression induced by exercise |
  | Sex_M | Binary | Male (1) / Female (0) |
  | ChestPainType_* | Binary | One-hot encoded chest pain type |
  | RestingECG_* | Binary | One-hot encoded resting ECG result |
  | ExerciseAngina_Y | Binary | Exercise-induced angina |
  | ST_Slope_* | Binary | One-hot encoded ST slope |

---

## 2. Cardiac Failure Dataset (`cardiac_failure.csv`)

- **Source**: Kaggle Cardiovascular Disease Dataset
- **Size**: ~70,000 rows × 12 columns
- **Target**: `cardio` (0 = No cardiovascular disease, 1 = Disease present)
- **Features**:
  | Feature | Type | Description |
  |---------|------|-------------|
  | age | Numeric | Age (normalized 0–1) |
  | gender | Categorical | 1 = Female, 2 = Male |
  | height | Numeric | Height in cm |
  | weight | Numeric | Weight in kg |
  | ap_hi | Numeric | Systolic blood pressure |
  | ap_lo | Numeric | Diastolic blood pressure |
  | cholesterol | Ordinal | 1 = Normal, 2 = Above Normal, 3 = High |
  | gluc | Ordinal | 1 = Normal, 2 = Above Normal, 3 = High |
  | smoke | Binary | Smoker (0/1) |
  | alco | Binary | Alcohol intake (0/1) |
  | active | Binary | Physical activity (0/1) |

---

## 3. Framingham Dataset (`framingham.csv`)

- **Source**: Framingham Heart Study
- **Size**: ~4,200 rows (3,660 after dropping missing) × 16 columns
- **Target**: `TenYearCHD` (0 = Low risk, 1 = High 10-year CHD risk)
- **Features**:
  | Feature | Type | Description |
  |---------|------|-------------|
  | male | Binary | Sex (0 = Female, 1 = Male) |
  | age | Numeric | Patient age |
  | education | Ordinal | Education level (1–4) |
  | currentSmoker | Binary | Currently smokes (0/1) |
  | cigsPerDay | Numeric | Cigarettes per day |
  | BPMeds | Binary | On blood pressure medication |
  | prevalentStroke | Binary | History of stroke |
  | prevalentHyp | Binary | Hypertension diagnosis |
  | diabetes | Binary | Diabetes diagnosis |
  | totChol | Numeric | Total cholesterol (mg/dL) |
  | sysBP | Numeric | Systolic blood pressure |
  | diaBP | Numeric | Diastolic blood pressure |
  | BMI | Numeric | Body mass index |
  | heartRate | Numeric | Heart rate (bpm) |
  | glucose | Numeric | Blood glucose level |

---

## 4. ECG Signals Dataset (`ecg_signals.csv`)

- **Source**: PTB Diagnostic ECG Database (preprocessed)
- **Size**: ~123,995 columns (signal data points per row)
- **Target**: None (unsupervised anomaly detection)
- **Usage**: Isolation Forest detects anomalous heartbeat patterns
- **Notes**: Each row represents an ECG recording with ~4,000+ signal measurements. Columns are numeric indices representing time-series data points.
