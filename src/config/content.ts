/**
 * ALL COPY + FIGURES live here. Edit freely — sections just render what they find.
 * The numbers describe the machine actually on screen (a 890 cc triple, chain drive).
 * Treat them as launch-copy placeholders and replace with your real spec sheet.
 */

export const PRODUCT = {
  name: 'MT—09 SP',
  short: 'MT—09',
  edition: 'Launch edition',
  year: '2025',
};

export type Chapter = { id: string; index: string; label: string; nav?: string };

/** In page order. `nav` = shows in the top navigation (otherwise only in the menu). */
export const CHAPTERS: Chapter[] = [
  { id: 'machine', index: '01', label: 'The machine', nav: 'Machine' },
  { id: 'design', index: '02', label: 'Design', nav: 'Design' },
  { id: 'study', index: '03', label: 'Product study' },
  { id: 'performance', index: '04', label: 'Performance', nav: 'Performance' },
  { id: 'engineering', index: '05', label: 'Engineering', nav: 'Engineering' },
  { id: 'materials', index: '06', label: 'Materials' },
  { id: 'environment', index: '07', label: 'Experience', nav: 'Experience' },
  { id: 'configurator', index: '08', label: 'Configure' },
  { id: 'final', index: '09', label: 'Ready to move' },
];

/* ── 03 · 3D product study — labels pinned to the real model ────────────────── */

export type StudyLabel = {
  id: string;
  index: string;
  title: string;
  detail: string;
  /** bike space: u nose→tail, v floor→top, w −1..1 across */
  anchor: [number, number, number];
  /** section progress window in which this label is alive */
  window: [number, number];
  /** label offset from the anchor, px (desktop) — sign chooses the side */
  dx: number;
  dy: number;
  /** shown on phones too */
  mobile?: boolean;
};

export const STUDY_LABELS: StudyLabel[] = [
  { id: 'frame', index: '01', title: 'Frame', detail: 'Die-cast aluminium diamond · 8.6 kg', anchor: [0.54, 0.47, 0], window: [0.06, 0.42], dx: 70, dy: -120, mobile: true },
  { id: 'power', index: '02', title: 'Power', detail: '890 cc crossplane triple · 119 hp', anchor: [0.46, 0.33, 0], window: [0.1, 0.42], dx: -30, dy: 130, mobile: true },
  { id: 'thermal', index: '03', title: 'Thermal', detail: 'Two-stage liquid cooling · 14 % more flow', anchor: [0.34, 0.43, 0], window: [0.14, 0.42], dx: -140, dy: -110 },
  { id: 'control', index: '04', title: 'Control', detail: 'Six-axis IMU · cornering ABS · TFT', anchor: [0.31, 0.93, 0], window: [0.58, 0.8], dx: 90, dy: -70, mobile: true },
  { id: 'aero', index: '05', title: 'Aerodynamics', detail: 'Winglet cowl · flyscreen · −9 % drag', anchor: [0.235, 0.76, 0], window: [0.6, 0.8], dx: -120, dy: -50 },
  { id: 'suspension', index: '06', title: 'Suspension', detail: 'Fully adjustable · electronic rear', anchor: [0.635, 0.54, 0], window: [0.88, 1], dx: 90, dy: -120, mobile: true },
];

/* ── 04 · performance ──────────────────────────────────────────────────────── */

export type Stat = {
  id: string;
  value: number;
  decimals: number;
  pad: number;
  unit: string;
  label: string;
  note: string;
  /** outline the numerals instead of filling them (visual rhythm) */
  outline?: boolean;
};

export const STATS: Stat[] = [
  { id: 'accel', value: 3.2, decimals: 1, pad: 2, unit: 'Seconds', label: '0 — 100 km/h', note: 'Launch control, wheelie control and a corner-by-corner traction model keep every metre of it on the ground.' },
  { id: 'power', value: 119, decimals: 0, pad: 3, unit: 'Horsepower', label: 'Peak power · 10,000 rpm', note: 'A crossplane triple that pulls from idle and never stops asking for more.', outline: true },
  { id: 'torque', value: 93, decimals: 0, pad: 2, unit: 'Newton metres', label: 'Peak torque · 7,000 rpm', note: '90 % of it is already on tap at 3,500 rpm. The road does not need to be negotiated with.' },
  { id: 'mass', value: 193, decimals: 0, pad: 3, unit: 'Kilograms', label: 'Wet, ready to ride', note: 'Every gram was argued for. The ones that stayed have a job.', outline: true },
];

/** Power/torque curve (rpm × 1000 → value) for the little line graph in 04. */
export const CURVE = {
  rpm: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  power: [22, 34, 47, 62, 78, 92, 104, 113, 119, 116, 108],
  torque: [82, 87, 90, 91, 92, 93, 91, 88, 85, 79, 71],
};
