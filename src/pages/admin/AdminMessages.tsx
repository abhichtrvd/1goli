import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { MessageSquare, Send, User } from "lucide-react";

export default function AdminMessages() {
  const conversations = useQuery(api.messaging.getConversations, {});
  const sendMessage = useMutation(api.messaging.sendMessage);
  const markAsRead = useMutation(api.messaging.markAsRead);

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  const selectedConvData = conversations?.find(c =>
    c._id === selectedConversation
  );

  const messages = useQuery(
    api.messaging.getMessages,
    selectedConversation ? { conversationId: selectedConversation } : "skip"
  );

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConvData) return;

    try {
      await sendMessage({
        conversationId: selectedConversation!,
        content: messageText,
        senderType: "admin",
      });
      setMessageText("");
      toast.success("Message sent");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversation(conversationId);
    await markAsRead({ conversationId });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Customer Messages</h1>
        <p className="text-muted-foreground">Communicate with your customers</p>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
        <Card className="col-span-4 overflow-hidden">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-280px)]">
              {conversations?.map((conv) => {
                return (
                  <div
                    key={conv._id}
                    className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
                      selectedConversation === conv._id ? "bg-accent" : ""
                    }`}
                    onClick={() => handleSelectConversation(conv._id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{conv.user?.name || "Unknown User"}</span>
                      </div>
                      {(conv.unreadCount || 0) > 0 && (
                        <Badge variant="default" className="text-xs">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    {conv.subject && (
                      <p className="text-sm font-medium truncate mb-1">{conv.subject}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{conv.user?.email || "No email"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(conv.lastMessageAt).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="col-span-8 overflow-hidden flex flex-col">
          {selectedConversation && selectedConvData ? (
            <>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {selectedConvData.user?.name || "Unknown User"}
                </CardTitle>
                {selectedConvData.subject && (
                  <p className="text-sm text-muted-foreground">{selectedConvData.subject}</p>
                )}
              </CardHeader>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages?.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex ${msg.senderType === "admin" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.senderType === "admin"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-xs font-medium mb-1">{msg.senderName}</p>
                        <p className="text-sm">{msg.content}</p>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((att, idx) => (
                              <a
                                key={idx}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline block"
                              >
                                {att.name}
                              </a>
                            ))}
                          </div>
                        )}
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.sentAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} size="icon" className="h-full">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                <p>Select a conversation to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
