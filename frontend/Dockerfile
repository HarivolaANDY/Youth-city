# ============================================================
# Youth City - Frontend Production Dockerfile (Multi-Stage Build)
# Conforme aux normes d'isolation et d'optimisation légère (P5)
# ============================================================

# Étape 1 : Construction des artefacts React & Vite
FROM node:22-alpine AS builder

WORKDIR /app

# Mise en cache optimale des dépendances
COPY package.json package-lock.json* ./
RUN npm install

# Copie des sources et compilation
COPY . ./
RUN npm run build

# Étape 2 : Serveur Web Nginx durci en production
FROM nginx:alpine AS runner

# Suppression de la page d'accueil par défaut de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copie des fichiers statiques compilés depuis l'étape de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copie de la configuration Nginx durcie
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposition du port HTTP
EXPOSE 80

# Healthcheck de disponibilité de l'application
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

# Lancement de Nginx au premier plan
CMD ["nginx", "-g", "daemon off;"]
