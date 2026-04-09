import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Heart, Users, BookOpen, Globe, Shield, Sparkles } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">About RestDearOne</h1>
            <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto leading-relaxed">
              Every life leaves a story. We exist to ensure those stories are never lost.
            </p>
          </motion.div>

          {/* Mission */}
          <motion.section className="mb-16" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">Our Mission</h2>
            <div className="bg-card border border-border rounded-xl p-8 space-y-4 font-body text-foreground/85 leading-relaxed">
              <p>
                RestDearOne was born from a simple but powerful belief: every person who has ever lived deserves to be remembered. Not just by the dates on a headstone, but through the stories, lessons, laughter, and love they shared with the world.
              </p>
              <p>
                We are a digital memorial platform that empowers families, friends, and communities to preserve and celebrate the lives of those who have passed on. We believe that grief is not the end of a relationship — it is a transformation of it. Through storytelling, shared memories, and community connection, we help people navigate that transformation with dignity, purpose, and hope.
              </p>
              <p>
                Our platform is not a graveyard. It is a living library of human experience — a place where the wisdom, humor, kindness, and courage of departed loved ones continue to inspire and teach.
              </p>
            </div>
          </motion.section>

          {/* Why We Built This */}
          <motion.section className="mb-16" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">Why We Built This</h2>
            <div className="bg-card border border-border rounded-xl p-8 space-y-4 font-body text-foreground/85 leading-relaxed">
              <p>
                In many cultures around the world, the stories of the departed are passed down through oral tradition — at funerals, around dinner tables, during late-night conversations. But as generations move apart, as families scatter across cities and continents, those stories fade. The lessons are lost. The voices are forgotten.
              </p>
              <p>
                We built RestDearOne to bridge that gap. To give every family a place where memories can be written, preserved, and shared — across borders, across generations.
              </p>
              <p>
                We started in Kenya, where community and memory are deeply intertwined with identity. But the need is universal. Whether you are in Nairobi, New York, Lagos, or London — the desire to hold onto the people who shaped us is a deeply human one.
              </p>
              <p>
                We believe that a mother's advice should not die with her. That a teacher's kindness should be remembered by more than just one student. That a friend's laughter should echo beyond the moment.
              </p>
              <p>
                RestDearOne is where those echoes live.
              </p>
            </div>
          </motion.section>

          {/* What We Offer */}
          <motion.section className="mb-16" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">What We Offer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: BookOpen, title: "Living Memory Pages", desc: "Create a dedicated page for a loved one. Share their story, invite others to contribute memories, and watch a living biography grow." },
                { icon: Users, title: "Memory Communities", desc: "Join circles of people who share similar experiences — losing a parent, remembering a teacher, celebrating community heroes. Find comfort in shared stories." },
                { icon: Sparkles, title: "AI-Powered Insights", desc: "Our AI extracts meaningful keywords, generates life timelines, and creates highlights from the collective memories shared about a person." },
                { icon: Heart, title: "Daily Reflection Prompts", desc: "Receive gentle prompts that help you remember and reflect — 'What lesson do you still carry from them?' These prompts keep memories alive and communities engaged." },
                { icon: Globe, title: "Global Memory Network", desc: "Connect with people around the world who are on the same journey of remembrance. See where stories come from with our community memory map." },
                { icon: Shield, title: "Safe & Respectful Space", desc: "We take content moderation seriously. AI-powered detection and human review ensure that every memorial page remains dignified and respectful." },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  className="bg-card border border-border rounded-xl p-6"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <item.icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground font-body leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Our Values */}
          <motion.section className="mb-16" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">Our Values</h2>
            <div className="bg-card border border-border rounded-xl p-8 space-y-6 font-body text-foreground/85 leading-relaxed">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">Dignity Above All</h3>
                <p>Every memorial page represents a real person who was loved. We treat every piece of content with the respect it deserves. Our moderation policies prioritize the dignity of the departed and the emotional safety of contributors.</p>
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">Stories Over Statistics</h3>
                <p>We don't reduce lives to dates and numbers. We focus on the stories — the moments, the lessons, the laughter. A life is best measured by the memories it leaves behind.</p>
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">Community as Healing</h3>
                <p>Grief can be isolating. But when you discover that thousands of others carry similar memories and similar pain, there is comfort. Our communities are designed not just for sharing, but for healing.</p>
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">Accessibility & Inclusion</h3>
                <p>We are committed to making RestDearOne accessible to everyone, regardless of location, language, or economic background. Memory preservation should not be a privilege — it is a right.</p>
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">Transparency & Trust</h3>
                <p>We are transparent about how we use data, how our AI works, and how we handle payments. Your trust is the foundation of everything we build.</p>
              </div>
            </div>
          </motion.section>

          {/* How It Works */}
          <motion.section className="mb-16" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">How It Works</h2>
            <div className="space-y-6">
              {[
                { step: "1", title: "Create a Memory Page", desc: "Sign up and create a dedicated page for someone you want to remember. Share their name, the years they lived, and a few personal details — their personality, a common phrase, an unforgettable moment." },
                { step: "2", title: "Activate the Page", desc: "For KES 100/year, activate a Living Memory Page. Invite others to contribute stories, reflections, lessons, and letters." },
                { step: "3", title: "Invite Others to Contribute", desc: "Share the page with family, friends, and anyone who knew the person. They can write stories, post reflections, share lessons, and even write letters to the departed." },
                { step: "4", title: "Watch the Story Grow", desc: "As more people contribute, AI generates a life timeline, extracts meaningful keywords for the Memory Echo Wall, and highlights the most powerful stories." },
                { step: "5", title: "Join Communities", desc: "Connect with others who share similar experiences. Join communities like 'Losing a Parent' or 'Remembering Teachers' and participate in daily reflections." },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  className="flex gap-4 items-start"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-lg">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground font-body leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* The Team */}
          <motion.section className="mb-16" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">The Vision Behind RestDearOne</h2>
            <div className="bg-card border border-border rounded-xl p-8 space-y-4 font-body text-foreground/85 leading-relaxed">
              <p>
                RestDearOne was created by a team that believes technology should serve the most human of needs — the need to remember, to grieve, and to heal.
              </p>
              <p>
                We are storytellers, engineers, and community builders who have each experienced loss in our own ways. We understand that there is no "right" way to grieve, but we believe there is immense power in shared memory.
              </p>
              <p>
                Our vision is to become the world's most meaningful memorial platform — not the biggest, not the flashiest, but the most meaningful. A place where every life, no matter how ordinary, is celebrated as extraordinary.
              </p>
              <p>
                We dream of a world where a grandchild in 2050 can read the stories written about their grandmother in 2025 — stories they would never have heard otherwise. That is the legacy we are building.
              </p>
            </div>
          </motion.section>

          {/* Looking Forward */}
          <motion.section className="mb-16" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">Looking Forward</h2>
            <div className="bg-card border border-border rounded-xl p-8 space-y-4 font-body text-foreground/85 leading-relaxed">
              <p>
                We are constantly evolving. Here are some of the features on our roadmap:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>Native Mobile App:</strong> A dedicated app for iOS and Android (currently available as an installable web app)</li>
                <li><strong>Auto M-Pesa Payouts:</strong> Automated disbursements for fundraisers and flower tribute earnings</li>
                <li><strong>Memory Collaboration:</strong> Real-time collaborative story writing with family members</li>
              </ul>
              <p>
                We are building RestDearOne not as a product, but as a movement. A movement to ensure that no life is ever truly forgotten.
              </p>
            </div>
          </motion.section>

          {/* CTA */}
          <motion.div className="text-center" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <p className="text-lg text-muted-foreground font-body mb-4">
              Every life deserves to be remembered. Start preserving memories today.
            </p>
            <a href="/create-memorial" className="inline-flex items-center justify-center h-11 px-6 rounded-lg text-sm font-body font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
              Create a Memory Page
            </a>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
