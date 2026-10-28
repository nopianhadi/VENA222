import React, { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  Sparkles,
  Clock,
  Calendar,
  MapPin,
  TrendingUp,
  PlusCircle,
  CheckCircle2,
  RefreshCw,
  Copy,
  ExternalLink,
  Layers,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Zap,
  DollarSign,
  Users,
  Camera,
  Heart,
  Palette,
  Info
} from 'lucide-react';
import { useSimplifiedData } from '../../../contexts/SimplifiedDataContext';
import { useAuxiliaryData } from '../../../hooks/useAuxiliaryData';
import {
  buildWidgetPayload,
  syncWidgetData,
  WidgetPayload,
  formatRupiahAbbreviated,
} from '../../../services/widgetBridge';

type WidgetSize = 'small' | 'medium' | 'large';
type DeviceType = 'ios' | 'android';
type ThemePreset = 'royal' | 'emerald' | 'amber' | 'amoled';

const THEMES: Record<ThemePreset, {
  name: string;
  bgGradient: string;
  cardBg: string;
  border: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  badgeBg: string;
  badgeText: string;
  iconBg: string;
}> = {
  royal: {
    name: 'Vena Royal Blue',
    bgGradient: 'from-slate-900 via-indigo-950 to-slate-900',
    cardBg: 'bg-slate-900/80 backdrop-blur-xl',
    border: 'border-indigo-500/30 shadow-[0_8px_32px_rgba(79,70,229,0.25)]',
    accent: '#6366F1',
    textPrimary: 'text-white',
    textSecondary: 'text-slate-300',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30',
    badgeText: 'text-indigo-300',
    iconBg: 'bg-indigo-500/20 text-indigo-400',
  },
  emerald: {
    name: 'Emerald Luxury',
    bgGradient: 'from-zinc-950 via-emerald-950/80 to-zinc-950',
    cardBg: 'bg-zinc-900/85 backdrop-blur-xl',
    border: 'border-emerald-500/30 shadow-[0_8px_32px_rgba(16,185,129,0.2)]',
    accent: '#10B981',
    textPrimary: 'text-white',
    textSecondary: 'text-emerald-200/70',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30',
    badgeText: 'text-emerald-300',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
  },
  amber: {
    name: 'Sunset Amber',
    bgGradient: 'from-neutral-950 via-amber-950/60 to-neutral-950',
    cardBg: 'bg-stone-900/85 backdrop-blur-xl',
    border: 'border-amber-500/30 shadow-[0_8px_32px_rgba(245,158,11,0.2)]',
    accent: '#F59E0B',
    textPrimary: 'text-white',
    textSecondary: 'text-amber-200/70',
    badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-400/30',
    badgeText: 'text-amber-300',
    iconBg: 'bg-amber-500/20 text-amber-400',
  },
  amoled: {
    name: 'Pure AMOLED Dark',
    bgGradient: 'from-black via-zinc-950 to-black',
    cardBg: 'bg-black/90 backdrop-blur-2xl',
    border: 'border-white/15 shadow-[0_8px_32px_rgba(255,255,255,0.06)]',
    accent: '#38BDF8',
    textPrimary: 'text-white',
    textSecondary: 'text-zinc-400',
    badgeBg: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    badgeText: 'text-zinc-300',
    iconBg: 'bg-zinc-800 text-sky-400',
  },
};

const WALLPAPERS = [
  { id: 'bokeh', name: 'Wedding Bokeh', url: 'radial-gradient(ellipse at top left, #312e81 0%, #0f172a 60%, #020617 100%)' },
  { id: 'minimal', name: 'Dark Studio', url: 'linear-gradient(135deg, #1e1b4b 0%, #111827 50%, #030712 100%)' },
  { id: 'emerald', name: 'Nordic Forest', url: 'linear-gradient(145deg, #064e3b 0%, #022c22 45%, #050505 100%)' },
  { id: 'sunset', name: 'Golden Hour', url: 'linear-gradient(160deg, #78350f 0%, #451a03 50%, #0a0a0a 100%)' },
];

export const WidgetStudio: React.FC = () => {
  const data = useSimplifiedData();
  const auxData = useAuxiliaryData({
    appDataClientFeedback: data.clientFeedback || [],
    appDataLoadedClientFeedback: !data.loading.clientFeedback,
    setClientFeedback: data.setClientFeedback,
  });

  const [selectedSize, setSelectedSize] = useState<WidgetSize>('medium');
  const [device, setDevice] = useState<DeviceType>('ios');
  const [theme, setTheme] = useState<ThemePreset>('royal');
  const [wallpaperIdx, setWallpaperIdx] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [simulatedAction, setSimulatedAction] = useState<string | null>(null);
  const [activeGuideTab, setActiveGuideTab] = useState<'pwa' | 'android' | 'ios'>('pwa');
  const [showFloatingWidget, setShowFloatingWidget] = useState<boolean>(() => {
    return localStorage.getItem('weddfin_floating_widget_enabled') === 'true';
  });

  const toggleFloatingWidget = () => {
    const nextVal = !showFloatingWidget;
    setShowFloatingWidget(nextVal);
    localStorage.setItem('weddfin_floating_widget_enabled', String(nextVal));
  };

  // Build live widget data from current app state
  const payload: WidgetPayload = useMemo(() => {
    return buildWidgetPayload({
      events: data.calendarEvents,
      projects: data.projects,
      profile: auxData.profile,
      totals: data.totals,
    });
  }, [data.calendarEvents, data.projects, auxData.profile, data.totals]);

  // Synchronize with storage on mount and when payload changes
  useEffect(() => {
    void syncWidgetData(payload);
  }, [payload]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Menyiapkan data payload snapshot...');
    
    await new Promise(resolve => setTimeout(resolve, 600));
    const result = await syncWidgetData(payload);
    
    setIsSyncing(false);
    if (result.nativeSync) {
      setSyncStatus('Tersinkronisasi ke Native AppWidget & WidgetKit!');
    } else {
      setSyncStatus('Tersimpan di Cache Lokal & Siap Ditampilkan!');
    }

    setTimeout(() => setSyncStatus(null), 3500);
  };

  const triggerActionSimulation = (label: string, deepLink: string) => {
    setSimulatedAction(`Deep Link Dipicu: ${deepLink} (${label})`);
    setTimeout(() => setSimulatedAction(null), 4000);
  };

  const currentTheme = THEMES[theme];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8 animate-fadeIn">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/20 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>CUSTOM HOME SCREEN WIDGET SYSTEM</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              Widget Studio & Live Simulator
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
              Tampilkan agenda pemotretan, countdown jadwal akad, dan metrik bisnis Vena Pictures langsung di layar utama smartphone Android dan iPhone tanpa perlu membuka aplikasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan ke Widget'}</span>
            </button>
          </div>
        </div>

        {/* Sync Toast Feedback */}
        {syncStatus && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{syncStatus}</span>
          </div>
        )}

        {/* Simulated Deep Link Feedback */}
        {simulatedAction && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-sm flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="font-mono text-xs">{simulatedAction}</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300">
              Simulasi Deep Link Berhasil
            </span>
          </div>
        )}
      </div>

      {/* Main Studio Grid: Controls & Phone Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Customization Controls (4 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Size Switcher */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Pilihan Ukuran Widget
              </span>
              <span className="text-xs text-indigo-400 font-medium">3 Ukuran Responsif</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'small', label: 'Kecil', desc: '2x2 Grid', icon: 'S' },
                { id: 'medium', label: 'Sedang', desc: '4x2 Grid', icon: 'M' },
                { id: 'large', label: 'Besar', desc: '4x4 Grid', icon: 'L' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSize(s.id as WidgetSize)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedSize === s.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold block">{s.label}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Device Simulator Switcher */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                Frame Simulator OS
              </span>
              <span className="text-xs text-slate-500">Android & iOS</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDevice('ios')}
                className={`p-3 rounded-xl border text-center font-medium text-xs transition-all cursor-pointer ${
                  device === 'ios'
                    ? 'bg-slate-800 border-indigo-500 text-white shadow'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
                }`}
              >
                 Apple iPhone (WidgetKit)
              </button>
              <button
                onClick={() => setDevice('android')}
                className={`p-3 rounded-xl border text-center font-medium text-xs transition-all cursor-pointer ${
                  device === 'android'
                    ? 'bg-slate-800 border-indigo-500 text-white shadow'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
                }`}
              >
                🤖 Android (AppWidget)
              </button>
            </div>
          </div>

          {/* 3. Theme & Colorway Presets */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-400" />
                Tema Warna Widget
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(THEMES) as ThemePreset[]).map(tKey => {
                const item = THEMES[tKey];
                const active = theme === tKey;
                return (
                  <button
                    key={tKey}
                    onClick={() => setTheme(tKey)}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                      active
                        ? 'border-indigo-400 bg-slate-800 text-white'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: item.accent }}
                    />
                    <span className="text-xs font-medium truncate">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Wallpaper Backgrounds */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Wallpaper Layar Utama
            </span>
            <div className="grid grid-cols-4 gap-2">
              {WALLPAPERS.map((wp, idx) => (
                <button
                  key={wp.id}
                  onClick={() => setWallpaperIdx(idx)}
                  className={`h-12 rounded-lg border transition-all cursor-pointer overflow-hidden relative ${
                    wallpaperIdx === idx ? 'ring-2 ring-indigo-500 scale-105' : 'border-slate-700 opacity-60 hover:opacity-100'
                  }`}
                  style={{ background: wp.url }}
                  title={wp.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Phone Canvas & Live Simulator (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="text-center mb-3">
            <span className="text-xs text-slate-400">
              Klik pada bagian widget di bawah untuk menguji respon interaksi & Deep Link
            </span>
          </div>

          {/* Realistic Phone Shell */}
          <div className="w-[360px] sm:w-[390px] h-[720px] rounded-[52px] p-3.5 bg-gradient-to-b from-neutral-800 via-neutral-900 to-neutral-800 border-4 border-neutral-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative flex flex-col overflow-hidden">
            {/* Screen Inner */}
            <div
              className="w-full h-full rounded-[42px] overflow-hidden relative flex flex-col p-4 justify-between"
              style={{ background: WALLPAPERS[wallpaperIdx].url }}
            >
              {/* Dynamic Island / Camera Notch */}
              <div className="w-full flex justify-between items-center px-4 pt-1 z-20">
                <span className="text-xs font-semibold text-white tracking-wider">09:41</span>
                {device === 'ios' ? (
                  <div className="w-24 h-6 bg-black rounded-full flex items-center justify-center shadow-inner">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mr-2 border border-slate-800" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-black mx-auto border border-zinc-800" />
                )}
                <div className="flex items-center gap-1.5 text-white text-[11px]">
                  <span>5G</span>
                  <div className="w-5 h-2.5 border border-white/60 rounded-sm p-0.5 flex items-center">
                    <div className="h-full w-full bg-white rounded-xs" />
                  </div>
                </div>
              </div>

              {/* Home Screen Content: Date & Widget Container */}
              <div className="my-auto space-y-4 z-10 w-full animate-fadeIn">
                {/* Date Label on Screen */}
                <div className="text-center text-white/80 text-xs font-light tracking-wide drop-shadow">
                  Rabu, 28 Oktober 2026
                </div>

                {/* THE WIDGET ITSELF */}
                <div className="transition-all duration-300 transform">
                  {selectedSize === 'small' && (
                    <SmallWidgetView
                      payload={payload}
                      theme={currentTheme}
                      onTriggerAction={triggerActionSimulation}
                    />
                  )}
                  {selectedSize === 'medium' && (
                    <MediumWidgetView
                      payload={payload}
                      theme={currentTheme}
                      onTriggerAction={triggerActionSimulation}
                    />
                  )}
                  {selectedSize === 'large' && (
                    <LargeWidgetView
                      payload={payload}
                      theme={currentTheme}
                      onTriggerAction={triggerActionSimulation}
                    />
                  )}
                </div>

                {/* Mock Sample App Icons under widget */}
                <div className="grid grid-cols-4 gap-3 pt-6 px-1">
                  {[
                    { name: 'Kamera', color: 'from-zinc-700 to-zinc-900', icon: Camera },
                    { name: 'Foto', color: 'from-rose-500 to-pink-600', icon: Heart },
                    { name: 'Kalender', color: 'from-blue-500 to-indigo-600', icon: Calendar },
                    { name: 'Klien', color: 'from-amber-500 to-orange-600', icon: Users },
                  ].map((app, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${app.color} flex items-center justify-center text-white shadow-lg`}>
                        <app.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-white/90 drop-shadow font-medium">{app.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Dock */}
              <div className="w-full bg-white/10 backdrop-blur-2xl rounded-3xl p-2.5 flex justify-around items-center border border-white/20 z-10 mb-2">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-md">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="w-11 h-11 rounded-2xl bg-sky-500 flex items-center justify-center text-white shadow-md">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-md">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

              {/* Home Indicator Bar */}
              <div className="w-32 h-1 bg-white/70 rounded-full mx-auto -mb-1 z-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Guide Section: How to Add Widget on Android & iOS */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Panduan Pemasangan Widget ke Layar Utama
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Ikuti langkah mudah di bawah untuk menyematkan widget Vena Pictures di smartphone Anda.
            </p>
          </div>

          <div className="flex flex-wrap rounded-xl bg-slate-800 p-1 border border-slate-700/60 self-start gap-1">
            <button
              onClick={() => setActiveGuideTab('pwa')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeGuideTab === 'pwa' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🌐 Web / Chrome PWA (Tanpa APK)</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">Rekomendasi</span>
            </button>
            <button
              onClick={() => setActiveGuideTab('android')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeGuideTab === 'android' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Android (APK)
            </button>
            <button
              onClick={() => setActiveGuideTab('ios')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeGuideTab === 'ios' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              iPhone (Xcode)
            </button>
          </div>
        </div>

        {activeGuideTab === 'pwa' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: '01', title: 'Buka Web di Chrome / Safari', desc: 'Akses URL Vena Pictures melalui browser Google Chrome di Android atau Safari di iPhone.' },
                { step: '02', title: 'Pilih "Instal Aplikasi"', desc: 'Di Chrome: Ketuk menu titik tiga (⋮) ➔ "Instal aplikasi" (atau "Tambahkan ke Layar Utama"). Di Safari: Ketuk tombol Share (kotak panah) ➔ "Add to Home Screen".' },
                { step: '03', title: 'PWA App Shortcuts', desc: 'Setelah ikon muncul di layar utama HP, tekan lama ikon aplikasi tersebut. Langsung muncul menu cepat: Agenda, Tambah Klien, & Keuangan.' },
                { step: '04', title: 'Pin ke Layar Utama (Android)', desc: 'Di Android, Anda bisa menarik pintasan "Agenda" atau "Tambah Klien" langsung ke layar utama menjadi mini-widget 1x1 tanpa butuh APK!' },
              ].map(item => (
                <div key={item.step} className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2 relative overflow-hidden">
                  <span className="text-2xl font-black text-indigo-500/30 absolute right-3 top-2">{item.step}</span>
                  <h3 className="text-sm font-bold text-white relative z-10">{item.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed relative z-10">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* In-App Floating Widget Option */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Widget Melayang di Dalam Web Dashboard</h4>
                  <p className="text-xs text-slate-400">
                    Aktifkan widget ringkas yang selalu melayang di sudut layar web Anda untuk memantau countdown pemotretan berikutnya secara real-time.
                  </p>
                </div>
              </div>

              <button
                onClick={toggleFloatingWidget}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  showFloatingWidget
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {showFloatingWidget ? '✓ Widget Melayang Aktif' : '+ Aktifkan Widget Melayang'}
              </button>
            </div>
          </div>
        )}

        {activeGuideTab === 'android' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Tekan Lama Layar Utama', desc: 'Sentuh dan tahan area kosong pada home screen smartphone Anda selama 2 detik.' },
              { step: '02', title: 'Pilih Menu "Widgets"', desc: 'Ketuk ikon "Widget" yang muncul di bagian bawah layar.' },
              { step: '03', title: 'Cari "Vena Pictures"', desc: 'Gulir ke bawah atau ketik "Vena Pictures" pada bilah pencarian widget.' },
              { step: '04', title: 'Pilih Ukuran & Geser', desc: 'Pilih ukuran Kecil, Sedang, atau Besar, lalu tarik ke posisi layar yang Anda inginkan.' },
            ].map(item => (
              <div key={item.step} className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-2 relative overflow-hidden">
                <span className="text-2xl font-black text-indigo-500/30 absolute right-3 top-2">{item.step}</span>
                <h3 className="text-sm font-bold text-white relative z-10">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>
        )}

        {activeGuideTab === 'ios' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Mode Jiggle (Goyang)', desc: 'Tekan dan tahan area kosong pada layar utama iPhone hingga ikon aplikasi bergoyang.' },
              { step: '02', title: 'Ketuk Tombol "+"', desc: 'Tekan tombol tanda tambah (+) di pojok kiri atas layar.' },
              { step: '03', title: 'Cari "Vena Pictures"', desc: 'Temukan aplikasi Vena Pictures pada daftar widget yang didukung.' },
              { step: '04', title: 'Tambah Widget', desc: 'Geser untuk memilih ukuran (Small, Medium, Large) dan ketuk "Tambah Widget".' },
            ].map(item => (
              <div key={item.step} className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-2 relative overflow-hidden">
                <span className="text-2xl font-black text-indigo-500/30 absolute right-3 top-2">{item.step}</span>
                <h3 className="text-sm font-bold text-white relative z-10">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Floating Mini Widget In-Action inside Web */}
        {showFloatingWidget && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-indigo-500/50 rounded-2xl p-3 shadow-2xl flex items-center gap-3 text-left max-w-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                    {payload.nextEvent?.formattedCountdown || 'Hari Ini'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{payload.nextEvent?.time || '14:00'}</span>
                </div>
                <h5 className="text-xs font-bold text-white truncate mt-0.5">
                  {payload.nextEvent?.title || 'Sarah & Dimas'}
                </h5>
              </div>
              <button
                onClick={() => toggleFloatingWidget()}
                className="text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   INDIVIDUAL WIDGET VIEWS (SMALL, MEDIUM, LARGE)
   Designed with rich glassmorphic aesthetics, micro-animations & deep links
   ========================================================================= */

interface WidgetProps {
  payload: WidgetPayload;
  theme: typeof THEMES['royal'];
  onTriggerAction: (label: string, deepLink: string) => void;
}

/** Small Widget (2x2 Grid) */
const SmallWidgetView: React.FC<WidgetProps> = ({ payload, theme, onTriggerAction }) => {
  const event = payload.nextEvent;

  return (
    <div
      onClick={() => onTriggerAction('Buka Jadwal Acara', event?.deepLink || 'weddfin://calendar')}
      className={`w-36 h-36 mx-auto rounded-[28px] p-3.5 border ${theme.border} ${theme.cardBg} flex flex-col justify-between transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer relative overflow-hidden group shadow-2xl`}
    >
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-300">
            {payload.businessName}
          </span>
        </div>
        <Clock className="w-3 h-3 text-slate-400" />
      </div>

      {/* Event Details */}
      <div className="z-10 space-y-0.5">
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${theme.badgeBg}`}>
          {event?.formattedCountdown || 'Hari Ini'}
        </span>
        <h4 className="text-xs font-bold text-white leading-tight truncate mt-1">
          {event?.title || 'Sarah & Dimas'}
        </h4>
        <div className="flex items-center gap-1 text-[10px] text-slate-300">
          <Clock className="w-2.5 h-2.5 shrink-0" />
          <span>{event?.time || '14:00'} WIB</span>
        </div>
      </div>

      {/* Location Bottom */}
      <div className="z-10 flex items-center justify-between text-[9px] text-slate-400 border-t border-white/10 pt-1.5">
        <span className="truncate max-w-[90px]">{event?.location || 'Hotel Mulia'}</span>
        <ChevronRight className="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
};

/** Medium Widget (4x2 Grid) */
const MediumWidgetView: React.FC<WidgetProps> = ({ payload, theme, onTriggerAction }) => {
  const nextEvent = payload.nextEvent;
  const secondEvent = payload.upcomingEvents[1];

  return (
    <div
      className={`w-full max-w-[340px] mx-auto rounded-[30px] p-4 border ${theme.border} ${theme.cardBg} transition-all duration-300 hover:scale-[1.02] shadow-2xl relative overflow-hidden flex flex-col justify-between`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block leading-none">Agenda Pemotretan</span>
            <span className="text-[10px] text-slate-400">Diperbarui {payload.updatedAtFormatted}</span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onTriggerAction('Buka Kalender', payload.quickActions.calendar);
          }}
          className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Kalender</span>
          <ChevronRight className="w-3 h-3 text-indigo-400" />
        </button>
      </div>

      {/* Dual Event Cards */}
      <div className="grid grid-cols-2 gap-2.5 py-2.5">
        {/* Event 1 */}
        <div
          onClick={() => onTriggerAction('Detail Acara 1', nextEvent?.deepLink || 'weddfin://calendar')}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
              {nextEvent?.formattedCountdown || 'Hari Ini'}
            </span>
            <span className="text-[9px] text-slate-400 font-mono">{nextEvent?.time || '14:00'}</span>
          </div>
          <div className="my-1">
            <h5 className="text-[11px] font-bold text-white truncate">{nextEvent?.title || 'Sarah & Dimas'}</h5>
            <span className="text-[9px] text-slate-300 block truncate">{nextEvent?.location || 'Venue Utama'}</span>
          </div>
        </div>

        {/* Event 2 */}
        <div
          onClick={() => onTriggerAction('Detail Acara 2', secondEvent?.deepLink || 'weddfin://calendar')}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">
              Mendatang
            </span>
            <span className="text-[9px] text-slate-400 font-mono">{secondEvent?.time || '09:00'}</span>
          </div>
          <div className="my-1">
            <h5 className="text-[11px] font-bold text-white truncate">{secondEvent?.title || 'Rian & Jessica'}</h5>
            <span className="text-[9px] text-slate-300 block truncate">{secondEvent?.location || 'Hutan Pinus'}</span>
          </div>
        </div>
      </div>

      {/* Footer Mini Stats */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-white/5">
        <span className="flex items-center gap-1">
          <Camera className="w-3 h-3 text-indigo-400" />
          <span>{payload.stats.activeProjects} Proyek Aktif</span>
        </span>
        <span className="text-emerald-400 font-medium">
          Omset: {payload.stats.formattedRevenue}
        </span>
      </div>
    </div>
  );
};

/** Large Widget (4x4 Grid - Executive Cockpit) */
const LargeWidgetView: React.FC<WidgetProps> = ({ payload, theme, onTriggerAction }) => {
  return (
    <div
      className={`w-full max-w-[340px] mx-auto rounded-[34px] p-4 border ${theme.border} ${theme.cardBg} transition-all duration-300 hover:scale-[1.01] shadow-2xl relative overflow-hidden space-y-3`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">{payload.businessName}</h4>
            <span className="text-[9px] text-slate-400">Wedding Studio Cockpit</span>
          </div>
        </div>

        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono">
          ● Live
        </span>
      </div>

      {/* Key Financial & Operations Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div
          onClick={() => onTriggerAction('Buka Finance', payload.quickActions.finance)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <span className="text-[8px] text-slate-400 uppercase font-semibold block">Omset Bulan Ini</span>
          <span className="text-xs font-extrabold text-emerald-400 block mt-0.5 truncate">
            {payload.stats.formattedRevenue}
          </span>
        </div>

        <div
          onClick={() => onTriggerAction('Buka Finance Invoices', payload.quickActions.finance)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <span className="text-[8px] text-slate-400 uppercase font-semibold block">Sisa Piutang</span>
          <span className="text-xs font-extrabold text-amber-400 block mt-0.5 truncate">
            {payload.stats.formattedUnpaid}
          </span>
        </div>

        <div
          onClick={() => onTriggerAction('Buka Proyek Aktif', payload.quickActions.projects)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <span className="text-[8px] text-slate-400 uppercase font-semibold block">Proyek Aktif</span>
          <span className="text-xs font-extrabold text-sky-400 block mt-0.5 truncate">
            {payload.stats.activeProjects} Acara
          </span>
        </div>
      </div>

      {/* Agenda Section */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          <span>Agenda Terdekat</span>
          <span className="text-indigo-400">{payload.upcomingEvents.length || 2} Jadwal</span>
        </div>

        <div className="space-y-1.5">
          {(payload.upcomingEvents.length > 0
            ? payload.upcomingEvents.slice(0, 2)
            : [
                { id: '1', title: 'Sarah & Dimas (Akad)', time: '14:00', location: 'Hotel Mulia Senayan', deepLink: 'weddfin://calendar?id=1' },
                { id: '2', title: 'Rian & Jessica (Prewed)', time: '09:00', location: 'Hutan Pinus Mangunan', deepLink: 'weddfin://calendar?id=2' },
              ]
          ).map((item, idx) => (
            <div
              key={idx}
              onClick={() => onTriggerAction(`Buka Agenda ${item.title}`, item.deepLink)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between text-[10px] cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span className="font-semibold text-white truncate">{item.title}</span>
              </div>
              <span className="text-slate-400 font-mono shrink-0 ml-2">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Deep Link Buttons */}
      <div className="grid grid-cols-3 gap-1.5 pt-1">
        <button
          onClick={() => onTriggerAction('Tambah Klien Baru', payload.quickActions.newClient)}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[9px] flex items-center justify-center gap-1 shadow-md cursor-pointer transition-all active:scale-95"
        >
          <PlusCircle className="w-3 h-3" />
          <span>+ Klien</span>
        </button>

        <button
          onClick={() => onTriggerAction('Buka Kalender', payload.quickActions.calendar)}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[9px] flex items-center justify-center gap-1 border border-slate-700 cursor-pointer transition-all active:scale-95"
        >
          <Calendar className="w-3 h-3 text-indigo-400" />
          <span>Kalender</span>
        </button>

        <button
          onClick={() => onTriggerAction('Buka Keuangan', payload.quickActions.finance)}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[9px] flex items-center justify-center gap-1 border border-slate-700 cursor-pointer transition-all active:scale-95"
        >
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          <span>Keuangan</span>
        </button>
      </div>
    </div>
  );
};
