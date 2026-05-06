import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Shield, Users, Store, ShoppingBag, Package, Ban, CheckCircle, Search, TrendingUp, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: number;
  name: string;
  phone: string;
  role: string;
  activeRole: string;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  totalShops: number;
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  bannedUsers: number;
}

async function adminFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem("shopline_token");
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"stats" | "users">("stats");

  const isAdmin = (user as { isAdmin?: boolean })?.isAdmin;

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    Promise.all([
      adminFetch("/admin/stats").then(setStats),
      adminFetch("/admin/users").then(setUsers),
    ]).catch(err => {
      toast({ title: "Error loading admin data", description: err.message, variant: "destructive" });
    }).finally(() => setLoading(false));
  }, [isAuthenticated, isAdmin]);

  const handleBootstrap = async () => {
    try {
      const result = await adminFetch("/admin/bootstrap", { method: "POST" });
      toast({ title: "Success!", description: result.message });
      window.location.reload();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleToggleBan = async (userId: number, currentlyBanned: boolean) => {
    try {
      await adminFetch(`/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ isBanned: !currentlyBanned }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: !currentlyBanned } : u));
      toast({ title: currentlyBanned ? "User unbanned" : "User banned" });
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleToggleAdmin = async (userId: number, currentlyAdmin: boolean) => {
    try {
      await adminFetch(`/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ isAdmin: !currentlyAdmin }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isAdmin: !currentlyAdmin } : u));
      toast({ title: currentlyAdmin ? "Admin removed" : "Admin granted" });
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="font-serif text-xl font-bold">Sign in required</h2>
        <Link href="/login"><Button className="mt-4">Sign In</Button></Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="font-serif text-2xl font-bold mb-2">Admin Panel</h2>
        <p className="text-muted-foreground text-sm mb-8">
          You don't have admin access. If you're the site owner and no admin exists yet, you can claim it below.
        </p>
        <Button onClick={handleBootstrap} variant="outline" className="gap-2">
          <Crown className="h-4 w-4" />
          Claim Admin Access
        </Button>
        <p className="text-xs text-muted-foreground mt-3">This only works if no admin account exists yet.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-1 mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold">Admin Panel</h1>
          <p className="text-xs text-muted-foreground">Shopline site management</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-8 w-fit">
        <button
          onClick={() => setTab("stats")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === "stats" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === "users" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
        >
          Users ({users.length})
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : tab === "stats" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-500 bg-blue-50" },
            { label: "Total Shops", value: stats?.totalShops ?? 0, icon: Store, color: "text-orange-500 bg-orange-50" },
            { label: "Total Orders", value: stats?.totalOrders ?? 0, icon: ShoppingBag, color: "text-purple-500 bg-purple-50" },
            { label: "Products Listed", value: stats?.totalProducts ?? 0, icon: Package, color: "text-green-500 bg-green-50" },
            { label: "Total Revenue", value: `GHS ${(stats?.totalRevenue ?? 0).toFixed(2)}`, icon: TrendingUp, color: "text-emerald-500 bg-emerald-50" },
            { label: "Banned Users", value: stats?.bannedUsers ?? 0, icon: Ban, color: "text-red-500 bg-red-50" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="border border-border rounded-xl bg-card p-5">
              <div className={`h-10 w-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="font-bold text-2xl">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {filteredUsers.map(u => (
              <div key={u.id} className="border border-border rounded-xl bg-card p-4 flex items-center gap-3 flex-wrap">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{u.name}</span>
                    {u.isAdmin && (
                      <Badge className="text-xs bg-primary/10 text-primary border-primary/20 py-0">Admin</Badge>
                    )}
                    {u.isBanned && (
                      <Badge variant="destructive" className="text-xs py-0">Banned</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{u.phone} · {u.role}</div>
                  <div className="text-xs text-muted-foreground">
                    Joined {new Date(u.createdAt).toLocaleDateString("en-GH", { dateStyle: "medium" })}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className={`text-xs h-8 gap-1 ${u.isBanned ? "text-green-700 border-green-300 hover:bg-green-50" : "text-red-600 border-red-200 hover:bg-red-50"}`}
                    onClick={() => handleToggleBan(u.id, u.isBanned)}
                  >
                    {u.isBanned ? <><CheckCircle className="h-3.5 w-3.5" /> Unban</> : <><Ban className="h-3.5 w-3.5" /> Ban</>}
                  </Button>
                  {!u.isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 gap-1"
                      onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                    >
                      <Crown className="h-3.5 w-3.5" />
                      Make Admin
                    </Button>
                  )}
                  {u.isAdmin && u.id !== user?.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 gap-1 text-muted-foreground"
                      onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                    >
                      Remove Admin
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
