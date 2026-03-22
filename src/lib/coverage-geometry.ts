import type { Feature, FeatureCollection, Polygon, Position } from 'geojson';

// Earth constants
const EARTH_RADIUS_KM = 6371.0;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Simple position type for coverage calculations.
 * Only contains fields needed for geometric calculations.
 */
export interface CoveragePoint {
  lat: number;
  lon: number;
  alt: number;
}

/**
 * Calculate the distance to the horizon from a satellite at given altitude
 * considering minimum elevation angle (mask angle).
 * 
 * @param altitudeKm - Satellite altitude above Earth's surface in km
 * @param minElevationDeg - Minimum elevation angle for visibility in degrees
 * @returns Distance to coverage edge in km
 */
export function computeCoverageRadius(
  altitudeKm: number,
  minElevationDeg: number = 5
): number {
  const R = EARTH_RADIUS_KM;
  const h = altitudeKm;
  const elevRad = minElevationDeg * DEG_TO_RAD;

  // Distance to horizon with elevation mask:
  // d = R * arccos(R / (R + h) * cos(elev)) - R * elev
  const cosCentralAngle = (R / (R + h)) * Math.cos(elevRad);
  
  // Clamp to valid range to avoid NaN from acos
  const clampedCos = Math.max(-1, Math.min(1, cosCentralAngle));
  
  const centralAngle = Math.acos(clampedCos);
  const distance = R * (centralAngle - elevRad);
  
  return Math.max(0, distance);
}

/**
 * Calculate coverage radius using simple geometric horizon (0° elevation)
 * This is the original algorithm used in CoverageCone.tsx
 */
export function computeFootprintRadius(altitudeKm: number): number {
  const R = EARTH_RADIUS_KM;
  const h = altitudeKm;
  
  const cosAngle = R / (R + h);
  const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  
  // Arc length on Earth's surface
  return R * angle;
}

/**
 * Generate coverage zone as GeoJSON polygon centered on subsatellite point
 * 
 * @param lat - Subsatellite point latitude
 * @param lon - Subsatellite point longitude  
 * @param radiusKm - Coverage radius in km
 * @param numPoints - Number of points to generate the circle
 */
export function generateCoveragePolygon(
  lat: number,
  lon: number,
  radiusKm: number,
  numPoints: number = 64
): Polygon {
  const coordinates: Position[] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const bearing = (i / numPoints) * 2 * Math.PI;
    const point = destinationPoint(lat, lon, bearing, radiusKm);
    coordinates.push([point.lon, point.lat]);
  }
  
  // Close the polygon
  coordinates.push(coordinates[0]);
  
  return {
    type: 'Polygon',
    coordinates: [coordinates],
  };
}

/**
 * Calculate destination point given start point, bearing and distance
 */
function destinationPoint(
  lat: number,
  lon: number,
  bearing: number,
  distanceKm: number
): { lat: number; lon: number } {
  const R = EARTH_RADIUS_KM;
  const d = distanceKm / R;
  const lat1 = lat * DEG_TO_RAD;
  const lon1 = lon * DEG_TO_RAD;
  
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
    Math.cos(lat1) * Math.sin(d) * Math.cos(bearing)
  );
  
  const lon2 = lon1 + Math.atan2(
    Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  );
  
  return {
    lat: lat2 * RAD_TO_DEG,
    lon: lon2 * RAD_TO_DEG,
  };
}

/**
 * Generate gradient coverage zones (concentric rings)
 * Returns GeoJSON FeatureCollection with multiple polygons representing
 * different signal strength zones
 */
export function generateGradientCoverage(
  position: CoveragePoint,
  minElevationDeg: number,
  gradientRings: number = 3
): FeatureCollection<Polygon> {
  const features: Feature<Polygon>[] = [];
  const altitudeKm = position.alt;
  
  // Calculate base coverage radius at given elevation
  const maxRadius = computeCoverageRadius(altitudeKm, minElevationDeg);
  
  if (maxRadius <= 0 || !isFinite(maxRadius)) {
    // Return empty feature collection if no coverage
    return { type: 'FeatureCollection', features: [] };
  }
  
  if (gradientRings <= 1) {
    // Single zone, no gradient
    features.push({
      type: 'Feature',
      properties: {
        zone: 'full',
        signalStrength: 1.0,
        radiusKm: maxRadius,
      },
      geometry: generateCoveragePolygon(position.lat, position.lon, maxRadius),
    });
  } else {
    // Generate concentric rings from edge to center
    // Outer rings = weaker signal, inner rings = stronger signal
    for (let i = gradientRings - 1; i >= 0; i--) {
      const outerFraction = (i + 1) / gradientRings;
      const innerFraction = i / gradientRings;
      
      const outerRadius = maxRadius * outerFraction;
      const innerRadius = maxRadius * innerFraction;
      
      if (i === gradientRings - 1) {
        // Outermost ring (weakest signal)
        features.push({
          type: 'Feature',
          properties: {
            zone: 'outer',
            signalStrength: outerFraction,
            radiusKm: outerRadius,
          },
          geometry: generateCoveragePolygon(position.lat, position.lon, outerRadius),
        });
      } else {
        // Create ring by generating larger circle and subtracting smaller one
        // For simplicity, we create a thick ring as a polygon with hole-like structure
        const outerCoords = generatePolygonCoords(position.lat, position.lon, outerRadius, 64);
        const innerCoords = generatePolygonCoords(position.lat, position.lon, innerRadius, 64);
        
        features.push({
          type: 'Feature',
          properties: {
            zone: i === 0 ? 'center' : 'middle',
            signalStrength: (innerFraction + outerFraction) / 2,
            innerRadiusKm: innerRadius,
            outerRadiusKm: outerRadius,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [outerCoords],
          },
        });
      }
    }
  }
  
  return { type: 'FeatureCollection', features };
}

/**
 * Generate coordinates for a polygon circle (helper)
 */
function generatePolygonCoords(
  lat: number,
  lon: number,
  radiusKm: number,
  numPoints: number
): Position[] {
  const coordinates: Position[] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const bearing = (i / numPoints) * 2 * Math.PI;
    const point = destinationPoint(lat, lon, bearing, radiusKm);
    coordinates.push([point.lon, point.lat]);
  }
  
  return coordinates;
}

/**
 * Compute simple footprint (original algorithm from CoverageCone.tsx)
 * Returns GeoJSON Feature
 */
export function computeSimpleFootprint(
  position: CoveragePoint
): Feature<Polygon> {
  const radius = computeFootprintRadius(position.alt);
  
  return {
    type: 'Feature',
    properties: {
      radiusKm: radius,
      altitudeKm: position.alt,
    },
    geometry: generateCoveragePolygon(position.lat, position.lon, radius),
  };
}

/**
 * Get color for coverage zone based on signal strength
 * Green (strong) -> Yellow -> Red (weak)
 */
export function getCoverageColor(signalStrength: number): string {
  // signalStrength: 0 = weak (red), 1 = strong (green)
  if (signalStrength >= 0.7) {
    // Strong - green
    return '#00ff88';
  } else if (signalStrength >= 0.4) {
    // Medium - yellow
    return '#ffaa00';
  } else {
    // Weak - red
    return '#ff4466';
  }
}

/**
 * Get opacity for coverage zone fill
 */
export function getCoverageOpacity(zone: string): number {
  switch (zone) {
    case 'center':
      return 0.25;
    case 'middle':
      return 0.18;
    case 'outer':
      return 0.1;
    case 'full':
      return 0.15;
    default:
      return 0.1;
  }
}
