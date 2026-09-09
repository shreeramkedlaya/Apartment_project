"""
apps.py – AppConfig for the flat Backend project.
"""

from django.apps import AppConfig


# This AppConfig is a placeholder for when a named Django app is added.
# In the current flat layout it is not registered in INSTALLED_APPS.
# To use it, move code into a proper app package (e.g. apps/users/)
# and set name = "apps.users".
class BackendConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    # Update 'name' to the actual dotted import path of the app before registering.
    name = ""  # e.g. "apps.users"
