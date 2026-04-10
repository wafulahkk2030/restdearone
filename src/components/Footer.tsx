import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-navy text-navy-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="RestDearOne" className="h-10 w-auto" />
              <span className="font-display text-xl font-semibold">RestDearOne</span>
            </div>
            <p className="text-navy-foreground/70 font-body text-sm leading-relaxed max-w-md">
              Every life leaves a story. RestDearOne exists so families and communities
              can keep those stories alive through written memories, reflections, and shared experiences.
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold mb-4 text-navy-foreground/90">Platform</h4>
            <ul className="space-y-2 text-sm text-navy-foreground/60 font-body">
              <li><Link to="/explore" className="hover:text-navy-foreground transition-colors">Explore Stories</Link></li>
              <li><Link to="/forum" className="hover:text-navy-foreground transition-colors">Community Forum</Link></li>
              <li><Link to="/discover" className="hover:text-navy-foreground transition-colors">Discover a Life</Link></li>
              <li><Link to="/create-memorial" className="hover:text-navy-foreground transition-colors">Create Memory Page</Link></li>
              <li><Link to="/fundraise" className="hover:text-navy-foreground transition-colors">Support a Family</Link></li>
              <li><Link to="/chat" className="hover:text-navy-foreground transition-colors">Memory Conversations</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold mb-4 text-navy-foreground/90">About</h4>
            <ul className="space-y-2 text-sm text-navy-foreground/60 font-body">
              <li><Link to="/about" className="hover:text-navy-foreground transition-colors">About Us</Link></li>
              <li><Link to="/guidelines" className="hover:text-navy-foreground transition-colors">Community Guidelines</Link></li>
              <li><Link to="/privacy" className="hover:text-navy-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/contact" className="hover:text-navy-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-foreground/10 mt-12 pt-8 text-center text-sm text-navy-foreground/50 font-body">
          <p>© {new Date().getFullYear()} RestDearOne. Every life deserves to be remembered.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
