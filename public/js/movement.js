import * as THREE from "three";
import gsap from "gsap";
import { createTerrainForPosition } from './terrain.js';

// Updates the display of the current chunk location
export function updateChunkLocationDisplay(config) {
    const chunkLocationElement = document.getElementById('chunk-location');
    chunkLocationElement.textContent = `Chunk: (${config.chunkPosition.x.toFixed(2)}, ${config.chunkPosition.y.toFixed(2)})`;
}

// Updates the chunk position in the configuration
function updateConfigChunkPosition(config, dx, dy = dx) {
    config.chunkPosition.x = THREE.MathUtils.clamp(config.chunkPosition.x + dx, 0, config.mapSize.width);
    config.chunkPosition.y = THREE.MathUtils.clamp(config.chunkPosition.y + dy, 0, config.mapSize.height);    
}

// Updates the chunk IDs based on movement direction and returns old chunks
function updateChunkIds(gridChunk, directionX, directionY, config) {
    const oldChunk = [];
    gridChunk.forEach(chunk => {
        if (chunk.id === 11) chunk.mesh.material.opacity = config.opacity.other;
        chunk.id = chunk.id - directionX - directionY * 10;
        if (chunk.id === 11) chunk.mesh.material.opacity = config.opacity.center;
        if (![0, 1, 2, 10, 11, 12, 20, 21, 22].includes(chunk.id)) {
            oldChunk.push(chunk);
        }
    });
    return oldChunk;
}

// Animates and removes old chunks from the scene
function animateAndRemoveOldChunks(scene, oldChunk, gridChunk) {
    oldChunk.forEach(chunk => {
        const mesh = chunk.mesh;
        gridChunk.splice(gridChunk.indexOf(chunk), 1);
        gsap.to(mesh.position, { duration: 1, y: -10 });
        gsap.to(mesh.material, { 
            duration: 1, 
            opacity: 0,
            ease: "power4.out",
            onComplete: () => scene.remove(mesh)
        });
    });
}

// Generates parameters for new chunks based on movement direction
function generateNewChunkParameters(directionX, directionY) {
    return [0, 1, 2].map(offset => ({
        gridX: directionX !== 0 ? directionX : offset - 1,
        gridY: directionX !== 0 ? offset - 1 : directionY,
        id: directionX !== 0 ? directionX + 1 + offset * 10 : directionY * 10 + 10 + offset
    }));
}

// Creates and animates new chunks in the scene
function createAndAnimateNewChunks(scene, config, heightData, parameters, gridChunk) {
    const newChunks = parameters.map(({ gridX, gridY, id }) => 
        createTerrainForPosition(config, heightData, { gridX, gridY, opacity: config.opacity.other, id })
    );

    newChunks.forEach(chunk => {
        const mesh = chunk.mesh;
        mesh.position.y = -10;
        mesh.material.opacity = 0;
        scene.add(mesh);
        gridChunk.push(chunk);

        gsap.to(mesh.position, { duration: 1, y: 0, ease: "power4.out" });
        gsap.to(mesh.material, { duration: 1, opacity: config.opacity.other, ease: "power4.out" });
    });

    return newChunks;
}

// Updates positions of remaining chunks after movement
function updateRemainingChunksPositions(gridChunk, oldChunk, newChunks, directionX, directionY, meshStepSize) {
    const remainingChunks = gridChunk.filter(chunk => 
        !oldChunk.includes(chunk) && !newChunks.includes(chunk)
    );

    remainingChunks.forEach(chunk => {
        const mesh = chunk.mesh;
        gsap.to(mesh.position, {
            duration: 1,
            x: mesh.position.x - directionY * meshStepSize,
            z: mesh.position.z - directionX * meshStepSize,
            ease: "power4.out"
        });
    });
}

// Moves chunks in the scene based on direction
export function moveChunk(scene, config, heightData, gridChunk, directionX, directionY = directionX) {
    const { meshStepSize, chunkSize } = {
        meshStepSize: config.scale.plane,
        chunkSize: config.chunkSizes[config.chunkSizeIndex]
    };
    
    updateConfigChunkPosition(config, directionX * chunkSize, directionY * chunkSize);

    const oldChunk = updateChunkIds(gridChunk, directionX, directionY, config);
    animateAndRemoveOldChunks(scene, oldChunk, gridChunk);

    const parameters = generateNewChunkParameters(directionX, directionY);
    const newChunks = createAndAnimateNewChunks(scene, config, heightData, parameters, gridChunk);

    updateRemainingChunksPositions(gridChunk, oldChunk, newChunks, directionX, directionY, meshStepSize);
}

// Handles zooming in and out by updating chunk size
export function handleZoom(config, direction) {
    const oldChunkSize = config.chunkSizes[config.chunkSizeIndex];
    
    config.chunkSizeIndex = THREE.MathUtils.clamp(
        config.chunkSizeIndex + direction,
        0,
        config.chunkSizes.length - 1
    );
    
    const newChunkSize = config.chunkSizes[config.chunkSizeIndex];
    updateConfigChunkPosition(config, oldChunkSize / 2 - newChunkSize / 2);
    console.log(`Chunk size: ${newChunkSize}`);
}
