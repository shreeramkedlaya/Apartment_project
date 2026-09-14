import React from 'react';
import { Check } from 'lucide-react';

export interface Step {
  id: number;
  title: string;
}

interface ModalStepperProps {
  steps: Step[];
  currentStep: number;
}

export const ModalStepper: React.FC<ModalStepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-start w-full max-w-[280px] mx-auto">
      {steps.map((s, i) => {
        const isActive = currentStep === s.id;
        const isCompleted = currentStep > s.id;

        return (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-2 w-16">
              {/* Step number */}
              <div
                className={`
                  w-5 h-5 rounded-full
                  flex items-center justify-center
                  text-[10px] font-semibold
                  transition-all duration-200
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : isCompleted
                      ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                      : 'bg-gray-100 text-gray-400 border border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : (
                  s.id
                )}
              </div>
              <span
                className={`
                  text-[11px] font-semibold whitespace-nowrap
                  transition-colors duration-200
                  ${isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : isCompleted
                      ? 'text-gray-700 dark:text-gray-200'
                      : 'text-gray-400 dark:text-gray-500'
                  }
                `}
              >
                {s.title}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-px mt-2.5 mx-2 rounded-full
                  transition-colors duration-300
                  ${isCompleted
                    ? 'bg-gray-300 dark:bg-gray-600'
                    : 'bg-gray-100 dark:bg-gray-800'
                  }
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
