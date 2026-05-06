import { useState, useEffect } from "react";

export interface CartItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  shopId: number;
}

const CART_KEY = "shopline_cart";

export function getCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}

export function addToCart(item: CartItem) {
  const cart = getCart();
  const existing = cart.find(i => i.productId === item.productId);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  saveCart(cart);
  window.dispatchEvent(new Event("cart-updated"));
}

export function removeFromCart(productId: number) {
  const cart = getCart().filter(i => i.productId !== productId);
  saveCart(cart);
  window.dispatchEvent(new Event("cart-updated"));
}

export function updateCartQuantity(productId: number, quantity: number) {
  const cart = getCart().map(i => i.productId === productId ? { ...i, quantity } : i).filter(i => i.quantity > 0);
  saveCart(cart);
  window.dispatchEvent(new Event("cart-updated"));
}

export function useCartCount() {
  const [count, setCount] = useState(() => getCart().reduce((s, i) => s + i.quantity, 0));
  useEffect(() => {
    const update = () => setCount(getCart().reduce((s, i) => s + i.quantity, 0));
    window.addEventListener("cart-updated", update);
    return () => window.removeEventListener("cart-updated", update);
  }, []);
  return count;
}
