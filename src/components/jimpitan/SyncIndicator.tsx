import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { JimpitanRepository } from '@/lib/repositories/jimpitanRepository';

export default function SyncIndicator() {
  const isOnline = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPendingData, setHasPendingData] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Monitor pending writes
  useEffect(() => {
    const unsubscribe = JimpitanRepository.observePendingWrites((hasPending) => {
      setHasPendingData(hasPending);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) return;
    
    setIsSyncing(true);
    setSyncStatus('syncing');
    
    try {
      await JimpitanRepository.syncPendingWrites();
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error("Sync error:", error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-4">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between mb-3 backdrop-blur-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-2 rounded-lg">
              <WifiOff className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-500">Mode Offline Aktif</p>
              <p className="text-xs text-amber-500/80">Data disimpan lokal. Akan sinkron otomatis saat online.</p>
            </div>
          </div>
          {hasPendingData && (
             <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full border border-amber-500/20">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Pending Sync</span>
             </div>
          )}
        </div>
      )}

      {/* Online Status & Sync Button (Only if has pending data OR syncing/success) */}
      {isOnline && (hasPendingData || syncStatus !== 'idle') && (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-3 flex items-center justify-between backdrop-blur-sm transition-all animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
             <div className="bg-emerald-500/10 p-2 rounded-lg">
               <Wifi className="w-5 h-5 text-emerald-500" />
             </div>
             <div>
               <p className="text-sm font-semibold text-emerald-500">Terhubung Jaringan</p>
               <p className="text-xs text-slate-400">
                 {hasPendingData ? 'Ditemukan data offline yang belum terupload' : 'Semua data telah tersinkronisasi'}
               </p>
             </div>
          </div>
          
          <button
            onClick={handleManualSync}
            disabled={isSyncing || (syncStatus === 'success' && !hasPendingData)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              syncStatus === 'success' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
            } disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {syncStatus === 'syncing' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sync...</span>
              </>
            ) : syncStatus === 'success' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Berhasil</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Sinkron Sekarang</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
