import { useState } from "react";
import {
  useGetMyDriver, getGetMyDriverQueryKey,
  useRegisterDriver, useUpdateDriverAvailability,
  useListDeliveries, getListDeliveriesQueryKey,
  useAcceptDelivery, useCompleteDelivery,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Truck, AlertTriangle, CheckCircle, User, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";

const DELIVERY_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  accepted: { label: "Accepted", className: "bg-blue-100 text-blue-700 border-blue-200" },
  in_transit: { label: "In Transit", className: "bg-purple-100 text-purple-700 border-purple-200" },
  delivered: { label: "Delivered", className: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-600 border-red-200" },
};

export default function DriverPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ vehicleType: "Motorbike", vehicleNumber: "", licenseNumber: "" });

  const { data: driver, isLoading } = useGetMyDriver({ query: { enabled: isAuthenticated, queryKey: getGetMyDriverQueryKey() } });
  const { data: deliveries } = useListDeliveries({ query: { enabled: isAuthenticated && !!driver, queryKey: getListDeliveriesQueryKey() } });
  const registerDriver = useRegisterDriver();
  const updateAvailability = useUpdateDriverAvailability();
  const acceptDelivery = useAcceptDelivery();
  const completeDelivery = useCompleteDelivery();

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Truck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="font-serif text-xl font-bold mb-2">Driver Dashboard</h2>
        <p className="text-muted-foreground mb-4">Sign in to register as a driver or manage deliveries.</p>
        <Button onClick={() => setLocation("/login")}>Sign In</Button>
      </div>
    );
  }

  const handleRegister = () => {
    registerDriver.mutate({ data: form }, {
      onSuccess: () => {
        toast({ title: "Registered as driver!" });
        qc.invalidateQueries({ queryKey: getGetMyDriverQueryKey() });
      },
      onError: (err: { data?: { error?: string } }) => {
        toast({ title: "Error", description: err?.data?.error ?? "Registration failed", variant: "destructive" });
      },
    });
  };

  const toggleAvailability = () => {
    if (!driver) return;
    updateAvailability.mutate({ data: { isAvailable: !driver.isAvailable } }, {
      onSuccess: () => {
        toast({ title: driver.isAvailable ? "Set to unavailable" : "Set to available" });
        qc.invalidateQueries({ queryKey: getGetMyDriverQueryKey() });
        qc.invalidateQueries({ queryKey: getListDeliveriesQueryKey() });
      },
    });
  };

  const handleAccept = (deliveryId: number) => {
    acceptDelivery.mutate({ id: deliveryId }, {
      onSuccess: () => {
        toast({ title: "Delivery accepted" });
        qc.invalidateQueries({ queryKey: getListDeliveriesQueryKey() });
      },
    });
  };

  const handleComplete = (deliveryId: number) => {
    completeDelivery.mutate({ id: deliveryId }, {
      onSuccess: () => {
        toast({ title: "Delivery completed!" });
        qc.invalidateQueries({ queryKey: getListDeliveriesQueryKey() });
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-serif text-2xl font-bold mb-2">Driver Dashboard</h1>
      <p className="text-muted-foreground mb-6 text-sm">Earn money delivering orders from local shops</p>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <strong>Disclaimer:</strong> Shopline is not responsible for missing or damaged items during delivery.
          Shop owners are responsible for verifying driver trustworthiness.
        </div>
      </div>

      {isLoading ? (
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
      ) : !driver ? (
        /* Registration form */
        <div className="border border-border rounded-xl bg-card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Register as a Driver
          </h2>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Vehicle Type</Label>
              <Select value={form.vehicleType} onValueChange={v => setForm(f => ({ ...f, vehicleType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Motorbike">Motorbike</SelectItem>
                  <SelectItem value="Bicycle">Bicycle</SelectItem>
                  <SelectItem value="Car">Car</SelectItem>
                  <SelectItem value="Van">Van</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Vehicle Number / Plate</Label>
              <Input value={form.vehicleNumber} onChange={e => setForm(f => ({ ...f, vehicleNumber: e.target.value }))} placeholder="GH-1234-24" />
            </div>
            <div>
              <Label className="mb-1.5 block">Driver's License Number</Label>
              <Input value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} placeholder="Optional" />
            </div>
            <Button onClick={handleRegister} disabled={registerDriver.isPending} className="w-full">
              {registerDriver.isPending ? "Registering..." : "Register as Driver"}
            </Button>
          </div>
        </div>
      ) : (
        /* Driver status */
        <>
          <div className="border border-border rounded-xl bg-card p-5 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{driver.vehicleType} Driver</div>
                <div className="text-sm text-muted-foreground">{driver.vehicleNumber ?? "No plate registered"}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{driver.isAvailable ? "Available" : "Unavailable"}</span>
                <button
                  onClick={toggleAvailability}
                  disabled={updateAvailability.isPending}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${driver.isAvailable ? "bg-green-500" : "bg-muted"}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow ${driver.isAvailable ? "translate-x-8" : "translate-x-1"}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Deliveries */}
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            My Deliveries
          </h2>
          {deliveries && deliveries.length > 0 ? (
            <div className="space-y-3">
              {deliveries.map(d => {
                const statusInfo = DELIVERY_STATUS_STYLES[d.status] ?? DELIVERY_STATUS_STYLES.pending;
                return (
                  <div key={d.id} className="border border-border rounded-xl bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium text-sm">Order #{d.orderId}</div>
                      <Badge className={`border text-xs ${statusInfo.className}`} variant="outline">{statusInfo.label}</Badge>
                    </div>
                    <div className="flex gap-2">
                      {d.status === "pending" && (
                        <Button size="sm" onClick={() => handleAccept(d.id)} disabled={acceptDelivery.isPending}>
                          Accept
                        </Button>
                      )}
                      {(d.status === "accepted" || d.status === "in_transit") && (
                        <Button size="sm" onClick={() => handleComplete(d.id)} disabled={completeDelivery.isPending}>
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 border border-border rounded-xl text-muted-foreground text-sm">
              No deliveries assigned yet.
              {!driver.isAvailable && (
                <p className="mt-1">Toggle your status to "Available" so shops can assign you deliveries.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
