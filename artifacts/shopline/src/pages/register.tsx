import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useSearch } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Store, ShoppingBag, User, Phone, Lock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  phone: z.string().min(10, "Enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["buyer", "seller"]),
});

export default function RegisterPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const defaultRole = (params.get("role") as "buyer" | "seller") ?? "buyer";
  const { toast } = useToast();
  const registerMutation = useRegister();
  const [selectedRole, setSelectedRole] = useState<"buyer" | "seller">(defaultRole);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", password: "", role: defaultRole },
  });

  const handleRoleSelect = (role: "buyer" | "seller") => {
    setSelectedRole(role);
    form.setValue("role", role);
  };

  const onSubmit = (values: z.infer<typeof schema>) => {
    registerMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data.token);
        setLocation(data.user.activeRole === "seller" ? "/seller" : "/");
      },
      onError: (err: { data?: { error?: string } }) => {
        toast({ title: "Registration failed", description: err?.data?.error ?? "Something went wrong", variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
            <Store className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-bold">Join Shopline</h1>
          <p className="text-muted-foreground mt-2 text-sm">Create your free account</p>
        </div>

        {/* Role selection */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            data-testid="role-buyer"
            onClick={() => handleRoleSelect("buyer")}
            className={`border-2 rounded-xl p-4 text-left transition-all ${
              selectedRole === "buyer" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <ShoppingBag className={`h-6 w-6 mb-2 ${selectedRole === "buyer" ? "text-primary" : "text-muted-foreground"}`} />
            <div className="font-semibold text-sm">I want to buy</div>
            <div className="text-xs text-muted-foreground mt-1">Browse shops and place orders</div>
            {selectedRole === "buyer" && <CheckCircle className="h-4 w-4 text-primary mt-2" />}
          </button>
          <button
            type="button"
            data-testid="role-seller"
            onClick={() => handleRoleSelect("seller")}
            className={`border-2 rounded-xl p-4 text-left transition-all ${
              selectedRole === "seller" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <Store className={`h-6 w-6 mb-2 ${selectedRole === "seller" ? "text-primary" : "text-muted-foreground"}`} />
            <div className="font-semibold text-sm">I have a shop</div>
            <div className="text-xs text-muted-foreground mt-1">List products and receive orders</div>
            {selectedRole === "seller" && <CheckCircle className="h-4 w-4 text-primary mt-2" />}
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input data-testid="input-name" className="pl-9" placeholder="Kwame Mensah" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input data-testid="input-phone" className="pl-9" placeholder="0244000000" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input data-testid="input-password" type="password" className="pl-9" placeholder="Min 6 characters" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button data-testid="button-register" type="submit" className="w-full" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Creating account..." : `Create ${selectedRole === "seller" ? "Seller" : "Buyer"} Account`}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
