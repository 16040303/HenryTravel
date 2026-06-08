import React, { useState } from 'react';
import { 
  MessageSquare, Star, User, Calendar, ShieldCheck, 
  Eye, EyeOff, ShieldAlert, Sparkles 
} from 'lucide-react';
import { EntityId, Feedback, VillaDetail } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import EmptyState from '../common/EmptyState';

interface AdminFeedbackManagerProps {
  feedbacks: Feedback[];
  villas: VillaDetail[];
  onToggleVerifyFeedback: (id: string) => void;
  mutationLoading?: boolean;
}

export default function AdminFeedbackManager({
  feedbacks,
  villas,
  onToggleVerifyFeedback,
  mutationLoading = false
}: AdminFeedbackManagerProps) {
  const { t } = useLanguage();
  const [selectedVillaId, setSelectedVillaId] = useState<EntityId | 'ALL'>('ALL');
  const [ratingFilter, setRatingFilter] = useState<'ALL' | number>('ALL');

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesVilla = selectedVillaId === 'ALL' || String(f.villaId) === String(selectedVillaId);
    const matchesRating = ratingFilter === 'ALL' || f.rating === Number(ratingFilter);
    return matchesVilla && matchesRating;
  });

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header controls select triggers */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-[#0071c2]" />
            <span>{t('admin.feedback.title')}</span>
          </h3>
          <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
            {t('admin.feedback.desc')}
          </p>
        </div>

        {/* Dropdown selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Villa Selector */}
          <select
            value={selectedVillaId}
            onChange={(e) => setSelectedVillaId(e.target.value === 'ALL' ? 'ALL' : e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-700 outline-none cursor-pointer max-w-[180px] truncate"
          >
            <option value="ALL">{t('admin.feedback.allVillas')}</option>
            {villas.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>

          {/* Rating filter selector */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-700 outline-none cursor-pointer"
          >
            <option value="ALL">{t('admin.feedback.allRatings')}</option>
            {[5, 4, 3, 2, 1].map(r => (
              <option key={r} value={r}>{r} ⭐</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews list rows */}
      <div className="min-h-[360px]">
        {filteredFeedbacks.length === 0 ? (
          <EmptyState
            title={t('admin.feedback.emptyTitle')}
            description={t('admin.feedback.emptyDesc')}
            icon="feedback"
          />
        ) : (
          <div className="flex flex-col gap-4">
          {filteredFeedbacks.map((f) => {
            const villaName = villas.find(v => String(v.id) === String(f.villaId))?.name || t('admin.feedback.villaCode', { id: f.villaId });
            return (
              <div 
                key={f.id} 
                className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4 hover:shadow-md transition-shadow animate-scaleIn"
              >
                {/* Information content */}
                <div className="flex flex-col gap-2 flex-grow">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-[#edf3ff] text-[#005899] px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                      {villaName}
                    </span>
                    <div className="flex items-center gap-0.5 text-xs text-[#fe6a34] font-black">
                      <Star className="w-3.5 h-3.5 fill-[#fe6a34] text-[#fe6a34]" />
                      <span>{f.rating} / 5.0</span>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-neutral-750 leading-relaxed max-w-2xl bg-neutral-50/50 p-3 rounded-xl border border-neutral-100/50">
                    "{f.comment}"
                  </p>

                  {/* Footer descriptors */}
                  <div className="flex items-center gap-3 text-[10px] text-neutral-400 font-extrabold uppercase mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-neutral-300" />
                      {f.guestName}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-neutral-300" />
                      {f.createdAt.split('T')[0] || f.createdAt}
                    </span>
                    {f.isVerified && (
                      <span className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 py-0.5 px-2 rounded-full border border-emerald-100 font-bold">
                        <ShieldCheck className="w-3 h-3" />
                        {t('admin.feedback.verified')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Verification Toggle buttons right */}
                <div className="self-end sm:self-center shrink-0">
                  {f.isVerified ? (
                    <button
                      onClick={() => onToggleVerifyFeedback(String(f.id))}
                      disabled={mutationLoading}
                      className="bg-emerald-50 hover:bg-rose-50 text-emerald-600 hover:text-rose-600 border border-emerald-200 hover:border-rose-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                      title={t('admin.feedback.hideTitle')}
                    >
                      <Eye className="w-4 h-4 shrink-0" />
                      <span>{t('admin.feedback.publicActive')}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onToggleVerifyFeedback(String(f.id))}
                      disabled={mutationLoading}
                      className="bg-neutral-50 hover:bg-emerald-50 text-neutral-500 hover:text-emerald-700 border border-neutral-200 hover:border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      title={t('admin.feedback.showTitle')}
                    >
                      <EyeOff className="w-4 h-4 shrink-0" />
                      <span>{t('admin.feedback.publicHidden')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}
