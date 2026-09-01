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

// Y를 키우면 위에서 내려다보는 교합면 뷰, 줄이면 정면 뷰
const VIEW_DIR = new THREE.Vector3(0, 0.3, 1).normalize();
const FIT_MARGIN = 1.06;

// 상하악 벌어진 간격 중 좁힐 비율
const JAW_CLOSE_RATIO = 0.6;

// 이번 스캔에 안 잡힌 치아
const UNSCANNED_COLOR = '#C9D3E0';

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

/** 모델 원본이 위아래로 벌어져 있어 중앙선 기준으로 양쪽을 당긴다 */
function closeJaws(model: THREE.Object3D, ratio: number) {
  model.updateWorldMatrix(true, true);

  const meshes: THREE.Mesh[] = [];
  model.traverse((o) => {
    if (o instanceof THREE.Mesh) meshes.push(o);
  });
  if (meshes.length === 0) return;

  const boxes = new Map<THREE.Mesh, THREE.Box3>();
  const whole = new THREE.Box3();
  for (const mesh of meshes) {
    const box = new THREE.Box3().setFromObject(mesh);
    boxes.set(mesh, box);
    whole.union(box);
  }

  const midY = (whole.min.y + whole.max.y) / 2;
  const isUpper = (mesh: THREE.Mesh) => {
    const box = boxes.get(mesh)!;
    return (box.min.y + box.max.y) / 2 >= midY;
  };

  let upperFloor = Infinity;
  let lowerCeiling = -Infinity;
  for (const mesh of meshes) {
    const box = boxes.get(mesh)!;
    if (isUpper(mesh)) upperFloor = Math.min(upperFloor, box.min.y);
    else lowerCeiling = Math.max(lowerCeiling, box.max.y);
  }

  const gap = upperFloor - lowerCeiling;
  if (!Number.isFinite(gap) || gap <= 0) return;

  const shift = (gap * ratio) / 2;
  const parentScale = new THREE.Vector3();

  for (const mesh of meshes) {
    mesh.parent?.getWorldScale(parentScale);
    const scaleY = parentScale.y || 1;
    mesh.position.y += (isUpper(mesh) ? -shift : shift) / scaleY;
  }

  model.updateWorldMatrix(true, true);
}

export default function ThreeScene({
  analysisResults,
  onToothSelect,
  calibrationMode = false,
}: ThreeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const analysisResultsRef = useRef(analysisResults);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [unscannedCount, setUnscannedCount] = useState(0);

  useEffect(() => {
    analysisResultsRef.current = analysisResults;
  }, [analysisResults]);

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 모델이 다 들어오게 카메라 거리를 매번 다시 계산 (뷰 방향은 유지)
    const modelSphere = new THREE.Sphere(new THREE.Vector3(), 1);

    function fitCamera() {
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      const distance = (modelSphere.radius / Math.sin(Math.min(vFov, hFov) / 2)) * FIT_MARGIN;

      camera.position.copy(modelSphere.center).addScaledVector(VIEW_DIR, distance);
      camera.near = distance / 100;
      camera.far = distance * 10;
      camera.updateProjectionMatrix();
      controls.target.copy(modelSphere.center);
      controls.update();
    }

    function resize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      renderer.setSize(w, h);
      fitCamera();
    }

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
        if (calibrationMode) console.log(`mesh: "${obj.name}" | parent: "${obj.parent?.name}"`);
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

      const analyzed = new Set<string>();

      analysisResultsRef.current.forEach((result) => {
        const meshes = fdiToMeshes.get(String(result.toothNumber));
        if (!meshes || meshes.length === 0) {
          console.warn(`[치아 매핑] GLB에 Tooth_${result.toothNumber} 없음`);
          return;
        }
        analyzed.add(String(result.toothNumber));

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

      // 결과 없는 치아를 원본 색으로 두면 분석된 것처럼 보임
      const unscanned = new THREE.MeshStandardMaterial({
        color: UNSCANNED_COLOR,
        roughness: 0.8,
        metalness: 0,
        transparent: true,
        opacity: 0.55,
      });
      createdMaterials.push(unscanned);

      let missing = 0;
      fdiToMeshes.forEach((meshes, fdi) => {
        if (analyzed.has(fdi)) return;
        missing++;
        meshes.forEach((mesh) => {
          mesh.material = unscanned;
        });
      });

      setUnscannedCount(missing);
    }

    const loader = new GLTFLoader();
    loader.load(
      MODEL_PATH,
      (gltf) => {
        const model = gltf.scene;
        modelRoot = model;

        closeJaws(model, JAW_CLOSE_RATIO);

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const scale = 10 / Math.max(size.x, size.y, size.z);

        model.scale.setScalar(scale);
        model.position.copy(center).multiplyScalar(-scale);
        scene.add(model);

        new THREE.Box3().setFromObject(model).getBoundingSphere(modelSphere);
        resize();

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

    // 마운트 직후 컨테이너 높이가 0일 수 있어 window resize만으로는 부족
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    return () => {
      cancelAnimationFrame(animationId);
      controls.dispose();
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);
      observer.disconnect();
      createdMaterials.forEach((m) => m.dispose());
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [onToothSelect, calibrationMode, analysisResults]);

  return (
    <div className="relative w-full h-full">
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
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-x-2.5 gap-y-1 rounded-xl bg-white/85 px-3 py-2 backdrop-blur-sm">
        {(Object.keys(RISK_COLOR_MAP) as RiskLevel[]).map((level) => (
          <div key={level} className="flex items-center gap-1.5 text-[11px] text-gray-700">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: RISK_COLOR_MAP[level] }}
            />
            {RISK_LABEL_MAP[level]}
          </div>
        ))}
        {unscannedCount > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-700">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full opacity-60"
              style={{ backgroundColor: UNSCANNED_COLOR }}
            />
            미촬영
          </div>
        )}
      </div>

      {unscannedCount > 0 && (
        <div className="pointer-events-none absolute top-3 left-3 right-3 rounded-lg bg-white/85 px-2.5 py-1.5 backdrop-blur-sm">
          <p className="m-0 text-[11px] leading-snug text-gray-600">
            흐린 회색 치아 {unscannedCount}개는 이번 스캔에 안 잡혀서 결과가 없어요.
          </p>
        </div>
      )}
    </div>
  );
}