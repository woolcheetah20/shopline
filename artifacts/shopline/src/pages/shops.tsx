import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { useListShops } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, Search, CheckCircle, Star, MapPin, SlidersHorizontal, X, Navigation } from "lucide-react";

const CATEGORIES = ["All", "Food", "Provisions", "Pharmacy", "Auto Parts", "Electronics", "Fabric", "Services"];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  return `${km.toFixed(1)}km away`;
}

export default function ShopsPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialCategory = params.get("category") ?? "All";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "granted" | "denied">("idle");

  const { data: shops, isLoading } = useListShops({
    search: query || undefined,
    category: category !== "All" ? category : undefined,
  });

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { timeout: 8000 }
    );
  }, []);

  // Sort shops by distance if we have the user's location
  const sortedShops = userLocation && shops
    ? [...shops].sort((a, b) => {
        const aDist = (a.lat && a.lng) ? haversineKm(userLocation.lat, userLocation.lng, a.lat, a.lng) : Infinity;
        const bDist = (b.lat && b.lng) ? haversineKm(userLocation.lat, userLocation.lng, b.lat, b.lng) : Infinity;
        return aDist - bDist;
      })
    : shops;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1">Shops near you</h1>
          <p className="text-muted-foreground text-sm">Discover local shops with live stock updates</p>
        </div>
        {locationStatus === "granted" && (
          <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-2.5 py-1.5 rounded-full">
            <Navigation className="h-3 w-3" />
            Sorted by distance
          </div>
        )}
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search shops by name or location..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filter:</span>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              category === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-foreground hover:border-primary/50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Shops grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border border-border rounded-xl bg-card overflow-hidden animate-pulse">
              <div className="h-36 bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedShops && sortedShops.length > 0 ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sortedShops.map(shop => {
            const distKm = (userLocation && shop.lat && shop.lng)
              ? haversineKm(userLocation.lat, userLocation.lng, shop.lat, shop.lng)
              : null;
            return (
              <Link key={shop.id} href={`/shops/${shop.id}`}>
                <div className="border border-border rounded-xl bg-card overflow-hidden hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group h-full flex flex-col">
                  <div className="h-36 bg-gradient-to-br from-primary/15 to-secondary/30 flex items-center justify-center relative">
                    {shop.imageUrl ? (
                      <img src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="h-12 w-12 text-primary/40" />
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {shop.isVerified && (
                        <Badge variant="secondary" className="text-xs gap-1 py-0.5">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        shop.isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${shop.isOpen ? "bg-green-500" : "bg-gray-400"}`} />
                        {shop.isOpen ? "Open" : "Closed"}
                      </div>
                    </div>
                    {distKm !== null && (
                      <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm text-xs px-2 py-0.5 rounded-full text-gray-700 font-medium">
                        {formatDistance(distKm)}
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">{shop.name}</h3>
                      {shop.averageRating && (
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground flex-shrink-0">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {Number(shop.averageRating).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Badge variant="outline" className="text-xs py-0">{shop.category}</Badge>
                    </div>
                    {shop.address && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-auto">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{shop.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <Store className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-1">No shops found</h3>
          <p className="text-muted-foreground text-sm">
            {query || category !== "All" ? "Try different search terms or categories" : "No shops are listed yet. Be the first to add one!"}
          </p>
          {(query || category !== "All") && (
            <Button variant="outline" className="mt-4" onClick={() => { setQuery(""); setCategory("All"); }}>
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
