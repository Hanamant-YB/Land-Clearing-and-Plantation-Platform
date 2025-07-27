from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)

# Load the trained model
model = joblib.load('contractor_shortlist_model.pkl')

# Define the features your model expects
feature_cols = [
    'job_budget', 'completed_jobs', 'contractor_rating',
    'contractor_experience', 'location_score', 'reliability_score',
    'experience_score', 'skill_match_score', 'ai_score', 'skill_overlap',
    'skill_overlap_pct', 'budget_diff'
]

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    # Data should be a list of dicts, each dict = one (job, contractor) pair
    df = pd.DataFrame(data)
    preds = model.predict_proba(df[feature_cols])[:, 1]
    return jsonify({'predictions': preds.tolist()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
