import React from 'react';
import { Search, Inbox, AlertTriangle, MessageSquarePlus, Building2 } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: 'search' | 'inbox' | 'alert' | 'feedback' | 'villa';
}

export default function EmptyState({ title, description, actionText, onAction, icon = 'inbox' }: EmptyStateProps) {
  const iconMap = {
    search: <Search className="w-12 h-12 text-neutral-300" />,
    inbox: <Inbox className="w-12 h-12 text-neutral-300 animate-float" />,
    alert: <AlertTriangle className="w-12 h-12 text-amber-300 animate-pulse" />,
    feedback: <MessageSquarePlus className="w-12 h-12 text-neutral-300" />,
    villa: <Building2 className="w-12 h-12 text-neutral-300" />
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white rounded-2xl border border-neutral-100 shadow-sm max-w-lg mx-auto gap-4 animate-scaleIn">
      <div className="bg-neutral-50 p-4 rounded-full border border-neutral-100 flex items-center justify-center">
        {iconMap[icon]}
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-black text-neutral-800 tracking-tight">{title}</h3>
        <p className="text-xs text-neutral-400 font-semibold max-w-sm leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-2 bg-[#0071c2] hover:bg-[#005899] text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
