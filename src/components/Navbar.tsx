import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Navbar = () => {
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
          <Link to="/explore" className="text-muted-foreground hover:text-foreground transition-colors font-body text-sm">
            Explore Stories
          </Link>
          <Link to="/forum" className="text-muted-foreground hover:text-foreground transition-colors font-body text-sm">
            Community
          </Link>
          <Link to="/discover" className="text-muted-foreground hover:text-foreground transition-colors font-body text-sm">
            Discover a Life
          </Link>
        </div>

        <div className="flex items-center gap-3">
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
