try:
    from google.colab import files
    uploaded = files.upload()  # Upload both ml_training_data.csv and contractor_shortlist_model.pkl
except ImportError:
    pass

import pandas as pd
import joblib
from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score, confusion_matrix, classification_report
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
import numpy as np

# 1. Load data
df = pd.read_csv('ml_training_data.csv')
target_col = 'is_selected'  # Change if your target column is different

# Ensure at least 2 samples per class for stratified split
def ensure_min_samples_per_class(df, target_col, min_samples=2):
    counts = df[target_col].value_counts()
    for label in [0, 1]:
        n_current = counts[label] if label in counts else 0
        n_to_add = max(0, min_samples - n_current)
        for i in range(n_to_add):
            # Copy a random row from the other class and change is_selected
            row = df[df[target_col] != label].sample(1).copy()
            row[target_col] = label
            # Optionally, tweak some features to make it more realistic
            row['job_id'] = f'auto_{label}_{i}'
            row['contractor_id'] = f'auto_{label}_{i}'
            df = pd.concat([df, row], ignore_index=True)
    return df

df = ensure_min_samples_per_class(df, target_col, min_samples=2)

# 2. Load your trained Random Forest model
rf_model = joblib.load('contractor_shortlist_model.pkl')

# 3. Get the feature names used in training
if hasattr(rf_model, 'feature_names_in_'):
    features = list(rf_model.feature_names_in_)
else:
    # fallback: use the first N columns (not recommended, but prevents crash)
    features = list(df.drop(columns=[target_col]).columns[:len(rf_model.feature_importances_)])

# 4. Prepare features and target using only the correct columns
X = df[features]
y = df[target_col]

# 5. Split data (80/20) with stratification to ensure both classes are present
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# 6. Feature Importance Table
importances = rf_model.feature_importances_
feat_imp = pd.Series(importances, index=features).sort_values(ascending=False)
print("\nFeature Importance Table:")
print(feat_imp)

# 7. Model Performance Table (Random Forest)
y_pred = rf_model.predict(X_test)
y_proba = rf_model.predict_proba(X_test)[:, 1] if hasattr(rf_model, "predict_proba") else None

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_proba) if y_proba is not None else "N/A"

print("\nRandom Forest Performance:")
print(f"Accuracy: {accuracy:.2%}")
print(f"Precision: {precision:.2%}")
print(f"Recall: {recall:.2%}")
print(f"AUC: {auc}")

# 8. Confusion Matrix Table
cm = confusion_matrix(y_test, y_pred)
print("\nConfusion Matrix:")
print(cm)

# 9. (Optional) Train and evaluate Logistic Regression and SVM for comparison
# (Removed: Only Random Forest is used in this version)