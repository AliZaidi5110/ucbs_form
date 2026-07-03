"use client";

import { ONBOARDING_STEPS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function StepIndicator({
  currentStep,
  onStepClick,
  readOnly,
}: {
  currentStep: number;
  onStepClick?: (step: number) => void;
  readOnly?: boolean;
}) {
  const progress = Math.round((currentStep / ONBOARDING_STEPS.length) * 100);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Progress
          </p>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">
            Step {currentStep} of {ONBOARDING_STEPS.length} · {ONBOARDING_STEPS[currentStep - 1]?.title}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-[#1e3a5f]">{progress}%</span>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#1e3a5f] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="hidden sm:flex items-center justify-between gap-1">
        {ONBOARDING_STEPS.map((step) => {
          const isActive = step.id === currentStep;
          const isComplete = step.id < currentStep;
          const clickable = onStepClick && (!readOnly || readOnly);

          return (
            <button
              key={step.id}
              type="button"
              disabled={!clickable}
              onClick={() => onStepClick?.(step.id)}
              title={step.title}
              className={cn(
                "flex flex-col items-center gap-1.5 flex-1 min-w-0 group",
                clickable && "cursor-pointer"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all",
                  isActive && "bg-[#1e3a5f] text-white ring-4 ring-[#e8eef5]",
                  isComplete && !isActive && "bg-emerald-100 text-emerald-700",
                  !isActive && !isComplete && "bg-slate-100 text-slate-400",
                  clickable && !isActive && "group-hover:ring-2 group-hover:ring-slate-200"
                )}
              >
                {isComplete && !isActive ? <Check className="h-4 w-4" /> : step.id}
              </span>
              <span
                className={cn(
                  "text-[10px] leading-tight text-center truncate w-full hidden lg:block",
                  isActive ? "text-[#1e3a5f] font-medium" : "text-slate-500"
                )}
              >
                {step.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
