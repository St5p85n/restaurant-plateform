export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

// Types pour KobeTii

export type UserRole = 'super_admin' | 'owner' | 'manager' | 'chef' | 'server' | 'accountant' | 'customer';
export type SubscriptionPlan = 'monthly' | 'annual' | 'per_user';
export type SubscriptionStatus = 'active' | 'suspended' | 'cancelled' | 'expired';
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';
export type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'served' | 'paid' | 'cancelled' | 'completed';
export type PaymentMethod = 'card' | 'wave' | 'orange_money' | 'cash';
export type ComplaintStatus = 'pending' | 'in_review' | 'resolved' | 'closed';
export type ComplaintSource = 'customer' | 'restaurant';
export type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
export type DeliveryPersonnelStatus = 'available' | 'busy' | 'offline';
export type VehicleType = 'bike' | 'motorcycle' | 'car' | 'scooter';

export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  role: UserRole;
  restaurant_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  cuisine_type: string | null;
  opening_hours: Record<string, any> | null;
  is_active: boolean;
  visibility_score: number;
  rating: number;
  total_reviews: number;
  average_price: number | null;
  owner_id: string | null;
  approval_status: ApprovalStatus;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  restaurant_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  user_limit: number | null;
  start_date: string;
  end_date: string | null;
  amount: number;
  currency: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  restaurant_id: string;
  table_number: string;
  capacity: number;
  status: TableStatus;
  position_x: number | null;
  position_y: number | null;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  restaurant_id: string;
  customer_id: string | null;
  table_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: ReservationStatus;
  special_requests: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  allergens: string[] | null;
  is_available: boolean;
  preparation_time: number | null;
  // Préférences client
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_halal: boolean;
  is_gluten_free: boolean;
  spice_level: 0 | 1 | 2 | 3;   // 0=non épicé … 3=très épicé
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  server_id: string | null;
  customer_id: string | null;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod | null;
  payment_status: string;
  notes: string | null;
  delivery_status: string | null;
  delivery_address_id: string | null;
  delivery_notes: string | null;
  delivery_person_id: string | null;
  estimated_delivery_time: string | null;
  delivered_at: string | null;
  order_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  special_instructions: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface StockItem {
  id: string;
  restaurant_id: string;
  name: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  unit_cost: number | null;
  supplier: string | null;
  last_restocked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  stock_item_id: string;
  movement_type: string;
  quantity: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface StaffSchedule {
  id: string;
  restaurant_id: string;
  staff_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  role: UserRole | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  profile_id: string | null;
  restaurant_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  total_visits: number;
  total_spent: number;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  customer_id: string;
  points: number;
  transaction_type: string;
  description: string | null;
  order_id: string | null;
  created_at: string;
}

export interface Offer {
  id: string;
  restaurant_id: string;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_points: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id: string;
  restaurant_id: string;
  source: ComplaintSource;
  submitted_by: string | null;
  subject: string;
  description: string;
  status: ComplaintStatus;
  priority: number;
  rating: number | null;
  admin_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CashRegister {
  id: string;
  restaurant_id: string;
  opened_by: string | null;
  closed_by: string | null;
  opening_amount: number;
  closing_amount: number | null;
  expected_amount: number | null;
  difference: number | null;
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
}

export interface DeliveryPersonnel {
  id: string;
  restaurant_id: string;
  profile_id: string | null;
  full_name: string;
  phone: string;
  vehicle_type: VehicleType | null;
  vehicle_number: string | null;
  status: DeliveryPersonnelStatus;
  current_location: { lat: number; lng: number } | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryAddress {
  id: string;
  customer_id: string;
  label: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postal_code: string | null;
  country: string;
  phone: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Types pour le suivi GPS des livreurs
export interface DeliveryLocation {
  id: string;
  delivery_person_id: string;
  order_id: string | null;
  latitude: number;
  longitude: number;
  recorded_at: string;
  created_at: string;
}

export interface GPSCoordinates {
  lat: number;
  lng: number;
}

export interface DeliveryTrackingInfo {
  order_id: string;
  delivery_person: {
    id: string;
    full_name: string;
    phone: string;
    vehicle_type: VehicleType;
  };
  current_location: GPSCoordinates | null;
  destination: GPSCoordinates;
  restaurant_location: GPSCoordinates;
  estimated_time_minutes: number | null;
  distance_km: number | null;
  last_updated: string | null;
}

// Types pour le routing avec OpenRouteService
export interface RouteGeometry {
  coordinates: [number, number][]; // [longitude, latitude]
  type: 'LineString';
}

export interface NavigationInstruction {
  distance: number; // Distance en mètres
  duration: number; // Durée en secondes
  type: number; // Type d'instruction (0=gauche, 1=droite, etc.)
  instruction: string; // Texte de l'instruction
  name: string; // Nom de la rue
  exit_number?: number; // Numéro de sortie (pour ronds-points)
}

export interface RouteSegment {
  distance: number; // Distance totale en mètres
  duration: number; // Durée totale en secondes
  steps: NavigationInstruction[];
}

export interface RouteResponse {
  geometry: RouteGeometry;
  distance: number; // Distance en mètres
  duration: number; // Durée en secondes
  segments: RouteSegment[];
}

export interface DeliveryRoute {
  id: string;
  order_id: string;
  geometry: RouteGeometry;
  distance_meters: number;
  duration_seconds: number;
  instructions: NavigationInstruction[];
  created_at: string;
  updated_at: string;
}

// Types pour l'interface Super Admin
export interface AdminStats {
  total_restaurants: number;
  active_restaurants: number;
  suspended_restaurants: number;
  total_customers: number;
  total_orders: number;
  total_revenue: number;
  pending_complaints: number;
  expiring_subscriptions: number;
}

export interface RestaurantWithStats extends Restaurant {
  subscription?: Subscription;
  owner?: Profile;
  stats?: {
    total_orders: number;
    total_revenue: number;
    average_rating: number;
    total_complaints: number;
    active_users: number;
  };
}

export interface SubscriptionWithRestaurant extends Subscription {
  restaurant?: Restaurant;
  payment_history?: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string;
  status: 'success' | 'failed' | 'pending';
  created_at: string;
}

export interface ComplaintWithDetails extends Complaint {
  restaurant?: Restaurant;
  submitted_by_profile?: Profile;
  responses?: ComplaintResponse[];
}

export interface ComplaintResponse {
  id: string;
  complaint_id: string;
  responder_id: string;
  responder?: Profile;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  admin?: Profile;
  action_type: 'suspend' | 'activate' | 'modify_visibility' | 'modify_subscription' | 'respond_complaint' | 'deactivate';
  target_type: 'restaurant' | 'subscription' | 'complaint';
  target_id: string;
  details: Record<string, any>;
  created_at: string;
}
