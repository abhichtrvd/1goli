import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Play, Edit, Trash2, AlertCircle, Plus, Activity, CheckCircle2, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WorkflowBuilder } from "./components/WorkflowBuilder";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function AdminWorkflows() {
  const workflows = useQuery(api.workflows.getWorkflows);
  const createWorkflow = useMutation(api.workflows.createWorkflow);
  const updateWorkflow = useMutation(api.workflows.updateWorkflow);
  const deleteWorkflow = useMutation(api.workflows.deleteWorkflow);
  const toggleWorkflow = useMutation(api.workflows.toggleWorkflow);
  const testWorkflow = useAction(api.workflows.testWorkflow);
  const workflowExecutions = useQuery(api.workflows.getWorkflowExecutions, { limit: 10 });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [triggerType, setTriggerType] = useState<"order_placed" | "user_registered" | "product_low_stock" | "review_submitted" | "order_delivered" | "payment_received">("order_placed");
  const [actionType, setActionType] = useState<"send_email" | "update_status" | "create_task" | "webhook_call" | "tag_user" | "send_notification">("send_email");
  const [actionConfig, setActionConfig] = useState("{}");

  const handleCreateWorkflow = async () => {
    if (!workflowName) {
      toast.error("Please enter a workflow name");
      return;
    }

    try {
      let parsedConfig;
      try {
        parsedConfig = JSON.parse(actionConfig);
      } catch {
        toast.error("Invalid JSON in action config");
        return;
      }

      await createWorkflow({
        name: workflowName,
        description: workflowDescription,
        trigger: {
          type: triggerType,
        },
        actions: [
          {
            type: actionType,
            config: parsedConfig,
          },
        ],
      });

      toast.success("Workflow created");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggle = async (workflowId: Id<"workflows">, isActive: boolean) => {
    try {
      await toggleWorkflow({ workflowId, isActive: !isActive });
      toast.success(isActive ? "Workflow deactivated" : "Workflow activated");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (workflowId: Id<"workflows">) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;

    try {
      await deleteWorkflow({ workflowId });
      toast.success("Workflow deleted");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleTest = async (workflowId: Id<"workflows">) => {
    try {
      const result = await testWorkflow({
        workflowId,
        testData: { test: true, timestamp: Date.now() },
      });

      toast.success(`Test complete: ${result.conditionsMet ? "Conditions met" : "Conditions not met"}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setWorkflowName("");
    setWorkflowDescription("");
    setTriggerType("order_placed");
    setActionType("send_email");
    setActionConfig("{}");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Workflow Automation</h1>
          <p className="text-muted-foreground">Automate business processes with custom workflows</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Workflow</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Workflow Name</Label>
                <Input value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} placeholder="Order Confirmation Workflow" />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={workflowDescription} onChange={(e) => setWorkflowDescription(e.target.value)} placeholder="Send email when order is placed..." />
              </div>

              <div className="space-y-2">
                <Label>Trigger Event</Label>
                <Select value={triggerType} onValueChange={(v: any) => setTriggerType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order_placed">Order Placed</SelectItem>
                    <SelectItem value="user_registered">User Registered</SelectItem>
                    <SelectItem value="product_low_stock">Product Low Stock</SelectItem>
                    <SelectItem value="review_submitted">Review Submitted</SelectItem>
                    <SelectItem value="order_delivered">Order Delivered</SelectItem>
                    <SelectItem value="payment_received">Payment Received</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Action Type</Label>
                <Select value={actionType} onValueChange={(v: any) => setActionType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="send_email">Send Email</SelectItem>
                    <SelectItem value="update_status">Update Status</SelectItem>
                    <SelectItem value="create_task">Create Task</SelectItem>
                    <SelectItem value="webhook_call">Webhook Call</SelectItem>
                    <SelectItem value="tag_user">Tag User</SelectItem>
                    <SelectItem value="send_notification">Send Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Action Config (JSON)</Label>
                <Textarea
                  value={actionConfig}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setActionConfig(e.target.value)}
                  placeholder='{"email": "admin@example.com", "subject": "New Order"}'
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateWorkflow}>Create Workflow</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflows?.map((workflow: any) => (
                <div key={workflow._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{workflow.name}</h3>
                      <Badge variant={workflow.isActive ? "default" : "secondary"}>
                        {workflow.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {workflow.executionCount && workflow.executionCount > 0 && (
                        <Badge variant="outline">
                          <Activity className="w-3 h-3 mr-1" />
                          {workflow.executionCount} executions
                        </Badge>
                      )}
                    </div>
                    {workflow.description && (
                      <p className="text-sm text-muted-foreground">{workflow.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Trigger: {workflow.trigger.type.replace(/_/g, " ")}</span>
                      <span>Actions: {workflow.actions.length}</span>
                      {workflow.lastExecutedAt && (
                        <span>Last run: {new Date(workflow.lastExecutedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={workflow.isActive}
                      onCheckedChange={() => handleToggle(workflow._id, workflow.isActive)}
                    />
                    <Button size="sm" variant="outline" onClick={() => handleTest(workflow._id)}>
                      <Play className="w-4 h-4 mr-2" />
                      Test
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(workflow._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {workflows?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No workflows yet. Create one to automate your processes.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workflowExecutions?.map((execution: any) => (
                <div key={execution._id} className="flex items-center justify-between text-sm p-2 border rounded">
                  <div>
                    <span className="font-medium">Trigger: {execution.triggerType.replace(/_/g, " ")}</span>
                    <span className="text-muted-foreground mx-2">•</span>
                    <span>{new Date(execution.executedAt).toLocaleString()}</span>
                  </div>
                  <Badge variant={execution.status === "success" ? "default" : "destructive"}>
                    {execution.status}
                  </Badge>
                </div>
              ))}

              {workflowExecutions?.length === 0 && (
                <p className="text-center py-4 text-muted-foreground">No executions yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
