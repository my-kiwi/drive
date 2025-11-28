import * as THREE from 'three';
import { loadTexture } from '../utils/texture-loader';
import { Constants } from '../constants';
import { getRenderer } from '../renderer';

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
  const roadSegments = 100;
  const roadSegmentLength = roadLength / roadSegments;

  // 1. Road curve
  const points = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(roadSegmentLength, 0, 10),
    new THREE.Vector3(roadSegmentLength * 2, 0, -10),
    new THREE.Vector3(roadSegmentLength * 3, 0, 15),
    new THREE.Vector3(roadSegmentLength * 4, 0, -15),
    new THREE.Vector3(roadSegmentLength * 5, 0, 0),
    new THREE.Vector3(roadSegmentLength * 6, 0, 10),
    new THREE.Vector3(roadSegmentLength * 7, 0, -10),
    new THREE.Vector3(roadSegmentLength * 8, 0, 0),
    new THREE.Vector3(roadSegmentLength * 9, 0, 15),
    new THREE.Vector3(roadSegmentLength * 10, 0, 0),
  ];

  const curve = new THREE.CatmullRomCurve3(points);
  const roadThickness = 0.01;

  // choose a base scale for how many world units equal one texture repeat
  const textureScaleU = 10; // 1 tile every `textureScaleU` units along the road

  const shape = new THREE.Shape();

  shape.moveTo(-roadThickness / 2, -roadWidth / 2);
  shape.lineTo(roadThickness / 2, -roadWidth / 2);
  shape.lineTo(roadThickness / 2, roadWidth / 2);
  shape.lineTo(-roadThickness / 2, roadWidth / 2);
  shape.closePath();

  // EXTRUDE
  // Pre-sample the curve so the UV generator can map each vertex to a
  // nearest point on the curve and produce stable U (distance) coordinates
  // and signed V (across-road) coordinates. This avoids small per-face
  // UVs and the brick-like tiling seen earlier.
  const extrudeSteps = roadSegments * 8; // more steps = smoother road
  const sampleDivisions = Math.max(100, extrudeSteps * 8);
  const samplePoints: THREE.Vector3[] = [];
  const sampleTangents: THREE.Vector3[] = [];
  const sampleLengths: number[] = curve.getLengths(sampleDivisions);
  for (let i = 0; i <= sampleDivisions; i++) {
    const u = i / sampleDivisions;
    samplePoints.push(curve.getPointAt(u));
    sampleTangents.push(curve.getTangentAt(u).clone());
  }

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

          // find nearest sample on the curve
          let bestI = 0;
          let bestDist = Infinity;
          for (let i = 0; i < samplePoints.length; i++) {
            const d = vPos.distanceToSquared(samplePoints[i]);
            if (d < bestDist) {
              bestDist = d;
              bestI = i;
            }
          }

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

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // The UVGenerator encodes U in world units / textureScaleU, so keep
  // the texture repeat at 1 and let the UVs control tiling.
  roadTexture.repeat.set(1, 1);
  roadTexture.needsUpdate = true;

  // set anisotropy for crisper texture at oblique angles
  const maxAniso = getRenderer().capabilities.getMaxAnisotropy();
  roadTexture.anisotropy = maxAniso;

  // 🔥 Rotate geometry so the road lies flat (X-Z plane)
  // geometry.rotateX(Math.PI / 2);

  const material = new THREE.MeshStandardMaterial({
    map: roadTexture,
    roughness: 1.0,
    metalness: 0.0,
  });
  const road = new THREE.Mesh(geometry, material);

  // road.rotation.x = -Math.PI / 2;
  road.rotation.y = -Math.PI / 2; // align with car direction

  road.position.y = -0.05; // place road below car for proper shadows
  // road.position.x = 0;
  road.receiveShadow = true;

  return road;
};
