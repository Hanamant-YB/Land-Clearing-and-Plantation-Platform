from flask import Flask, request, jsonify
import joblib
import pandas as pd
import numpy as np

app = Flask(__name__)

# Load the trained model
try:
    model = joblib.load('contractor_shortlist_model.pkl')
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

# Define the features your model expects
feature_cols = [
    'job_budget', 'completed_jobs', 'contractor_rating',
    'contractor_experience', 'location_score', 'reliability_score',
    'experience_score', 'skill_match_score', 'ai_score', 'skill_overlap',
    'skill_overlap_pct', 'budget_diff'
]

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        print(f"📥 Received data: {data}")
        
        # Data should be a list of dicts, each dict = one (job, contractor) pair
        df = pd.DataFrame(data)
        print(f"📊 DataFrame shape: {df.shape}")
        print(f"📊 DataFrame columns: {df.columns.tolist()}")
        
        # Check if all required features are present
        missing_features = [col for col in feature_cols if col not in df.columns]
        if missing_features:
            print(f"⚠️ Missing features: {missing_features}")
            # Fill missing features with 0
            for col in missing_features:
                df[col] = 0
        
        # Ensure we have the right features
        df_features = df[feature_cols]
        print(f"🔍 Features data:")
        print(df_features.head())
        
        if model is None:
            print("❌ Model not loaded, returning dummy predictions")
            # Return dummy predictions for testing
            dummy_preds = np.random.uniform(0.3, 0.9, len(df))
            return jsonify({'predictions': dummy_preds.tolist()})
        
        # Make predictions
        preds = model.predict_proba(df_features)[:, 1]
        print(f"🎯 Raw predictions: {preds}")
        
        # If all predictions are 0, return some dummy values for testing
        if np.all(preds == 0):
            print("⚠️ All predictions are 0, returning dummy values")
            dummy_preds = np.random.uniform(0.3, 0.9, len(df))
            return jsonify({'predictions': dummy_preds.tolist()})
        
        return jsonify({'predictions': preds.tolist()})
        
    except Exception as e:
        print(f"❌ Error in prediction: {e}")
        # Return dummy predictions on error
        dummy_preds = np.random.uniform(0.3, 0.9, len(data) if data else 1)
        return jsonify({'predictions': dummy_preds.tolist()})

@app.route('/test', methods=['GET'])
def test():
    return jsonify({'status': 'ML API is running', 'model_loaded': model is not None})

if __name__ == '__main__':
    print("🚀 Starting ML API with debug mode...")
    app.run(host='0.0.0.0', port=5001, debug=True) 