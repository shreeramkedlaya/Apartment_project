import os
import sys
import django

# Set up Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apt_proj.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apt_proj.Apt_Issues.Issue_models import IssueCategory

User = get_user_model()

def run_test():
    print("Starting Issue Lifecycle Test...")
    client = APIClient()

    # Create a user to act as the creator/assignee
    user, _ = User.objects.get_or_create(username='testuser_lifecycle')
    user.set_password('password')
    user.save()
    
    # Authenticate
    client.force_authenticate(user=user)

    # Ensure we have a category
    cat, _ = IssueCategory.objects.get_or_create(name='Plumbing')

    # 1. Create an issue
    print("1. Creating Issue...")
    resp = client.post('/api/issues/', {
        "title": "Leaky Faucet",
        "description": "The kitchen faucet is leaking",
        "category": cat.id,
        "priority": "high",
        "flat_number": "A-101" # tests metadata packing
    }, format='json')
    
    if resp.status_code != 201:
        print(f"FAILED TO CREATE: {resp.data}")
        return
        
    issue_id = resp.data['id']
    print(f"   Success! Issue created with ID {issue_id}")

    # 2. Update status (pending -> assigned)
    print("2. Assigning Issue...")
    resp = client.patch(f'/api/issues/{issue_id}/', {
        "status": "assigned",
        "assigned_to": user.id
    }, format='json')
    
    if resp.status_code != 200:
        print(f"FAILED TO ASSIGN: {resp.data}")
        return
    print("   Success! Issue assigned.")
    
    # 3. Update status (assigned -> in_progress)
    print("3. In Progress...")
    resp = client.patch(f'/api/issues/{issue_id}/', {
        "status": "in_progress"
    }, format='json')
    
    if resp.status_code != 200:
        print(f"FAILED TO UPDATE TO IN PROGRESS: {resp.data}")
        return
    print("   Success! Issue in progress.")
    
    # 4. Resolve issue with notes
    print("4. Resolving Issue...")
    resp = client.patch(f'/api/issues/{issue_id}/', {
        "status": "resolved",
        "resolution_notes": "Replaced the O-ring"
    }, format='json')
    
    if resp.status_code != 200:
        print(f"FAILED TO RESOLVE: {resp.data}")
        return
    print("   Success! Issue resolved.")

    # 5. Check Timeline
    print("5. Checking Timeline...")
    resp = client.get(f'/api/issues/{issue_id}/')
    timeline = resp.data.get('timeline', [])
    print(f"   Timeline events: {len(timeline)}")
    for t in timeline:
        print(f"    - {t.get('status_from')} -> {t.get('status_to')} | {t.get('comment')}")

    print("ALL TESTS PASSED!")

if __name__ == '__main__':
    run_test()
