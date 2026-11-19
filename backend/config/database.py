"""Choix de la base de données (OPS-07) : PostgreSQL en production, SQLite réservée au développement."""
from urllib.parse import parse_qs, unquote, urlsplit

from django.core.exceptions import ImproperlyConfigured

POSTGRES_SCHEMES = {'postgres', 'postgresql'}


def database_from_url(url: str) -> dict:
    """Convertit une `DATABASE_URL` PostgreSQL (postgresql://user:mot_de_passe@hote:5432/base?sslmode=require)."""
    parts = urlsplit(url)
    if parts.scheme not in POSTGRES_SCHEMES:
        raise ImproperlyConfigured(
            f"DATABASE_URL: schéma « {parts.scheme or '?'} » non pris en charge (attendu : postgresql://)."
        )
    name = unquote(parts.path.lstrip('/'))
    if not parts.hostname or not name:
        raise ImproperlyConfigured("DATABASE_URL doit contenir un hôte et un nom de base (postgresql://user:pass@hote/base).")

    config = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': name,
        'USER': unquote(parts.username or ''),
        'PASSWORD': unquote(parts.password or ''),
        'HOST': parts.hostname,
        'PORT': str(parts.port or 5432),
        # Connexions réutilisées, mais vérifiées avant usage (redémarrage de la base sans erreur 500).
        'CONN_MAX_AGE': 60,
        'CONN_HEALTH_CHECKS': True,
    }
    options = {key: values[-1] for key, values in parse_qs(parts.query).items()}
    if options:
        config['OPTIONS'] = options
    return config


def resolve_databases(*, debug: bool, url: str | None, sqlite_path: str) -> dict:
    """Production (debug=False) : DATABASE_URL obligatoire, le démarrage échoue sinon."""
    if url:
        return {'default': database_from_url(url)}
    if not debug:
        raise ImproperlyConfigured(
            "DATABASE_URL est obligatoire lorsque DJANGO_DEBUG=False : la production exige PostgreSQL "
            "(SQLite est réservée au développement)."
        )
    return {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': sqlite_path}}
