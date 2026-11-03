import React from 'react';
import { AppState } from '../../types';
import { RBACService } from '../../lib/rbac';
import { Lock } from 'lucide-react';

interface SecureFieldProps {
  state: AppState;
  entityType: string;
  field: string;
  fallback?: React.ReactNode;
  children: (mode: 'SEE' | 'DO') => React.ReactNode;
}

export const SecureField: React.FC<SecureFieldProps> = ({
  state,
  entityType,
  field,
  fallback,
  children
}) => {
  const rbac = new RBACService(state);
  const visibility = rbac.getFieldVisibility(entityType, field);

  if (visibility === 'HIDDEN') {
    return fallback ? <>{fallback}</> : (
      <div className="flex items-center gap-1.5 text-[10px] text-text-secondary bg-canvas px-2 py-1 rounded border border-slate-200 w-fit" title="شما مجوز مشاهده این فیلد را ندارید">
        <Lock size={12} /> محرمانه
      </div>
    );
  }

  return <>{children(visibility)}</>;
};
