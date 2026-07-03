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
  '11': [0.10, -0.55, 0.85],
  '12': [0.22, -0.52, 0.85],
  '13': [0.34, -0.46, 0.85],
  '14': [0.44, -0.38, 0.85],
  '15': [0.52, -0.28, 0.85],
  '16': [0.58, -0.16, 0.85],
  '17': [0.60, -0.04, 0.85],
  '18': [0.60,  0.08, 0.85],
  '21': [-0.10, -0.55, 0.85],
  '22': [-0.22, -0.52, 0.85],
  '23': [-0.34, -0.46, 0.85],
  '24': [-0.44, -0.38, 0.85],
  '25': [-0.52, -0.28, 0.85],
  '26': [-0.58, -0.16, 0.85],
  '27': [-0.60, -0.04, 0.85],
  '28': [-0.60,  0.08, 0.85],
  '31': [-0.10, -0.52, 0.15],
  '32': [-0.20, -0.49, 0.15],
  '33': [-0.30, -0.43, 0.15],
  '34': [-0.40, -0.35, 0.15],
  '35': [-0.48, -0.25, 0.15],
  '36': [-0.54, -0.13, 0.15],
  '37': [-0.56, -0.01, 0.15],
  '38': [-0.56,  0.10, 0.15],
  '41': [0.10, -0.52, 0.15],
  '42': [0.20, -0.49, 0.15],
  '43': [0.30, -0.43, 0.15],
  '44': [0.40, -0.35, 0.15],
  '45': [0.48, -0.25, 0.15],
  '46': [0.54, -0.13, 0.15],
  '47': [0.56, -0.01, 0.15],
  '48': [0.56,  0.10, 0.15],
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
    camera.position.set(0, 0, 15);

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
        console.log('GLB 로드 성공, analysisResults:', analysisResultsRef.current);

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
        console.log('마커 생성 시작, results:', results);

        results.forEach((result) => {
          const pos = TOOTH_POSITIONS[result.toothNumber];
          if (!pos) {
            console.warn(`TOOTH_POSITIONS에 ${result.toothNumber} 없음`);
            return;
          }

          const local = new THREE.Vector3(pos[0], pos[1], pos[2]);
          const world = localToWorld(local, center, scale);
          console.log(`마커 ${result.toothNumber} world pos:`, world);

          const markerGeom = new THREE.SphereGeometry(0.25, 16, 16);
          const markerMat = createMarkerMaterial(RISK_COLOR_MAP[result.riskLevel], 0.4);
          const marker = new THREE.Mesh(markerGeom, markerMat);
          marker.position.copy(world);
          marker.userData.toothResult = result;

          markersGroup.add(marker);
          markerMeshes.push(marker);
        });

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