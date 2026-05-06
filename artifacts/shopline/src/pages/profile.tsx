import { useAuth } from "@/hooks/use-auth";
import { useSwitchRole, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Store, ShoppingBag, Truck, ArrowRightLeft, LogOut, Link as LinkIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const switchRole = useSwitchRole();

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="font-serif text-xl font-bold mb-2">Sign in to view your profile</h2>
        <Button onClick={() => setLocation("/login")}>Sign In</Button>
      </div>
    );
  }

  const isSeller = user.activeRole === "seller";
  const otherRole = isSeller ? "buyer" : "seller";
  const otherLabel = isSeller ? "Buyer" : "Seller";

  const handleSwitch = () => {
    switchRole.mutate({ data: { role: otherRole } }, {
      onSuccess: (data) => {
        // Update token if a new one is returned
        if (data.token) {
          localStorage.setItem("shopline_token", data.token);
        }
        toast({ title: `Switched to ${otherLabel} mode` });
        qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation(otherRole === "seller" ? "/seller" : "/");
      },
      onError: (err: { data?: { error?: string } }) => {
        toast({ title: "Error", description: err?.data?.error ?? "Failed to switch role", variant: "destructive" });
      },
    });
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="font-serif text-2xl font-bold mb-6">Profile</h1>

      {/* User card */}
      <div className="border border-border rounded-xl bg-card p-5 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="font-bold text-lg">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.phone}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isSeller ? "default" : "secondary"} className="gap-1.5 text-sm px-3 py-1">
            {isSeller ? <Store className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
            {isSeller ? "Seller Mode" : "Buyer Mode"}
          </Badge>
        </div>
      </div>

      {/* Role switcher */}
      <div className="border border-border rounded-xl bg-card p-5 mb-6">
        <h2 className="font-semibold mb-1 flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          Switch Mode
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          You are currently in <strong>{isSeller ? "Seller" : "Buyer"} mode</strong>. 
          {isSeller 
            ? " Switch to Buyer mode to browse shops and place orders." 
            : " Switch to Seller mode to manage your shop."}
        </p>
        <Button
          variant="outline"
          onClick={handleSwitch}
          disabled={switchRole.isPending}
          className="w-full gap-2"
        >
          <ArrowRightLeft className="h-4 w-4" />
          {switchRole.isPending ? "Switching..." : `Switch to ${otherLabel} Mode`}
        </Button>
      </div>

      {/* Quick links */}
      <div className="border border-border rounded-xl bg-card divide-y divide-border mb-6">
        {isSeller ? (
          <>
            <Link href="/seller">
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Seller Dashboard</span>
              </div>
            </Link>
            <Link href="/seller/shop">
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">My Shop</span>
              </div>
            </Link>
            <Link href="/seller/products">
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Products</span>
              </div>
            </Link>
          </>
        ) : (
          <>
            <Link href="/">
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Browse Shops</span>
              </div>
            </Link>
            <Link href="/orders">
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">My Orders</span>
              </div>
            </Link>
          </>
        )}
        <Link href="/driver">
          <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Driver Dashboard</span>
          </div>
        </Link>
      </div>

      {/* Sign out */}
      <Button
        variant="outline"
        className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 hover:border-destructive"
        onClick={() => { logout(); setLocation("/"); }}
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
