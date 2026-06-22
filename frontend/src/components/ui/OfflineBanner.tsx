import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getCacheStats } from '@/lib/offlineStore';

interface OfflineBannerProps {
  /** Appelé quand l'utilisateur demande une resync manuelle */
  onSync?: () => void;
  /** Indique si une sync est en cours */
  syncing?: boolean;
}

export default function OfflineBanner({ onSync, syncing }: OfflineBannerProps) {
  const isOnline = useOnlineStatus();
  const [stats, setStats] = useState<{ restaurants: number; menus: number } | null>(null);

  // Afficher les stats du cache quand on est hors ligne
  useEffect(() => {
    if (!isOnline) {
      getCacheStats().then(setStats).catch(() => {});
    }
  }, [isOnline]);

  if (isOnline) {
    // Banner de confirmation de reconnexion (disparaît après 3s)
    return <ReconnectedBanner syncing={syncing} onSync={onSync} />;
  }

  return (
    <div className="sticky top-0 z-50 flex items-center gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-amber-900">
      <WifiOff className="w-4 h-4 shrink-0 text-amber-600" />
      <span className="text-sm flex-1 min-w-0">
        <span className="font-medium">Mode hors ligne</span>
        {stats && (
          <span className="text-amber-700 ml-1">
            — {stats.restaurants} restaurant{stats.restaurants > 1 ? 's' : ''} et {stats.menus} menu{stats.menus > 1 ? 's' : ''} disponibles en cache
          </span>
        )}
      </span>
    </div>
  );
}

function ReconnectedBanner({
  syncing,
  onSync,
}: {
  syncing?: boolean;
  onSync?: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const isOnline = useOnlineStatus();

  // Afficher brièvement le banner de reconnexion
  useEffect(() => {
    if (isOnline) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(t);
    }
  }, [isOnline]);

  if (!visible) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center gap-3 bg-green-50 border-b border-green-200 px-4 py-2.5 text-green-900 animate-in slide-in-from-top-2 duration-300">
      <Wifi className="w-4 h-4 shrink-0 text-green-600" />
      <span className="text-sm flex-1">
        <span className="font-medium">Connexion rétablie</span>
        <span className="text-green-700 ml-1">— Synchronisation en cours…</span>
      </span>
      {onSync && (
        <button
          onClick={onSync}
          disabled={syncing}
          className="flex items-center gap-1.5 text-xs text-green-700 hover:text-green-900 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      )}
    </div>
  );
}
