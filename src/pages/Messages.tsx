import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const conversations = [
  { id: 1, company: "PetroWorks HR", lastMessage: "We received your application. Can you start next week?", unread: 2, time: "09:15" },
  { id: 2, company: "DrillSafe", lastMessage: "Safety training is scheduled for Friday.", unread: 0, time: "09:17" },
];

const messages = [
  { id: 1, sender: "PetroWorks HR", text: "We received your application. Can you start next week?", time: "09:15", isSent: false },
  { id: 2, sender: "You", text: "Yes, I am available!", time: "09:17", isSent: true },
  { id: 3, sender: "PetroWorks HR", text: "Great, we will send you the contract.", time: "09:18", isSent: false },
  { id: 4, sender: "You", text: "Thank you! Looking forward to it.", time: "09:18", isSent: true },
  { id: 5, sender: "PetroWorks HR", text: "Please check your email for the onboarding documents.", time: "09:20", isSent: false },
  { id: 6, sender: "You", text: "Received, will review and sign today.", time: "09:21", isSent: true },
  { id: 7, sender: "PetroWorks HR", text: "Let us know if you have any questions about the process.", time: "09:22", isSent: false },
  { id: 8, sender: "You", text: "Will do, thanks again!", time: "09:23", isSent: true },
  { id: 9, sender: "PetroWorks HR", text: "Welcome to the team!", time: "09:24", isSent: false },
];

const Messages = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Communications</p>
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
              <h2 className="font-semibold">PetroWorks HR</h2>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isSent ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      msg.isSent
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.isSent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border border-input bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button>Send</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Messages;
