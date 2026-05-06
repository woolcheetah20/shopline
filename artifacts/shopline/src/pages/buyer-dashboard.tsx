import { Link } from "wouter";
import { useGetBuyerStats, getGetBuyerStatsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Store, CheckCircle, Clock, TrendingUp } from "lucide-react";

export default function BuyerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { data: stats } = useGetBuyerStats({ query: { enabled: isAuthenticated, queryKey: getGetBuyerStatsQueryKey() } });

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="font-serif text-xl">Sign in to view your dashboard</h2>
        <Link href="/login"><Button className="mt-4">Sign In</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold">Welcome back, {user?.name.split(" ")[0]}</h1>
        <p className="text-muted-foreground mt-1">Here's your activity overview</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Orders", value: stats?.totalOrders ?? 0, icon: <ShoppingBag className="h-5 w-5 text-primary" /> },
          { label: "Pending", value: stats?.pendingOrders ?? 0, icon: <Clock className="h-5 w-5 text-amber-500" /> },
          { label: "Completed", value: stats?.completedOrders ?? 0, icon: <CheckCircle className="h-5 w-5 text-green-600" /> },
          { label: "Total Spent", value: `GHS ${parseFloat(String(stats?.totalSpent ?? 0)).toFixed(0)}`, icon: <TrendingUp className="h-5 w-5 text-blue-500" /> },
        ].map(stat => (
          <div key={stat.label} className="border border-border rounded-xl bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              {stat.icon}
            </div>
            <div className="font-bold text-2xl">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link href="/">
          <div className="border border-border rounded-xl bg-card p-5 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-semibold">Browse Shops</div>
              <div className="text-sm text-muted-foreground">Discover local stores</div>
            </div>
          </div>
        </Link>
        <Link href="/orders">
          <div className="border border-border rounded-xl bg-card p-5 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold">My Orders</div>
              <div className="text-sm text-muted-foreground">Track your orders</div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
