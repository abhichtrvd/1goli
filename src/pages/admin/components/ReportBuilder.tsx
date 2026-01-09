import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface ReportBuilderProps {
  report?: any;
  onSave: () => void;
  onCancel: () => void;
}

const DATA_SOURCE_OPTIONS = [
  { value: "orders", label: "Orders", fields: ["_id", "_creationTime", "userId", "total", "status", "itemCount", "paymentMethod", "paymentStatus"] },
  { value: "products", label: "Products", fields: ["_id", "_creationTime", "name", "brand", "sku", "basePrice", "stock", "category", "averageRating", "ratingCount"] },
  { value: "users", label: "Users", fields: ["_id", "_creationTime", "name", "email", "phone", "role", "emailVerified", "suspended", "lastActiveAt"] },
  { value: "prescriptions", label: "Prescriptions", fields: ["_id", "_creationTime", "userId", "patientName", "patientPhone", "status", "doctorName", "diagnosis", "medicineCount"] },
  { value: "consultationDoctors", label: "Doctors", fields: ["_id", "_creationTime", "name", "specialization", "experienceYears", "rating", "totalConsultations", "clinicCity"] },
];

const OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Not Contains" },
  { value: "gt", label: "Greater Than" },
  { value: "gte", label: "Greater Than or Equal" },
  { value: "lt", label: "Less Than" },
  { value: "lte", label: "Less Than or Equal" },
  { value: "between", label: "Between" },
];

const AGGREGATION_FUNCTIONS = [
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "count", label: "Count" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
];

export function ReportBuilder({ report, onSave, onCancel }: ReportBuilderProps) {
  const [name, setName] = useState(report?.name || "");
  const [description, setDescription] = useState(report?.description || "");
  const [type, setType] = useState<string>(report?.type || "sales");
  const [dataSource, setDataSource] = useState(report?.dataSource || "orders");
  const [filters, setFilters] = useState<any[]>(report?.filters || []);
  const [groupBy, setGroupBy] = useState(report?.groupBy || "");
  const [aggregations, setAggregations] = useState<any[]>(report?.aggregations || []);
  const [columns, setColumns] = useState<string[]>(report?.columns || []);
  const [sortBy, setSortBy] = useState(report?.sortBy || "");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(report?.sortOrder || "asc");
  const [chartType, setChartType] = useState<string>(report?.chartType || "table");
  const [isPublic, setIsPublic] = useState(report?.isPublic || false);
  const [isSaving, setIsSaving] = useState(false);

  const createReport = useMutation(api.reports.createReport);
  const updateReport = useMutation(api.reports.updateReport);

  const selectedDataSource = DATA_SOURCE_OPTIONS.find(ds => ds.value === dataSource);
  const availableFields = selectedDataSource?.fields || [];

  const handleAddFilter = () => {
    setFilters([...filters, { field: "", operator: "equals", value: "" }]);
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleFilterChange = (index: number, key: string, value: any) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [key]: value };
    setFilters(newFilters);
  };

  const handleAddAggregation = () => {
    setAggregations([...aggregations, { field: "", function: "sum", label: "" }]);
  };

  const handleRemoveAggregation = (index: number) => {
    setAggregations(aggregations.filter((_, i) => i !== index));
  };

  const handleAggregationChange = (index: number, key: string, value: any) => {
    const newAggregations = [...aggregations];
    newAggregations[index] = { ...newAggregations[index], [key]: value };
    setAggregations(newAggregations);
  };

  const handleColumnToggle = (field: string) => {
    if (columns.includes(field)) {
      setColumns(columns.filter(c => c !== field));
    } else {
      setColumns([...columns, field]);
    }
  };

  const handleSave = async () => {
    if (!name) {
      toast.error("Please enter a report name");
      return;
    }

    if (columns.length === 0) {
      toast.error("Please select at least one column");
      return;
    }

    setIsSaving(true);
    try {
      if (report?._id) {
        await updateReport({
          reportId: report._id as Id<"reports">,
          name,
          description,
          type: type as any,
          dataSource,
          filters: filters.filter(f => f.field && f.operator),
          groupBy: groupBy || undefined,
          aggregations: aggregations.filter(a => a.field && a.function),
          columns,
          sortBy: sortBy || undefined,
          sortOrder,
          chartType: chartType as any,
          isPublic,
        });
        toast.success("Report updated successfully");
      } else {
        await createReport({
          name,
          description,
          type: type as any,
          dataSource,
          filters: filters.filter(f => f.field && f.operator),
          groupBy: groupBy || undefined,
          aggregations: aggregations.filter(a => a.field && a.function),
          columns,
          sortBy: sortBy || undefined,
          sortOrder,
          chartType: chartType as any,
          isPublic,
        });
        toast.success("Report created successfully");
      }
      onSave();
    } catch (error: any) {
      toast.error(`Failed to save report: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Report Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Monthly Sales Report"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Report Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="inventory">Inventory</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="order">Order</SelectItem>
              <SelectItem value="doctor">Doctor</SelectItem>
              <SelectItem value="prescription">Prescription</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this report shows..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dataSource">Data Source</Label>
        <Select value={dataSource} onValueChange={setDataSource}>
          <SelectTrigger id="dataSource">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATA_SOURCE_OPTIONS.map(ds => (
              <SelectItem key={ds.value} value={ds.value}>{ds.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label>Filters</Label>
            <Button variant="outline" size="sm" onClick={handleAddFilter}>
              <Plus className="mr-2 h-4 w-4" />
              Add Filter
            </Button>
          </div>

          {filters.map((filter, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1 space-y-2">
                <Label>Field</Label>
                <Select
                  value={filter.field}
                  onValueChange={(value) => handleFilterChange(index, "field", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.map(field => (
                      <SelectItem key={field} value={field}>{field}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-2">
                <Label>Operator</Label>
                <Select
                  value={filter.operator}
                  onValueChange={(value) => handleFilterChange(index, "operator", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map(op => (
                      <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-2">
                <Label>Value</Label>
                <Input
                  value={filter.value}
                  onChange={(e) => handleFilterChange(index, "value", e.target.value)}
                  placeholder="Filter value"
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveFilter(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Label>Columns to Display</Label>
          <div className="grid grid-cols-3 gap-3">
            {availableFields.map(field => (
              <div key={field} className="flex items-center space-x-2">
                <Checkbox
                  id={`column-${field}`}
                  checked={columns.includes(field)}
                  onCheckedChange={() => handleColumnToggle(field)}
                />
                <Label
                  htmlFor={`column-${field}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {field}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {report ? "Update Report" : "Create Report"}
        </Button>
      </div>
    </div>
  );
}
