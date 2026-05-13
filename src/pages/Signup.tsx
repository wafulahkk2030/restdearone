import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { allCountries } from "@/lib/countries";

const Signup = () => {
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", country: "" });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.username || !form.email || !form.password || !form.country) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signUp(form.email, form.password, {
      username: form.username,
      display_name: form.name,
    });
    if (error) {
      setLoading(false);
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ country: form.country }).eq("id", user.id);
    }
    setLoading(false);
    toast({ title: "Account created!", description: "Welcome to RestDearOne." });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Sign Up — RestDearOne</title>
        <meta name="description" content="Join RestDearOne to create memorial pages, share memories, and connect with a community of remembrance." />
        <link rel="canonical" href="https://restdearone.lovable.app/signup" />
      </Helmet>
      <Navbar />
      <div className="pt-24 pb-16 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Join RestDearOne</h1>
            <p className="text-muted-foreground font-body text-sm">Create an account to preserve the stories that matter.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="font-body text-sm">Display Name</Label>
              <Input id="name" placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="username" className="font-body text-sm">Username</Label>
              <Input id="username" placeholder="Choose a username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email" className="font-body text-sm">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password" className="font-body text-sm">Password</Label>
              <Input id="password" type="password" placeholder="Create a password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="country" className="font-body text-sm">Country</Label>
              <select
                id="country"
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-body ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Select your country</option>
                {allCountries.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>

            <Button type="submit" className="w-full" variant="hero" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground font-body mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
