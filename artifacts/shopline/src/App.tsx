import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";

import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ShopsPage from "@/pages/shops";
import ShopDetailPage from "@/pages/shop-detail";
import CartPage from "@/pages/cart";
import OrdersPage from "@/pages/orders";
import OrderDetailPage from "@/pages/order-detail";
import BuyerDashboard from "@/pages/buyer-dashboard";
import SellerDashboard from "@/pages/seller/dashboard";
import SellerShopPage from "@/pages/seller/shop";
import SellerProductsPage from "@/pages/seller/products";
import SellerOrdersPage from "@/pages/seller/orders";
import SellerDriversPage from "@/pages/seller/drivers";
import DriverPage from "@/pages/driver";
import ProfilePage from "@/pages/profile";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ component: Component, sellerOnly = false, adminOnly = false }: {
  component: React.ComponentType;
  sellerOnly?: boolean;
  adminOnly?: boolean;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Redirect to="/login" />;
  if (sellerOnly && user?.activeRole !== "seller") return <Redirect to="/" />;
  if (adminOnly && !(user as { isAdmin?: boolean })?.isAdmin) return <Redirect to="/" />;

  return <Component />;
}

function AppHome() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user?.activeRole === "seller") {
    return <Redirect to="/seller" />;
  }
  return <ShopsPage />;
}

function Router() {
  return (
    <>
      <Navbar />
      <main>
        <Switch>
          <Route path="/" component={AppHome} />
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={RegisterPage} />
          <Route path="/shops/:shopId" component={ShopDetailPage} />
          <Route path="/cart" component={CartPage} />
          <Route path="/orders" component={() => <ProtectedRoute component={OrdersPage} />} />
          <Route path="/orders/:orderId" component={() => <ProtectedRoute component={OrderDetailPage} />} />
          <Route path="/dashboard" component={() => <ProtectedRoute component={BuyerDashboard} />} />
          <Route path="/seller" component={() => <ProtectedRoute component={SellerDashboard} sellerOnly />} />
          <Route path="/seller/shop" component={() => <ProtectedRoute component={SellerShopPage} sellerOnly />} />
          <Route path="/seller/products" component={() => <ProtectedRoute component={SellerProductsPage} sellerOnly />} />
          <Route path="/seller/orders" component={() => <ProtectedRoute component={SellerOrdersPage} sellerOnly />} />
          <Route path="/seller/drivers" component={() => <ProtectedRoute component={SellerDriversPage} sellerOnly />} />
          <Route path="/driver" component={() => <ProtectedRoute component={DriverPage} />} />
          <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
          <Route path="/admin" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
