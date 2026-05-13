import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Mail, Heart, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("contact_submissions").insert({
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error sending message", description: error.message, variant: "destructive" });
    } else {
      setSubmitted(true);
      toast({ title: "Message sent!", description: "We'll get back to you soon." });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Get In Touch</h1>
            <p className="text-muted-foreground font-body">We'd love to hear from you. Send us a message and we'll respond within 24 hours.</p>
          </motion.div>

          {submitted ? (
            <motion.div className="bg-card border border-border rounded-xl p-10 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Heart className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="font-display text-2xl font-semibold text-foreground mb-2">Thank You</h2>
              <p className="text-muted-foreground font-body">Your message has been received. We'll get back to you at <strong>{form.email}</strong> as soon as possible.</p>
            </motion.div>
          ) : (
            <motion.form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-8 space-y-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-body text-muted-foreground">Your Name</label>
                  <Input placeholder="John Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" required />
                </div>
                <div>
                  <label className="text-xs font-body text-muted-foreground">Email Address</label>
                  <Input type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1" required />
                </div>
              </div>
              <div>
                <label className="text-xs font-body text-muted-foreground">Subject</label>
                <Input placeholder="What is this about?" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="mt-1" required />
              </div>
              <div>
                <label className="text-xs font-body text-muted-foreground">Message</label>
                <Textarea placeholder="Tell us more..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="mt-1 min-h-[140px]" required />
              </div>
              <Button type="submit" variant="hero" className="w-full gap-2" disabled={submitting}>
                <Send className="w-4 h-4" />
                {submitting ? "Sending..." : "Send Message"}
              </Button>
              <p className="text-center text-xs text-muted-foreground font-body">
                Or email us directly at <a href="mailto:info@restdearone.com" className="text-primary hover:underline">info@restdearone.com</a>
              </p>
            </motion.form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
