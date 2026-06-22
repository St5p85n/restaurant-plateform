/**
 * Configuration globale de l'application KobeTii
 */

export const APP_CONFIG = {
  // Nom de l'application
  name: 'KobeTii',
  
  // Description
  description: 'Gestion complète de restaurants',
  
  // Devise
  currency: {
    code: 'FCFA',
    symbol: 'FCFA',
    position: 'after' as 'before' | 'after', // 'before' ou 'after'
    separator: ' ', // Espace entre le montant et la devise
  },
  
  // Locale
  locale: 'fr-FR',
  
  // Formatage des nombres
  numberFormat: {
    useGrouping: true, // Séparateurs de milliers
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  },
};

/**
 * Formate un montant en devise locale
 * @param amount - Montant à formater
 * @returns Montant formaté avec la devise
 * 
 * @example
 * formatCurrency(50000) // "50 000 FCFA"
 * formatCurrency(1500.50) // "1 501 FCFA"
 */
export const formatCurrency = (amount: number): string => {
  const formatted = amount.toLocaleString(APP_CONFIG.locale, APP_CONFIG.numberFormat);
  
  if (APP_CONFIG.currency.position === 'before') {
    return `${APP_CONFIG.currency.symbol}${APP_CONFIG.currency.separator}${formatted}`;
  }
  
  return `${formatted}${APP_CONFIG.currency.separator}${APP_CONFIG.currency.symbol}`;
};

/**
 * Formate un nombre sans devise
 * @param value - Nombre à formater
 * @returns Nombre formaté
 * 
 * @example
 * formatNumber(50000) // "50 000"
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString(APP_CONFIG.locale, APP_CONFIG.numberFormat);
};
