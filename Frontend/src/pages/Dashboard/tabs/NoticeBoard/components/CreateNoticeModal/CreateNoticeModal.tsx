import Modal from '@/components/ui/Modal';
import { AlertCircle, Calendar, ChevronLeft, ChevronRight, Loader2, Megaphone, Save, Send } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import ContentSection from './components/ContentSection';
import ModalStepper from './components/ModalStepper';
import SchedulingSection from './components/SchedulingSection';
import TargetAudienceSection from './components/TargetAudienceSection';
import { useNoticeForm } from './hooks/useNoticeForm';
import type { UseNoticeFormProps } from './types/noticeForm.types';
import { MODAL_STEPS } from './utils/noticeConstants';

const CreateNoticeModal: React.FC<UseNoticeFormProps> = ({
  isOpen,
  onClose,
  editNotice,
  onNoticeCreated,
  onNoticeUpdated,
}) => {
  const {
    formData,
    updateField,
    setFormData,
    availableRoles,
    availableBlocks,
    loading,
    isDirty,
    handleSubmit,
    resetForm,
  } = useNoticeForm({ isOpen, editNotice, onNoticeCreated, onNoticeUpdated, onClose });

  const [step, setStep] = useState(1);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Reset step and form when modal closes/opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setShowExitConfirm(false);
    } else {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleRequestClose = () => {
    if (!editNotice && isDirty) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  const handleNext = () => setStep(s => Math.min(3, s + 1));
  const handleBack = () => setStep(s => Math.max(1, s - 1));

  const isStepValid = () => {
    if (step === 1) return formData.title.trim().length > 0 && formData.content.trim().length > 0;
    if (step === 2) {
      if (formData.audienceType === 'roles') return formData.targetRoles.length > 0;
      if (formData.audienceType === 'blocks') return formData.targetBlocks.length > 0 || formData.targetFlats.length > 0;
      return true;
    }
    if (step === 3) {
      if (formData.publishMode === 'scheduled') {
        if (!formData.publishDate) return false;
        if (new Date(formData.publishDate).getTime() <= Date.now()) return false;
      }
      return true;
    }
    return true;
  };

  const submitButtonLabel = editNotice
    ? 'Save Changes'
    : formData.publishMode === 'scheduled'
      ? 'Schedule Notice'
      : 'Publish Notice';

  const SubmitIcon = loading
    ? Loader2
    : editNotice
      ? Save
      : formData.publishMode === 'scheduled'
        ? Calendar
        : Send;

  const modalFooter = (
    <div className="flex items-center justify-between w-full">
      <button
        type="button"
        onClick={step === 1 ? handleRequestClose : handleBack}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400
        hover:text-gray-900 dark:hover:text-white hover:bg-gray-100
        dark:hover:bg-gray-800 rounded-xl transition-colors"
      >
        {step > 1 && <ChevronLeft className="w-4 h-4" />}
        {step === 1 ? 'Cancel' : 'Back'}
      </button>

      {step < 3 ? (
        <button
          type="button"
          onClick={handleNext}
          disabled={!isStepValid()}
          className="flex items-center gap-1.5 px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          disabled={loading || !isStepValid()}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700
          disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold
          rounded-xl transition-all shadow-sm active:scale-95"
        >
          <SubmitIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {submitButtonLabel}
        </button>
      )}
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleRequestClose}
        title={editNotice ? 'Edit Notice' : 'Create New Notice'}
        description={editNotice ? `Editing notice #${editNotice.id}` : 'Draft, schedule, or publish an announcement for residents and staff.'}
        icon={<Megaphone className="w-5 h-5" />}
        footer={modalFooter}
        maxWidth="2xl"
        compact
      >
        <div className="flex flex-col gap-3">
          <div className="pb-1">
            <ModalStepper steps={MODAL_STEPS} currentStep={step} />
          </div>

          <div className="min-h-[250px]">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <ContentSection
                  formData={formData}
                  updateField={updateField}
                  editNotice={!!editNotice}
                />
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <TargetAudienceSection
                  formData={formData}
                  updateField={updateField}
                  setFormData={setFormData}
                  availableRoles={availableRoles}
                  availableBlocks={availableBlocks}
                />
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <SchedulingSection
                  formData={formData}
                  updateField={updateField}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <Modal
          isOpen={showExitConfirm}
          onClose={() => setShowExitConfirm(false)}
          title="Discard Changes?"
          description="You have unsaved changes in this notice."
          icon={<AlertCircle className="w-5 h-5 text-amber-500" />}
          maxWidth="sm"
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="w-full sm:w-auto px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  onClose();
                }}
                className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                Discard Changes
              </button>
            </div>
          }
        >
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to close? All entered information will be discarded.
          </p>
        </Modal>
      )}
    </>
  );
};

export default CreateNoticeModal;
