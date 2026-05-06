import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetShop, getGetShopQueryKey, useListShopProducts, getListShopProductsQueryKey, useGetShopReviews, getGetShopReviewsQueryKey, useCreateReview } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Store, MapPin, Phone, MessageCircle, CheckCircle, Star, ShoppingCart, Plus, Minus, ArrowLeft } from "lucide-react";
import { addToCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

const STOCK_STYLES: Record<string, { label: string; className: string }> = {
  in_stock: { label: "In Stock", className: "bg-green-100 text-green-700 border-green-200" },
  low_stock: { label: "Low Stock", className: "bg-amber-100 text-amber-700 border-amber-200" },
  out_of_stock: { label: "Out of Stock", className: "bg-red-100 text-red-600 border-red-200" },
};

export default function ShopDetailPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const id = Number(shopId);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: shop, isLoading: shopLoading } = useGetShop(id, { query: { enabled: !!id, queryKey: getGetShopQueryKey(id) } });
  const { data: products } = useListShopProducts(id, { query: { enabled: !!id, queryKey: getListShopProductsQueryKey(id) } });
  const { data: reviews } = useGetShopReviews(id, { query: { enabled: !!id, queryKey: getGetShopReviewsQueryKey(id) } });
  const reviewMutation = useCreateReview();

  if (shopLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-muted rounded-2xl" />
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!shop) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h2 className="font-serif text-2xl font-bold">Shop not found</h2>
      <Link href="/"><Button variant="outline" className="mt-4">Back to shops</Button></Link>
    </div>
  );

  const handleAddToCart = (product: { id: number; name: string; price: string; imageUrl?: string | null }) => {
    const qty = quantities[product.id] ?? 1;
    addToCart({
      productId: product.id,
      productName: product.name,
      price: parseFloat(product.price),
      quantity: qty,
      imageUrl: product.imageUrl,
      shopId: id,
    });
    toast({ title: "Added to cart", description: `${qty}x ${product.name}` });
  };

  const setQty = (productId: number, delta: number) => {
    setQuantities(prev => ({ ...prev, [productId]: Math.max(1, (prev[productId] ?? 1) + delta) }));
  };

  const submitReview = () => {
    reviewMutation.mutate({ data: { shopId: id, rating: reviewForm.rating, comment: reviewForm.comment } }, {
      onSuccess: () => {
        toast({ title: "Review submitted!" });
        setShowReviewForm(false);
        setReviewForm({ rating: 5, comment: "" });
        qc.invalidateQueries({ queryKey: getGetShopReviewsQueryKey(id) });
      },
      onError: (err: { data?: { error?: string } }) => {
        toast({ title: "Error", description: err?.data?.error ?? "Could not submit review", variant: "destructive" });
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-1 mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back to shops
        </Button>
      </Link>

      {/* Shop header */}
      <div className="border border-border rounded-2xl bg-card overflow-hidden mb-8">
        <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary/30 flex items-center justify-center">
          {shop.imageUrl ? (
            <img src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover" />
          ) : (
            <Store className="h-16 w-16 text-primary/40" />
          )}
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-serif text-2xl font-bold">{shop.name}</h1>
                {shop.isVerified && <CheckCircle className="h-5 w-5 text-primary" />}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">{shop.category}</Badge>
                <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                  shop.isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${shop.isOpen ? "bg-green-500" : "bg-gray-400"}`} />
                  {shop.isOpen ? "Open now" : "Closed"}
                </div>
                {shop.averageRating && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {Number(shop.averageRating).toFixed(1)} ({shop.reviewCount} reviews)
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {shop.phone && (
                <a href={`tel:${shop.phone}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Phone className="h-4 w-4" /> Call
                  </Button>
                </a>
              )}
              {shop.whatsapp && (
                <a href={`https://wa.me/${shop.whatsapp}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1 border-green-300 text-green-700 hover:bg-green-50">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </Button>
                </a>
              )}
            </div>
          </div>
          {shop.description && <p className="text-muted-foreground text-sm leading-relaxed mb-3">{shop.description}</p>}
          {shop.address && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              {shop.address}
            </div>
          )}
        </div>
      </div>

      {/* Products */}
      <div className="mb-10">
        <h2 className="font-serif text-xl font-bold mb-4">Products</h2>
        {!products || products.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-xl text-muted-foreground text-sm">
            No products listed yet.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {products.map(product => {
              const stock = STOCK_STYLES[product.stockStatus] ?? STOCK_STYLES.out_of_stock;
              const qty = quantities[product.id] ?? 1;
              const unavailable = product.stockStatus === "out_of_stock";
              return (
                <div key={product.id} className={`border border-border rounded-xl bg-card overflow-hidden flex flex-col ${unavailable ? "opacity-60" : ""}`}>
                  <div className="h-28 bg-gradient-to-br from-secondary/20 to-muted flex items-center justify-center relative">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
                    )}
                    <Badge className={`absolute top-2 right-2 text-xs border ${stock.className}`} variant="outline">
                      {stock.label}
                    </Badge>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="font-semibold text-sm mb-0.5">{product.name}</div>
                    {product.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.description}</p>}
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <span className="font-bold text-primary">GHS {parseFloat(product.price).toFixed(2)}</span>
                      {!unavailable && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-border rounded-lg overflow-hidden">
                            <button className="px-2 py-1 hover:bg-muted transition-colors" onClick={() => setQty(product.id, -1)}>
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2 text-sm font-medium min-w-[28px] text-center">{qty}</span>
                            <button className="px-2 py-1 hover:bg-muted transition-colors" onClick={() => setQty(product.id, 1)}>
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <Button size="sm" onClick={() => handleAddToCart(product)}>
                            Add
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reviews */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold">Reviews</h2>
          {isAuthenticated && !showReviewForm && (
            <Button variant="outline" size="sm" onClick={() => setShowReviewForm(true)}>Write a review</Button>
          )}
        </div>

        {showReviewForm && (
          <div className="border border-border rounded-xl bg-card p-4 mb-4">
            <div className="mb-3">
              <label className="text-sm font-medium mb-1 block">Rating</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setReviewForm(f => ({ ...f, rating: n }))}>
                    <Star className={`h-6 w-6 ${n <= reviewForm.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
            <Input
              placeholder="Share your experience..."
              value={reviewForm.comment}
              onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
              className="mb-3"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={submitReview} disabled={reviewMutation.isPending}>Submit</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowReviewForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {reviews && reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map(review => (
              <div key={review.id} className="border border-border rounded-xl bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} className={`h-3.5 w-3.5 ${n <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && <p className="text-sm text-foreground">{review.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm border border-border rounded-xl">
            No reviews yet. Be the first to review this shop.
          </div>
        )}
      </div>
    </div>
  );
}
