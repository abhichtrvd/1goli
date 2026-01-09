import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ArrowRight, Trash2 } from "lucide-react";

const TRIGGER_EVENTS = [
  { value: "order.created", label: "Order Created" },
  { value: "order.updated", label: "Order Updated" },
  { value: "order.cancelled", label: "Order Cancelled" },
  { value: "order.delivered", label: "Order Delivered" },
  { value: "user.registered", label: "User Registered" },
  { value: "user.suspended", label: "User Suspended" },
  { value: "product.lowStock", label: "Product Low Stock" },
  { value: "product.outOfStock", label: "Product Out of Stock" },
  { value: "prescription.expiring", label: "Prescription Expiring" },
  { value: "review.submitted", label: "Review Submitted" },
  { value: "payment.failed", label: "Payment Failed" },
  { value: "payment.received", label: "Payment Received" },
];

const ACTION_TYPES = [
  { value: "send_email", label: "Send Email" },
  { value: "send_sms", label: "Send SMS" },
  { value: "update_field", label: "Update Field" },
  { value: "create_task", label: "Create Task" },
  { value: "call_webhook", label: "Call Webhook" },
  { value: "add_tag", label: "Add Tag" },
  { value: "suspend_user", label: "Suspend User" },
  { value: "send_notification", label: "Send Notification" },
];

const OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "gt", label: "Greater Than" },
  { value: "gte", label: "Greater Than or Equal" },
  { value: "lt", label: "Less Than" },
  { value: "lte", label: "Less Than or Equal" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Does Not Contain" },
  { value: "in", label: "In List" },
  { value: "not_in", label: "Not In List" },
];

interface Condition {
  field: string;
  operator: string;
  value: any;
  logicalOperator?: "AND" | "OR";
}

interface Action {
  type: string;
  config: any;
  order?: number;
}

interface WorkflowBuilderProps {
  initialData?: {
    name: string;
    description?: string;
    trigger: string;
    triggerConditions?: Condition[];
    actions: Action[];
    priority?: number;
  };
  onSave: (workflow: any) => void;
  onCancel: () => void;
}

export function WorkflowBuilder({ initialData, onSave, onCancel }: WorkflowBuilderProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [trigger, setTrigger] = useState(initialData?.trigger || "");
  const [priority, setPriority] = useState(initialData?.priority || 0);
  const [conditions, setConditions] = useState<Condition[]>(initialData?.triggerConditions || []);
  const [actions, setActions] = useState<Action[]>(initialData?.actions || []);

  const addCondition = () => {
    setConditions([...conditions, { field: "", operator: "equals", value: "", logicalOperator: "AND" }]);
  };

  const updateCondition = (index: number, field: keyof Condition, value: any) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const addAction = () => {
    setActions([...actions, { type: "", config: {}, order: actions.length }]);
  };

  const updateAction = (index: number, type: string, config: any) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], type, config, order: index };
    setActions(updated);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index).map((a, i) => ({ ...a, order: i })));
  };

  const handleSave = () => {
    onSave({
      name,
      description,
      trigger,
      triggerConditions: conditions,
      actions,
      priority,
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Workflow Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Order Confirmation Email" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this workflow do?" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trigger">Trigger Event</Label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger id="trigger">
                  <SelectValue placeholder="Select trigger event" />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_EVENTS.map((event) => (
                    <SelectItem key={event.value} value={event.value}>
                      {event.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Input id="priority" type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} placeholder="0" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trigger Conditions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Trigger Conditions</CardTitle>
            <Button onClick={addCondition} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {conditions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conditions. Workflow will trigger on every event.</p>
          ) : (
            conditions.map((condition, index) => (
              <div key={index} className="flex gap-2 items-end">
                {index > 0 && (
                  <Select value={condition.logicalOperator} onValueChange={(value) => updateCondition(index, "logicalOperator", value as "AND" | "OR")}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND</SelectItem>
                      <SelectItem value="OR">OR</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <Input placeholder="Field" value={condition.field} onChange={(e) => updateCondition(index, "field", e.target.value)} />
                  <Select value={condition.operator} onValueChange={(value) => updateCondition(index, "operator", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Value" value={condition.value} onChange={(e) => updateCondition(index, "value", e.target.value)} />
                </div>
                <Button onClick={() => removeCondition(index)} variant="destructive" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Actions</CardTitle>
            <Button onClick={addAction} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Action
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {actions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No actions defined. Add actions to execute when conditions are met.</p>
          ) : (
            actions.map((action, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Step {index + 1}</Badge>
                  <Button onClick={() => removeAction(index)} variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div>
                  <Label>Action Type</Label>
                  <Select value={action.type} onValueChange={(value) => updateAction(index, value, action.config)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <ActionConfigEditor actionType={action.type} config={action.config} onChange={(config) => updateAction(index, action.type, config)} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!name || !trigger || actions.length === 0}>
          Save Workflow
        </Button>
      </div>
    </div>
  );
}

function ActionConfigEditor({ actionType, config, onChange }: { actionType: string; config: any; onChange: (config: any) => void }) {
  if (!actionType) return null;

  const updateConfig = (field: string, value: any) => {
    onChange({ ...config, [field]: value });
  };

  switch (actionType) {
    case "send_email":
      return (
        <div className="space-y-2">
          <div>
            <Label>Recipient</Label>
            <Input value={config.recipient || ""} onChange={(e) => updateConfig("recipient", e.target.value)} placeholder="email@example.com" />
          </div>
          <div>
            <Label>Subject</Label>
            <Input value={config.subject || ""} onChange={(e) => updateConfig("subject", e.target.value)} placeholder="Email subject" />
          </div>
          <div>
            <Label>Template</Label>
            <Textarea value={config.template || ""} onChange={(e) => updateConfig("template", e.target.value)} placeholder="Email content" rows={3} />
          </div>
        </div>
      );

    case "send_sms":
      return (
        <div className="space-y-2">
          <div>
            <Label>Phone Number</Label>
            <Input value={config.phone || ""} onChange={(e) => updateConfig("phone", e.target.value)} placeholder="+1234567890" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={config.message || ""} onChange={(e) => updateConfig("message", e.target.value)} placeholder="SMS message" rows={3} />
          </div>
        </div>
      );

    case "update_field":
      return (
        <div className="space-y-2">
          <div>
            <Label>Entity</Label>
            <Input value={config.entity || ""} onChange={(e) => updateConfig("entity", e.target.value)} placeholder="e.g., order, user" />
          </div>
          <div>
            <Label>Entity ID</Label>
            <Input value={config.entityId || ""} onChange={(e) => updateConfig("entityId", e.target.value)} placeholder="Entity ID" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Field</Label>
              <Input value={config.field || ""} onChange={(e) => updateConfig("field", e.target.value)} placeholder="Field name" />
            </div>
            <div>
              <Label>Value</Label>
              <Input value={config.value || ""} onChange={(e) => updateConfig("value", e.target.value)} placeholder="New value" />
            </div>
          </div>
        </div>
      );

    case "call_webhook":
      return (
        <div className="space-y-2">
          <div>
            <Label>URL</Label>
            <Input value={config.url || ""} onChange={(e) => updateConfig("url", e.target.value)} placeholder="https://api.example.com/webhook" />
          </div>
          <div>
            <Label>Method</Label>
            <Select value={config.method || "POST"} onValueChange={(value) => updateConfig("method", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case "create_task":
      return (
        <div className="space-y-2">
          <div>
            <Label>Title</Label>
            <Input value={config.title || ""} onChange={(e) => updateConfig("title", e.target.value)} placeholder="Task title" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={config.description || ""} onChange={(e) => updateConfig("description", e.target.value)} placeholder="Task description" rows={2} />
          </div>
          <div>
            <Label>Assigned To</Label>
            <Input value={config.assignedTo || ""} onChange={(e) => updateConfig("assignedTo", e.target.value)} placeholder="User ID" />
          </div>
        </div>
      );

    case "add_tag":
      return (
        <div className="space-y-2">
          <div>
            <Label>Entity</Label>
            <Input value={config.entity || ""} onChange={(e) => updateConfig("entity", e.target.value)} placeholder="e.g., user" />
          </div>
          <div>
            <Label>Entity ID</Label>
            <Input value={config.entityId || ""} onChange={(e) => updateConfig("entityId", e.target.value)} placeholder="Entity ID" />
          </div>
          <div>
            <Label>Tag</Label>
            <Input value={config.tag || ""} onChange={(e) => updateConfig("tag", e.target.value)} placeholder="Tag name" />
          </div>
        </div>
      );

    case "suspend_user":
      return (
        <div className="space-y-2">
          <div>
            <Label>User ID</Label>
            <Input value={config.userId || ""} onChange={(e) => updateConfig("userId", e.target.value)} placeholder="User ID" />
          </div>
          <div>
            <Label>Reason</Label>
            <Textarea value={config.reason || ""} onChange={(e) => updateConfig("reason", e.target.value)} placeholder="Suspension reason" rows={2} />
          </div>
        </div>
      );

    case "send_notification":
      return (
        <div className="space-y-2">
          <div>
            <Label>User ID</Label>
            <Input value={config.userId || ""} onChange={(e) => updateConfig("userId", e.target.value)} placeholder="User ID" />
          </div>
          <div>
            <Label>Title</Label>
            <Input value={config.title || ""} onChange={(e) => updateConfig("title", e.target.value)} placeholder="Notification title" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={config.message || ""} onChange={(e) => updateConfig("message", e.target.value)} placeholder="Notification message" rows={2} />
          </div>
        </div>
      );

    default:
      return null;
  }
}
