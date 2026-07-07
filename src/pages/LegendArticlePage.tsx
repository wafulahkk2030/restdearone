import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const LegendArticlePage = () => {
  const { articleId } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [legend, setLegend] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("legend_articles")
        .select("*, national_legends(full_name, slug, id)")
        .eq("id", articleId)
        .eq("status", "approved")
        .maybeSingle();
      setArticle(data);
      setLegend((data as any)?.national_legends || null);
      setLoading(false);
    })();
  }, [articleId]);

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="pt-28 text-center text-muted-foreground">Loading…</div></div>;
  if (!article) return <div className="min-h-screen bg-background"><Navbar /><div className="pt-28 text-center text-muted-foreground">Article not found or not yet published.</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{article.title} — {legend?.full_name || "National Legend"} | RestDearOne</title>
        <meta name="description" content={article.body?.slice(0, 160)} />
      </Helmet>
      <Navbar />
      <article className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {legend && (
            <Link to={`/national-legends/${legend.slug || legend.id}`} className="inline-flex items-center gap-2 text-sm text-primary font-body hover:underline mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to {legend.full_name}
            </Link>
          )}
          {article.image_url && (
            <img src={article.image_url} alt={article.title} className="w-full max-h-[70vh] object-cover rounded-2xl mb-8" />
          )}
          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-tight">{article.title}</h1>
          <p className="text-sm text-muted-foreground font-body mt-3">By {article.author_name} · {new Date(article.created_at).toLocaleDateString()}</p>
          <div className="prose prose-lg max-w-none mt-8 text-foreground/90 font-body leading-[1.8] whitespace-pre-line text-lg">
            {article.body}
          </div>
          {article.source_url && (
            <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary mt-8 underline font-body">
              Source <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </article>
      <Footer />
    </div>
  );
};

export default LegendArticlePage;