import type { SoilProfile } from "@shared/types";
export type CropFamily =
  | 'Solanaceae'
  | 'Brassicaceae'
  | 'Fabaceae'
  | 'Cucurbitaceae'
  | 'Poaceae'
  | 'Alliaceae'
  | 'Apiaceae'
  | 'Asteraceae'
  | 'Chenopodiaceae'
  | 'Unknown';
export interface Suggestion {
  type: 'recommendation' | 'warning' | 'info';
  message: string;
  reason: string;
}
export interface KnowledgeTip {
  id: string;
  category: 'rotation' | 'soil' | 'general';
  title: string;
  content: string;
  icon: 'sprout' | 'rotate' | 'beaker' | 'info';
}
// Mapping of common crops to their families
export const CROP_FAMILIES: Record<string, CropFamily> = {
  // Solanaceae (Nightshades)
  'tomato': 'Solanaceae',
  'potato': 'Solanaceae',
  'pepper': 'Solanaceae',
  'eggplant': 'Solanaceae',
  'chili': 'Solanaceae',
  // Brassicaceae (Brassicas)
  'cabbage': 'Brassicaceae',
  'kale': 'Brassicaceae',
  'broccoli': 'Brassicaceae',
  'cauliflower': 'Brassicaceae',
  'radish': 'Brassicaceae',
  'arugula': 'Brassicaceae',
  'mustard': 'Brassicaceae',
  // Fabaceae (Legumes)
  'bean': 'Fabaceae',
  'pea': 'Fabaceae',
  'clover': 'Fabaceae',
  'alfalfa': 'Fabaceae',
  'lentil': 'Fabaceae',
  'soybean': 'Fabaceae',
  // Cucurbitaceae (Cucurbits)
  'squash': 'Cucurbitaceae',
  'cucumber': 'Cucurbitaceae',
  'melon': 'Cucurbitaceae',
  'pumpkin': 'Cucurbitaceae',
  'zucchini': 'Cucurbitaceae',
  'watermelon': 'Cucurbitaceae',
  // Poaceae (Grasses/Grains)
  'corn': 'Poaceae',
  'wheat': 'Poaceae',
  'oats': 'Poaceae',
  'rye': 'Poaceae',
  'barley': 'Poaceae',
  'rice': 'Poaceae',
  // Alliaceae (Alliums)
  'onion': 'Alliaceae',
  'garlic': 'Alliaceae',
  'leek': 'Alliaceae',
  'shallot': 'Alliaceae',
  'chive': 'Alliaceae',
  // Apiaceae (Umbellifers)
  'carrot': 'Apiaceae',
  'parsley': 'Apiaceae',
  'celery': 'Apiaceae',
  'cilantro': 'Apiaceae',
  'fennel': 'Apiaceae',
  'dill': 'Apiaceae',
  // Asteraceae
  'lettuce': 'Asteraceae',
  'sunflower': 'Asteraceae',
  'artichoke': 'Asteraceae',
  // Chenopodiaceae
  'beet': 'Chenopodiaceae',
  'spinach': 'Chenopodiaceae',
  'chard': 'Chenopodiaceae',
};
// Rotation Rules
export const ROTATION_RULES: Record<CropFamily, { avoid: CropFamily[], suggest: CropFamily[], reason: string }> = {
  'Solanaceae': {
    avoid: ['Solanaceae'],
    suggest: ['Fabaceae', 'Alliaceae'],
    reason: 'Heavy feeders prone to blight. Follow with nitrogen fixers (Legumes) or light feeders.'
  },
  'Brassicaceae': {
    avoid: ['Brassicaceae'],
    suggest: ['Fabaceae', 'Solanaceae'],
    reason: 'Prone to clubroot. Rotate with unrelated families.'
  },
  'Fabaceae': {
    avoid: [], // Legumes are generally good anywhere, but maybe avoid self-rotation for disease
    suggest: ['Brassicaceae', 'Poaceae', 'Solanaceae'],
    reason: 'Nitrogen fixers. Excellent precursor for heavy feeders like Corn or Brassicas.'
  },
  'Cucurbitaceae': {
    avoid: ['Cucurbitaceae'],
    suggest: ['Fabaceae', 'Alliaceae'],
    reason: 'Heavy feeders. Rotate to prevent powdery mildew buildup.'
  },
  'Poaceae': {
    avoid: ['Poaceae'],
    suggest: ['Fabaceae'],
    reason: 'Heavy nitrogen consumers. Follow with legumes to replenish soil.'
  },
  'Alliaceae': {
    avoid: ['Alliaceae', 'Fabaceae'], // Onions can inhibit beans
    suggest: ['Brassicaceae', 'Solanaceae'],
    reason: 'Light feeders. Good rotation partner for Brassicas.'
  },
  'Apiaceae': {
    avoid: ['Apiaceae'],
    suggest: ['Fabaceae', 'Alliaceae'],
    reason: 'Rotate to prevent carrot fly and root diseases.'
  },
  'Asteraceae': {
    avoid: ['Asteraceae'],
    suggest: ['Fabaceae', 'Alliaceae'],
    reason: 'Generally light feeders.'
  },
  'Chenopodiaceae': {
    avoid: ['Chenopodiaceae'],
    suggest: ['Fabaceae'],
    reason: 'Rotate to manage leaf miners and soil nutrients.'
  },
  'Unknown': {
    avoid: [],
    suggest: ['Fabaceae'],
    reason: 'Unknown crop family. Legumes are a safe bet to improve soil.'
  }
};
const TIPS_DB: KnowledgeTip[] = [
  {
    id: 'tip-1',
    category: 'soil',
    title: 'Nitrogen Fixation',
    content: 'Legumes like beans and peas work with rhizobia bacteria to fix atmospheric nitrogen, enriching your soil naturally.',
    icon: 'beaker'
  },
  {
    id: 'tip-2',
    category: 'rotation',
    title: 'Break Disease Cycles',
    content: 'Rotating crop families prevents soil-borne pathogens from building up. Never plant tomatoes in the same spot two years in a row.',
    icon: 'rotate'
  },
  {
    id: 'tip-3',
    category: 'general',
    title: 'Beneficial Insects',
    content: 'Planting flowers like marigolds and alyssum attracts pollinators and predatory insects that control pests.',
    icon: 'sprout'
  },
  {
    id: 'tip-4',
    category: 'soil',
    title: 'Organic Matter',
    content: 'Adding compost increases soil water retention. A 1% increase in organic matter can hold 20,000 gallons of water per acre.',
    icon: 'beaker'
  },
  {
    id: 'tip-5',
    category: 'rotation',
    title: 'Heavy Feeders',
    content: 'Corn and Brassicas are heavy feeders. Follow them with light feeders (root crops) or soil builders (legumes).',
    icon: 'rotate'
  },
  {
    id: 'tip-6',
    category: 'general',
    title: 'Cover Cropping',
    content: 'Winter rye or vetch protects soil from erosion and adds biomass when tilled under in spring.',
    icon: 'sprout'
  },
  {
    id: 'tip-7',
    category: 'soil',
    title: 'pH Balance',
    content: 'Most vegetables thrive in slightly acidic soil (pH 6.0-6.8). Lime raises pH, while sulfur lowers it.',
    icon: 'beaker'
  },
  {
    id: 'tip-8',
    category: 'general',
    title: 'Succession Planting',
    content: 'Stagger plantings of quick crops like lettuce every 2 weeks to ensure a continuous harvest throughout the season.',
    icon: 'info'
  }
];
export function getFamily(cropName: string): CropFamily {
  const normalized = cropName.toLowerCase();
  // Check for exact match or partial match
  for (const [key, family] of Object.entries(CROP_FAMILIES)) {
    if (normalized.includes(key)) return family;
  }
  return 'Unknown';
}
export function getRotationSuggestions(previousCropName: string): Suggestion[] {
  if (!previousCropName) return [];
  const family = getFamily(previousCropName);
  const rule = ROTATION_RULES[family];
  const suggestions: Suggestion[] = [];
  if (family === 'Unknown') {
    suggestions.push({
      type: 'info',
      message: `Could not identify family for "${previousCropName}".`,
      reason: 'Consider manually checking rotation requirements.'
    });
    return suggestions;
  }
  // Warning about same family
  suggestions.push({
    type: 'warning',
    message: `Avoid planting ${family} crops next (e.g., ${previousCropName}).`,
    reason: `Prevents disease buildup and nutrient depletion specific to ${family}.`
  });
  // Suggestions
  if (rule.suggest.length > 0) {
    const suggestedNames = rule.suggest.join(' or ');
    suggestions.push({
      type: 'recommendation',
      message: `Consider planting: ${suggestedNames}.`,
      reason: rule.reason
    });
  }
  return suggestions;
}
export function getFieldRestRecommendation(soil: SoilProfile | undefined): string | null {
  if (!soil) return null;
  if (soil.nitrogen === 'low' || soil.phosphorus === 'low' || soil.potassium === 'low') {
    return 'Soil nutrients are low. Consider a cover crop (e.g., Clover, Vetch) or a fallow period with compost amendment.';
  }
  if (soil.organicMatter !== undefined && soil.organicMatter < 2) {
    return 'Organic matter is critically low (< 2%). Apply heavy compost or manure and rest the field.';
  }
  return null;
}
export function getRandomKnowledgeTip(): KnowledgeTip {
  const randomIndex = Math.floor(Math.random() * TIPS_DB.length);
  return TIPS_DB[randomIndex];
}
export function validateRotation(previousCropName: string, nextCropName: string): { status: 'warning' | 'recommendation' | 'neutral', message: string } {
    const prevFamily = getFamily(previousCropName);
    const nextFamily = getFamily(nextCropName);
    if (prevFamily === 'Unknown' || nextFamily === 'Unknown') {
        return { status: 'neutral', message: '' };
    }
    const rule = ROTATION_RULES[prevFamily];
    // Check avoid list
    if (rule.avoid.includes(nextFamily)) {
        return {
            status: 'warning',
            message: `Avoid planting ${nextFamily} (${nextCropName}) after ${prevFamily} (${previousCropName}). ${rule.reason}`
        };
    }
    // Check same family (general rule, often implicit in avoid lists but good to be explicit if not)
    if (prevFamily === nextFamily) {
         return {
            status: 'warning',
            message: `Avoid planting ${nextFamily} (${nextCropName}) immediately after another ${prevFamily} crop to prevent disease buildup.`
        };
    }
    // Check suggest list
    if (rule.suggest.includes(nextFamily)) {
        return {
            status: 'recommendation',
            message: `Great choice! ${nextFamily} is a recommended rotation after ${prevFamily}.`
        };
    }
    return { status: 'neutral', message: '' };
}