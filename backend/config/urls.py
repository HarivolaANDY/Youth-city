"""
URL configuration for Youth City MVP Backend.

Versionnement de l'API :
- `/api/v1/...` : version courante (à utiliser pour tout nouveau client).
- `/api/...`    : alias historique de la v1, conservé pour la compatibilité
                  des clients existants. Déprécié : il sera retiré à l'arrivée d'une v2.
"""
from django.conf import settings
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('game.urls')),
    # Alias déprécié (namespace distinct pour éviter les collisions de noms d'URL)
    path('api/', include(('game.urls', 'game'), namespace='legacy')),
]

if settings.API_DOCS_ENABLED:
    urlpatterns += [
        path('api/v1/schema/', SpectacularAPIView.as_view(), name='api-schema'),
        path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='api-schema'), name='api-docs'),
    ]
