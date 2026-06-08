import React, { useEffect, useState } from 'react';
import { Calendar, Lock, Trash2 } from 'lucide-react';
import { AdminBlockedDate, EntityId, VillaDetail } from '../../types';
import { createAdminBlockedDate, deleteAdminBlockedDate, getAdminBlockedDates } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../Toast';
import CustomDatePicker from '../common/CustomDatePicker';

interface AdminAvailabilityManagerProps {
  villas: VillaDetail[];
  onUpdateVillaAvailability: (villaId: EntityId, bookedDates: string[], pendingDates: string[]) => void;
}

export default function AdminAvailabilityManager({ villas }: AdminAvailabilityManagerProps) {
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const [activeVillaId, setActiveVillaId] = useState<EntityId>(() => villas.length > 0 ? villas[0].id : '');
  const [blockedDates, setBlockedDates] = useState<AdminBlockedDate[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState(t('admin.availability.defaultReason'));
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const activeVilla = villas.find((villa) => String(villa.id) === String(activeVillaId));

  const loadBlockedDates = async () => {
    if (!activeVillaId) return;
    setLoading(true);
    try {
      const response = await getAdminBlockedDates({ villaId: String(activeVillaId), limit: 100 });
      setBlockedDates(response.blockedDates);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : t('admin.availability.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlockedDates();
  }, [activeVillaId]);

  const handleCreateBlockedDate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeVillaId || !startDate || !endDate || !reason.trim()) {
      showToast('warning', t('admin.availability.required'));
      return;
    }
    const normalizedEndDate = (() => {
      if (endDate !== startDate) return endDate;
      const nextDay = new Date(`${startDate}T00:00:00.000Z`);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      return nextDay.toISOString().slice(0, 10);
    })();

    if (new Date(normalizedEndDate) <= new Date(startDate)) {
      showToast('warning', t('admin.availability.invalidRange'));
      return;
    }

    setSaving(true);
    try {
      await createAdminBlockedDate({
        villaId: String(activeVillaId),
        startDate,
        endDate: normalizedEndDate,
        reason: reason.trim(),
        note: note.trim() || undefined,
      });
      showToast('success', t('admin.availability.created'));
      setStartDate('');
      setEndDate('');
      setNote('');
      await loadBlockedDates();
    } catch (error) {
      const code = (error as Error & { code?: string }).code;
      if (code === 'DATE_OVERLAP' || code === 'BLOCKED_DATE_OVERLAP') {
        showToast('error', t('admin.availability.overlap'));
      } else {
        showToast('error', error instanceof Error ? error.message : t('admin.availability.createError'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlockedDate = async (id: string) => {
    if (!window.confirm(t('admin.availability.deleteConfirm'))) return;
    setSaving(true);
    try {
      await deleteAdminBlockedDate(id);
      showToast('success', t('admin.availability.deleted'));
      await loadBlockedDates();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : t('admin.availability.deleteError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#0071c2]" />
            <span>{t('admin.availability.title')}</span>
          </h3>
          <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
            {t('admin.availability.desc')}
          </p>
        </div>
        <select
          value={activeVillaId}
          onChange={(event) => setActiveVillaId(event.target.value)}
          className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-xs font-bold text-neutral-700 outline-none cursor-pointer max-w-xs"
        >
          {villas.map((villa) => (
            <option key={villa.id} value={villa.id}>{villa.name}</option>
          ))}
        </select>
      </div>

      {activeVilla ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleCreateBlockedDate} className="lg:col-span-5 bg-white rounded-3xl border border-neutral-100 shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
              <img src={activeVilla.image} alt={activeVilla.name} className="w-16 h-12 object-cover rounded-lg shrink-0" />
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-neutral-800 truncate">{activeVilla.name}</h4>
                <p className="text-[10px] text-neutral-400 font-semibold">{activeVilla.location}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-[10px] font-bold text-neutral-500 uppercase">
                {t('admin.availability.startDate')}
                <CustomDatePicker
                  value={startDate}
                  onChange={setStartDate}
                  language={language}
                  buttonClassName="border border-neutral-200 rounded-xl px-3 py-2 text-left text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-50"
                />
              </label>
              <label className="flex flex-col gap-1 text-[10px] font-bold text-neutral-500 uppercase">
                {t('admin.availability.endDate')}
                <CustomDatePicker
                  value={endDate}
                  onChange={setEndDate}
                  language={language}
                  buttonClassName="border border-neutral-200 rounded-xl px-3 py-2 text-left text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-50"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-[10px] font-bold text-neutral-500 uppercase">
              {t('admin.availability.reason')}
              <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={120} className="border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-700" placeholder={t('admin.availability.reasonPlaceholder')} />
            </label>

            <label className="flex flex-col gap-1 text-[10px] font-bold text-neutral-500 uppercase">
              {t('admin.availability.note')}
              <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={4} className="border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-700 resize-none" placeholder={t('admin.availability.notePlaceholder')} />
            </label>

            <button disabled={saving} className="bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-400 text-white py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer">
              <Lock className="w-4 h-4" />
              {saving ? t('admin.availability.saving') : t('admin.availability.blockRange')}
            </button>
          </form>

          <div className="lg:col-span-7 flex min-h-[360px] flex-col gap-4 rounded-3xl border border-neutral-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-neutral-800">{t('admin.availability.listTitle')}</h4>
              <span className="text-[10px] font-black text-neutral-400 uppercase">{t('admin.availability.ranges', { count: blockedDates.length })}</span>
            </div>

            {loading ? (
              <div className="text-xs font-bold text-neutral-400 bg-neutral-50 rounded-xl p-4">{t('admin.availability.loading')}</div>
            ) : blockedDates.length === 0 ? (
              <div className="text-xs font-bold text-neutral-400 bg-neutral-50 rounded-xl p-4">{t('admin.availability.empty')}</div>
            ) : (
              <div className="flex flex-col gap-2">
                {blockedDates.map((blockedDate) => (
                  <div key={blockedDate.id} className="border border-neutral-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-black text-neutral-800">
                        {blockedDate.startDate.slice(0, 10)} → {blockedDate.endDate.slice(0, 10)}
                      </p>
                      <p className="text-xs font-bold text-rose-600 mt-1">{blockedDate.reason}</p>
                      {blockedDate.note && <p className="text-[11px] text-neutral-500 mt-1">{blockedDate.note}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteBlockedDate(blockedDate.id)}
                      disabled={saving}
                      className="text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1 cursor-pointer self-start sm:self-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t('admin.availability.delete')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center p-8 bg-white border border-neutral-100 rounded-3xl">
          {t('admin.availability.noVilla')}
        </div>
      )}
    </div>
  );
}
