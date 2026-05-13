import { DimensionValue } from 'react-native';

export const ROLE_COORDINATES: Record<string, { top: DimensionValue, left: DimensionValue }> = {
  'TOP': { top: '18%', left: '10%' },
  'JUNGLE': { top: '46%', left: '22%' },
  'MID': { top: '56%', left: '45%' },
  'BOT': { top: '83%', left: '67%' },
  'SUPPORT': { top: '88%', left: '82%' },
};

export const ROLES_ORDEN = [
  { key: 'TOP', label: 'TOP' },
  { key: 'JUNGLE', label: 'JUNGLE' },
  { key: 'MID', label: 'MID' },
  { key: 'BOT', label: 'BOT' },
  { key: 'SUPPORT', label: 'SUPP' }
];
