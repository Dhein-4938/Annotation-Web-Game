import { moveChunk, handleZoom, updateChunkLocationDisplay } from './movement.js';
import { generateTerrainChunks } from './terrain.js';

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


export function handleWindowResize(camera, renderer) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

export function handleMovement(config, data, scene, key) {
    const movement = MOVEMENTS[key];
    
    // Handle directional movement
    if (Array.isArray(movement)) {
        moveChunk(scene, config, data, ...movement);
        updateChunkLocationDisplay(data);
        return;
    }

    // Handle zoom operations
    else if (movement === 'zoomIn' || movement === 'zoomOut') {
        handleZoom(config, data, movement === 'zoomIn' ? -1 : 1);
        updateChunkLocationDisplay(data);
    }

    // Handle reset operation
    else if (movement === 'reset') {
        data.chunkPosition.x = 200.0;
        data.chunkPosition.y = 200.0;
        data.chunkSizeIndex = 4; // Reset to default chunk size
        updateChunkLocationDisplay(data);
        data.gridChunk.forEach(chunk => scene.remove(chunk.mesh));
        data.gridChunk = generateTerrainChunks(config, data);
        data.gridChunk.forEach(chunk => scene.add(chunk.mesh));
    }
}

// Handle button movement
export function handleButtonMovement(direction, scene, config, data) {
    const movement = MOVEMENTS[`Arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}`];
    moveChunk(scene, config, data, ...movement);
    updateChunkLocationDisplay(data);
}
