"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { setProfile, FounderProfile } from "@/lib/storage";
import { today } from "@/lib/utils";
import Logo from "@/components/ui/Logo";
import FounderIdentityStep from "@/components/onboarding/steps/FounderIdentity";
import BusinessModelStep from "@/components/onboarding/steps/BusinessModel";
import BrandAudienceStep from "@/components/onboarding/steps/BrandAudience";
import OperationsStep from "@/components/onboarding/steps/Operations";
import FounderPerformanceStep from "@/components/onboarding/steps/FounderPerformance";
import OnboardingComplete from "@/components/onboarding/OnboardingComplete";

const STEPS = [
  { id: 1, label: "Founder Identity", subtitle: "Who are you as a founder?" },
  { id: 2, label: "Business Model", subtitle: "How do you make money?" },
  { id: 3, label: "Brand & Audience", subtitle: "How are you positioned?" },
  { id: 4, label: "Operations", subtitle: "How do you operate?" },
  { id: 5, label: "Performance", subtitle: "How do you perform daily?" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState<Partial<FounderProfile>>({});
  const [isComplete, setIsComplete] = useState(false);

  const updateData = (data: Partial<FounderProfile>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const goNext = (data: Partial<FounderProfile>) => {
    updateData(data);
    setDirection(1);
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setIsComplete(true);
    }
  };

  const goBack = () => {
    setDirection(-1);
    setCurrentStep((s) => s - 1);
  };

  const handleComplete = (profile: FounderProfile) => {
    setProfile({ ...profile, createdAt: today() });
    router.push("/dashboard");
  };

  const progress = ((currentStep + (isComplete ? 1 : 0)) / STEPS.length) * 100;

  if (isComplete) {
    return (
      <OnboardingComplete
        profile={formData as FounderProfile}
        onComplete={handleComplete}
      />
    );
  }

  const stepComponents = [
    <FounderIdentityStep key={1} data={formData} onNext={goNext} />,
    <BusinessModelStep key={2} data={formData} onNext={goNext} onBack={goBack} />,
    <BrandAudienceStep key={3} data={formData} onNext={goNext} onBack={goBack} />,
    <OperationsStep key={4} data={formData} onNext={goNext} onBack={goBack} />,
    <FounderPerformanceStep key={5} data={formData} onNext={goNext} onBack={goBack} />,
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Logo />
          <span className="text-xs text-muted">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-6 pt-4">
        <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="mt-4 flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex-1">
              <div
                className={`h-0.5 rounded-full transition-colors duration-300 ${
                  i <= currentStep ? "bg-accent" : "bg-border"
                }`}
              />
              {i === currentStep && (
                <p className="text-xs text-accent-bright mt-1 font-medium">{s.label}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="max-w-2xl w-full">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {stepComponents[currentStep]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
