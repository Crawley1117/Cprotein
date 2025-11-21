<template>
  <div ref="containerRef" class="protein-viewer-container">
    <!-- 加载动画 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loader"></div>
      <p v-if="loadingMessage">{{ loadingMessage }}</p>
      <p v-else>正在加载蛋白质结构...</p>
    </div>
    <!-- 错误信息 -->
    <div v-else-if="error" class="error-overlay">错误: {{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { parsePDB, fetchPDB } from '@/utils/pdbParser';

const props = defineProps({
  atomData: {
    type: Object,
    default: null
  },
  pdbId: {
    type: String,
    default: null
  },
  renderMode: {
    type: String,
    default: 'cartoon'
  }
});

const emit = defineEmits(['load', 'error']);

const containerRef = ref(null);
// 不再在初始化时设为 true，而是由 loadAndRenderProtein 控制
const loading = ref(false);
const loadingMessage = ref('');
const error = ref('');

let scene, camera, renderer, controls;
let currentObject = null;
let animationId = null;
let resizeObserver = null;

// 用于存储解析后的原子数据
let parsedAtoms = [];
let parsedHetatms = [];

// --- 创建圆形点纹理 ---
let circleTexture = null;
function createCircleTexture() {
  if (circleTexture) return circleTexture;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, size, size);
  context.fillStyle = 'rgb(255, 255, 255)';
  context.beginPath();
  context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  context.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  circleTexture = texture;
  return texture;
}

const initScene = () => {
  if (!containerRef.value) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const aspect = containerRef.value.clientWidth / containerRef.value.clientHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  containerRef.value.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 20;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  console.log('Scene, camera, renderer, controls initialized.');
};

const handleContainerResize = (entries) => {
  for (let entry of entries) {
    const { width, height } = entry.contentRect;
    if (width > 0 && height > 0) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (scene && currentObject) {
        fitCameraToObject(camera, controls, currentObject);
      }
    }
  }
};

const loadAndRenderProtein = async (data) => {
  console.log('Loading protein ', data);

  if (!data || !data.atoms) {
    console.warn("Protein data is missing or invalid:", data);
    error.value = "无效的蛋白质数据";
    emit('error', new Error("Invalid protein data"));
    loading.value = false; // 确保出错时隐藏加载动画
    return;
  }

  // 保存解析后的数据
  parsedAtoms = data.atoms;
  parsedHetatms = data.hetatms;

  // 清除旧的对象
  if (currentObject) {
    scene.remove(currentObject);
    disposeObject(currentObject);
    currentObject = null;
  }

  // 根据当前选择的模式渲染
  await renderProteinByMode(props.renderMode);

  emit('load');
  loading.value = false; // 数据加载完成，隐藏加载动画
};

function disposeObject(object) {
  if (object.geometry) {
    object.geometry.dispose();
  }
  if (object.material) {
    if (Array.isArray(object.material)) {
      object.material.forEach(material => material.dispose());
    } else {
      object.material.dispose();
    }
  }
  if (object.children) {
    object.children.forEach(child => {
      disposeObject(child);
    });
  }
}

const renderProteinByMode = async (mode) => {
  if (!parsedAtoms || parsedAtoms.length === 0) return;

  // 清除旧的对象
  if (currentObject) {
    scene.remove(currentObject);
    disposeObject(currentObject);
    currentObject = null;
  }

  let newObject = null;

  switch (mode) {
    case 'points':
      newObject = createPointCloudObject(parsedAtoms);
      break;
    case 'wireframe':
      newObject = createWireframeObject(parsedAtoms);
      break;
    case 'ballAndStick':
      newObject = createBallAndStickObject(parsedAtoms);
      break;
    case 'cartoon':
      newObject = await createCartoonObject(parsedAtoms);
      break;
    case 'surface':
      newObject = createPointCloudObject(parsedAtoms, 0.1, 0.5);
      break;
    default:
      console.warn(`Unknown render mode: ${mode}`);
      return;
  }

  if (newObject) {
    scene.add(newObject);
    currentObject = newObject;
    fitCameraToObject(camera, controls, currentObject);
  }
};

const createPointCloudObject = (atoms, size = 0.05, opacity = 1.0) => {
  const positions = new Float32Array(atoms.flatMap(atom => [atom.x, atom.y, atom.z]));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const texture = createCircleTexture();
  const material = new THREE.PointsMaterial({
    color: 0xc0c0c0,
    size: size,
    sizeAttenuation: true,
    transparent: opacity < 1.0,
    opacity: opacity,
    depthWrite: opacity >= 1.0,
    map: texture,
    alphaTest: 0.5
  });

  return new THREE.Points(geometry, material);
};

const createWireframeObject = (atoms) => {
  const caAtoms = atoms.filter(atom => atom.atomName === 'CA');
  if (caAtoms.length < 2) return null;

  const positions = [];
  for (let i = 0; i < caAtoms.length - 1; i++) {
    const atom1 = caAtoms[i];
    const atom2 = caAtoms[i + 1];
    positions.push(atom1.x, atom1.y, atom1.z);
    positions.push(atom2.x, atom2.y, atom2.z);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));

  const material = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });

  return new THREE.LineSegments(geometry, material);
};

const createBallAndStickObject = (atoms) => {
  const group = new THREE.Group();

  const caAtoms = atoms.filter(atom => atom.atomName === 'CA');
  for (const atom of caAtoms) {
    const geometry = new THREE.SphereGeometry(0.05, 8, 8);
    const material = new THREE.MeshPhongMaterial({ color: 0xc0c0c0 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(atom.x, atom.y, atom.z);
    group.add(sphere);
  }

  if (caAtoms.length > 1) {
    const bondPositions = [];
    for (let i = 0; i < caAtoms.length - 1; i++) {
      const atom1 = caAtoms[i];
      const atom2 = caAtoms[i + 1];
      const dist = Math.sqrt(
        Math.pow(atom2.x - atom1.x, 2) +
        Math.pow(atom2.y - atom1.y, 2) +
        Math.pow(atom2.z - atom1.z, 2)
      );
      if (dist < 3) {
        bondPositions.push(atom1.x, atom1.y, atom1.z);
        bondPositions.push(atom2.x, atom2.y, atom2.z);
      }
    }

    if (bondPositions.length > 0) {
      const bondGeometry = new THREE.BufferGeometry();
      bondGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bondPositions), 3));

      const bondMaterial = new THREE.LineBasicMaterial({ color: 0x808080, linewidth: 1 });
      const bonds = new THREE.LineSegments(bondGeometry, bondMaterial);
      group.add(bonds);
    }
  }

  return group;
};

const createCartoonObject = async (atoms) => {
  const group = new THREE.Group();
  const caAtoms = atoms.filter(atom => atom.atomName === 'CA').sort((a, b) => a.residueSeq - b.residueSeq);

  if (caAtoms.length < 2) return group;

  const segments = [];
  let currentSegment = { type: null, atoms: [] };

  for (let i = 0; i < caAtoms.length; i++) {
    const atom = caAtoms[i];
    let secStrucType = 'coil';
    if (i < caAtoms.length - 3) {
        const nextAtom = caAtoms[i + 3];
        if (nextAtom) {
            const dist = Math.sqrt(
                Math.pow(nextAtom.x - atom.x, 2) +
                Math.pow(nextAtom.y - atom.y, 2) +
                Math.pow(nextAtom.z - atom.z, 2)
            );
            if (dist < 5.5) {
                secStrucType = 'helix';
            } else {
                secStrucType = 'sheet';
            }
        }
    }

    if (currentSegment.type === null) {
        currentSegment.type = secStrucType;
        currentSegment.atoms.push(atom);
    } else if (currentSegment.type === secStrucType) {
        currentSegment.atoms.push(atom);
    } else {
        segments.push({ ...currentSegment });
        currentSegment = { type: secStrucType, atoms: [atom] };
    }
  }
  if (currentSegment.atoms.length > 0) {
    segments.push(currentSegment);
  }

  for (const segment of segments) {
    if (segment.atoms.length < 2) continue;

    const points = segment.atoms.map(atom => new THREE.Vector3(atom.x, atom.y, atom.z));
    const curve = new THREE.CatmullRomCurve3(points);

    let color, radius;
    switch (segment.type) {
      case 'helix':
        color = 0xff0000;
        radius = 0.2;
        break;
      case 'sheet':
        color = 0x00ff00;
        radius = 0.15;
        break;
      case 'coil':
      default:
        color = 0xffffff;
        radius = 0.1;
        break;
    }

    const tubularSegments = Math.max(8, segment.atoms.length * 2);
    const radialSegments = 8;
    const tubeGeometry = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);

    const material = new THREE.MeshPhongMaterial({ color: color, side: THREE.DoubleSide });
    const tube = new THREE.Mesh(tubeGeometry, material);

    group.add(tube);
  }

  return group;
};

// --- 修改：监听 renderMode prop 的变化 ---
watch(() => props.renderMode, async (newMode) => {
  // 只有在原子数据已加载时才重新渲染
  if (parsedAtoms.length > 0) {
    await renderProteinByMode(newMode);
  }
});

const animate = () => {
  animationId = requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
};

const fitCameraToObject = (camera, controls, object, fitOffset = 1.2) => {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  console.log('Box size:', size);
  console.log('Box center:', center);

  const actualDiagonal = Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z);

  const fovRad = (camera.fov / 2) * (Math.PI / 180);
  const distance = actualDiagonal / (2 * Math.tan(fovRad)) * fitOffset;

  camera.position.copy(center).add(new THREE.Vector3(0, 0, 1).multiplyScalar(distance));
  controls.target.copy(center);

  controls.update();
};

onMounted(async () => {
  initScene();

  resizeObserver = new ResizeObserver(handleContainerResize);
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value);
  }

  if (!animationId) {
    animate();
  }

  // --- 修改：在加载数据前先设置 loading 状态 ---
  if (props.pdbId) {
    loading.value = true; // 开始加载
    loadingMessage.value = `正在获取 PDB 数据: ${props.pdbId}...`;
    try {
      const pdbContent = await fetchPDB(props.pdbId);
      loadingMessage.value = `正在解析 PDB 数据: ${props.pdbId}...`;
      const parsedData = parsePDB(pdbContent);
      await loadAndRenderProtein(parsedData);
    } catch (err) {
      console.error('Error fetching or parsing PDB:', err);
      error.value = `加载 PDB 数据失败: ${err.message || '未知错误'}`;
      emit('error', err);
      loading.value = false; // 加载失败也要隐藏加载动画
    }
  } else if (props.atomData) {
     loading.value = true; // 开始加载
     await loadAndRenderProtein(props.atomData);
  } else {
    error.value = "未提供 PDB ID 或原子数据";
    loading.value = false; // 无数据也隐藏加载动画
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  if (renderer) {
    renderer.dispose();
  }
  if (controls) {
    controls.dispose();
  }
  if (currentObject) {
    scene.remove(currentObject);
    disposeObject(currentObject);
  }
  if (circleTexture) {
    circleTexture.dispose();
  }
});

// --- 修改：监听 atomData 和 pdbId 的变化 ---
watch(() => [props.atomData, props.pdbId], async ([newAtomData, newPdbId]) => {
    // 清除之前的错误和数据
    error.value = '';
    parsedAtoms = [];
    parsedHetatms = [];

    if (newPdbId) {
        loading.value = true; // 开始加载新数据
        loadingMessage.value = `正在获取 PDB 数据: ${newPdbId}...`;
        try {
            const pdbContent = await fetchPDB(newPdbId);
            loadingMessage.value = `正在解析 PDB 数据: ${newPdbId}...`;
            const parsedData = parsePDB(pdbContent);
            await loadAndRenderProtein(parsedData);
        } catch (err) {
            console.error('Error fetching or parsing PDB:', err);
            error.value = `加载 PDB 数据失败: ${err.message || '未知错误'}`;
            emit('error', err);
            loading.value = false; // 加载失败隐藏加载动画
        }
    } else if (newAtomData) {
        loading.value = true; // 开始加载新数据
        try {
            await loadAndRenderProtein(newAtomData);
        } catch (err) {
            console.error('Error loading or rendering protein:', err);
            error.value = err.message || '加载失败';
            emit('error', err);
            loading.value = false; // 加载失败隐藏加载动画
        }
    } else {
        // 如果两个 prop 都变为 null 或 undefined，清空场景
        if (currentObject) {
          scene.remove(currentObject);
          disposeObject(currentObject);
          currentObject = null;
        }
        loading.value = false; // 隐藏加载动画
    }
}, { immediate: true });

</script>

<style scoped>
.protein-viewer-container {
  width: 100%;
  height: 100%;
  min-height: 100%;
  position: relative;
  overflow: hidden;
  background-color: #000;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 1rem 2rem;
  border-radius: 4px;
  z-index: 10;
  font-family: Arial, sans-serif;
  text-align: center;
}

.loader {
  width: 40px;
  height: 40px;
  border: 4px solid #3498db;
  border-top: 4px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-overlay p {
  margin: 0;
  font-size: 0.9rem;
}
</style>