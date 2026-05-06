import { useState } from "react";
import { Link } from "wouter";
import {
  useGetMyShop, getGetMyShopQueryKey,
  useListShopProducts, getListShopProductsQueryKey,
  useCreateProduct, useUpdateProduct, useDeleteProduct,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ArrowLeft, ImagePlus, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

const STOCK_STYLES: Record<string, { label: string; className: string }> = {
  in_stock: { label: "In Stock", className: "bg-green-100 text-green-700 border-green-200" },
  low_stock: { label: "Low Stock", className: "bg-amber-100 text-amber-700 border-amber-200" },
  out_of_stock: { label: "Out of Stock", className: "bg-red-100 text-red-600 border-red-200" },
};

interface ProductForm {
  name: string; category: string; description: string; price: string; stockStatus: StockStatus; stockQuantity: string; imageUrl: string;
}

const EMPTY_FORM: ProductForm = { name: "", category: "", description: "", price: "", stockStatus: "in_stock", stockQuantity: "", imageUrl: "" };

export default function SellerProductsPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: shop } = useGetMyShop({ query: { enabled: isAuthenticated, queryKey: getGetMyShopQueryKey() } });
  const { data: products, isLoading } = useListShopProducts(shop?.id ?? 0, {
    query: { enabled: !!shop?.id, queryKey: getListShopProductsQueryKey(shop?.id ?? 0) },
  });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);

  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (p: NonNullable<typeof products>[number]) => {
    setEditId(p.id);
    setForm({
      name: p.name, category: p.category ?? "", description: p.description ?? "",
      price: p.price, stockStatus: p.stockStatus as StockStatus,
      stockQuantity: String(p.stockQuantity ?? ""), imageUrl: p.imageUrl ?? "",
    });
    setDialogOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSave = () => {
    if (!shop?.id) return;
    const data = { ...form, shopId: shop.id, price: String(form.price), stockQuantity: form.stockQuantity ? Number(form.stockQuantity) : undefined };
    if (editId) {
      updateProduct.mutate({ id: editId, data }, {
        onSuccess: () => { toast({ title: "Product updated" }); setDialogOpen(false); qc.invalidateQueries({ queryKey: getListShopProductsQueryKey(shop.id) }); },
        onError: (err: { data?: { error?: string } }) => toast({ title: "Error", description: err?.data?.error ?? "Failed", variant: "destructive" }),
      });
    } else {
      createProduct.mutate({ data }, {
        onSuccess: () => { toast({ title: "Product added" }); setDialogOpen(false); qc.invalidateQueries({ queryKey: getListShopProductsQueryKey(shop.id) }); },
        onError: (err: { data?: { error?: string } }) => toast({ title: "Error", description: err?.data?.error ?? "Failed", variant: "destructive" }),
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this product?")) return;
    deleteProduct.mutate({ id }, {
      onSuccess: () => { toast({ title: "Deleted" }); if (shop?.id) qc.invalidateQueries({ queryKey: getListShopProductsQueryKey(shop.id) }); },
    });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/seller">
        <Button variant="ghost" size="sm" className="gap-1 mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Button>
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold">Products</h1>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {!shop ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Set up your shop first before adding products.</p>
          <Link href="/seller/shop"><Button>Set Up Shop</Button></Link>
        </div>
      ) : isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {products.map(p => {
            const stock = STOCK_STYLES[p.stockStatus] ?? STOCK_STYLES.out_of_stock;
            return (
              <div key={p.id} className="border border-border rounded-xl bg-card overflow-hidden flex">
                <div className="w-20 h-full bg-muted flex items-center justify-center flex-shrink-0">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="h-7 w-7 text-muted-foreground/30" />
                  )}
                </div>
                <div className="p-3 flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{p.name}</div>
                  <div className="text-xs text-primary font-semibold mt-0.5">GHS {parseFloat(p.price).toFixed(2)}</div>
                  <div className="flex items-center justify-between mt-2">
                    <Badge className={`text-xs border ${stock.className}`} variant="outline">{stock.label}</Badge>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No products yet. Add your first product.</p>
          <Button onClick={openCreate} className="gap-1.5"><Plus className="h-4 w-4" /> Add Product</Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{editId ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Image */}
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {form.imageUrl ? <img src={form.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package className="h-6 w-6 text-muted-foreground/40" />}
              </div>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                <Button variant="outline" size="sm" asChild>
                  <span><ImagePlus className="h-3.5 w-3.5 mr-1.5" />{uploading ? "Uploading..." : "Photo"}</span>
                </Button>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="mb-1 block text-xs">Product Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Milo 400g" />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Category</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Beverages" />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Price (GHS) *</Label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Stock Status</Label>
                <Select value={form.stockStatus} onValueChange={v => setForm(f => ({ ...f, stockStatus: v as StockStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Quantity</Label>
                <Input type="number" value={form.stockQuantity} onChange={e => setForm(f => ({ ...f, stockQuantity: e.target.value }))} placeholder="0" />
              </div>
              <div className="col-span-2">
                <Label className="mb-1 block text-xs">Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Brief description..." />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} className="flex-1" disabled={createProduct.isPending || updateProduct.isPending}>
                {createProduct.isPending || updateProduct.isPending ? "Saving..." : "Save Product"}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
