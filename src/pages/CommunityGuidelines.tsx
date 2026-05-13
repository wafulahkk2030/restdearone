import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const CommunityGuidelines = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Community Guidelines</h1>
            <p className="text-muted-foreground font-body">Respect. Dignity. Compassion.</p>
          </motion.div>

          <div className="bg-card border border-border rounded-xl p-8 space-y-8 font-body text-foreground/85 leading-relaxed text-sm">
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">Our Principles</h2>
              <p>
                RestDearOne is a sacred space for preserving memories and honoring lives. These guidelines ensure
                that every user feels safe, respected, and supported in their journey of remembrance.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">1. Treat Every Memory With Respect</h2>
              <p>
                Memorial pages represent real people who were loved by real families. Never post disrespectful,
                mocking, or insensitive content on any memorial page. Even if you disagree with someone's perspective,
                respond with compassion.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">2. No Hate Speech or Harassment</h2>
              <p>
                Content that promotes hate based on race, ethnicity, religion, gender, sexual orientation, disability,
                or any other characteristic is strictly prohibited. Harassment, bullying, and personal attacks will
                result in immediate account suspension.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">3. Authentic Memorials Only</h2>
              <p>
                Do not create fake memorial pages. Every page must represent a real person who has passed away.
                Creating false memorials or impersonating the deceased is a violation that may result in permanent ban.
                Family disputes over memorial pages should be reported to our support team.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">4. No Spam or Commercial Content</h2>
              <p>
                Memorial pages and communities are not for advertising, self-promotion, or spam. Do not post
                links to unrelated products or services. Community stories should be genuine reflections and memories.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">5. Protect Privacy</h2>
              <p>
                Do not share personal information about living individuals without their consent. This includes
                phone numbers, addresses, financial information, or private photographs. Respect the privacy of
                both the living and the departed.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">6. Story Editing Policy</h2>
              <p>
                To preserve the integrity of shared memories, stories can be edited a maximum of two times after posting.
                This ensures that memories remain authentic and are not distorted over time. Please review your content
                carefully before publishing.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">7. Reporting Content</h2>
              <p>
                If you see content that violates these guidelines, please report it. Our moderation team reviews
                every report carefully. Reports are confidential — the person being reported will not know who
                filed the report.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">8. Consequences</h2>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>First violation:</strong> Warning issued by moderation team</li>
                <li><strong>Second violation:</strong> Temporary account suspension</li>
                <li><strong>Third violation:</strong> Permanent account ban</li>
                <li><strong>Severe violations</strong> (hate speech, fake memorials): Immediate permanent ban</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">9. Community Hosting Responsibilities</h2>
              <p>
                If you host a community (KES 500/month or $5/month), you are responsible for setting a positive tone.
                Community admins should moderate discussions, respond to concerns, and ensure that all members feel welcome.
                Platform administrators reserve the right to deactivate communities that consistently violate guidelines.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">10. Remember Why We're Here</h2>
              <p>
                This platform holds people's grief and memories. Every interaction should be guided by empathy.
                Before posting, ask yourself: "Would I say this to someone who is grieving?"
                If the answer is no, don't post it.
              </p>
            </section>

            <section className="pt-4 border-t border-border">
              <p className="text-muted-foreground">
                Questions about these guidelines? Contact us at{" "}
                <a href="mailto:info@restdearone.com" className="text-primary hover:underline">info@restdearone.com</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CommunityGuidelines;
