import React from 'react';
import Modal from '@/components/ui/Modal';
import type { CreateRequestModalProps } from './types/createRequest.types';
import { useCreateRequestForm } from './hooks/useCreateRequestForm';
import CategorySection from './components/CategorySection';
import LocationSection from './components/LocationSection';
import FormFieldsSection from './components/FormFieldsSection';

const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  isOpen,
  onClose,
  onRequestCreated,
  onRequestUpdated,
  user,
  editRequest,
}) => {
  const {
    blocks,
    formData,
    dynamicCategories,
    attachments,
    setAttachments,
    isSubmitting,
    uploadProgress,
    isFormValid,
    handleChange,
    handleSubmit,
  } = useCreateRequestForm({
    isOpen,
    onClose,
    onRequestCreated,
    onRequestUpdated,
    user,
    editRequest,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editRequest ? "Edit Request" : "Raise a New Request"}
      description={
        editRequest
          ? "Update the details of your helpdesk request."
          : "Tell us what you need help with, and we'll get it sorted."
      }
      width="large"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid}
            className="flex items-center justify-center gap-2 px-6 py-2 min-w-[140px] text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all relative overflow-hidden"
          >
            {/* Progress bar background */}
            {isSubmitting && uploadProgress !== null && (
              <div
                className="absolute left-0 top-0 bottom-0 bg-blue-800 opacity-30 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            )}

            <span className="relative z-10">
              {isSubmitting
                ? uploadProgress !== null
                  ? `Uploading... ${uploadProgress}%`
                  : editRequest
                  ? 'Updating...'
                  : 'Submitting...'
                : editRequest
                ? 'Update Request'
                : 'Submit Request'}
            </span>
          </button>
        </>
      }
    >
      <div className="space-y-8 pb-4">
        {/* Row 1: Category */}
        <CategorySection
          categories={dynamicCategories}
          selectedCategory={formData.category}
          onSelectCategory={(catId) => handleChange('category', catId)}
        />

        {/* Row 2: Location Block */}
        <LocationSection
          formData={formData}
          blocks={blocks}
          onChange={handleChange}
        />

        {/* Row 3: Title, Description, Contact, Priority, Media */}
        <FormFieldsSection
          formData={formData}
          attachments={attachments}
          isSubmitting={isSubmitting}
          onChange={handleChange}
          onAttachmentsChange={setAttachments}
        />
      </div>
    </Modal>
  );
};

export default CreateRequestModal;