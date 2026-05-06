import { Link, useLocation } from "wouter";
import { ShoppingCart, Store, User, Menu, X, ChevronRight, LogOut, ChevronDown, Shield } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCartCount } from "@/lib/cart";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const cartCount = useCartCount();
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isSeller = user?.activeRole === "seller";
  const isAdmin = (user as { isAdmin?: boolean } | undefined)?.isAdmin;

  const handleLogout = () => {
    logout();
    setLocation("/");
    setMenuOpen(false);
    setUserMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-serif text-xl font-bold text-primary">
          <Store className="h-6 w-6" />
          <span>Shopline</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {!isSeller && (
                <Link href="/">
                  <Button variant="ghost" size="sm">Browse Shops</Button>
                </Link>
              )}
              {isSeller && (
                <Link href="/seller">
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
              )}
              <Link href="/orders">
                <Button variant="ghost" size="sm">My Orders</Button>
              </Link>
              {!isSeller && (
                <Link href="/cart" className="relative">
                  <Button variant="ghost" size="sm" className="relative">
                    <ShoppingCart className="h-4 w-4" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
              )}

              {/* User dropdown */}
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center">
                    {isAdmin ? <Shield className="h-3.5 w-3.5 text-primary" /> : <User className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <span>{user.name.split(" ")[0]}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-3 py-2 border-b border-border">
                      <div className="text-xs font-semibold truncate">{user.name}</div>
                      <div className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                        {isAdmin && <Shield className="h-3 w-3 text-primary" />}
                        {isAdmin ? "Admin" : `${user.activeRole} mode`}
                      </div>
                    </div>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setUserMenuOpen(false)}>
                        <div className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors cursor-pointer text-primary font-medium">
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </div>
                      </Link>
                    )}
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)}>
                      <div className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors cursor-pointer">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Profile & Settings
                      </div>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated && !isSeller && (
            <Link href="/cart" className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-1">
          {isAuthenticated ? (
            <>
              <div className="px-3 py-2 mb-1">
                <div className="text-sm font-semibold">{user.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{isAdmin ? "Admin" : `${user.activeRole} mode`}</div>
              </div>
              {!isSeller && <Link href="/" onClick={() => setMenuOpen(false)}><MobileNavItem>Browse Shops</MobileNavItem></Link>}
              {isSeller && <Link href="/seller" onClick={() => setMenuOpen(false)}><MobileNavItem>Dashboard</MobileNavItem></Link>}
              <Link href="/orders" onClick={() => setMenuOpen(false)}><MobileNavItem>My Orders</MobileNavItem></Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)}>
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer text-sm font-medium text-primary">
                    <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Admin Panel</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </Link>
              )}
              <Link href="/profile" onClick={() => setMenuOpen(false)}><MobileNavItem>Profile & Settings</MobileNavItem></Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-left w-full px-3 py-2.5 text-sm text-destructive rounded-lg hover:bg-destructive/5 transition-colors mt-1 border-t border-border pt-3"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)}><MobileNavItem>Sign In</MobileNavItem></Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}>
                <Button className="w-full mt-1" size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

function MobileNavItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted transition-colors cursor-pointer text-sm font-medium">
      {children}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
