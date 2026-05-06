import { Link } from "wouter";
import {
  useListAvailableDrivers, getListAvailableDriversQueryKey,
  useListDeliveries, getListDeliveriesQueryKey,
  useListMyOrders, getListMyOrdersQueryKey,
  useCreateDeliveryRequest,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Truck, User, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function SellerDriversPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");

  const { data: drivers } = useListAvailableDrivers({ query: { enabled: isAuthenticated, queryKey: getListAvailableDriversQueryKey() } });
  const { data: deliveries } = useListDeliveries({ query: { enabled: isAuthenticated, queryKey: getListDeliveriesQueryKey() } });
  const { data: orders } = useListMyOrders({ query: { enabled: isAuthenticated, queryKey: getListMyOrdersQueryKey() } });
  const createDelivery = useCreateDeliveryRequest();

  const eligibleOrders = orders?.filter(o => o.status === "ready" && o.deliveryType === "delivery") ?? [];

  const handleCreate = () => {
    if (!selectedOrder || !selectedDriver) return;
    createDelivery.mutate({
      data: { orderId: Number(selectedOrder), driverId: Number(selectedDriver) }
    }, {
      onSuccess: () => {
        toast({ title: "Delivery request sent!" });
        setSelectedOrder("");
        setSelectedDriver("");
        qc.invalidateQueries({ queryKey: getListDeliveriesQueryKey() });
      },
      onError: (err: { data?: { error?: string } }) => {
        toast({ title: "Error", description: err?.data?.error ?? "Failed", variant: "destructive" });
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/seller">
        <Button variant="ghost" size="sm" className="gap-1 mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Button>
      </Link>
      <h1 className="font-serif text-2xl font-bold mb-2">Delivery Management</h1>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <strong>Disclaimer:</strong> Shopline is not responsible for missing or damaged items during delivery.
          Shop owners are responsible for verifying driver trustworthiness before assigning deliveries.
        </div>
      </div>

      {/* Create delivery request */}
      <div className="border border-border rounded-xl bg-card p-5 mb-8">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          Assign a Delivery
        </h2>
        {eligibleOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders with status "Ready" and delivery type "Delivery" are available right now.</p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Select Order</label>
              <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an order..." />
                </SelectTrigger>
                <SelectContent>
                  {eligibleOrders.map(o => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.orderNumber} — GHS {parseFloat(String(o.totalAmount)).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Select Driver</label>
              {!drivers || drivers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No available drivers right now.</p>
              ) : (
                <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a driver..." />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map(d => (
                      <SelectItem key={d.id} value={String(d.userId)}>
                        {d.vehicleType ?? "Driver"} — {d.vehicleNumber ?? "N/A"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button onClick={handleCreate} disabled={!selectedOrder || !selectedDriver || createDelivery.isPending} className="w-full">
              {createDelivery.isPending ? "Sending..." : "Send Delivery Request"}
            </Button>
          </div>
        )}
      </div>

      {/* Available drivers */}
      <div className="mb-8">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Available Drivers ({drivers?.length ?? 0})
        </h2>
        {drivers && drivers.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {drivers.map(d => (
              <div key={d.id} className="border border-border rounded-xl bg-card p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <div className="font-medium text-sm">{d.vehicleType ?? "Driver"}</div>
                  <div className="text-xs text-muted-foreground">{d.vehicleNumber ?? "No plate"}</div>
                </div>
                <Badge className="ml-auto bg-green-100 text-green-700 border-green-200 text-xs" variant="outline">Available</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-border rounded-xl text-muted-foreground text-sm">
            No drivers are available right now.
          </div>
        )}
      </div>

      {/* Active deliveries */}
      <div>
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          Active Deliveries
        </h2>
        {deliveries && deliveries.length > 0 ? (
          <div className="space-y-3">
            {deliveries.map(d => (
              <div key={d.id} className="border border-border rounded-xl bg-card p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="font-medium text-sm">Order #{d.orderId}</div>
                  <Badge variant="outline" className="text-xs capitalize">{d.status}</Badge>
                </div>
                {d.completedAt && (
                  <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Completed {new Date(d.completedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-border rounded-xl text-muted-foreground text-sm">
            No active deliveries.
          </div>
        )}
      </div>
    </div>
  );
}
