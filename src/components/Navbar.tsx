import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation, LANGUAGES } from "@/contexts/TranslationContext";
import { Menu, X, Shield, Globe } from "lucide-react";

const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { language, setLanguage, isTranslating } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/explore", label: "Explore Stories" },
    { to: "/communities", label: "Communities" },
    { to: "/forum", label: "Forum" },
    { to: "/discover", label: "Discover a Life" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="RestDearOne" className="h-10 w-auto" />
          <span className="font-display text-xl font-semibold text-foreground hidden sm:inline">
            RestDearOne
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`transition-colors font-body text-sm ${
                isActive(link.to)
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin">
                  <button className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-sm font-body font-medium text-primary hover:bg-accent transition-colors gap-1">
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                </Link>
              )}
              <Link to="/profile">
                <button className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-body font-medium text-foreground hover:bg-accent transition-colors">
                  Profile
                </button>
              </Link>
              <Link to="/dashboard">
                <button className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-body font-medium text-foreground hover:bg-accent transition-colors">
                  Dashboard
                </button>
              </Link>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-body font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-body font-medium text-foreground hover:bg-accent transition-colors">
                  Sign In
                </button>
              </Link>
              <Link to="/signup">
                <button className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-body font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                  Create Account
                </button>
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 py-4 space-y-2">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block py-2 px-3 rounded-lg text-sm font-body transition-colors ${
                isActive(link.to) ? "bg-accent text-primary font-semibold" : "text-foreground hover:bg-accent"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className={`block py-2 px-3 rounded-lg text-sm font-body transition-colors ${isActive("/dashboard") ? "bg-accent text-primary font-semibold" : "text-foreground hover:bg-accent"}`}>
                Dashboard
              </Link>
              <Link to="/create-memorial" onClick={() => setMobileOpen(false)} className="block py-2 px-3 rounded-lg text-sm font-body text-primary font-semibold hover:bg-accent transition-colors">
                + Create Memorial
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
