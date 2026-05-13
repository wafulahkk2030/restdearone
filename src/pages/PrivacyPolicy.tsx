import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Privacy Policy — RestDearOne</title>
        <meta name="description" content="Read the RestDearOne privacy policy to understand how we protect your data and memories." />
        <link rel="canonical" href="https://restdearone.lovable.app/privacy" />
      </Helmet>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Privacy Policy</h1>
            <p className="text-muted-foreground font-body text-sm">Last updated: March 2026</p>
          </motion.div>

          <div className="bg-card border border-border rounded-xl p-8 space-y-8 font-body text-foreground/85 leading-relaxed text-sm">
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">1. Information We Collect</h2>
              <p className="mb-2">When you use RestDearOne, we collect:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Account Information:</strong> Name, email address, username, country, and city during registration.</li>
                <li><strong>Memorial Content:</strong> Stories, reflections, letters, and other content you share on memorial pages.</li>
                <li><strong>Payment Information:</strong> Payment details processed securely through Paystack. We do not store card numbers.</li>
                <li><strong>Usage Data:</strong> Interaction data including pages viewed, stories read, and community participation to improve your experience.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>To create and manage your account and memorial pages</li>
                <li>To process payments for page activations and community hosting</li>
                <li>To send memory prompts and anniversary reminders</li>
                <li>To moderate content and ensure community safety using AI-assisted tools</li>
                <li>To generate AI-powered features such as keyword clouds, story highlights, and life timelines</li>
                <li>To provide analytics for community administrators</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">3. Content Moderation</h2>
              <p>
                We use automated AI tools to detect harmful, abusive, or spam content. Flagged content is reviewed by our moderation team.
                We do not edit personal memories — we only remove content that violates our community guidelines.
                Flagged content is visible only to platform administrators and is never shared publicly.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">4. Data Sharing</h2>
              <p>
                We do not sell your personal data to third parties. We share data only with:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Paystack:</strong> For secure payment processing</li>
                <li><strong>Supabase:</strong> For database hosting and authentication</li>
                <li><strong>AI Services:</strong> For content analysis (no personal identifiers are shared with AI models)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">5. Data Security</h2>
              <p>
                We implement industry-standard security measures including encrypted connections (HTTPS),
                row-level security policies on all database tables, and role-based access control.
                Sensitive information such as email addresses is not exposed in public profiles.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">6. Your Rights</h2>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>You can update or delete your account at any time</li>
                <li>You can edit your stories up to two times to preserve memory integrity</li>
                <li>You can request a copy of your data by contacting us</li>
                <li>You can request deletion of memorial pages you created</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">7. Cookies</h2>
              <p>We use essential cookies for authentication and session management. We do not use tracking cookies for advertising purposes.</p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">8. Children's Privacy</h2>
              <p>RestDearOne is not intended for users under 13 years of age. We do not knowingly collect information from children.</p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">9. Contact</h2>
              <p>For privacy-related inquiries, contact us at <a href="mailto:info@restdearone.com" className="text-primary hover:underline">info@restdearone.com</a>.</p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
