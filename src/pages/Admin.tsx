import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Shield, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { adminSections } from "@/components/admin/adminSections";

const Admin = () => {
  const { user, isAdmin, adminRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sectionKey, setSectionKey] = useState<string>(adminSections[0].key);
  const [subKey, setSubKey] = useState<string>(adminSections[0].subtabs[0].key);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, authLoading, navigate]);

  const section = useMemo(
    () => adminSections.find((s) => s.key === sectionKey) || adminSections[0],
    [sectionKey]
  );
  const subtab = useMemo(
    () => section.subtabs.find((s) => s.key === subKey) || section.subtabs[0],
    [section, subKey]
  );

  const filteredSections = useMemo(() => {
    if (!query.trim()) return adminSections;
    const q = query.toLowerCase();
    return adminSections
      .map((s) => ({
        ...s,
        subtabs: s.subtabs.filter(
          (st) => st.label.toLowerCase().includes(q) || s.label.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.subtabs.length > 0);
  }, [query]);

  if (authLoading || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Admin Dashboard — RestDearOne</title>
        <meta name="description" content="RestDearOne administrator dashboard for platform management." />
        <link rel="canonical" href="https://restdearone.lovable.app/admin" />
      </Helmet>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div className="flex items-center gap-3 mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground font-body capitalize">
                Role: {adminRole?.replace(/_/g, " ")} · {adminSections.length} sections
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            {/* Sidebar */}
            <aside className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search sections..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <nav className="bg-card border border-border rounded-xl p-2 max-h-[70vh] overflow-y-auto">
                {filteredSections.map((s) => {
                  const Icon = s.icon;
                  const isOpen = s.key === sectionKey;
                  return (
                    <div key={s.key} className="mb-1">
                      <button
                        onClick={() => {
                          setSectionKey(s.key);
                          setSubKey(s.subtabs[0].key);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body text-left transition-colors ${
                          isOpen ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 truncate">{s.label}</span>
                        <span className="text-xs text-muted-foreground">{s.subtabs.length}</span>
                      </button>
                      {isOpen && (
                        <div className="ml-6 mt-1 space-y-0.5">
                          {s.subtabs.map((st) => (
                            <button
                              key={st.key}
                              onClick={() => setSubKey(st.key)}
                              className={`w-full text-left px-3 py-1.5 rounded-md text-xs font-body transition-colors ${
                                st.key === subKey
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                              }`}
                            >
                              {st.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredSections.length === 0 && (
                  <p className="text-xs text-muted-foreground font-body text-center py-4">
                    No matches.
                  </p>
                )}
              </nav>
            </aside>

            {/* Content */}
            <main className="min-w-0">
              <div className="mb-4">
                <p className="text-xs font-body text-muted-foreground uppercase tracking-wide">
                  {section.label}
                </p>
                <h2 className="font-display text-2xl font-bold text-foreground">{subtab.label}</h2>
              </div>
              <motion.div
                key={`${sectionKey}-${subKey}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {subtab.render({ userId: user!.id, adminRole })}
              </motion.div>
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Admin;
