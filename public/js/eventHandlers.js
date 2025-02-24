import { moveChunk, handleZoom, updateChunkLocationDisplay } from './movement.js';

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

export function handleMovement(key, scene, config, heightData, gridChunk) {
    const movement = MOVEMENTS[key];
    
    // Handle directional movement
    if (Array.isArray(movement)) {
        console.log('gridChunk ids:', gridChunk.map(chunk => chunk.id));
        moveChunk(scene, config, heightData, gridChunk, ...movement);
        console.log('gridChunk ids:', gridChunk.map(chunk => chunk.id));
        updateChunkLocationDisplay(config);
        return;
    }

    // Handle zoom operations
    else if (movement === 'zoomIn' || movement === 'zoomOut') {
        handleZoom(config, movement === 'zoomIn' ? -1 : 1);
        updateChunkLocationDisplay(config);
    }

    // Handle reset operation
    else if (movement === 'reset') {
        config.chunkPosition.x = 200.0;
        config.chunkPosition.y = 200.0;
        config.chunkSizeIndex = 4; // Reset to default chunk size
        updateChunkLocationDisplay(config);
    }
}

// Handle button movement
export function handleButtonMovement(direction, scene, config, heightData, gridChunk) {
    const movement = MOVEMENTS[`Arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}`];
    moveChunk(scene, config, heightData, gridChunk, ...movement);
    updateChunkLocationDisplay(config);
}
