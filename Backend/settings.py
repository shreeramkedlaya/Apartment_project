"""
settings.py – flat, single-file Django configuration.

Environment control (set in shell / docker-compose):
  DJANGO_ENV=production   →  production mode
  DJANGO_ENV=test         →  test mode
  (neither)               →  local development  ← default
"""

import warnings
import os
from datetime import timedelta
from pathlib import Path

import firebase_admin
from corsheaders.defaults import default_headers
from firebase_admin import credentials



# ─── Version Management ───────────────────────────────────────────────────────────────────
MAIN_VERSION = 1
SUB_VERSION = 0
VERSION = f"{MAIN_VERSION}.{SUB_VERSION}"

# ─── Paths ───────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent

# ─── Environment ──────────────────────────────────────────────────────────────

from dotenv import load_dotenv

# 1. Load the main .env file to identify active environment (local or production)
load_dotenv(BASE_DIR / ".env")

active_env = os.environ.get("ACTIVE_ENV", "local").strip().lower()
env_file = f".env.{active_env}"

# 2. Load the specific environment file (.env.local or .env.production)
load_dotenv(BASE_DIR / env_file, override=True)

SECRET_KEY = os.environ.get(
    "SECRET_KEY", "django-insecure-change-this-before-deploying-to-production"
)

DEBUG = os.getenv("DEBUG", "False").strip().lower() == "true"

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("ALLOWED_HOSTS", "*").split(",")
    if host.strip()
]

# ─── CORS ────────────────────────────────────────────────────────────────────

CORS_ALLOW_ALL_ORIGINS = (
    os.getenv("CORS_ALLOW_ALL_ORIGINS", "False").strip().lower() == "true"
)

CORS_ALLOWED_ORIGINS = [
    host.strip()
    for host in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
    if host.strip()
]


CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
]

CORS_ALLOW_HEADERS = list(default_headers) + [
    "cache-control",
    "pragma",
]

CORS_PREFLIGHT_MAX_AGE = 86400



# ─── Django Core ─────────────────────────────────────────────────────────────

ROOT_URLCONF = "urls"
WSGI_APPLICATION = "wsgi.application"
ASGI_APPLICATION = "asgi.application"



TIME_ZONE = "UTC"
USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ─── Media & Static ──────────────────────────────────────────────────────────

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# ─── Security ────────────────────────────────────────────────────────────────

SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# ─── Applications ─────────────────────────────────────────────────────────────

INSTALLED_APPS = [
    "daphne",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_celery_beat",
    "django_celery_results",
    # Local
    "apt_proj",
]

# ─── Middleware ────────────────────────────────────────────────────────────────

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
# ─── Templates ───────────────────────────────────────────────────────────────

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
            ],
        },
    },
]

# ─── Caching ─────────────────────────────────────────────────────────────────

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/2",
    }
}

# ─── Database ────────────────────────────────────────────────────────────────

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "apartment_db"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", "postgres"),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
        "CONN_MAX_AGE": 600,
    }
}


# ─── Redis ───────────────────────────────────────────────────────────────────

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))

REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"


# ─── Cache ───────────────────────────────────────────────────────────────────

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
    }
}

# ─── Django REST Framework ────────────────────────────────────────────────────

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_RENDERER_CLASSES": (
        "apt_proj.Apt_Common.renderers.StandardizedJSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ),
    "EXCEPTION_HANDLER": "apt_proj.Apt_Common.exceptions.standardized_exception_handler",
}

# ─── Simple JWT ───────────────────────────────────────────────────────────────

ACCESS_TOKEN_MINUTES = 10
REFRESH_TOKEN_DAYS = 7

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=ACCESS_TOKEN_MINUTES),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=REFRESH_TOKEN_DAYS),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# ─── Django Channels ─────────────────────────────────────────────────────────

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [(REDIS_HOST, REDIS_PORT)],
        },
    },
}


# ─── Celery ──────────────────────────────────────────────────────────────────

CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = "django-db"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_ENABLE_UTC = True
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_TIME_LIMIT = 30 * 60
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60
CELERY_WORKER_PREFETCH_MULTIPLIER = 4
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True


# ─── Firebase ────────────────────────────────────────────────────────────────

FIREBASE_KEY_PATH = os.getenv("FIREBASE_KEY_PATH", "firebase-adminsdk.json")
# ─── Application Configuration ───────────────────────────────────────────────

SUPER_ADMIN_PHONES = {
    "+91 8296350150",
}

# ─── Supabase Storage ────────────────────────────────────────────────────────

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY", "")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "APP-DEV")