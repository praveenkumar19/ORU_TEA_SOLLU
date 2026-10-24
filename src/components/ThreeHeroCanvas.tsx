import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RotateCcw, Eye, ChevronDown, ChevronUp, Sparkles, Wind } from 'lucide-react';

interface ThreeHeroCanvasProps {
  onExploreMenu: () => void;
  onOrderWhatsApp?: () => void;
}

export type TeaBlendType = 'classic' | 'masala' | 'ginger' | 'black';

interface BlendConfig {
  name: string;
  liquidColor: number;
  liquidOpacity: number;
  transmission: number;
  attenuationColor: number;
  foamColor: string;
  steamColor: number;
  description: string;
}

const BLEND_CONFIGS: Record<TeaBlendType, BlendConfig> = {
  classic: {
    name: 'Classic Milk Tea',
    liquidColor: 0xd68940, // Rich warm milky caramel
    liquidOpacity: 0.95,
    transmission: 0.44,
    attenuationColor: 0xba6a22,
    foamColor: '#F5DEB3',
    steamColor: 0xfff5ea,
    description: 'Fresh full-cream boiled milk with aromatic CTC dust.',
  },
  masala: {
    name: 'Masala Spiced Chai',
    liquidColor: 0xb55a20, // Deep spiced rust amber
    liquidOpacity: 0.96,
    transmission: 0.38,
    attenuationColor: 0x8f3c10,
    foamColor: '#E6C299',
    steamColor: 0xffedd8,
    description: 'Slow-simmered cinnamon, cloves, pepper & cardamom.',
  },
  ginger: {
    name: 'Ginger (Inji) Tea',
    liquidColor: 0xe09b38, // Golden fiery warmth
    liquidOpacity: 0.93,
    transmission: 0.48,
    attenuationColor: 0xc8751e,
    foamColor: '#F7E2BE',
    steamColor: 0xfff8ee,
    description: 'Crushed native ginger with soothing throat warmth.',
  },
  black: {
    name: 'Sulemani Black Tea',
    liquidColor: 0x8a2c14, // Crystal clear ruby amber
    liquidOpacity: 0.85,
    transmission: 0.78,
    attenuationColor: 0x621908,
    foamColor: '#C87042',
    steamColor: 0xffe2d0,
    description: 'Light steeped black tea with lemon & mint notes.',
  },
};

export const ThreeHeroCanvas: React.FC<ThreeHeroCanvasProps> = ({
  onExploreMenu,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedBlend, setSelectedBlend] = useState<TeaBlendType>('classic');
  const [steamIntensity, setSteamIntensity] = useState<'normal' | 'high' | 'off'>('normal');
  const [isSwirling, setIsSwirling] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<'hero' | 'top' | 'close'>('hero');

  // Internal mutable state for smooth animation loop
  const stateRef = useRef({
    pointerX: 0,
    pointerY: 0,
    targetRotX: 0.12,
    targetRotY: 0,
    currentRotX: 0.12,
    currentRotY: 0,
    swirlVelocity: 0,
    blend: selectedBlend,
    steamMode: steamIntensity,
    camPreset: cameraPreset,
  });

  // Sync stateRef with React state
  useEffect(() => {
    stateRef.current.blend = selectedBlend;
    stateRef.current.steamMode = steamIntensity;
    stateRef.current.camPreset = cameraPreset;
  }, [selectedBlend, steamIntensity, cameraPreset]);

  // Gentle, natural swirl trigger
  const triggerSwirl = () => {
    stateRef.current.swirlVelocity = 2.4;
    setIsSwirling(true);
    setTimeout(() => setIsSwirling(false), 2200);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Software WebGL Guard
    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 2. Scene & Camera Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x151311);
    scene.fog = new THREE.FogExp2(0x151311, 0.05);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.25, 4.8);

    // 3. High-Fidelity Renderer Configuration
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 4. Studio Environment via PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Cinematic Warm Amber Lighting Rig
    // Warm Key Light (amber glow of chai stove)
    const keyLight = new THREE.DirectionalLight(0xffdfb8, 2.8);
    keyLight.position.set(3.2, 4.2, 3.2);
    keyLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0004;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    // Soft Fill Light with warm tea kadai tones
    const fillLight = new THREE.HemisphereLight(0x4a372c, 0x151311, 1.3);
    scene.add(fillLight);

    // Golden Honey Rim/Back Light for crisp glass highlights & translucent steam glow
    const rimLight = new THREE.DirectionalLight(0xffa44a, 4.2);
    rimLight.position.set(-2.8, 3.2, -2.8);
    scene.add(rimLight);

    // Warm Under-Glow Point Light directly beneath Davarah plate
    const underGlow = new THREE.PointLight(0xff8a33, 2.2, 4.5);
    underGlow.position.set(0, 0.15, 0.4);
    scene.add(underGlow);

    // 6. Root Chai Rig (The 3D Subject)
    const chaiRig = new THREE.Group();
    scene.add(chaiRig);

    // Glass group (contains glass, liquid, foam, steam)
    const glassGroup = new THREE.Group();
    chaiRig.add(glassGroup);

    // --- Part A: Authentic Tamil "Cutting Chai" Faceted Glass ---
    // Refined MeshPhysicalMaterial with high transmission, clearcoat & realistic IOR
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: isSoftwareGl ? 0 : 0.95,
      opacity: isSoftwareGl ? 0.35 : 1,
      transparent: true,
      roughness: 0.035,
      metalness: 0.02,
      ior: 1.52, // Crown glass
      thickness: 1.35,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      attenuationColor: new THREE.Color(0xfffaf0),
      attenuationDistance: 2.2,
      depthWrite: false,
    });

    // Outer fluted glass body (traditional 12-faceted taper)
    const glassGeo = new THREE.CylinderGeometry(0.82, 0.64, 2.15, 12, 1, false);
    const glassMesh = new THREE.Mesh(glassGeo, glassMaterial);
    glassMesh.renderOrder = 10;
    glassMesh.position.y = 1.07;
    glassMesh.castShadow = !isSoftwareGl;
    glassGroup.add(glassMesh);

    // Thick sturdy glass bottom base
    const baseGeo = new THREE.CylinderGeometry(0.64, 0.61, 0.3, 12);
    const baseMesh = new THREE.Mesh(baseGeo, glassMaterial);
    baseMesh.renderOrder = 10;
    baseMesh.position.y = 0.15;
    glassGroup.add(baseMesh);

    // Smooth rounded glass rim ring on top
    const rimGeo = new THREE.TorusGeometry(0.81, 0.036, 16, 48);
    rimGeo.rotateX(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, glassMaterial);
    rimMesh.renderOrder = 11;
    rimMesh.position.y = 2.14;
    glassGroup.add(rimMesh);

    // --- Part B: Piping Hot Chai Liquid ---
    const initialConfig = BLEND_CONFIGS[selectedBlend];
    const teaLiquidMat = new THREE.MeshPhysicalMaterial({
      color: initialConfig.liquidColor,
      roughness: 0.12,
      metalness: 0.02,
      transmission: isSoftwareGl ? 0 : initialConfig.transmission,
      opacity: initialConfig.liquidOpacity,
      transparent: true,
      ior: 1.34,
      attenuationColor: new THREE.Color(initialConfig.attenuationColor),
      attenuationDistance: 0.85,
      depthWrite: true,
    });

    // Tea volume inside the glass
    const liquidGeo = new THREE.CylinderGeometry(0.76, 0.60, 1.62, 32);
    const liquidMesh = new THREE.Mesh(liquidGeo, teaLiquidMat);
    liquidMesh.renderOrder = 2;
    liquidMesh.position.y = 0.99;
    glassGroup.add(liquidMesh);

    // --- Dynamic Tea Liquid Surface with Micro Waves & Meter Chai Froth ---
    const foamCanvas = document.createElement('canvas');
    foamCanvas.width = 512;
    foamCanvas.height = 512;
    const fctx = foamCanvas.getContext('2d')!;

    // Draw rich, authentic "Meter Chai" aerated froth
    const drawFoamTexture = (cremaColor: string) => {
      fctx.clearRect(0, 0, 512, 512);

      // Creamy base
      const grad = fctx.createRadialGradient(256, 256, 30, 256, 256, 254);
      grad.addColorStop(0, cremaColor);
      grad.addColorStop(0.35, '#E5B177');
      grad.addColorStop(0.75, '#B76E32');
      grad.addColorStop(1, '#7C3A14');
      fctx.fillStyle = grad;
      fctx.beginPath();
      fctx.arc(256, 256, 254, 0, Math.PI * 2);
      fctx.fill();

      // Delicate micro-bubbles clustered naturally near the rim
      fctx.fillStyle = 'rgba(255, 248, 238, 0.72)';
      for (let i = 0; i < 110; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 90 + Math.random() * 155;
        const x = 256 + Math.cos(angle) * radius;
        const y = 256 + Math.sin(angle) * radius;
        const r = 1.5 + Math.random() * 4.2;
        fctx.beginPath();
        fctx.arc(x, y, r, 0, Math.PI * 2);
        fctx.fill();
      }

      // Subtle warm spice flecks (cardamom / cinnamon dust)
      fctx.fillStyle = 'rgba(74, 38, 16, 0.5)';
      for (let i = 0; i < 45; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 30 + Math.random() * 180;
        const x = 256 + Math.cos(angle) * radius;
        const y = 256 + Math.sin(angle) * radius;
        fctx.beginPath();
        fctx.arc(x, y, 1.2, 0, Math.PI * 2);
        fctx.fill();
      }
    };

    drawFoamTexture(initialConfig.foamColor);

    const foamTexture = new THREE.CanvasTexture(foamCanvas);
    foamTexture.colorSpace = THREE.SRGBColorSpace;
    foamTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

    const foamMat = new THREE.MeshStandardMaterial({
      map: foamTexture,
      roughness: 0.28,
      metalness: 0.04,
      transparent: true,
      opacity: 0.98,
    });

    // Subdivided circle surface to allow subtle, natural wave ripples
    const foamGeo = new THREE.CircleGeometry(0.75, 48, 8);
    foamGeo.rotateX(-Math.PI / 2);
    // Cache original vertex positions for fluid perturbation
    const foamPosAttr = foamGeo.attributes.position;
    const originalFoamPositions = new Float32Array(foamPosAttr.array.length);
    originalFoamPositions.set(foamPosAttr.array);

    const foamMesh = new THREE.Mesh(foamGeo, foamMat);
    foamMesh.renderOrder = 3;
    foamMesh.position.y = 1.8;
    glassGroup.add(foamMesh);

    // --- Part C: Stainless Steel Tea Davarah (Saucer Plate) ---
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      roughness: 0.16,
      metalness: 0.94,
    });
    const plateGeo = new THREE.CylinderGeometry(1.5, 1.25, 0.12, 48);
    const plateMesh = new THREE.Mesh(plateGeo, steelMat);
    plateMesh.position.y = -0.06;
    plateMesh.receiveShadow = !isSoftwareGl;
    glassGroup.add(plateMesh);

    const plateLipGeo = new THREE.TorusGeometry(1.48, 0.042, 16, 64);
    plateLipGeo.rotateX(Math.PI / 2);
    const plateLipMesh = new THREE.Mesh(plateLipGeo, steelMat);
    plateLipMesh.position.y = 0.02;
    glassGroup.add(plateLipMesh);

    // --- Part D: Warm Teak Wood Tea Kadai Counter Surface ---
    const counterGeo = new THREE.CylinderGeometry(4.2, 4.2, 0.25, 64);
    const woodCanvas = document.createElement('canvas');
    woodCanvas.width = 512;
    woodCanvas.height = 512;
    const wctx = woodCanvas.getContext('2d')!;
    wctx.fillStyle = '#22130c';
    wctx.fillRect(0, 0, 512, 512);
    wctx.strokeStyle = '#381f14';
    wctx.lineWidth = 3;
    for (let r = 20; r < 500; r += 16) {
      wctx.beginPath();
      wctx.arc(256, 256, r + Math.sin(r * 0.1) * 8, 0, Math.PI * 2);
      wctx.stroke();
    }
    const woodTexture = new THREE.CanvasTexture(woodCanvas);
    woodTexture.colorSpace = THREE.SRGBColorSpace;
    woodTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

    const woodMat = new THREE.MeshStandardMaterial({
      map: woodTexture,
      color: 0x3d2317,
      roughness: 0.78,
      metalness: 0.08,
    });
    const counterMesh = new THREE.Mesh(counterGeo, woodMat);
    counterMesh.position.y = -0.22;
    counterMesh.receiveShadow = !isSoftwareGl;
    chaiRig.add(counterMesh);

    // Soft Contact Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(3.6, 3.6);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x070403,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = -0.09;
    chaiRig.add(shadowMesh);

    // --- Part E: Realistic Elegant Hot Tea Steam (Curling, Translucent, Continuous) ---
    // Custom Shader with continuous smooth looping, natural curl turbulence, and bell-curve fading
    const steamCount = isSoftwareGl ? 30 : 64;
    const steamGeo = new THREE.BufferGeometry();
    const steamPositions = new Float32Array(steamCount * 3);
    const steamProgress = new Float32Array(steamCount);
    const steamSeeds = new Float32Array(steamCount);
    const steamDrifts = new Float32Array(steamCount * 3);
    const steamScales = new Float32Array(steamCount);

    for (let i = 0; i < steamCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.38;
      steamPositions[i * 3 + 0] = Math.cos(angle) * radius;
      steamPositions[i * 3 + 1] = 1.82;
      steamPositions[i * 3 + 2] = Math.sin(angle) * radius;

      // Stagger initial progress so steam is already seamlessly flowing
      steamProgress[i] = Math.random();
      steamSeeds[i] = Math.random() * 100;
      steamScales[i] = 0.55 + Math.random() * 0.45;

      steamDrifts[i * 3 + 0] = (Math.random() - 0.5) * 0.18;
      steamDrifts[i * 3 + 1] = 0.28 + Math.random() * 0.18; // Upward speed
      steamDrifts[i * 3 + 2] = (Math.random() - 0.5) * 0.18;
    }

    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));
    steamGeo.setAttribute('aProgress', new THREE.BufferAttribute(steamProgress, 1));
    steamGeo.setAttribute('aSeed', new THREE.BufferAttribute(steamSeeds, 1));
    steamGeo.setAttribute('aScale', new THREE.BufferAttribute(steamScales, 1));
    steamGeo.setAttribute('aDrift', new THREE.BufferAttribute(steamDrifts, 3));

    const steamUniforms = {
      uTime: { value: 0 },
      uGlobalOpacity: { value: 0.38 },
      uColor: { value: new THREE.Color(0xfff5ea) },
      uSpeedMultiplier: { value: 1.0 },
    };

    const steamShaderMat = new THREE.ShaderMaterial({
      uniforms: steamUniforms,
      vertexShader: `
        uniform float uTime;
        uniform float uSpeedMultiplier;
        attribute float aProgress;
        attribute float aSeed;
        attribute float aScale;
        attribute vec3 aDrift;
        varying float vAlpha;

        void main() {
          // Continuous looping progress
          float p = fract(aProgress + uTime * aDrift.y * 0.18 * uSpeedMultiplier);

          // Height rises gracefully from 1.82 to 3.9
          vec3 pos = position;
          pos.y = 1.82 + p * 2.15;

          // Natural thermal curling and gentle expansion as warm vapor rises
          float curlFrequency = 3.8 + sin(aSeed) * 0.8;
          float curlX = sin(p * curlFrequency + aSeed + uTime * 0.6) * 0.15 * p;
          float curlZ = cos(p * (curlFrequency * 0.85) + aSeed * 1.4 + uTime * 0.5) * 0.15 * p;
          pos.x += curlX + aDrift.x * p * 0.5;
          pos.z += curlZ + aDrift.z * p * 0.5;

          // Delicate bell-curve opacity: starts at 0 at tea rim, peaks gently mid-way, fades into thin air
          float fadeIn = smoothstep(0.0, 0.22, p);
          float fadeOut = 1.0 - smoothstep(0.55, 0.98, p);
          vAlpha = fadeIn * fadeOut;

          // Particle expands naturally as vapor cools and diffuses
          float pointSize = aScale * (0.6 + 1.4 * p) * 140.0;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = pointSize * (1.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uGlobalOpacity;
        varying float vAlpha;

        void main() {
          // Perfectly smooth radial gaussian falloff
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          float radialAlpha = smoothstep(0.5, 0.04, dist);
          radialAlpha = pow(radialAlpha, 1.6);

          float finalAlpha = radialAlpha * vAlpha * uGlobalOpacity;
          gl_FragColor = vec4(uColor, finalAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const steamPoints = new THREE.Points(steamGeo, steamShaderMat);
    steamPoints.renderOrder = 20;
    glassGroup.add(steamPoints);

    // --- Part F: Drifting Ambient Tea Leaves ---
    const leavesGroup = new THREE.Group();
    chaiRig.add(leavesGroup);

    const leafGeo = new THREE.SphereGeometry(0.14, 8, 8);
    leafGeo.scale(1.8, 0.25, 0.6);
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x506b45,
      roughness: 0.65,
      metalness: 0.1,
    });

    const teaLeaves: { mesh: THREE.Mesh; seed: number; radius: number; speed: number; rotSpeed: number }[] = [];
    const leafCount = isSoftwareGl ? 4 : 8;
    for (let i = 0; i < leafCount; i++) {
      const lmesh = new THREE.Mesh(leafGeo, leafMat.clone());
      if (i % 2 === 0) {
        (lmesh.material as THREE.MeshStandardMaterial).color.setHex(0x3e2c1c);
      }
      lmesh.castShadow = !isSoftwareGl;
      const angle = (i / leafCount) * Math.PI * 2;
      const radius = 1.7 + Math.random() * 1.1;
      lmesh.position.set(Math.cos(angle) * radius, 0.6 + Math.random() * 1.8, Math.sin(angle) * radius);
      leavesGroup.add(lmesh);
      teaLeaves.push({
        mesh: lmesh,
        seed: Math.random() * 100,
        radius,
        speed: 0.0035 + Math.random() * 0.0045,
        rotSpeed: 0.008 + Math.random() * 0.012,
      });
    }

    // --- Part G: Warm Ambient Tea Dust Motes ---
    const moteCount = isSoftwareGl ? 16 : 45;
    const moteGeo = new THREE.BufferGeometry();
    const motePositions = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      motePositions[i * 3 + 0] = (Math.random() - 0.5) * 5.5;
      motePositions[i * 3 + 1] = Math.random() * 3.8;
      motePositions[i * 3 + 2] = (Math.random() - 0.5) * 5.5;
    }
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
    const moteMat = new THREE.PointsMaterial({
      color: 0xffd194,
      size: 0.032,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const motes = new THREE.Points(moteGeo, moteMat);
    scene.add(motes);

    // 7. Mouse pointer parallax with natural easing bounds
    const handlePointerMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      stateRef.current.pointerX = x;
      stateRef.current.pointerY = y;
      // Controlled, natural rotation targets
      stateRef.current.targetRotY = x * 0.35;
      stateRef.current.targetRotX = 0.12 + -y * 0.18;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Pre-warm shaders
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 8. Animation Render Loop (Optimized, pre-allocated vectors to eliminate GC stutter)
    let animId = 0;
    const clock = new THREE.Clock();

    // Reusable math objects
    const _targetCamPos = new THREE.Vector3();
    const _targetLookAt = new THREE.Vector3(0, 1.1, 0);
    const _targetLiquidColor = new THREE.Color();
    const _targetAttenuation = new THREE.Color();

    let previousBlend = selectedBlend;

    const tick = () => {
      // Clamp delta to prevent huge jumps on tab switch
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();
      const state = stateRef.current;

      // Camera preset transitions with natural damping
      if (state.camPreset === 'top') {
        _targetCamPos.set(0, 3.4, 2.5);
      } else if (state.camPreset === 'close') {
        _targetCamPos.set(0, 1.35, 3.2);
      } else {
        _targetCamPos.set(0, 1.25, 4.8);
      }

      camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, 3.5, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, 3.5, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, 3.5, delta);
      camera.lookAt(_targetLookAt);

      // Smooth floating motion: subtle breathing levitation and pitch/roll
      let levitateY = 0;
      let gentlePitch = 0;
      let gentleRoll = 0;

      if (!prefersReducedMotion) {
        levitateY = Math.sin(elapsed * 1.1) * 0.032 + Math.sin(elapsed * 0.55) * 0.012;
        gentlePitch = Math.sin(elapsed * 0.8) * 0.012;
        gentleRoll = Math.cos(elapsed * 0.65) * 0.010;
      }

      // Smooth damped pointer tilt
      state.currentRotX = THREE.MathUtils.damp(state.currentRotX, state.targetRotX, 2.8, delta);
      state.currentRotY = THREE.MathUtils.damp(state.currentRotY, state.targetRotY, 2.8, delta);

      chaiRig.position.y = levitateY;
      chaiRig.rotation.x = state.currentRotX + gentlePitch;
      chaiRig.rotation.y = state.currentRotY;
      chaiRig.rotation.z = gentleRoll;

      // Natural Liquid Surface Waves & Gentle Swirling Physics
      const swirl = state.swirlVelocity;
      if (swirl > 0.01) {
        foamMesh.rotation.y += swirl * delta * 1.2;
        liquidMesh.rotation.y += swirl * delta * 0.8;
        // Exponential fluid drag damping
        state.swirlVelocity = THREE.MathUtils.damp(state.swirlVelocity, 0, 0.95, delta);
      } else {
        // Very subtle idle fluid rotation
        foamMesh.rotation.y += delta * 0.03;
      }

      // Subtle dynamic fluid surface tension wave perturbation
      const posArray = foamPosAttr.array as Float32Array;
      const vertexCount = foamPosAttr.count;
      for (let i = 0; i < vertexCount; i++) {
        const ox = originalFoamPositions[i * 3 + 0];
        const oz = originalFoamPositions[i * 3 + 2];
        const dist = Math.sqrt(ox * ox + oz * oz);

        // Gentle fluid ripple
        const ripple = Math.sin(dist * 8.5 - elapsed * 2.5) * 0.006 * (1.0 - dist / 0.75);

        // Fluid centripetal vortex during swirl (center slightly depresses, edge slightly lifts)
        const vortex = swirl > 0.01 ? (swirl * 0.015) * (dist * 1.2 - 0.45) : 0;

        posArray[i * 3 + 1] = ripple + vortex;
      }
      foamPosAttr.needsUpdate = true;

      // Dynamic blend color transitions (smooth lerping)
      const targetConfig = BLEND_CONFIGS[state.blend];
      _targetLiquidColor.setHex(targetConfig.liquidColor);
      _targetAttenuation.setHex(targetConfig.attenuationColor);

      teaLiquidMat.color.lerp(_targetLiquidColor, delta * 3.5);
      teaLiquidMat.attenuationColor.lerp(_targetAttenuation, delta * 3.5);
      teaLiquidMat.opacity = THREE.MathUtils.damp(teaLiquidMat.opacity, targetConfig.liquidOpacity, 3.5, delta);
      teaLiquidMat.transmission = THREE.MathUtils.damp(
        teaLiquidMat.transmission,
        isSoftwareGl ? 0 : targetConfig.transmission,
        3.5,
        delta
      );

      // Update foam texture if blend changed
      if (previousBlend !== state.blend) {
        drawFoamTexture(targetConfig.foamColor);
        foamTexture.needsUpdate = true;
        previousBlend = state.blend;
      }

      // Hot Tea Steam Uniforms
      steamShaderMat.uniforms.uTime.value = elapsed;
      if (state.steamMode === 'off') {
        steamShaderMat.uniforms.uGlobalOpacity.value = THREE.MathUtils.damp(
          steamShaderMat.uniforms.uGlobalOpacity.value,
          0.0,
          4.5,
          delta
        );
      } else {
        const targetSteamOpacity = state.steamMode === 'high' ? 0.48 : 0.28;
        const targetSteamSpeed = state.steamMode === 'high' ? 1.45 : 1.0;
        steamShaderMat.uniforms.uGlobalOpacity.value = THREE.MathUtils.damp(
          steamShaderMat.uniforms.uGlobalOpacity.value,
          targetSteamOpacity,
          3.5,
          delta
        );
        steamShaderMat.uniforms.uSpeedMultiplier.value = THREE.MathUtils.damp(
          steamShaderMat.uniforms.uSpeedMultiplier.value,
          targetSteamSpeed,
          3.5,
          delta
        );
      }
      steamShaderMat.uniforms.uColor.value.setHex(targetConfig.steamColor);

      // Drifting ambient tea leaves
      if (!prefersReducedMotion) {
        teaLeaves.forEach((leaf, idx) => {
          const curAngle = elapsed * leaf.speed + idx * (Math.PI / 4);
          leaf.mesh.position.x = Math.cos(curAngle) * leaf.radius;
          leaf.mesh.position.z = Math.sin(curAngle) * leaf.radius;
          leaf.mesh.position.y = 0.8 + Math.sin(elapsed * 1.2 + leaf.seed) * 0.25;
          leaf.mesh.rotation.x += leaf.rotSpeed;
          leaf.mesh.rotation.y += leaf.rotSpeed * 0.7;
        });
      }

      // Render scene
      renderer.render(scene, camera);

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    // Comprehensive Resource Disposal on Unmount
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      glassGeo.dispose();
      baseGeo.dispose();
      rimGeo.dispose();
      glassMaterial.dispose();
      liquidGeo.dispose();
      teaLiquidMat.dispose();
      foamGeo.dispose();
      foamMat.dispose();
      foamTexture.dispose();
      plateGeo.dispose();
      plateLipGeo.dispose();
      steelMat.dispose();
      counterGeo.dispose();
      woodMat.dispose();
      woodTexture.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      steamGeo.dispose();
      steamShaderMat.dispose();
      leafGeo.dispose();
      leafMat.dispose();
      moteGeo.dispose();
      moteMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[640px] md:min-h-[720px] lg:min-h-[820px] overflow-hidden select-none">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* Subtle lighting vignette overlay to ensure text contrast */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#151311] via-transparent to-[#151311]/60 z-10" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#151311]/90 via-[#151311]/40 to-transparent z-10 lg:w-3/5" />

      {/* Semantic Hero Content Overlay (Text hierarchy with WCAG AA compliance) */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 pt-32 pb-24 md:pt-40 md:pb-28 flex flex-col justify-center min-h-[640px] md:min-h-[720px] lg:min-h-[820px] pointer-events-none">
        <div className="max-w-2xl pointer-events-auto">
          {/* Location Kicker */}
          <div className="inline-flex items-center gap-2 text-xs md:text-sm tracking-wide text-[#E78B45] font-medium mb-3">
            <span>📍 Ponmar, Chennai</span>
            <span aria-hidden="true">·</span>
            <span>Tamil Nadu</span>
            <span aria-hidden="true">·</span>
            <span>Freshly Brewed Every 15 Mins</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[#FFF3DF] leading-[1.08] mb-4 text-balance font-serif-display drop-shadow-md">
            ORU TEA SOLLU!
          </h1>

          {/* Supporting Headline */}
          <p className="text-xl md:text-2xl font-medium text-[#C98242] mb-4 tracking-tight">
            Good Tea. Great Talks. Unforgettable Vibes.
          </p>

          {/* Description */}
          <p className="text-base md:text-lg text-[#FFF3DF]/80 leading-relaxed max-w-xl mb-8">
            Your neighbourhood tea spot in Ponmar, Chennai. Fresh kadai chai, hot savoury snacks, and the perfect place to turn an ordinary break into a great moment.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={onExploreMenu}
              className="px-6 py-3.5 bg-[#C98242] hover:bg-[#E78B45] text-[#151311] font-semibold text-sm rounded-xl transition-all shadow-lg hover:shadow-[#C98242]/20 hover:-translate-y-0.5 whitespace-nowrap active:translate-y-0 cursor-pointer"
            >
              Explore Our Menu
            </button>
          </div>

          {/* Live Brew Note */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-6 text-xs text-[#FFF3DF]/70">
            <div>
              <span className="block text-[#C98242] font-semibold text-sm">₹15 – ₹30</span>
              <span>Friendly Pricing</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div>
              <span className="block text-[#C98242] font-semibold text-sm">6 AM – 10:30 PM</span>
              <span>Open 7 Days</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div>
              <span className="block text-[#C98242] font-semibold text-sm">Meter Chai</span>
              <span>Aerated Foam</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Glass Interactive Bottom Cinema Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-[940px] px-4 pointer-events-auto">
        {/* Toggle Collapse Bar */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setIsControlsOpen(!isControlsOpen)}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#24150F]/90 hover:bg-[#341e15] border border-[#C98242]/30 rounded-t-lg text-xs font-medium text-[#FFF3DF]/90 backdrop-blur-md transition-colors cursor-pointer"
            title="Toggle 3D View Controls"
          >
            {isControlsOpen ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[#C98242]" />
                <span>Hide 3D Studio Controls</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-[#C98242]" />
                <span>Customize 3D Cutting Chai</span>
              </>
            )}
          </button>
        </div>

        {/* Collapsible Controls Panel */}
        {isControlsOpen && (
          <div className="bg-[#24150F]/95 backdrop-blur-md border border-[#C98242]/30 rounded-2xl p-3 md:p-4 shadow-2xl transition-all">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Tea Blend Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[#C98242] font-semibold whitespace-nowrap flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Chai Blend:
                </span>
                <div className="flex items-center gap-1 bg-[#151311] p-1 rounded-lg border border-white/5">
                  {(Object.keys(BLEND_CONFIGS) as TeaBlendType[]).map((blendKey) => (
                    <button
                      key={blendKey}
                      onClick={() => setSelectedBlend(blendKey)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                        selectedBlend === blendKey
                          ? 'bg-[#C98242] text-[#151311] font-semibold shadow-sm'
                          : 'text-[#FFF3DF]/70 hover:text-white'
                      }`}
                    >
                      {BLEND_CONFIGS[blendKey].name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Steam Intensity */}
              <div className="flex items-center gap-2">
                <span className="text-[#C98242] font-semibold whitespace-nowrap flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5" />
                  Steam:
                </span>
                <div className="flex items-center gap-1 bg-[#151311] p-1 rounded-lg border border-white/5">
                  {(['normal', 'high', 'off'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSteamIntensity(mode)}
                      className={`px-2 py-1 rounded-md text-xs capitalize transition-all cursor-pointer ${
                        steamIntensity === mode
                          ? 'bg-[#C98242] text-[#151311] font-semibold'
                          : 'text-[#FFF3DF]/70 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Angle & Swirl Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerSwirl}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#C98242]/40 bg-[#151311] text-[#FFF3DF] font-medium hover:border-[#C98242] transition-colors whitespace-nowrap cursor-pointer ${
                    isSwirling ? 'text-[#C98242] border-[#C98242]' : ''
                  }`}
                  title="Swirl the cutting chai froth"
                >
                  <RotateCcw className={`w-3 h-3 ${isSwirling ? 'animate-spin' : ''}`} />
                  <span>Swirl Chai</span>
                </button>

                <div className="flex items-center gap-1 bg-[#151311] p-1 rounded-lg border border-white/5">
                  {(['hero', 'close', 'top'] as const).map((cam) => (
                    <button
                      key={cam}
                      onClick={() => setCameraPreset(cam)}
                      className={`px-2 py-1 rounded-md text-xs capitalize transition-all flex items-center gap-1 cursor-pointer ${
                        cameraPreset === cam
                          ? 'bg-[#506B45] text-white font-semibold'
                          : 'text-[#FFF3DF]/70 hover:text-white'
                      }`}
                    >
                      <Eye className="w-2.5 h-2.5" />
                      <span>{cam === 'hero' ? 'Front' : cam === 'close' ? 'Focus' : 'Top'}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Micro description of active blend */}
            <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-[#FFF3DF]/60">
              <span>{BLEND_CONFIGS[selectedBlend].description}</span>
              <span className="hidden sm:inline text-[#C98242]">Move mouse to rotate glass in 3D</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
