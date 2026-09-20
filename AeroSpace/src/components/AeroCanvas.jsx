import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AeroCanvas({
  onAssemblyUpdate,
  manualProgress = null,
  isSpinning = true,
}) {
  const mountRef = useRef(null);
  const stateRef = useRef({
    manualProgress,
    isSpinning,
  });

  useEffect(() => {
    stateRef.current = {
      manualProgress,
      isSpinning,
    };
  }, [manualProgress, isSpinning]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // ─────────────────────────────────────────────────────────────
    // 1. RENDERER + CAMERA
    // ─────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020208, 0.012);

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    camera.position.set(0, 2, 18);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // ─────────────────────────────────────────────────────────────
    // 2. CINEMATIC LIGHTING
    // ─────────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x1a1a3e, 2.0);
    scene.add(ambientLight);

    // Primary key light — warm orange sunbeam
    const keyLight = new THREE.DirectionalLight(0xffa066, 4.5);
    keyLight.position.set(15, 20, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 60;
    keyLight.shadow.camera.left = -12;
    keyLight.shadow.camera.right = 12;
    keyLight.shadow.camera.top = 12;
    keyLight.shadow.camera.bottom = -12;
    keyLight.shadow.bias = -0.0003;
    scene.add(keyLight);

    // Cool blue fill light from below-left
    const fillLight = new THREE.DirectionalLight(0x3388ff, 2.5);
    fillLight.position.set(-15, -8, -6);
    scene.add(fillLight);

    // Rim light — cyan accent from behind
    const rimLight = new THREE.DirectionalLight(0x00f5ff, 3.0);
    rimLight.position.set(0, 5, -20);
    scene.add(rimLight);

    // Point light at center — warm glow from docking hub
    const hubGlow = new THREE.PointLight(0xff5722, 6, 12, 2);
    hubGlow.position.set(0, 0, 0);
    scene.add(hubGlow);

    // ─────────────────────────────────────────────────────────────
    // 3. COSMIC STARFIELD + NEBULA DUST
    // ─────────────────────────────────────────────────────────────
    const starCount = 1500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 200;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 200;
      starPos[i * 3 + 2] = -20 - Math.random() * 100;
      starSizes[i] = 0.08 + Math.random() * 0.25;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.18,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Distant nebula dust clouds
    const dustCount = 400;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 120;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      dustPos[i * 3 + 2] = -15 - Math.random() * 60;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xff5533,
      size: 0.6,
      transparent: true,
      opacity: 0.15,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(dustGeo, dustMat));

    // ─────────────────────────────────────────────────────────────
    // 4. 3D ROOT GROUP
    // ─────────────────────────────────────────────────────────────
    const master3DRoot = new THREE.Group();
    scene.add(master3DRoot);

    // Cinematic initial viewing angle
    master3DRoot.rotation.x = 0.45;
    master3DRoot.rotation.y = -0.35;

    // Centrifugal spin group
    const spinRingGroup = new THREE.Group();
    master3DRoot.add(spinRingGroup);

    // ─────────────────────────────────────────────────────────────
    // 5. PBR MATERIALS (Physically Based Rendering)
    // ─────────────────────────────────────────────────────────────
    const whiteHullMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeef,
      roughness: 0.28,
      metalness: 0.12,
      envMapIntensity: 0.8,
    });

    const darkRadiatorMat = new THREE.MeshStandardMaterial({
      color: 0x15171f,
      roughness: 0.18,
      metalness: 0.92,
    });

    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x8a90a8,
      roughness: 0.2,
      metalness: 0.95,
    });

    const darkChassisMat = new THREE.MeshStandardMaterial({
      color: 0x0d0f16,
      roughness: 0.4,
      metalness: 0.85,
    });

    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xffaa44,
      roughness: 0.3,
      metalness: 0.9,
      emissive: 0xff6600,
      emissiveIntensity: 0.15,
    });

    // Glowing materials
    const rcsGasMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const engineFlameMat = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const ledOrangeMat = new THREE.MeshBasicMaterial({ 
      color: 0xff5722, 
      transparent: true,
      opacity: 1.0,
    });
    const ledCyanMat = new THREE.MeshBasicMaterial({ 
      color: 0x00f5ff,
      transparent: true,
      opacity: 1.0,
    });

    // ─────────────────────────────────────────────────────────────
    // 6. CENTRAL DOCKING HUB + RANGER SHUTTLE
    // ─────────────────────────────────────────────────────────────
    const centralHub = new THREE.Group();
    spinRingGroup.add(centralHub);

    // Hexagonal Core Hub
    const hubCoreGeo = new THREE.CylinderGeometry(1.15, 1.15, 2.6, 6);
    const hubCoreMesh = new THREE.Mesh(hubCoreGeo, darkChassisMat);
    hubCoreMesh.rotation.x = Math.PI / 2;
    hubCoreMesh.castShadow = true;
    hubCoreMesh.receiveShadow = true;
    centralHub.add(hubCoreMesh);

    // Gold trim ring on hub
    const hubTrimGeo = new THREE.TorusGeometry(1.22, 0.06, 12, 32);
    const hubTrimMesh = new THREE.Mesh(hubTrimGeo, goldTrimMat);
    centralHub.add(hubTrimMesh);

    // Docking ring collars
    [-1.32, 1.32].forEach((zPos) => {
      const ringGeo = new THREE.TorusGeometry(0.85, 0.1, 14, 36);
      const ringMesh = new THREE.Mesh(ringGeo, titaniumMat);
      ringMesh.position.set(0, 0, zPos);
      ringMesh.castShadow = true;
      centralHub.add(ringMesh);
    });

    // Hub glow ring (emissive)
    const hubGlowRingGeo = new THREE.TorusGeometry(1.3, 0.035, 8, 48);
    const hubGlowRingMat = new THREE.MeshBasicMaterial({
      color: 0xff5722,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const hubGlowRing = new THREE.Mesh(hubGlowRingGeo, hubGlowRingMat);
    centralHub.add(hubGlowRing);

    // RANGER SHUTTLE — 3D Lifting Body
    const rangerGroup = new THREE.Group();
    centralHub.add(rangerGroup);

    const rangerShape = new THREE.Shape();
    rangerShape.moveTo(0, 1.65);
    rangerShape.lineTo(1.0, -0.6);
    rangerShape.lineTo(0.8, -1.7);
    rangerShape.lineTo(-0.8, -1.7);
    rangerShape.lineTo(-1.0, -0.6);
    rangerShape.closePath();

    const rangerExtrude = { depth: 0.55, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.1, bevelSegments: 3 };
    const rangerHull = new THREE.Mesh(new THREE.ExtrudeGeometry(rangerShape, rangerExtrude), whiteHullMat);
    rangerHull.position.set(0, 0.18, -0.27);
    rangerHull.castShadow = true;
    rangerHull.receiveShadow = true;
    rangerGroup.add(rangerHull);

    // Heatshield belly
    const rangerBelly = new THREE.Mesh(new THREE.ExtrudeGeometry(rangerShape, rangerExtrude), darkChassisMat);
    rangerBelly.position.set(0, -0.18, -0.27);
    rangerBelly.scale.set(0.94, 0.94, 0.4);
    rangerGroup.add(rangerBelly);

    // Cockpit Windows (dark glass)
    const cockpitGeo = new THREE.PlaneGeometry(0.52, 0.58);
    const cockpitMat = new THREE.MeshBasicMaterial({ color: 0x0a1020, side: THREE.DoubleSide });
    const cockpitMesh = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpitMesh.rotation.x = -Math.PI / 2.5;
    cockpitMesh.position.set(0, 0.78, 0.24);
    rangerGroup.add(cockpitMesh);

    // Engine bells with glow
    [-0.4, 0.4].forEach((x) => {
      const bellMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.24, 0.45, 18), titaniumMat);
      bellMesh.rotation.x = Math.PI / 2;
      bellMesh.position.set(x, 0, -1.9);
      bellMesh.castShadow = true;
      rangerGroup.add(bellMesh);

      // Engine glow
      const glowMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending })
      );
      glowMesh.position.set(x, 0, -2.1);
      rangerGroup.add(glowMesh);
    });

    // ─────────────────────────────────────────────────────────────
    // 7. MAIN ACCESS SPOKE TUBES
    // ─────────────────────────────────────────────────────────────
    const spokeGroup = new THREE.Group();
    spinRingGroup.add(spokeGroup);

    const RING_RADIUS = 5.8;

    // 4 Primary access tubes (cross shape)
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((angle, idx) => {
      const isPrimary = idx % 2 === 0;
      const tubeLen = RING_RADIUS - 1.15;
      const radius = isPrimary ? 0.26 : 0.16;
      const tubeGeo = new THREE.CylinderGeometry(radius, radius + 0.02, tubeLen, 20);
      const tubeMesh = new THREE.Mesh(tubeGeo, isPrimary ? whiteHullMat : titaniumMat);
      const midDist = 1.15 + tubeLen / 2;
      tubeMesh.position.set(Math.cos(angle) * midDist, Math.sin(angle) * midDist, 0);
      tubeMesh.rotation.z = angle - Math.PI / 2;
      tubeMesh.castShadow = true;
      tubeMesh.receiveShadow = true;
      spokeGroup.add(tubeMesh);

      // Compression ring bands
      if (isPrimary) {
        [0.25, 0.5, 0.75].forEach((frac) => {
          const ringDist = 1.15 + tubeLen * frac;
          const bMesh = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.04, radius + 0.04, 0.14, 16), darkChassisMat);
          bMesh.position.set(Math.cos(angle) * ringDist, Math.sin(angle) * ringDist, 0);
          bMesh.rotation.z = angle - Math.PI / 2;
          bMesh.castShadow = true;
          spokeGroup.add(bMesh);
        });
      }
    });

    // ─────────────────────────────────────────────────────────────
    // 8. THE 12 HIGH-DETAIL MODULAR PODS
    // ─────────────────────────────────────────────────────────────
    const MODULE_COUNT = 12;
    const modules = [];

    const moduleNames = [
      'HAB-01 (Habitation Quarters)',
      'LAB-01 (Biochemistry Lab)',
      'LOG-01 (Logistics Pod A)',
      'ENG-01 (Main Drive Thruster)',
      'CRYO-01 (Hypersleep Pod A)',
      'HAB-02 (Command Habitat)',
      'LAB-02 (Astrophysics Lab)',
      'AIRLOCK-01 (Primary EVA Lock)',
      'LIFE-01 (Life Support Scrubbers)',
      'OBS-01 (Deep-Space Observatory)',
      'LOG-02 (Logistics Pod B)',
      'KEEL-01 (Final Perimeter Lock)',
    ];

    const podWidth = 1.55;
    const podHeight = 1.35;
    const podDepth = 2.0;

    for (let i = 0; i < MODULE_COUNT; i++) {
      const angle = (i / MODULE_COUNT) * Math.PI * 2;
      const targetX = Math.cos(angle) * RING_RADIUS;
      const targetY = Math.sin(angle) * RING_RADIUS;
      const targetZ = 0;

      const modGroup = new THREE.Group();
      spinRingGroup.add(modGroup);

      // 1. White insulated main body
      const bodyGeo = new THREE.BoxGeometry(podWidth, podHeight, podDepth);
      const bodyMesh = new THREE.Mesh(bodyGeo, whiteHullMat);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      modGroup.add(bodyMesh);

      // 2. Dark radiator panel top
      const radMesh = new THREE.Mesh(
        new THREE.BoxGeometry(podWidth * 0.94, 0.07, podDepth * 0.92),
        darkRadiatorMat
      );
      radMesh.position.set(0, podHeight / 2 + 0.035, 0);
      radMesh.castShadow = true;
      modGroup.add(radMesh);

      // Cooling grid ridges
      for (let r = -0.65; r <= 0.65; r += 0.26) {
        const ridge = new THREE.Mesh(
          new THREE.BoxGeometry(podWidth * 0.9, 0.04, 0.04),
          titaniumMat
        );
        ridge.position.set(0, podHeight / 2 + 0.06, r);
        modGroup.add(ridge);
      }

      // 3. Inner face solar panel
      const innerMesh = new THREE.Mesh(
        new THREE.BoxGeometry(podWidth * 0.92, 0.06, podDepth * 0.88),
        darkChassisMat
      );
      innerMesh.position.set(0, -podHeight / 2 - 0.03, 0);
      modGroup.add(innerMesh);

      // 4. Gold accent trim strip
      const goldStrip = new THREE.Mesh(
        new THREE.BoxGeometry(podWidth * 0.96, 0.03, 0.06),
        goldTrimMat
      );
      goldStrip.position.set(0, 0, podDepth / 2 + 0.03);
      modGroup.add(goldStrip);

      // 5. Docking joint collar
      const jointRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.4, 0.09, 14, 30),
        titaniumMat
      );
      jointRing.rotation.y = Math.PI / 2;
      jointRing.position.set(podWidth / 2 + 0.45, 0, 0);
      jointRing.castShadow = true;
      modGroup.add(jointRing);

      // Hydraulic docking pins
      [-0.2, 0.2].forEach((yOff) => {
        const pinMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8),
          whiteHullMat
        );
        pinMesh.rotation.z = Math.PI / 2;
        pinMesh.position.set(podWidth / 2 + 0.45, yOff, 0);
        modGroup.add(pinMesh);
      });

      // 6. Navigation LED strobe
      const ledColor = i % 3 === 0 ? ledOrangeMat : (i % 3 === 1 ? ledCyanMat : ledOrangeMat);
      const ledMesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 14), ledColor);
      ledMesh.position.set(0, podHeight / 2 + 0.14, podDepth / 2 - 0.2);
      modGroup.add(ledMesh);

      // LED glow sprite
      const ledGlowMat = new THREE.MeshBasicMaterial({
        color: i % 3 === 1 ? 0x00f5ff : 0xff5722,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
      });
      const ledGlow = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), ledGlowMat);
      ledGlow.position.copy(ledMesh.position);
      modGroup.add(ledGlow);

      // 7. RCS thruster plume (visible during docking approach)
      const rcsCone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.85, 14), rcsGasMat);
      rcsCone.rotation.z = -Math.PI / 2;
      rcsCone.position.set(-podWidth / 2 - 0.42, 0, 0);
      rcsCone.visible = false;
      modGroup.add(rcsCone);

      // 8. Engine exhaust flame (for engine modules)
      const exhaustFlame = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.6, 10), engineFlameMat);
      exhaustFlame.rotation.z = -Math.PI / 2;
      exhaustFlame.position.set(-podWidth / 2 - 0.6, 0, 0);
      exhaustFlame.visible = false;
      modGroup.add(exhaustFlame);

      // Tangential orientation on ring
      modGroup.rotation.z = angle - Math.PI / 2;

      // Spawn position — further out for dramatic fly-in
      const standbyRadius = RING_RADIUS + 6.0;
      const spawnX = Math.cos(angle) * standbyRadius;
      const spawnY = Math.sin(angle) * standbyRadius;
      const spawnZ = (i % 2 === 0 ? 4.5 : -4.5);

      modules.push({
        group: modGroup,
        targetPos: new THREE.Vector3(targetX, targetY, targetZ),
        spawnPos: new THREE.Vector3(spawnX, spawnY, spawnZ),
        jointRing,
        ledMesh,
        ledGlow,
        rcsCone,
        exhaustFlame,
        name: moduleNames[i],
        docked: false,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 9. EXHAUST PARTICLE SYSTEM (Docking thruster particles)
    // ─────────────────────────────────────────────────────────────
    const particleCount = 300;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = [];
    const particleLifetimes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = 0;
      particlePositions[i * 3 + 1] = 0;
      particlePositions[i * 3 + 2] = 0;
      particleVelocities.push(new THREE.Vector3(0, 0, 0));
      particleLifetimes[i] = 0;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x00f5ff,
      size: 0.12,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    let nextParticle = 0;

    const emitParticle = (worldPos) => {
      const idx = nextParticle % particleCount;
      particlePositions[idx * 3] = worldPos.x + (Math.random() - 0.5) * 0.3;
      particlePositions[idx * 3 + 1] = worldPos.y + (Math.random() - 0.5) * 0.3;
      particlePositions[idx * 3 + 2] = worldPos.z + (Math.random() - 0.5) * 0.3;
      particleVelocities[idx].set(
        (Math.random() - 0.5) * 0.08,
        (Math.random() - 0.5) * 0.08,
        (Math.random() - 0.5) * 0.08
      );
      particleLifetimes[idx] = 1.0;
      nextParticle++;
    };

    // ─────────────────────────────────────────────────────────────
    // 10. ORBITAL RING GUIDE (subtle wireframe)
    // ─────────────────────────────────────────────────────────────
    const orbitRingGeo = new THREE.TorusGeometry(RING_RADIUS, 0.02, 8, 128);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0xff5722,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
    });
    const orbitRingMesh = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    spinRingGroup.add(orbitRingMesh);

    // ─────────────────────────────────────────────────────────────
    // 11. INTERACTIVE DRAG ORBIT + PARALLAX
    // ─────────────────────────────────────────────────────────────
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let velX = 0;
    let velY = 0;

    let targetRotX = 0.45;
    let targetRotY = -0.35;
    let curRotX = 0.45;
    let curRotY = -0.35;

    let normMouseX = 0;
    let normMouseY = 0;

    let smoothScrollFrac = 0;
    let lastReportedCount = -1;

    const onPointerDown = (e) => {
      // Don't hijack button/input clicks
      if (e.target && (e.target.closest('button') || e.target.closest('input') || e.target.closest('a') || e.target.closest('.hero-content-col') || e.target.closest('.o-container'))) {
        return;
      }
      isDragging = true;
      prevX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      prevY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      velX = 0;
      velY = 0;
      container.style.cursor = 'grabbing';
    };

    const onPointerMove = (e) => {
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      normMouseX = (clientX / window.innerWidth - 0.5) * 2;
      normMouseY = (clientY / window.innerHeight - 0.5) * 2;

      if (!isDragging) return;

      const deltaX = clientX - prevX;
      const deltaY = clientY - prevY;

      velX = deltaX * 0.006;
      velY = deltaY * 0.006;

      targetRotY += velX;
      targetRotX += velY;

      prevX = clientX;
      prevY = clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
      container.style.cursor = 'grab';
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // ─────────────────────────────────────────────────────────────
    // 12. 60 FPS RENDER LOOP — ASSEMBLY + SPIN + PARTICLES
    // ─────────────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    const worldPosVec = new THREE.Vector3();

    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Scroll progress
      const scrollY = window.scrollY || 0;
      const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const actualScrollFrac = Math.min(1, Math.max(0, scrollY / maxScroll));

      const targetFrac = stateRef.current.manualProgress !== null
        ? stateRef.current.manualProgress
        : actualScrollFrac;

      smoothScrollFrac += (targetFrac - smoothScrollFrac) * 0.08;

      // Inertial drag
      if (!isDragging) {
        velX *= 0.92;
        velY *= 0.92;
        targetRotY += velX;
        targetRotX += velY;
      }

      curRotX += (targetRotX - curRotX) * 0.06;
      curRotY += (targetRotY - curRotY) * 0.06;

      // Subtle auto-rotation when idle
      if (!isDragging && Math.abs(velX) < 0.001 && Math.abs(velY) < 0.001) {
        targetRotY += 0.0008;
      }

      master3DRoot.rotation.x = curRotX - normMouseY * 0.08;
      master3DRoot.rotation.y = curRotY + normMouseX * 0.12;

      // 5.6 RPM spin
      if (stateRef.current.isSpinning) {
        spinRingGroup.rotation.z = elapsed * 0.35;
      }

      // Hub glow ring pulses
      hubGlowRing.scale.setScalar(1.0 + Math.sin(elapsed * 2.5) * 0.06);
      hubGlowRingMat.opacity = 0.5 + Math.sin(elapsed * 3) * 0.3;

      // Hub point light flicker
      hubGlow.intensity = 5 + Math.sin(elapsed * 4) * 2;

      // Starfield gentle drift
      starField.rotation.y = elapsed * 0.008;
      starField.rotation.x = elapsed * 0.003;

      // Spoke tubes deploy (0% → 14% scroll)
      const spokeProgress = Math.min(1, Math.max(0, smoothScrollFrac / 0.14));
      const spokeEase = 1 - Math.pow(1 - spokeProgress, 3);
      spokeGroup.scale.setScalar(Math.max(0.001, spokeEase));
      spokeGroup.visible = spokeProgress > 0.01;

      // Orbit ring fades in
      orbitRingMat.opacity = 0.1 + spokeEase * 0.2;

      // ── 3D MODULAR PODS DOCKING ──
      let dockedCount = 0;
      const startFrac = 0.1;
      const step = (0.95 - startFrac) / MODULE_COUNT;

      modules.forEach((mod, i) => {
        const threshold = startFrac + i * step;
        const podProgress = Math.min(1, Math.max(0, (smoothScrollFrac - threshold) / (step * 0.9)));

        // Cubic ease-out
        const easeT = 1 - Math.pow(1 - podProgress, 3);

        // Position: fly-in from standby orbit
        mod.group.position.lerpVectors(mod.spawnPos, mod.targetPos, easeT);
        mod.group.scale.setScalar(0.85 + easeT * 0.15);

        // Opacity fade-in approach
        const isRevealed = smoothScrollFrac >= (threshold - step * 0.8);
        mod.group.visible = isRevealed;

        // RCS thruster gas while moving
        const isMoving = podProgress > 0.02 && podProgress < 0.96;
        mod.rcsCone.visible = isMoving;
        mod.exhaustFlame.visible = isMoving && i % 3 === 0;

        if (isMoving) {
          // Flickering RCS flame
          const flicker = 1.0 + Math.sin(elapsed * 35 + i * 7) * 0.3;
          mod.rcsCone.scale.set(flicker, flicker * 1.2, flicker);

          if (mod.exhaustFlame.visible) {
            mod.exhaustFlame.scale.set(
              0.8 + Math.sin(elapsed * 25 + i) * 0.4,
              0.8 + Math.sin(elapsed * 30 + i) * 0.5,
              1
            );
          }

          // Emit particles from RCS cone world position
          if (Math.random() > 0.6) {
            mod.rcsCone.getWorldPosition(worldPosVec);
            emitParticle(worldPosVec);
          }
        }

        // Docking collar locks
        const isLocked = podProgress >= 0.96;
        mod.jointRing.scale.setScalar(isLocked ? 1.0 : Math.max(0.001, easeT));
        
        // LED blink when docked
        const ledBlink = isLocked ? (Math.sin(elapsed * 6 + i * 1.2) > 0) : true;
        mod.ledMesh.visible = ledBlink;
        mod.ledGlow.visible = ledBlink;
        mod.ledGlow.scale.setScalar(isLocked ? 1.0 + Math.sin(elapsed * 4 + i) * 0.3 : 0.5);

        if (isLocked) {
          dockedCount++;
          mod.docked = true;
        } else {
          mod.docked = false;
        }
      });

      // Update particles
      for (let i = 0; i < particleCount; i++) {
        if (particleLifetimes[i] > 0) {
          particlePositions[i * 3] += particleVelocities[i].x;
          particlePositions[i * 3 + 1] += particleVelocities[i].y;
          particlePositions[i * 3 + 2] += particleVelocities[i].z;
          particleLifetimes[i] -= delta * 0.8;
          if (particleLifetimes[i] <= 0) {
            particlePositions[i * 3] = 0;
            particlePositions[i * 3 + 1] = 0;
            particlePositions[i * 3 + 2] = -999;
          }
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Report assembly status to HUD
      if (dockedCount !== lastReportedCount) {
        lastReportedCount = dockedCount;
        if (onAssemblyUpdate) {
          const activeName = dockedCount === 0
            ? 'RANGER & CENTRAL DOCKING HUB'
            : (dockedCount === 12
              ? 'ENDURANCE 100% ASSEMBLED'
              : modules[dockedCount - 1]?.name || 'ASSEMBLING RING');

          onAssemblyUpdate({
            dockedCount,
            totalModules: MODULE_COUNT,
            percent: Math.round((dockedCount / MODULE_COUNT) * 100),
            currentPodName: activeName,
            isComplete: dockedCount === MODULE_COUNT,
          });
        }
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      window.removeEventListener('resize', onResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        cursor: 'grab',
      }}
    />
  );
}
