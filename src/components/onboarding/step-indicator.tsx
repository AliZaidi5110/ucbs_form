"use client";

import { ONBOARDING_STEPS } from "@/lib/constants";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function StepIndicator({
  currentStep,
  onStepClick,
  readOnly,
}: {
  currentStep: number;
  onStepClick?: (step: number) => void;
  readOnly?: boolean;
}) {
  const progress = (currentStep / ONBOARDING_STEPS.length) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          Step {currentStep} of {ONBOARDING_STEPS.length}
        </span>
        <span className="font-medium text-slate-800">
          {ONBOARDING_STEPS[currentStep - 1]?.title}
        </span>
      </div>
      <Progress value={progress} />
      <div className="hidden gap-1 md:grid md:grid-cols-5 lg:grid-cols-9">
        {ONBOARDING_STEPS.map((step) => {
          const isActive = step.id === currentStep;
          const isComplete = step.id < currentStep;
          return (
            <button
              key={step.id}
              type="button"
              disabled={readOnly && !onStepClick}
              onClick={() => onStepClick?.(step.id)}
              className={cn(
                "rounded px-1 py-2 text-center text-[10px] leading-tight transition-colors lg:text-xs",
                isActive && "bg-slate-800 text-white",
                isComplete && !isActive && "bg-slate-200 text-slate-700",
                !isActive && !isComplete && "bg-slate-50 text-slate-500",
                onStepClick && !readOnly && "cursor-pointer hover:opacity-90"
              )}
            >
              {step.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
