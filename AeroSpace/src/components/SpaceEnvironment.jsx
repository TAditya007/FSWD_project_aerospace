import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getTheme } from '../config/themes';

/**
 * Continuous Cinematic Space Mission Control Environment
 * - Fixed background (pointer-events: none)
 * - Earth with realistic atmospheric glow & cyber telemetry grid
 * - Multiple inclined orbital rings
 * - Orbiting satellites with trailing paths
 * - User's designated satellite target lock
 * - Telemetry laser comms pulses
 * - GPU-optimized & respects reduced motion
 */
export default function SpaceEnvironment({ userSatellite, themeId = 'deep-space' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const theme = getTheme(themeId);
    let animationFrameId;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ─────────────────────────────────────────────────────────────
    // 1. SCENE + CAMERA + RENDERER
    // ─────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020208, 0.008);

    const width = window.innerWidth;
    const height = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    // Angle looking slightly down at Earth on right-hand side
    camera.position.set(2, 4, 18);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // ─────────────────────────────────────────────────────────────
    // 2. LIGHTING
    // ─────────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x0a1128, 1.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffedd6, 3.2);
    sunLight.position.set(25, 15, 20);
    scene.add(sunLight);

    const earthRimLight = new THREE.DirectionalLight(theme.earthAtmosphere || 0x00f5ff, 2.4);
    earthRimLight.position.set(-20, -10, -15);
    scene.add(earthRimLight);

    // ─────────────────────────────────────────────────────────────
    // 3. EARTH & ATMOSPHERE
    // ─────────────────────────────────────────────────────────────
    const earthGroup = new THREE.Group();
    earthGroup.position.set(5.5, -2.5, -2); // Positioned gracefully in background
    scene.add(earthGroup);

    // Earth Sphere Core
    const earthRadius = 3.6;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 48, 48);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x071b35,
      roughness: 0.7,
      metalness: 0.2,
      emissive: 0x020a16,
      emissiveIntensity: 0.6
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // Earth Continents / Cyber Grid Wireframe Overlay
    const gridGeo = new THREE.SphereGeometry(earthRadius + 0.03, 36, 18);
    const gridMat = new THREE.MeshBasicMaterial({
      color: theme.earthAtmosphere || 0x00f5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.16
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    earthGroup.add(gridMesh);

    // Earth Atmosphere Glow Halo (Fresnel)
    const haloGeo = new THREE.SphereGeometry(earthRadius + 0.35, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: theme.earthAtmosphere || 0x00f5ff,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    earthGroup.add(haloMesh);

    // ─────────────────────────────────────────────────────────────
    // 4. STARFIELD & COSMIC TELEMETRY PARTICLES
    // ─────────────────────────────────────────────────────────────
    const starCount = 900;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 250;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 250;
      starPositions[i * 3 + 2] = -40 - Math.random() * 120;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xe2e8f0,
      size: 0.22,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // ─────────────────────────────────────────────────────────────
    // 5. ORBITAL RINGS & SATELLITES
    // ─────────────────────────────────────────────────────────────
    const orbits = [
      { radius: 5.2, inclination: 0.35, speed: 0.005, color: '#38bdf8', isUser: false },
      { radius: 6.8, inclination: -0.55, speed: 0.0035, color: '#ff5722', isUser: false },
      { radius: 8.4, inclination: 0.85, speed: 0.0022, color: '#a855f7', isUser: false },
      {
        radius: userSatellite?.orbit3D?.radius || 6.2,
        inclination: userSatellite?.orbit3D?.inclinationAngle || 0.45,
        speed: userSatellite?.orbit3D?.speed || 0.004,
        color: theme.accentColor || '#00f5ff',
        isUser: true
      }
    ];

    const satelliteMeshes = [];
    const orbitRingGroups = [];

    orbits.forEach((orb) => {
      const ringGroup = new THREE.Group();
      ringGroup.position.copy(earthGroup.position);
      ringGroup.rotation.x = orb.inclination;
      ringGroup.rotation.z = orb.inclination * 0.4;
      scene.add(ringGroup);
      orbitRingGroups.push(ringGroup);

      // Trajectory Ring Line
      const curve = new THREE.EllipseCurve(0, 0, orb.radius, orb.radius, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(80);
      const ringGeo = new THREE.BufferGeometry().setFromPoints(points);
      const ringMat = new THREE.LineBasicMaterial({
        color: orb.color,
        transparent: true,
        opacity: orb.isUser ? 0.65 : 0.25
      });
      const ringLine = new THREE.Line(ringGeo, ringMat);
      ringGroup.add(ringLine);

      // Satellite Model (Central Chassis + Solar Array Panels)
      const satGroup = new THREE.Group();
      
      // Satellite Body
      const bodyGeo = new THREE.BoxGeometry(orb.isUser ? 0.32 : 0.22, orb.isUser ? 0.24 : 0.16, orb.isUser ? 0.24 : 0.16);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        metalness: 0.85,
        roughness: 0.2,
        emissive: orb.isUser ? 0x00f5ff : 0x223344,
        emissiveIntensity: orb.isUser ? 0.6 : 0.2
      });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      satGroup.add(bodyMesh);

      // Solar Array Wings
      const solarGeo = new THREE.BoxGeometry(orb.isUser ? 0.65 : 0.45, 0.04, orb.isUser ? 0.2 : 0.14);
      const solarMat = new THREE.MeshStandardMaterial({
        color: 0x052e59,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x003366,
        emissiveIntensity: 0.4
      });
      const solarLeft = new THREE.Mesh(solarGeo, solarMat);
      solarLeft.position.x = orb.isUser ? 0.48 : 0.35;
      satGroup.add(solarLeft);

      const solarRight = new THREE.Mesh(solarGeo, solarMat);
      solarRight.position.x = orb.isUser ? -0.48 : -0.35;
      satGroup.add(solarRight);

      // User Satellite HUD Target Lock Indicator
      if (orb.isUser) {
        const lockGeo = new THREE.RingGeometry(0.55, 0.65, 24);
        const lockMat = new THREE.MeshBasicMaterial({
          color: theme.accentColor || 0x00f5ff,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide
        });
        const lockMesh = new THREE.Mesh(lockGeo, lockMat);
        satGroup.add(lockMesh);
      }

      ringGroup.add(satGroup);

      satelliteMeshes.push({
        group: satGroup,
        radius: orb.radius,
        speed: orb.speed,
        angle: Math.random() * Math.PI * 2,
        isUser: orb.isUser
      });
    });

    // ─────────────────────────────────────────────────────────────
    // 6. LASER TELEMETRY COMMS BEAM
    // ─────────────────────────────────────────────────────────────
    const laserMat = new THREE.LineBasicMaterial({
      color: theme.accentColor || 0x00f5ff,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ]);
    const laserLine = new THREE.Line(laserGeo, laserMat);
    scene.add(laserLine);

    // ─────────────────────────────────────────────────────────────
    // 7. ANIMATION LOOP
    // ─────────────────────────────────────────────────────────────
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        // Slow Earth rotation
        earthGroup.rotation.y += delta * 0.05;
        gridMesh.rotation.y -= delta * 0.02;

        // Orbit satellites
        satelliteMeshes.forEach(sat => {
          sat.angle += sat.speed;
          sat.group.position.x = Math.cos(sat.angle) * sat.radius;
          sat.group.position.y = Math.sin(sat.angle) * sat.radius;
          sat.group.rotation.z = sat.angle + Math.PI / 2;

          // If user satellite, dynamically connect laser pulse to Earth center
          if (sat.isUser) {
            const worldPos = new THREE.Vector3();
            sat.group.getWorldPosition(worldPos);
            
            const earthPos = new THREE.Vector3();
            earthGroup.getWorldPosition(earthPos);

            const positions = laserLine.geometry.attributes.position.array;
            positions[0] = worldPos.x;
            positions[1] = worldPos.y;
            positions[2] = worldPos.z;
            positions[3] = earthPos.x;
            positions[4] = earthPos.y;
            positions[5] = earthPos.z;
            laserLine.geometry.attributes.position.needsUpdate = true;
            
            laserMat.opacity = 0.25 + Math.sin(time * 4) * 0.2;
          }
        });

        // Gentle camera float
        camera.position.x = 2 + Math.sin(time * 0.2) * 0.4;
        camera.position.y = 4 + Math.cos(time * 0.15) * 0.3;
        camera.lookAt(1.5, 0, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    // ─────────────────────────────────────────────────────────────
    // 8. RESIZE LISTENER
    // ─────────────────────────────────────────────────────────────
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [themeId, userSatellite]);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
      aria-hidden="true"
    />
  );
}
