import { CompanyLayout } from "@/components/CompanyLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const conversations = [
  { id: 1, company: "GeoPath", lastMessage: "Interview scheduled for next week.", unread: 1, time: "09:15" },
  { id: 2, company: "DrillSafe", lastMessage: "Safety documentation updated.", unread: 0, time: "09:17" },
];

const CompanyMessages = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { id: 1, sender: "Alex Candidate", text: "Attached my resume.", time: "09:15", isSent: false },
    { id: 2, sender: "You", text: "Thanks! We'll review it.", time: "09:17", isSent: true },
  ]);
  const [newMessage, setNewMessage] = useState("");

  // Guard: only company users here
  useEffect(() => {
    if (!loading) {
      if (!user) navigate("/auth");
      else if (userType === "talent") navigate("/messages");
    }
  }, [user, userType, loading, navigate]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMsg = {
            id: Date.now(),
            sender: "Other",
            text: payload.new.content,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            isSent: false
          };
          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg = {
      id: Date.now(),
      sender: "You",
      text: newMessage,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isSent: true
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage("");
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
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Company communications</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 h-auto lg:h-[calc(100vh-200px)]">
          <Card className="p-4 max-h-[300px] lg:max-h-none overflow-auto">
            <h2 className="font-semibold mb-4">Conversations</h2>
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  className="w-full text-left p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium text-sm">{conv.company}</span>
                    {conv.unread > 0 && (
                      <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {conv.unread}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-2 flex flex-col min-h-[500px] lg:min-h-0">
            <div className="border-b border-border p-4">
              <h2 className="font-semibold">GeoPath</h2>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isSent ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.isSent ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.isSent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1 rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button onClick={handleSend}>Send</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </CompanyLayout>
  );
};

export default CompanyMessages;
