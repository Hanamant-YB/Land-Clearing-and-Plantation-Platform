"""
This script connects to MongoDB, fetches all users and jobs, and builds a fresh ml_training_data.csv
for AI model training. It includes both old and new data, and does not require manual JSON export.

Usage:
    python build_ml_dataset.py

Configure MONGO_URI and DB_NAME as needed.
"""
import pandas as pd
from pymongo import MongoClient
from bson import ObjectId

# --- CONFIGURE THIS ---
MONGO_URI = "mongodb://localhost:27017"  # Change if needed
DB_NAME = "contractor-platform"          # Change if your DB name is different
# ----------------------

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

users = list(db.users.find({}))
jobs = list(db.jobs.find({}))

# Build contractor lookup
contractors = {str(u['_id']): u for u in users if u.get('role') == 'contractor'}

rows = []

def get_id(val):
    # Handles ObjectId, dict with $oid, or string
    if isinstance(val, ObjectId):
        return str(val)
    if isinstance(val, dict) and '$oid' in val:
        return val['$oid']
    if isinstance(val, str):
        return val
    return None

for job in jobs:
    job_id = get_id(job.get('_id'))
    job_title = job.get('title', '')
    job_desc = job.get('description', '')
    job_worktype = job.get('workType', '')
    job_budget = job.get('budget', 0)
    job_location = job.get('location', '')
    job_required_skills = set(job.get('requiredSkills', []))
    job_status = job.get('status', '')
    selected_contractor = get_id(job.get('selectedContractor')) if job.get('selectedContractor') else None
    job_rating = job.get('rating', None)
    job_review = job.get('review', None)

    # Use aiShortlisted if available, else applicants
    contractor_ids = []
    if 'aiShortlisted' in job and job['aiShortlisted']:
        contractor_ids = [get_id(c) for c in job['aiShortlisted'] if c]
    elif 'applicants' in job and job['applicants']:
        contractor_ids = [get_id(c) for c in job['applicants'] if c]

    for contractor_id in contractor_ids:
        if not contractor_id:
            continue
        contractor = contractors.get(contractor_id)
        if not contractor:
            continue
        profile = contractor.get('profile', {})
        contractor_skills = set(profile.get('skills', []))
        completed_jobs = profile.get('completedJobs', 0)
        rating = profile.get('rating', 0)
        experience = len(profile.get('pastJobs', []))
        location_score = profile.get('locationScore', 0)
        reliability_score = profile.get('reliabilityScore', 0)
        experience_score = profile.get('experienceScore', 0)
        skill_match_score = profile.get('skillMatchScore', 0)
        ai_score = profile.get('aiScore', 0)

        # Feature engineering
        skill_overlap = len(job_required_skills & contractor_skills) if job_required_skills else 0
        skill_overlap_pct = (skill_overlap / len(job_required_skills)) if job_required_skills else 0
        budget_diff = 0 # Set to 0 or recalculate as needed
        is_selected = int(selected_contractor == contractor_id and job_status == 'completed')

        rows.append({
            'job_id': job_id,
            'contractor_id': contractor_id,
            'job_title': job_title,
            'job_desc': job_desc,
            'job_worktype': job_worktype,
            'job_budget': job_budget,
            'job_location': job_location,
            'job_required_skills': '|'.join(job_required_skills),
            'contractor_skills': '|'.join(contractor_skills),
            'completed_jobs': completed_jobs,
            'contractor_rating': rating,
            'contractor_experience': experience,
            'location_score': location_score,
            'reliability_score': reliability_score,
            'experience_score': experience_score,
            'skill_match_score': skill_match_score,
            'ai_score': ai_score,
            'skill_overlap': skill_overlap,
            'skill_overlap_pct': skill_overlap_pct,
            'budget_diff': budget_diff,
            'job_rating': job_rating,
            'job_review': job_review,
            'is_selected': is_selected
        })

# Save to CSV
df = pd.DataFrame(rows)
df.to_csv('ml_training_data.csv', index=False)
print(f"Extracted {len(df)} rows. Saved as ml_training_data.csv")
