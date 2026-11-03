import React, { useRef } from 'react';
import { AppState, Attachment, ID } from '../../types';
import { generateId } from '../../lib/utils';
import { Paperclip, FileText, Image as ImageIcon, X, Download } from 'lucide-react';

interface AttachmentManagerProps {
  entityId: ID;
  entityType: Attachment['entityType'];
  state: AppState;
  updateState: (updater: (draft: AppState) => AppState | void) => void;
  readonly?: boolean;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  entityId,
  entityType,
  state,
  updateState,
  readonly = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachments = (state.attachments || []).filter(a => a.entityId === entityId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('حجم فایل نباید بیشتر از ۵ مگابایت باشد.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      
      updateState(draft => {
        if (!draft.attachments) draft.attachments = [];
        draft.attachments.push({
          id: generateId(),
          entityId,
          entityType,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          base64Data,
          uploadedAt: new Date().toISOString(),
          uploadedBy: draft.currentUserId || 'SYSTEM'
        });
      });
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (id: string) => {
    if (confirm('آیا از حذف این فایل اطمینان دارید؟')) {
      updateState(draft => {
        draft.attachments = (draft.attachments || []).filter(a => a.id !== id);
      });
    }
  };

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.base64Data;
    link.download = attachment.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-3 w-full" dir="rtl">
      {!readonly && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-main">فایل‌های پیوست ({attachments.length})</span>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Paperclip size={14} /> افزودن فایل
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
        </div>
      )}

      {attachments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {attachments.map(file => {
            const isImage = file.fileType.startsWith('image/');
            return (
              <div key={file.id} className="flex items-center justify-between p-2.5 bg-canvas border border-slate-200 rounded-xl group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                    {isImage ? (
                      <img src={file.base64Data} alt={file.fileName} className="w-full h-full object-cover" />
                    ) : (
                      <FileText size={20} className="text-text-secondary" />
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold text-text-main truncate" title={file.fileName}>{file.fileName}</span>
                    <span className="text-[10px] text-text-secondary font-mono">{formatSize(file.fileSize)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => handleDownload(file)} className="p-1.5 text-text-secondary hover:text-primary bg-white rounded-md shadow-sm cursor-pointer">
                    <Download size={14} />
                  </button>
                  {!readonly && (
                    <button type="button" onClick={() => handleDelete(file.id)} className="p-1.5 text-text-secondary hover:text-status-risk bg-white rounded-md shadow-sm cursor-pointer">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-4 border border-dashed border-slate-200 rounded-xl bg-canvas text-xs text-text-secondary">
          هیچ فایلی پیوست نشده است.
        </div>
      )}
    </div>
  );
};
