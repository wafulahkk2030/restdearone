import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Video, Music, Trash2, Plus, ExternalLink } from "lucide-react";

interface Props {
  memorialId: string;
  isActive: boolean;
}

const getEmbedType = (url: string): string => {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("soundcloud.com")) return "soundcloud";
  if (url.includes("vimeo.com")) return "vimeo";
  return "other";
};

const getYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/);
  return match ? match[1] : null;
};

const getVimeoId = (url: string): string | null => {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
};

const MediaEmbeds = ({ memorialId, isActive }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [embeds, setEmbeds] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadEmbeds(); }, [memorialId]);

  const loadEmbeds = async () => {
    const { data } = await supabase.from("media_embeds").select("*")
      .eq("memorial_id", memorialId).order("created_at", { ascending: false });
    setEmbeds(data || []);
  };

  const addEmbed = async () => {
    if (!user || !url) return;
    const embedType = getEmbedType(url);
    setSubmitting(true);
    const { error } = await supabase.from("media_embeds").insert({
      memorial_id: memorialId,
      added_by: user.id,
      embed_url: url,
      embed_type: embedType,
      title: title || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Media added!" });
      setUrl("");
      setTitle("");
      setShowForm(false);
      loadEmbeds();
    }
  };

  const removeEmbed = async (id: string) => {
    await supabase.from("media_embeds").delete().eq("id", id);
    setEmbeds(prev => prev.filter(e => e.id !== id));
  };

  if (embeds.length === 0 && (!user || !isActive)) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" /> Audio & Video Memories
        </h3>
        {user && isActive && !showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-1">
            <Plus className="w-4 h-4" /> Add Media
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
          <p className="text-xs text-muted-foreground font-body">Paste a YouTube, SoundCloud, or Vimeo link</p>
          <Input placeholder="https://youtube.com/watch?v=..." value={url} onChange={e => setUrl(e.target.value)} />
          <Input placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="hero" size="sm" onClick={addEmbed} disabled={submitting || !url}>
              {submitting ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {embeds.map(embed => {
          const ytId = embed.embed_type === "youtube" ? getYouTubeId(embed.embed_url) : null;
          const vimeoId = embed.embed_type === "vimeo" ? getVimeoId(embed.embed_url) : null;

          return (
            <div key={embed.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {ytId ? (
                <div className="aspect-video">
                  <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full" allowFullScreen
                    title={embed.title || "YouTube video"} loading="lazy" />
                </div>
              ) : vimeoId ? (
                <div className="aspect-video">
                  <iframe src={`https://player.vimeo.com/video/${vimeoId}`} className="w-full h-full" allowFullScreen
                    title={embed.title || "Vimeo video"} loading="lazy" />
                </div>
              ) : embed.embed_type === "soundcloud" ? (
                <div className="p-4">
                  <iframe width="100%" height="166" scrolling="no" frameBorder="no" allow="autoplay"
                    src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(embed.embed_url)}&color=%23ff5500&auto_play=false`}
                    loading="lazy" />
                </div>
              ) : (
                <div className="p-4 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-primary" />
                  <a href={embed.embed_url} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-primary font-body hover:underline truncate">{embed.embed_url}</a>
                </div>
              )}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {embed.embed_type === "soundcloud" ? <Music className="w-4 h-4 text-muted-foreground" /> : <Video className="w-4 h-4 text-muted-foreground" />}
                  <span className="text-xs font-body text-foreground truncate">{embed.title || embed.embed_type}</span>
                </div>
                {user && (user.id === embed.added_by) && (
                  <button onClick={() => removeEmbed(embed.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MediaEmbeds;
