import React, { useState } from 'react';
import {
  ArrowLeft,
  SlidersHorizontal,
  Zap,
  Download,
  User,
  Clock,
  ListFilter,
  ChevronDown,
  ChevronRight,
  Heart,
  Bug,
  Info,
  ShieldCheck,
  RotateCcw,
  Trash2,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SettingsViewProps {
  darkMode?: boolean;
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ darkMode = false, onBack }) => {
  // Settings persistent state in localStorage with defaults
  const [hapticFeedback, setHapticFeedback] = useState<boolean>(() => {
    const saved = localStorage.getItem('pk_haptic_feedback');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [autoDownload, setAutoDownload] = useState<boolean>(() => {
    const saved = localStorage.getItem('pk_auto_download');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [authorMetadata, setAuthorMetadata] = useState<string>(() => {
    return localStorage.getItem('pk_author_metadata') || '';
  });

  const [autoWipeHistory, setAutoWipeHistory] = useState<boolean>(() => {
    const saved = localStorage.getItem('pk_auto_wipe_history');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [historyLimit, setHistoryLimit] = useState<string>(() => {
    return localStorage.getItem('pk_history_limit') || '10 Files';
  });

  // Modal states
  const [activeModal, setActiveModal] = useState<
    'sponsor' | 'report' | 'about' | 'privacy' | 'restore' | 'nuke' | null
  >(null);
  const [showHistoryLimitMenu, setShowHistoryLimitMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2600);
  };

  const triggerHaptic = () => {
    if (hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(12);
      } catch {
        // Ignore haptic errors on unsupported devices
      }
    }
  };

  // Toggle handlers
  const handleToggleHaptic = () => {
    const newVal = !hapticFeedback;
    setHapticFeedback(newVal);
    localStorage.setItem('pk_haptic_feedback', JSON.stringify(newVal));
    if (newVal && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([10, 20]);
    }
    showToast(newVal ? 'Haptic feedback enabled' : 'Haptic feedback disabled');
  };

  const handleToggleAutoDownload = () => {
    triggerHaptic();
    const newVal = !autoDownload;
    setAutoDownload(newVal);
    localStorage.setItem('pk_auto_download', JSON.stringify(newVal));
    showToast(newVal ? 'Auto-Download enabled' : 'Auto-Download disabled');
  };

  const handleAuthorMetadataChange = (val: string) => {
    setAuthorMetadata(val);
    localStorage.setItem('pk_author_metadata', val);
  };

  const handleToggleAutoWipe = () => {
    triggerHaptic();
    const newVal = !autoWipeHistory;
    setAutoWipeHistory(newVal);
    localStorage.setItem('pk_auto_wipe_history', JSON.stringify(newVal));
    showToast(newVal ? 'Auto-wipe history active' : 'Auto-wipe history disabled');
  };

  const handleSelectHistoryLimit = (limit: string) => {
    triggerHaptic();
    setHistoryLimit(limit);
    localStorage.setItem('pk_history_limit', limit);
    setShowHistoryLimitMenu(false);
    showToast(`History limit set to ${limit}`);
  };

  const handleRestoreDefaults = () => {
    triggerHaptic();
    setHapticFeedback(true);
    setAutoDownload(false);
    setAuthorMetadata('');
    setAutoWipeHistory(false);
    setHistoryLimit('10 Files');

    localStorage.removeItem('pk_haptic_feedback');
    localStorage.removeItem('pk_auto_download');
    localStorage.removeItem('pk_author_metadata');
    localStorage.removeItem('pk_auto_wipe_history');
    localStorage.removeItem('pk_history_limit');

    setActiveModal(null);
    showToast('Preferences restored to factory defaults');
  };

  const handleNukeAllData = () => {
    triggerHaptic();
    // Clear custom settings and stored files
    localStorage.clear();
    sessionStorage.clear();

    setHapticFeedback(true);
    setAutoDownload(false);
    setAuthorMetadata('');
    setAutoWipeHistory(false);
    setHistoryLimit('10 Files');

    setActiveModal(null);
    showToast('All cached data & settings nuked successfully');
  };

  const handleSponsorClick = () => {
    triggerHaptic();
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Confetti fallback
    }
    setActiveModal('sponsor');
  };

  return (
    <div
      style={{ paddingBottom: 'var(--content-bottom-padding)' }}
      className={`flex-1 flex flex-col px-4 pt-1 animate-in fade-in duration-200 ${
        darkMode ? 'text-white' : 'text-[#121212]'
      }`}
    >
      {/* 1. Header with back arrow & title */}
      <div className="flex items-center gap-3 py-3">
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            onBack();
          }}
          className={`p-2 -ml-2 rounded-full transition-colors ${
            darkMode ? 'hover:bg-white/10 active:bg-white/20' : 'hover:bg-black/5 active:bg-black/10'
          }`}
          aria-label="Back to previous screen"
        >
          <ArrowLeft className="w-5 h-5 text-current" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">System</h1>
      </div>

      {/* 2. Preferences Header Card */}
      <div className="flex items-center gap-3.5 my-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E03A30] to-[#FF4E45] shadow-sm flex items-center justify-center shrink-0">
          <SlidersHorizontal className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold leading-tight tracking-tight">Preferences</h2>
          <p className="text-[10px] font-semibold tracking-wider text-gray-400 dark:text-white/40 uppercase mt-0.5">
            PROTOCOL V1.0.9 • LOCAL
          </p>
        </div>
      </div>

      {/* 3. INTERFACE (Theme omitted as requested: "don't add colour, theme") */}
      <div className="mt-4">
        <div className="px-1 mb-2">
          <span className="text-[11px] font-bold text-gray-400 dark:text-white/40 tracking-[0.15em] uppercase">
            INTERFACE
          </span>
        </div>
        <div
          className={`rounded-[26px] border shadow-xs overflow-hidden ${
            darkMode ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-black/5'
          }`}
        >
          {/* Haptic Feedback Item */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  darkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Haptic Feedback</h3>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-white/40 tracking-wider uppercase mt-0.5">
                  TACTILE RESPONSE ENGINE
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={hapticFeedback}
              onClick={handleToggleHaptic}
              className={`w-12 h-7 rounded-full p-1 transition-colors relative cursor-pointer ${
                hapticFeedback
                  ? 'bg-[#121212] dark:bg-white'
                  : darkMode
                  ? 'bg-white/20'
                  : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full shadow-xs transition-transform transform ${
                  hapticFeedback
                    ? 'translate-x-5 bg-white dark:bg-black'
                    : 'translate-x-0 bg-white'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 4. WORKFLOW */}
      <div className="mt-6">
        <div className="px-1 mb-2">
          <span className="text-[11px] font-bold text-gray-400 dark:text-white/40 tracking-[0.15em] uppercase">
            WORKFLOW
          </span>
        </div>
        <div
          className={`rounded-[26px] border shadow-xs overflow-hidden ${
            darkMode ? 'bg-[#1C1C1E] border-white/10 divide-white/10' : 'bg-white border-black/5 divide-gray-100'
          } divide-y`}
        >
          {/* Auto-Download */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  darkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Auto-Download</h3>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-white/40 tracking-wider uppercase mt-0.5">
                  IMMEDIATE RESULT EXPORT
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={autoDownload}
              onClick={handleToggleAutoDownload}
              className={`w-12 h-7 rounded-full p-1 transition-colors relative cursor-pointer ${
                autoDownload
                  ? 'bg-[#121212] dark:bg-white'
                  : darkMode
                  ? 'bg-white/20'
                  : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full shadow-xs transition-transform transform ${
                  autoDownload
                    ? 'translate-x-5 bg-white dark:bg-black'
                    : 'translate-x-0 bg-white'
                }`}
              />
            </button>
          </div>

          {/* Default Author Metadata */}
          <div className="p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#E03A30]" />
              <label
                htmlFor="author-metadata"
                className="text-[11px] font-bold tracking-wider text-gray-700 dark:text-white/80 uppercase"
              >
                DEFAULT AUTHOR METADATA
              </label>
            </div>
            <input
              id="author-metadata"
              type="text"
              value={authorMetadata}
              onChange={(e) => handleAuthorMetadataChange(e.target.value)}
              placeholder="e.g. potatameister"
              className={`w-full rounded-2xl px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#CA4639] ${
                darkMode
                  ? 'bg-black/30 border border-white/10 text-white placeholder-white/30'
                  : 'bg-gray-100/80 border border-transparent text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 5. PRIVACY */}
      <div className="mt-6">
        <div className="px-1 mb-2">
          <span className="text-[11px] font-bold text-gray-400 dark:text-white/40 tracking-[0.15em] uppercase">
            PRIVACY
          </span>
        </div>
        <div
          className={`rounded-[26px] border shadow-xs overflow-hidden ${
            darkMode ? 'bg-[#1C1C1E] border-white/10 divide-white/10' : 'bg-white border-black/5 divide-gray-100'
          } divide-y`}
        >
          {/* Auto-Wipe History */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  darkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Auto-Wipe History</h3>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-white/40 tracking-wider uppercase mt-0.5">
                  AUTOMATIC LOG DESTRUCTION
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={autoWipeHistory}
              onClick={handleToggleAutoWipe}
              className={`w-12 h-7 rounded-full p-1 transition-colors relative cursor-pointer ${
                autoWipeHistory
                  ? 'bg-[#121212] dark:bg-white'
                  : darkMode
                  ? 'bg-white/20'
                  : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full shadow-xs transition-transform transform ${
                  autoWipeHistory
                    ? 'translate-x-5 bg-white dark:bg-black'
                    : 'translate-x-0 bg-white'
                }`}
              />
            </button>
          </div>

          {/* History Limit */}
          <div className="flex items-center justify-between p-4 relative">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  darkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <ListFilter className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">History Limit</h3>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-white/40 tracking-wider uppercase mt-0.5">
                  FILES TO KEEP
                </p>
              </div>
            </div>

            {/* Dropdown Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setShowHistoryLimitMenu(!showHistoryLimitMenu);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  darkMode
                    ? 'bg-white/10 hover:bg-white/15 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                <span>{historyLimit}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {showHistoryLimitMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowHistoryLimitMenu(false)}
                  />
                  <div
                    className={`absolute right-0 bottom-full mb-1.5 w-36 rounded-2xl p-1.5 shadow-xl border z-40 animate-in fade-in zoom-in-95 duration-150 ${
                      darkMode ? 'bg-[#2C2C2E] border-white/10 text-white' : 'bg-white border-black/10 text-gray-800'
                    }`}
                  >
                    {['5 Files', '10 Files', '25 Files', '50 Files', 'Unlimited'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectHistoryLimit(opt)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                          historyLimit === opt
                            ? darkMode
                              ? 'bg-white/15 text-white'
                              : 'bg-gray-100 text-black font-bold'
                            : darkMode
                            ? 'hover:bg-white/10'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span>{opt}</span>
                        {historyLimit === opt && <Check className="w-3.5 h-3.5 text-[#CA4639]" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6. ECOSYSTEM */}
      <div className="mt-6">
        <div className="px-1 mb-2">
          <span className="text-[11px] font-bold text-gray-400 dark:text-white/40 tracking-[0.15em] uppercase">
            ECOSYSTEM
          </span>
        </div>
        <div
          className={`rounded-[26px] border shadow-xs overflow-hidden ${
            darkMode ? 'bg-[#1C1C1E] border-white/10 divide-white/10' : 'bg-white border-black/5 divide-gray-100'
          } divide-y`}
        >
          {/* Sponsor Project */}
          <button
            type="button"
            onClick={handleSponsorClick}
            className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
              darkMode ? 'hover:bg-white/5 active:bg-white/10' : 'hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  darkMode ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-50 text-[#E03A30]'
                }`}
              >
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Sponsor Project</h3>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-white/40 tracking-wider uppercase mt-0.5">
                  FUEL DEVELOPMENT
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-white/30" />
          </button>

          {/* Report Issue */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveModal('report');
            }}
            className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
              darkMode ? 'hover:bg-white/5 active:bg-white/10' : 'hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  darkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Bug className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Report Issue</h3>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-white/40 tracking-wider uppercase mt-0.5">
                  GITHUB TRACKER
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-white/30" />
          </button>

          {/* About PaperKnife */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveModal('about');
            }}
            className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
              darkMode ? 'hover:bg-white/5 active:bg-white/10' : 'hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  darkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">About PaperKnife</h3>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-white/40 tracking-wider uppercase mt-0.5">
                  PROTOCOL DETAILS
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-white/30" />
          </button>

          {/* Privacy Protocol */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveModal('privacy');
            }}
            className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
              darkMode ? 'hover:bg-white/5 active:bg-white/10' : 'hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  darkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Privacy Protocol</h3>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-white/40 tracking-wider uppercase mt-0.5">
                  DATA HANDLING SPEC
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-white/30" />
          </button>
        </div>
      </div>

      {/* 7. DANGER ZONE */}
      <div className="mt-6 mb-4">
        <div className="px-1 mb-2">
          <span className="text-[11px] font-bold text-[#E03A30] tracking-[0.15em] uppercase">
            DANGER ZONE
          </span>
        </div>
        <div
          className={`rounded-[26px] border shadow-xs overflow-hidden ${
            darkMode ? 'bg-[#1C1C1E] border-white/10 divide-white/10' : 'bg-white border-black/5 divide-gray-100'
          } divide-y`}
        >
          {/* Restore Defaults */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveModal('restore');
            }}
            className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
              darkMode ? 'hover:bg-white/5 active:bg-white/10' : 'hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  darkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Restore Defaults</h3>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-white/40 tracking-wider uppercase mt-0.5">
                  RESET PREFERENCES
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-white/30" />
          </button>

          {/* Nuke All Data */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveModal('nuke');
            }}
            className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
              darkMode ? 'hover:bg-red-500/10 active:bg-red-500/20' : 'hover:bg-red-50/60 active:bg-red-100/60'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-red-100/80 dark:bg-red-500/20 text-[#E03A30] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight text-[#E03A30]">Nuke All Data</h3>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-white/40 tracking-wider uppercase mt-0.5">
                  IRREVERSIBLE WIPEDOWN
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-white/30" />
          </button>
        </div>
      </div>

      {/* Floating Feedback Toast */}
      {toastMessage && (
        <div className="fixed top-6 inset-x-0 mx-auto w-fit max-w-xs z-50 animate-in slide-in-from-top duration-200">
          <div className="bg-[#121212] text-white dark:bg-white dark:text-black px-4 py-2 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Interactive Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-sm rounded-[28px] p-6 shadow-2xl border flex flex-col animate-in zoom-in-95 duration-150 ${
              darkMode ? 'bg-[#1C1C1E] border-white/10 text-white' : 'bg-white border-black/10 text-[#121212]'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                {activeModal === 'sponsor' && (
                  <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-500/20 text-[#E03A30] flex items-center justify-center">
                    <Heart className="w-5 h-5 fill-current" />
                  </div>
                )}
                {activeModal === 'report' && (
                  <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white flex items-center justify-center">
                    <Bug className="w-5 h-5" />
                  </div>
                )}
                {activeModal === 'about' && (
                  <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white flex items-center justify-center">
                    <Info className="w-5 h-5" />
                  </div>
                )}
                {activeModal === 'privacy' && (
                  <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                )}
                {activeModal === 'restore' && (
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 flex items-center justify-center">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                )}
                {activeModal === 'nuke' && (
                  <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-500/20 text-[#E03A30] flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                )}
                <h3 className="text-base font-bold">
                  {activeModal === 'sponsor' && 'Sponsor PaperKnife'}
                  {activeModal === 'report' && 'GitHub Issue Tracker'}
                  {activeModal === 'about' && 'About PaperKnife'}
                  {activeModal === 'privacy' && 'Privacy Protocol Spec'}
                  {activeModal === 'restore' && 'Restore Preferences?'}
                  {activeModal === 'nuke' && 'Irreversible Wipedown?'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="text-xs leading-relaxed text-gray-600 dark:text-white/70 space-y-3">
              {activeModal === 'sponsor' && (
                <>
                  <p>
                    PaperKnife is an open, private client-side document and image processing toolkit.
                    No servers, no tracking, no data harvesting.
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Thank you for fueling the development of zero-telemetry software!
                  </p>
                </>
              )}

              {activeModal === 'report' && (
                <>
                  <p>
                    Encountered a bug or have a feature suggestion? All issues are tracked transparently in the public issue repository.
                  </p>
                  <div className={`p-3 rounded-xl border font-mono text-[11px] ${
                    darkMode ? 'bg-black/30 border-white/10 text-white/80' : 'bg-gray-50 border-black/5 text-gray-700'
                  }`}>
                    Engine status: Operational (v1.0.9)
                    <br />
                    WebAssembly runtime: Active
                  </div>
                </>
              )}

              {activeModal === 'about' && (
                <>
                  <p>
                    <strong>PaperKnife Core Engine</strong> executes 100% locally in your browser environment.
                  </p>
                  <div className={`p-3 rounded-2xl border text-[11px] space-y-1.5 ${
                    darkMode ? 'bg-black/30 border-white/10' : 'bg-gray-50 border-black/5'
                  }`}>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Protocol:</span>
                      <span className="font-mono font-bold">v1.0.9 Local</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Execution:</span>
                      <span className="font-mono font-bold">Client-Side WASM / Canvas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cloud Storage:</span>
                      <span className="font-mono font-bold text-emerald-500">Zero (Disabled)</span>
                    </div>
                  </div>
                </>
              )}

              {activeModal === 'privacy' && (
                <>
                  <p>
                    <strong>Zero-Trace Local Processing:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-white/70">
                    <li>Your files are never transmitted to any external server.</li>
                    <li>All conversions, compression, and redactions take place in browser memory.</li>
                    <li>Memory is released immediately upon export or page reload.</li>
                  </ul>
                </>
              )}

              {activeModal === 'restore' && (
                <p>
                  This will reset all your workflow preferences, metadata author defaults, and limit settings to their original state.
                </p>
              )}

              {activeModal === 'nuke' && (
                <p className="text-red-500 font-medium">
                  WARNING: This will immediately delete all stored files, cache, recent history, and clear all local session storage permanently.
                </p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {activeModal === 'restore' || activeModal === 'nuke' ? 'Cancel' : 'Close'}
              </button>

              {activeModal === 'sponsor' && (
                <button
                  type="button"
                  onClick={() => {
                    confetti({ particleCount: 80, spread: 80 });
                    showToast('Thank you for your generous support!');
                    setActiveModal(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#E03A30] hover:bg-[#C92F26] text-white flex items-center gap-1.5 shadow-sm"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>Support Project</span>
                </button>
              )}

              {activeModal === 'report' && (
                <button
                  type="button"
                  onClick={() => {
                    showToast('Feedback recorded locally');
                    setActiveModal(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#121212] dark:bg-white dark:text-black text-white flex items-center gap-1.5 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Submit Report</span>
                </button>
              )}

              {activeModal === 'restore' && (
                <button
                  type="button"
                  onClick={handleRestoreDefaults}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                >
                  Restore Defaults
                </button>
              )}

              {activeModal === 'nuke' && (
                <button
                  type="button"
                  onClick={handleNukeAllData}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm"
                >
                  Nuke Everything
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
