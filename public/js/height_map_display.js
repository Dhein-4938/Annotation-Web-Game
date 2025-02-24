import * as THREE from "three";
import { io } from 'socket.io-client';
import { initScene, setupLighting, setupControls } from './sceneSetup.js';
import { loadHeightData, generateTerrainChunks } from './terrain.js';
import { handleWindowResize, handleMovement, handleButtonMovement } from './eventHandlers.js';
import { updateChunkLocationDisplay } from './movement.js';

console.log('THREE version:', THREE.REVISION);

// Establish WebSocket connection
const socket = io();

// Log connection status
socket.on('connect', () => { console.log('Connected to server'); });
socket.on('disconnect', () => { console.log('Disconnected from server'); });

// Configuration
const config = {
    chunkSizes: [10, 20, 50, 100, 200, 500, 750, 1000, 1500],
    chunkSizeIndex: 4,
    scale: { height: 20, plane: 10 },
    moveStepScale: 0.25,
    cameraPosition: { x: -5, y: 5, z: 0 },
    opacity: { center: 1.0, other: 0.3 },
    animationDuration: 1000,
};

const data = {
    heightData: null,
    mapSize: { width: 0, height: 0 },
    gridChunk: [],
    chunkPosition: { x: 200.0, y: 200.0 },
    meshPosition: { x: 0, y: 0 , z: 0 },
};

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    controls.update();
}

// Initialize application
const { scene, camera, renderer } = initScene(config);
const controls = setupControls(camera, renderer);
setupLighting(scene);

// Show loading overlay
const loadingOverlay = document.getElementById('loading-overlay');
loadingOverlay.style.display = 'flex';

// Load height data and start application
loadHeightData('data/height_cache_H282.bin').then(({ heightData, rows, cols }) => {
    data.heightData = heightData;
    data.mapSize.width = rows;
    data.mapSize.height = cols;
    
    data.gridChunk.forEach(chunk => scene.remove(chunk.mesh));
    data.gridChunk = generateTerrainChunks(config, data);
    data.gridChunk.forEach(chunk => scene.add(chunk.mesh));
    controls.update();
    updateChunkLocationDisplay(data);
    // Hide loading overlay
    loadingOverlay.style.display = 'none';
    // Animation loop
    animate();
});

// Event listeners
window.addEventListener('resize', () => handleWindowResize(camera, renderer), false);

// Handle chunk movement with arrow keys and buttons

// Handle keyboard movement
document.addEventListener('keydown', (event) => {
    handleMovement(config, data, scene, event.key);
});

// Handle button movement
const buttons = ['up', 'down', 'left', 'right'];
buttons.forEach(direction => {
    const button = document.getElementById(`move-${direction}`);
    button.addEventListener('click', () => handleButtonMovement(config, data, scene, direction));
});
