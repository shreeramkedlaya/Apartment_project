import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2, Save, Send, ChevronRight, ChevronLeft, Megaphone, Calendar, AlertCircle } from 'lucide-react';
import { useNoticeForm } from './hooks/useNoticeForm';
import { ContentSection } from './components/ContentSection';
import { TargetAudienceSection } from './components/TargetAudienceSection';
import { SchedulingSection } from './components/SchedulingSection';
import type { UseNoticeFormProps } from './types/noticeForm.types';
import { ModalStepper } from './components/ModalStepper';
import { MODAL_STEPS } from './utils/noticeConstants';

interface CreateNoticeModalProps extends UseNoticeFormProps {
  isOpen: boolean;
}

const CreateNoticeModal: React.FC<CreateNoticeModalProps> = ({
  isOpen,
  onClose,
  editNotice,
  onNoticeCreated,
  onNoticeUpdated,
}) => {
  const form = useNoticeForm({ editNotice, onNoticeCreated, onNoticeUpdated, onClose });
  const [step, setStep] = useState(1);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Reset step and form when modal closes/opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setShowExitConfirm(false);
    } else {
      form.resetForm();
    }
  }, [isOpen, form.resetForm]);

  const handleRequestClose = () => {
    if (!editNotice && form.isDirty) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  const handleNext = () => setStep(s => Math.min(3, s + 1));
  const handleBack = () => setStep(s => Math.max(1, s - 1));

  const isStepValid = () => {
    if (step === 1) return form.title.trim().length > 0 && form.content.trim().length > 0;
    if (step === 2) {
      if (form.audienceType === 'roles') return form.targetRoles.length > 0;
      if (form.audienceType === 'blocks') return form.targetBlocks.length > 0 || form.targetFlats.length > 0;
      return true; // everyone
    }
    return true;
  };

  const submitButtonLabel = editNotice
    ? 'Save Changes'
    : form.publishMode === 'scheduled'
      ? 'Schedule Notice'
      : 'Publish Notice';

  const SubmitIcon = form.loading
    ? Loader2
    : editNotice
      ? Save
      : form.publishMode === 'scheduled'
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
            form.handleSubmit();
          }}
          disabled={form.loading || !isStepValid()}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700
          disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold
          rounded-xl transition-all shadow-sm active:scale-95"
        >
          <SubmitIcon className={`w-4 h-4 ${form.loading ? 'animate-spin' : ''}`} />
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
      >
        <div className="flex flex-col gap-4">
          <div className="pt-2 px-2">
            <ModalStepper steps={MODAL_STEPS} currentStep={step} />
          </div>

          <div className="min-h-[300px] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 bg-white dark:bg-gray-900 shadow-sm">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <ContentSection
                  title={form.title} setTitle={form.setTitle}
                  category={form.category} setCategory={form.setCategory}
                  content={form.content} setContent={form.setContent}
                  priority={form.priority} setPriority={form.setPriority}
                  requiresAck={form.requiresAck} setRequiresAck={form.setRequiresAck}
                  acknowledgeBy={form.acknowledgeBy} setAcknowledgeBy={form.setAcknowledgeBy}
                  files={form.files} setFiles={form.setFiles}
                  editNotice={!!editNotice}
                />
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <TargetAudienceSection
                  audienceType={form.audienceType}
                  setAudienceType={form.setAudienceType}
                  availableRoles={form.availableRoles}
                  targetRoles={form.targetRoles}
                  setTargetRoles={form.setTargetRoles}
                  availableBlocks={form.availableBlocks}
                  targetBlocks={form.targetBlocks}
                  setTargetBlocks={form.setTargetBlocks}
                  targetFlats={form.targetFlats}
                  setTargetFlats={form.setTargetFlats}
                />
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <SchedulingSection
                  publishMode={form.publishMode} setPublishMode={form.setPublishMode}
                  publishDate={form.publishDate} setPublishDate={form.setPublishDate}
                  validUntil={form.validUntil} setValidUntil={form.setValidUntil}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Exit Confirmation Dialog (3 Options) */}
      {showExitConfirm && (
        <Modal
          isOpen={showExitConfirm}
          onClose={() => setShowExitConfirm(false)}
          title="Save as Draft?"
          description="You have unsaved changes in this notice."
          icon={<AlertCircle className="w-5 h-5 text-amber-500" />}
          maxWidth="sm"
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="w-full sm:w-auto px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  onClose();
                }}
                className="w-full sm:w-auto px-3.5 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              >
                Discard Changes
              </button>
              <button
                type="button"
                disabled={form.loading}
                onClick={async () => {
                  setShowExitConfirm(false);
                  await form.saveDraftOnClose();
                }}
                className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {form.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save as Draft'}
              </button>
            </div>
          }
        >
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Would you like to save this notice as a draft so you can finish it later, or discard your changes?
          </p>
        </Modal>
      )}
    </>
  );
};

export default CreateNoticeModal;
