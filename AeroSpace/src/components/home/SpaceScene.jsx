import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * Procedural Earth Texture Generator (Offscreen HTML5 Canvas)
 * Generates an ultra-crisp oceanic + continent + night city lights texture
 * without external image CDN dependencies for 100% offline reliability.
 */
function createProceduralEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // 1. Deep Oceanic Gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, '#030c1e');
  oceanGrad.addColorStop(0.5, '#051838');
  oceanGrad.addColorStop(1, '#020917');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Continents (Landmass silhouettes with organic noise)
  ctx.fillStyle = '#0f3d36';
  ctx.strokeStyle = '#185c52';
  ctx.lineWidth = 2;

  // Approximate world continental landmasses
  const landmasses = [
    // North America
    [[120, 90], [280, 80], [320, 160], [250, 220], [180, 260], [140, 200], [110, 140]],
    // South America
    [[230, 260], [310, 280], [320, 360], [260, 440], [220, 380], [210, 300]],
    // Eurasia
    [[450, 70], [800, 60], [880, 140], [850, 220], [720, 230], [600, 200], [500, 140], [440, 110]],
    // Africa
    [[470, 180], [580, 190], [610, 280], [570, 390], [500, 400], [460, 280], [450, 210]],
    // Australia
    [[750, 310], [860, 320], [880, 400], [800, 420], [740, 370]],
    // Greenland / Arctic
    [[330, 30], [410, 40], [390, 80], [320, 70]]
  ];

  landmasses.forEach(points => {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      const xc = (points[i][0] + points[i - 1][0]) / 2;
      const yc = (points[i][1] + points[i - 1][1]) / 2;
      ctx.quadraticCurveTo(points[i - 1][0], points[i - 1][1], xc, yc);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  // 3. Terrain relief elevation & coastal shelf glow
  ctx.fillStyle = '#174f46';
  for (let i = 0; i < 400; i++) {
    const rx = Math.random() * canvas.width;
    const ry = Math.random() * canvas.height;
    ctx.beginPath();
    ctx.arc(rx, ry, 1 + Math.random() * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Golden Night City Lights Cluster Dots
  ctx.fillStyle = '#ffcf40';
  for (let i = 0; i < 650; i++) {
    const lx = Math.random() * canvas.width;
    const ly = Math.random() * canvas.height;
    ctx.fillRect(lx, ly, 1.2, 1.2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * 3D Satellite Mesh Factory
 * Constructs detailed avionics body, twin solar panels, antenna dish & blinking LED
 */
function createSatelliteMesh(color = 0x00f5ff) {
  const satGroup = new THREE.Group();

  // Central Avionics Bus
  const bodyGeo = new THREE.BoxGeometry(0.35, 0.45, 0.35);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x242e3d,
    metalness: 0.9,
    roughness: 0.2,
    emissive: 0x051224,
    emissiveIntensity: 0.3
  });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  satGroup.add(bodyMesh);

  // Gold Foil Thermal Shield Patch
  const foilGeo = new THREE.BoxGeometry(0.36, 0.2, 0.2);
  const foilMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.95,
    roughness: 0.15,
    emissive: 0x92400e,
    emissiveIntensity: 0.4
  });
  const foilMesh = new THREE.Mesh(foilGeo, foilMat);
  satGroup.add(foilMesh);

  // Solar Array Strut Crossbar
  const strutGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.8);
  const strutMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
  const strutMesh = new THREE.Mesh(strutGeo, strutMat);
  strutMesh.rotation.z = Math.PI / 2;
  satGroup.add(strutMesh);

  // Twin Photovoltaic Solar Panels
  const panelGeo = new THREE.BoxGeometry(0.9, 0.32, 0.02);
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x0c4a6e,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0x0369a1,
    emissiveIntensity: 0.25
  });

  const leftPanel = new THREE.Mesh(panelGeo, panelMat);
  leftPanel.position.set(-0.85, 0, 0);
  satGroup.add(leftPanel);

  const rightPanel = new THREE.Mesh(panelGeo, panelMat);
  rightPanel.position.set(0.85, 0, 0);
  satGroup.add(rightPanel);

  // High-Gain Communication Dish
  const dishGeo = new THREE.ConeGeometry(0.18, 0.1, 16, 1, true);
  const dishMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
  const dishMesh = new THREE.Mesh(dishGeo, dishMat);
  dishMesh.position.set(0, 0.26, 0);
  dishMesh.rotation.x = Math.PI;
  satGroup.add(dishMesh);

  // Blinking Strobe Navigation Beacon LED
  const ledGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const ledMat = new THREE.MeshBasicMaterial({ color });
  const ledMesh = new THREE.Mesh(ledGeo, ledMat);
  ledMesh.position.set(0, -0.24, 0);
  satGroup.add(ledMesh);

  satGroup.userData = { ledMesh, baseColor: color };
  return satGroup;
}

/**
 * Continuous 3D Space Scene
 * Hosts one persistent Three.js universe for all 7 narrative stages of the Home page.
 */
export default function SpaceScene({ scrollProgress = 0, onStageChange }) {
  const mountRef = useRef(null);
  const [webglAvailable, setWebglAvailable] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 0. Verify WebGL support
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglAvailable(false);
        return;
      }
    } catch {
      setWebglAvailable(false);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    // ─────────────────────────────────────────────────────────────
    // 1. SCENE, CAMERA & RENDERER
    // ─────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020510, 0.01);

    const width = window.innerWidth;
    const height = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    // Initial Stage 0 (Hero) camera position
    camera.position.set(2.5, 1.2, 14.5);
    camera.lookAt(1.5, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isMobile,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.2 : 1.8));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);

    // ─────────────────────────────────────────────────────────────
    // 2. CINEMATIC LIGHTING
    // ─────────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x0b1329, 1.8);
    scene.add(ambientLight);

    // Primary Key Sun Light (Warm golden ray illuminating Earth crescent)
    const sunLight = new THREE.DirectionalLight(0xfff1db, 3.8);
    sunLight.position.set(28, 14, 22);
    scene.add(sunLight);

    // Cool Deep-Space Fill Light
    const fillLight = new THREE.DirectionalLight(0x0284c7, 2.0);
    fillLight.position.set(-24, -10, -15);
    scene.add(fillLight);

    // Atmospheric Cyan Rim Light
    const rimLight = new THREE.DirectionalLight(0x00f5ff, 2.8);
    rimLight.position.set(0, 10, -25);
    scene.add(rimLight);

    // ─────────────────────────────────────────────────────────────
    // 3. CELESTIAL BODY: 3D EARTH & ATMOSPHERE
    // ─────────────────────────────────────────────────────────────
    const earthGroup = new THREE.Group();
    earthGroup.position.set(4.5, -0.5, 0);
    scene.add(earthGroup);

    const earthRadius = 3.8;
    const earthTexture = createProceduralEarthTexture();

    const earthGeo = new THREE.SphereGeometry(earthRadius, isMobile ? 36 : 64, isMobile ? 36 : 64);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.25,
      emissive: 0x020a16,
      emissiveIntensity: 0.55
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // Wireframe Tactical Cyber Grid Overlay
    const gridGeo = new THREE.SphereGeometry(earthRadius + 0.04, 36, 18);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.14
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    earthGroup.add(gridMesh);

    // Atmospheric Rayleigh Scattering Glow (Fresnel Halo)
    const haloGeo = new THREE.SphereGeometry(earthRadius + 0.42, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.24,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    earthGroup.add(haloMesh);

    // ─────────────────────────────────────────────────────────────
    // 4. INCLINED KEPLERIAN ORBITAL TRAJECTORY RINGS
    // ─────────────────────────────────────────────────────────────
    const orbitRings = [
      { radius: 6.2, color: 0x00f5ff, inclinationX: 0.45, inclinationZ: 0.25, opacity: 0.35 },
      { radius: 8.5, color: 0x38bdf8, inclinationX: -0.35, inclinationZ: -0.55, opacity: 0.28 },
      { radius: 10.8, color: 0xf59e0b, inclinationX: 0.75, inclinationZ: -0.15, opacity: 0.22 }
    ];

    orbitRings.forEach(spec => {
      const ringGeo = new THREE.BufferGeometry();
      const segments = 128;
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(Math.cos(theta) * spec.radius, 0, Math.sin(theta) * spec.radius);
      }
      ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

      const ringMat = new THREE.LineBasicMaterial({
        color: spec.color,
        transparent: true,
        opacity: spec.opacity,
        blending: THREE.AdditiveBlending
      });
      const ringLine = new THREE.Line(ringGeo, ringMat);
      ringLine.rotation.x = spec.inclinationX;
      ringLine.rotation.z = spec.inclinationZ;
      earthGroup.add(ringLine);
    });

    // ─────────────────────────────────────────────────────────────
    // 5. 3D SATELLITE CONSTELLATION WITH SOLAR ARRAYS
    // ─────────────────────────────────────────────────────────────
    const satellites = [
      { mesh: createSatelliteMesh(0x00f5ff), radius: 6.2, speed: 0.45, incX: 0.45, incZ: 0.25, phase: 0 },
      { mesh: createSatelliteMesh(0x38bdf8), radius: 8.5, speed: 0.32, incX: -0.35, incZ: -0.55, phase: 2.1 },
      { mesh: createSatelliteMesh(0xf59e0b), radius: 10.8, speed: 0.22, incX: 0.75, incZ: -0.15, phase: 4.3 },
      { mesh: createSatelliteMesh(0x10b981), radius: 7.4, speed: 0.38, incX: -0.65, incZ: 0.45, phase: 1.2 }
    ];

    satellites.forEach(s => {
      earthGroup.add(s.mesh);
    });

    // ─────────────────────────────────────────────────────────────
    // 6. LASER TELEMETRY PULSE BEAM
    // ─────────────────────────────────────────────────────────────
    const pulseGeo = new THREE.BufferGeometry();
    const pulsePositions = new Float32Array(6);
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3));
    const pulseMat = new THREE.LineBasicMaterial({
      color: 0x00f5ff,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      linewidth: 2
    });
    const laserBeam = new THREE.Line(pulseGeo, pulseMat);
    earthGroup.add(laserBeam);

    // ─────────────────────────────────────────────────────────────
    // 7. DEEP SPACE STARFIELD
    // ─────────────────────────────────────────────────────────────
    const starCount = isMobile ? 600 : 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 300;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 300;
      starPos[i * 3 + 2] = -40 - Math.random() * 150;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.25,
      transparent: true,
      opacity: 0.85
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // ─────────────────────────────────────────────────────────────
    // 8. CHOREOGRAPHED 7-STAGE CAMERA & SCENE INTERPOLATION
    // ─────────────────────────────────────────────────────────────
    // Stage Keyframes: [cameraX, cameraY, cameraZ, targetX, targetY, targetZ, earthX, earthY, earthZ, earthScale]
    const stageKeyframes = [
      // Stage 0: Hero (Earth on right, wide cinematic perspective)
      { cam: [2.5, 1.2, 14.5], look: [1.5, 0, 0], earth: [4.5, -0.5, 0], scale: 1.0 },
      // Stage 1: Space Intelligence (Camera glides closer to orbital limb)
      { cam: [1.2, 2.0, 10.5], look: [0.5, 0.2, 0], earth: [2.8, -0.8, -1.0], scale: 1.05 },
      // Stage 2: Core Capabilities (Oblique tactical telemetry angle)
      { cam: [-2.0, 3.2, 11.5], look: [0, 0, -1], earth: [-2.5, -1.2, -2.0], scale: 1.1 },
      // Stage 3: Technology (Close focus on satellite bus & solar arrays)
      { cam: [3.2, 0.6, 6.8], look: [3.4, 0.5, 1.2], earth: [5.8, -2.0, -4.0], scale: 1.25 },
      // Stage 4: Global Monitoring (High orbit sunrise crescent view)
      { cam: [0, 3.8, 15.5], look: [0, -0.4, 0], earth: [0, -2.2, -2.0], scale: 1.15 },
      // Stage 5: Secondary Modules / RF Telemetry (Elevated analytical grid view)
      { cam: [-3.2, 4.5, 13.0], look: [0, 0, 0], earth: [-3.0, -1.0, -1.5], scale: 1.05 },
      // Stage 6: Final Mission CTA (Wide panoramic cosmic finale)
      { cam: [0, 1.0, 17.0], look: [0, 0, 0], earth: [0, -2.8, -1.0], scale: 1.0 }
    ];

    // Mouse Parallax Values
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Handle Window Resize
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ─────────────────────────────────────────────────────────────
    // 9. ANIMATION LOOP WITH CONTINUOUS SCROLL INTERPOLATION
    // ─────────────────────────────────────────────────────────────
    let animationFrameId;
    let clock = new THREE.Clock();
    let currentCamPos = new THREE.Vector3(2.5, 1.2, 14.5);
    let currentLookAt = new THREE.Vector3(1.5, 0, 0);
    let currentEarthPos = new THREE.Vector3(4.5, -0.5, 0);
    let currentEarthScale = 1.0;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      const elapsedTime = clock.getElapsedTime();
      const progress = scrollProgressRef.current;

      // Determine active stage (0 to 6)
      const stageSegment = 1 / (stageKeyframes.length - 1);
      const stageIdx = Math.min(Math.floor(progress / stageSegment), stageKeyframes.length - 2);
      const stageAlpha = (progress - stageIdx * stageSegment) / stageSegment;

      const kfA = stageKeyframes[stageIdx];
      const kfB = stageKeyframes[stageIdx + 1];

      // Linear interpolation between stages
      const targetCamX = THREE.MathUtils.lerp(kfA.cam[0], kfB.cam[0], stageAlpha) + (prefersReducedMotion ? 0 : mouseX * 0.4);
      const targetCamY = THREE.MathUtils.lerp(kfA.cam[1], kfB.cam[1], stageAlpha) - (prefersReducedMotion ? 0 : mouseY * 0.3);
      const targetCamZ = THREE.MathUtils.lerp(kfA.cam[2], kfB.cam[2], stageAlpha);

      const targetLookX = THREE.MathUtils.lerp(kfA.look[0], kfB.look[0], stageAlpha);
      const targetLookY = THREE.MathUtils.lerp(kfA.look[1], kfB.look[1], stageAlpha);
      const targetLookZ = THREE.MathUtils.lerp(kfA.look[2], kfB.look[2], stageAlpha);

      const targetEarthX = THREE.MathUtils.lerp(kfA.earth[0], kfB.earth[0], stageAlpha);
      const targetEarthY = THREE.MathUtils.lerp(kfA.earth[1], kfB.earth[1], stageAlpha);
      const targetEarthZ = THREE.MathUtils.lerp(kfA.earth[2], kfB.earth[2], stageAlpha);
      const targetScale = THREE.MathUtils.lerp(kfA.scale, kfB.scale, stageAlpha);

      // Smooth damping lerp for jitter-free cinematic motion
      const lerpSpeed = 0.065;
      currentCamPos.x += (targetCamX - currentCamPos.x) * lerpSpeed;
      currentCamPos.y += (targetCamY - currentCamPos.y) * lerpSpeed;
      currentCamPos.z += (targetCamZ - currentCamPos.z) * lerpSpeed;

      currentLookAt.x += (targetLookX - currentLookAt.x) * lerpSpeed;
      currentLookAt.y += (targetLookY - currentLookAt.y) * lerpSpeed;
      currentLookAt.z += (targetLookZ - currentLookAt.z) * lerpSpeed;

      currentEarthPos.x += (targetEarthX - currentEarthPos.x) * lerpSpeed;
      currentEarthPos.y += (targetEarthY - currentEarthPos.y) * lerpSpeed;
      currentEarthPos.z += (targetEarthZ - currentEarthPos.z) * lerpSpeed;
      currentEarthScale += (targetScale - currentEarthScale) * lerpSpeed;

      camera.position.copy(currentCamPos);
      camera.lookAt(currentLookAt);

      earthGroup.position.copy(currentEarthPos);
      earthGroup.scale.setScalar(currentEarthScale);

      // Planetary Rotation (Slow & Majestic)
      const rotSpeed = prefersReducedMotion ? 0.0005 : 0.002;
      earthMesh.rotation.y += rotSpeed;
      gridMesh.rotation.y += rotSpeed * 0.95;

      // Update Satellites along Keplerian orbits
      satellites.forEach((s, idx) => {
        const angle = s.phase + elapsedTime * s.speed * (prefersReducedMotion ? 0.3 : 1.0);
        const x = Math.cos(angle) * s.radius;
        const z = Math.sin(angle) * s.radius;

        // Apply orbital inclination matrix
        const vec = new THREE.Vector3(x, 0, z);
        vec.applyAxisAngle(new THREE.Vector3(1, 0, 0), s.incX);
        vec.applyAxisAngle(new THREE.Vector3(0, 0, 1), s.incZ);

        s.mesh.position.copy(vec);
        s.mesh.rotation.y = angle + Math.PI / 2;
        s.mesh.rotation.z = Math.sin(elapsedTime + idx) * 0.1;

        // Blink Strobe Navigation LED
        if (s.mesh.userData.ledMesh) {
          const isBlink = Math.sin(elapsedTime * 4 + idx) > 0.3;
          s.mesh.userData.ledMesh.visible = isBlink;
        }

        // Primary satellite laser comms beam to Earth ground node
        if (idx === 0) {
          const satWorldPos = s.mesh.position;
          const earthTarget = new THREE.Vector3(
            Math.sin(elapsedTime * 0.5) * 1.5,
            Math.cos(elapsedTime * 0.3) * 1.5,
            3.6
          );

          const positions = laserBeam.geometry.attributes.position.array;
          positions[0] = satWorldPos.x;
          positions[1] = satWorldPos.y;
          positions[2] = satWorldPos.z;
          positions[3] = earthTarget.x;
          positions[4] = earthTarget.y;
          positions[5] = earthTarget.z;
          laserBeam.geometry.attributes.position.needsUpdate = true;
          laserBeam.material.opacity = (Math.sin(elapsedTime * 3) + 1) * 0.35 + 0.15;
        }
      });

      // Starfield subtle cosmic drift
      starField.rotation.y += 0.0001;

      renderer.render(scene, camera);
    };

    render();

    // Cleanup resources upon unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      gridGeo.dispose();
      gridMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      starGeo.dispose();
      starMat.dispose();
    };
  }, []);

  // Sync scrollProgress via Ref for 60fps rendering without re-triggering useEffect
  const scrollProgressRef = useRef(scrollProgress);
  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
    const stageIndex = Math.min(Math.floor(scrollProgress * 7), 6);
    if (onStageChange) onStageChange(stageIndex);
  }, [scrollProgress, onStageChange]);

  return (
    <div
      ref={mountRef}
      className="home-3d-background"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden'
      }}
    >
      {/* Graceful CSS Deep-Space Fallback if WebGL is unavailable */}
      {!webglAvailable && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 70% 30%, #0c2b4f 0%, #030816 60%, #01040a 100%)'
          }}
        />
      )}
    </div>
  );
}
