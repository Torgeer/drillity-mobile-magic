import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface MessageRow {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  conversation_id: string;
}

const CompanyMessages = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!loading) {
      if (!user) navigate("/auth");
      else if (userType === "talent") navigate("/messages");
    }
  }, [user, userType, loading, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("messages")
        .select("id, content, created_at, sender_id, receiver_id, conversation_id")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      if (data && data.length && !selectedConversation) setSelectedConversation(data[data.length - 1].conversation_id);
    };
    load();

    if (user) {
      const channel = supabase
        .channel("company-messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as MessageRow]);
          }
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const conversations = useMemo(() => {
    const map = new Map<string, MessageRow[]>();
    messages.forEach(m => {
      if (!map.has(m.conversation_id)) map.set(m.conversation_id, []);
      map.get(m.conversation_id)!.push(m);
    });
    // Sort each conversation by created_at
    map.forEach(arr => arr.sort((a,b) => a.created_at.localeCompare(b.created_at)));
    return Array.from(map.entries()).map(([id, msgs]) => ({ id, last: msgs[msgs.length-1] }));
  }, [messages]);

  const visibleMessages = useMemo(() => messages.filter(m => m.conversation_id === selectedConversation), [messages, selectedConversation]);

  const handleSend = async () => {
    if (!user || !newMessage.trim() || !selectedConversation) return;
    const last = visibleMessages[visibleMessages.length - 1];
    const receiverId = last ? (last.sender_id === user.id ? last.receiver_id : last.sender_id) : null;
    if (!receiverId) return;

    const { error } = await supabase.from("messages").insert({
      content: newMessage,
      sender_id: user.id,
      receiver_id: receiverId,
      conversation_id: selectedConversation,
    });
    if (!error) setNewMessage("");
  };

  if (loading) {
    return (
      <CompanyLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 h-auto lg:h-[calc(100vh-200px)]">
          <Card className="p-4 max-h-[300px] lg:max-h-none overflow-auto">
            <h2 className="font-semibold mb-4">Conversations</h2>
            <div className="space-y-2">
              {conversations.length === 0 && (
                <p className="text-sm text-muted-foreground">No conversations yet.</p>
              )}
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${selectedConversation === conv.id ? "bg-secondary" : "hover:bg-secondary"}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium text-sm">Conversation</span>
                    <Badge variant="outline" className="text-xs">{new Date(conv.last.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.last.content}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-2 flex flex-col min-h-[500px] lg:min-h-0">
            <div className="border-b border-border p-4">
              <h2 className="font-semibold">{selectedConversation ? "Conversation" : "No conversation selected"}</h2>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
              {visibleMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">{selectedConversation ? "No messages yet." : "Select a conversation to view messages."}</p>
              ) : (
                visibleMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={selectedConversation ? "Type a message..." : "Select a conversation to reply"}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={!selectedConversation}
                  className="flex-1 rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
                <Button onClick={handleSend} disabled={!selectedConversation}>Send</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </CompanyLayout>
  );
};

export default CompanyMessages;