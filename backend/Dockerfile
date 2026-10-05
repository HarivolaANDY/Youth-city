# ============================================================
# Youth City - Backend Production Dockerfile (Security Hardened)
# Conforme OWASP Top 10 & Agentic AI Sandboxing (P5)
# ============================================================

FROM python:3.12-slim AS base

# Sécurité & variables d'environnement Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8000

# Création d'un utilisateur et groupe système non-root dédié (Principe du moindre privilège)
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/false -M appuser

WORKDIR /app

# Installation des dépendances avec cache pip désactivé
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt gunicorn

# Copie du code source applicatif
COPY . /app/

# Attribution stricte des permissions au compte non-root
RUN chown -R appuser:appgroup /app && \
    chmod -R 755 /app

# Basculement vers l'utilisateur non privilégié
USER appuser

# Exposition du port applicatif
EXPOSE 8000

# Healthcheck périodique via la bibliothèque standard Python
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/game/state/', timeout=3)" || exit 1

# Démarrage sécurisé : migrations automatiques et serveur WSGI de production Gunicorn
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py seed_game_data && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --threads 2 --timeout 60 --access-logfile - --error-logfile -"]
