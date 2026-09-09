import json
from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from apt_proj.Apt_Accounts.Accounts_models import Block, Flat, Role, UserProfile
from .Notices_models import Notice, NoticeApproval, NoticeAcknowledgement
from .services import notice_service
from .services.targeting_service import is_user_targeted, get_targeted_notices_for_user

class NoticeModuleTests(TestCase):
    def setUp(self):
        # Create Roles
        self.owner_role = Role.objects.create(name='Owner', code='owner')
        self.tenant_role = Role.objects.create(name='Tenant', code='tenant')
        self.security_role = Role.objects.create(name='Security', code='security')
        self.manager_role = Role.objects.create(name='Manager', code='manager')

        # Create Blocks & Flats
        self.block_a = Block.objects.create(name='A')
        self.block_b = Block.objects.create(name='B')
        self.flat_a101 = Flat.objects.create(block=self.block_a, number='101')
        self.flat_a102 = Flat.objects.create(block=self.block_a, number='102')
        self.flat_b201 = Flat.objects.create(block=self.block_b, number='201')

        # Create Users
        # User 1: Block A, 101, Owner
        self.user1 = User.objects.create_user(username='user1', password='pw')
        UserProfile.objects.create(user=self.user1, role=self.owner_role, flat=self.flat_a101)

        # User 2: Block A, 101, Tenant (Scenario: Flat with Owner + Tenant)
        self.user2 = User.objects.create_user(username='user2', password='pw')
        UserProfile.objects.create(user=self.user2, role=self.tenant_role, flat=self.flat_a101)

        # User 3: Block B, 201, Tenant
        self.user3 = User.objects.create_user(username='user3', password='pw')
        UserProfile.objects.create(user=self.user3, role=self.tenant_role, flat=self.flat_b201)

        # User 4: Security (No Flat)
        self.user4 = User.objects.create_user(username='user4', password='pw')
        UserProfile.objects.create(user=self.user4, role=self.security_role)

        # User 5: Manager
        self.manager = User.objects.create_user(username='manager', password='pw')
        UserProfile.objects.create(user=self.manager, role=self.manager_role)

        self.client = APIClient()

    # ==========================
    # 1. Targeting Unit Tests
    # ==========================
    def test_targeting_exact_match(self):
        target = [{"role": "Owner", "block": "A", "flat": "101"}]
        self.assertTrue(is_user_targeted(self.user1, target))
        self.assertFalse(is_user_targeted(self.user2, target)) # Tenant

    def test_targeting_mismatch(self):
        target = [{"role": "Owner", "block": "B"}]
        self.assertFalse(is_user_targeted(self.user1, target)) # Block A
        self.assertFalse(is_user_targeted(self.user3, target)) # Tenant

    def test_targeting_partial_mismatch_and_logic(self):
        # AND within group
        target = [{"role": "Owner", "block": "A"}]
        self.assertTrue(is_user_targeted(self.user1, target))
        self.assertFalse(is_user_targeted(self.user2, target)) # Role mismatch
        self.assertFalse(is_user_targeted(self.user3, target)) # Both mismatch

    def test_targeting_or_logic_multiple_groups(self):
        # OR between groups
        target = [{"role": "Owner", "block": "A"}, {"role": "Security"}]
        self.assertTrue(is_user_targeted(self.user1, target)) # Group 1
        self.assertFalse(is_user_targeted(self.user2, target)) # Neither
        self.assertTrue(is_user_targeted(self.user4, target)) # Group 2

    def test_targeting_invalid_empty(self):
        self.assertFalse(is_user_targeted(self.user1, []))
        self.assertFalse(is_user_targeted(self.user1, None))
        
    def test_targeting_unknown_key_validation(self):
        # Logic safely fails on unknown keys
        target = [{"department": "Finance"}]
        self.assertFalse(is_user_targeted(self.user1, target))

    # ==========================
    # 2. Service Tests
    # ==========================
    def test_service_15_min_lock(self):
        notice = notice_service.create_notice(
            {"title": "Test", "content": "Test", "target_audience": [{"role": "Owner"}]}, 
            self.manager
        )
        # Should work
        notice_service.update_notice(notice, {"title": "Updated"}, self.manager)
        self.assertEqual(notice.title, "Updated")
        
        # Simulate time jump
        notice.created_at = timezone.now() - timedelta(minutes=16)
        notice.save()
        
        with self.assertRaisesMessage(DjangoValidationError, "locked 15 minutes"):
            notice_service.update_notice(notice, {"title": "Fails"}, self.manager)

    def test_service_approve_reject(self):
        notice = notice_service.create_notice(
            {"title": "Test", "content": "Test", "target_audience": [{"role": "Owner"}]}, 
            self.manager
        )
        NoticeApproval.objects.create(notice=notice, requested_by=self.manager, status=NoticeApproval.Status.PENDING)
        
        # Reject
        notice_service.reject_notice(notice, self.manager, "Bad")
        self.assertEqual(notice.approvals.last().status, NoticeApproval.Status.REJECTED)
        
        NoticeApproval.objects.create(notice=notice, requested_by=self.manager, status=NoticeApproval.Status.PENDING)
        
        # Approve
        notice_service.approve_notice(notice, self.manager)
        self.assertEqual(notice.approvals.last().status, NoticeApproval.Status.APPROVED)
        # Status should NOT auto-publish
        self.assertEqual(notice.status, Notice.Status.DRAFT)

    def test_service_cancel(self):
        notice = notice_service.create_notice(
            {"title": "Test", "content": "Test", "target_audience": [{"role": "Owner"}]}, 
            self.manager
        )
        notice.status = Notice.Status.PUBLISHED
        notice.save()
        
        notice_service.cancel_notice(notice, self.manager)
        self.assertEqual(notice.status, Notice.Status.CANCELLED)

    def test_service_acknowledge(self):
        notice = notice_service.create_notice(
            {"title": "Test", "content": "Test", "target_audience": [{"role": "Owner"}], "requires_acknowledgement": True}, 
            self.manager
        )
        notice_service.acknowledge_notice(notice, self.user1)
        ack = NoticeAcknowledgement.objects.get(notice=notice, user=self.user1)
        self.assertEqual(ack.status, NoticeAcknowledgement.Status.ACKNOWLEDGED)

    # ==========================
    # 3. Scenario Tests & API Integration
    # ==========================
    def test_scenario_block_and_flat(self):
        n1 = Notice.objects.create(title="B A", content="A", target_audience=[{"block": "A"}], status=Notice.Status.PUBLISHED, created_by=self.manager)
        n2 = Notice.objects.create(title="F 101", content="101", target_audience=[{"flat": "101"}], status=Notice.Status.PUBLISHED, created_by=self.manager)
        
        self.client.force_authenticate(user=self.user1) # Block A, 101
        res = self.client.get('/api/my-notices/')
        ids = [n['id'] for n in res.data]
        self.assertIn(n1.id, ids)
        self.assertIn(n2.id, ids)

        self.client.force_authenticate(user=self.user3) # Block B, 201
        res2 = self.client.get('/api/my-notices/')
        ids2 = [n['id'] for n in res2.data]
        self.assertNotIn(n1.id, ids2)
        self.assertNotIn(n2.id, ids2)
        
    def test_scenario_approval_workflow(self):
        # Test full workflow: Draft -> Request -> Approve -> Publish
        notice = Notice.objects.create(title="T", content="C", target_audience=[{"role": "Owner"}], status=Notice.Status.DRAFT, created_by=self.manager)
        NoticeApproval.objects.create(notice=notice, requested_by=self.manager, status=NoticeApproval.Status.PENDING)
        
        self.client.force_authenticate(user=self.manager)
        self.client.post(f'/api/notices/{notice.id}/approve/')
        notice.refresh_from_db()
        self.assertEqual(notice.approvals.last().status, NoticeApproval.Status.APPROVED)
        self.assertEqual(notice.status, Notice.Status.DRAFT) # Not published yet
        
        self.client.post(f'/api/notices/{notice.id}/publish/')
        notice.refresh_from_db()
        self.assertEqual(notice.status, Notice.Status.PUBLISHED)
        
    def test_scenario_dynamic_role(self):
        notice = Notice.objects.create(title="Owner Only", content="C", target_audience=[{"role": "Owner"}], status=Notice.Status.PUBLISHED, created_by=self.manager)
        
        self.client.force_authenticate(user=self.user3) # Tenant
        res = self.client.get('/api/my-notices/')
        self.assertEqual(len(res.data), 0)
        
        # Change role
        self.user3.profile.role = self.owner_role
        self.user3.profile.save()
        
        res2 = self.client.get('/api/my-notices/')
        self.assertEqual(len(res2.data), 1)
        self.assertEqual(res2.data[0]['id'], notice.id)

    def test_scenario_multiple_groups(self):
        Notice.objects.create(
            title="Multi", content="C", 
            target_audience=[{"role": "Owner"}, {"block": "B"}], 
            status=Notice.Status.PUBLISHED, created_by=self.manager
        )
        self.client.force_authenticate(user=self.user1) # Owner, Block A -> Matches G1
        self.assertEqual(len(self.client.get('/api/my-notices/').data), 1)

        self.client.force_authenticate(user=self.user3) # Tenant, Block B -> Matches G2
        self.assertEqual(len(self.client.get('/api/my-notices/').data), 1)

        self.client.force_authenticate(user=self.user4) # Security, None -> Mismatches
        self.assertEqual(len(self.client.get('/api/my-notices/').data), 0)

    def test_scenario_scheduling(self):
        future = timezone.now() + timedelta(days=1)
        notice = Notice.objects.create(title="T", content="C", target_audience=[{"role": "Owner"}], publish_date=future, status=Notice.Status.DRAFT, created_by=self.manager)
        
        self.client.force_authenticate(user=self.manager)
        self.client.post(f'/api/notices/{notice.id}/publish/')
        notice.refresh_from_db()
        self.assertEqual(notice.status, Notice.Status.SCHEDULED)

    def test_scenario_cancellation(self):
        notice = Notice.objects.create(title="T", content="C", target_audience=[{"role": "Owner"}], status=Notice.Status.PUBLISHED, created_by=self.manager)
        
        self.client.force_authenticate(user=self.user1)
        self.assertEqual(len(self.client.get('/api/my-notices/').data), 1)
        
        # Cancel
        self.client.force_authenticate(user=self.manager)
        self.client.post(f'/api/notices/{notice.id}/cancel/')
        
        # Should drop from feed
        self.client.force_authenticate(user=self.user1)
        self.assertEqual(len(self.client.get('/api/my-notices/').data), 0)

    def test_scenario_expiration(self):
        past = timezone.now() - timedelta(days=1)
        Notice.objects.create(title="T", content="C", target_audience=[{"role": "Owner"}], status=Notice.Status.EXPIRED, valid_until=past, created_by=self.manager)
        
        self.client.force_authenticate(user=self.user1)
        self.assertEqual(len(self.client.get('/api/my-notices/').data), 0) # Feed excludes expired
        
    def test_serializer_invalid_key(self):
        data = {
            "title": "T",
            "content": "C",
            "target_audience": [{"department": "Finance"}]
        }
        self.client.force_authenticate(user=self.manager)
        res = self.client.post('/api/notices/', data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid targeting key", res.data['target_audience'][0])
