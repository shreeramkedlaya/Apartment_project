"""
wsgi.py – WSGI entry point.

Production: gunicorn wsgi:application --workers 4 --bind 0.0.0.0:8000
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")

application = get_wsgi_application()
