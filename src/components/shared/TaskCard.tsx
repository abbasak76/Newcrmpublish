import React from 'react';
import { CustomerTask, Account } from '../../types';
import { formatAppDate } from '../../lib/utils';
import { Clock, Building2, UserCircle, Users, Paperclip, Edit2, ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { assessTaskSla, recommendTaskNextAction } from '../../services/taskIntelligence';
import { getLatestTaskActivity } from '../../services/taskActivity';

interface TaskCardProps {
  task: CustomerTask;
  account?: Account;
  assigneeName: string;
  isCompleted: boolean;
  attachmentCount: number;
  onToggleStatus: () => void;
  onEdit: () => void;
  onAttach: () => void;
  onWorkflow: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  account,
  assigneeName,
  isCompleted,
  attachmentCount,
  onToggleStatus,
  onEdit,
  onAttach,
  onWorkflow
}) => {
  const navigate = useNavigate();
  const sla = assessTaskSla(task);
  const nextAction = recommendTaskNextAction(task);
  const latestActivity = getLatestTaskActivity(task);
  const slaStyle = sla.state === 'BREACHED' ? 'bg-danger-soft text-danger border-danger-line' : sla.state === 'AT_RISK' ? 'bg-warning-soft text-warning border-warning-line' : sla.state === 'UNSCHEDULED' ? 'bg-canvas text-text-secondary border-border/60' : sla.state === 'COMPLETED' ? 'bg-success/10 text-success border-success/20' : 'bg-primary/5 text-primary border-primary/15';

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-danger-soft text-danger border-danger-line';
      case 'HIGH': return 'bg-warning-soft text-warning border-warning-line';
      case 'NORMAL': return 'bg-canvas text-text-secondary border-border/80';
      case 'LOW': return 'bg-white text-text-secondary border-border/80';
      default: return 'bg-canvas text-text-secondary border-border/80';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'فوری';
      case 'HIGH': return 'بالا';
      case 'NORMAL': return 'عادی';
      case 'LOW': return 'پایین';
      default: return 'عادی';
    }
  };

  return (
    <div className={`flex flex-col bg-surface border border-border/80 rounded-3xl shadow-subtle overflow-hidden transition-all duration-200 ${isCompleted ? 'opacity-60 bg-canvas' : 'hover:shadow-card hover:border-primary/40'}`} dir="rtl">
      
      <div className="p-5 pb-3 flex justify-between items-start gap-3">
        <h4 className={`text-sm font-black leading-snug ${isCompleted ? 'line-through text-text-secondary' : 'text-text-main'}`}>
          {task.title}
        </h4>
        <span className={`shrink-0 px-3 py-1 text-[10px] font-bold rounded-xl border shadow-sm ${getPriorityColor(task.priority || 'NORMAL')}`}>
          {getPriorityLabel(task.priority || 'NORMAL')}
        </span>
      </div>

      <div className="px-5 py-2 flex-1 flex flex-col gap-3">
        {task.description && (
          <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{task.description}</p>
        )}
        
        <div className="flex flex-wrap items-center gap-2.5 text-xs mt-1">
          <span className={`inline-flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 font-bold ${slaStyle}`} title={sla.reason} aria-label={`وضعیت مهلت: ${sla.label}`}>
            <Clock size={12} /> {sla.label}
          </span>
          {account && (
            <button 
              onClick={() => navigate(`/accounts/${account.id}`)}
              className="flex items-center gap-1.5 font-bold text-primary hover:text-primary-hover bg-primary/5 px-3 py-1.5 rounded-2xl transition-colors cursor-pointer border border-primary/10"
            >
              <Building2 size={12} /> {account.name}
            </button>
          )}
          
          {task.dueDate && (
            <span className={`flex items-center gap-1.5 font-mono font-medium px-3 py-1.5 rounded-2xl ${task.dueDate < new Date().toISOString().split('T')[0] && !isCompleted ? 'bg-danger-soft text-danger border border-danger-line' : 'bg-canvas text-text-secondary border border-border/60'}`}>
              <Clock size={12} /> {formatAppDate(task.dueDate)}
            </span>
          )}

          <span className="flex items-center gap-1.5 font-medium text-text-main bg-canvas px-3 py-1.5 rounded-2xl border border-border/60">
            {task.assigneeType === 'GROUP' ? <Users size={12} className="text-text-secondary"/> : <UserCircle size={12} className="text-text-secondary"/>} 
            {assigneeName}
          </span>
        </div>
      </div>

      {latestActivity && <div className="mx-5 mb-1 rounded-xl border border-border/50 bg-canvas/70 px-3 py-2" aria-label="آخرین رویداد وظیفه">
        <div className="text-[10px] font-bold text-text-secondary">آخرین تغییر · {new Date(latestActivity.at).toLocaleString('fa-IR')}</div>
        <div className="mt-0.5 text-[11px] font-semibold text-text-main">{latestActivity.summary}</div>
        {latestActivity.details && <div className="mt-0.5 text-[10px] text-text-secondary">{latestActivity.details}</div>}
        <div className="mt-1 text-[10px] text-text-secondary">{Array.isArray(task.activityHistory) ? task.activityHistory.length : 0} رویداد ثبت‌شده</div>
      </div>}

      {!isCompleted && <div className={`mx-5 mb-1 rounded-2xl border px-3.5 py-3 ${sla.state === 'BREACHED' ? 'border-danger-line bg-danger-soft' : sla.state === 'AT_RISK' ? 'border-warning-line bg-warning-soft' : 'border-border/60 bg-canvas'}`}>
        <div className="text-[11px] font-black text-text-main">اقدام پیشنهادی: {nextAction.title}</div>
        <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">{nextAction.reason}</p>
      </div>}

      <div className="px-5 py-4 bg-canvas border-t border-border/60 flex items-center justify-between mt-3">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={isCompleted} 
            onChange={onToggleStatus} 
            className="w-4.5 h-4.5 rounded-lg border-border text-accent focus:ring-accent cursor-pointer" 
          />
          <span className={`text-xs font-bold transition-colors ${isCompleted ? 'text-success' : 'text-text-secondary group-hover:text-text-main'}`}>
            {isCompleted ? 'انجام شد' : 'علامت به عنوان انجام شده'}
          </span>
        </label>

        <div className="flex items-center gap-2">
          <button onClick={onWorkflow} className="p-2 bg-surface text-text-secondary hover:text-primary border border-border/80 rounded-2xl shadow-subtle transition-colors cursor-pointer" title="گردش کار و نتیجه" aria-label="گردش کار و نتیجه وظیفه">
            <ListChecks size={14} />
          </button>
          <button 
            onClick={onAttach}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-colors cursor-pointer shadow-subtle ${attachmentCount > 0 ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-surface text-text-secondary hover:text-text-main border border-border/80'}`}
            title="پیوست‌ها"
          >
            <Paperclip size={14} />
            {attachmentCount > 0 && <span>{attachmentCount}</span>}
          </button>
          
          {!isCompleted && (
            <button 
              onClick={onEdit}
              className="p-2 bg-surface text-text-secondary hover:text-primary border border-border/80 rounded-2xl shadow-subtle transition-colors cursor-pointer"
              title="ویرایش / ارجاع"
            >
              <Edit2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
