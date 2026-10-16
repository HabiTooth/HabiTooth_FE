'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LESION_LABEL, RISK_TAG } from '@/lib/lesionRisk';
import { RISK_MODEL_FILL } from '@/lib/riskColors';
import { isActiveLesion } from '@/lib/lesionState';
import { toothName } from '@/lib/dentition';
import type { LesionType } from '@/lib/api/common';
import type { SurfaceType } from '@/lib/api/report';
import { ORAL_MODEL_PATH, ORAL_VIEW_LIMITS, prepareOralModel } from './oralModel';
import {
  MARKER_COLOR,
  buildToothFrames,
  coverageMask,
  createMarkerMesh,
  lesionState,
  markerBasePositions,
  markerMaterial,
  updateMarker,
  type ToothLesion,
  type ToothLesionState,
} from './lesionMarkers';

export type RiskLevel = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ToothAnalysisResult {
  toothNumber: string;
  lesionType: string;
  areaRatio: number;
  riskLevel: RiskLevel;
}

export type MarkerVisibility = Record<LesionType, boolean>;
export type PoseName = 'front' | 'inside';

interface ThreeSceneProps {
  analysisResults: ToothAnalysisResult[];
  lesions?: ToothLesion[];
  missingTeeth?: number[];
  scannedTeeth?: number[];
  // 치아를 누르면 FDI, 빈 곳을 누르면 null
  onToothSelect?: (fdi: string | null) => void;
  // 바깥에서 고른 치아. 있으면 그 치아로 당겨 보고 나머지는 흐려진다
  selectedTooth?: string | null;
  calibrationMode?: boolean;
  // 범례·안내 띠 없이 모형만. 상단 히어로처럼 바깥에서 숫자를 보여줄 때
  minimal?: boolean;
  // 1보다 크면 모형을 더 크게 잡는다
  zoom?: number;
  // 바깥에서 마커 표시를 제어할 때. 없으면 자체 범례 토글을 쓴다
  visibleMarkers?: MarkerVisibility;
  // 처음 보여줄 포즈. inside면 위아래 턱을 펼친 교합면 뷰로 시작
  initialPose?: PoseName;
  // 고른 치아의 어느 면을 볼지. 바깥쪽이면 정면, 안쪽이면 펼친 포즈. 없으면 병변 위치로 정한다
  focusSurface?: SurfaceType | null;
  // 고른 치아가 없을 때도 마커를 보여줄지. 히어로는 끄고 치아를 고르면 그 치아만 켠다
  idleMarkers?: boolean;
  // FDI별 치아 색 덮어쓰기. 비교 슬라이더가 두 스캔의 색을 섞어 넘긴다
  toothColors?: Record<string, string>;
}

type ToothState = 'lesion' | 'clean' | 'unscanned';

interface ToothInfo {
  fdi: string;
  state: ToothState;
  lesion: ToothLesionState;
  // 색을 정하는 대표 결과
  result?: ToothAnalysisResult;
  // 같은 치아의 병변 전부. 치석이 먼저 온다
  results?: ToothAnalysisResult[];
}

interface TooltipState extends ToothInfo {
  x: number;
  y: number;
}

const MODEL_PATH = ORAL_MODEL_PATH;
// 기본값을 매 렌더 새 배열로 만들면 이펙트 의존성이 계속 바뀌어 무한 갱신에 빠진다
const NO_LESIONS: ToothLesion[] = [];
const NO_TEETH: number[] = [];
const LESION_TYPES: LesionType[] = ['CALCULUS', 'PLAQUE'];

function disposeModel(model: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) =>
      materials.add(material),
    );
  });
  materials.forEach((material) => {
    Object.values(material).forEach((value) => {
      if (value instanceof THREE.Texture) textures.add(value);
    });
    material.dispose();
  });
  textures.forEach((texture) => texture.dispose());
}

// Y를 키우면 위에서 내려다보는 교합면 뷰, 줄이면 정면 뷰
const VIEW_DIR = new THREE.Vector3(0, Math.sin(0.08), Math.cos(0.08));

// 드롭 섀도 스프라이트용 라디얼 그라데이션
function radialShadowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.7)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.25)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
const FIT_MARGIN = 1.06;
// 치아 하나로 당겨 볼 때 전체 거리 대비 비율
const FOCUS_DISTANCE = 0.34;
// 당겨 볼 때 치아가 화면 위쪽에 오도록 시선을 조금 아래로
const FOCUS_TARGET_DROP = 0.04;
// 전체 보기에서 모형을 살짝 위로 올려 바닥 그림자가 깔릴 자리를 남긴다
const IDLE_LIFT = 0.07;
// 전체 보기에서 휠로 당길 수 있는 한계(맞춤 거리 대비). 모형이 무대 높이를 꽉 채우는 정도
const IDLE_MIN_DISTANCE = 0.64;
// 당겨 볼 때는 옆에서도 볼 수 있게 좌우 회전 폭을 넓힌다
const FOCUS_AZIMUTH = (80 * Math.PI) / 180;
const FOCUS_DURATION = 550;
const POSE_DURATION = 650;
// 이 거리보다 움직이면 드래그라서 클릭으로 안 본다
const CLICK_SLOP = 6;

// 이번 스캔에 안 잡힌 치아. 깨끗(하늘색)과 섞이지 않게 파란기 뺀 중립 회색
const UNSCANNED_COLOR = '#C7C7CC';
const UNSCANNED_OPACITY = 0.6;
const DIM_OPACITY = 0.3;
// 당겨 볼 때 고른 치아는 흰색. 병변 마커 색이 치아 색과 섞이지 않게
const FOCUS_TOOTH_COLOR = '#F6F2EC';

// 레퍼런스 치아 재질에 관리 필요도 색만 얹은 것
const toothMaterial = (color: string) =>
  new THREE.MeshPhysicalMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.08,
    roughness: 0.3,
    metalness: 0,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    sheen: 0.3,
    sheenColor: 0xffffff,
    envMapIntensity: 0.9,
  });

const unscannedMaterial = () =>
  new THREE.MeshStandardMaterial({
    color: UNSCANNED_COLOR,
    emissive: UNSCANNED_COLOR,
    emissiveIntensity: 0,
    roughness: 0.9,
    metalness: 0,
    transparent: true,
    opacity: UNSCANNED_OPACITY,
  });

const labelOf = (fdi: string) => {
  const tooth = Number(fdi);
  return Number.isInteger(tooth) ? toothName(tooth) : `${fdi}번 치아`;
};

const lesionLabel = (lesionType: string) => LESION_LABEL[lesionType as LesionType] ?? lesionType;

const FDI_NAME_PATTERN = /tooth[_\-\s]?(\d{2})/i;

function extractFdi(name: string): string | null {
  const m = name.match(FDI_NAME_PATTERN);
  return m ? m[1] : null;
}

const RISK_ORDER: RiskLevel[] = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const beats = (next: ToothAnalysisResult, prev: ToothAnalysisResult) => {
  const gap = RISK_ORDER.indexOf(next.riskLevel) - RISK_ORDER.indexOf(prev.riskLevel);
  if (gap !== 0) return gap > 0;
  return next.lesionType === 'CALCULUS' && prev.lesionType !== 'CALCULUS';
};

const calculusFirst = (rows: ToothAnalysisResult[]) =>
  [...rows].sort(
    (a, b) => Number(b.lesionType === 'CALCULUS') - Number(a.lesionType === 'CALCULUS'),
  );

function groupByTooth(results: ToothAnalysisResult[]): Map<string, ToothAnalysisResult[]> {
  const byTooth = new Map<string, ToothAnalysisResult[]>();
  for (const result of results) {
    const list = byTooth.get(result.toothNumber) ?? [];
    list.push(result);
    byTooth.set(result.toothNumber, list);
  }
  return byTooth;
}

function groupLesions(lesions: ToothLesion[]): Map<string, ToothLesion[]> {
  const byTooth = new Map<string, ToothLesion[]>();
  for (const lesion of lesions) {
    const key = String(lesion.toothNumber);
    const list = byTooth.get(key) ?? [];
    list.push(lesion);
    byTooth.set(key, list);
  }
  return byTooth;
}

const worst = (rows: ToothAnalysisResult[]) =>
  rows.reduce<ToothAnalysisResult | undefined>(
    (kept, row) => (!kept || beats(row, kept) ? row : kept),
    undefined,
  );

const easeOut = (t: number) => 1 - (1 - t) ** 3;

export default function ThreeScene({
  analysisResults,
  lesions = NO_LESIONS,
  missingTeeth = NO_TEETH,
  scannedTeeth = NO_TEETH,
  onToothSelect,
  selectedTooth = null,
  calibrationMode = false,
  minimal = false,
  zoom = 1,
  visibleMarkers,
  initialPose = 'front',
  focusSurface = null,
  idleMarkers = true,
  toothColors,
}: ThreeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const analysisResultsRef = useRef(analysisResults);
  const lesionsRef = useRef(lesions);
  const missingRef = useRef(missingTeeth);
  const scannedRef = useRef(scannedTeeth);
  const onSelectRef = useRef(onToothSelect);
  const selectedRef = useRef<string | null>(selectedTooth);
  const focusSurfaceRef = useRef<SurfaceType | null>(focusSurface);
  const toothColorsRef = useRef(toothColors);
  const recolorRef = useRef<(() => void) | null>(null);
  const applyRef = useRef<(() => void) | null>(null);
  const visibilityRef = useRef<(() => void) | null>(null);
  const focusRef = useRef<(() => void) | null>(null);
  const poseRef = useRef<((inside: boolean) => void) | null>(null);
  const [inside, setInside] = useState(initialPose === 'inside');
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [show, setShow] = useState<MarkerVisibility>({ PLAQUE: true, CALCULUS: true });
  const showRef = useRef(visibleMarkers ?? show);
  const [counts, setCounts] = useState({ calculus: 0, plaque: 0, clean: 0, unscanned: 0 });

  useEffect(() => {
    analysisResultsRef.current = analysisResults;
    lesionsRef.current = lesions;
    missingRef.current = missingTeeth;
    scannedRef.current = scannedTeeth;
    onSelectRef.current = onToothSelect;
    if (!calibrationMode) applyRef.current?.();
  }, [analysisResults, lesions, missingTeeth, scannedTeeth, onToothSelect, calibrationMode]);

  const markerVisibility = visibleMarkers ?? show;
  useEffect(() => {
    showRef.current = markerVisibility;
    visibilityRef.current?.();
  }, [markerVisibility]);

  useEffect(() => {
    toothColorsRef.current = toothColors;
    recolorRef.current?.();
  }, [toothColors]);

  useEffect(() => {
    selectedRef.current = selectedTooth;
    focusSurfaceRef.current = focusSurface;
    // 누르기 직전에 떠 있던 툴팁이 상세 글자 위에 남지 않게
    setTooltip(null);
    focusRef.current?.();
  }, [selectedTooth, focusSurface]);

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    let disposed = false;
    let oralModel: ReturnType<typeof prepareOralModel> | null = null;
    // 버튼으로 고른 포즈. 치아를 골랐다 놓으면 여기로 돌아온다
    let userPose = initialPose === 'inside' ? 1 : 0;
    let pose = userPose;
    let poseAnimation: { from: number; to: number; start: number } | null = null;
    let cameraTransition: {
      start: number;
      fromPosition: THREE.Vector3;
      fromTarget: THREE.Vector3;
      toPosition: THREE.Vector3;
      toTarget: THREE.Vector3;
    } | null = null;
    // 포즈가 바뀌는 중이면 끝난 뒤에 카메라를 옮긴다
    let focusAfterPose = false;
    setLoaded(false);
    setLoadFailed(false);
    setInside(initialPose === 'inside');
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // 1.05면 잇몸이 떠 보여서 조금 낮춘다
    renderer.toneMappingExposure = 0.84;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // 클리어코트 반사용 환경맵. background는 안 깔아서 카드 배경은 그대로 비친다
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;
    pmrem.dispose();

    // 위에서만 비추면 교합면이 보이는 하악이 더 밝아진다. 반구광을 키우고 키 라이트는 정면 쪽으로
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe4dfd8, 1.2));

    // 모델이 최대 변 10 단위로 리스케일되므로 레퍼런스 방향을 그 비율로 키움
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(10, 16, 50);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.bias = -0.00005;
    keyLight.shadow.normalBias = 0.0004;
    // 기본 섀도 카메라(±5)는 10 단위 모델을 못 덮는다
    Object.assign(keyLight.shadow.camera, {
      left: -8,
      right: 8,
      top: 8,
      bottom: -8,
      near: 1,
      far: 200,
    });
    keyLight.shadow.camera.updateProjectionMatrix();
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf4f1ec, 0.7);
    fillLight.position.set(-12, -6, 30);
    scene.add(fillLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    Object.assign(controls, ORAL_VIEW_LIMITS);

    const modelSphere = new THREE.Sphere(new THREE.Vector3(), 1);
    // 모형 바닥에 깔리는 납작한 그림자. 스프라이트라 돌려도 바닥에 남는다
    const dropShadow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: radialShadowTexture(),
        color: 0x17213f,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    dropShadow.visible = false;
    scene.add(dropShadow);
    // 기준점 위로는 30%만. 아래로 길면 캔버스 끝에서 잘린다
    dropShadow.center.set(0.5, 0.6);
    // 포즈가 바뀌면 바닥 높이와 앞면 깊이도 바뀌니 그때마다 다시 잰다
    let modelBottom = 0;
    let modelFront = 0;
    function placeDropShadow() {
      const r = modelSphere.radius;
      // 앞면보다 조금 뒤, 바닥보다 조금 아래. 더 뒤면 원근 때문에 떠 보이고, 바닥 높이면 턱에 가려진다
      dropShadow.position.set(modelSphere.center.x, modelBottom - r * 0.06, modelFront - r * 0.45);
      dropShadow.scale.set(r * 2.3, r * 0.26, 1);
    }

    const fdiToMeshes = new Map<string, THREE.Mesh[]>();
    const pickableMeshes: THREE.Mesh[] = [];
    const createdMaterials: THREE.Material[] = [];
    const originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    const markerMaterials: Record<LesionType, THREE.Material> = {
      PLAQUE: markerMaterial('PLAQUE'),
      CALCULUS: markerMaterial('CALCULUS'),
    };
    // 치아별 마커. 그릴 게 있는 치아만 만든다
    const markers = new Map<string, Partial<Record<LesionType, THREE.Mesh>>>();
    let frames: ReturnType<typeof buildToothFrames> = new Map();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let modelRoot: THREE.Object3D | null = null;
    let pressAt: { x: number; y: number } | null = null;
    // 모형을 직접 눌러 고른 치아. 이때만 보던 각도를 유지한다
    let clickedTooth: string | null = null;

    // 모형 전체가 들어오는 거리. 펼친 포즈는 모형이 커지니 줌을 조금만 남긴다
    function fitDistance() {
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      return (
        (modelSphere.radius / Math.sin(Math.min(vFov, hFov) / 2)) *
        (FIT_MARGIN / THREE.MathUtils.lerp(zoom, Math.min(zoom, 1.12), pose))
      );
    }

    // 지금 보고 있는 각도 그대로, 고른 치아가 있으면 그 치아로 다가가고 없으면 모형 전체로 물러난다
    function cameraGoal(fdi: string | null) {
      const target = modelSphere.center.clone();
      let distance = fitDistance();
      const direction = camera.position.clone().sub(controls.target);
      if (direction.lengthSq() < 1e-6) direction.copy(VIEW_DIR);
      direction.normalize();
      const meshes = fdi ? fdiToMeshes.get(fdi) : undefined;
      const frame = fdi ? frames.get(fdi) : undefined;
      if (meshes?.length) {
        const bounds = new THREE.Box3();
        meshes.forEach((mesh) => bounds.expandByObject(mesh));
        bounds.getCenter(target);
        distance *= FOCUS_DISTANCE;
        if (fdi !== clickedTooth && frame) {
          if (pose > 0.5) {
            // 펼친 포즈는 교합면이 정면을 보니 정면에서
            direction.copy(VIEW_DIR);
          } else {
            // 치열궁 바깥 방향을 월드로 옮기고 앞쪽을 조금 섞어 완전 옆에서 보지 않게
            const outward = frame.normal.clone().transformDirection(meshes[0].matrixWorld);
            outward.y = 0;
            if (outward.lengthSq() > 1e-6) {
              direction
                .copy(outward.normalize().multiplyScalar(0.7))
                .add(new THREE.Vector3(0, 0, 0.5));
              // 모형 뒤로 돌아가면 회전 제한에 걸려 엉뚱한 각도가 된다
              direction.z = Math.max(direction.z, 0.35);
              direction.y = 0.22;
              direction.normalize();
            }
          }
        }
      }
      if (!meshes?.length) target.y -= modelSphere.radius * IDLE_LIFT;
      const position = target.clone().addScaledVector(direction, distance);
      if (meshes?.length) target.y -= distance * FOCUS_TARGET_DROP;
      return { target, position };
    }

    function placeCamera(instant: boolean) {
      const distance = fitDistance();
      camera.near = distance / 100;
      camera.far = distance * 10;
      camera.updateProjectionMatrix();
      // 치아를 골랐을 때는 치아 하나가 화면을 채울 만큼 더 당길 수 있게
      controls.minDistance = distance * (selectedRef.current ? 0.12 : IDLE_MIN_DISTANCE);
      controls.maxDistance = distance * 2.2;

      const goal = cameraGoal(selectedRef.current);
      if (instant) {
        cameraTransition = null;
        camera.position.copy(goal.position);
        controls.target.copy(goal.target);
      } else {
        cameraTransition = {
          start: performance.now(),
          fromPosition: camera.position.clone(),
          fromTarget: controls.target.clone(),
          toPosition: goal.position,
          toTarget: goal.target,
        };
      }
      controls.update();
    }

    function resize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      renderer.setSize(w, h);
      // 무대 높이가 바뀌는 중이면 전환을 이어가고, 아니면 바로 놓는다
      placeCamera(!cameraTransition);
    }

    function collectTeeth(model: THREE.Object3D) {
      model.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        if (calibrationMode) console.log(`mesh: "${obj.name}" | parent: "${obj.parent?.name}"`);
        const fdi = extractFdi(obj.name) ?? extractFdi(obj.parent?.name ?? '');
        if (!fdi) return;

        obj.userData.fdi = fdi;
        originalMaterials.set(obj, obj.material);

        const list = fdiToMeshes.get(fdi) ?? [];
        list.push(obj);
        fdiToMeshes.set(fdi, list);
      });

      const firstMesh = new Map<string, THREE.Mesh>();
      fdiToMeshes.forEach((meshes, fdi) => firstMesh.set(fdi, meshes[0]));
      frames = buildToothFrames(firstMesh);

      console.log(`[치아 매핑] ${fdiToMeshes.size}개 FDI 인식:`, [...fdiToMeshes.keys()].sort());
    }

    // 고른 치아가 있으면 그 치아 마커만, 없으면 범례 토글대로
    function applyMarkerVisibility() {
      const selected = selectedRef.current;
      markers.forEach((set, fdi) => {
        LESION_TYPES.forEach((type) => {
          const marker = set[type];
          if (!marker) return;
          const allowed =
            (selected ? fdi === selected : idleMarkers) && showRef.current[type];
          marker.visible = Boolean(marker.userData.active) && allowed;
        });
      });
    }

    // 고른 치아만 또렷하게, 나머지는 유리처럼 흐리게
    function applyDimming() {
      const selected = selectedRef.current;
      pickableMeshes.forEach((mesh) => {
        const info = mesh.userData.toothInfo as ToothInfo | undefined;
        const material = mesh.material;
        if (!info || !(material instanceof THREE.MeshStandardMaterial)) return;
        const base = info.state === 'unscanned' ? UNSCANNED_OPACITY : 1;
        const dimmed = Boolean(selected) && info.fdi !== selected;
        const baseColor =
          toothColorsRef.current?.[info.fdi] ?? (mesh.userData.baseColor as string | undefined);
        if (baseColor) {
          material.color.set(info.fdi === selected ? FOCUS_TOOTH_COLOR : baseColor);
          material.emissive.copy(material.color);
        }
        material.opacity = dimmed ? base * DIM_OPACITY : base;
        const transparent = material.opacity < 1;
        // 불투명 셰이더는 알파를 1로 고정하니 transparent가 바뀌면 다시 컴파일해야 한다
        if (material.transparent !== transparent) material.needsUpdate = true;
        material.transparent = transparent;
        material.depthWrite = !dimmed;
        material.emissiveIntensity = dimmed ? 0 : selected ? 0.22 : 0.08;
      });
      const azimuth = selected ? FOCUS_AZIMUTH : ORAL_VIEW_LIMITS.maxAzimuthAngle;
      controls.minAzimuthAngle = -azimuth;
      controls.maxAzimuthAngle = azimuth;
    }

    // 고른 치아의 병변이 전부 안쪽 면이면 펼친 포즈로 보여준다
    function desiredPose(fdi: string | null) {
      if (!fdi) return userPose;
      // 바깥에서 면을 짚어 주면 그 면이 보이는 포즈로
      if (focusSurfaceRef.current) return focusSurfaceRef.current === 'INNER' ? 1 : 0;
      const own = lesionsRef.current.filter((l) => String(l.toothNumber) === fdi);
      if (own.length > 0 && own.every((l) => l.surfaceType === 'INNER')) return 1;
      return userPose;
    }

    function startPose(to: number) {
      setTooltip(null);
      setInside(to === 1);
      poseAnimation = { from: pose, to, start: performance.now() };
    }

    function applySelection(moveCamera: boolean) {
      applyDimming();
      applyMarkerVisibility();
      if (!moveCamera || !oralModel) return;
      const target = desiredPose(selectedRef.current);
      if (Math.abs(target - pose) > 0.001 && poseAnimation?.to !== target) startPose(target);
      if (poseAnimation) focusAfterPose = true;
      else placeCamera(false);
    }

    function refreshMarker(
      fdi: string,
      mesh: THREE.Mesh,
      type: LesionType,
      polygons: ToothLesion[],
      fallback: number | null,
    ) {
      const frame = frames.get(fdi);
      const set = markers.get(fdi) ?? {};
      let marker = set[type];
      const hasInput = polygons.length > 0 || (fallback ?? 0) > 0;
      if (!hasInput) {
        if (marker) marker.userData.active = false;
        return false;
      }
      if (!frame) return false;
      if (!marker) {
        marker = createMarkerMesh(mesh, type, markerMaterials[type]);
        set[type] = marker;
        markers.set(fdi, set);
      }
      const coverage = coverageMask(frame, markerBasePositions(marker), polygons, fallback);
      marker.userData.active = updateMarker(marker, coverage, type);
      return Boolean(marker.userData.active);
    }

    function applyAnalysis() {
      pickableMeshes.length = 0;
      originalMaterials.forEach((mat, mesh) => {
        mesh.material = mat;
        delete mesh.userData.toothInfo;
      });
      createdMaterials.forEach((m) => m.dispose());
      createdMaterials.length = 0;

      const byTooth = groupByTooth(analysisResultsRef.current);
      const lesionsByTooth = groupLesions(lesionsRef.current);
      const gone = new Set(missingRef.current.map(String));
      const shot = new Set(scannedRef.current.map(String));

      const next = { calculus: 0, plaque: 0, clean: 0, unscanned: 0 };
      fdiToMeshes.forEach((meshes, fdi) => {
        const absent = gone.has(fdi);
        meshes.forEach((mesh) => {
          mesh.visible = !absent;
        });
        if (absent) return;

        const rows = calculusFirst(byTooth.get(fdi) ?? []);
        const polygons = lesionsByTooth.get(fdi) ?? [];
        const lesion = lesionState(polygons, rows);
        const scanned = shot.has(fdi) || rows.length > 0 || polygons.length > 0;

        LESION_TYPES.forEach((type) => {
          const own = polygons.filter((l) => l.lesionType === type);
          const fallback =
            own.length > 0
              ? null
              : (rows.find((r) => r.lesionType === type && isActiveLesion(r))?.areaRatio ?? null);
          refreshMarker(fdi, meshes[0], type, own, fallback);
        });

        if (lesion === 'calculus') next.calculus++;
        else if (lesion === 'plaque') next.plaque++;
        else if (scanned) next.clean++;
        else next.unscanned++;

        const state: ToothState = lesion !== 'normal' ? 'lesion' : scanned ? 'clean' : 'unscanned';
        const lesionRows = rows.filter((r) => r.lesionType);
        const top = worst(lesionRows);
        // 치아 색은 관리 필요도. 병변 면적은 치아를 골랐을 때 마커로 보여준다
        const color = top ? RISK_MODEL_FILL[top.riskLevel] : RISK_MODEL_FILL.VERY_LOW;
        const mat = scanned ? toothMaterial(color) : unscannedMaterial();
        createdMaterials.push(mat);
        meshes.forEach((mesh) => {
          mesh.material = mat;
          mesh.userData.baseColor = scanned ? color : UNSCANNED_COLOR;
          mesh.userData.toothInfo = {
            fdi,
            state,
            lesion,
            result: top,
            results: lesionRows,
          } satisfies ToothInfo;
          pickableMeshes.push(mesh);
        });
      });

      // 고른 치아의 병변 면이 바뀌어(예: 비교 슬라이더로 스캔 전환) 다른 포즈가 필요하면 다시 당겨 본다
      const selected = selectedRef.current;
      const needsPoseChange =
        Boolean(selected) && oralModel !== null && Math.abs(desiredPose(selected) - pose) > 0.001;
      applySelection(needsPoseChange);
      setCounts((prev) =>
        prev.calculus === next.calculus &&
        prev.plaque === next.plaque &&
        prev.clean === next.clean &&
        prev.unscanned === next.unscanned
          ? prev
          : next,
      );
    }

    const loader = new GLTFLoader();
    loader.load(
      MODEL_PATH,
      (gltf) => {
        const model = gltf.scene;
        if (disposed) {
          disposeModel(model);
          return;
        }
        modelRoot = model;

        oralModel = prepareOralModel(model);
        oralModel.setPose(pose);
        model.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
          }
        });

        scene.add(model);

        const modelBox = new THREE.Box3().setFromObject(model);
        modelBox.getBoundingSphere(modelSphere);
        modelBottom = modelBox.min.y;
        modelFront = modelBox.max.z;
        dropShadow.visible = true;
        collectTeeth(model);
        resize();

        applyRef.current = applyAnalysis;
        visibilityRef.current = applyMarkerVisibility;
        focusRef.current = () => applySelection(true);
        recolorRef.current = applyDimming;
        if (!calibrationMode) applyAnalysis();
        if (selectedRef.current) applySelection(true);
        poseRef.current = (next) => {
          userPose = next ? 1 : 0;
          startPose(userPose);
        };
        setLoaded(true);
      },
      undefined,
      (error) => {
        console.error('GLB 로딩 실패:', error);
        if (!disposed) setLoadFailed(true);
      },
    );

    function updatePointer(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function getIntersectedTooth(): THREE.Mesh | null {
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(
        pickableMeshes.filter((mesh) => mesh.visible),
        false,
      );
      return hits.length > 0 ? (hits[0].object as THREE.Mesh) : null;
    }

    function handlePointerMove(event: PointerEvent) {
      updatePointer(event);
      const hit = getIntersectedTooth();
      if (hit && !selectedRef.current) {
        const info = hit.userData.toothInfo as ToothInfo;
        const rect = renderer.domElement.getBoundingClientRect();
        const x = THREE.MathUtils.clamp(event.clientX - rect.left, 70, rect.width - 70);
        setTooltip({ ...info, x, y: event.clientY - rect.top });
        renderer.domElement.style.cursor = 'pointer';
      } else if (hit) {
        setTooltip(null);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setTooltip(null);
        renderer.domElement.style.cursor = calibrationMode ? 'crosshair' : 'auto';
      }
    }

    function handlePointerDown(event: PointerEvent) {
      pressAt = { x: event.clientX, y: event.clientY };
    }

    function handleClick(event: PointerEvent) {
      // 돌려보다 손을 뗀 건 클릭이 아니다
      if (
        pressAt &&
        Math.hypot(event.clientX - pressAt.x, event.clientY - pressAt.y) > CLICK_SLOP
      ) {
        return;
      }
      updatePointer(event);

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
      if (!hit) {
        if (selectedRef.current) onSelectRef.current?.(null);
        return;
      }
      const info = hit.userData.toothInfo as ToothInfo;
      clickedTooth = info.fdi;
      onSelectRef.current?.(info.fdi);
    }

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('click', handleClick);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const now = performance.now();
      if (poseAnimation && oralModel) {
        const t = Math.min((now - poseAnimation.start) / POSE_DURATION, 1);
        pose = THREE.MathUtils.lerp(poseAnimation.from, poseAnimation.to, easeOut(t));
        oralModel.setPose(pose);
        const poseBox = oralModel.bounds();
        poseBox.getBoundingSphere(modelSphere);
        modelBottom = poseBox.min.y;
        modelFront = poseBox.max.z;
        if (!selectedRef.current) placeCamera(true);
        if (t === 1) {
          poseAnimation = null;
          if (focusAfterPose) {
            focusAfterPose = false;
            placeCamera(false);
          }
        }
      }
      if (cameraTransition) {
        const t = Math.min((now - cameraTransition.start) / FOCUS_DURATION, 1);
        const e = easeOut(t);
        camera.position.lerpVectors(cameraTransition.fromPosition, cameraTransition.toPosition, e);
        controls.target.lerpVectors(cameraTransition.fromTarget, cameraTransition.toTarget, e);
        if (t === 1) cameraTransition = null;
      }
      controls.update();
      placeDropShadow();
      renderer.render(scene, camera);
    };
    animate();

    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    return () => {
      disposed = true;
      poseRef.current = null;
      applyRef.current = null;
      visibilityRef.current = null;
      focusRef.current = null;
      recolorRef.current = null;
      cancelAnimationFrame(animationId);
      controls.dispose();
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('click', handleClick);
      observer.disconnect();
      createdMaterials.forEach((m) => m.dispose());
      Object.values(markerMaterials).forEach((m) => m.dispose());
      originalMaterials.forEach((material, mesh) => {
        mesh.material = material;
      });
      if (modelRoot) disposeModel(modelRoot);
      dropShadow.material.map?.dispose();
      dropShadow.material.dispose();
      envMap.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [calibrationMode, zoom, initialPose, idleMarkers]);

  const legend: Array<{ type: LesionType; label: string; count: number }> = [
    { type: 'CALCULUS', label: LESION_LABEL.CALCULUS, count: counts.calculus },
    { type: 'PLAQUE', label: LESION_LABEL.PLAQUE, count: counts.plaque },
  ];

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      {loaded && !selectedTooth && (
        <button
          type="button"
          aria-pressed={inside}
          onClick={() => poseRef.current?.(!inside)}
          className={`absolute right-3 ${minimal ? 'top-3' : 'top-14'} z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm`}
        >
          {inside ? '정면 보기' : '안쪽 보기'}
        </button>
      )}
      {!loaded && (
        <p
          role="status"
          className="absolute inset-0 flex items-center justify-center text-xs text-gray-500"
        >
          {loadFailed ? '치아 모형을 불러오지 못했어요.' : '치아 모형을 불러오는 중이에요.'}
        </p>
      )}
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
          <p className="font-semibold text-gray-800">{labelOf(tooltip.fdi)}</p>
          {tooltip.state === 'lesion' && tooltip.results?.length ? (
            <>
              {tooltip.results.map((row) => (
                <p key={row.lesionType} className="text-gray-500">
                  <span className="font-semibold text-gray-700">{lesionLabel(row.lesionType)}</span>
                  {' · '}
                  {RISK_TAG[row.riskLevel]} · {Math.round(row.areaRatio)}%
                </p>
              ))}
            </>
          ) : tooltip.state === 'lesion' ? (
            <p className="text-gray-500">
              {tooltip.lesion === 'calculus' ? '치석이 보여요' : '치태가 보여요'}
            </p>
          ) : (
            <p className="text-gray-500">
              {tooltip.state === 'clean' ? '병변이 안 보여요' : '이번 스캔에 안 잡혔어요'}
            </p>
          )}
        </div>
      )}
      {!minimal && (
        <>
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-x-2.5 gap-y-1 rounded-xl bg-white/85 px-3 py-2 backdrop-blur-sm">
            {legend.map(({ type, label, count }) => (
              <button
                key={type}
                type="button"
                aria-pressed={show[type]}
                onClick={() => setShow((prev) => ({ ...prev, [type]: !prev[type] }))}
                className={`flex items-center gap-1.5 text-[11px] text-gray-700 transition-opacity ${
                  show[type] ? '' : 'opacity-40'
                }`}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: MARKER_COLOR[type] }}
                />
                {label} {count}
              </button>
            ))}
            <div className="flex items-center gap-1.5 text-[11px] text-gray-700">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full border border-gray-300"
                style={{ backgroundColor: RISK_MODEL_FILL.VERY_LOW }}
              />
              깨끗 {counts.clean}
            </div>
            {counts.unscanned > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-700">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full opacity-60"
                  style={{ backgroundColor: UNSCANNED_COLOR }}
                />
                미촬영 {counts.unscanned}
              </div>
            )}
          </div>

          {(counts.unscanned > 0 || counts.clean > 0) && (
            <div className="pointer-events-none absolute top-3 left-3 right-3 rounded-lg bg-white/85 px-2.5 py-1.5 backdrop-blur-sm">
              <p className="m-0 text-[11px] leading-snug text-gray-600">
                {counts.clean > 0 && `치아 ${counts.clean}개는 병변이 안 보여요.`}
                {counts.clean > 0 && counts.unscanned > 0 && ' '}
                {counts.unscanned > 0 &&
                  `흐린 회색 ${counts.unscanned}개는 이번 스캔에서 제외되었어요.`}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
