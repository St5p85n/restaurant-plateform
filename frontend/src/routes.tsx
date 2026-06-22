import type { ReactNode } from 'react';
import NotFound from './pages/NotFound';
import ForbiddenPage from './pages/ForbiddenPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RestaurantsListPage from './pages/RestaurantsListPage';
import RestaurantDetailsPage from './pages/RestaurantDetailsPage';
import ReservationPage from './pages/ReservationPage';
import CustomerLoyaltyPage from './pages/CustomerLoyaltyPage';
import ComplaintPage from './pages/ComplaintPage';
import RestaurantDashboardPage from './pages/RestaurantDashboardPage';
import SubscriptionPage from './pages/restaurant/SubscriptionPage';
import POSPage from './pages/POSPage';
import StockManagementPage from './pages/StockManagementPage';
import RegisterRestaurantPage from './pages/RegisterRestaurantPage';
import ReservationsManagementPage from './pages/ReservationsManagementPage';
import MenuManagementPage from './pages/MenuManagementPage';
import StaffManagementPage from './pages/StaffManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import FinancesPage from './pages/FinancesPage';
import CustomerLoyaltyManagementPage from './pages/CustomerLoyaltyManagementPage';
import ComplaintsManagementPage from './pages/ComplaintsManagementPage';
import RestaurantReviewsPage from './pages/RestaurantReviewsPage';
import OrderManagementPage from './pages/OrderManagementPage';
import DeliveryManagementPage from './pages/DeliveryManagementPage';
import RestaurantLayout from './components/layouts/RestaurantLayout';
import AdminLayout from './components/layouts/AdminLayout';
import PublicLayout from './components/layouts/PublicLayout';
import PublicRestaurantsListPage from './pages/public/RestaurantsListPage';
import RestaurantMenuPage from './pages/public/RestaurantMenuPage';
import CheckoutPage from './pages/public/CheckoutPage';
import OrderTrackingPage from './pages/public/OrderTrackingPage';
import ReviewOrderPage from './pages/public/ReviewOrderPage';
import RegisterClientPage from './pages/client/RegisterClientPage';
import ClientDashboardPage from './pages/client/ClientDashboardPage';
import ClientProfilePage from './pages/client/ClientProfilePage';
import PaymentHistoryPage from './pages/restaurant/PaymentHistoryPage';
import RestaurantSettingsPage from './pages/restaurant/RestaurantSettingsPage';
import AdminRegistrationRequestsPage from './pages/admin/AdminRegistrationRequestsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminRestaurantsPage from './pages/admin/AdminRestaurantsPage';
import AdminRestaurantDetailsPage from './pages/admin/AdminRestaurantDetailsPage';
import AdminSubscriptionsPage from './pages/admin/AdminSubscriptionsPage';
import AdminComplaintsPage from './pages/admin/AdminComplaintsPage';
import AdminAdvancedDashboardPage from './pages/admin/AdminAdvancedDashboardPage';
import SuperAdminManagementPage from './pages/admin/SuperAdminManagementPage';
import RegisterSuperAdminPage from './pages/RegisterSuperAdminPage';
import MobileLayout from './components/layouts/MobileLayout';
import MobileHomePage from './pages/mobile/MobileHomePage';
import MobileRestaurantPage from './pages/mobile/MobileRestaurantPage';
import MobileCartPage from './pages/mobile/MobileCartPage';
import MobileOrdersPage from './pages/mobile/MobileOrdersPage';
import MobileLoyaltyPage from './pages/mobile/MobileLoyaltyPage';
import MobileProfilePage from './pages/mobile/MobileProfilePage';
import MobileOrderConfirmationPage from './pages/mobile/MobileOrderConfirmationPage';
import MobilePaymentSuccessPage from './pages/mobile/MobilePaymentSuccessPage';
import MobilePaymentPendingPage from './pages/mobile/MobilePaymentPendingPage';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  /** Accessible without login. Routes without this flag require authentication. Has no effect when RouteGuard is not in use. */
  public?: boolean;
}

export const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    element: (
      <PublicLayout>
        <HomePage />
      </PublicLayout>
    ),
    public: true,
  },
  {
    name: 'Register Client',
    path: '/register-client',
    element: (
      <PublicLayout>
        <RegisterClientPage />
      </PublicLayout>
    ),
    public: true,
  },
  {
    name: 'Client Dashboard',
    path: '/client/dashboard',
    element: (
      <PublicLayout>
        <ClientDashboardPage />
      </PublicLayout>
    ),
  },
  {
    name: 'Client Profile',
    path: '/client/profile',
    element: (
      <PublicLayout>
        <ClientProfilePage />
      </PublicLayout>
    ),
  },
  {
    name: 'Restaurants List',
    path: '/restaurants',
    element: (
      <PublicLayout>
        <RestaurantsListPage />
      </PublicLayout>
    ),
    public: true,
  },
  {
    name: 'Public Restaurants List',
    path: '/order/restaurants',
    element: (
      <PublicLayout>
        <PublicRestaurantsListPage />
      </PublicLayout>
    ),
    public: true,
  },
  {
    name: 'Restaurant Menu',
    path: '/restaurant/:id',
    element: (
      <PublicLayout>
        <RestaurantMenuPage />
      </PublicLayout>
    ),
    public: true,
  },
  {
    name: 'Checkout',
    path: '/checkout',
    element: (
      <PublicLayout>
        <CheckoutPage />
      </PublicLayout>
    ),
    public: true,
  },
  {
    name: 'Order Tracking',
    path: '/order/:id',
    element: (
      <PublicLayout>
        <OrderTrackingPage />
      </PublicLayout>
    ),
    public: true,
  },
  {
    name: 'Review Order',
    path: '/review/:orderId',
    element: (
      <ReviewOrderPage />
    ),
    public: true,
  },
  {
    name: 'Restaurant Details',
    path: '/restaurants/:id',
    element: (
      <PublicLayout>
        <RestaurantDetailsPage />
      </PublicLayout>
    ),
    public: true,
  },
  {
    name: 'Reservation',
    path: '/reservations',
    element: (
      <PublicLayout>
        <ReservationPage />
      </PublicLayout>
    ),
    public: true,
  },
  {
    name: 'Customer Loyalty',
    path: '/customer/loyalty',
    element: (
      <PublicLayout>
        <CustomerLoyaltyPage />
      </PublicLayout>
    ),
    public: false,
  },
  {
    name: 'Complaint',
    path: '/complaint',
    element: (
      <PublicLayout>
        <ComplaintPage />
      </PublicLayout>
    ),
    public: false,
  },
  {
    name: 'Restaurant Dashboard',
    path: '/dashboard',
    element: (
      <RestaurantLayout>
        <RestaurantDashboardPage />
      </RestaurantLayout>
    ),
    public: false,
  },
  {
    name: 'Restaurant Subscription',
    path: '/dashboard/subscription',
    element: (
      <RestaurantLayout>
        <SubscriptionPage />
      </RestaurantLayout>
    ),
    public: false,
  },
  {
    name: 'Reservations Management',
    path: '/dashboard/reservations',
    element: (
      <RestaurantLayout>
        <ReservationsManagementPage />
      </RestaurantLayout>
    ),
    public: false,
  },
  {
    name: 'Menu Management',
    path: '/dashboard/menu',
    element: (
      <RestaurantLayout>
        <MenuManagementPage />
      </RestaurantLayout>
    ),
    public: false,
  },
  {
    name: 'Tables',
    path: '/dashboard/pos',
    element: (
      <RestaurantLayout>
        <POSPage />
      </RestaurantLayout>
    ),
    public: false,
  },
  {
    name: 'Stock Management',
    path: '/dashboard/stock',
    element: (
      <RestaurantLayout>
        <StockManagementPage />
      </RestaurantLayout>
    ),
    public: false,
  },
  {
    name: 'Staff Management',
    path: '/dashboard/staff',
    element: (
      <RestaurantLayout>
        <StaffManagementPage />
      </RestaurantLayout>
    ),
    public: false,
  },
  {
    name: 'User Management',
    path: '/dashboard/users',
    element: (
      <RestaurantLayout>
        <UserManagementPage />
      </RestaurantLayout>
    ),
    public: false,
  },
  {
    name: 'Finances',
    path: '/dashboard/finances',
    element: (
      <RestaurantLayout>
        <FinancesPage />
      </RestaurantLayout>
    ),
    public: false,
  },
  {
    name: 'Customer Loyalty Management',
    path: '/dashboard/customers',
    element: (
      <RestaurantLayout>
        <CustomerLoyaltyManagementPage />
      </RestaurantLayout>
    ),
    public: false,
  },
  {
    name: 'Complaints Management',
    path: '/dashboard/complaints',
    element: (
      <RestaurantLayout>
        <ComplaintsManagementPage />
      </RestaurantLayout>
    ),
    public: false,
  },
  {
    name: 'Avis clients',
    path: '/dashboard/reviews',
    element: (
      <RestaurantLayout>
        <RestaurantReviewsPage />
      </RestaurantLayout>
    ),
    public: false,
  },
  {
    name: 'Order Management',
    path: '/dashboard/orders',
    element: (
      <RestaurantLayout>
        <OrderManagementPage />
      </RestaurantLayout>
    ),
    public: false,
  },
  {
    name: 'Historique Paiements',
    path: '/dashboard/payments',
    element: (
      <RestaurantLayout>
        <PaymentHistoryPage />
      </RestaurantLayout>
    ),
    public: false,
  },
  {
    name: 'Paramètres Restaurant',
    path: '/dashboard/settings',
    element: (
      <RestaurantLayout>
        <RestaurantSettingsPage />
      </RestaurantLayout>
    ),
    public: false,
  },
  {
    name: 'Delivery Management',
    path: '/dashboard/delivery',
    element: (
      <RestaurantLayout>
        <DeliveryManagementPage />
      </RestaurantLayout>
    ),
    public: false,
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
    public: true,
  },
  {
    name: 'Register Super Admin',
    path: '/register-super-admin',
    element: <RegisterSuperAdminPage />,
    public: true,
  },
  {
    name: 'Forgot Password',
    path: '/forgot-password',
    element: (
      <PublicLayout>
        <ForgotPasswordPage />
      </PublicLayout>
    ),
    public: true,
  },
  {
    name: 'Reset Password',
    path: '/reset-password',
    element: (
      <PublicLayout>
        <ResetPasswordPage />
      </PublicLayout>
    ),
    public: true,
  },
  {
    name: 'Register Restaurant',
    path: '/register-restaurant',
    element: (
      <PublicLayout>
        <RegisterRestaurantPage />
      </PublicLayout>
    ),
    public: false,
  },
  {
    name: 'Admin Dashboard',
    path: '/admin/dashboard',
    element: (
      <AdminLayout>
        <AdminDashboardPage />
      </AdminLayout>
    ),
    public: false,
  },
  {
    name: 'Admin Advanced Dashboard',
    path: '/admin/advanced-dashboard',
    element: (
      <AdminLayout>
        <AdminAdvancedDashboardPage />
      </AdminLayout>
    ),
    public: false,
  },
  {
    name: 'Admin Registration Requests',
    path: '/admin/registration-requests',
    element: (
      <AdminLayout>
        <AdminRegistrationRequestsPage />
      </AdminLayout>
    ),
    public: false,
  },
  {
    name: 'Admin Restaurants',
    path: '/admin/restaurants',
    element: (
      <AdminLayout>
        <AdminRestaurantsPage />
      </AdminLayout>
    ),
    public: false,
  },
  {
    name: 'Admin Restaurant Details',
    path: '/admin/restaurants/:id',
    element: (
      <AdminLayout>
        <AdminRestaurantDetailsPage />
      </AdminLayout>
    ),
    public: false,
  },
  {
    name: 'Admin Subscriptions',
    path: '/admin/subscriptions',
    element: (
      <AdminLayout>
        <AdminSubscriptionsPage />
      </AdminLayout>
    ),
    public: false,
  },
  {
    name: 'Admin Complaints',
    path: '/admin/complaints',
    element: (
      <AdminLayout>
        <AdminComplaintsPage />
      </AdminLayout>
    ),
    public: false,
  },
  {
    name: 'Super Admin Management',
    path: '/admin/super-admins',
    element: (
      <AdminLayout>
        <SuperAdminManagementPage />
      </AdminLayout>
    ),
    public: false,
  },
  {
    name: 'Forbidden',
    path: '/403',
    element: <ForbiddenPage />,
    public: true,
  },
  // Routes Mobile
  {
    name: 'Mobile Home',
    path: '/mobile',
    element: (
      <MobileLayout>
        <MobileHomePage />
      </MobileLayout>
    ),
    public: true,
  },
  {
    name: 'Mobile Restaurant',
    path: '/mobile/restaurant/:restaurantId',
    element: (
      <MobileLayout>
        <MobileRestaurantPage />
      </MobileLayout>
    ),
    public: true,
  },
  {
    name: 'Mobile Cart',
    path: '/mobile/cart/:restaurantId',
    element: (
      <MobileLayout>
        <MobileCartPage />
      </MobileLayout>
    ),
    public: false,
  },
  {
    name: 'Mobile Order Confirmation',
    path: '/mobile/order-confirmation/:orderId',
    element: (
      <MobileLayout>
        <MobileOrderConfirmationPage />
      </MobileLayout>
    ),
    public: false,
  },
  {
    name: 'Mobile Payment Success',
    path: '/mobile/payment-success',
    element: (
      <MobileLayout>
        <MobilePaymentSuccessPage />
      </MobileLayout>
    ),
    public: false,
  },
  {
    name: 'Mobile Payment Pending',
    path: '/mobile/payment-pending/:paymentId',
    element: (
      <MobileLayout>
        <MobilePaymentPendingPage />
      </MobileLayout>
    ),
    public: false,
  },
  {
    name: 'Mobile Orders',
    path: '/mobile/orders',
    element: (
      <MobileLayout>
        <MobileOrdersPage />
      </MobileLayout>
    ),
    public: false,
  },
  {
    name: 'Mobile Loyalty',
    path: '/mobile/loyalty',
    element: (
      <MobileLayout>
        <MobileLoyaltyPage />
      </MobileLayout>
    ),
    public: false,
  },
  {
    name: 'Mobile Profile',
    path: '/mobile/profile',
    element: (
      <MobileLayout>
        <MobileProfilePage />
      </MobileLayout>
    ),
    public: false,
  },
  {
    name: 'Not Found',
    path: '*',
    element: (
      <PublicLayout>
        <NotFound />
      </PublicLayout>
    ),
    public: true,
  },
];

