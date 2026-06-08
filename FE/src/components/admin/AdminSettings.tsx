import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Sliders, MessageSquare, Clock, Globe, Shield,
  LogOut, CheckCircle2, Phone, AlertCircle, Info
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminLogout, changeAdminPassword, getAdminSettings, updateAdminSettings } from '../../lib/api';
import { useToast } from '../Toast';

interface AdminSettingsProps {
  onLogout: () => void;
  section?: 'system' | 'info';
}

function extractContactDigits(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

export default function AdminSettings({ onLogout, section = 'system' }: AdminSettingsProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [holdTimeMode, setHoldTimeMode] = useState<'preset' | 'custom'>('preset');
  const [holdMinutes, setHoldMinutes] = useState(15);
  const [customMinutes, setCustomMinutes] = useState(45);

  const [zaloUrl, setZaloUrl] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [wechatId, setWechatId] = useState('');
  const [kakaoTalkId, setKakaoTalkId] = useState('');
  const [tikTokUrl, setTikTokUrl] = useState('');
  const [facebookPersonalUrl, setFacebookPersonalUrl] = useState('');
  const [facebookFanpageUrl, setFacebookFanpageUrl] = useState('');
  const [naverBlogUrl, setNaverBlogUrl] = useState('');
  const [instagramWorkUrl, setInstagramWorkUrl] = useState('');
  const [commonPolicy, setCommonPolicy] = useState('');


  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let mounted = true;
    getAdminSettings()
      .then((settings) => {
        if (mounted) {
          setZaloUrl(settings.zaloPhone || extractContactDigits(settings.zaloUrl || ''));
          setWhatsappUrl(extractContactDigits(settings.whatsappUrl || ''));
          setWechatId(settings.wechatId || '');
          setKakaoTalkId(settings.kakaoTalkId || '');
          setTikTokUrl(settings.tikTokUrl || '');
          setFacebookPersonalUrl(settings.facebookPersonalUrl || '');
          setFacebookFanpageUrl(settings.facebookFanpageUrl || '');
          setNaverBlogUrl(settings.naverBlogUrl || '');
          setInstagramWorkUrl(settings.instagramWorkUrl || '');
          setCommonPolicy(settings.commonPolicy || '');
          setHoldTimeMode(settings.bookingHoldTimeMode);
          setHoldMinutes(settings.holdMinutes);
          setCustomMinutes(settings.customHoldMinutes);
        }
      })
      .catch((error) => {
        if (mounted) {
          setValidationError(error instanceof Error ? error.message : t('admin.settings.loadZaloError'));
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();

    let resolvedMinutes = holdMinutes;
    if (holdTimeMode === 'custom') {
      if (!Number.isInteger(customMinutes) || customMinutes < 5 || customMinutes > 1440) {
        setValidationError(t('admin.settings.customMinutesError'));
        return; // Do not save!
      }
      resolvedMinutes = customMinutes;
    }

    setValidationError(''); // Clear error
    setIsSaving(true);

    try {
      const payload = section === 'info'
        ? {
            zaloUrl,
            whatsappUrl,
            wechatId,
            kakaoTalkId,
            tikTokUrl,
            facebookPersonalUrl,
            facebookFanpageUrl,
            naverBlogUrl,
            instagramWorkUrl,
          }
        : {
            commonPolicy,
            bookingHoldTimeMode: holdTimeMode,
            holdMinutes,
            customHoldMinutes: customMinutes,
          };

      const settings = await updateAdminSettings(payload);
      setZaloUrl(settings.zaloPhone || extractContactDigits(settings.zaloUrl || ''));
      setWhatsappUrl(extractContactDigits(settings.whatsappUrl || ''));
      setWechatId(settings.wechatId || '');
      setKakaoTalkId(settings.kakaoTalkId || '');
      setTikTokUrl(settings.tikTokUrl || '');
      setFacebookPersonalUrl(settings.facebookPersonalUrl || '');
      setFacebookFanpageUrl(settings.facebookFanpageUrl || '');
      setNaverBlogUrl(settings.naverBlogUrl || '');
      setInstagramWorkUrl(settings.instagramWorkUrl || '');
      setCommonPolicy(settings.commonPolicy || '');
      setHoldTimeMode(settings.bookingHoldTimeMode);
      setHoldMinutes(settings.holdMinutes);
      setCustomMinutes(settings.customHoldMinutes);
      setSaveSuccess(true);
      showToast('success', t('admin.settings.saveSuccessToast'));
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('admin.settings.saveError');
      setValidationError(message);
      showToast('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetPasswordForm = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showToast('error', t('admin.settings.passwordRequired'));
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showToast('error', t('admin.settings.passwordMin'));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('error', t('admin.settings.passwordMismatch'));
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changeAdminPassword(passwordForm);
      showToast('success', result.message || t('admin.settings.passwordSuccess'));
      resetPasswordForm();
      setIsPasswordModalOpen(false);
      adminLogout();
      onLogout();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('admin.settings.passwordError');
      showToast('error', message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn max-w-2xl mx-auto">
      {/* Settings Grid Panel */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 sm:p-8 flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
            {section === 'info' ? (
              <Info className="w-4 h-4 text-[#0071c2]" />
            ) : (
              <Sliders className="w-4 h-4 text-[#0071c2]" />
            )}
            <span>{section === 'info' ? t('admin.settings.infoTitle') : t('admin.settings.title')}</span>
          </h3>
          <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
            {section === 'info'
              ? t('admin.settings.infoDesc')
              : t('admin.settings.desc')}
          </p>
          {section === 'system' && (
            <div className="mt-2.5 bg-[#edf3ff] text-[#005899] font-black text-[9px] py-1 px-3.5 rounded-full inline-block uppercase tracking-wider border border-[#a1c9ff]/20">
              {t('admin.settings.activeHold')}{' '}
              {holdTimeMode === 'custom' ? `${t('admin.settings.custom')}: ${t('admin.settings.minutes', { minutes: customMinutes })}` : t('admin.settings.minutes', { minutes: holdMinutes })}
            </div>
          )}
        </div>

        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-scaleIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t('admin.settings.savedBanner')}</span>
          </div>
        )}

        {validationError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-scaleIn">
            <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSaveConfigs} className="flex flex-col gap-5 text-xs font-semibold text-neutral-600">

          {section === 'system' && (
            <>

          {/* Config 1: Hold Time */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#fe6a34]" />
              {t('admin.settings.holdLabel')}
            </label>
            <select
              value={holdTimeMode === 'custom' ? 'custom' : String(holdMinutes)}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'custom') {
                  setHoldTimeMode('custom');
                } else {
                  setHoldTimeMode('preset');
                  setHoldMinutes(Number(val));
                }
              }}
              className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] text-neutral-800 text-xs cursor-pointer font-bold"
            >
              <option value="15">15 {t('admin.settings.minutes', { minutes: '' }).trim()}</option>
              <option value="30">30 {t('admin.settings.minutes', { minutes: '' }).trim()}</option>
              <option value="60">60 {t('admin.settings.minutes', { minutes: '' }).trim()} (1h)</option>
              <option value="120">120 {t('admin.settings.minutes', { minutes: '' }).trim()} (2h)</option>
              <option value="custom">{t('admin.settings.customOption')}</option>
            </select>

            {/* Custom Input UI */}
            {holdTimeMode === 'custom' && (
              <div className="flex flex-col gap-1.5 mt-2 animate-scaleIn bg-neutral-50/50 p-3.5 rounded-xl border border-neutral-200/50 border-l-4 border-l-[#0071c2]">
                <label className="text-[10px] font-bold text-[#0071c2] uppercase">
                  {t('admin.settings.customHoldLabel')}
                </label>
                <input
                  type="number"
                  min={5}
                  max={1440}
                  required
                  placeholder={t('admin.settings.customHoldPlaceholder')}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Number(e.target.value))}
                  className="bg-white border border-neutral-200 rounded-lg p-2 font-mono text-xs text-neutral-850 outline-none focus:border-[#0071c2] w-full max-w-xs font-bold"
                />
                <p className="text-[9px] text-[#0071c2] font-semibold leading-normal font-sans mt-0.5">
                  * {t('admin.settings.customHoldHelp')}
                </p>
              </div>
            )}

            <p className="text-[9px] text-neutral-400 font-normal leading-normal mt-0.5">
              * {t('admin.settings.holdHelp')}
            </p>
          </div>


          </>
          )}

          {section === 'info' && (
            <>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-[#0071c2]" />
              {t('admin.settings.zaloPhone')}
            </label>
            <input
              type="text"
              required
              value={zaloUrl}
              onChange={(e) => setZaloUrl(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] font-mono text-neutral-850 text-xs"
              placeholder={t('admin.settings.zaloPlaceholder')}
            />
            <p className="text-[9px] text-neutral-400 font-normal leading-normal">
              * {t('admin.settings.zaloHelp')}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              {t('admin.settings.whatsappPhone')}
            </label>
            <input
              type="text"
              value={whatsappUrl}
              onChange={(e) => setWhatsappUrl(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] font-mono text-neutral-850 text-xs"
              placeholder={t('admin.settings.whatsappPlaceholder')}
            />
            <p className="text-[9px] text-neutral-400 font-normal leading-normal">
              * {t('admin.settings.whatsappHelp')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase">WeChat ID</label>
              <input type="text" value={wechatId} onChange={(e) => setWechatId(e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] font-mono text-neutral-850 text-xs" placeholder="henrykieu1597" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase">KakaoTalk ID</label>
              <input type="text" value={kakaoTalkId} onChange={(e) => setKakaoTalkId(e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] font-mono text-neutral-850 text-xs" placeholder="henry.dn" />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4">
            <label className="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-[#0071c2]" />
              {t('admin.settings.socialLinks')}
            </label>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase text-neutral-400">Facebook Fanpage</span>
              <input type="url" value={facebookFanpageUrl} onChange={(e) => setFacebookFanpageUrl(e.target.value)} className="bg-white border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] font-mono text-neutral-850 text-xs" placeholder="Link trang fanpage Facebook" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase text-neutral-400">{t('admin.settings.facebookPersonal')}</span>
              <input type="url" value={facebookPersonalUrl} onChange={(e) => setFacebookPersonalUrl(e.target.value)} className="bg-white border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] font-mono text-neutral-850 text-xs" placeholder="Link {t('admin.settings.facebookPersonal')}" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase text-neutral-400">{t('admin.settings.instagramWork')}</span>
              <input type="url" value={instagramWorkUrl} onChange={(e) => setInstagramWorkUrl(e.target.value)} className="bg-white border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] font-mono text-neutral-850 text-xs" placeholder={t('admin.settings.instagramPlaceholder')} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase text-neutral-400">TikTok</span>
              <input type="url" value={tikTokUrl} onChange={(e) => setTikTokUrl(e.target.value)} className="bg-white border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] font-mono text-neutral-850 text-xs" placeholder={t('admin.settings.tiktokPlaceholder')} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase text-neutral-400">Naver Blog</span>
              <input type="url" value={naverBlogUrl} onChange={(e) => setNaverBlogUrl(e.target.value)} className="bg-white border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] font-mono text-neutral-850 text-xs" placeholder="Link blog Naver" />
            </div>
          </div>

          </>
          )}

          {section === 'system' && (
            <>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              {t('admin.settings.commonPolicy')}
            </label>
            <textarea
              rows={5}
              value={commonPolicy}
              onChange={(e) => setCommonPolicy(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] text-neutral-850 text-xs leading-relaxed resize-y"
              placeholder={t('admin.settings.commonPolicyPlaceholder')}
            />
            <p className="text-[9px] text-neutral-400 font-normal leading-normal">
              * {t('admin.settings.commonPolicyHelp')}
            </p>
          </div>

          </>
          )}

          {/* Submit Actions */}
          <button
            type="submit"
            disabled={isSaving}
            className="self-end bg-[#0071c2] hover:bg-[#005899] disabled:bg-neutral-400 text-white font-black py-2.5 px-6 rounded-xl cursor-pointer shadow hover:scale-101 transition-all"
          >
            {isSaving ? t('admin.settings.saving') : t('admin.settings.update')}
          </button>
        </form>
      </div>

      {/* Account Session Logout */}
      {section === 'system' && (
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 sm:p-8 flex flex-col gap-5 border-l-4 border-l-rose-500">
        <div>
          <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider flex items-center gap-1">
            <Shield className="w-4 h-4 text-rose-500" />
            <span>{t('admin.settings.securityTitle')}</span>
          </h4>
          <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
            {t('admin.settings.securityDesc')}
          </p>
        </div>

        <div className="bg-neutral-50 border border-neutral-100 p-4 rounded-xl flex items-center justify-between text-xs">
          <div className="flex flex-col gap-0.5 leading-none font-semibold">
            <span className="text-neutral-400 uppercase text-[8px] font-black">{t('admin.settings.account')}</span>
            <span className="text-neutral-800 font-bold mt-1 text-sm">{t('admin.settings.adminAccount')}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="bg-[#edf3ff] hover:bg-[#dcecff] text-[#0071c2] font-black text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>{t('admin.settings.resetPassword')}</span>
            </button>
            <button
              onClick={onLogout}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('admin.logout')}</span>
            </button>
            {isPasswordModalOpen && createPortal(
              <div className="fixed inset-0 z-[300] overflow-y-auto overscroll-contain bg-neutral-950/50 px-4 py-4 backdrop-blur-sm">
                <div className="min-h-full flex items-start justify-center pt-4 sm:pt-6">
                  <form onSubmit={handleChangePassword} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-neutral-100 flex flex-col gap-4 animate-scaleIn">
                    <div>
                      <h4 className="text-base font-black text-neutral-900 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[#0071c2]" />
                        {t('admin.settings.resetPassword')}
                      </h4>
                      <p className="text-[11px] text-neutral-500 font-semibold mt-1">
                        {t('admin.settings.passwordModalDesc')}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">{t('admin.settings.currentPassword')}</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                        className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] text-neutral-850 text-xs"
                        autoComplete="current-password"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">{t('admin.settings.newPassword')}</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                        className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] text-neutral-850 text-xs"
                        autoComplete="new-password"
                        minLength={8}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">{t('admin.settings.confirmPassword')}</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-[#0071c2] text-neutral-850 text-xs"
                        autoComplete="new-password"
                        minLength={8}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        disabled={isChangingPassword}
                        onClick={() => {
                          resetPasswordForm();
                          setIsPasswordModalOpen(false);
                        }}
                        className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-black text-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="px-4 py-2 rounded-xl bg-[#0071c2] hover:bg-[#005899] disabled:bg-neutral-400 text-white font-black text-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isChangingPassword ? t('admin.settings.changingPassword') : t('admin.settings.confirmChangePassword')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>,
              document.body
            )}
    </div>
        </div>
      </div>
      )}
    </div>
  );
}
