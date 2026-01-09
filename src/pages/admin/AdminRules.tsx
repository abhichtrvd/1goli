import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Plus, Trash2, Shield, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function AdminRules() {
  const rules = useQuery(api.rules.getRules);
  const createRule = useMutation(api.rules.createRule);
  const deleteRule = useMutation(api.rules.deleteRule);
  const toggleRule = useMutation(api.rules.toggleRule);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleDescription, setRuleDescription] = useState("");
  const [ruleType, setRuleType] = useState<"pricing" | "inventory" | "user_segment" | "order_validation">("pricing");
  const [priority, setPriority] = useState(1);
  const [conditionField, setConditionField] = useState("total");
  const [conditionOperator, setConditionOperator] = useState("gt");
  const [conditionValue, setConditionValue] = useState("100");
  const [actionType, setActionType] = useState("apply_discount");
  const [actionConfig, setActionConfig] = useState('{"discountPercent": 10}');

  const handleCreateRule = async () => {
    if (!ruleName) {
      toast.error("Please enter a rule name");
      return;
    }

    try {
      let parsedConfig;
      let parsedValue;

      try {
        parsedConfig = JSON.parse(actionConfig);
      } catch {
        toast.error("Invalid JSON in action config");
        return;
      }

      try {
        parsedValue = JSON.parse(conditionValue);
      } catch {
        parsedValue = conditionValue;
      }

      await createRule({
        name: ruleName,
        description: ruleDescription,
        ruleType,
        priority,
        conditions: [
          {
            field: conditionField,
            operator: conditionOperator,
            value: parsedValue,
          },
        ],
        actions: [
          {
            type: actionType,
            config: parsedConfig,
          },
        ],
      });

      toast.success("Rule created");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggle = async (ruleId: Id<"rules">, isActive: boolean) => {
    try {
      await toggleRule({ ruleId, isActive: !isActive });
      toast.success(isActive ? "Rule deactivated" : "Rule activated");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (ruleId: Id<"rules">) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      await deleteRule({ ruleId });
      toast.success("Rule deleted");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setRuleName("");
    setRuleDescription("");
    setRuleType("pricing");
    setPriority(1);
    setConditionField("total");
    setConditionOperator("gt");
    setConditionValue("100");
    setActionType("apply_discount");
    setActionConfig('{"discountPercent": 10}');
  };

  const groupedRules = rules?.reduce((acc: any, rule) => {
    if (!acc[rule.ruleType]) acc[rule.ruleType] = [];
    acc[rule.ruleType].push(rule);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Business Rules</h1>
          <p className="text-muted-foreground">Define and manage business logic rules</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Business Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="High Value Order Discount" />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={ruleDescription} onChange={(e) => setRuleDescription(e.target.value)} placeholder="Apply 10% discount on orders over $100..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rule Type</Label>
                  <Select value={ruleType} onValueChange={(v: any) => setRuleType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pricing">Pricing</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="user_segment">User Segment</SelectItem>
                      <SelectItem value="order_validation">Order Validation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority (1-10)</Label>
                  <Input type="number" min="1" max="10" value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Condition</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input value={conditionField} onChange={(e) => setConditionField(e.target.value)} placeholder="Field" />
                  <Select value={conditionOperator} onValueChange={setConditionOperator}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="gt">Greater Than</SelectItem>
                      <SelectItem value="lt">Less Than</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={conditionValue} onChange={(e) => setConditionValue(e.target.value)} placeholder="Value" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Action Type</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apply_discount">Apply Discount</SelectItem>
                    <SelectItem value="reorder_stock">Reorder Stock</SelectItem>
                    <SelectItem value="assign_segment">Assign Segment</SelectItem>
                    <SelectItem value="block_order">Block Order</SelectItem>
                    <SelectItem value="send_alert">Send Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Action Config (JSON)</Label>
                <Textarea
                  value={actionConfig}
                  onChange={(e) => setActionConfig(e.target.value)}
                  placeholder='{"discountPercent": 10}'
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateRule}>Create Rule</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {["pricing", "inventory", "user_segment", "order_validation"].map((type) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {groupedRules?.[type]?.map((rule: any) => (
                  <div key={rule._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{rule.name}</h3>
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">Priority: {rule.priority}</Badge>
                        {rule.executionCount && rule.executionCount > 0 && (
                          <Badge variant="outline">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {rule.executionCount} executions
                          </Badge>
                        )}
                      </div>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Conditions: {rule.conditions.length}</span>
                        <span>Actions: {rule.actions.length}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => handleToggle(rule._id, rule.isActive)}
                      />
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(rule._id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {(!groupedRules?.[type] || groupedRules[type].length === 0) && (
                  <p className="text-center py-4 text-muted-foreground">
                    No {type.replace(/_/g, " ")} rules yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
