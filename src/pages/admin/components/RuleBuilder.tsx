import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

const RULE_TYPES = [
  { value: "validation", label: "Validation Rule", description: "Validate before processing" },
  { value: "pricing", label: "Pricing Rule", description: "Dynamic pricing based on conditions" },
  { value: "routing", label: "Routing Rule", description: "Route orders to warehouses" },
  { value: "automation", label: "Automation Rule", description: "Auto-apply actions" },
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
  { value: "between", label: "Between" },
];

const ACTION_TYPES = {
  validation: [
    { value: "block_order", label: "Block Order" },
    { value: "send_alert", label: "Send Alert" },
  ],
  pricing: [
    { value: "apply_discount", label: "Apply Discount" },
    { value: "set_price", label: "Set Price" },
  ],
  routing: [
    { value: "route_to_warehouse", label: "Route to Warehouse" },
    { value: "assign_user", label: "Assign to User" },
  ],
  automation: [
    { value: "apply_discount", label: "Apply Discount" },
    { value: "reorder_stock", label: "Reorder Stock" },
    { value: "assign_segment", label: "Assign Segment" },
    { value: "send_alert", label: "Send Alert" },
  ],
};

interface Condition {
  field: string;
  operator: string;
  value: any;
  value2?: any;
  logicalOperator?: "AND" | "OR";
}

interface Action {
  type: string;
  config: any;
}

interface RuleBuilderProps {
  initialData?: {
    name: string;
    description?: string;
    ruleType: "validation" | "pricing" | "routing" | "automation";
    conditions: Condition[];
    actions: Action[];
    priority: number;
  };
  onSave: (rule: any) => void;
  onCancel: () => void;
}

export function RuleBuilder({ initialData, onSave, onCancel }: RuleBuilderProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [ruleType, setRuleType] = useState<"validation" | "pricing" | "routing" | "automation">(initialData?.ruleType || "validation");
  const [priority, setPriority] = useState(initialData?.priority || 0);
  const [conditions, setConditions] = useState<Condition[]>(initialData?.conditions || []);
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
    setActions([...actions, { type: "", config: {} }]);
  };

  const updateAction = (index: number, type: string, config: any) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], type, config };
    setActions(updated);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({
      name,
      description,
      ruleType,
      conditions,
      actions,
      priority,
    });
  };

  const availableActions = ACTION_TYPES[ruleType] || [];

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Rule Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., High Value Order Discount" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this rule do?" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ruleType">Rule Type</Label>
              <Select value={ruleType} onValueChange={(value: any) => setRuleType(value)}>
                <SelectTrigger id="ruleType">
                  <SelectValue placeholder="Select rule type" />
                </SelectTrigger>
                <SelectContent>
                  {RULE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority (Higher = First)</Label>
              <Input id="priority" type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} placeholder="0" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Conditions</CardTitle>
            <Button onClick={addCondition} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {conditions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conditions. Rule will always apply.</p>
          ) : (
            conditions.map((condition, index) => (
              <div key={index} className="space-y-2">
                {index > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 border-t"></div>
                    <Select value={condition.logicalOperator} onValueChange={(value) => updateCondition(index, "logicalOperator", value as "AND" | "OR")}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex-1 border-t"></div>
                  </div>
                )}
                <div className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div>
                      <Input placeholder="Field (e.g., total, status)" value={condition.field} onChange={(e) => updateCondition(index, "field", e.target.value)} />
                    </div>
                    <div>
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
                    </div>
                    <div>
                      <Input placeholder="Value" value={condition.value} onChange={(e) => updateCondition(index, "value", e.target.value)} />
                    </div>
                  </div>
                  {condition.operator === "between" && (
                    <Input placeholder="Value 2" value={condition.value2 || ""} onChange={(e) => updateCondition(index, "value2", e.target.value)} className="w-32" />
                  )}
                  <Button onClick={() => removeCondition(index)} variant="destructive" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
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
                  <Badge variant="secondary">Action {index + 1}</Badge>
                  <Button onClick={() => removeAction(index)} variant="ghost" size="sm">
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div>
                  <Label>Action Type</Label>
                  <Select value={action.type} onValueChange={(value) => updateAction(index, value, action.config)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action type" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableActions.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <RuleActionConfig actionType={action.type} config={action.config} onChange={(config) => updateAction(index, action.type, config)} />
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
        <Button onClick={handleSave} disabled={!name || !ruleType || conditions.length === 0 || actions.length === 0}>
          Save Rule
        </Button>
      </div>
    </div>
  );
}

function RuleActionConfig({ actionType, config, onChange }: { actionType: string; config: any; onChange: (config: any) => void }) {
  if (!actionType) return null;

  const updateConfig = (field: string, value: any) => {
    onChange({ ...config, [field]: value });
  };

  switch (actionType) {
    case "apply_discount":
      return (
        <div className="space-y-2">
          <div>
            <Label>Discount Percent</Label>
            <Input type="number" value={config.discountPercent || ""} onChange={(e) => updateConfig("discountPercent", Number(e.target.value))} placeholder="10" />
          </div>
        </div>
      );

    case "block_order":
      return (
        <div className="space-y-2">
          <div>
            <Label>Reason</Label>
            <Textarea value={config.reason || ""} onChange={(e) => updateConfig("reason", e.target.value)} placeholder="Why is this order blocked?" rows={2} />
          </div>
        </div>
      );

    case "send_alert":
      return (
        <div className="space-y-2">
          <div>
            <Label>Alert Type</Label>
            <Input value={config.alertType || ""} onChange={(e) => updateConfig("alertType", e.target.value)} placeholder="e.g., low_stock, high_value" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={config.message || ""} onChange={(e) => updateConfig("message", e.target.value)} placeholder="Alert message" rows={2} />
          </div>
          <div>
            <Label>Recipients</Label>
            <Input value={config.recipients || ""} onChange={(e) => updateConfig("recipients", e.target.value)} placeholder="email1@example.com, email2@example.com" />
          </div>
        </div>
      );

    case "route_to_warehouse":
      return (
        <div className="space-y-2">
          <div>
            <Label>Warehouse</Label>
            <Input value={config.warehouse || ""} onChange={(e) => updateConfig("warehouse", e.target.value)} placeholder="Warehouse name/ID" />
          </div>
          <div>
            <Label>Location</Label>
            <Input value={config.location || ""} onChange={(e) => updateConfig("location", e.target.value)} placeholder="Location/City" />
          </div>
        </div>
      );

    case "reorder_stock":
      return (
        <div className="space-y-2">
          <div>
            <Label>Reorder Quantity</Label>
            <Input type="number" value={config.reorderQuantity || ""} onChange={(e) => updateConfig("reorderQuantity", Number(e.target.value))} placeholder="100" />
          </div>
        </div>
      );

    case "assign_segment":
      return (
        <div className="space-y-2">
          <div>
            <Label>Segment</Label>
            <Select value={config.segment || ""} onValueChange={(value) => updateConfig("segment", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case "assign_user":
      return (
        <div className="space-y-2">
          <div>
            <Label>User ID</Label>
            <Input value={config.userId || ""} onChange={(e) => updateConfig("userId", e.target.value)} placeholder="User ID to assign to" />
          </div>
        </div>
      );

    case "set_price":
      return (
        <div className="space-y-2">
          <div>
            <Label>New Price</Label>
            <Input type="number" value={config.price || ""} onChange={(e) => updateConfig("price", Number(e.target.value))} placeholder="99.99" />
          </div>
        </div>
      );

    default:
      return null;
  }
}
