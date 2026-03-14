import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Mail, Heart } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Contact Us</h1>
            <p className="text-muted-foreground font-body">We'd love to hear from you.</p>
          </motion.div>

          <motion.div className="bg-card border border-border rounded-xl p-8 text-center space-y-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Mail className="w-12 h-12 text-primary mx-auto" />
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground mb-2">Email Us</h2>
              <a href="mailto:info@restdearone.com" className="text-primary font-body text-lg hover:underline">
                info@restdearone.com
              </a>
            </div>
            <p className="text-sm text-muted-foreground font-body leading-relaxed max-w-md mx-auto">
              Whether you have questions about creating a memorial page, need help with your account,
              want to report an issue, or simply want to share your story with us — we are here to listen.
            </p>
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground font-body">
                <Heart className="w-4 h-4 text-primary" />
                <span>We typically respond within 24 hours</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
