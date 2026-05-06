import { Link, useLocation } from "wouter";
import { useListMyOrders, getListMyOrdersQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ChevronRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-700 border-blue-200" },
  ready: { label: "Ready", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  picked_up: { label: "Picked Up", className: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-600 border-red-200" },
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: orders, isLoading } = useListMyOrders({ query: { enabled: isAuthenticated, queryKey: getListMyOrdersQueryKey() } });

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="font-serif text-2xl font-bold mb-2">Sign in to see your orders</h2>
        <Button onClick={() => setLocation("/login")}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-1 mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back to shops
        </Button>
      </Link>
      <h1 className="font-serif text-2xl font-bold mb-6">My Orders</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map(order => {
            const status = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
            return (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div className="border border-border rounded-xl bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{order.orderNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}
                      {order.deliveryType === "delivery" ? "Delivery" : "Pickup"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs border ${status.className}`} variant="outline">{status.label}</Badge>
                    <span className="font-bold text-sm text-primary">GHS {parseFloat(String(order.totalAmount)).toFixed(2)}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-1">No orders yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Browse local shops and place your first order.</p>
          <Link href="/"><Button>Browse Shops</Button></Link>
        </div>
      )}
    </div>
  );
}
