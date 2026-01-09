import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Mail,
  Send,
  Users,
  MessageSquare,
  Plus,
  CheckCircle2,
  XCircle,
  Archive,
  AlertCircle,
  User,
  Clock,
  Flag,
  Tag,
  Search,
} from "lucide-react";

export default function AdminMessaging() {
  const [selectedStatus, setSelectedStatus] = useState<"open" | "closed" | "archived" | undefined>("open");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);

  const conversations = useQuery(
    api.messaging.getConversations,
    selectedStatus ? { status: selectedStatus } : {}
  );
  const messages = useQuery(
    api.messaging.getMessages,
    selectedConversationId ? { conversationId: selectedConversationId } : "skip"
  );
  const unreadCount = useQuery(api.messaging.getUnreadConversationsCount, {});

  const sendMessage = useMutation(api.messaging.sendMessage);
  const markAsRead = useMutation(api.messaging.markAsRead);
  const closeConversation = useMutation(api.messaging.closeConversation);
  const reopenConversation = useMutation(api.messaging.reopenConversation);
  const updatePriority = useMutation(api.messaging.updateConversationPriority);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversationId) {
      markAsRead({ conversationId: selectedConversationId });
    }
  }, [selectedConversationId]);

  const handleSendMessage = async () => {
    if (!selectedConversationId || !messageContent.trim()) return;

    try {
      await sendMessage({
        conversationId: selectedConversationId,
        content: messageContent,
        senderType: "admin",
      });
      setMessageContent("");
      toast.success("Message sent");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedConversationId) return;

    try {
      await closeConversation({ conversationId: selectedConversationId });
      toast.success("Conversation closed");
      setSelectedConversationId(null);
    } catch (error) {
      toast.error("Failed to close conversation");
    }
  };

  const handleReopenConversation = async () => {
    if (!selectedConversationId) return;

    try {
      await reopenConversation({ conversationId: selectedConversationId });
      toast.success("Conversation reopened");
    } catch (error) {
      toast.error("Failed to reopen conversation");
    }
  };

  const handleChangePriority = async (priority: "low" | "medium" | "high" | "urgent") => {
    if (!selectedConversationId) return;

    try {
      await updatePriority({ conversationId: selectedConversationId, priority });
      toast.success("Priority updated");
    } catch (error) {
      toast.error("Failed to update priority");
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-500/10 text-green-500";
      case "closed":
        return "bg-gray-500/10 text-gray-500";
      case "archived":
        return "bg-blue-500/10 text-blue-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const selectedConversation = conversations?.find((c) => c._id === selectedConversationId);

  const filteredConversations = conversations?.filter((c) =>
    searchTerm
      ? c.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Customer Messaging Center</h1>
        <p className="text-muted-foreground">Manage customer conversations and support tickets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Open Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations?.filter((c) => c.status === "open").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{unreadCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Closed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations?.filter((c) => c.status === "closed").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Conversations</CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              {unreadCount ? `${unreadCount} unread messages` : "All messages read"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="flex gap-1 px-4 pb-3">
              <Button
                size="sm"
                variant={selectedStatus === "open" ? "default" : "outline"}
                onClick={() => setSelectedStatus("open")}
                className="flex-1"
              >
                Open
              </Button>
              <Button
                size="sm"
                variant={selectedStatus === "closed" ? "default" : "outline"}
                onClick={() => setSelectedStatus("closed")}
                className="flex-1"
              >
                Closed
              </Button>
              <Button
                size="sm"
                variant={selectedStatus === "archived" ? "default" : "outline"}
                onClick={() => setSelectedStatus("archived")}
                className="flex-1"
              >
                Archived
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-500px)]">
              <div className="space-y-1 px-2">
                {filteredConversations?.map((conversation) => (
                  <div
                    key={conversation._id}
                    onClick={() => setSelectedConversationId(conversation._id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                      selectedConversationId === conversation._id ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{conversation.user?.name || "Unknown"}</p>
                          {conversation.unreadCount && conversation.unreadCount > 0 ? (
                            <Badge variant="destructive" className="h-4 text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      {conversation.priority && (
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(conversation.priority)}`}>
                          {conversation.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {conversation.subject || "No subject"}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className={`text-xs ${getStatusColor(conversation.status)}`}>
                        {conversation.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conversation.lastMessageAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {selectedConversation.user?.name || "Unknown User"}
                    </CardTitle>
                    <CardDescription>
                      {selectedConversation.user?.email || "No email"}
                      {selectedConversation.subject && ` • ${selectedConversation.subject}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {selectedConversation.status === "open" ? (
                      <Button size="sm" variant="outline" onClick={handleCloseConversation}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Close
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={handleReopenConversation}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Reopen
                      </Button>
                    )}
                    <Select
                      value={selectedConversation.priority || "medium"}
                      onValueChange={(value: any) => handleChangePriority(value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-550px)] p-4">
                  <div className="space-y-4">
                    {messages?.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${message.senderType === "admin" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.senderType === "admin"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-medium">{message.senderName}</p>
                            <p className="text-xs opacity-70">
                              {new Date(message.sentAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((attachment, idx) => (
                                <a
                                  key={idx}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs underline opacity-80 hover:opacity-100"
                                >
                                  {attachment.name}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <Separator />
                <div className="p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="min-h-[60px] resize-none"
                    />
                    <Button onClick={handleSendMessage} disabled={!messageContent.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-[calc(100vh-350px)]">
              <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Select a conversation to view messages</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
