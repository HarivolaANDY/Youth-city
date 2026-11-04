"""Hooks de personnalisation du schéma OpenAPI (drf-spectacular)."""


def only_current_api_version(endpoints, **kwargs):
    """Ne documente que `/api/v1/...` et ignore l'alias historique `/api/...` (déprécié)."""
    return [
        (path, path_regex, method, callback)
        for (path, path_regex, method, callback) in endpoints
        if path.startswith('/api/v1/')
    ]
