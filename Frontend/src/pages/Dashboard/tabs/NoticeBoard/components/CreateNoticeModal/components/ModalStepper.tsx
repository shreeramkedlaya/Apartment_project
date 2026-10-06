import React from 'react';
import { Check } from 'lucide-react';
import type { Step } from '../types/noticeForm.types';

interface ModalStepperProps {
  steps: Step[];
  currentStep: number;
}

const ModalStepper: React.FC<ModalStepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-center w-full max-w-md mx-auto gap-1.5 sm:gap-2 py-0.5 select-none">
      {steps.map((s, i) => {
        const isActive = currentStep === s.id;
        const isCompleted = currentStep > s.id;

        return (
          <React.Fragment key={s.id}>
            {/* Step Chip */}
            <div
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-all duration-200 border
                ${isActive
                  ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-xs'
                  : isCompleted
                    ? 'bg-gray-100/80 dark:bg-gray-800/60 border-gray-200/60 dark:border-gray-700/60 text-gray-700 dark:text-gray-300'
                    : 'bg-transparent border-transparent text-gray-400 dark:text-gray-500'
                }
              `}
            >
              {/* Step indicator circle */}
              <div
                className={`
                  w-4 h-4 rounded-full
                  flex items-center justify-center
                  text-[10px] font-bold shrink-0
                  transition-all duration-200
                  ${isActive
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                      ? 'bg-blue-600 dark:bg-blue-500 text-white'
                      : 'bg-gray-200/80 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                ) : (
                  s.id
                )}
              </div>

              <span className="whitespace-nowrap text-[11px] sm:text-xs">
                {s.title}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                className={`
                  w-4 sm:w-8 h-px rounded-full
                  transition-colors duration-300
                  ${isCompleted
                    ? 'bg-blue-500/50 dark:bg-blue-400/50'
                    : 'bg-gray-200 dark:bg-gray-800'
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

export default ModalStepper;