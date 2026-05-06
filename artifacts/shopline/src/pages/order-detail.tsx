import { useParams, Link } from "wouter";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingBag, Store, Truck, MapPin, Clock, Phone, MessageCircle } from "lucide-react";

const STATUS_STEPS = ["pending", "confirmed", "ready", "picked_up"];

const STATUS_STYLES: Record<string, { label: string; className: string; desc: string }> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700 border-yellow-200", desc: "Your order has been sent to the shop." },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-700 border-blue-200", desc: "The shop has confirmed your order." },
  ready: { label: "Ready", className: "bg-emerald-100 text-emerald-700 border-emerald-200", desc: "Your order is ready for pickup or delivery." },
  picked_up: { label: "Picked Up", className: "bg-green-100 text-green-700 border-green-200", desc: "Order complete. Thank you for shopping!" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-600 border-red-200", desc: "This order was cancelled." },
};

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const id = Number(orderId);

  const { data: order, isLoading } = useGetOrder(id, {
    query: { enabled: !!id, queryKey: getGetOrderQueryKey(id) },
  });

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="font-serif text-xl font-bold">Order not found</h2>
        <Link href="/orders"><Button variant="outline" className="mt-4">Back to orders</Button></Link>
      </div>
    );
  }

  const status = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
  const currentStep = STATUS_STEPS.indexOf(order.status);
  const shopPhone = (order as { shopPhone?: string }).shopPhone ?? "";
  const shopWhatsapp = (order as { shopWhatsapp?: string }).shopWhatsapp ?? shopPhone;
  const waPhone = (shopWhatsapp || shopPhone).replace(/^0/, "233");

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link href="/orders">
        <Button variant="ghost" size="sm" className="gap-1 mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" /> My Orders
        </Button>
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold">{order.orderNumber}</h1>
          <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <Clock className="h-3.5 w-3.5" />
            {new Date(order.createdAt).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })}
          </div>
        </div>
        <Badge className={`text-sm border px-3 py-1 ${status.className}`} variant="outline">
          {status.label}
        </Badge>
      </div>

      {/* Status bar */}
      {order.status !== "cancelled" && (
        <div className="border border-border rounded-xl bg-card p-4 mb-4">
          <p className="text-sm text-muted-foreground mb-4">{status.desc}</p>
          <div className="flex items-center gap-0">
            {STATUS_STEPS.map((step, idx) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  idx <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {idx + 1}
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${idx < currentStep ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Placed</span>
            <span>Confirmed</span>
            <span>Ready</span>
            <span>Done</span>
          </div>
        </div>
      )}

      {/* Shop + delivery info + contact */}
      <div className="border border-border rounded-xl bg-card p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">{order.shopName ?? "Shop"}</div>
            <div className="text-xs text-muted-foreground">{(order as { shopAddress?: string }).shopAddress}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          {order.fulfillmentType === "delivery" ? (
            <><Truck className="h-4 w-4" /> Delivery</>
          ) : (
            <><MapPin className="h-4 w-4" /> Pickup from shop</>
          )}
        </div>
        {(shopPhone || shopWhatsapp) && (
          <div className="flex gap-2 pt-2 border-t border-border">
            {shopPhone && (
              <a href={`tel:${shopPhone}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                  <Phone className="h-3.5 w-3.5" />
                  Call Shop
                </Button>
              </a>
            )}
            {(shopWhatsapp || shopPhone) && (
              <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs border-green-300 text-green-700 hover:bg-green-50">
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </Button>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="border border-border rounded-xl bg-card p-4 mb-4">
        <h3 className="font-semibold mb-3 text-sm">Order Items</h3>
        <div className="space-y-2">
          {order.items?.map((item: { id: number; productName?: string; quantity: number; unitPrice: string }) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-foreground">
                {item.quantity}x {item.productName ?? "Product"}
              </span>
              <span className="font-medium">GHS {(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-3 pt-3 flex justify-between font-bold">
          <span>Total</span>
          <span className="text-primary">GHS {parseFloat(String(order.totalAmount)).toFixed(2)}</span>
        </div>
        {order.note && (
          <div className="mt-3 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
            Note: {order.note}
          </div>
        )}
      </div>

      <div className="text-center text-xs text-muted-foreground">
        <ShoppingBag className="h-4 w-4 mx-auto mb-1 text-muted-foreground/50" />
        Payment is made in person at the shop. No prepayment.
      </div>
    </div>
  );
}
