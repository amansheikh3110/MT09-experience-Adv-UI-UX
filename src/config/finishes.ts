/**
 * Configurator options. Each option recolours real materials of the 3D model
 * (see ROLES in components/3d/Motorcycle.tsx for which GLB materials each group touches).
 * Colours are sRGB hex. Add / rename freely — the UI is generated from this file.
 */

export type CategoryId = 'body' | 'wheels' | 'seat' | 'details';

export type Finish = {
  id: string;
  name: string;
  /** swatch + material colour */
  color: string;
  metalness?: number;
  roughness?: number;
  clearcoat?: number;
  note: string;
};

export type Category = {
  id: CategoryId;
  index: string;
  label: string;
  options: Finish[];
};

export const CATEGORIES: Category[] = [
  {
    id: 'body',
    index: '01',
    label: 'Body finish',
    options: [
      { id: 'ignition', name: 'Ignition', color: '#e2540a', metalness: 0.45, roughness: 0.24, clearcoat: 1, note: 'Three-stage pearl · gloss' },
      { id: 'nocturne', name: 'Nocturne', color: '#0b0b0c', metalness: 0.6, roughness: 0.32, clearcoat: 1, note: 'Deep black · satin lacquer' },
      { id: 'ceramic', name: 'Ceramic', color: '#7d8286', metalness: 0.5, roughness: 0.28, clearcoat: 1, note: 'Cool grey · matte-gloss' },
      { id: 'bone', name: 'Bone', color: '#c9c1b2', metalness: 0.3, roughness: 0.3, clearcoat: 1, note: 'Warm white · gloss' },
    ],
  },
  {
    id: 'wheels',
    index: '02',
    label: 'Wheels',
    options: [
      { id: 'w-ignition', name: 'Ignition', color: '#e2540a', metalness: 0.6, roughness: 0.28, clearcoat: 1, note: 'Cast alloy · painted' },
      { id: 'w-forged', name: 'Forged black', color: '#0d0d0e', metalness: 0.75, roughness: 0.35, clearcoat: 0.6, note: 'Forged · anodised' },
      { id: 'w-titanium', name: 'Titanium', color: '#8b8781', metalness: 0.9, roughness: 0.32, clearcoat: 0.4, note: 'Machined · brushed' },
      { id: 'w-gold', name: 'Bronze', color: '#a8772a', metalness: 0.9, roughness: 0.3, clearcoat: 0.6, note: 'Anodised · bronze' },
    ],
  },
  {
    id: 'seat',
    index: '03',
    label: 'Seat',
    options: [
      { id: 's-alcantara', name: 'Alcantara', color: '#ffffff', note: 'Original micro-suede' },
      { id: 's-sand', name: 'Sand', color: '#c2ae8b', note: 'Perforated suede' },
      { id: 's-ember', name: 'Ember', color: '#a24b25', note: 'Rust-tinted suede' },
      { id: 's-graphite', name: 'Graphite', color: '#54565a', note: 'Dark weave' },
    ],
  },
  {
    id: 'details',
    index: '04',
    label: 'Details',
    options: [
      { id: 'd-gold', name: 'Gold', color: '#d9a92b', metalness: 0.9, roughness: 0.3, note: 'Chain · fasteners · hardware' },
      { id: 'd-black', name: 'Blackout', color: '#1b1b1c', metalness: 0.8, roughness: 0.4, note: 'PVD black hardware' },
      { id: 'd-ignition', name: 'Ignition', color: '#e2540a', metalness: 0.7, roughness: 0.3, note: 'Anodised orange hardware' },
      { id: 'd-silver', name: 'Silver', color: '#b8b8bb', metalness: 1, roughness: 0.28, note: 'Polished hardware' },
    ],
  },
];

export const DEFAULT_SELECTION: Record<CategoryId, string> = {
  body: 'ignition',
  wheels: 'w-ignition',
  seat: 's-alcantara',
  details: 'd-gold',
};
