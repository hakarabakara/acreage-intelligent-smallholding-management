import { DiagnosticResult } from "@shared/types";
const MOCK_CONDITIONS = [
  { condition: 'Healthy', severity: 'low', recommendation: 'Continue regular care schedule.' },
  { condition: 'Early Blight', severity: 'medium', recommendation: 'Apply copper fungicide and remove infected leaves.' },
  { condition: 'Aphid Infestation', severity: 'medium', recommendation: 'Introduce ladybugs or use neem oil spray.' },
  { condition: 'Powdery Mildew', severity: 'low', recommendation: 'Improve air circulation and apply sulfur fungicide.' },
  { condition: 'Nitrogen Deficiency', severity: 'medium', recommendation: 'Apply nitrogen-rich fertilizer or compost tea.' },
  { condition: 'Root Rot', severity: 'high', recommendation: 'Improve drainage immediately; reduce watering.' },
];
export async function analyzeCropImage(imageUrl: string): Promise<DiagnosticResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  // Deterministic mock based on string length to be consistent for same image, but random-ish
  const index = imageUrl.length % MOCK_CONDITIONS.length;
  const result = MOCK_CONDITIONS[index];
  const confidence = 0.7 + (Math.random() * 0.25); // 0.70 - 0.95
  return {
    condition: result.condition,
    severity: result.severity as 'low' | 'medium' | 'high',
    recommendation: result.recommendation,
    confidence
  };
}