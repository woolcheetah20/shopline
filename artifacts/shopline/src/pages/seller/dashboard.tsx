import { Link } from "wouter";
import { useGetSellerStats, getGetSellerStatsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Store, ShoppingBag, Package, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function SellerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { data: stats } = useGetSellerStats({ query: { enabled: isAuthenticated, queryKey: getGetSellerStatsQueryKey() } });

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="font-serif text-xl">Sign in to access seller dashboard</h2>
        <Link href="/login"><Button className="mt-4">Sign In</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name.split(" ")[0]}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/seller/products">
            <Button variant="outline" size="sm">Manage Products</Button>
          </Link>
          <Link href="/seller/orders">
            <Button size="sm">View Orders</Button>
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Orders This Week", value: stats?.ordersThisWeek ?? 0, icon: <TrendingUp className="h-5 w-5 text-primary" />, color: "bg-primary/10" },
          { label: "Orders This Month", value: stats?.ordersThisMonth ?? 0, icon: <ShoppingBag className="h-5 w-5 text-blue-600" />, color: "bg-blue-100" },
          { label: "Pending Orders", value: stats?.pendingOrders ?? 0, icon: <Clock className="h-5 w-5 text-amber-600" />, color: "bg-amber-100" },
          { label: "Total Products", value: stats?.totalProducts ?? 0, icon: <Package className="h-5 w-5 text-green-600" />, color: "bg-green-100" },
        ].map(stat => (
          <div key={stat.label} className="border border-border rounded-xl bg-card p-4">
            <div className={`inline-flex h-10 w-10 rounded-xl items-center justify-center mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="font-bold text-2xl">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue */}
      {stats?.revenueThisMonth !== undefined && (
        <div className="border border-border rounded-xl bg-card p-5 mb-8">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Revenue This Month</h3>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="font-serif text-3xl font-bold text-primary">
            GHS {parseFloat(String(stats.revenueThisMonth)).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">From {stats.ordersThisMonth} orders</p>
        </div>
      )}

      {/* Top products */}
      {stats?.topProducts && stats.topProducts.length > 0 && (
        <div className="border border-border rounded-xl bg-card p-5 mb-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Top Products
          </h3>
          <div className="space-y-3">
            {stats.topProducts.slice(0, 5).map((p: { productId: number; productName: string; totalSold: number }) => (
              <div key={p.productId} className="flex items-center justify-between text-sm">
                <span className="font-medium">{p.productName}</span>
                <span className="text-muted-foreground">{p.totalSold} sold</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { href: "/seller/shop", icon: <Store className="h-6 w-6 text-primary" />, title: "My Shop", desc: "Edit shop details", color: "bg-primary/10" },
          { href: "/seller/products", icon: <Package className="h-6 w-6 text-blue-600" />, title: "Products", desc: "Manage inventory", color: "bg-blue-100" },
          { href: "/seller/orders", icon: <ShoppingBag className="h-6 w-6 text-green-600" />, title: "Orders", desc: "Incoming orders", color: "bg-green-100" },
          { href: "/seller/drivers", icon: <TrendingUp className="h-6 w-6 text-amber-600" />, title: "Delivery", desc: "Manage deliveries", color: "bg-amber-100" },
          { href: "/orders", icon: <CheckCircle className="h-6 w-6 text-purple-600" />, title: "Order History", desc: "All past orders", color: "bg-purple-100" },
          { href: "/profile", icon: <AlertCircle className="h-6 w-6 text-muted-foreground" />, title: "Profile", desc: "Account settings", color: "bg-muted" },
        ].map(item => (
          <Link key={item.href} href={item.href}>
            <div className="border border-border rounded-xl bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer flex items-center gap-3">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                {item.icon}
              </div>
              <div>
                <div className="font-semibold text-sm">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
