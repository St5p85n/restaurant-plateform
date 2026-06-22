import { useEffect, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { pruneExpired } from '@/lib/offlineStore';

/**
 * Hook global qui :
 * - nettoie les entrées expirées au démarrage
 * - déclenche un callback de resync quand la connexion revient
 */
export function useOfflineSync(onReconnect?: () => void) {
  const isOnline = useOnlineStatus();
  const prevOnlineRef = useRef<boolean>(isOnline);
  const callbackRef = useRef(onReconnect);
  callbackRef.current = onReconnect;

  // Nettoyage des entrées périmées au montage
  useEffect(() => {
    pruneExpired().catch(console.error);
  }, []);

  // Déclenchement de la resync au retour de la connexion
  useEffect(() => {
    if (!prevOnlineRef.current && isOnline) {
      callbackRef.current?.();
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  return isOnline;
}
