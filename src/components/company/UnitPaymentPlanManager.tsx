import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface PaymentPlan {
  id: string;
  plan_name: string;
  is_active: boolean;
  sort_order: number;
  steps: PaymentStep[];
}

interface PaymentStep {
  id: string;
  percentage: number;
  title: string;
  subtitle: string | null;
  sort_order: number;
}

interface UnitPaymentPlanManagerProps {
  unitId: string;
  unitName: string;
}

const UnitPaymentPlanManager = ({ unitId, unitName }: UnitPaymentPlanManagerProps) => {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    const { data: plansData } = await supabase
      .from("unit_payment_plans")
      .select("*")
      .eq("unit_id", unitId)
      .order("sort_order");

    if (!plansData || plansData.length === 0) {
      setPlans([]);
      setLoading(false);
      return;
    }

    const planIds = plansData.map((p: any) => p.id);
    const { data: stepsData } = await supabase
      .from("unit_payment_plan_steps")
      .select("*")
      .in("plan_id", planIds)
      .order("sort_order");

    const plansWithSteps: PaymentPlan[] = plansData.map((p: any) => ({
      ...p,
      steps: (stepsData || []).filter((s: any) => s.plan_id === p.id),
    }));

    setPlans(plansWithSteps);
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, [unitId]);

  const addPlan = async () => {
    const planName = `Option ${plans.length + 1}`;
    const { error } = await supabase.from("unit_payment_plans").insert({
      unit_id: unitId,
      plan_name: planName,
      sort_order: plans.length,
      is_active: false,
    });
    if (error) toast.error("Failed to add plan");
    else { toast.success("Payment plan added"); fetchPlans(); setExpanded(true); }
  };

  const toggleActive = async (plan: PaymentPlan) => {
    const { error } = await supabase
      .from("unit_payment_plans")
      .update({ is_active: !plan.is_active })
      .eq("id", plan.id);
    if (error) toast.error("Failed to update");
    else fetchPlans();
  };

  const updatePlanName = async (planId: string, name: string) => {
    await supabase.from("unit_payment_plans").update({ plan_name: name }).eq("id", planId);
  };

  const deletePlan = async (planId: string) => {
    const { error } = await supabase.from("unit_payment_plans").delete().eq("id", planId);
    if (error) toast.error("Failed to delete plan");
    else { toast.success("Plan deleted"); fetchPlans(); }
  };

  const addStep = async (planId: string, currentSteps: PaymentStep[]) => {
    const { error } = await supabase.from("unit_payment_plan_steps").insert({
      plan_id: planId,
      percentage: 0,
      title: "",
      subtitle: null,
      sort_order: currentSteps.length,
    });
    if (error) toast.error("Failed to add step");
    else fetchPlans();
  };

  const updateStep = async (stepId: string, field: string, value: any) => {
    await supabase.from("unit_payment_plan_steps").update({ [field]: value }).eq("id", stepId);
  };

  const deleteStep = async (stepId: string) => {
    const { error } = await supabase.from("unit_payment_plan_steps").delete().eq("id", stepId);
    if (error) toast.error("Failed to delete step");
    else fetchPlans();
  };

  const activePlans = plans.filter(p => p.is_active).length;

  return (
    <div className="border border-border rounded-lg bg-muted/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
          <span className="text-sm font-medium text-foreground">Payment Plans</span>
          {plans.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {plans.length} plan{plans.length !== 1 ? "s" : ""}{activePlans > 0 ? ` • ${activePlans} active` : ""}
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={(e) => { e.stopPropagation(); addPlan(); }}
        >
          <Plus className="h-3 w-3 mr-1" /> Add Plan
        </Button>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {loading ? (
            <p className="text-xs text-muted-foreground py-2">Loading...</p>
          ) : plans.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No payment plans yet. Add one to display installment options on this unit.</p>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="border border-border rounded-lg bg-card p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Input
                    defaultValue={plan.plan_name}
                    onBlur={(e) => updatePlanName(plan.id, e.target.value)}
                    className="h-8 text-sm font-medium max-w-[200px] bg-secondary/50"
                  />
                  <div className="flex items-center gap-2 ml-auto">
                    <Label className="text-xs text-muted-foreground cursor-pointer" htmlFor={`active-${plan.id}`}>
                      {plan.is_active ? "Active" : "Inactive"}
                    </Label>
                    <Switch
                      id={`active-${plan.id}`}
                      checked={plan.is_active}
                      onCheckedChange={() => toggleActive(plan)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deletePlan(plan.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-2">
                  {plan.steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-20">
                          <Input
                            type="number"
                            defaultValue={step.percentage}
                            onBlur={(e) => updateStep(step.id, "percentage", parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs text-center bg-secondary/50"
                            placeholder="%"
                          />
                        </div>
                        <Input
                          defaultValue={step.title}
                          onBlur={(e) => updateStep(step.id, "title", e.target.value)}
                          className="h-7 text-xs bg-secondary/50 flex-1"
                          placeholder="e.g. Down payment"
                        />
                        <Input
                          defaultValue={step.subtitle || ""}
                          onBlur={(e) => updateStep(step.id, "subtitle", e.target.value || null)}
                          className="h-7 text-xs bg-secondary/50 flex-1"
                          placeholder="e.g. At sales launch"
                        />
                      </div>
                      {idx < plan.steps.length - 1 && (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 hidden sm:block" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive shrink-0"
                        onClick={() => deleteStep(step.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => addStep(plan.id, plan.steps)}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Step
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UnitPaymentPlanManager;
