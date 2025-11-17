import * as THREE from 'three';

export function createEnvironment(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  // Create a sunset sky using a canvas gradient texture
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 1024;
  skyCanvas.height = 512;
  const skyCtx = skyCanvas.getContext('2d')!;

  // Gradient from deep orange (horizon) to dark blue (zenith)
  const grad = skyCtx.createLinearGradient(0, 0, 0, skyCanvas.height);
  grad.addColorStop(0, '#1c1c2b'); // top
  grad.addColorStop(0.5, '#4b3b6b');
  grad.addColorStop(0.85, '#ff7a4d'); // sunset
  grad.addColorStop(1, '#ffb677'); // horizon glow
  skyCtx.fillStyle = grad;
  skyCtx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);

  // Add a sun glow near the horizon
  const sunX = skyCanvas.width * 0.5;
  const sunY = skyCanvas.height * 0.85;
  const r = 60;
  const radial = skyCtx.createRadialGradient(sunX, sunY, 0, sunX, sunY, r);
  radial.addColorStop(0, 'rgba(255,230,180,0.95)');
  radial.addColorStop(0.4, 'rgba(255,150,80,0.35)');
  radial.addColorStop(1, 'rgba(255,120,40,0)');
  skyCtx.fillStyle = radial;
  skyCtx.beginPath();
  skyCtx.arc(sunX, sunY, r, 0, Math.PI * 2);
  skyCtx.fill();

  const skyTexture = new THREE.CanvasTexture(skyCanvas);
  (skyTexture as any).encoding = (THREE as any).sRGBEncoding || (THREE as any).SRGBColorSpace || (THREE as any).LinearEncoding;
  skyTexture.needsUpdate = true;
  scene.background = skyTexture;

  // Match fog color to horizon glow for depth
  scene.fog = new THREE.Fog(new THREE.Color(0x333333), 10, 200);

  // Create a procedural road texture using a canvas.
  const roadCanvas = document.createElement('canvas');
  roadCanvas.width = 1024;
  roadCanvas.height = 1024;
  const ctx = roadCanvas.getContext('2d')!;

  // Draw asphalt gradient
  const g = ctx.createLinearGradient(0, 0, 0, roadCanvas.height);
  g.addColorStop(0, '#3a3a3a');
  g.addColorStop(1, '#222222');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, roadCanvas.width, roadCanvas.height);

  // Add subtle noise (simple lines) to simulate texture
  ctx.strokeStyle = 'rgba(0,0,0,0.03)';
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * roadCanvas.width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 10, roadCanvas.height);
    ctx.stroke();
  }

  // Draw center dashed line
  ctx.strokeStyle = 'rgba(255,255,200,0.9)';
  ctx.lineWidth = 6;
  const dashH = 40;
  const gapH = 30;
  let y = 0;
  while (y < roadCanvas.height) {
    ctx.beginPath();
    ctx.moveTo(roadCanvas.width / 2, y);
    ctx.lineTo(roadCanvas.width / 2, Math.min(roadCanvas.height, y + dashH));
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
  const geometry = new THREE.PlaneGeometry(200, 4000, 1, 1);
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

  return {
    road,
    skyTexture,
    roadTexture,
  };
}
