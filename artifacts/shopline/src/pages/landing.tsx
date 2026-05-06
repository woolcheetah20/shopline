import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, ShoppingBag, Truck, Star, CheckCircle, ArrowRight, MapPin, Bell, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useListShops } from "@workspace/api-client-react";

const CATEGORIES = [
  { name: "Provisions", icon: "🛒" },
  { name: "Food", icon: "🍲" },
  { name: "Pharmacy", icon: "💊" },
  { name: "Auto Parts", icon: "🔧" },
  { name: "Electronics", icon: "📱" },
  { name: "Fabric", icon: "🧵" },
  { name: "Services", icon: "✂️" },
];

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const { data: shops } = useListShops({});

  const featuredShops = shops?.slice(0, 3) ?? [];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/30 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4 text-xs font-semibold uppercase tracking-widest">
            Ghana's Local Shop Network
          </Badge>
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Your neighborhood shops,
            <span className="text-primary"> online.</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            Browse live stock from local provisions stores, chop bars, pharmacies, and more.
            Place a pickup order. Pay when you arrive. No scams, no prepayment.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuthenticated ? (
              <Link href={user?.activeRole === "seller" ? "/seller" : "/"}>
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  {user?.activeRole === "seller" ? "Go to Dashboard" : "Browse Shops"}
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    Get Started Free
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                    <Store className="h-5 w-5" />
                    Browse Shops
                  </Button>
                </Link>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-4">No credit card required. Free to browse.</p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-4 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-center mb-8">Find what you need</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map(cat => (
              <Link key={cat.name} href={`/?category=${encodeURIComponent(cat.name)}`}>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background hover:border-primary hover:bg-primary/5 transition-all cursor-pointer text-sm font-medium">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-center mb-4">How Shopline works</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Three steps from search to pickup. No prepayment required — ever.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <MapPin className="h-7 w-7 text-primary" />,
                step: "1",
                title: "Discover nearby shops",
                desc: "Browse shops in your area by category. See live stock status before you leave home.",
              },
              {
                icon: <ShoppingBag className="h-7 w-7 text-primary" />,
                step: "2",
                title: "Place your order",
                desc: "Add items to cart and submit. Get a unique order number (e.g. SL-4821). No payment needed.",
              },
              {
                icon: <Bell className="h-7 w-7 text-primary" />,
                step: "3",
                title: "Pick up and pay",
                desc: "The shop notifies you when ready. Show up, pay in person, take your items. Done.",
              },
            ].map(item => (
              <div key={item.step} className="relative">
                <div className="absolute -top-3 -left-3 bg-primary text-primary-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {item.step}
                </div>
                <div className="border border-border rounded-xl p-6 bg-card h-full">
                  <div className="mb-4">{item.icon}</div>
                  <h3 className="font-serif text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Shops */}
      {featuredShops.length > 0 && (
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl font-bold">Shops near you</h2>
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {featuredShops.map(shop => (
                <Link key={shop.id} href={`/shops/${shop.id}`}>
                  <div className="border border-border rounded-xl bg-card overflow-hidden hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                    <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/40 flex items-center justify-center">
                      <Store className="h-10 w-10 text-primary/60" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">{shop.name}</h3>
                        {shop.isVerified && <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{shop.category} · {shop.address}</p>
                      <div className="flex items-center gap-1">
                        <div className={`h-2 w-2 rounded-full ${shop.isOpen ? "bg-green-500" : "bg-gray-400"}`} />
                        <span className="text-xs text-muted-foreground">{shop.isOpen ? "Open" : "Closed"}</span>
                        {shop.averageRating && (
                          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {Number(shop.averageRating).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* For shop owners */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4 text-xs">For Shop Owners</Badge>
              <h2 className="font-serif text-3xl font-bold mb-4">Get discovered by people near you</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                List your shop in under 5 minutes. Add products with photos. Manage orders from your phone.
                The first 3 months are completely free.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Manage live stock status with one tap",
                  "Receive and track pickup orders",
                  "Arrange local delivery through trusted drivers",
                  "Get verified to build customer trust",
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=seller">
                <Button size="lg" className="gap-2">
                  List Your Shop Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Store className="h-6 w-6 text-primary" />, title: "Easy setup", desc: "Under 5 minutes to register" },
                { icon: <Bell className="h-6 w-6 text-primary" />, title: "Order alerts", desc: "Instant notifications" },
                { icon: <MessageCircle className="h-6 w-6 text-primary" />, title: "WhatsApp", desc: "Direct customer chat" },
                { icon: <Truck className="h-6 w-6 text-primary" />, title: "Delivery", desc: "Work with local riders" },
              ].map(item => (
                <div key={item.title} className="border border-border rounded-xl p-4 bg-card">
                  <div className="mb-2">{item.icon}</div>
                  <div className="font-semibold text-sm">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-serif text-lg font-bold text-primary">
            <Store className="h-5 w-5" />
            Shopline
          </div>
          <p className="text-xs text-muted-foreground">
            Connecting customers with local shops across Ghana. Built by Jesse Kofi Osafo.
          </p>
        </div>
      </footer>
    </div>
  );
}
