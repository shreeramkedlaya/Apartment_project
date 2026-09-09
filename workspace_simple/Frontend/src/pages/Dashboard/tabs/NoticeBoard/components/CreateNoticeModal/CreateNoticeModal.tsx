import React from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2, Save, Send } from 'lucide-react';
import { useNoticeForm } from './hooks/useNoticeForm';
import { ContentSection } from './components/ContentSection';
import { TargetAudienceSection } from './components/TargetAudienceSection';
import { SchedulingSection } from './components/SchedulingSection';
import type { UseNoticeFormProps } from './types/noticeForm.types';

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

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400
        hover:text-gray-900 dark:hover:text-white hover:bg-gray-100
        dark:hover:bg-gray-800 rounded-xl transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={() => form.handleSubmit()}
        disabled={form.loading || !form.title.trim() || !form.content.trim()}
        className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700
        disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold
        rounded-xl transition-all shadow-sm active:scale-95"
      >
        {form.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editNotice ? <Save className="w-4 h-4" /> : <Send className="w-4 h-4" />}
        {editNotice ? 'Save Changes' : 'Save as Draft'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editNotice ? 'Edit Notice' : 'Create New Notice'}
      description={editNotice ? `Editing notice #${editNotice.id}` : 'Draft or schedule a notice broadcast for residents and staff.'}
      footer={modalFooter}
      maxWidth="3xl"
    >
      <form onSubmit={form.handleSubmit} className="space-y-6">
        <ContentSection 
          title={form.title} setTitle={form.setTitle}
          category={form.category} setCategory={form.setCategory}
          content={form.content} setContent={form.setContent}
          priority={form.priority} setPriority={form.setPriority}
          files={form.files} setFiles={form.setFiles}
          editNotice={!!editNotice}
        />

        <TargetAudienceSection 
          availableRoles={form.availableRoles}
          targetRoles={form.targetRoles}
          handleRoleToggle={form.handleRoleToggle}
          availableBlocks={form.availableBlocks}
          targetBlocks={form.targetBlocks}
          handleBlockToggle={form.handleBlockToggle}
          selectedBlockForFlats={form.selectedBlockForFlats}
          setSelectedBlockForFlats={form.setSelectedBlockForFlats}
          selectedFlatInput={form.selectedFlatInput}
          setSelectedFlatInput={form.setSelectedFlatInput}
          targetFlats={form.targetFlats}
          handleAddFlat={form.handleAddFlat}
          handleRemoveFlat={form.handleRemoveFlat}
        />

        <SchedulingSection 
          publishDate={form.publishDate} setPublishDate={form.setPublishDate}
          validUntil={form.validUntil} setValidUntil={form.setValidUntil}
          requiresAck={form.requiresAck} setRequiresAck={form.setRequiresAck}
          acknowledgeBy={form.acknowledgeBy} setAcknowledgeBy={form.setAcknowledgeBy}
        />
      </form>
    </Modal>
  );
};

export default CreateNoticeModal;
