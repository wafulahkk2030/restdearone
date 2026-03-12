import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const relationships = [
  "Father", "Mother", "Brother", "Sister", "Friend",
  "Colleague", "Teacher", "Partner", "Mentor", "Spouse", "Other"
];

const CreateMemorial = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "",
    birthYear: "",
    deathYear: "",
    relationship: "",
    personality: "",
    unforgettableMoment: "",
    commonPhrase: "",
    lifeLesson: "",
    whatToRemember: "",
  });

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Create a Memory Page</h1>
            <p className="text-muted-foreground font-body text-sm">
              Tell us about the person you want to remember. Every detail helps keep their story alive.
            </p>
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
                  <Input placeholder="e.g. 1989" value={form.birthYear} onChange={e => update("birthYear", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="font-body text-sm">Death Year</Label>
                  <Input placeholder="e.g. 2023" value={form.deathYear} onChange={e => update("deathYear", e.target.value)} className="mt-1" />
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
              </div>
              <div className="flex justify-end pt-4">
                <Button variant="hero" onClick={() => setStep(2)}>Continue</Button>
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
                <Button variant="hero" onClick={() => { /* Will submit to Supabase */ }}>
                  Create Memory Page
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateMemorial;
