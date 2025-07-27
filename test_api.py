import requests

# Example data (replace with real values if you want)
data = [{
    'job_budget': 50000,
    'completed_jobs': 10,
    'contractor_rating': 4.5,
    'contractor_avg_budget': 48000,
    'contractor_experience': 5,
    'location_score': 20,
    'reliability_score': 15,
    'experience_score': 10,
    'skill_match_score': 8,
    'ai_score': 30,
    'skill_overlap': 2,
    'skill_overlap_pct': 0.5,
    'budget_diff': 2000
}]

response = requests.post('http://127.0.0.1:5001/predict', json=data)
print(response.json())
