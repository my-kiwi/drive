import * as THREE from 'three';
import { loadTexture } from '../utils/texture-loader';
import { Constants } from '../constants';
import { getRenderer } from '../renderer';

export const roadState = {
  path: [] as THREE.Vector2[],
};


export const createRoad = async (): Promise<THREE.Mesh> => {
  const roadTexture = await loadTexture('road.jpg');

  // We'll set RepeatWrapping and a repeat value after we compute the
  // road curve length so the texture tiles along the road instead of
  // being stretched (ClampToEdge clamped large UVs causing the stretched look).
  // Also set anisotropy from the renderer for better sampling.
  roadTexture.wrapS = roadTexture.wrapT = THREE.RepeatWrapping;
  roadTexture.needsUpdate = true;

  const roadWidth = 13;
  const roadLength = Constants.MAP_SIZE;

  // 1. Road curve
  const zTurns = [0, -10, 10, 150, -150, 0, 100, -100, 0, 150, 0];
  zTurns.push(...zTurns, ...zTurns, ...zTurns, ...zTurns, ...zTurns, ...zTurns); // repeat to extend road length

  const roadSegments = zTurns.length;
  const roadSegmentLength = roadLength / roadSegments;

  // start from -halfLength to center the road at origin
  for (let i = -roadSegments; i <= roadSegments; i++) {
    roadState.path.push(new THREE.Vector2(i * roadSegmentLength, zTurns[Math.abs(i)] || 0));
  }

  const curve = new THREE.CatmullRomCurve3(roadState.path.map((p) => new THREE.Vector3(
    p.x,
    0, // is actually the height (should be z) but the extrude geometry is rotated later
    p.y))
  );

  const roadThickness = 0.01;

  // base scale for how many world units equal one texture repeat
  // Increase this value to make each texture tile larger along the road
  const textureScaleU = 100; // (bigger = more stretched along road)

  const shape = new THREE.Shape();

  shape.moveTo(-roadThickness / 2, -roadWidth / 2);
  shape.lineTo(roadThickness / 2, -roadWidth / 2);
  shape.lineTo(roadThickness / 2, roadWidth / 2);
  shape.lineTo(-roadThickness / 2, roadWidth / 2);
  shape.closePath();

  const extrudeSettings: THREE.ExtrudeGeometryOptions = createExtrudeSettings(
    curve,
    roadSegments,
    roadWidth,
    textureScaleU
  );

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // The UVGenerator encodes U in world units / textureScaleU, so keep
  // the texture repeat at 1 and let the UVs control tiling.
  roadTexture.repeat.set(1, 1);
  roadTexture.needsUpdate = true;

  // set anisotropy for crisper texture at oblique angles
  const maxAniso = getRenderer().capabilities.getMaxAnisotropy();
  roadTexture.anisotropy = maxAniso;

  const material = new THREE.MeshStandardMaterial({
    map: roadTexture,
    roughness: 1.0,
    metalness: 0.0,
  });
  const road = new THREE.Mesh(geometry, material);

  // road.rotation.x = -Math.PI / 2;
  road.rotation.y = -Math.PI / 2; // align with car direction

  road.position.y = 0; // place road below car for proper shadows
  // road.position.x = 0;
  road.receiveShadow = true;

  return road;
};

const createExtrudeSettings = (
  curve: THREE.Curve<THREE.Vector3>,
  segments: number,
  roadWidth: number,
  textureScaleU: number
): THREE.ExtrudeGeometryOptions => {
  // EXTRUDE
  // Pre-sample the curve so the UV generator can map each vertex to a
  // nearest point on the curve and produce stable U (distance) coordinates
  // and signed V (across-road) coordinates. This avoids small per-face
  // UVs and the brick-like tiling seen earlier.
  const extrudeSteps = segments * 50; // more steps = smoother road
  const sampleDivisions = Math.max(100, extrudeSteps * 8);
  const samplePoints: THREE.Vector3[] = [];
  const sampleTangents: THREE.Vector3[] = [];
  const sampleLengths: number[] = curve.getLengths(sampleDivisions);
  for (let i = 0; i <= sampleDivisions; i++) {
    const u = i / sampleDivisions;
    samplePoints.push(curve.getPointAt(u));
    sampleTangents.push(curve.getTangentAt(u).clone());
  }

  // cache last found index to speed up nearest-sample queries
  let lastBestIndex = 0;

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: extrudeSteps,
    extrudePath: curve,
    UVGenerator: {
      generateTopUV: function () {
        return [new THREE.Vector2(0, 0), new THREE.Vector2(0, 0), new THREE.Vector2(0, 0)];
      },
      generateSideWallUV: function (geometry, vertices, indexA, indexB, indexC, indexD) {
        // helper to compute UV for a single vertex index
        const computeUV = (index: number) => {
          const vx = vertices[index * 3];
          const vy = vertices[index * 3 + 1];
          const vz = vertices[index * 3 + 2];
          const vPos = new THREE.Vector3(vx, vy, vz);

          // find nearest sample on the curve using a local search
          // starting from `lastBestIndex`. UV generation walks the
          // geometry along the path so this is amortized cheap.
          let bestI = lastBestIndex;
          let bestDist = vPos.distanceToSquared(samplePoints[bestI]);
          // forward
          for (let i = bestI + 1; i < samplePoints.length; i++) {
            const d = vPos.distanceToSquared(samplePoints[i]);
            if (d < bestDist) {
              bestDist = d;
              bestI = i;
            } else {
              break;
            }
          }
          // backward
          for (let i = bestI - 1; i >= 0; i--) {
            const d = vPos.distanceToSquared(samplePoints[i]);
            if (d < bestDist) {
              bestDist = d;
              bestI = i;
            } else {
              break;
            }
          }
          lastBestIndex = bestI;

          // U = distance along the curve (meters) scaled by textureScaleU
          const uMeters = sampleLengths[bestI];
          const u = uMeters / textureScaleU;

          // compute signed lateral offset by projecting onto binormal
          const tangent = sampleTangents[bestI];
          const up = new THREE.Vector3(0, 1, 0);
          const binormal = new THREE.Vector3().crossVectors(up, tangent).normalize();
          const lateral = vPos.clone().sub(samplePoints[bestI]);
          const signed = lateral.dot(binormal);

          // normalize v to 0..1 across road width
          const halfWidth = roadWidth / 2;
          const v = (signed / halfWidth + 1) / 2;

          return new THREE.Vector2(u, v);
        };

        const uvA = computeUV(indexA);
        const uvB = computeUV(indexB);
        const uvC = computeUV(indexC);
        const uvD = computeUV(indexD);

        return [uvA, uvB, uvC, uvD];
      },
    },
  };
  return extrudeSettings;
};
