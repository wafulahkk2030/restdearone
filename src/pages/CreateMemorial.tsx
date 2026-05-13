import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DuplicateMemorialDialog from "@/components/memorial/DuplicateMemorialDialog";

const relationships = [
  "Father", "Mother", "Brother", "Sister", "Friend",
  "Colleague", "Teacher", "Partner", "Mentor", "Spouse", "Other"
];

const CreateMemorial = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    birthYear: "",
    deathYear: "",
    relationship: "",
    customRelationship: "",
    personality: "",
    unforgettableMoment: "",
    commonPhrase: "",
    lifeLesson: "",
    whatToRemember: "",
  });
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{ required: boolean; amount: number; freeRemaining: number } | null>(null);

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  // Check how many free memorials user has left and calculate payment
  const checkMemorialLimits = async () => {
    if (!user) return null;
    const { count } = await supabase.from("memorial_pages").select("id", { count: "exact", head: true }).eq("created_by", user.id);
    const totalCreated = count || 0;
    
    // Every 3rd memorial costs money. Pattern: 2 free, 1 paid, 2 free, 1 paid...
    // Group of 3: positions 0,1 are free, position 2 is paid
    const positionInGroup = totalCreated % 3; // 0, 1, 2
    const groupNumber = Math.floor(totalCreated / 3); // 0, 1, 2, ...
    
    if (positionInGroup === 2) {
      // This is the 3rd in the group - payment required
      const amount = 250 + (groupNumber * 250); // 250, 500, 750...
      return { required: true, amount, freeRemaining: 0 };
    } else {
      const freeRemaining = 2 - positionInGroup;
      const nextPaymentAmount = 250 + (groupNumber * 250);
      return { required: false, amount: nextPaymentAmount, freeRemaining };
    }
  };

  const handleContinueToStep2 = async () => {
    if (!form.fullName || !form.birthYear || !form.deathYear || !form.relationship) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (form.relationship === "Other" && !form.customRelationship.trim()) {
      toast({ title: "Please specify the relationship", variant: "destructive" });
      return;
    }

    // Check for duplicates
    const { data: matches } = await supabase
      .from("memorial_pages")
      .select("id, full_name, birth_year, death_year, relationship_to_creator")
      .ilike("full_name", `%${form.fullName.trim()}%`)
      .limit(10);

    if (matches && matches.length > 0) {
      setDuplicateMatches(matches);
      setShowDuplicateDialog(true);
      return;
    }

    // Check payment limits
    const limits = await checkMemorialLimits();
    setPaymentInfo(limits);
    setStep(2);
  };

  const handleDuplicateConfirmNew = async () => {
    setShowDuplicateDialog(false);
    const limits = await checkMemorialLimits();
    setPaymentInfo(limits);
    setStep(2);
  };

  const handleSelectExisting = (id: string) => {
    setShowDuplicateDialog(false);
    navigate(`/memorial/${id}`);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Please sign in first", variant: "destructive" });
      navigate("/login");
      return;
    }
    if (!form.fullName || !form.birthYear || !form.deathYear || !form.relationship) {
      toast({ title: "Please fill in the required fields", variant: "destructive" });
      return;
    }

    const relationship = form.relationship === "Other"
      ? form.customRelationship.trim().toLowerCase()
      : form.relationship.toLowerCase();

    // Re-check limits to prevent bypass
    const limits = await checkMemorialLimits();

    setLoading(true);
    
    if (limits?.required) {
      // Need to pay first - create memorial as inactive, then redirect to payment
      const { data, error } = await supabase.from("memorial_pages").insert({
        created_by: user.id,
        full_name: form.fullName,
        birth_year: parseInt(form.birthYear),
        death_year: parseInt(form.deathYear),
        relationship_to_creator: relationship,
        personality_summary: form.personality || null,
        unforgettable_moment: form.unforgettableMoment || null,
        common_phrase: form.commonPhrase || null,
        life_lesson: form.lifeLesson || null,
        what_to_remember: form.whatToRemember || null,
        status: "inactive" as any,
      }).select().single();
      
      setLoading(false);
      if (error) {
        toast({ title: "Error creating page", description: error.message, variant: "destructive" });
        return;
      }

      // Initialize payment for the memorial creation fee
      try {
        const { data: payData, error: payError } = await supabase.functions.invoke("initialize-payment", {
          body: { type: "memorial_creation", memorial_id: data.id, amount: limits.amount },
        });
        if (payError) throw payError;
        if (payData?.authorization_url) {
          window.location.href = payData.authorization_url;
          return;
        }
      } catch (err: any) {
        toast({ title: "Page created but payment required", description: `Go to the memorial page to complete payment of KES ${limits.amount}.`, variant: "destructive" });
      }
      navigate(`/memorial/${data.id}`);
    } else {
      // Free creation
      const { data, error } = await supabase.from("memorial_pages").insert({
        created_by: user.id,
        full_name: form.fullName,
        birth_year: parseInt(form.birthYear),
        death_year: parseInt(form.deathYear),
        relationship_to_creator: relationship,
        personality_summary: form.personality || null,
        unforgettable_moment: form.unforgettableMoment || null,
        common_phrase: form.commonPhrase || null,
        life_lesson: form.lifeLesson || null,
        what_to_remember: form.whatToRemember || null,
      }).select().single();
      setLoading(false);
      if (error) {
        toast({ title: "Error creating page", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Memory Page Created!", description: `Now activate ${form.fullName}'s page with a one-time payment of KES 100.` });
        navigate(`/memorial/${data.id}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Create a Memory Page — RestDearOne</title>
        <meta name="description" content="Create a living memorial page to preserve the story, lessons, and memories of someone you love." />
        <link rel="canonical" href="https://restdearone.lovable.app/create-memorial" />
      </Helmet>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Create a Memory Page</h1>
            <p className="text-muted-foreground font-body text-sm">
              Tell us about the person you want to remember. Every detail helps keep their story alive.
            </p>
            {!user && (
              <p className="text-destructive font-body text-sm mt-2">
                You need to <a href="/signup" className="underline font-medium">create an account</a> first.
              </p>
            )}
            {paymentInfo && (
              <div className="mt-3 p-3 rounded-lg bg-accent/50 border border-border">
                {paymentInfo.required ? (
                  <p className="text-sm font-body text-foreground">
                    ⚠️ This is your 3rd memorial in this cycle. A fee of <span className="font-semibold">KES {paymentInfo.amount}</span> is required.
                    After this, you can create 2 more for free.
                  </p>
                ) : (
                  <p className="text-sm font-body text-muted-foreground">
                    ✅ This page is free. You have <span className="font-semibold">{paymentInfo.freeRemaining}</span> free page{paymentInfo.freeRemaining !== 1 ? "s" : ""} remaining before a fee of KES {paymentInfo.amount} applies.
                  </p>
                )}
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mt-6">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-2 rounded-full transition-all ${s === step ? "w-12 bg-primary" : s < step ? "w-8 bg-sage" : "w-8 bg-border"}`} />
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <Label className="font-body text-sm">Full Name of the Person</Label>
                <Input placeholder="e.g. Brian Kisiangani" value={form.fullName} onChange={e => update("fullName", e.target.value)} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-body text-sm">Birth Year</Label>
                  <Input placeholder="e.g. 1989" type="number" value={form.birthYear} onChange={e => update("birthYear", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="font-body text-sm">Death Year</Label>
                  <Input placeholder="e.g. 2023" type="number" value={form.deathYear} onChange={e => update("deathYear", e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="font-body text-sm mb-2 block">Who was this person to you?</Label>
                <div className="flex flex-wrap gap-2">
                  {relationships.map(r => (
                    <button
                      key={r}
                      onClick={() => update("relationship", r)}
                      className={`px-4 py-2 rounded-lg text-sm font-body border transition-all ${
                        form.relationship === r
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {form.relationship === "Other" && (
                  <div className="mt-3">
                    <Label className="font-body text-sm">Please specify the relationship</Label>
                    <Input
                      placeholder="e.g. Godfather, Neighbor, Uncle..."
                      value={form.customRelationship}
                      onChange={e => update("customRelationship", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-4">
                <Button variant="hero" onClick={handleContinueToStep2}>Continue</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <Label className="font-body text-sm">What was their personality like?</Label>
                <Textarea placeholder="Describe them in your own words..." value={form.personality} onChange={e => update("personality", e.target.value)} className="mt-1 min-h-[100px]" />
              </div>
              <div>
                <Label className="font-body text-sm">What is a moment you will never forget?</Label>
                <Textarea placeholder="Share a memory that stays with you..." value={form.unforgettableMoment} onChange={e => update("unforgettableMoment", e.target.value)} className="mt-1 min-h-[100px]" />
              </div>
              <div>
                <Label className="font-body text-sm">What is something they used to say often?</Label>
                <Input placeholder="A phrase or saying..." value={form.commonPhrase} onChange={e => update("commonPhrase", e.target.value)} className="mt-1" />
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button variant="hero" onClick={() => setStep(3)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <Label className="font-body text-sm">What lesson did they teach you?</Label>
                <Textarea placeholder="The most important thing they taught you..." value={form.lifeLesson} onChange={e => update("lifeLesson", e.target.value)} className="mt-1 min-h-[100px]" />
              </div>
              <div>
                <Label className="font-body text-sm">What would they want people to remember about them?</Label>
                <Textarea placeholder="Their legacy in your words..." value={form.whatToRemember} onChange={e => update("whatToRemember", e.target.value)} className="mt-1 min-h-[100px]" />
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button variant="hero" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Creating..." : paymentInfo?.required ? `Create & Pay KES ${paymentInfo.amount}` : "Create Memory Page"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DuplicateMemorialDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        matches={duplicateMatches}
        onConfirmNew={handleDuplicateConfirmNew}
        onSelectExisting={handleSelectExisting}
      />
    </div>
  );
};

export default CreateMemorial;
