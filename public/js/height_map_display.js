import * as THREE from "three";
import { io } from 'socket.io-client';
import gsap from "gsap";
import { initScene, setupLighting, setupControls } from './sceneSetup.js';
import { loadHeightData, generateTerrainChunks, createTerrainForPosition } from './terrain.js';
import { createAxisHelper } from './axisHelper.js';

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
    chunkSizes: [10, 20, 50, 100, 200, 500, 750, 1000, 1500],
    chunkSizeIndex: 4,
    chunkPosition: { x: 200.0, y: 200.0 },
    meshPosition: { x: 0, y: 0 , z: 0 },
    scale: { height: 20, plane: 10 },
    mapSize: { width: 10000, height: 10000 },     // to be updated after loading height data
    moveStepScale: 0.25,
    cameraPosition: { x: -5, y: 5, z: 0 }
};
const mesh3x3 = [];
let heightData = null;

function updateChunkLocationDisplay() {
    const chunkLocationElement = document.getElementById('chunk-location');
    chunkLocationElement.textContent = `Chunk: (${config.chunkPosition.x.toFixed(2)}, ${config.chunkPosition.y.toFixed(2)})`;
}

function updateConfigChunkPosition(dx, dy = dx) {
    config.chunkPosition.x = THREE.MathUtils.clamp(config.chunkPosition.x + dx, 0, config.mapSize.width);
    config.chunkPosition.y = THREE.MathUtils.clamp(config.chunkPosition.y + dy, 0, config.mapSize.height);    
}

function highlightCenterChunk() {
    mesh3x3.forEach(chunk => {
        if (chunk.position.x === config.chunkPosition.x &&
            chunk.position.z === config.chunkPosition.y) {
            chunk.material.opacity = 1;
        } else {
            chunk.material.opacity = 0.3;
        }
    });
}

function moveChunk(directionX, directionY = directionX) {
    const { meshStepSize, chunkSize } = {
        meshStepSize: config.scale.plane,
        chunkSize: config.chunkSizes[config.chunkSizeIndex]
    };
    
    // Move chunk position
    updateConfigChunkPosition(directionX * chunkSize, directionY * chunkSize);
    
    // Identify chunks to remove based on movement direction
    const oldChunks = mesh3x3.filter(chunk => {
        if (directionX > 0) return chunk.position.z <= -meshStepSize;
        if (directionX < 0) return chunk.position.z >= meshStepSize;
        if (directionY > 0) return chunk.position.x <= -meshStepSize;
        if (directionY < 0) return chunk.position.x >= meshStepSize;
        return false;
    });

    // Animate and remove old chunks
    oldChunks.forEach(chunk => {
        gsap.to(chunk.position, { duration: 1, y: -10, ease: "power4.out" });
        gsap.to(chunk.material, {
            duration: 1,
            opacity: 0,
            ease: "power4.out",
            onComplete: () => {
                scene.remove(chunk);
                mesh3x3 = mesh3x3.filter(m => m !== chunk);
            }
        });
    });

    // Generate new chunk positions based on the xy directions
    const positions = [
        { x: directionX > 0 ? 1 : directionX < 0 ? -1 : -1, 
          z: directionY > 0 ? 1 : directionY < 0 ? -1 : -1 },
        { x: directionX > 0 ? 1 : directionX < 0 ? -1 : 0, 
          z: directionY > 0 ? 1 : directionY < 0 ? -1 : 0 },
        { x: directionX > 0 ? 1 : directionX < 0 ? -1 : 1, 
          z: directionY > 0 ? 1 : directionY < 0 ? -1 : 1 }
    ];


    // Create new chunks only for positions that don't exist yet
    const newChunks = positions
        .map(pos => createTerrainForPosition(
            config, 
            heightData, 
            {gridX: pos.x, gridY: pos.z}, 
            0.3
        ))

    // Add and animate new chunks
    newChunks.forEach(chunk => {
        chunk.position.y = -10;
        chunk.material.opacity = 0;
        scene.add(chunk);
        mesh3x3.push(chunk);

        gsap.to(chunk.position, { duration: 1, y: 0, ease: "power4.out" });
        gsap.to(chunk.material, { duration: 1, opacity: 1, ease: "power4.out" });
    });

    // Update remaining chunks positions
    const remainingChunks = mesh3x3.filter(chunk => 
        !oldChunks.includes(chunk) && !newChunks.includes(chunk)
    );

    remainingChunks.forEach(chunk => {
        gsap.to(chunk.position, {
            duration: 1,
            x: chunk.position.x - directionY * meshStepSize,
            z: chunk.position.z - directionX * meshStepSize,
            ease: "power4.out"
        });
    });

    updateChunkLocationDisplay();
}


function handleZoom(direction) {
    // Calculate center point of current chunk
    const oldChunkSize = config.chunkSizes[config.chunkSizeIndex];
    
    // Update chunk size index with bounds checking
    config.chunkSizeIndex = THREE.MathUtils.clamp(
        config.chunkSizeIndex + direction,
        0,
        config.chunkSizes.length - 1
    );
    
    // Recenter chunk position with new size
    const newChunkSize = config.chunkSizes[config.chunkSizeIndex];
    updateConfigChunkPosition(  oldChunkSize / 2 - newChunkSize / 2);
    console.log(`Chunk size: ${newChunkSize}`);
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
        return;
    }

    // Handle zoom operations
    else if (movement === 'zoomIn' || movement === 'zoomOut') {
        handleZoom(movement === 'zoomIn' ? -1 : 1);
        updateDisplay();
    }

    // Handle reset operation
    else if (movement === 'reset') {
        config.chunkPosition.x = 200.0;
        config.chunkPosition.y = 200.0;
        config.chunkSizeIndex = 4; // Reset to default chunk size
        updateDisplay();
    }
}

function updateDisplay() {
    createSingleChunkTerrain(scene, controls);
    updateChunkLocationDisplay();
}

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
loadHeightData('data/height_cache_H282.bin').then(({ heightData: data, rows, cols }) => {
    heightData = data;
    config.mapSize.width = rows;
    config.mapSize.height = cols;
    
    mesh3x3.forEach(chunk => scene.remove(chunk));
    mesh3x3 = generateTerrainChunks(config, heightData);
    mesh3x3.forEach(chunk => scene.add(chunk));
    controls.update();
    updateChunkLocationDisplay();
    // Hide loading overlay
    loadingOverlay.style.display = 'none';
    // Animation loop
    animate();
});

// Create and animate the axis helper
createAxisHelper(scene);

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
