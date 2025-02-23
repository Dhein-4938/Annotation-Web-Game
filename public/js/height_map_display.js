import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { io } from 'socket.io-client';

console.log('THREE version:', THREE.REVISION);

// Establish WebSocket connection
const socket = io();

// Log connection status
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

// Configuration
const config = {
    chunkSizes: [10, 20, 50, 100, 200, 500, 750, 1000, 1500, 2000],
    chunkSizeIndex: 4,
    chunkPosition: { x: 200, y: 200 },
    scale: { height: 20, plane: 10 },
    mapSize: { width: 10000, height: 10000 },     // to be updated after loading height data
    moveStepScale: 0.25,
    cameraPosition: { x: -5, y: 5, z: 0 }
};

let currentTerrainMesh = null;
let heightData = null;

// Scene setup functions
function initScene() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    
    camera.position.set(config.cameraPosition.x, config.cameraPosition.y, config.cameraPosition.z);
    camera.lookAt(0, 0, 0);
    renderer.setSize(width, height);
    document.body.appendChild(renderer.domElement);
    
    return { scene, camera, renderer };
}

function setupLighting(scene) {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1, 1);
    scene.add(light);
}

function setupControls(camera, renderer) {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableDamping = true;
    controls.update();
    return controls;
}

// Terrain functions
function createTerrainMesh(geometry) {
    const material = new THREE.MeshPhongMaterial({
        color: 0x808080,
        wireframe: false,
        side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
}
function updateVertexHeights(geometry) {
    const vertices = geometry.attributes.position.array;
    const position = config.chunkPosition;
    const chunkSize = config.chunkSizes[config.chunkSizeIndex];
    const totalVertices = chunkSize * chunkSize;

    // Create flat arrays for better performance
    const heightValues = new Float32Array(totalVertices);
    
    // Bulk process height values
    for (let i = 0; i < totalVertices; i++) {
        const row = Math.floor(i / chunkSize);
        const col = i % chunkSize;
        const dataX = position.x + row;
        const dataY = position.y + col;
        
        const heightValue = heightData[dataX]?.[dataY];
        heightValues[i] = heightValue !== undefined 
            ? heightValue * config.scale.height             // If height value exists, scale it
            : 0;                                            // Default to 0 if not found
    }

    // Bulk update vertex positions
    for (let i = 0; i < totalVertices; i++) {
        vertices[i * 3 + 2] = heightValues[i];
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
}

async function loadHeightData() {
    try {
        const response = await fetch('data/height_cache_H282.json');
        heightData = await response.json();
        config.mapSize.width = heightData.length;
        config.mapSize.height = heightData[0].length;
    } catch (error) {
        console.error('Error loading height data:', error);
        heightData = [];
    }
}

// Main setup function
function createHeightMap(scene, controls) {
    const chunkSize = config.chunkSizes[config.chunkSizeIndex];
    console.log(`Chunk size: ${chunkSize}`);
    const plane = config.scale.plane;
    const geometry = new THREE.PlaneGeometry(plane, plane, chunkSize - 1, chunkSize - 1);

    updateVertexHeights(geometry);
    const mesh = createTerrainMesh(geometry);
    if (currentTerrainMesh) {
        scene.remove(currentTerrainMesh);
    }
    scene.add(mesh);
    currentTerrainMesh = mesh;

    controls.update();
}

function updateChunkLocationDisplay() {
    const chunkLocationElement = document.getElementById('chunk-location');
    chunkLocationElement.textContent = `Chunk: (${config.chunkPosition.x}, ${config.chunkPosition.y})`;
}

function moveChunkPosition(deltaX, deltaY = deltaX) {
    config.chunkPosition.x = THREE.MathUtils.clamp(config.chunkPosition.x + deltaX, 0, config.mapSize.width);
    config.chunkPosition.y = THREE.MathUtils.clamp(config.chunkPosition.y + deltaY, 0, config.mapSize.height);    
}

function moveChunk(directionX, directionY) {
    // Update the start position and recreate the height map
    const stepSize = Math.round(config.moveStepScale * config.chunkSizes[config.chunkSizeIndex]);
    moveChunkPosition(directionX * stepSize, directionY * stepSize);
}

function handleZoom(direction) {
    // Calculate center point of current chunk
    const oldChunkSize = config.chunkSizes[config.chunkSizeIndex];
    
    // Update chunk size index with bounds checking
    config.chunkSizeIndex = Math.min(
        Math.max(config.chunkSizeIndex + direction, 0), 
        config.chunkSizes.length - 1
    );
    
    // Recenter chunk position with new size
    const newChunkSize = config.chunkSizes[config.chunkSizeIndex];
    moveChunkPosition(
        oldChunkSize / 2 - newChunkSize / 2
    );
}


// Event handlers
function handleWindowResize(camera, renderer) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function handleMovement(key) {
    const movement = MOVEMENTS[key];
    
    // Handle directional movement
    if (Array.isArray(movement)) {
        moveChunk(...movement);
        updateDisplay();
        return;
    }

    // Handle zoom operations
    else if (movement === 'zoomIn' || movement === 'zoomOut') {
        handleZoom(movement === 'zoomIn' ? -1 : 1);
        updateDisplay();
    }

    // Handle reset operation
    else if (movement === 'reset') {
        config.chunkPosition.x = 200;
        config.chunkPosition.y = 200;
        config.chunkSizeIndex = 4; // Reset to default chunk size
        updateDisplay();
    }
}

function updateDisplay() {
    createHeightMap(scene, controls);
    updateChunkLocationDisplay();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    controls.update();
}

// Initialize application
const { scene, camera, renderer } = initScene();
const controls = setupControls(camera, renderer);
setupLighting(scene);

// Show loading overlay
const loadingOverlay = document.getElementById('loading-overlay');
loadingOverlay.style.display = 'flex';

// Load height data and start application
loadHeightData().then(() => {
    createHeightMap(scene, controls);
    updateChunkLocationDisplay();
    // Hide loading overlay
    loadingOverlay.style.display = 'none';
    // Animation loop
    animate();
});

// Event listeners
window.addEventListener('resize', () => handleWindowResize(camera, renderer), false);
// Handle chunk movement with arrow keys and buttons
// Movement directions mapping
const MOVEMENTS = {
    'ArrowUp':    [0,  1],
    'ArrowDown':  [0, -1],
    'ArrowLeft':  [-1, 0],
    'ArrowRight': [ 1, 0],
    'z':          'zoomIn',
    'x':          'zoomOut',
    'w':          [0,  1],
    's':          [0, -1],
    'a':          [-1, 0],
    'd':          [ 1, 0],
    'r':          'reset',
};


// Handle keyboard movement
document.addEventListener('keydown', (event) => {
    handleMovement(event.key);
});

// Handle button movement
const buttonIds = ['up', 'down', 'left', 'right'];
buttonIds.forEach(direction => {
    document.getElementById(`move-${direction}`).addEventListener('click', () => {
        const movement = MOVEMENTS[`Arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}`];
        moveChunk(...movement);
    });
});

