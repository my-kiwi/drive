import * as THREE from 'three';

export function createEnvironment(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {

  // Match fog color to horizon glow for depth
  scene.fog = new THREE.Fog(new THREE.Color(0x333333), 10, 200);

  // Create a procedural road texture using a canvas.
  const roadCanvas = document.createElement('canvas');
  roadCanvas.width = 4000;
  roadCanvas.height = 300;
  const ctx = roadCanvas.getContext('2d')!;

  // Draw asphalt gradient
  const g = ctx.createLinearGradient(0, 0, 0, roadCanvas.height);
  g.addColorStop(0, '#3a3a3a');
  g.addColorStop(1, '#222222');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, roadCanvas.width, roadCanvas.height);

  // Add subtle noise (simple lines) to simulate texture
//   ctx.strokeStyle = 'rgba(0,0,0,0.03)';
//   for (let i = 0; i < 3000; i++) {
//     const x = Math.random() * roadCanvas.width;
//     ctx.beginPath();
//     ctx.moveTo(x, 0);
//     ctx.lineTo(x + (Math.random() - 0.5) * 10, roadCanvas.height);
//     ctx.stroke();
//   }

  // Draw center dashed line
  ctx.strokeStyle = 'rgba(255,255,200,0.9)';
  ctx.lineWidth = 5;
  const dashH = 4;
  const gapH = 20;
  let y = 0;
  while (y < roadCanvas.height) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(0, Math.min(roadCanvas.height, y + dashH));
    ctx.stroke();
    y += dashH + gapH;
  }

  // Draw side edges (curb)
  ctx.fillStyle = '#2b2b2b';
  ctx.fillRect(0, 0, 80, roadCanvas.height);
  ctx.fillRect(roadCanvas.width - 80, 0, 80, roadCanvas.height);

  // Create texture
  const roadTexture = new THREE.CanvasTexture(roadCanvas);
  roadTexture.wrapS = roadTexture.wrapT = THREE.RepeatWrapping;
  roadTexture.repeat.set(50, 1); // repeat far forward
  (roadTexture as any).anisotropy = renderer.capabilities.getMaxAnisotropy();
  (roadTexture as any).encoding = (THREE as any).sRGBEncoding || (THREE as any).LinearEncoding;
  roadTexture.needsUpdate = true;

  // Large plane for the ground (road)
  const geometry = new THREE.PlaneGeometry(4000, 300, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    map: roadTexture,
    roughness: 1.0,
    metalness: 0.0,
  });
  const road = new THREE.Mesh(geometry, material);
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0;
  road.receiveShadow = true;

  // A slight tilt/curve can be simulated by bending vertices if desired later
  scene.add(road);
}
