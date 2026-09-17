# Notice Phase 4 — Scenario Acceptance Review

This document verifies the 10 core real-world business scenarios against the implementation of the `Apt_Notices` domain to ensure behavior, API, permissions, and automated test coverage are fully aligned.

---

### Scenario 1: Role-Based Broadcast (e.g., "Owner Only")
1. **Business requirement**: A notice intended only for Owners should not be visible to Tenants. If a Tenant is later promoted to an Owner, they should instantly see it.
2. **Domain behavior**: Targeting relies on `user_role = profile.role.name` dynamically evaluated at read time.
3. **Service implementation**: `is_user_targeted` matches `{"role": "Owner"}` against the current DB profile state.
4. **API behavior**: `GET /notices/my-notices/` filters the queryset using `get_targeted_notices_for_user`.
5. **Permission boundary**: Authenticated residents only.
6. **Automated test**: `test_scenario_dynamic_role`
7. **Expected result**: User3 (Tenant) gets 0 notices. User3 promoted to Owner gets 1 notice instantly without notice mutation. **(Verified)**

---

### Scenario 2: Precise Block & Flat Targeting
1. **Business requirement**: A water shutoff notice for Block A Flat 101 should only be visible to residents linked to that exact flat.
2. **Domain behavior**: Evaluates multiple AND conditions within a targeting group (`block` and `flat`).
3. **Service implementation**: `user_flat` dynamically resolves as `f"{user_block} - {profile.flat.number}"`. Target group `{"flat": "A - 101"}` strictly matches this string.
4. **API behavior**: Feeds exclude notices where `is_user_targeted` returns False.
5. **Permission boundary**: Authenticated residents only.
6. **Automated test**: `test_scenario_block_and_flat`
7. **Expected result**: User1 (Block A, 101) sees the notice. User3 (Block B, 201) does not. **(Verified)**

---

### Scenario 3: Multiple Disjoint Groups (OR Logic)
1. **Business requirement**: A general meeting notice targets all Owners globally OR anyone living in Block B. 
2. **Domain behavior**: The `target_audience` JSON array acts as an OR gate between its dictionary items.
3. **Service implementation**: Loop in `is_user_targeted` returns `True` immediately if *any* dictionary group successfully matches all its inner AND keys.
4. **API behavior**: Same read-time filtering as above.
5. **Permission boundary**: Authenticated residents.
6. **Automated test**: `test_scenario_multiple_groups`
7. **Expected result**: User1 (Owner, Block A) sees it. User3 (Tenant, Block B) sees it. User4 (Security) does not. **(Verified)**

---

### Scenario 4: The 15-Minute Edit Lock
1. **Business requirement**: To prevent retroactive alteration of announcements, authors can only edit a notice within 15 minutes of creation.
2. **Domain behavior**: Enforced strictly based on `created_at` timestamp.
3. **Service implementation**: `update_notice` calculates `now() - notice.created_at`. If `> 15 mins`, throws a `ValidationError`.
4. **API behavior**: `PUT /notices/<id>/` returns `400 Bad Request` if the edit window has elapsed.
5. **Permission boundary**: `community.notices.edit` role permission required to attempt the edit.
6. **Automated test**: `test_service_15_min_lock`
7. **Expected result**: Edit succeeds at `T+0`. Simulating a time jump to `T+16` causes the edit to fail. **(Verified)**

---

### Scenario 5: Unauthorized Status Tampering (Staff Creation)
1. **Business requirement**: Standard staff (with `.add` permissions but not `.approve` permissions) must not be able to bypass the approval queue by sending `{"status": "Published"}`.
2. **Domain behavior**: Status definition is dictated by the service, overriding client input when necessary.
3. **Service implementation**: `create_notice` verifies `has_approve_perm`. If False, it forcibly overwrites `data['status'] = Notice.Status.DRAFT`.
4. **API behavior**: `POST /notices/` returns `201 Created` with the JSON response showing `"status": "Draft"` despite the payload requesting "Published".
5. **Permission boundary**: Strict boundary isolating `.add` from `.approve`.
6. **Automated test**: `test_security_status_tampering`
7. **Expected result**: Malicious creation attempt succeeds but safely outputs a Draft. **(Verified)**

---

### Scenario 6: Notice Approval Workflow
1. **Business requirement**: A Draft notice must pass through a requested approval before going live to residents.
2. **Domain behavior**: The notice transitions from Draft -> Request Approval -> Pending Approval -> Approve/Reject.
3. **Service implementation**: **GAP IDENTIFIED**. While `approve_notice` and `reject_notice` exist, there is currently NO service method or API endpoint (e.g. `/notices/<id>/request-approval/`) implemented to initiate the request. The test manually inserts a `NoticeApproval` database row to simulate this step.
4. **API behavior**: Approvals are processed via `POST /notices/<id>/approve/`.
5. **Permission boundary**: Only users with `community.notices.approve` can trigger the endpoint.
6. **Automated test**: `test_scenario_approval_workflow`
7. **Expected result**: Notice transitions from Draft to Published upon approval, becoming visible in resident feeds. **(Gap in Request step, but Approval step Verified)**

---

### Scenario 7: Future Scheduling
1. **Business requirement**: Managers can queue a notice to go live tomorrow morning.
2. **Domain behavior**: Notice sits in `Scheduled` state. It is invisible to residents.
3. **Service implementation**: If `publish_date > now()`, `create_notice` (or `approve_notice`) sets the status to `Scheduled`. 
4. **API behavior**: API successfully sets the future date; resident feed returns 0 results.
5. **Permission boundary**: `.approve` permission required to schedule directly.
6. **Automated test**: `test_scenario_scheduling`
7. **Expected result**: Notice is created as `Scheduled` and is not broadcasted yet. **(Verified)**

---

### Scenario 8: Cancellation of Live Notice
1. **Business requirement**: If a live notice has misinformation, management can withdraw it.
2. **Domain behavior**: Notice status transitions from `Published` to `Cancelled`.
3. **Service implementation**: `cancel_notice` updates the status.
4. **API behavior**: `POST /notices/<id>/cancel/` triggers the withdrawal. `GET /notices/my-notices/` subsequently drops it from the feed.
5. **Permission boundary**: Distinct `community.notices.cancel` permission rule required (separated from `.delete`).
6. **Automated test**: `test_scenario_cancellation`
7. **Expected result**: Visible feed drops from 1 notice to 0 notices after cancellation. **(Verified)**

---

### Scenario 9: Safe Deletion Lifecycle Rules
1. **Business requirement**: Active or scheduled records cannot be permanently destroyed from the database to preserve audit trails.
2. **Domain behavior**: Deletion is entirely blocked based on current status.
3. **Service implementation**: `delete_notice` throws a `ValidationError` if status is `Published` or `Scheduled`.
4. **API behavior**: `DELETE /notices/<id>/` returns `400 Bad Request` for active notices, but `204 No Content` for Drafts.
5. **Permission boundary**: `.delete` permission required to even attempt the action.
6. **Automated test**: `test_security_deletion_rules`
7. **Expected result**: Drafts successfully delete. Published notices bounce with an error forcing cancellation instead. **(Verified)**

---

### Scenario 10: Automatic Expiration
1. **Business requirement**: A notice for a temporary event should naturally disappear from resident feeds once the event concludes.
2. **Domain behavior**: The `valid_until` boundary dictates feed presence.
3. **Service implementation**: The resident feed (`ResidentNoticeListAPIView`) explicitly filters out notices where `valid_until < now`, meaning the feed drops the notice immediately without waiting for background schedulers. A Celery beat task runs separately as a housekeeping mechanism to transition the database status to `Expired`.
4. **API behavior**: `GET /notices/my-notices/` dynamically excludes expired notices based on the current timestamp.
5. **Permission boundary**: System-level (cron/background).
6. **Automated test**: `test_scenario_expiration`
7. **Expected result**: Expired notice does not appear in the active resident feed, independent of Celery execution. **(Verified)**
