import { Link } from "wouter";
import { useListMyOrders, getListMyOrdersQueryKey, useUpdateOrderStatus } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingBag, Phone, MessageCircle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-700 border-blue-200" },
  ready: { label: "Ready", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  picked_up: { label: "Picked Up", className: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-600 border-red-200" },
};

const NEXT_STATUSES: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["ready", "cancelled"],
  ready: ["picked_up"],
  picked_up: [],
  cancelled: [],
};

export default function SellerOrdersPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: orders, isLoading } = useListMyOrders(
    { role: "seller" },
    { query: { enabled: isAuthenticated, queryKey: [...getListMyOrdersQueryKey(), "seller"] } },
  );
  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = (orderId: number, status: string) => {
    updateStatus.mutate({ id: orderId, data: { status } }, {
      onSuccess: () => {
        toast({ title: "Order updated", description: `Status set to ${STATUS_STYLES[status]?.label ?? status}` });
        qc.invalidateQueries({ queryKey: [...getListMyOrdersQueryKey(), "seller"] });
      },
      onError: (err: { data?: { error?: string } }) => {
        toast({ title: "Error", description: err?.data?.error ?? "Failed to update", variant: "destructive" });
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/seller">
        <Button variant="ghost" size="sm" className="gap-1 mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Button>
      </Link>
      <h1 className="font-serif text-2xl font-bold mb-6">Incoming Orders</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => {
            const statusInfo = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
            const nextStatuses = NEXT_STATUSES[order.status] ?? [];
            const buyerPhone = (order as { buyerPhone?: string }).buyerPhone ?? "";
            const buyerName = (order as { buyerName?: string }).buyerName ?? "Customer";
            const waPhone = buyerPhone.replace(/^0/, "233");
            return (
              <div key={order.id} className="border border-border rounded-xl bg-card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div>
                    <div className="font-bold text-base">{order.orderNumber}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.createdAt).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })}
                      {" · "}
                      {order.fulfillmentType === "delivery" ? "Delivery" : "Pickup"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">GHS {parseFloat(String(order.totalAmount)).toFixed(2)}</span>
                    <Badge className={`border text-xs ${statusInfo.className}`} variant="outline">
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>

                {/* Buyer info */}
                <div className="bg-muted/50 rounded-lg p-3 mb-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{buyerName}</div>
                      <div className="text-xs text-muted-foreground">{buyerPhone}</div>
                    </div>
                  </div>
                  {buyerPhone && (
                    <div className="flex items-center gap-2">
                      <a href={`tel:${buyerPhone}`}>
                        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                          <Phone className="h-3.5 w-3.5" />
                          Call
                        </Button>
                      </a>
                      <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-green-300 text-green-700 hover:bg-green-50">
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                        </Button>
                      </a>
                    </div>
                  )}
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="mb-3 bg-muted/40 rounded-lg p-3 space-y-1">
                    {(order.items as Array<{ id: number; productName?: string; quantity: number; unitPrice: string }>).map(item => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span>{item.quantity}x {item.productName ?? "Product"}</span>
                        <span className="text-muted-foreground">GHS {(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {order.note && (
                  <div className="text-xs text-muted-foreground bg-amber-50 border border-amber-100 rounded-lg p-2 mb-3">
                    Note: {order.note}
                  </div>
                )}

                {nextStatuses.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Move to:</span>
                    <div className="flex gap-2 flex-wrap">
                      {nextStatuses.map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(order.id, s)}
                          disabled={updateStatus.isPending}
                          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all hover:opacity-80 ${STATUS_STYLES[s]?.className ?? ""}`}
                        >
                          {STATUS_STYLES[s]?.label ?? s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No orders yet</h3>
          <p className="text-muted-foreground text-sm">Orders from customers will appear here.</p>
        </div>
      )}
    </div>
  );
}
