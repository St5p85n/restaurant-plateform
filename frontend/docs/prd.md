# Cahier des charges

## 1. Présentation de l'application

### 1.1 Nom de l'application
RestauManager

### 1.2 Description
Application web de gestion complète pour restaurants permettant à plusieurs établissements de créer leur espace et de gérer l'ensemble de leurs opérations : réservations, commandes, stocks, personnel, finances et fidélité client. La plateforme propose un système d'abonnement multi-restaurants avec gestion centralisée des réclamations. Les clients peuvent également passer commande en ligne et suivre leur livraison en temps réel avec suivi GPS des livreurs sur carte interactive et navigation turn-by-turn. Les clients peuvent noter et commenter les plats après commande.

## 2. Utilisateurs et scénarios d'usage

### 2.1 Utilisateurs cibles
  - Propriétaire / Gérant de restaurant
  - Responsable de salle
  - Chef / Cuisine
  - Serveur
  - Livreur
  - Comptable / Admin
  - Clients finaux (réservations, commandes en ligne, fidélité, évaluation des plats)
  - Super Admin plateforme (gestion des abonnements et réclamations)

### 2.2 Scénarios d'usage principaux
  - Un restaurant s'inscrit et sa demande est mise en attente de validation
  - Le super admin consulte les demandes d'inscription et accepte ou rejette chaque demande
  - Un restaurant accepté choisit son abonnement et accède à son espace
  - Le gérant configure son établissement et invite son équipe
  - Les clients réservent en ligne via l'interface publique
  - Les clients passent commande en ligne et suivent la livraison avec position GPS du livreur et trajet routier optimisé
  - Les clients notent et commentent les plats après avoir reçu leur commande
  - Le personnel prend les commandes via le système POS
  - Le responsable suit l'activité en temps réel via la vue salle
  - Les livreurs reçoivent et traitent les commandes à livrer avec mise à jour automatique de leur position et instructions de navigation
  - Les clients accumulent des points de fidélité
  - Le restaurant consulte les évaluations clients sur ses plats
  - Le super admin traite les réclamations et gère les abonnements
  - Le super admin gère les restaurants inscrits sur la plateforme
  - Le super admin modifie les informations d'un restaurant depuis la liste admin
  - Le super admin consulte les statistiques avancées et exporte les rapports

## 3. Structure des pages et fonctionnalités

### 3.1 Structure globale
```
├── Interface publique (clients)
│   ├── Page d'accueil
│   ├── Réservation en ligne
│   ├── Commande en ligne
│   ├── Suivi de commande avec carte GPS
│   ├── Évaluation des plats
│   └── Espace client fidélité
├── Interface restaurant (personnel)
│   ├── Authentification
│   ├── Tableau de bord
│   ├── Réservations et plan de salle
│   ├── Gestion de la carte
│   ├── Prise de commande (POS)
│   ├── Gestion des commandes en ligne
│   ├── Gestion des livraisons avec suivi GPS
│   ├── Stocks et approvisionnement
│   ├── Planning du personnel
│   ├── Rapports financiers et caisse
│   ├── Clients et fidélité
│   ├── Réclamations et notes clients
│   └── Consultation des évaluations de plats
└── Interface Super Admin
    ├── Authentification
    ├── Tableau de bord plateforme
    ├── Tableau de bord administrateur avancé
    ├── Gestion des demandes d'inscription restaurant
    ├── Gestion des restaurants
    ├── Gestion des abonnements
    └── Traitement des réclamations
```

### 3.2 Interface publique

#### 3.2.1 Page d'accueil
  - Présentation de la plateforme
  - Liste des restaurants inscrits avec système de notation
  - Recherche et filtres (localisation, type de cuisine, disponibilité)
  - Accès à la réservation en ligne
  - Accès à la commande en ligne

#### 3.2.2 Réservation en ligne
  - Sélection du restaurant
  - Choix de la date, heure et nombre de personnes
  - Visualisation des disponibilités en temps réel
  - Confirmation de réservation
  - Envoi de notification au client et au restaurant

#### 3.2.3 Commande en ligne
  - Sélection du restaurant
  - Consultation de la carte avec images des plats
  - Affichage de la note moyenne par plat (étoiles + nombre d'avis)
  - Ajout de plats au panier
  - Modifications et annotations sur les plats
  - Choix du mode de livraison (livraison à domicile ou retrait sur place)
  - Saisie de l'adresse de livraison si applicable
  - Récapitulatif de la commande avec montant total
  - Choix du mode de paiement (carte bancaire, Wave, Orange Money)
  - Application des points de fidélité ou réductions disponibles
  - Validation et paiement de la commande
  - Confirmation de commande avec numéro de suivi

#### 3.2.4 Suivi de commande avec carte GPS
  - Accès via numéro de commande ou compte client
  - Affichage du statut en temps réel :
    + Commande reçue
    + En préparation
    + Prête pour livraison / retrait
    + En cours de livraison (avec position du livreur si livraison)
    + Livrée / Retirée
  - Carte interactive (Leaflet ou Google Maps) affichant :
    + Position actuelle du livreur (mise à jour toutes les 30 secondes)
    + Adresse de livraison du client
    + Trajet routier optimisé entre le restaurant et l'adresse de livraison calculé via API de routing (OpenRouteService ou Mapbox)
    + Marqueurs pour le restaurant, le livreur et la destination
    + Affichage du trajet sur les routes réelles avec prise en compte du trafic en temps réel
  - Estimation du temps de livraison basée sur le trajet routier optimisé et les conditions de trafic
  - Instructions de navigation turn-by-turn pour le livreur
  - Coordonnées du livreur si applicable
  - Historique des étapes de la commande

#### 3.2.5 Évaluation des plats
  - Accès après réception de la commande
  - Liste des plats commandés
  - Attribution d'une note de 1 à 5 étoiles par plat
  - Ajout d'un commentaire optionnel par plat
  - Validation et enregistrement de l'évaluation
  - Confirmation de soumission

#### 3.2.6 Espace client fidélité
  - Inscription et connexion client
  - Consultation du solde de points de fidélité
  - Historique des visites, réservations et commandes
  - Historique des évaluations soumises
  - Offres personnalisées disponibles
  - Réductions applicables
  - Soumission de réclamations
  - Attribution de notes et avis sur les restaurants

### 3.3 Interface restaurant

#### 3.3.1 Authentification
  - Inscription du restaurant avec mise en attente de validation
  - Connexion selon le profil utilisateur
  - Gestion des comptes utilisateurs par profil

#### 3.3.2 Tableau de bord et KPIs
  - Vue d'ensemble de l'activité du jour
  - Indicateurs clés : chiffre d'affaires, nombre de couverts, taux d'occupation, commandes en cours, commandes en ligne
  - Graphiques d'évolution sur périodes personnalisables
  - Alertes (stocks faibles, réservations à confirmer, nouvelles commandes en ligne)

#### 3.3.3 Réservations et plan de salle
  - Calendrier des réservations
  - Plan de salle interactif avec statut des tables en temps réel
  - Gestion des réservations (confirmation, modification, annulation)
  - Attribution des tables
  - Vue salle en temps réel : visualisation instantanée de l'occupation, des commandes en cours par table, du statut de service

#### 3.3.4 Gestion de la carte
  - Création et modification des catégories
  - Ajout, modification, suppression de plats
  - Gestion des prix, descriptions, allergènes
  - Activation/désactivation de plats selon disponibilité
  - Gestion des menus et formules
  - Upload d'images pour les articles de menu :
    + Sélection de fichier image depuis l'appareil
    + Prévisualisation de l'image avant validation
    + Formats acceptés : JPEG, PNG, WebP
    + Compression automatique des images lors de l'upload
    + Stockage dans Supabase Storage
    + Association de l'image au plat correspondant
  - Affichage des images dans les cartes d'articles :
    + Chargement progressif des images (lazy loading)
    + Affichage d'un placeholder pendant le chargement
    + Optimisation de l'affichage selon la taille d'écran

#### 3.3.5 Prise de commande (POS)
  - Sélection de la table
  - Ajout de plats à la commande
  - Modifications et annotations
  - Envoi en cuisine
  - Suivi du statut de préparation
  - Gestion des additions
  - Encaissement avec choix du mode de paiement (carte bancaire, Wave, Orange Money)

#### 3.3.6 Gestion des commandes en ligne
  - Réception des nouvelles commandes avec notification
  - Liste des commandes en attente de traitement
  - Acceptation ou refus de commande
  - Mise à jour du statut de préparation
  - Assignation d'un livreur pour les livraisons à domicile
  - Notification au client à chaque changement de statut
  - Historique des commandes en ligne

#### 3.3.7 Gestion des livraisons avec suivi GPS
  - Liste des commandes à livrer
  - Assignation des livreurs disponibles
  - Carte interactive (Leaflet ou Google Maps) affichant :
    + Position en temps réel de tous les livreurs actifs
    + Adresses de livraison
    + Trajets routiers optimisés calculés via API de routing (OpenRouteService ou Mapbox)
    + Mise à jour automatique toutes les 30 secondes
    + Affichage des trajets sur les routes réelles avec prise en compte du trafic
  - Estimation du temps de livraison pour chaque commande basée sur le trajet routier et les conditions de trafic
  - Instructions de navigation turn-by-turn pour chaque livreur
  - Mise à jour du statut de livraison
  - Confirmation de livraison
  - Gestion des incidents de livraison

#### 3.3.8 Stocks et approvisionnement
  - Liste des produits en stock avec quantités
  - Alertes de stock minimum
  - Enregistrement des entrées et sorties
  - Gestion des fournisseurs
  - Historique des approvisionnements

#### 3.3.9 Planning du personnel
  - Calendrier des équipes
  - Création et modification des plannings
  - Gestion des présences et absences
  - Affectation des rôles par service
  - Gestion des disponibilités des livreurs

#### 3.3.10 Rapports financiers et caisse
  - Suivi du chiffre d'affaires par période
  - Détail des ventes par catégorie et par plat
  - Distinction entre ventes sur place et commandes en ligne
  - Gestion de la caisse (ouverture, clôture, fonds de caisse)
  - Rapports de paiements par mode
  - Export des données comptables

#### 3.3.11 Clients et fidélité
  - Base de données clients
  - Historique des visites, réservations, commandes et dépenses
  - Attribution manuelle ou automatique de points de fidélité
  - Création d'offres personnalisées
  - Gestion des réductions
  - Envoi de communications ciblées

#### 3.3.12 Réclamations et notes clients
  - Consultation des réclamations reçues
  - Consultation des notes et avis clients
  - Réponses aux réclamations
  - Suivi des actions d'amélioration

#### 3.3.13 Consultation des évaluations de plats
  - Liste de tous les plats du restaurant
  - Affichage de la note moyenne par plat (étoiles + nombre d'avis)
  - Consultation des commentaires clients par plat
  - Filtrage par note (1 à 5 étoiles)
  - Tri par date ou par note
  - Identification des plats les mieux notés et les moins bien notés

### 3.4 Interface Super Admin

#### 3.4.1 Authentification
  - Connexion sécurisée avec identifiants super admin
  - Gestion du profil super admin
  - Réinitialisation de mot de passe

#### 3.4.2 Tableau de bord plateforme
  - Vue d'ensemble de l'activité globale de la plateforme
  - Indicateurs clés :
    + Nombre total de restaurants inscrits
    + Nombre de restaurants actifs
    + Nombre de restaurants suspendus
    + Nombre de demandes d'inscription en attente
    + Nombre total de clients utilisateurs
    + Nombre total de commandes traitées
    + Chiffre d'affaires global de la plateforme
    + Nombre de réclamations en attente
    + Taux de renouvellement des abonnements
  - Graphiques d'évolution sur périodes personnalisables
  - Alertes :
    + Nouvelles demandes d'inscription restaurant
    + Nouvelles réclamations urgentes
    + Abonnements arrivant à expiration
    + Restaurants en situation de non-paiement

#### 3.4.3 Tableau de bord administrateur avancé
  - Classement des restaurants :
    + Meilleurs restaurants selon la note moyenne
    + Meilleurs restaurants selon le nombre de commandes
    + Meilleurs restaurants selon les revenus générés
    + Affichage du classement sous forme de liste avec position, nom du restaurant, indicateur correspondant
  - Top des plats les plus vendus :
    + Classement global des plats les plus vendus sur toute la plateforme
    + Classement des plats les plus vendus par restaurant (sélection d'un restaurant spécifique)
    + Affichage du classement avec nom du plat, nombre de ventes, restaurant associé
  - Graphiques de revenus par mois :
    + Courbe d'évolution des revenus mensuels
    + Graphique en barres des revenus mensuels
    + Comparaison des revenus entre différentes périodes
  - Filtres par période :
    + Aujourd'hui
    + Cette semaine
    + Ce mois
    + Ce trimestre
    + Cette année
    + Période personnalisée (sélection de dates de début et de fin)
  - Export PDF des rapports :
    + Export du rapport complet incluant tous les classements et graphiques
    + Export section par section (classement des restaurants, top des plats, graphiques de revenus)
    + Génération du PDF avec mise en page structurée

#### 3.4.4 Gestion des demandes d'inscription restaurant
  - Liste de toutes les demandes d'inscription avec filtres :
    + Statut (en attente, acceptée, rejetée)
    + Date de soumission
    + Type de cuisine
    + Localisation
  - Recherche par nom de restaurant
  - Consultation détaillée de chaque demande :
    + Informations du restaurant (nom, adresse, téléphone, email, propriétaire)
    + Type de cuisine
    + Description de l'établissement
    + Documents fournis
    + Date de soumission
  - Actions sur les demandes :
    + Acceptation de la demande : le restaurant obtient accès à son espace et peut choisir son abonnement
    + Rejet de la demande : le restaurant est bloqué et ne peut pas accéder à la plateforme
    + Ajout de commentaires internes sur la demande
  - Notification automatique au restaurant après acceptation ou rejet
  - Historique des actions effectuées sur chaque demande

#### 3.4.5 Gestion des restaurants
  - Liste complète de tous les restaurants inscrits avec filtres :
    + Statut (actif, suspendu, en attente)
    + Type de cuisine
    + Localisation
    + Formule d'abonnement
    + Date d'inscription
  - Recherche par nom de restaurant
  - Consultation détaillée de chaque restaurant :
    + Informations générales (nom, adresse, contact, propriétaire)
    + Statut d'abonnement actuel
    + Historique des abonnements
    + Statistiques d'activité (nombre de commandes, chiffre d'affaires, taux de satisfaction)
    + Historique des réclamations reçues
    + Notes et avis clients
    + Nombre d'utilisateurs actifs
  - Actions sur les restaurants :
    + Bouton « Modifier » ouvrant un formulaire de modification :
      - Modification du nom du restaurant
      - Modification de l'adresse
      - Modification du téléphone
      - Modification de l'email
      - Modification de la description
      - Modification du type de cuisine
      - Modification du statut (actif, suspendu, bloqué)
      - Validation et enregistrement des modifications
    + Mise en suspens temporaire d'un restaurant
    + Réactivation d'un restaurant suspendu
    + Réduction de la visibilité sur la plateforme
    + Restauration de la visibilité normale
    + Désactivation définitive d'un compte restaurant
    + Envoi de notifications au restaurant
  - Ajout manuel d'un nouveau restaurant
  - Export de la liste des restaurants avec leurs données
  - Historique des actions effectuées sur chaque restaurant

#### 3.4.6 Gestion des abonnements
  - Formules disponibles : mensuel, annuel, par nombre d'utilisateurs
  - Liste de tous les abonnements actifs avec filtres :
    + Formule
    + Statut (actif, expiré, en attente de paiement)
    + Date d'expiration
  - Consultation détaillée de chaque abonnement :
    + Restaurant concerné
    + Formule souscrite
    + Date de début et date d'expiration
    + Montant et mode de paiement
    + Historique des paiements
    + Statut de renouvellement
  - Actions sur les abonnements :
    + Modification de la formule d'abonnement
    + Prolongation manuelle d'un abonnement
    + Suspension d'un abonnement
    + Réactivation d'un abonnement suspendu
    + Annulation d'un abonnement
  - Suivi des renouvellements et résiliations
  - Gestion des impayés avec relances automatiques
  - Historique complet des paiements par restaurant
  - Export des données d'abonnements et de facturation

#### 3.4.7 Traitement des réclamations
  - Réception centralisée des réclamations provenant de :
    + Restaurants abonnés
    + Clients finaux
  - Liste des réclamations avec filtres :
    + Statut (en attente, en cours de traitement, résolue, clôturée)
    + Catégorie (service, qualité, livraison, paiement, technique, autre)
    + Priorité (faible, moyenne, élevée, urgente)
    + Source (restaurant, client)
    + Date de réception
  - Consultation détaillée de chaque réclamation :
    + Émetteur (restaurant ou client)
    + Restaurant concerné
    + Date et heure de soumission
    + Catégorie et priorité
    + Description complète
    + Pièces jointes ou captures d'écran
    + Historique des échanges
  - Actions sur les réclamations :
    + Catégorisation et attribution de priorité
    + Assignation à un responsable de traitement
    + Ajout de commentaires internes
    + Réponse à l'émetteur de la réclamation
    + Changement de statut
    + Décisions disciplinaires :
      - Mise en suspens temporaire du restaurant
      - Réduction de la visibilité du restaurant sur la plateforme
      - Envoi d'un avertissement formel
      - Désactivation définitive du compte
    + Clôture de la réclamation avec résumé des actions entreprises
  - Historique complet des réclamations par restaurant
  - Statistiques des réclamations :
    + Nombre total de réclamations par période
    + Répartition par catégorie
    + Temps moyen de traitement
    + Taux de résolution
  - Export des données de réclamations pour analyse

## 4. Règles métier et logiques

### 4.1 Système de réservation
  - Une réservation ne peut être effectuée que si des places sont disponibles
  - Les réservations peuvent être modifiées jusqu'à 2 heures avant l'heure prévue
  - Notification automatique au restaurant lors de chaque nouvelle réservation

### 4.2 Système de commande en ligne
  - Les clients peuvent commander uniquement auprès des restaurants actifs
  - Le panier est sauvegardé pendant la session
  - Le restaurant peut accepter ou refuser une commande dans un délai de 5 minutes
  - En cas de refus, le client est remboursé automatiquement
  - Les points de fidélité et réductions sont appliqués avant le paiement
  - Une notification est envoyée au client à chaque changement de statut

### 4.3 Système de livraison avec suivi GPS et navigation
  - Les commandes en livraison sont assignées à un livreur disponible
  - Le livreur met à jour le statut à chaque étape
  - La position GPS du livreur est enregistrée dans la base de données
  - La position GPS est mise à jour automatiquement toutes les 30 secondes
  - Le client peut suivre la position du livreur en temps réel sur une carte interactive
  - Le trajet routier optimisé entre le restaurant et l'adresse de livraison est calculé via API de routing (OpenRouteService ou Mapbox)
  - Le trajet affiché sur la carte suit les routes réelles et non une ligne droite
  - L'API de routing prend en compte le trafic en temps réel pour optimiser le trajet
  - L'estimation du temps de livraison est calculée en fonction du trajet routier optimisé et des conditions de trafic actuelles
  - Les instructions de navigation turn-by-turn sont générées par l'API de routing et affichées au livreur
  - Les instructions de navigation sont mises à jour en temps réel selon la progression du livreur
  - La livraison est confirmée par le livreur à la remise de la commande
  - En cas de problème, le livreur peut signaler un incident

### 4.4 Système de fidélité
  - Attribution de points proportionnelle au montant dépensé (sur place et en ligne)
  - Les points peuvent être échangés contre des réductions
  - Les offres personnalisées sont générées selon l'historique client
  - Les réductions sont applicables lors du paiement

### 4.5 Gestion des paiements
  - Modes acceptés : carte bancaire, Wave, Orange Money
  - Enregistrement automatique dans les rapports financiers
  - Traçabilité complète de chaque transaction
  - Distinction entre paiements sur place et paiements en ligne

### 4.6 Gestion des abonnements
  - Formules : mensuel, annuel, par nombre d'utilisateurs
  - Accès aux fonctionnalités selon la formule choisie
  - Blocage automatique en cas de non-paiement
  - Possibilité de changement de formule
  - Le super admin peut modifier manuellement les abonnements
  - Le super admin peut prolonger ou suspendre un abonnement

### 4.7 Gestion des demandes d'inscription restaurant
  - Lors de l'inscription, le restaurant est automatiquement mis en statut « en attente »
  - Le restaurant ne peut pas accéder à son espace tant que sa demande n'est pas acceptée
  - Le super admin reçoit une notification pour chaque nouvelle demande d'inscription
  - Après acceptation par le super admin, le restaurant reçoit une notification et peut accéder à son espace
  - Après rejet par le super admin, le restaurant reçoit une notification et son accès est bloqué définitivement
  - Les demandes acceptées passent au statut « acceptée » et les restaurants deviennent actifs
  - Les demandes rejetées passent au statut « rejetée » et les restaurants sont bloqués

### 4.8 Traitement des réclamations
  - Les réclamations peuvent provenir des restaurants abonnés ou des clients finaux
  - Chaque réclamation est automatiquement catégorisée et priorisée
  - Le super admin peut mettre en suspens un restaurant selon la gravité de la réclamation
  - Le super admin peut réduire la visibilité d'un restaurant sur la plateforme
  - Les restaurants consultent leurs réclamations et notes pour amélioration
  - Les réclamations urgentes génèrent une alerte immédiate au super admin
  - Toutes les actions disciplinaires sont enregistrées dans l'historique du restaurant

### 4.9 Gestion des restaurants par le super admin
  - Le super admin a un accès complet en lecture à toutes les données des restaurants
  - Le super admin peut modifier les informations d'un restaurant via le bouton « Modifier » dans la liste admin
  - Le formulaire de modification permet de changer le nom, l'adresse, le téléphone, l'email, la description, le type de cuisine et le statut
  - Les modifications sont enregistrées dans la base de données après validation
  - Le super admin peut suspendre temporairement un restaurant en cas de réclamation grave
  - Le super admin peut réduire la visibilité d'un restaurant sur la plateforme publique
  - Le super admin peut désactiver définitivement un compte restaurant
  - Toutes les actions effectuées par le super admin sont tracées et horodatées
  - Les restaurants reçoivent une notification pour chaque action effectuée par le super admin

### 4.10 Vue salle en temps réel
  - Mise à jour instantanée du statut des tables
  - Affichage des commandes en cours par table
  - Indication du statut de service (en attente, en cours, terminé)

### 4.11 Gestion des images de menu
  - Les images uploadées sont automatiquement compressées pour optimiser le stockage et le chargement
  - Seuls les formats JPEG, PNG et WebP sont acceptés
  - Chaque plat peut avoir une seule image associée
  - Les images sont stockées dans Supabase Storage avec une organisation par restaurant
  - Le chargement des images dans les cartes utilise le lazy loading pour améliorer les performances

### 4.12 Intégration API de routing pour navigation
  - L'application utilise une API de routing (OpenRouteService ou Mapbox) pour tous les calculs de trajet
  - L'API calcule le trajet routier optimisé en fonction des routes disponibles
  - L'API prend en compte les données de trafic en temps réel pour ajuster le trajet et l'estimation du temps
  - L'API génère les instructions de navigation turn-by-turn (tourner à gauche, tourner à droite, continuer tout droit, etc.)
  - Les instructions sont affichées de manière séquentielle au livreur pendant la livraison
  - Le trajet est recalculé automatiquement si le livreur dévie de l'itinéraire prévu
  - Les coordonnées GPS du livreur sont envoyées à l'API pour mettre à jour les instructions en temps réel

### 4.13 Tableau de bord administrateur avancé
  - Les classements des restaurants sont calculés à partir des données des tables restaurants, orders et complaints
  - Le classement par note utilise la note moyenne des restaurants
  - Le classement par nombre de commandes utilise le total des commandes de la table orders
  - Le classement par revenus utilise la somme des montants des commandes de la table orders
  - Le top des plats les plus vendus est calculé à partir de la table order_items
  - Le classement global agrège les ventes de tous les restaurants
  - Le classement par restaurant filtre les ventes selon le restaurant sélectionné
  - Les graphiques de revenus par mois agrègent les montants des commandes par mois
  - Les filtres par période appliquent des contraintes de dates sur les requêtes
  - L'export PDF génère un document structuré avec les données filtrées selon la période sélectionnée

### 4.14 Système d'évaluation des plats
  - Les clients peuvent évaluer les plats uniquement après avoir reçu leur commande
  - Chaque plat d'une commande peut être évalué individuellement
  - Une évaluation comprend une note de 1 à 5 étoiles et un commentaire optionnel
  - Les évaluations sont stockées dans la table reviews avec référence au plat (menu_items), au client (customers) et à la commande (orders)
  - La note moyenne d'un plat est calculée à partir de toutes les évaluations reçues
  - Le nombre total d'avis par plat est comptabilisé
  - Les évaluations sont affichées dans la page menu du restaurant avec note moyenne et nombre d'avis
  - Les restaurants peuvent consulter toutes les évaluations de leurs plats
  - Les évaluations ne peuvent pas être modifiées après soumission
  - Les évaluations sont horodatées

## 5. Cas exceptionnels et situations limites

| Situation | Comportement attendu |
|-----------|---------------------|
| Tentative de réservation sur un créneau complet | Affichage d'un message d'indisponibilité et proposition de créneaux alternatifs |
| Tentative de commande d'un plat indisponible | Retrait automatique du panier avec notification au client |
| Restaurant ne répond pas à une commande en ligne dans les 5 minutes | Annulation automatique et remboursement du client |
| Paiement échoué lors d'une commande en ligne | Annulation de la commande et notification au client |
| Livreur indisponible pour une livraison | Notification au restaurant pour réassignation ou proposition de retrait sur place |
| Client absent lors de la livraison | Tentative de contact puis retour de la commande au restaurant |
| Paiement échoué lors de l'abonnement | Blocage de l'accès et notification au restaurant |
| Réclamation grave reçue | Alerte immédiate au super admin pour traitement prioritaire |
| Stock d'un produit épuisé | Désactivation automatique des plats concernés sur la carte |
| Modification de réservation moins de 2 heures avant | Refus de la modification avec message explicatif |
| Tentative de connexion avec identifiants incorrects | Message d'erreur et possibilité de réinitialisation |
| Restaurant mis en suspens | Blocage de l'accès et notification au propriétaire |
| Upload d'une image dans un format non accepté | Affichage d'un message d'erreur précisant les formats autorisés |
| Échec de l'upload d'image vers Supabase Storage | Message d'erreur et possibilité de réessayer |
| Image corrompue ou illisible | Rejet de l'upload avec message explicatif |
| Échec de capture de la position GPS du livreur | Affichage de la dernière position connue avec indication de l'horodatage |
| Perte de connexion internet du livreur | Reprise automatique de la mise à jour GPS dès le retour de la connexion |
| Carte interactive ne se charge pas | Affichage d'un message d'erreur et basculement sur affichage textuel de l'adresse |
| API de routing indisponible ou en erreur | Affichage d'un trajet en ligne droite avec estimation approximative et message d'avertissement |
| Impossibilité de calculer un trajet routier | Affichage d'un message d'erreur et proposition de contact manuel avec le livreur |
| Trafic extrêmement dense modifiant significativement le temps de livraison | Mise à jour automatique de l'estimation et notification au client |
| Livreur dévie de l'itinéraire prévu | Recalcul automatique du trajet et mise à jour des instructions de navigation |
| Super admin tente de modifier un restaurant inexistant | Affichage d'un message d'erreur et retour à la liste des restaurants |
| Super admin tente de suspendre un restaurant déjà suspendu | Affichage d'un message indiquant que le restaurant est déjà suspendu |
| Tentative de connexion super admin avec identifiants incorrects | Message d'erreur et possibilité de réinitialisation sécurisée |
| Réclamation sans restaurant associé | Catégorisation comme réclamation générale et traitement par le super admin |
| Modification d'abonnement pendant une période de facturation | Application de la nouvelle formule à partir de la prochaine période de facturation |
| Aucune donnée disponible pour le classement des restaurants | Affichage d'un message indiquant l'absence de données |
| Aucune donnée disponible pour le top des plats | Affichage d'un message indiquant l'absence de données |
| Échec de génération du PDF | Affichage d'un message d'erreur et possibilité de réessayer |
| Période personnalisée invalide (date de fin antérieure à date de début) | Affichage d'un message d'erreur et demande de correction |
| Client tente d'évaluer un plat avant réception de la commande | Blocage de l'accès à la page d'évaluation avec message explicatif |
| Client tente d'évaluer un plat déjà évalué | Affichage d'un message indiquant que le plat a déjà été évalué |
| Soumission d'une évaluation sans note | Affichage d'un message d'erreur demandant de sélectionner une note |
| Plat sans aucune évaluation | Affichage d'un message indiquant l'absence d'avis |
| Échec d'enregistrement de l'évaluation dans la base de données | Affichage d'un message d'erreur et possibilité de réessayer |
| Restaurant tente de se connecter avant acceptation de sa demande | Affichage d'un message indiquant que la demande est en attente de validation |
| Restaurant tente de se connecter après rejet de sa demande | Affichage d'un message indiquant que la demande a été rejetée et blocage de l'accès |
| Super admin tente d'accepter une demande déjà acceptée | Affichage d'un message indiquant que la demande a déjà été acceptée |
| Super admin tente de rejeter une demande déjà rejetée | Affichage d'un message indiquant que la demande a déjà été rejetée |
| Échec de l'envoi de notification après acceptation ou rejet | Enregistrement de l'action avec indication d'échec de notification |
| Super admin tente de modifier un restaurant avec des données invalides | Affichage d'un message d'erreur précisant les champs incorrects |
| Échec de l'enregistrement des modifications d'un restaurant | Affichage d'un message d'erreur et possibilité de réessayer |

## 6. Critères de validation

  1. Un restaurant peut s'inscrire et sa demande est mise en statut « en attente »
  2. Le super admin peut consulter la liste des demandes d'inscription avec filtres
  3. Le super admin peut consulter les détails d'une demande d'inscription
  4. Le super admin peut accepter une demande d'inscription
  5. Le restaurant accepté reçoit une notification et peut accéder à son espace
  6. Le super admin peut rejeter une demande d'inscription
  7. Le restaurant rejeté reçoit une notification et son accès est bloqué
  8. Le restaurant accepté peut choisir son abonnement et accéder à son espace
  9. Les clients peuvent réserver en ligne et recevoir une confirmation
  10. Les clients peuvent passer commande en ligne et effectuer le paiement
  11. Les clients peuvent suivre leur commande en temps réel jusqu'à la livraison
  12. Les clients peuvent visualiser la position du livreur sur une carte interactive
  13. La carte affiche le trajet routier optimisé entre le restaurant et l'adresse de livraison calculé via API de routing
  14. Le trajet affiché suit les routes réelles et non une ligne droite
  15. La position du livreur est mise à jour automatiquement toutes les 30 secondes
  16. L'estimation du temps de livraison est affichée et mise à jour en fonction du trajet routier et des conditions de trafic en temps réel
  17. Les instructions de navigation turn-by-turn sont affichées au livreur
  18. Les instructions de navigation sont mises à jour en temps réel selon la progression du livreur
  19. Le restaurant reçoit les commandes en ligne et peut les accepter ou refuser
  20. Le restaurant peut assigner un livreur et suivre la livraison sur carte GPS avec trajet routier optimisé
  21. Les livreurs peuvent mettre à jour le statut de livraison
  22. La position GPS des livreurs est enregistrée dans la base de données
  23. Le personnel peut prendre des commandes via le POS et encaisser avec les modes de paiement spécifiés
  24. La vue salle affiche en temps réel l'occupation et les commandes en cours
  25. Les clients accumulent des points de fidélité sur toutes leurs commandes et peuvent bénéficier de réductions
  26. Les clients peuvent accéder à la page d'évaluation après réception de leur commande
  27. Les clients peuvent attribuer une note de 1 à 5 étoiles à chaque plat commandé
  28. Les clients peuvent ajouter un commentaire optionnel pour chaque plat évalué
  29. Les évaluations sont enregistrées dans la table reviews avec référence au plat, au client et à la commande
  30. La note moyenne de chaque plat est calculée et affichée dans la page menu du restaurant
  31. Le nombre total d'avis par plat est affiché dans la page menu du restaurant
  32. Les restaurants peuvent consulter toutes les évaluations de leurs plats
  33. Les restaurants peuvent filtrer les évaluations par note
  34. Les restaurants peuvent trier les évaluations par date ou par note
  35. Les restaurants peuvent identifier les plats les mieux notés et les moins bien notés
  36. Le super admin peut se connecter à l'interface d'administration
  37. Le super admin peut consulter le tableau de bord plateforme avec les indicateurs clés incluant le nombre de demandes en attente
  38. Le super admin peut accéder au tableau de bord administrateur avancé
  39. Le super admin peut consulter le classement des restaurants par note, nombre de commandes et revenus
  40. Le super admin peut consulter le top des plats les plus vendus globalement
  41. Le super admin peut consulter le top des plats les plus vendus par restaurant
  42. Le super admin peut visualiser les graphiques de revenus par mois
  43. Le super admin peut appliquer les filtres par période (aujourd'hui, semaine, mois, trimestre, année, personnalisé)
  44. Le super admin peut exporter le rapport complet en PDF
  45. Le super admin peut exporter les sections individuelles en PDF
  46. Le super admin peut consulter la liste complète des restaurants avec filtres et recherche
  47. Le super admin peut consulter les informations détaillées de chaque restaurant
  48. Le super admin peut cliquer sur le bouton « Modifier » dans la liste des restaurants
  49. Le formulaire de modification s'ouvre avec les informations actuelles du restaurant
  50. Le super admin peut modifier le nom, l'adresse, le téléphone, l'email, la description, le type de cuisine et le statut du restaurant
  51. Les modifications sont enregistrées dans la base de données après validation
  52. Le restaurant reçoit une notification après modification de ses informations par le super admin
  53. Le super admin peut mettre en suspens un restaurant
  54. Le super admin peut réactiver un restaurant suspendu
  55. Le super admin peut réduire la visibilité d'un restaurant sur la plateforme
  56. Le super admin peut restaurer la visibilité normale d'un restaurant
  57. Le super admin peut désactiver définitivement un compte restaurant
  58. Le super admin peut ajouter manuellement un nouveau restaurant
  59. Le super admin peut consulter et gérer tous les abonnements
  60. Le super admin peut modifier la formule d'abonnement d'un restaurant
  61. Le super admin peut prolonger ou suspendre un abonnement
  62. Le super admin peut consulter l'historique des paiements
  63. Le super admin peut consulter et traiter les réclamations
  64. Le super admin peut catégoriser et prioriser les réclamations
  65. Le super admin peut répondre aux réclamations
  66. Le super admin peut prendre des décisions disciplinaires sur les restaurants
  67. Le super admin peut consulter l'historique des réclamations par restaurant
  68. Le super admin peut exporter les données des restaurants, abonnements et réclamations
  69. Toutes les actions du super admin sont tracées et horodatées
  70. Les restaurants reçoivent des notifications pour les actions effectuées par le super admin
  71. Les rapports financiers reflètent fidèlement l'activité (sur place et en ligne)
  72. Le planning du personnel est modifiable et consultable
  73. Les stocks sont suivis avec alertes de niveau minimum
  74. Les images peuvent être uploadées pour les articles de menu avec prévisualisation
  75. Les images uploadées sont automatiquement compressées et stockées dans Supabase Storage
  76. Seuls les formats JPEG, PNG et WebP sont acceptés lors de l'upload
  77. Les images s'affichent correctement dans les cartes d'articles avec lazy loading
  78. Un placeholder s'affiche pendant le chargement des images
  79. L'API de routing (OpenRouteService ou Mapbox) calcule correctement les trajets routiers optimisés
  80. L'API de routing prend en compte le trafic en temps réel pour ajuster les estimations
  81. Le trajet est recalculé automatiquement en cas de déviation du livreur

## 7. Fonctionnalités non incluses dans cette version

  - Application mobile native
  - Intégration avec des systèmes de livraison tiers
  - Gestion multi-sites pour une même enseigne
  - Programme de parrainage
  - Système de réservation de groupes ou événements privés
  - Gestion avancée des allergènes avec alertes automatiques
  - Intégration comptable avec logiciels externes
  - Système de notation du personnel
  - Gestion des pourboires
  - Module de marketing automation avancé
  - Édition avancée des images (recadrage, filtres, rotation)
  - Galerie d'images multiples par plat
  - Reconnaissance automatique du contenu des images
  - Chat en temps réel entre client et livreur
  - Système de notation des livreurs
  - Optimisation multi-destinations pour les livreurs effectuant plusieurs livraisons simultanées
  - Historique détaillé des trajets effectués par les livreurs
  - Gestion des rôles et permissions granulaires pour les super admins
  - Système de logs détaillés des actions super admin
  - Système de messagerie interne entre super admin et restaurants
  - Gestion des remboursements manuels par le super admin
  - Système de tickets de support intégré
  - Prévisions de revenus basées sur l'historique
  - Analyse comparative entre restaurants
  - Alertes automatiques sur les tendances de vente
  - Export des rapports dans d'autres formats (Excel, CSV)
  - Modification ou suppression des évaluations par les clients
  - Réponses des restaurants aux évaluations clients
  - Système de modération des commentaires inappropriés
  - Statistiques avancées sur les évaluations (évolution dans le temps, corrélation avec les ventes)
  - Affichage des évaluations sur la page d'accueil publique
  - Système de badges ou récompenses pour les clients actifs dans les évaluations
  - Validation automatique des demandes d'inscription selon des critères prédéfinis
  - Système de scoring des demandes d'inscription
  - Historique des modifications effectuées sur les informations d'un restaurant
  - Comparaison avant/après des modifications effectuées par le super admin