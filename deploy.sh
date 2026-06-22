#!/bin/bash

# deploy.sh
echo "Déploiement automatique de la plateforme restaurant"

# Récupérer le code
git pull origin main

# Arrêter les conteneurs existants
docker-compose down

# Nettoyer les images non utilisées
docker system prune -f

# Construire et démarrer
docker-compose up -d --build

# Vérifier que tout est OK
sleep 10
docker-compose ps

echo "Déploiement terminé avec succès !"
echo "Frontend: http://$(curl -s ifconfig.me)"
echo "Eureka: http://$(curl -s ifconfig.me):8761"
echo "Gateway: http://$(curl -s ifconfig.me):8080"