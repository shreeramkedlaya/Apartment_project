from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify

class Block(models.Model):
    name = models.CharField(max_length=50, unique=True)
    
    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."apt_proj_block"'

    def __str__(self):
        return self.name

class Flat(models.Model):
    block = models.ForeignKey(Block, on_delete=models.CASCADE, related_name='flats')
    number = models.CharField(max_length=50)

    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."apt_proj_flat"'
        unique_together = ('block', 'number')

    def __str__(self):
        return f"{self.block.name} - {self.number}"


class Role(models.Model):
    """
    Named role with a set of permission_tabs.
    Admins create roles (e.g. 'Maintenance Manager') and assign them to users.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('draft', 'Draft'),
    ]

    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."apt_proj_role"'

    name = models.CharField(max_length=100, unique=True)
    code = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    permission_tabs = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @property
    def user_count(self):
        return self.user_profiles.count()


class UserProfile(models.Model):
    """
    Extends the default Django User.
    Stores the user's role, Firebase phone number, hashed MPIN, permission tabs, and flat association.
    """
    class Meta:
        app_label = 'apt_proj'
        db_table = '"apt_data"."apt_proj_userprofile"'
        
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # FK to the named Role (optional — falls back to permission_tabs below)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name='user_profiles')
    
    # Fallback permission tabs (used when no Role FK is assigned)
    permission_tabs = models.JSONField(default=list, blank=True)
    
    # Phone OTP & Fast MPIN Login
    phone_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    mpin = models.CharField(max_length=128, null=True, blank=True) # Stored securely via argon2
    
    # Apartment Association
    flat = models.ForeignKey(Flat, on_delete=models.SET_NULL, null=True, blank=True, related_name='residents')

    def __str__(self):
        return f"{self.user.username} - {self.role.name if self.role else 'Resident'}"

    def get_effective_permissions(self):
        """
        Effective permissions = Role.permission_tabs UNION UserProfile.permission_tabs.
        - Role tabs are the shared base for everyone in that role.
        - UserProfile.permission_tabs holds per-user extra (or overriding) grants.
        - If the user has no role, only their own tabs apply.
        """
        role_tabs = set(self.role.permission_tabs) if self.role else set()
        user_tabs = set(self.permission_tabs or [])
        return list(role_tabs | user_tabs)
