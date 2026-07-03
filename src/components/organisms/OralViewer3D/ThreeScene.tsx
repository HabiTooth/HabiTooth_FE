'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type RiskLevel = 'VERY_GOOD' | 'GOOD' | 'NORMAL' | 'CAUTION' | 'DANGER';

export interface ToothAnalysisResult {
  toothNumber: string;
  lesionType: string;
  areaRatio: number;
  riskLevel: RiskLevel;
}

interface ThreeSceneProps {
  analysisResults: ToothAnalysisResult[];
  onToothSelect?: (result: ToothAnalysisResult) => void;
  calibrationMode?: boolean;
}

interface TooltipState {
  x: number;
  y: number;
  result: ToothAnalysisResult;
}

const MODEL_PATH = '/habitooth_teeth.glb';

const RISK_COLOR_MAP: Record<RiskLevel, string> = {
  VERY_GOOD: '#4CAF82',
  GOOD: '#8BC98A',
  NORMAL: '#A0AEC0',
  CAUTION: '#F0B65A',
  DANGER: '#DC2626',
};

const RISK_LABEL_MAP: Record<RiskLevel, string> = {
  VERY_GOOD: '매우 양호',
  GOOD: '양호',
  NORMAL: '보통',
  CAUTION: '주의',
  DANGER: '위험',
};

const TOOTH_POSITIONS: Record<string, [number, number, number]> = {
  // 상악 (왼쪽 그룹)
  '18': [-1.101, 0.155, 0.557],
  '17': [-1.062, 0.153, 0.413],
  '16': [-1.052, 0.159, 0.336],
  '15': [-1.008, 0.163, 0.270],
  '14': [-1.011, 0.169, 0.163],
  '13': [-0.964, 0.151, 0.121],
  '12': [-0.923, 0.154, 0.082],
  '11': [-0.870, 0.131, 0.065],
  '21': [-0.818, 0.141, 0.060],
  '22': [-0.764, 0.165, 0.076],
  '23': [-0.709, 0.174, 0.123],
  '24': [-0.704, 0.164, 0.190],
  '25': [-0.674, 0.169, 0.256],
  '26': [-0.643, 0.167, 0.354],
  '27': [-0.614, 0.149, 0.431],
  '28': [-0.580, 0.151, 0.539],

  // 하악 (오른쪽 그룹)
  '48': [-0.014, 0.184, 0.229],
  '47': [0.025, 0.178, 0.330],
  '46': [0.030, 0.175, 0.430],
  '45': [0.052, 0.177, 0.518],
  '44': [0.098, 0.178, 0.590],
  '43': [0.114, 0.168, 0.647],
  '42': [0.164, 0.140, 0.692],
  '41': [0.218, 0.165, 0.713],
  '31': [0.271, 0.177, 0.713],
  '32': [0.331, 0.173, 0.693],
  '33': [0.391, 0.168, 0.644],
  '34': [0.391, 0.178, 0.585],
  '35': [0.450, 0.177, 0.515],
  '36': [0.458, 0.176, 0.430],
  '37': [0.466, 0.179, 0.324],
  '38': [0.504, 0.184, 0.233],
};

export default function ThreeScene({ analysisResults, onToothSelect, calibrationMode = false }: ThreeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const analysisResultsRef = useRef(analysisResults);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    analysisResultsRef.current = analysisResults;
  }, [analysisResults]);

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#EEF2FF');

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 12, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);

    const markersGroup = new THREE.Group();
    const markerMeshes: THREE.Mesh[] = [];
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let selectedTooth: string | null = null;
    let modelRoot: THREE.Object3D | null = null;
    let calibMarker: THREE.Mesh | null = null;
    let modelInfo: { center: THREE.Vector3; scale: number } | null = null;

    function createMarkerMaterial(color: string, emissiveIntensity: number) {
      return new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity,
        transparent: true,
        opacity: 0.75,
      });
    }

    function localToWorld(local: THREE.Vector3, center: THREE.Vector3, scale: number) {
      return local.clone().sub(center).multiplyScalar(scale);
    }
    function worldToLocal(world: THREE.Vector3, center: THREE.Vector3, scale: number) {
      return world.clone().divideScalar(scale).add(center);
    }

    const loader = new GLTFLoader();
    loader.load(
      MODEL_PATH,
      (gltf) => {
        const model = gltf.scene;
        modelRoot = model;

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 10 / maxDim;

        model.scale.setScalar(scale);
        model.position.copy(center).multiplyScalar(-scale);
        scene.add(model);

        modelInfo = { center, scale };

        const results = analysisResultsRef.current;

        if (!calibrationMode) {
          results.forEach((result) => {
            const pos = TOOTH_POSITIONS[result.toothNumber];
            if (!pos) {
              console.warn(`TOOTH_POSITIONS에 ${result.toothNumber} 없음`);
              return;
            }

            const local = new THREE.Vector3(pos[0], pos[1], pos[2]);
            const world = localToWorld(local, center, scale);

            const markerGeom = new THREE.SphereGeometry(0.25, 16, 16);
            const markerMat = createMarkerMaterial(RISK_COLOR_MAP[result.riskLevel], 0.4);
            const marker = new THREE.Mesh(markerGeom, markerMat);
            marker.position.copy(world);
            marker.userData.toothResult = result;

            markersGroup.add(marker);
            markerMeshes.push(marker);
          });
        }

        scene.add(markersGroup);
      },
      undefined,
      (error) => console.error('GLB 로딩 실패:', error)
    );

    function updatePointer(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function getIntersectedMarker(): THREE.Mesh | null {
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(markerMeshes, false);
      return intersects.length > 0 ? (intersects[0].object as THREE.Mesh) : null;
    }

    function handlePointerMove(event: PointerEvent) {
      updatePointer(event);
      const hit = getIntersectedMarker();
      if (hit) {
        const result = hit.userData.toothResult as ToothAnalysisResult;
        const rect = renderer.domElement.getBoundingClientRect();
        setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top, result });
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setTooltip(null);
        renderer.domElement.style.cursor = calibrationMode ? 'crosshair' : 'auto';
      }
    }

    function handleClick(event: PointerEvent) {
      updatePointer(event);

      if (calibrationMode) {
        if (!modelRoot || !modelInfo) return;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObject(modelRoot, true);
        if (hits.length === 0) return;

        const local = worldToLocal(hits[0].point, modelInfo.center, modelInfo.scale);
        const toothNumber = window.prompt('클릭한 위치의 FDI 치아 번호를 입력하세요 (예: 16)');
        if (!toothNumber) return;

        const line = `  '${toothNumber}': [${local.x.toFixed(3)}, ${local.y.toFixed(3)}, ${local.z.toFixed(3)}],`;
        console.log(line);
        navigator.clipboard?.writeText(line).catch(() => {});

        if (calibMarker) scene.remove(calibMarker);
        const geom = new THREE.SphereGeometry(0.15, 12, 12);
        const mat = new THREE.MeshStandardMaterial({ color: '#FFD400', emissive: '#FFD400', emissiveIntensity: 0.6 });
        calibMarker = new THREE.Mesh(geom, mat);
        calibMarker.position.copy(hits[0].point);
        scene.add(calibMarker);
        return;
      }

      const hit = getIntersectedMarker();
      if (!hit) return;
      const result = hit.userData.toothResult as ToothAnalysisResult;
      selectedTooth = result.toothNumber;
      markerMeshes.forEach((m) => {
        const mat = m.material as THREE.MeshStandardMaterial;
        const r = m.userData.toothResult as ToothAnalysisResult;
        mat.emissiveIntensity = r.toothNumber === selectedTooth ? 0.9 : 0.4;
      });
      onToothSelect?.(result);
    }

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      controls.dispose();
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      markerMeshes.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      if (calibMarker) {
        calibMarker.geometry.dispose();
        (calibMarker.material as THREE.Material).dispose();
      }
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [onToothSelect, calibrationMode]);

  return (
    <div className="relative w-full h-[400px]">
      <div ref={mountRef} className="w-full h-full" />
      {calibrationMode && (
        <div className="pointer-events-none absolute top-4 left-4 z-10 rounded-lg bg-black/70 px-3 py-2 text-xs text-white">
          캘리브레이션 모드: 치아 클릭 → 번호 입력 → 좌표가 콘솔/클립보드에 복사됩니다.
        </div>
      )}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
          <p className="font-semibold text-gray-800">{tooltip.result.toothNumber}번 치아</p>
          <p className="text-gray-600">{RISK_LABEL_MAP[tooltip.result.riskLevel]}</p>
          <p className="text-gray-500">{tooltip.result.lesionType} · {Math.round(tooltip.result.areaRatio * 100)}%</p>
        </div>
      )}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 rounded-xl bg-white/85 px-3 py-2 backdrop-blur-sm">
        {(Object.keys(RISK_COLOR_MAP) as RiskLevel[]).map((level) => (
          <div key={level} className="flex items-center gap-1.5 text-xs text-gray-700">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RISK_COLOR_MAP[level] }} />
            {RISK_LABEL_MAP[level]}
          </div>
        ))}
      </div>
    </div>
  );
}