import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { UltraHDRLoader } from 'jsm/loaders/UltraHDRLoader.js';
import { TeapotGeometry } from 'jsm/geometries/TeapotGeometry.js';

const width = window.innerWidth;
const height = window.innerHeight;

// 3D Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Load HDR Environment Map
const hdrLoader = new UltraHDRLoader();
hdrLoader.load("assets/image/moonless_golf_1k.jpg", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
});

// Basic Cube for Visualization
const geometry = new THREE.TorusGeometry(2, 0.8, 48, 100);
const material = new THREE.MeshPhysicalMaterial({ 
    roughness: 0.0,
    metalness: 1.0,
    transmission: 1.0,
    thickness: 1.0,
    color: 0x00ff00,
    side: THREE.DoubleSide,
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

function animate(t=0) {
    requestAnimationFrame(animate);
    cube.rotation.x += Math.sin(t * 0.0005) * 0.001;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
    controls.update();
}
animate();

function handleWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

window.addEventListener('resize', handleWindowResize, false);
