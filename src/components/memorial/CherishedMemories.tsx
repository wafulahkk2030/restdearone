import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, useScroll, useTransform } from "framer-motion";
import { Camera, Trash2, X, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Photo {
  id: string;
  photo_url: string;
  caption: string | null;
  uploaded_by: string | null;
  created_at: string;
}

interface Props {
  memorialId: string;
  isActive: boolean;
}

const CherishedMemories = ({ memorialId, isActive }: Props) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [showDrive, setShowDrive] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });

  useEffect(() => { loadPhotos(); }, [memorialId]);

  const loadPhotos = async () => {
    const { data } = await supabase
      .from("memorial_photos" as any)
      .select("*")
      .eq("memorial_id", memorialId)
      .order("created_at", { ascending: false });
    setPhotos((data as any[]) || []);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB per image.", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Only images allowed", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${memorialId}/${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage.from("memorial-photos").upload(path, file);
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("memorial-photos").getPublicUrl(path);
    
    await supabase.from("memorial_photos" as any).insert({
      memorial_id: memorialId,
      photo_url: urlData.publicUrl,
      caption: caption || null,
      uploaded_by: user.id,
    } as any);

    setCaption("");
    setUploading(false);
    toast({ title: "Photo shared!" });
    loadPhotos();
  };

  const handleDelete = async (photo: Photo) => {
    if (!confirm("Remove this photo?")) return;
    await supabase.from("memorial_photos" as any).delete().eq("id", photo.id);
    loadPhotos();
  };

  const addDrivePhoto = async () => {
    if (!user || !driveUrl) return;
    const m = driveUrl.match(/\/file\/d\/([^/]+)/) || driveUrl.match(/[?&]id=([^&]+)/);
    if (!m) {
      toast({ title: "Invalid Google Drive link", description: "Use a public file link.", variant: "destructive" });
      return;
    }
    const photoUrl = `https://drive.google.com/uc?export=view&id=${m[1]}`;
    await supabase.from("memorial_photos" as any).insert({
      memorial_id: memorialId,
      photo_url: photoUrl,
      caption: caption || null,
      uploaded_by: user.id,
    } as any);
    setDriveUrl("");
    setCaption("");
    setShowDrive(false);
    toast({ title: "Photo added from Drive!" });
    loadPhotos();
  };

  if (loading) return null;
  if (photos.length === 0 && !isActive && !isAdmin) return null;

  return (
    <section className="mb-12" ref={containerRef}>
      <motion.div className="text-center mb-8" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <span className="text-primary font-body text-sm tracking-widest uppercase">Cherished Memories</span>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-2">A Collection of Moments</h2>
      </motion.div>

      {/* Photo upload */}
      {(isActive || isAdmin) && user && (
        <div className="flex flex-col items-center gap-3 mb-6">
          <Input placeholder="Caption (optional)" value={caption} onChange={e => setCaption(e.target.value)} className="max-w-xs" />
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Button asChild variant="outline" size="sm" className="gap-1" disabled={uploading}>
              <label className="cursor-pointer">
                <Camera className="w-4 h-4" />
                {uploading ? "Uploading..." : "Upload Photo"}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowDrive(s => !s)}>
              <Link2 className="w-4 h-4" /> Google Drive Link
            </Button>
          </div>
          {showDrive && (
            <div className="flex items-center gap-2 w-full max-w-md">
              <Input placeholder="https://drive.google.com/file/d/..." value={driveUrl} onChange={e => setDriveUrl(e.target.value)} />
              <Button variant="hero" size="sm" onClick={addDrivePhoto} disabled={!driveUrl}>Add</Button>
            </div>
          )}
        </div>
      )}

      {/* Animated photo grid */}
      {photos.length > 0 && (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
          {photos.map((photo, i) => (
            <motion.div
              key={photo.id}
              className="break-inside-avoid relative group cursor-pointer overflow-hidden rounded-xl"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.photo_url}
                alt={photo.caption || "Memory photo"}
                className="w-full object-cover rounded-xl"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                {photo.caption && (
                  <p className="absolute bottom-3 left-3 right-3 text-white font-body text-xs">{photo.caption}</p>
                )}
              </div>
              {(user?.id === photo.uploaded_by || isAdmin) && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(photo); }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <p className="text-center text-muted-foreground font-body text-sm">No photos shared yet. Be the first to share a cherished memory.</p>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <motion.div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedPhoto(null)}
        >
          <button className="absolute top-4 right-4 text-white" onClick={() => setSelectedPhoto(null)}>
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedPhoto.photo_url}
            alt={selectedPhoto.caption || ""}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
          {selectedPhoto.caption && (
            <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white font-body text-sm bg-black/50 px-4 py-2 rounded-full">
              {selectedPhoto.caption}
            </p>
          )}
        </motion.div>
      )}
    </section>
  );
};

export default CherishedMemories;
