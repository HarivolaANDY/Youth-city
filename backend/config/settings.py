"""
Django settings for config project.
Youth City MVP Backend.
"""

from pathlib import Path
from datetime import timedelta
import os

from .database import resolve_databases

BASE_DIR = Path(__file__).resolve().parent.parent

# Load local .env file if present
env_file = BASE_DIR / '.env'
if env_file.exists():
    try:
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    os.environ.setdefault(key.strip(), val.strip())
    except Exception:
        pass

INSECURE_DEV_SECRET = 'django-insecure-youth-city-mvp-secret-key-development'
KNOWN_INSECURE_SECRETS = {
    INSECURE_DEV_SECRET,
    'change-me-to-a-secure-random-secret-key-in-production',
    'youth-city-prod-docker-secret-key-change-me-in-env-file-0923847',
}
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', INSECURE_DEV_SECRET)
DEBUG = os.getenv('DJANGO_DEBUG', 'True').lower() in ('true', '1', 'yes')

if not DEBUG:
    if not SECRET_KEY or SECRET_KEY in KNOWN_INSECURE_SECRETS or len(SECRET_KEY) < 32:
        from django.core.exceptions import ImproperlyConfigured
        raise ImproperlyConfigured(
            "CRITICAL SECURITY ERROR: DJANGO_SECRET_KEY must be explicitly defined "
            "with a strong random secret (min. 32 characters) when DEBUG is False."
        )

allowed_hosts_env = os.getenv('DJANGO_ALLOWED_HOSTS')
if allowed_hosts_env:
    ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_env.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]', '0.0.0.0']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'drf_spectacular',

    # Local apps
    'game',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# PostgreSQL via DATABASE_URL ; SQLite seulement en développement (voir config/database.py).
DATABASES = resolve_databases(
    debug=DEBUG,
    url=os.getenv('DATABASE_URL'),
    sqlite_path=os.getenv('DJANGO_DB_PATH', str(BASE_DIR / 'db.sqlite3')),
)

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Indian/Antananarivo'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '120/minute',
        'user': '300/minute',
        'auth_login': '10/minute',
        'auth_register': '5/minute',
        'nova_chat': '20/minute',
        'nova_chat_daily': '200/day',
        'passport_verify': '30/minute',
    },
    'NUM_PROXIES': int(os.getenv('DJANGO_NUM_PROXIES', '1')),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# Mentor IA NOVA (§17.2) : fournisseur interchangeable par configuration.
# 'rules' (défaut) = conseils locaux gratuits ; 'anthropic' = Claude via le SDK officiel (requirements-ai.txt + ANTHROPIC_API_KEY).
NOVA_AI_PROVIDER = os.getenv('NOVA_AI_PROVIDER', 'rules')
NOVA_AI_MODEL = os.getenv('NOVA_AI_MODEL', 'claude-opus-5-5')
NOVA_AI_TIMEOUT_SECONDS = float(os.getenv('NOVA_AI_TIMEOUT_SECONDS', '8'))
NOVA_AI_MAX_TOKENS = int(os.getenv('NOVA_AI_MAX_TOKENS', '2000'))

# Documentation OpenAPI (drf-spectacular)
# Le schéma et l'interface Swagger ne sont exposés qu'en mode DEBUG, sauf activation
# explicite via DJANGO_ENABLE_API_DOCS=True (ex. environnement de recette).
API_DOCS_ENABLED = DEBUG or os.getenv('DJANGO_ENABLE_API_DOCS', 'False').lower() in ('true', '1', 'yes')

SPECTACULAR_SETTINGS = {
    'TITLE': 'Youth City API',
    'DESCRIPTION': (
        "API REST de la simulation Youth City : personnage, campus, emploi, finance, "
        "marché, startup, City Hub, mentor NOVA et Career Passport."
    ),
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SCHEMA_PATH_PREFIX': r'/api/v[0-9]+',
    'COMPONENT_SPLIT_REQUEST': True,
    'PREPROCESSING_HOOKS': ['config.openapi.only_current_api_version'],
}

# SimpleJWT settings - Stricter lifetimes and rotation
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=14),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
}

# CORS Configuration for Frontend Vite
cors_env = os.getenv('CORS_ALLOWED_ORIGINS')
if cors_env:
    CORS_ALLOWED_ORIGINS = [c.strip() for c in cors_env.split(',') if c.strip()]
else:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://[::1]:5173",
    ]
CORS_ALLOW_CREDENTIALS = True

# Security Hardening Headers & Flags (OWASP ASVS / Production)
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = os.getenv('DJANGO_SECURE_SSL_REDIRECT', 'False').lower() in ('true', '1')
SESSION_COOKIE_SECURE = os.getenv('DJANGO_SESSION_COOKIE_SECURE', 'False').lower() in ('true', '1')
CSRF_COOKIE_SECURE = os.getenv('DJANGO_CSRF_COOKIE_SECURE', 'False').lower() in ('true', '1')

if SECURE_SSL_REDIRECT:
    SECURE_HSTS_SECONDS = int(os.getenv('DJANGO_SECURE_HSTS_SECONDS', '31536000'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
