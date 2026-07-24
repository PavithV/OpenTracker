export interface BarType {
  id: string;
  label: string;
  weightKg: number;
}

export const BAR_TYPES: BarType[] = [
  { id: 'standard', label: 'Standardstange (20 kg)', weightKg: 20 },
  { id: 'ez', label: 'EZ-Stange (10 kg)', weightKg: 10 },
  { id: 'none', label: 'Ohne Stange', weightKg: 0 },
];

// Standard-Olympic-Scheiben-Set in kg -- die App rechnet aktuell durchgehend in kg (unit_preference
// wird bisher nirgends respektiert, siehe PROJECT_STATUS.md "Bekannte offene Punkte"), daher hier
// bewusst kein lb-Set.
const AVAILABLE_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25] as const;

export interface PlateLoadoutEntry {
  weightKg: number;
  count: number;
}

export interface PlateLoadout {
  perSide: PlateLoadoutEntry[];
  // Tatsächlich erreichbares Gesamtgewicht (Stange + Scheiben) -- kann vom Zielgewicht abweichen,
  // wenn sich der Rest pro Seite nicht exakt aus dem verfügbaren Scheiben-Set bilden lässt.
  totalWeightKg: number;
}

// Rundungsfehler bei Fließkommazahlen (z. B. Reste durch 2.5-/1.25-kg-Scheiben) würden sonst zu
// einer minimal falschen letzten Scheibe führen -- auf 2 Nachkommastellen runden.
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculatePlateLoadout(targetWeightKg: number, barWeightKg: number): PlateLoadout {
  let remainingPerSide = round2(Math.max(0, targetWeightKg - barWeightKg) / 2);
  const perSide: PlateLoadoutEntry[] = [];

  for (const plateWeight of AVAILABLE_PLATES_KG) {
    if (remainingPerSide < plateWeight) continue;
    const count = Math.floor(remainingPerSide / plateWeight);
    perSide.push({ weightKg: plateWeight, count });
    remainingPerSide = round2(remainingPerSide - count * plateWeight);
  }

  const perSideWeight = perSide.reduce((sum, entry) => sum + entry.weightKg * entry.count, 0);
  return { perSide, totalWeightKg: round2(barWeightKg + perSideWeight * 2) };
}
