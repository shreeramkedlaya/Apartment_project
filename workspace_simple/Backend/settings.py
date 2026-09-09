"""
settings.py – flat, single-file Django configuration.

Environment control (set in shell / docker-compose):
  DJANGO_ENV=production   →  production mode
  DJANGO_ENV=test         →  test mode
  (neither)               →  local development  ← default
"""

import warnings
import os

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)

from datetime import timedelta
from pathlib import Path
from corsheaders.defaults import default_headers  # type: ignore[import-untyped]

# ─── Environment detection ────────────────────────────────────────────────────

_env = os.environ.get("DJANGO_ENV", "").lower()
IS_PRODUCTION = (
    _env == "production" or os.environ.get("IS_PRODUCTION", "false").lower() == "true"
)
IS_TEST = (
    _env == "test" or os.environ.get("IS_TEST", "false").lower() == "true"
) and not IS_PRODUCTION
IS_LOCAL = not IS_PRODUCTION and not IS_TEST

# ─── Version ─────────────────────────────────────────────────────────────────
# Versions removed as requested.



# ─── Paths & core ────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent
SECRET_KEY = os.environ.get(
    "SECRET_KEY", "django-insecure-change-this-before-deploying-to-production"
)

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

SUPER_ADMIN_PHONES = {
    "+91 8296350150", # Add superadmin phone numbers here
}

ROOT_URLCONF = "urls"
WSGI_APPLICATION = "wsgi.application"
ASGI_APPLICATION = "asgi.application"



LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

DATA_UPLOAD_MAX_MEMORY_SIZE = 157_286_400  # 150 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 157_286_400  # 150 MB

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# ─── Per-environment settings ─────────────────────────────────────────────────

if IS_LOCAL:
    DEBUG = True
    ALLOWED_HOSTS = ["*"]
    MEDIA_ROOT = BASE_DIR / "media"
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    REDIS_HOST = "localhost"
    REDIS_PORT = 6379
    REDIS_DB = 0


else:  # IS_PRODUCTION or IS_TEST
    DEBUG = False
    ALLOWED_HOSTS = [
        h.strip()
        for h in os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
        if h.strip()
    ]
    MEDIA_ROOT = BASE_DIR / "media"
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [
        o.strip()
        for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
        if o.strip()
    ]
    REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
    REDIS_DB = int(os.environ.get("REDIS_DB", 0))



# Derived Redis URL – computed after the per-env block sets host/port/db
REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

# ─── Channels ─────────────────────────────────────────────────────────────────
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [(REDIS_HOST, REDIS_PORT)],
        },
    },
}

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
    "apt_proj",
    "apt_proj.Apt_Notifications",
]

# ─── Middleware ────────────────────────────────────────────────────────────────

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

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

# ─── Database – PostgreSQL ────────────────────────────────────────────────────

_DB_BASE = {
    "ENGINE": "django.db.backends.postgresql",
    "USER": "postgres",
    "PASSWORD": "test@123",
    "HOST": "localhost",
    "PORT": "5432",
    "OPTIONS": {},
}

_DB_NAMES = [
    # Add other dynamically routed database names here
]

DATABASES = {
    "default": {**_DB_BASE, "NAME": "apartment_db", "CONN_MAX_AGE": 600},
    **{name: {**_DB_BASE, "NAME": name, "CONN_MAX_AGE": 600} for name in _DB_NAMES},
}


# ─── Cache – Redis ────────────────────────────────────────────────────────────

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
    }
}

# ─── CORS ─────────────────────────────────────────────────────────────────────

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
CORS_PREFLIGHT_MAX_AGE = 86400
CORS_ALLOW_HEADERS = list(default_headers) + ["cache-control", "pragma"]

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

# ─── Celery ───────────────────────────────────────────────────────────────────

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
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 min hard limit
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60  # 25 min soft limit
CELERY_WORKER_PREFETCH_MULTIPLIER = 4
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
# Explicitly import top-level tasks.py (autodiscover_tasks only scans app packages)
CELERY_IMPORTS = ("tasks",)

# ─── Firebase Admin SDK ───────────────────────────────────────────────────────
import firebase_admin
from firebase_admin import credentials

firebase_key_path = BASE_DIR / "firebase-adminsdk.json"
if firebase_key_path.exists():
    try:
        # Check if already initialized to prevent errors on hot-reloads
        if not firebase_admin._apps:
            cred = credentials.Certificate(str(firebase_key_path))
            firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"Failed to initialize Firebase Admin: {e}")
