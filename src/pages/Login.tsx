import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Will connect to Supabase
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground font-body text-sm">Sign in to continue remembering.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="font-body text-sm">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password" className="font-body text-sm">Password</Label>
              <Input id="password" type="password" placeholder="Your password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="mt-1" />
            </div>

            <Button type="submit" className="w-full" variant="hero">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground font-body mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
