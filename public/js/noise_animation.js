import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { ImprovedNoise } from 'jsm/math/ImprovedNoise.js';
console.log('THREE version:', THREE.REVISION);

const width = window.innerWidth;
const height = window.innerHeight;

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

// Camera position
camera.position.z = 10;
// camera.lookAt(0, 0, 0);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableZoom = true;
controls.enablePan = true;
controls.enableDamping = true;
controls.update();

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 1, 1);
scene.add(light);
// scene.add(new THREE.AmbientLight(0x404040));

// Vectorized grid creation using TypedArrays
const gridSize = 50;
const gap = 0.125;
const numPoints = (gridSize * 2) * (gridSize * 2);

// Pre-allocate typed arrays
const coords = new Float32Array(numPoints * 3);
const colors = new Float32Array(numPoints * 3);

// Vectorized grid generation
const xCoords = Float32Array.from({ length: gridSize * 2 }, (_, i) => (i - gridSize) * gap);
const yCoords = Float32Array.from({ length: gridSize * 2 }, (_, i) => (i - gridSize) * gap);

// Use typed arrays and SIMD-friendly layout
for (let x = 0; x < gridSize * 2; x++) {
    const xVal = xCoords[x];
    const xOffset = x * gridSize * 2 * 3;
    for (let y = 0; y < gridSize * 2; y++) {
        const i = xOffset + y * 3;
        coords[i] = xVal;
        coords[i + 1] = yCoords[y];
        coords[i + 2] = 0;
    }
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(coords, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
const pointObjects = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ size: 0.10, vertexColors: true })
);

const Noises = new ImprovedNoise();
const lowColor = { r: 0.0, g: 0.8, b: 0.0 };
const highColor = { r: 1.0, g: 1.0, b: 1.0 };

// Pre-allocate arrays and variables
const CHUNK_SIZE = 1024; // Process points in chunks for better cache usage
const noiseScale = 0.5;
const zScale = 2.5;

function InlineColorInterpolation(noiseValue) {
    const r = lowColor.r + (highColor.r - lowColor.r) * noiseValue;
    const g = lowColor.g + (highColor.g - lowColor.g) * noiseValue;
    const b = lowColor.b + (highColor.b - lowColor.b) * noiseValue;
    return { r, g, b };
}

function updatePoints(t) {
    const positions = pointObjects.geometry.attributes.position.array;
    const colors = pointObjects.geometry.attributes.color.array;
    
    for (let chunk = 0; chunk < positions.length; chunk += CHUNK_SIZE * 3) {
        const chunkEnd = Math.min(chunk + CHUNK_SIZE * 3, positions.length);
        
        for (let i = chunk; i < chunkEnd; i += 3) {
            const x = positions[i] * noiseScale;
            const y = positions[i + 1] * noiseScale;
            
            const noiseValue = Noises.noise(x, y, t);
            positions[i + 2] = noiseValue * zScale;
            
            // Inline color interpolation for better performance
            const { r, g, b } = InlineColorInterpolation(noiseValue);
            
            colors[i] = r;
            colors[i + 1] = g;
            colors[i + 2] = b;
        }
    }

    pointObjects.geometry.attributes.position.needsUpdate = true;
    pointObjects.geometry.attributes.color.needsUpdate = true;
}
scene.add(pointObjects);

const timeScale = 0.0005;
function animate(timestep) {
    requestAnimationFrame(animate);
    updatePoints(timestep * timeScale);
    renderer.render(scene, camera);
}
// Start the animation loop
animate(0);

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
