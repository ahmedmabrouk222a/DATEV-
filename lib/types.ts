// ============================================================
// DATEV ERP - Core Types
// ============================================================

export interface User {
  username: string;
  role: 'admin' | 'student';
  password: string;
}

export interface Account {
  number: string;
  name: string;
  type: 'Aktiva' | 'Passiva' | 'Aufwand' | 'Ertrag' | 'Debitor' | 'Kreditor';
  category?: string;
  bilanzCategory?: string;
  beschreibung?: string; // Pädagogische Beschreibung auf Deutsch
}

export interface Company {
  id: string;
  nummer: string;
  name: string;
  typ: string;
  plz: string;
  ort: string;
  strasse: string;
  telefon: string;
}

export interface InventarItem {
  id: string;
  bezeichnung: string;
  kategorie: string;
  konto: string;
  menge: number;
  stueckpreis: number;
  ebGenerated?: boolean;
}

export interface Buchungsstapel {
  id: string;
  nummer: string;
  bezeichnung: string;
  datumVon: string;
  datumBis: string;
  periode: string;
  diktatkuerzel: string;
}

export interface Buchung {
  id: string;
  stapelId: string;
  nr: number;
  wkz: string;
  umsatz: number;
  sh: 'S' | 'H';
  gu: string;
  bu: string;
  gegenkonto: string;
  belegfeld1: string;
  belegfeld2: string;
  datum: string;
  leistungsdatum: string;
  konto: string;
  kost1: string;
  kost2: string;
  kostMenge: string;
  skonto: number;
  buchungstext: string;
}

export interface WorkspaceData {
  companies: Company[];
  accounts: Account[];
  inventar: InventarItem[];
  stapel: Buchungsstapel[];
  buchungen: Buchung[];
  activeCompanyId: string | null;
  bilanzSettings: Record<string, string>;
}

// ============================================================
// VOLLSTÄNDIGE SKR03-KONTENLISTE MIT PÄDAGOGISCHEN BESCHREIBUNGEN
// ============================================================
export const DEFAULT_ACCOUNTS: Account[] = [

  // ==================== ANLAGEVERMÖGEN ====================
  {
    number: '0400',
    name: 'Maschinen',
    type: 'Aktiva',
    bilanzCategory: 'A.II. Sachanlagen',
    beschreibung: 'Hier werden Maschinen der Firma erfasst, die länger im Unternehmen genutzt werden.',
  },
  {
    number: '0500',
    name: 'Betriebs- und Geschäftsausstattung',
    type: 'Aktiva',
    bilanzCategory: 'A.II. Sachanlagen',
    beschreibung: 'Hier werden größere Gegenstände für die Firma erfasst, zum Beispiel Möbel oder bestimmte Geräte.',
  },
  {
    number: '0670',
    name: 'EDV-Anlagen',
    type: 'Aktiva',
    bilanzCategory: 'A.II. Sachanlagen',
    beschreibung: 'Hier werden Computer und andere größere IT-Geräte erfasst.',
  },
  {
    number: '0700',
    name: 'Geringwertige Wirtschaftsgüter (GWG)',
    type: 'Aktiva',
    bilanzCategory: 'A.II. Sachanlagen',
    beschreibung: 'Hier werden bestimmte kleinere Gegenstände der Firma erfasst, die nach den gesetzlichen Regeln als GWG behandelt werden.',
  },
  // --- Inventar aus ERP.docx (behalten) ---
  {
    number: '420',
    name: 'Office items IT (Laptop)',
    type: 'Aktiva',
    bilanzCategory: 'A.II. Sachanlagen',
    beschreibung: 'Laptops und IT-Geräte der Firma (aus Inventar).',
  },
  {
    number: '421',
    name: 'Office items (Table)',
    type: 'Aktiva',
    bilanzCategory: 'A.II. Sachanlagen',
    beschreibung: 'Büromöbel und sonstige Büroausstattung (aus Inventar).',
  },
  {
    number: '500',
    name: 'Fuhrpark (Car)',
    type: 'Aktiva',
    bilanzCategory: 'A.II. Sachanlagen',
    beschreibung: 'Kraftfahrzeuge der Firma (aus Inventar).',
  },

  // ==================== KASSE & BANK ====================
  {
    number: '1000',
    name: 'Kasse',
    type: 'Aktiva',
    bilanzCategory: 'B.IV. Kassenbestand',
    beschreibung: 'Hier wird das Bargeld der Firma erfasst.',
  },
  {
    number: '1200',
    name: 'Bank',
    type: 'Aktiva',
    bilanzCategory: 'B.IV. Guthaben bei Kreditinstituten',
    beschreibung: 'Hier wird das Geld auf dem Bankkonto der Firma erfasst.',
  },

  // ==================== FORDERUNGEN / VORSTEUER ====================
  {
    number: '1400',
    name: 'Forderungen aus Lieferungen und Leistungen',
    type: 'Aktiva',
    bilanzCategory: 'B.II. Forderungen aus LuL',
    beschreibung: 'Hier wird das Geld erfasst, das Kunden der Firma noch bezahlen müssen.',
  },
  {
    number: '1571',
    name: 'Vorsteuer 7 %',
    type: 'Aktiva',
    bilanzCategory: 'B.II. Forderungen',
    beschreibung: 'Steuer, die die Firma beim Einkauf mit 7 % bezahlt hat.',
  },
  {
    number: '1576',
    name: 'Vorsteuer 19 %',
    type: 'Aktiva',
    bilanzCategory: 'B.II. Forderungen',
    beschreibung: 'Steuer, die die Firma beim Einkauf mit 19 % bezahlt hat.',
  },

  // ==================== VERBINDLICHKEITEN ====================
  {
    number: '1600',
    name: 'Verbindlichkeiten aus Lieferungen und Leistungen',
    type: 'Passiva',
    bilanzCategory: 'C.4. Verbindlichkeiten aus LuL',
    beschreibung: 'Hier wird Geld erfasst, das die Firma noch an Lieferanten bezahlen muss.',
  },
  {
    number: '1740',
    name: 'Verbindlichkeiten aus Lohn und Gehalt',
    type: 'Passiva',
    bilanzCategory: 'C.5. Sonstige Verbindlichkeiten',
    beschreibung: 'Hier wird Geld erfasst, das Mitarbeitern noch zusteht.',
  },
  {
    number: '1741',
    name: 'Verbindlichkeiten aus Lohn- und Kirchensteuer',
    type: 'Passiva',
    bilanzCategory: 'C.5. Steuerverbindlichkeiten',
    beschreibung: 'Hier wird Lohnsteuer erfasst, die noch an das Finanzamt bezahlt werden muss.',
  },
  {
    number: '1742',
    name: 'Verbindlichkeiten gegenüber Sozialversicherungsträgern',
    type: 'Passiva',
    bilanzCategory: 'C.5. Sonstige Verbindlichkeiten',
    beschreibung: 'Hier wird Geld erfasst, das noch an die Krankenkassen bzw. Sozialversicherung bezahlt werden muss.',
  },

  // ==================== UMSATZSTEUER ====================
  {
    number: '1771',
    name: 'Umsatzsteuer 7 %',
    type: 'Passiva',
    bilanzCategory: 'C.5. Steuerverbindlichkeiten',
    beschreibung: 'Steuer, die die Firma bei einem Verkauf mit 7 % berechnet.',
  },
  {
    number: '1776',
    name: 'Umsatzsteuer 19 %',
    type: 'Passiva',
    bilanzCategory: 'C.5. Steuerverbindlichkeiten',
    beschreibung: 'Steuer, die die Firma bei einem Verkauf mit 19 % berechnet.',
  },

  // ==================== ZINSEN ====================
  {
    number: '2100',
    name: 'Zinsaufwendungen',
    type: 'Aufwand',
    bilanzCategory: 'Zinsaufwendungen',
    beschreibung: 'Hier werden die Zinsen erfasst, die die Firma bezahlen muss.',
  },
  {
    number: '2650',
    name: 'Zinserträge',
    type: 'Ertrag',
    bilanzCategory: 'Zinserträge',
    beschreibung: 'Hier werden die Zinsen erfasst, die die Firma bekommt.',
  },

  // ==================== LÖHNE & GEHÄLTER ====================
  {
    number: '4120',
    name: 'Gehälter',
    type: 'Aufwand',
    bilanzCategory: 'Personalkosten',
    beschreibung: 'Hier werden die Gehälter der Mitarbeiter erfasst.',
  },
  {
    number: '4130',
    name: 'Gesetzliche soziale Aufwendungen',
    type: 'Aufwand',
    bilanzCategory: 'Personalkosten',
    beschreibung: 'Hier werden die Sozialversicherungsbeiträge der Firma für ihre Mitarbeiter erfasst.',
  },
  {
    number: '4140',
    name: 'Freiwillige soziale Aufwendungen',
    type: 'Aufwand',
    bilanzCategory: 'Personalkosten',
    beschreibung: 'Hier werden freiwillige Leistungen der Firma für Mitarbeiter erfasst.',
  },
  {
    number: '4190',
    name: 'Aushilfslöhne',
    type: 'Aufwand',
    bilanzCategory: 'Personalkosten',
    beschreibung: 'Hier werden die Löhne von Aushilfskräften erfasst.',
  },

  // ==================== RAUMKOSTEN ====================
  {
    number: '4210',
    name: 'Miete',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Mietkosten für die Geschäftsräume erfasst.',
  },
  {
    number: '4240',
    name: 'Gas, Strom, Wasser',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Kosten für Strom, Gas und Wasser erfasst.',
  },
  {
    number: '4250',
    name: 'Reinigung',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Kosten für die Reinigung der Geschäftsräume erfasst.',
  },
  {
    number: '4260',
    name: 'Instandhaltung betrieblicher Räume',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Kosten für Reparaturen und Instandhaltung der Geschäftsräume erfasst.',
  },

  // ==================== VERSICHERUNGEN & BEITRÄGE ====================
  {
    number: '4360',
    name: 'Versicherungen',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Versicherungskosten der Firma erfasst.',
  },
  {
    number: '4380',
    name: 'Beiträge',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden bestimmte Beiträge der Firma, zum Beispiel Mitgliedsbeiträge, erfasst.',
  },

  // ==================== KFZ-KOSTEN ====================
  {
    number: '4520',
    name: 'Kfz-Versicherungen',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Versicherungskosten für Firmenfahrzeuge erfasst.',
  },
  {
    number: '4530',
    name: 'Laufende Kfz-Betriebskosten',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die normalen Kosten für Firmenfahrzeuge, zum Beispiel Benzin, erfasst.',
  },
  {
    number: '4540',
    name: 'Kfz-Reparaturen',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Reparaturkosten für Firmenfahrzeuge erfasst.',
  },
  {
    number: '4550',
    name: 'Garagenmiete',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Kosten für eine Garage oder einen Stellplatz erfasst.',
  },
  {
    number: '4570',
    name: 'Mietleasing Kfz',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Leasingkosten für Firmenfahrzeuge erfasst.',
  },

  // ==================== WERBE- & REISEKOSTEN ====================
  {
    number: '4600',
    name: 'Werbekosten',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Kosten für Werbung erfasst. Zum Beispiel: Online-Werbung, Flyer oder Anzeigen.',
  },
  {
    number: '4604',
    name: 'Geschenke an Geschäftsfreunde',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden Geschenke für Geschäftspartner erfasst.',
  },
  {
    number: '4650',
    name: 'Bewirtungskosten',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden Kosten für Essen und Getränke bei geschäftlichen Treffen erfasst.',
  },
  {
    number: '4660',
    name: 'Reisekosten Arbeitnehmer',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Reisekosten von Mitarbeitern erfasst.',
  },
  {
    number: '4670',
    name: 'Reisekosten Unternehmer',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Reisekosten des Unternehmers erfasst.',
  },

  // ==================== REPARATUREN & WARTUNG ====================
  {
    number: '4800',
    name: 'Reparaturen und Instandhaltung',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Kosten für Reparaturen und Wartung erfasst.',
  },
  {
    number: '4805',
    name: 'Wartung von Hard- und Software',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Kosten für die Wartung von Computer- und Software-Systemen erfasst.',
  },

  // ==================== BÜRO- & KOMMUNIKATIONSKOSTEN ====================
  {
    number: '4910',
    name: 'Porto',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Kosten für Briefe und Pakete erfasst.',
  },
  {
    number: '4920',
    name: 'Telefon',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Kosten für Telefon und Telekommunikation erfasst.',
  },
  {
    number: '4930',
    name: 'Bürobedarf',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Kosten für Büromaterial erfasst. Zum Beispiel: Papier, Stifte, Ordner.',
  },
  {
    number: '4940',
    name: 'Zeitschriften und Bücher',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Kosten für betriebliche Bücher und Zeitschriften erfasst.',
  },
  {
    number: '4964',
    name: 'Internetkosten',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Kosten für Internet erfasst.',
  },
  {
    number: '4970',
    name: 'Nebenkosten des Geldverkehrs',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Hier werden die Bankgebühren erfasst.',
  },

  // ==================== DEBITOREN (Kunden) — beibehalten ====================
  { number: '4000', name: 'Debitor Müller GmbH', type: 'Debitor', bilanzCategory: 'B.II. Forderungen aus LuL', beschreibung: 'Kundenkonto – Forderungen an Müller GmbH.' },
  { number: '4001', name: 'Debitor Schmidt AG', type: 'Debitor', bilanzCategory: 'B.II. Forderungen aus LuL', beschreibung: 'Kundenkonto – Forderungen an Schmidt AG.' },
  { number: '4002', name: 'Debitor Weber KG', type: 'Debitor', bilanzCategory: 'B.II. Forderungen aus LuL', beschreibung: 'Kundenkonto – Forderungen an Weber KG.' },
  { number: '4003', name: 'Debitor Fischer GmbH', type: 'Debitor', bilanzCategory: 'B.II. Forderungen aus LuL', beschreibung: 'Kundenkonto – Forderungen an Fischer GmbH.' },
  { number: '4004', name: 'Debitor Becker OHG', type: 'Debitor', bilanzCategory: 'B.II. Forderungen aus LuL', beschreibung: 'Kundenkonto – Forderungen an Becker OHG.' },
  { number: '4005', name: 'Debitor Schulz GmbH', type: 'Debitor', bilanzCategory: 'B.II. Forderungen aus LuL', beschreibung: 'Kundenkonto – Forderungen an Schulz GmbH.' },
  { number: '4006', name: 'Debitor Koch AG', type: 'Debitor', bilanzCategory: 'B.II. Forderungen aus LuL', beschreibung: 'Kundenkonto – Forderungen an Koch AG.' },
  { number: '4007', name: 'Debitor Bauer GmbH', type: 'Debitor', bilanzCategory: 'B.II. Forderungen aus LuL', beschreibung: 'Kundenkonto – Forderungen an Bauer GmbH.' },
  { number: '4008', name: 'Debitor Richter KG', type: 'Debitor', bilanzCategory: 'B.II. Forderungen aus LuL', beschreibung: 'Kundenkonto – Forderungen an Richter KG.' },
  { number: '4009', name: 'Debitor Klein GmbH', type: 'Debitor', bilanzCategory: 'B.II. Forderungen aus LuL', beschreibung: 'Kundenkonto – Forderungen an Klein GmbH.' },

  // ==================== KREDITOREN (Lieferanten) — beibehalten ====================
  { number: '7000', name: 'Kreditor Lieferant AG', type: 'Kreditor', bilanzCategory: 'C.4. Verbindlichkeiten aus LuL', beschreibung: 'Lieferantenkonto – Verbindlichkeiten an Lieferant AG.' },
  { number: '7001', name: 'Kreditor Großhandel GmbH', type: 'Kreditor', bilanzCategory: 'C.4. Verbindlichkeiten aus LuL', beschreibung: 'Lieferantenkonto – Verbindlichkeiten an Großhandel GmbH.' },
  { number: '7002', name: 'Kreditor Versorger KG', type: 'Kreditor', bilanzCategory: 'C.4. Verbindlichkeiten aus LuL', beschreibung: 'Lieferantenkonto – Verbindlichkeiten an Versorger KG.' },
  { number: '7003', name: 'Kreditor Material OHG', type: 'Kreditor', bilanzCategory: 'C.4. Verbindlichkeiten aus LuL', beschreibung: 'Lieferantenkonto – Verbindlichkeiten an Material OHG.' },
  { number: '7004', name: 'Kreditor Technik GmbH', type: 'Kreditor', bilanzCategory: 'C.4. Verbindlichkeiten aus LuL', beschreibung: 'Lieferantenkonto – Verbindlichkeiten an Technik GmbH.' },
  { number: '7005', name: 'Kreditor Service AG', type: 'Kreditor', bilanzCategory: 'C.4. Verbindlichkeiten aus LuL', beschreibung: 'Lieferantenkonto – Verbindlichkeiten an Service AG.' },
  { number: '7006', name: 'Kreditor Transport GmbH', type: 'Kreditor', bilanzCategory: 'C.4. Verbindlichkeiten aus LuL', beschreibung: 'Lieferantenkonto – Verbindlichkeiten an Transport GmbH.' },
  { number: '7007', name: 'Kreditor Energie KG', type: 'Kreditor', bilanzCategory: 'C.4. Verbindlichkeiten aus LuL', beschreibung: 'Lieferantenkonto – Verbindlichkeiten an Energie KG.' },
  { number: '7008', name: 'Kreditor Büro OHG', type: 'Kreditor', bilanzCategory: 'C.4. Verbindlichkeiten aus LuL', beschreibung: 'Lieferantenkonto – Verbindlichkeiten an Büro OHG.' },
  { number: '7009', name: 'Kreditor Reinigung GmbH', type: 'Kreditor', bilanzCategory: 'C.4. Verbindlichkeiten aus LuL', beschreibung: 'Lieferantenkonto – Verbindlichkeiten an Reinigung GmbH.' },

  // ==================== ERLÖSE (Umsätze) ====================
  {
    number: '8125',
    name: 'Steuerfreie Umsätze',
    type: 'Ertrag',
    bilanzCategory: 'Umsatzerlöse',
    beschreibung: 'Hier werden bestimmte Verkäufe oder Leistungen ohne Umsatzsteuer erfasst.',
  },
  {
    number: '8300',
    name: 'Erlöse mit 7 % Umsatzsteuer',
    type: 'Ertrag',
    bilanzCategory: 'Umsatzerlöse',
    beschreibung: 'Hier werden Verkäufe oder Leistungen mit 7 % Umsatzsteuer erfasst.',
  },
  {
    number: '8400',
    name: 'Erlöse mit 19 % Umsatzsteuer',
    type: 'Ertrag',
    bilanzCategory: 'Umsatzerlöse',
    beschreibung: 'Hier werden Verkäufe oder Leistungen mit 19 % Umsatzsteuer erfasst.',
  },

  // ==================== VERSICHERUNGEN — beibehalten ====================
  {
    number: '9000',
    name: 'Versicherungen (Insurance cost)',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Allgemeine Versicherungskosten der Firma (aus ERP-Übung).',
  },
  {
    number: '9001',
    name: 'Sonstige Versicherungen',
    type: 'Aufwand',
    bilanzCategory: 'Aufwendungen',
    beschreibung: 'Sonstige Versicherungsaufwendungen (aus ERP-Übung).',
  },

  // ==================== ERÖFFNUNGSBILANZ (EB) ====================
  {
    number: '9008',
    name: 'Saldenvorträge Sachkonten (EB-Konto)',
    type: 'Passiva',
    bilanzCategory: 'Eigenkapital',
    beschreibung: 'Gegenkonto für alle Eröffnungsbilanz-Buchungen. Wird automatisch beim Erzeugen von EB-Buchungen verwendet.',
  },
];

// ============================================================
export const DEFAULT_COMPANIES: Company[] = [
  { id: '1', nummer: '20000', name: 'Perm GmbH', typ: 'GmbH', plz: '70173', ort: 'Stuttgart', strasse: 'Hauptstraße 1', telefon: '0711-123456' },
  { id: '2', nummer: '55075', name: 'Z024 MVZ Ulm', typ: 'MVZ', plz: '89073', ort: 'Ulm', strasse: 'Münsterplatz 5', telefon: '0731-654321' },
  { id: '3', nummer: '30010', name: 'Berlin Filiale GmbH', typ: 'Filiale', plz: '10115', ort: 'Berlin', strasse: 'Unter den Linden 10', telefon: '030-987654' },
];

export const DEFAULT_INVENTAR: InventarItem[] = [
  { id: '1', bezeichnung: 'Laptop', kategorie: 'office items IT', konto: '420', menge: 10, stueckpreis: 100.00 },
  { id: '2', bezeichnung: 'Table', kategorie: 'office items', konto: '421', menge: 5, stueckpreis: 10.00 },
  { id: '3', bezeichnung: 'Car', kategorie: 'Car', konto: '500', menge: 4, stueckpreis: 1000.00 },
];

export const DEFAULT_STAPEL: Buchungsstapel[] = [
  { id: '1', nummer: '08-2026/0010', bezeichnung: 'Bank 08.2026', datumVon: '01.08.2026', datumBis: '31.08.2026', periode: 'August', diktatkuerzel: 'SV' },
  { id: '2', nummer: '08-2026/0011', bezeichnung: 'Kasse 08.2026', datumVon: '01.08.2026', datumBis: '31.08.2026', periode: 'August', diktatkuerzel: 'SV' },
  { id: '3', nummer: '08-2026/0012', bezeichnung: 'Debitoren 08.2026', datumVon: '01.08.2026', datumBis: '31.08.2026', periode: 'August', diktatkuerzel: 'SV' },
  { id: '4', nummer: '08-2026/0013', bezeichnung: 'Kreditoren 08.2026', datumVon: '01.08.2026', datumBis: '31.08.2026', periode: 'August', diktatkuerzel: 'SV' },
  { id: '5', nummer: '08-2026/0014', bezeichnung: 'Löhne 08.2026', datumVon: '01.08.2026', datumBis: '31.08.2026', periode: 'August', diktatkuerzel: 'SV' },
];

export const DEFAULT_WORKSPACE: WorkspaceData = {
  companies: DEFAULT_COMPANIES,
  accounts: DEFAULT_ACCOUNTS,
  inventar: DEFAULT_INVENTAR,
  stapel: DEFAULT_STAPEL,
  buchungen: [],
  activeCompanyId: '1',
  bilanzSettings: {},
};

// ============================================================
// BU-STEUERSCHLÜSSEL → STEUERKONTEN-MAPPING
// ============================================================
export const BU_STEUER_MAP: Record<string, {
  label: string;
  prozent: string;
  vorsteuerkonto?: string; // für Einkauf
  uststeuerkonto?: string; // für Verkauf
}> = {
  '': {
    label: 'Kein Steuerschlüssel (0 %)',
    prozent: '0',
  },
  '8': {
    label: 'Vorsteuer 7 % (Einkauf)',
    prozent: '7',
    vorsteuerkonto: '1571',
  },
  '9': {
    label: 'Vorsteuer 19 % (Einkauf)',
    prozent: '19',
    vorsteuerkonto: '1576',
  },
  '2': {
    label: 'Umsatzsteuer 7 % (Verkauf)',
    prozent: '7',
    uststeuerkonto: '1771',
  },
  '3': {
    label: 'Umsatzsteuer 19 % (Verkauf)',
    prozent: '19',
    uststeuerkonto: '1776',
  },
};
