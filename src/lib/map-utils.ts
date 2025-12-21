import type { GeoPoint } from '@shared/types';
/**
 * Calculates the centroid of a non-self-intersecting closed polygon.
 * Uses the standard centroid formula based on signed area.
 * Fallbacks to bounding box center if area is zero or points are insufficient.
 */
export function getPolygonCentroid(points: GeoPoint[]): GeoPoint {
  if (!points || points.length === 0) return { x: 50, y: 50 };
  if (points.length === 1) return points[0];
  if (points.length === 2) return {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2
  };
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const p1 = points[i];
    const p2 = points[j];
    const cross = p1.x * p2.y - p2.x * p1.y;
    area += cross;
    cx += (p1.x + p2.x) * cross;
    cy += (p1.y + p2.y) * cross;
  }
  area /= 2;
  // Handle collinear points or zero area by falling back to bounding box center
  if (area === 0) {
     const minX = Math.min(...points.map(p => p.x));
     const maxX = Math.max(...points.map(p => p.x));
     const minY = Math.min(...points.map(p => p.y));
     const maxY = Math.max(...points.map(p => p.y));
     return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  }
  cx /= (6 * area);
  cy /= (6 * area);
  return { x: cx, y: cy };
}