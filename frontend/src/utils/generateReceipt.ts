/**
 * Génération de reçu PDF pour une transaction de paiement.
 * Utilise jsPDF + jspdf-autotable pour un rendu côté client.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReceiptTransaction {
  id: string;
  order_number: string;
  order_type: string | null;
  created_at: string;
  paid_at: string | null;
  customer_name: string | null;
  customer_email: string | null;
  total: number;
  subtotal?: number;
  tax?: number;
  payment_method: string | null;
  payment_status: string;
  transaction_id: string | null;
  phone_number: string | null;
}

export interface ReceiptOrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface ReceiptRestaurant {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

// ─── Constantes de style (palette Minimal) ───────────────────────────────────

const COLOR = {
  black:     [17, 24, 39]  as [number, number, number],   // #111827
  gray:      [107, 114, 128] as [number, number, number], // #6B7280
  lightGray: [229, 231, 235] as [number, number, number], // #E5E7EB
  bg:        [248, 249, 251] as [number, number, number], // #F8F9FB
  white:     [255, 255, 255] as [number, number, number],
  green:     [22, 163, 74]  as [number, number, number],  // succès
  amber:     [180, 83, 9]   as [number, number, number],  // en attente
  red:       [185, 28, 28]  as [number, number, number],  // échec
};

const METHOD_LABEL: Record<string, string> = {
  card:         'Carte bancaire',
  wave:         'Wave',
  orange_money: 'Orange Money',
  cash:         'Espèces',
};

const STATUS_LABEL: Record<string, { label: string; color: [number, number, number] }> = {
  paid:    { label: 'PAYÉ',       color: COLOR.green },
  pending: { label: 'EN ATTENTE', color: COLOR.amber },
  unpaid:  { label: 'NON PAYÉ',   color: COLOR.gray  },
  failed:  { label: 'ÉCHOUÉ',     color: COLOR.red   },
};

const PAGE_W  = 210; // A4 mm
const MARGIN  = 18;
const CONTENT = PAGE_W - MARGIN * 2;

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function fmtAmount(v: number): string {
  return `${v.toLocaleString('fr-FR')} FCFA`;
}

function fmtDate(iso: string): string {
  return format(new Date(iso), "dd MMMM yyyy 'à' HH:mm", { locale: fr });
}

function drawHRule(doc: jsPDF, y: number, alpha = 1): void {
  doc.setDrawColor(...COLOR.lightGray);
  doc.setLineWidth(0.3);
  doc.setGState(doc.GState({ opacity: alpha }));
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  doc.setGState(doc.GState({ opacity: 1 }));
}

// ─── Génération principale ───────────────────────────────────────────────────

export function generateReceiptPDF(
  tx: ReceiptTransaction,
  restaurant: ReceiptRestaurant,
  items: ReceiptOrderItem[]
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGIN;

  // ── 1. En-tête ──────────────────────────────────────────────────────────────

  // Fond clair du header
  doc.setFillColor(...COLOR.bg);
  doc.rect(0, 0, PAGE_W, 44, 'F');

  // Nom du restaurant (grand titre)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...COLOR.black);
  doc.text(restaurant.name.toUpperCase(), MARGIN, y + 10);

  // Mention DEMO
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLOR.gray);
  doc.text('MODE DÉMONSTRATION — AUCUN DÉBIT RÉEL', MARGIN, y + 15);

  // Titre "REÇU DE PAIEMENT" à droite
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR.black);
  doc.text('REÇU DE PAIEMENT', PAGE_W - MARGIN, y + 10, { align: 'right' });

  // N° commande à droite
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.gray);
  doc.text(`N° ${tx.order_number}`, PAGE_W - MARGIN, y + 16, { align: 'right' });

  y = 44;
  drawHRule(doc, y);

  // ── 2. Bloc infos restaurant ─────────────────────────────────────────────────

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR.gray);

  const restaurantLines: string[] = [];
  if (restaurant.address) restaurantLines.push(restaurant.address);
  if (restaurant.phone)   restaurantLines.push(restaurant.phone);
  if (restaurant.email)   restaurantLines.push(restaurant.email);

  restaurantLines.forEach((line) => {
    doc.text(line, MARGIN, y);
    y += 4;
  });

  // ── 3. Bloc statut + date ────────────────────────────────────────────────────

  const statusCfg = STATUS_LABEL[tx.payment_status] || { label: tx.payment_status.toUpperCase(), color: COLOR.gray };

  // Pastille statut
  const statusX = PAGE_W - MARGIN;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...statusCfg.color);
  doc.text(statusCfg.label, statusX, 50, { align: 'right' });

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR.gray);
  const dateStr = fmtDate(tx.paid_at || tx.created_at);
  doc.text(dateStr, statusX, 55, { align: 'right' });

  y = Math.max(y, 60);
  y += 4;
  drawHRule(doc, y);

  // ── 4. Infos transaction ─────────────────────────────────────────────────────

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR.black);
  doc.text('DÉTAILS DE LA TRANSACTION', MARGIN, y);
  y += 5;

  const infoRows: [string, string][] = [
    ['Client',        tx.customer_name  || '—'],
    ['Contact',       tx.customer_email || tx.phone_number || '—'],
    ['Méthode',       METHOD_LABEL[tx.payment_method || ''] || (tx.payment_method || 'N/A')],
    ['Type commande', tx.order_type === 'delivery' ? 'Livraison' : tx.order_type === 'table' ? 'Sur place' : tx.order_type || 'N/A'],
  ];

  if (tx.transaction_id) {
    infoRows.push(['Référence', tx.transaction_id]);
  }

  const colLabelW = 36;

  infoRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR.gray);
    doc.text(label, MARGIN, y);

    doc.setTextColor(...COLOR.black);
    doc.text(value, MARGIN + colLabelW, y);
    y += 5;
  });

  y += 2;
  drawHRule(doc, y);

  // ── 5. Tableau des articles ──────────────────────────────────────────────────

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR.black);
  doc.text('ARTICLES COMMANDÉS', MARGIN, y);
  y += 3;

  const tableBody: (string | number)[][] = items.length > 0
    ? items.map((item) => [
        item.name,
        item.quantity.toString(),
        fmtAmount(item.unit_price),
        fmtAmount(item.subtotal),
      ])
    : [['—', '—', '—', fmtAmount(tx.total)]];

  autoTable(doc, {
    startY: y,
    head: [['Article', 'Qté', 'Prix unitaire', 'Sous-total']],
    body: tableBody,
    margin: { left: MARGIN, right: MARGIN },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      textColor: COLOR.black,
      lineColor: COLOR.lightGray,
      lineWidth: 0.2,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: COLOR.bg,
      textColor: COLOR.gray,
      fontStyle: 'bold',
      fontSize: 7.5,
      lineWidth: 0,
    },
    alternateRowStyles: {
      fillColor: [252, 252, 253] as [number, number, number],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 38, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
    theme: 'grid',
  });

  // Récupérer y après le tableau
  // @ts-ignore
  y = (doc as any).lastAutoTable.finalY + 4;

  // ── 6. Bloc totaux ──────────────────────────────────────────────────────────

  const totalsX = PAGE_W - MARGIN;
  const totalsLabelX = totalsX - 40;

  drawHRule(doc, y);
  y += 5;

  const subtotal = tx.subtotal ?? (tx.tax != null ? tx.total - tx.tax : tx.total);
  const tax      = tx.tax ?? 0;

  const totalsRows: [string, string, boolean][] = [
    ['Sous-total', fmtAmount(subtotal), false],
    ['Taxes / TVA', fmtAmount(tax),     false],
    ['TOTAL',      fmtAmount(tx.total), true],
  ];

  totalsRows.forEach(([label, value, bold]) => {
    const labelColor = bold ? COLOR.black : COLOR.gray;
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 9 : 8);
    doc.setTextColor(...labelColor);
    doc.text(label, totalsLabelX, y, { align: 'right' });
    doc.setTextColor(...COLOR.black);
    doc.text(value, totalsX, y, { align: 'right' });
    y += bold ? 7 : 5;
  });

  // ── 7. Pied de page ─────────────────────────────────────────────────────────

  const footerY = 280;
  drawHRule(doc, footerY);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR.gray);
  doc.text('Merci de votre confiance. Ce reçu a été généré automatiquement.', PAGE_W / 2, footerY + 5, { align: 'center' });
  doc.text('Document généré en mode démo — aucune valeur contractuelle.', PAGE_W / 2, footerY + 9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLOR.lightGray);
  doc.text('KobeTii — RestauManager', PAGE_W / 2, footerY + 14, { align: 'center' });

  // ── 8. Téléchargement ────────────────────────────────────────────────────────

  const filename = `recu_${tx.order_number}_${format(new Date(tx.created_at), 'yyyyMMdd')}.pdf`;
  doc.save(filename);
}
