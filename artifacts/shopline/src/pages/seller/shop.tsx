import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useGetMyShop, getGetMyShopQueryKey, useCreateShop, useUpdateShop } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, CheckCircle, ArrowLeft, ImagePlus, MapPin, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORIES = ["Food", "Provisions", "Pharmacy", "Auto Parts", "Electronics", "Fabric", "Services"];

function parseGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  // Formats: @lat,lng,  or  /place/.../@lat,lng,  or  ?q=lat,lng  or  ll=lat,lng
  const patterns = [
    /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /maps\/place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
  }
  return null;
}

export default function SellerShopPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: shop, isLoading } = useGetMyShop({ query: { enabled: isAuthenticated, queryKey: getGetMyShopQueryKey() } });
  const createShop = useCreateShop();
  const updateShop = useUpdateShop();

  const [form, setForm] = useState({
    name: "", category: "Provisions", description: "", address: "", phone: "", whatsapp: "", imageUrl: "",
  });
  const [isOpen, setIsOpen] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mapsLink, setMapsLink] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [mapsError, setMapsError] = useState("");

  useEffect(() => {
    if (shop) {
      setForm({
        name: shop.name ?? "",
        category: shop.category ?? "Provisions",
        description: shop.description ?? "",
        address: shop.address ?? "",
        phone: shop.phone ?? "",
        whatsapp: shop.whatsapp ?? "",
        imageUrl: shop.imageUrl ?? "",
      });
      setIsOpen(shop.isOpen ?? true);
      if (shop.lat) setLat(String(shop.lat));
      if (shop.lng) setLng(String(shop.lng));
    }
  }, [shop]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("shopline_token");
      const res = await fetch("/api/uploads/image", { method: "POST", body: fd, headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json();
      setForm(f => ({ ...f, imageUrl: data.url }));
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleParseMapsLink = () => {
    setMapsError("");
    const coords = parseGoogleMapsUrl(mapsLink);
    if (coords) {
      setLat(String(coords.lat));
      setLng(String(coords.lng));
      toast({ title: "Location extracted", description: `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` });
    } else {
      setMapsError("Could not extract coordinates. Try copying the link from Google Maps → Share → Copy link.");
    }
  };

  const handleSave = () => {
    const latNum = lat ? parseFloat(lat) : undefined;
    const lngNum = lng ? parseFloat(lng) : undefined;
    const payload = {
      ...form,
      isOpen,
      ...(latNum !== undefined && lngNum !== undefined ? { lat: latNum, lng: lngNum } : {}),
    };
    if (shop) {
      updateShop.mutate({ data: payload }, {
        onSuccess: () => {
          toast({ title: "Shop updated!" });
          qc.invalidateQueries({ queryKey: getGetMyShopQueryKey() });
        },
        onError: (err: { data?: { error?: string } }) => {
          toast({ title: "Error", description: err?.data?.error ?? "Failed to update", variant: "destructive" });
        },
      });
    } else {
      createShop.mutate({ data: payload }, {
        onSuccess: () => {
          toast({ title: "Shop created!" });
          qc.invalidateQueries({ queryKey: getGetMyShopQueryKey() });
        },
        onError: (err: { data?: { error?: string } }) => {
          toast({ title: "Error", description: err?.data?.error ?? "Failed to create shop", variant: "destructive" });
        },
      });
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/seller">
        <Button variant="ghost" size="sm" className="gap-1 mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Button>
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold">My Shop</h1>
        {shop?.isVerified && (
          <div className="flex items-center gap-1 text-sm text-primary">
            <CheckCircle className="h-4 w-4" />
            Verified
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Shop image */}
          <div>
            <Label className="mb-2 block">Shop Photo</Label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="Shop" className="w-full h-full object-cover" />
                ) : (
                  <Store className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <span><ImagePlus className="h-4 w-4" />{uploading ? "Uploading..." : "Upload Photo"}</span>
                </Button>
              </label>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="mb-1.5 block">Shop Name *</Label>
              <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Abena's Provisions" />
            </div>
            <div>
              <Label className="mb-1.5 block">Category *</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="desc" className="mb-1.5 block">Description</Label>
            <Textarea id="desc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Tell customers about your shop..." rows={3} />
          </div>

          <div>
            <Label htmlFor="address" className="mb-1.5 block">Address</Label>
            <Input id="address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Haatso, Accra" />
          </div>

          {/* Location / Google Maps */}
          <div className="border border-border rounded-xl p-4 space-y-3 bg-card">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <Label className="font-medium">Shop Location (for distance sorting)</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Open your shop in Google Maps, tap Share → Copy link, then paste it below.
            </p>
            <div className="flex gap-2">
              <Input
                value={mapsLink}
                onChange={e => { setMapsLink(e.target.value); setMapsError(""); }}
                placeholder="Paste Google Maps link..."
                className="flex-1 text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleParseMapsLink} disabled={!mapsLink.trim()}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Extract
              </Button>
            </div>
            {mapsError && <p className="text-xs text-destructive">{mapsError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block text-muted-foreground">Latitude</Label>
                <Input value={lat} onChange={e => setLat(e.target.value)} placeholder="5.6037" className="text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block text-muted-foreground">Longitude</Label>
                <Input value={lng} onChange={e => setLng(e.target.value)} placeholder="-0.1870" className="text-sm" />
              </div>
            </div>
            {lat && lng && (
              <a
                href={`https://maps.google.com/?q=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Verify on Google Maps
              </a>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="mb-1.5 block">Phone Number</Label>
              <Input id="phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0244000000" />
            </div>
            <div>
              <Label htmlFor="wa" className="mb-1.5 block">WhatsApp Number</Label>
              <Input id="wa" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="0244000000" />
            </div>
          </div>

          {/* Open/Closed toggle */}
          <div className="flex items-center justify-between border border-border rounded-xl p-4 bg-card">
            <div>
              <div className="font-medium text-sm">Shop Status</div>
              <div className="text-xs text-muted-foreground">{isOpen ? "Customers can see your shop and place orders" : "Your shop is hidden from browse"}</div>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isOpen ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOpen ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <Button onClick={handleSave} disabled={createShop.isPending || updateShop.isPending} className="w-full">
            {createShop.isPending || updateShop.isPending ? "Saving..." : shop ? "Save Changes" : "Create Shop"}
          </Button>

          {shop && (
            <div className="text-center">
              <Link href={`/shops/${shop.id}`}>
                <Button variant="ghost" size="sm" className="text-muted-foreground">View public shop page</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
