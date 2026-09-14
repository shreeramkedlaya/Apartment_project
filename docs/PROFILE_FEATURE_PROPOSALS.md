# "My Profile" Feature Proposals

Based on your current database schema and common requirements for apartment management applications, here is a breakdown of what we can develop for the **My Profile** section.

## 1. Immediate Features (Using Current Database)
We can build these features right away using your existing `UserProfile`, `User`, `Role`, and `Flat` models:

* **Personal Information Management**
  * View and edit basic details: First Name, Last Name, Email.
  * View current verified Phone Number.
* **Apartment & Role Association**
  * Read-only display of their assigned **Block & Flat** (e.g., `Block A - Flat 201`).
  * Display of their active **Role** (e.g., `Admin`, `Committee Member`, `Resident`) and a summary of what permissions they hold.
* **Security Settings**
  * **Update MPIN**: A flow to reset or change their 4-digit Fast Login MPIN.
  * **Change Password**: Standard password reset flow.

---

## 2. Extended Features (Requires New Database Models)
If you want to make the Profile section a comprehensive hub for residents, we can add new database models and build the following extensions:

* **Profile Avatars**
  * Add an avatar image upload feature so users can personalize their dashboard.
* **Family & Co-Residents Directory**
  * Allow users to add family members, dependents, or roommates to their flat. 
  * *Benefit:* Helps security guards know exactly who lives in the flat.
* **Vehicle Registration**
  * Allow residents to register their cars and motorcycles (Make, Model, License Plate).
  * *Benefit:* Streamlines parking management and helps identify unauthorized vehicles.
* **Emergency Contacts**
  * Add primary and secondary emergency contacts (Name, Relation, Phone).
* **Notification Preferences**
  * A settings toggle board to let users choose how they want to receive notices (e.g., Email only, SMS, In-App only).

### Next Steps
Let me know if you'd like to:
1. Start by building the **Immediate Features** using the existing data.
2. Pick some **Extended Features** (like Vehicles or Family Members) to add to the backend first.
