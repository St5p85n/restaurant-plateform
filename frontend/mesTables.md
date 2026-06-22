# Base de Données KobeTii - Structure Complète

## Tables du Système

### 1. profiles
**Description** : Profils utilisateurs multi-rôles (super_admin, owner, manager, chef, server, accountant, customer)

**Structure** : profiles(id, email, phone, full_name, role, restaurant_id, avatar_url, username, created_at, updated_at)

**Colonnes** :
- id : uuid (PK, FK vers auth.users)
- email : text
- phone : text
- full_name : text
- role : user_role (ENUM)
- restaurant_id : uuid (FK vers restaurants)
- avatar_url : text
- username : text (UNIQUE)
- created_at : timestamptz
- updated_at : timestamptz

---

### 2. restaurants
**Description** : Restaurants multi-tenant

**Structure** : restaurants(id, name, slug, description, address, city, postal_code, phone, email, logo_url, cover_image_url, cuisine_type, opening_hours, latitude, longitude, is_active, visibility_score, rating, total_reviews, owner_id, created_at, updated_at)

**Colonnes** :
- id : uuid (PK)
- name : text
- slug : text (UNIQUE)
- description : text
- address : text
- city : text
- postal_code : text
- phone : text
- email : text
- logo_url : text
- cover_image_url : text
- cuisine_type : text
- opening_hours : jsonb
- latitude : decimal(10,8)
- longitude : decimal(11,8)
- is_active : boolean
- visibility_score : int
- rating : numeric(3,2)
- total_reviews : int
- owner_id : uuid (FK vers profiles)
- created_at : timestamptz
- updated_at : timestamptz

---

### 3. subscriptions
**Description** : Abonnements des restaurants

**Structure** : subscriptions(id, restaurant_id, plan, status, user_limit, start_date, end_date, amount, currency, stripe_subscription_id, stripe_customer_id, created_at, updated_at)

**Colonnes** :
- id : uuid (PK)
- restaurant_id : uuid (FK vers restaurants)
- plan : subscription_plan (ENUM: monthly, annual, per_user)
- status : subscription_status (ENUM: active, suspended, cancelled, expired)
- user_limit : int
- start_date : timestamptz
- end_date : timestamptz
- amount : numeric(10,2)
- currency : text (DEFAULT 'FCFA')
- stripe_subscription_id : text
- stripe_customer_id : text
- created_at : timestamptz
- updated_at : timestamptz

---

### 4. tables
**Description** : Tables physiques du restaurant

**Structure** : tables(id, restaurant_id, table_number, capacity, status, position_x, position_y, created_at, updated_at)

**Colonnes** :
- id : uuid (PK)
- restaurant_id : uuid (FK vers restaurants)
- table_number : text
- capacity : int
- status : table_status (ENUM: available, occupied, reserved, maintenance)
- position_x : numeric(5,2)
- position_y : numeric(5,2)
- created_at : timestamptz
- updated_at : timestamptz

**Contraintes** : UNIQUE(restaurant_id, table_number)

---

### 5. reservations
**Description** : Réservations de tables

**Structure** : reservations(id, restaurant_id, customer_id, table_id, customer_name, customer_email, customer_phone, party_size, reservation_date, reservation_time, status, special_requests, created_at, updated_at)

**Colonnes** :
- id : uuid (PK)
- restaurant_id : uuid (FK vers restaurants)
- customer_id : uuid (FK vers profiles)
- table_id : uuid (FK vers tables)
- customer_name : text
- customer_email : text
- customer_phone : text
- party_size : int
- reservation_date : date
- reservation_time : time
- status : reservation_status (ENUM: pending, confirmed, cancelled, completed, no_show)
- special_requests : text
- created_at : timestamptz
- updated_at : timestamptz

---

### 6. menu_categories
**Description** : Catégories du menu

**Structure** : menu_categories(id, restaurant_id, name, description, display_order, is_active, created_at, updated_at)

**Colonnes** :
- id : uuid (PK)
- restaurant_id : uuid (FK vers restaurants)
- name : text
- description : text
- display_order : int
- is_active : boolean
- created_at : timestamptz
- updated_at : timestamptz

---

### 7. menu_items
**Description** : Articles du menu

**Structure** : menu_items(id, restaurant_id, category_id, name, description, price, image_url, allergens, is_available, preparation_time, created_at, updated_at)

**Colonnes** :
- id : uuid (PK)
- restaurant_id : uuid (FK vers restaurants)
- category_id : uuid (FK vers menu_categories)
- name : text
- description : text
- price : numeric(10,2)
- image_url : text
- allergens : text[]
- is_available : boolean
- preparation_time : int
- created_at : timestamptz
- updated_at : timestamptz

---

### 8. orders
**Description** : Commandes (sur place, à emporter, livraison)

**Structure** : orders(id, restaurant_id, table_id, server_id, customer_id, delivery_person_id, order_number, status, order_type, subtotal, tax, total, payment_method, payment_status, delivery_status, delivery_address_id, delivery_notes, estimated_delivery_time, delivered_at, notes, created_at, updated_at)

**Colonnes** :
- id : uuid (PK)
- restaurant_id : uuid (FK vers restaurants)
- table_id : uuid (FK vers tables)
- server_id : uuid (FK vers profiles)
- customer_id : uuid (FK vers profiles)
- delivery_person_id : uuid (FK vers delivery_personnel)
- order_number : text (UNIQUE)
- status : order_status (ENUM: pending, in_progress, ready, served, paid, cancelled)
- order_type : text (DEFAULT 'dine_in')
- subtotal : numeric(10,2)
- tax : numeric(10,2)
- total : numeric(10,2)
- payment_method : payment_method (ENUM: card, wave, orange_money, cash)
- payment_status : text (DEFAULT 'unpaid')
- delivery_status : text (DEFAULT 'pending')
- delivery_address_id : uuid (FK vers delivery_addresses)
- delivery_notes : text
- estimated_delivery_time : timestamptz
- delivered_at : timestamptz
- notes : text
- created_at : timestamptz
- updated_at : timestamptz

---

### 9. order_items
**Description** : Articles d'une commande

**Structure** : order_items(id, order_id, menu_item_id, quantity, unit_price, subtotal, special_instructions, status, created_at, updated_at)

**Colonnes** :
- id : uuid (PK)
- order_id : uuid (FK vers orders)
- menu_item_id : uuid (FK vers menu_items)
- quantity : int
- unit_price : numeric(10,2)
- subtotal : numeric(10,2)
- special_instructions : text
- status : order_status (ENUM)
- created_at : timestamptz
- updated_at : timestamptz

---

### 10. stock_items
**Description** : Articles en stock

**Structure** : stock_items(id, restaurant_id, name, unit, quantity, min_quantity, unit_cost, supplier, last_restocked_at, created_at, updated_at)

**Colonnes** :
- id : uuid (PK)
- restaurant_id : uuid (FK vers restaurants)
- name : text
- unit : text
- quantity : numeric(10,2)
- min_quantity : numeric(10,2)
- unit_cost : numeric(10,2)
- supplier : text
- last_restocked_at : timestamptz
- created_at : timestamptz
- updated_at : timestamptz

---

### 11. stock_movements
**Description** : Mouvements de stock (entrées/sorties)

**Structure** : stock_movements(id, stock_item_id, movement_type, quantity, notes, created_by, created_at)

**Colonnes** :
- id : uuid (PK)
- stock_item_id : uuid (FK vers stock_items)
- movement_type : text
- quantity : numeric(10,2)
- notes : text
- created_by : uuid (FK vers profiles)
- created_at : timestamptz

---

### 12. staff_schedules
**Description** : Planning du personnel

**Structure** : staff_schedules(id, restaurant_id, staff_id, shift_date, start_time, end_time, role, status, notes, created_at, updated_at)

**Colonnes** :
- id : uuid (PK)
- restaurant_id : uuid (FK vers restaurants)
- staff_id : uuid (FK vers profiles)
- shift_date : date
- start_time : time
- end_time : time
- role : user_role (ENUM)
- status : text (DEFAULT 'scheduled')
- notes : text
- created_at : timestamptz
- updated_at : timestamptz

---

### 13. customers
**Description** : Clients fidélité

**Structure** : customers(id, profile_id, restaurant_id, full_name, email, phone, total_visits, total_spent, loyalty_points, created_at, updated_at)

**Colonnes** :
- id : uuid (PK)
- profile_id : uuid (FK vers profiles)
- restaurant_id : uuid (FK vers restaurants)
- full_name : text
- email : text
- phone : text
- total_visits : int
- total_spent : numeric(10,2)
- loyalty_points : int
- created_at : timestamptz
- updated_at : timestamptz

**Contraintes** : UNIQUE(restaurant_id, email)

---

### 14. loyalty_transactions
**Description** : Transactions de points de fidélité

**Structure** : loyalty_transactions(id, customer_id, points, transaction_type, description, order_id, created_at)

**Colonnes** :
- id : uuid (PK)
- customer_id : uuid (FK vers customers)
- points : int
- transaction_type : text
- description : text
- order_id : uuid (FK vers orders)
- created_at : timestamptz

---

### 15. offers
**Description** : Offres promotionnelles

**Structure** : offers(id, restaurant_id, title, description, discount_type, discount_value, min_points, valid_from, valid_until, is_active, created_at, updated_at)

**Colonnes** :
- id : uuid (PK)
- restaurant_id : uuid (FK vers restaurants)
- title : text
- description : text
- discount_type : text
- discount_value : numeric(10,2)
- min_points : int
- valid_from : timestamptz
- valid_until : timestamptz
- is_active : boolean
- created_at : timestamptz
- updated_at : timestamptz

---

### 16. complaints
**Description** : Réclamations (clients et restaurants)

**Structure** : complaints(id, restaurant_id, source, submitted_by, subject, description, status, priority, rating, admin_notes, resolved_at, created_at, updated_at)

**Colonnes** :
- id : uuid (PK)
- restaurant_id : uuid (FK vers restaurants)
- source : complaint_source (ENUM: customer, restaurant)
- submitted_by : uuid (FK vers profiles)
- subject : text
- description : text
- status : complaint_status (ENUM: pending, in_review, resolved, closed)
- priority : int
- rating : int
- admin_notes : text
- resolved_at : timestamptz
- created_at : timestamptz
- updated_at : timestamptz

---

### 17. cash_register
**Description** : Caisse enregistreuse

**Structure** : cash_register(id, restaurant_id, opened_by, closed_by, opening_amount, closing_amount, expected_amount, difference, opened_at, closed_at, notes)

**Colonnes** :
- id : uuid (PK)
- restaurant_id : uuid (FK vers restaurants)
- opened_by : uuid (FK vers profiles)
- closed_by : uuid (FK vers profiles)
- opening_amount : numeric(10,2)
- closing_amount : numeric(10,2)
- expected_amount : numeric(10,2)
- difference : numeric(10,2)
- opened_at : timestamptz
- closed_at : timestamptz
- notes : text

---

### 18. delivery_addresses
**Description** : Adresses de livraison des clients

**Structure** : delivery_addresses(id, customer_id, full_name, phone, address_line1, address_line2, city, postal_code, latitude, longitude, is_default, created_at, updated_at)

**Colonnes** :
- id : uuid (PK)
- customer_id : uuid (FK vers customers)
- full_name : text
- phone : text
- address_line1 : text
- address_line2 : text
- city : text
- postal_code : text
- latitude : decimal(10,8)
- longitude : decimal(11,8)
- is_default : boolean
- created_at : timestamptz
- updated_at : timestamptz

---

### 19. delivery_personnel
**Description** : Livreurs

**Structure** : delivery_personnel(id, restaurant_id, profile_id, full_name, phone, vehicle_type, vehicle_number, status, current_location, is_active, created_at, updated_at)

**Colonnes** :
- id : uuid (PK)
- restaurant_id : uuid (FK vers restaurants)
- profile_id : uuid (FK vers profiles)
- full_name : text
- phone : text
- vehicle_type : text (bike, motorcycle, car, scooter)
- vehicle_number : text
- status : text (available, busy, offline)
- current_location : jsonb ({lat, lng})
- is_active : boolean
- created_at : timestamptz
- updated_at : timestamptz

---

### 20. delivery_locations
**Description** : Positions GPS des livreurs en temps réel

**Structure** : delivery_locations(id, delivery_person_id, order_id, latitude, longitude, recorded_at, created_at)

**Colonnes** :
- id : uuid (PK)
- delivery_person_id : uuid (FK vers delivery_personnel)
- order_id : uuid (FK vers orders)
- latitude : decimal(10,8)
- longitude : decimal(11,8)
- recorded_at : timestamptz
- created_at : timestamptz

---

### 21. delivery_routes
**Description** : Cache des trajets de livraison calculés

**Structure** : delivery_routes(id, order_id, start_lat, start_lng, end_lat, end_lng, geometry, distance_meters, duration_seconds, instructions, profile, created_at, updated_at)

**Colonnes** :
- id : uuid (PK)
- order_id : uuid (FK vers orders, UNIQUE)
- start_lat : decimal(10,8)
- start_lng : decimal(11,8)
- end_lat : decimal(10,8)
- end_lng : decimal(11,8)
- geometry : jsonb (GeoJSON LineString)
- distance_meters : int
- duration_seconds : int
- instructions : jsonb (turn-by-turn)
- profile : varchar(50) (DEFAULT 'driving-car')
- created_at : timestamptz
- updated_at : timestamptz

---

### 22. auth_logs
**Description** : Historique des connexions et actions d'authentification

**Structure** : auth_logs(id, user_id, email, action, ip_address, user_agent, created_at)

**Colonnes** :
- id : uuid (PK)
- user_id : uuid (FK vers auth.users)
- email : text
- action : text (ENUM: login, logout, signup, password_reset)
- ip_address : text
- user_agent : text
- created_at : timestamptz

---

## Types ENUM

### user_role
Valeurs : super_admin, owner, manager, chef, server, accountant, customer

### subscription_plan
Valeurs : monthly, annual, per_user

### subscription_status
Valeurs : active, suspended, cancelled, expired

### reservation_status
Valeurs : pending, confirmed, cancelled, completed, no_show

### table_status
Valeurs : available, occupied, reserved, maintenance

### order_status
Valeurs : pending, in_progress, ready, served, paid, cancelled

### payment_method
Valeurs : card, wave, orange_money, cash

### complaint_status
Valeurs : pending, in_review, resolved, closed

### complaint_source
Valeurs : customer, restaurant

---

## Résumé des Tables

**Total : 22 tables**

1. profiles
2. restaurants
3. subscriptions
4. tables
5. reservations
6. menu_categories
7. menu_items
8. orders
9. order_items
10. stock_items
11. stock_movements
12. staff_schedules
13. customers
14. loyalty_transactions
15. offers
16. complaints
17. cash_register
18. delivery_addresses
19. delivery_personnel
20. delivery_locations
21. delivery_routes
22. auth_logs

---

## Relations Principales

- **profiles** ↔ **restaurants** (many-to-one via restaurant_id)
- **restaurants** → **subscriptions** (one-to-many)
- **restaurants** → **tables** (one-to-many)
- **restaurants** → **menu_categories** → **menu_items** (one-to-many-to-many)
- **restaurants** → **orders** → **order_items** (one-to-many-to-many)
- **orders** ↔ **delivery_personnel** (many-to-one)
- **orders** ↔ **delivery_addresses** (many-to-one)
- **orders** → **delivery_routes** (one-to-one)
- **delivery_personnel** → **delivery_locations** (one-to-many)
- **restaurants** → **customers** → **loyalty_transactions** (one-to-many-to-many)
- **profiles** → **auth_logs** (one-to-many)

---

**Date de génération** : 2026-04-27  
**Version** : v41  
**Plateforme** : KobeTii - Gestion de Restaurants
