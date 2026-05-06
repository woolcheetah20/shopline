import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getCart, updateCartQuantity, removeFromCart, clearCart, CartItem } from "@/lib/cart";
import { useCreateOrder } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Truck, Store, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(getCart);
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [notes, setNotes] = useState("");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const createOrder = useCreateOrder();

  useEffect(() => {
    const update = () => setItems(getCart());
    window.addEventListener("cart-updated", update);
    return () => window.removeEventListener("cart-updated", update);
  }, []);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shopId = items[0]?.shopId;

  const handlePlaceOrder = () => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    if (!shopId) return;

    createOrder.mutate({
      data: {
        shopId,
        deliveryType,
        notes: notes || undefined,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: String(i.price) })),
      }
    }, {
      onSuccess: (order) => {
        clearCart();
        setItems([]);
        toast({ title: "Order placed!", description: `Your order ${order.orderNumber} has been submitted.` });
        setLocation(`/orders/${order.id}`);
      },
      onError: (err: { data?: { error?: string } }) => {
        toast({ title: "Order failed", description: err?.data?.error ?? "Could not place order", variant: "destructive" });
      },
    });
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="font-serif text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Browse local shops and add some items to get started.</p>
        <Link href="/"><Button>Browse Shops</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={`/shops/${shopId}`}>
        <Button variant="ghost" size="sm" className="gap-1 mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </Button>
      </Link>

      <h1 className="font-serif text-2xl font-bold mb-6">Your Cart</h1>

      <div className="space-y-3 mb-6">
        {items.map(item => (
          <div key={item.productId} className="flex items-center gap-3 border border-border rounded-xl bg-card p-3">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <ShoppingCart className="h-5 w-5 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{item.productName}</div>
              <div className="text-xs text-primary font-semibold">GHS {item.price.toFixed(2)}</div>
            </div>
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button className="px-2 py-1.5 hover:bg-muted transition-colors" onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}>
                <Minus className="h-3 w-3" />
              </button>
              <span className="px-2.5 text-sm font-semibold min-w-[28px] text-center">{item.quantity}</span>
              <button className="px-2 py-1.5 hover:bg-muted transition-colors" onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}>
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <div className="text-sm font-bold w-20 text-right">GHS {(item.price * item.quantity).toFixed(2)}</div>
            <button onClick={() => removeFromCart(item.productId)} className="text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Delivery type */}
      <div className="border border-border rounded-xl bg-card p-4 mb-4">
        <h3 className="font-semibold mb-3 text-sm">Fulfilment method</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setDeliveryType("pickup")}
            className={`border-2 rounded-xl p-3 text-left transition-all ${
              deliveryType === "pickup" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
            }`}
          >
            <Store className={`h-5 w-5 mb-1.5 ${deliveryType === "pickup" ? "text-primary" : "text-muted-foreground"}`} />
            <div className="font-semibold text-sm">Pickup</div>
            <div className="text-xs text-muted-foreground">Collect from shop</div>
          </button>
          <button
            onClick={() => setDeliveryType("delivery")}
            className={`border-2 rounded-xl p-3 text-left transition-all ${
              deliveryType === "delivery" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
            }`}
          >
            <Truck className={`h-5 w-5 mb-1.5 ${deliveryType === "delivery" ? "text-primary" : "text-muted-foreground"}`} />
            <div className="font-semibold text-sm">Delivery</div>
            <div className="text-xs text-muted-foreground">Delivered to you</div>
          </button>
        </div>
        {deliveryType === "delivery" && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex gap-2 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>Shopline is not responsible for missing or damaged items during delivery. Shop owners are responsible for verifying driver trustworthiness.</span>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-1.5 block">Order notes (optional)</label>
        <Input
          placeholder="Any special instructions for the shop..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      {/* Summary */}
      <div className="border border-border rounded-xl bg-card p-4 mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
          <span className="font-medium">GHS {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm mb-3">
          <span className="text-muted-foreground">Delivery fee</span>
          <Badge variant="outline" className="text-xs">Pay at shop</Badge>
        </div>
        <div className="flex justify-between font-bold text-base border-t border-border pt-3">
          <span>Total estimate</span>
          <span className="text-primary">GHS {subtotal.toFixed(2)}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Payment is made in person. No prepayment required.</p>
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={handlePlaceOrder}
        disabled={createOrder.isPending}
      >
        {createOrder.isPending ? "Placing order..." : `Place Order · GHS ${subtotal.toFixed(2)}`}
      </Button>
      {!isAuthenticated && (
        <p className="text-xs text-muted-foreground text-center mt-2">You will be asked to sign in before placing your order.</p>
      )}
    </div>
  );
}
