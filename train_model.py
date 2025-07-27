import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib

# Load the dataset
df = pd.read_csv('ml_training_data.csv')

# Features to use (you can add/remove features as needed)
feature_cols = [
    'job_budget', 'completed_jobs', 'contractor_rating',
    'contractor_experience', 'location_score', 'reliability_score',
    'experience_score', 'skill_match_score', 'ai_score', 'skill_overlap',
    'skill_overlap_pct', 'budget_diff'
]
X = df[feature_cols]
y = df['is_selected']

# Split into train and test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a Random Forest model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))

# Save the model
joblib.dump(model, 'contractor_shortlist_model.pkl')
print("Model saved as contractor_shortlist_model.pkl")
