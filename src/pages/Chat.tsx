import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { MessageCircle, Send, Users, BookOpen, Lightbulb, HelpCircle, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const MESSAGE_TYPES = [
  { type: "memory", label: "A memory", icon: BookOpen, prompt: "Share a moment you will never forget..." },
  { type: "lesson", label: "A lesson", icon: Lightbulb, prompt: "Share a lesson they taught you..." },
  { type: "missing", label: "Something I miss", icon: Heart, prompt: "What do you miss most about them?" },
  { type: "question", label: "A question", icon: HelpCircle, prompt: "What would you ask them if you could?" },
];

const Chat = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [myChats, setMyChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showStarter, setShowStarter] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [starterPrompt, setStarterPrompt] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  useEffect(() => {
    if (user) loadMyChats();
  }, [user]);

  const loadMyChats = async () => {
    setLoading(true);
    const { data: memberships } = await supabase.from("chat_members").select("chat_id").eq("user_id", user!.id);
    if (memberships?.length) {
      const chatIds = memberships.map(m => m.chat_id);
      const { data: chats } = await supabase.from("chats").select("*").in("id", chatIds).order("created_at", { ascending: false });
      setMyChats(chats || []);
    } else {
      setMyChats([]);
    }
    setLoading(false);
  };

  const selectChat = async (chat: any) => {
    setSelectedChat(chat);
    const { data } = await supabase.from("chat_messages")
      .select("*, profiles:sender_id(display_name, username)")
      .eq("chat_id", chat.id)
      .eq("is_flagged", false)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // Realtime messages
  useEffect(() => {
    if (!selectedChat) return;
    const channel = supabase
      .channel(`chat-${selectedChat.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chat_messages",
        filter: `chat_id=eq.${selectedChat.id}`,
      }, async (payload) => {
        const { data: profile } = await supabase.from("profiles").select("display_name, username").eq("id", payload.new.sender_id).single();
        setMessages(prev => [...prev, { ...payload.new, profiles: profile }]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedChat?.id]);

  const handleStartConversation = () => {
    setShowStarter(true);
    setSelectedType(null);
    setStarterPrompt("");
  };

  const submitStarterMessage = async () => {
    if (!starterPrompt.trim()) return;
    if (!selectedChat) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      chat_id: selectedChat.id,
      sender_id: user!.id,
      message: starterPrompt,
      message_type: selectedType || "memory",
    });
    setSending(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setShowStarter(false);
      setStarterPrompt("");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      chat_id: selectedChat.id,
      sender_id: user!.id,
      message: newMessage,
      message_type: "memory",
    });
    setSending(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewMessage("");
    }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-24 flex items-center justify-center"><p className="text-muted-foreground font-body">Loading...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-foreground mb-6">Memory Conversations</h1>
          <p className="text-muted-foreground font-body mb-8">Connect through shared memories. Conversations are guided and meaningful — not noisy.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ minHeight: "60vh" }}>
            {/* Chat list */}
            <div className="space-y-3">
              <h3 className="font-display text-sm font-semibold text-foreground mb-2">Your Conversations</h3>
              {myChats.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-body">No conversations yet. Follow a memorial or join a community to start chatting.</p>
                </div>
              ) : myChats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => selectChat(chat)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedChat?.id === chat.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <p className="font-display text-sm font-semibold text-foreground">{chat.name || "Memory Circle"}</p>
                  <p className="text-xs text-muted-foreground font-body">{chat.chat_type === "group" ? "Group" : "Private"}</p>
                </button>
              ))}
            </div>

            {/* Chat area */}
            <div className="md:col-span-2 bg-card border border-border rounded-xl flex flex-col" style={{ minHeight: "50vh" }}>
              {!selectedChat ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-muted-foreground font-body">Select a conversation to start</p>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{selectedChat.name || "Memory Circle"}</h3>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleStartConversation} className="gap-1">
                      <MessageCircle className="w-4 h-4" /> Guided Start
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground font-body text-sm">No messages yet. Click "Guided Start" to begin a meaningful conversation.</p>
                      </div>
                    )}
                    {messages.map(msg => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <motion.div
                          key={msg.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                            isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                          }`}>
                            {!isMe && (
                              <p className="text-xs font-body font-semibold mb-1 opacity-70">
                                {msg.profiles?.display_name || msg.profiles?.username || "User"}
                              </p>
                            )}
                            <p className="font-body text-sm whitespace-pre-wrap">{msg.message}</p>
                            <p className="text-[10px] opacity-50 mt-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-border flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      className="flex-1"
                    />
                    <Button variant="hero" size="icon" onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Guided conversation starter */}
      <Dialog open={showStarter} onOpenChange={setShowStarter}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Start a Conversation</DialogTitle>
            <DialogDescription className="font-body text-sm">What would you like to share?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {!selectedType ? (
              <div className="grid grid-cols-2 gap-3">
                {MESSAGE_TYPES.map(mt => (
                  <button
                    key={mt.type}
                    onClick={() => { setSelectedType(mt.type); setStarterPrompt(""); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/40 transition-all"
                  >
                    <mt.icon className="w-6 h-6 text-primary" />
                    <span className="font-body text-sm text-foreground">{mt.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-body text-sm text-muted-foreground italic">
                  {MESSAGE_TYPES.find(m => m.type === selectedType)?.prompt}
                </p>
                <Textarea
                  placeholder="Write your response..."
                  value={starterPrompt}
                  onChange={e => setStarterPrompt(e.target.value)}
                  className="min-h-[120px]"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setSelectedType(null)}>Back</Button>
                  <Button variant="hero" onClick={submitStarterMessage} disabled={sending || !starterPrompt.trim()}>
                    {sending ? "Sending..." : "Share"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;
