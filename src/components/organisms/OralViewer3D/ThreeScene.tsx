'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type RiskLevel = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

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

const MODEL_PATH = '/habitooth_FDI_number.glb';

const RISK_COLOR_MAP: Record<RiskLevel, string> = {
  VERY_LOW: '#4CAF82',
  LOW: '#8BC98A',
  MEDIUM: '#A0AEC0',
  HIGH: '#F0B65A',
  CRITICAL: '#DC2626',
};

const RISK_LABEL_MAP: Record<RiskLevel, string> = {
  VERY_LOW: '깨끗',
  LOW: '양호',
  MEDIUM: '보통',
  HIGH: '주의',
  CRITICAL: '진단 필요',
};

// GLB mesh 이름에서 FDI 번호 추출 (Tooth_11, Tooth-11, Tooth_11_Material_0 등 대응)
const FDI_NAME_PATTERN = /tooth[_\-\s]?(\d{2})/i;

function extractFdi(name: string): string | null {
  const m = name.match(FDI_NAME_PATTERN);
  return m ? m[1] : null;
}

export default function ThreeScene({
  analysisResults,
  onToothSelect,
  calibrationMode = false,
}: ThreeSceneProps) {
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

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 12, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);

    // FDI 번호 → 해당 치아의 mesh 목록 (한 치아가 여러 mesh로 쪼개진 경우 대비)
    const fdiToMeshes = new Map<string, THREE.Mesh[]>();
    // raycast 대상 (분석 결과가 있는 치아 mesh만 담김)
    const pickableMeshes: THREE.Mesh[] = [];
    // 색을 입히며 새로 만든 material (정리용)
    const createdMaterials: THREE.Material[] = [];
    // mesh별 원본 material (복원용)
    const originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let selectedTooth: string | null = null;
    let modelRoot: THREE.Object3D | null = null;

    function collectTeeth(model: THREE.Object3D) {
      model.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        console.log(`mesh: "${obj.name}" | parent: "${obj.parent?.name}"`);
        // mesh 자신의 이름 → 없으면 부모 이름에서 FDI 추출
        const fdi = extractFdi(obj.name) ?? extractFdi(obj.parent?.name ?? '');
        if (!fdi) return;

        obj.userData.fdi = fdi;
        originalMaterials.set(obj, obj.material);

        const list = fdiToMeshes.get(fdi) ?? [];
        list.push(obj);
        fdiToMeshes.set(fdi, list);
      });

      console.log(`[치아 매핑] ${fdiToMeshes.size}개 FDI 인식:`, [...fdiToMeshes.keys()].sort());
    }

    function applyAnalysisColors() {
      // 이전 색 초기화
      pickableMeshes.length = 0;
      originalMaterials.forEach((mat, mesh) => {
        mesh.material = mat;
        delete mesh.userData.toothResult;
      });
      createdMaterials.forEach((m) => m.dispose());
      createdMaterials.length = 0;

      analysisResultsRef.current.forEach((result) => {
        const meshes = fdiToMeshes.get(String(result.toothNumber));
        if (!meshes || meshes.length === 0) {
          console.warn(`[치아 매핑] GLB에 Tooth_${result.toothNumber} 없음`);
          return;
        }

        const color = RISK_COLOR_MAP[result.riskLevel];
        const mat = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.25,
          roughness: 0.45,
          metalness: 0.05,
        });
        createdMaterials.push(mat);

        meshes.forEach((mesh) => {
          mesh.material = mat;
          mesh.userData.toothResult = result;
          pickableMeshes.push(mesh);
        });
      });
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
        const scale = 10 / Math.max(size.x, size.y, size.z);

        model.scale.setScalar(scale);
        model.position.copy(center).multiplyScalar(-scale);
        scene.add(model);

        collectTeeth(model);
        if (!calibrationMode) applyAnalysisColors();
      },
      undefined,
      (error) => console.error('GLB 로딩 실패:', error)
    );

    function updatePointer(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function getIntersectedTooth(): THREE.Mesh | null {
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(pickableMeshes, false);
      return hits.length > 0 ? (hits[0].object as THREE.Mesh) : null;
    }

    function handlePointerMove(event: PointerEvent) {
      updatePointer(event);
      const hit = getIntersectedTooth();
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

      // 캘리브레이션 모드: 클릭한 치아의 FDI/mesh 이름 확인용
      if (calibrationMode) {
        if (!modelRoot) return;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObject(modelRoot, true);
        if (hits.length === 0) return;
        const obj = hits[0].object;
        const fdi = obj.userData.fdi ?? extractFdi(obj.name) ?? '(없음)';
        console.log(`클릭한 mesh: "${obj.name}" | FDI: ${fdi}`);
        navigator.clipboard?.writeText(String(fdi)).catch(() => {});
        return;
      }

      const hit = getIntersectedTooth();
      if (!hit) return;
      const result = hit.userData.toothResult as ToothAnalysisResult;
      selectedTooth = result.toothNumber;

      pickableMeshes.forEach((mesh) => {
        const r = mesh.userData.toothResult as ToothAnalysisResult | undefined;
        if (r && mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.emissiveIntensity = r.toothNumber === selectedTooth ? 0.65 : 0.25;
        }
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
      createdMaterials.forEach((m) => m.dispose());
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [onToothSelect, calibrationMode, analysisResults]);

  return (
    <div className="relative w-full h-[400px]">
      <div ref={mountRef} className="w-full h-full" />
      {calibrationMode && (
        <div className="pointer-events-none absolute top-4 left-4 z-10 rounded-lg bg-black/70 px-3 py-2 text-xs text-white">
          캘리브레이션 모드: 치아를 클릭하면 mesh 이름과 FDI 번호가 콘솔에 출력됩니다.
        </div>
      )}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
          <p className="font-semibold text-gray-800">{tooltip.result.toothNumber}번 치아</p>
          <p className="text-gray-600">{RISK_LABEL_MAP[tooltip.result.riskLevel]}</p>
          <p className="text-gray-500">
            {tooltip.result.lesionType} · {Math.round(tooltip.result.areaRatio)}%
          </p>
        </div>
      )}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 rounded-xl bg-white/85 px-3 py-2 backdrop-blur-sm">
        {(Object.keys(RISK_COLOR_MAP) as RiskLevel[]).map((level) => (
          <div key={level} className="flex items-center gap-1.5 text-xs text-gray-700">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: RISK_COLOR_MAP[level] }}
            />
            {RISK_LABEL_MAP[level]}
          </div>
        ))}
      </div>
    </div>
  );
}