import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SubmitNationalLegend = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ full_name: "", title: "", birth_year: "", death_year: "", date_of_death: "", cause_of_death: "", location: "", national_impact_summary: "", biography: "" });
  const [submitting, setSubmitting] = useState(false);

  if (!user) { navigate("/login"); return null; }

  const submit = async () => {
    if (!form.full_name || !form.death_year || !form.national_impact_summary) {
      toast({ title: "Name, year of death, and impact summary are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("national_legends").insert({
      submitted_by: user.id,
      full_name: form.full_name.trim(),
      title: form.title.trim() || null,
      birth_year: form.birth_year ? parseInt(form.birth_year) : null,
      death_year: parseInt(form.death_year),
      date_of_death: form.date_of_death || null,
      cause_of_death: form.cause_of_death || null,
      location: form.location || null,
      national_impact_summary: form.national_impact_summary,
      biography: form.biography || null,
      status: "pending",
    });
    setSubmitting(false);
    if (error) { toast({ title: "Submission failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Submitted for review", description: "An admin will review and publish soon." });
    navigate("/national-legends");
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Submit a National Legend — RestDearOne</title></Helmet>
      <Navbar />
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Submit a National Legend</h1>
          <p className="text-sm text-muted-foreground font-body mt-2">Admin will review and publish. Custom amounts and badges are set after approval.</p>
          <div className="space-y-4 mt-8">
            <Input placeholder="Full name *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <Input placeholder="Title or role (e.g. Activist, Olympian)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Birth year" type="number" value={form.birth_year} onChange={(e) => setForm({ ...form, birth_year: e.target.value })} />
              <Input placeholder="Death year *" type="number" value={form.death_year} onChange={(e) => setForm({ ...form, death_year: e.target.value })} />
            </div>
            <Input placeholder="Date of death" type="date" value={form.date_of_death} onChange={(e) => setForm({ ...form, date_of_death: e.target.value })} />
            <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <Input placeholder="Cause of death" value={form.cause_of_death} onChange={(e) => setForm({ ...form, cause_of_death: e.target.value })} />
            <Textarea placeholder="National impact summary *" rows={4} value={form.national_impact_summary} onChange={(e) => setForm({ ...form, national_impact_summary: e.target.value })} />
            <Textarea placeholder="Biography" rows={6} value={form.biography} onChange={(e) => setForm({ ...form, biography: e.target.value })} />
            <Button variant="hero" className="w-full" onClick={submit} disabled={submitting}>{submitting ? "Submitting…" : "Submit for Admin Review"}</Button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default SubmitNationalLegend;