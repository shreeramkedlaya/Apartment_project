import { X } from 'lucide-react';

interface DocumentModalProps {
  isOpen: boolean;
  title: string;
  type: 'tnc' | 'privacy' | null;
  onClose: () => void;
}

export default function DocumentModal({ isOpen, title, type, onClose }: DocumentModalProps) {
  if (!isOpen || !type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 text-sm text-gray-600 dark:text-gray-400 space-y-4">
          <p>
            <strong>Effective Date:</strong> January 1, 2024
          </p>
          <p>
            This is a placeholder for the {title}. In a production environment, this text would be replaced by the actual legal terms or policy content required for your application.
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in odio eu nisl venenatis fermentum. Donec venenatis, dui eget accumsan pellentesque, neque dui posuere erat, eu porta urna diam in erat. Phasellus sollicitudin lorem id sapien fermentum, vel scelerisque ipsum varius.
          </p>
          <p>
            Proin at risus id libero aliquet consectetur. Ut efficitur mi est, sed condimentum massa suscipit vel. Vestibulum vitae ex velit. Maecenas scelerisque massa a lacus pellentesque, varius fermentum sapien tempor.
          </p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-2">Section 1: General Provisions</h3>
          <p>
            Curabitur sed eros sed est scelerisque commodo. Nam id interdum neque. Quisque vel enim a sapien vulputate condimentum. Donec ut odio vitae nunc lobortis ultrices ac interdum metus. Suspendisse pulvinar nunc a mi congue pellentesque.
          </p>
          <p>
            Duis ac semper neque. Fusce accumsan massa vitae eros dignissim, nec vestibulum risus condimentum. Cras rhoncus tellus vitae lorem eleifend facilisis. Integer vel orci quis velit sollicitudin scelerisque ac facilisis sem.
          </p>
        </div>
        
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 shrink-0 bg-gray-50/50 dark:bg-gray-800/20 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
