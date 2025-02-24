import * as THREE from "three";
import gsap from "gsap";
import { createTerrainForPosition, generateTerrainChunks } from './terrain.js';

// Updates the display of the current chunk location
export function updateChunkLocationDisplay(data) {
    const chunkLocationElement = document.getElementById('chunk-location');
    chunkLocationElement.textContent = `Chunk: (${data.chunkPosition.x.toFixed(2)}, ${data.chunkPosition.y.toFixed(2)})`;
}

// Updates the chunk position in the configuration
function adjustChunkPosition(data, directions, stepSize) {
    const { directionX, directionY } = directions;
    const dx = directionX * stepSize;
    const dy = directionY * stepSize;
    data.chunkPosition.x = THREE.MathUtils.clamp(data.chunkPosition.x + dx, 0, data.mapSize.width);
    data.chunkPosition.y = THREE.MathUtils.clamp(data.chunkPosition.y + dy, 0, data.mapSize.height);    
}

// Updates the chunk IDs based on movement direction and returns old chunks
function updateChunkIds(config, data, directions) {
    const { directionX, directionY } = directions;
    const oldChunk = [];
    data.gridChunk.forEach(chunk => {
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
function fadeOutOldChunks(config, data, scene, oldChunk) {
    oldChunk.forEach(chunk => {
        const mesh = chunk.mesh;
        data.gridChunk.splice(data.gridChunk.indexOf(chunk), 1);
        gsap.to(mesh.material, { 
            duration: config.animationDuration / 1000, 
            opacity: 0,
            ease: "power4.out",
            onComplete: () => scene.remove(mesh)
        });
    });
}

// Generates parameters for new chunks based on movement direction
function generateNewChunkParameters(directions) {
    const { directionX, directionY } = directions;
    return [0, 1, 2].map(offset => ({
        gridX: directionX !== 0 ? directionX : offset - 1,
        gridY: directionX !== 0 ? offset - 1 : directionY,
        id: directionX !== 0 ? directionX + 1 + offset * 10 : directionY * 10 + 10 + offset
    }));
}

// Creates and animates new chunks in the scene
function fadeInNewChunks(scene, config, data, directions) {
    const { directionX, directionY } = directions;
    const meshStepSize = config.scale.plane;
    const parameters = generateNewChunkParameters(directions);
    
    const newChunks = parameters.map(({ gridX, gridY, id }) => 
        createTerrainForPosition(config, data, { gridX, gridY, opacity: config.opacity.other, id })
    );

    newChunks.forEach(chunk => {
        const mesh = chunk.mesh;
        mesh.material.opacity = 0;
        // Shift the mesh towards the direction to compensate for the movement
        mesh.position.x += directionY * meshStepSize,
        mesh.position.z += directionX * meshStepSize,
        scene.add(mesh);
        data.gridChunk.push(chunk);
        gsap.to(mesh.material, { 
            duration: config.animationDuration / 1000, 
            opacity: config.opacity.other, 
            ease: "power1.out" });
    });
}

// Updates positions of remaining chunks after movement
function animateGridChunks(config, data, directions) {
    const { directionX, directionY } = directions;
    const meshStepSize = config.scale.plane;

    data.gridChunk.forEach(chunk => {
        const mesh = chunk.mesh;
        gsap.to(mesh.position, {
            duration: config.animationDuration / 1000,
            x: mesh.position.x - directionY * meshStepSize,
            z: mesh.position.z - directionX * meshStepSize,
            ease: "power4.out"
        });
    });
}

// Moves chunks in the scene based on direction
export function moveChunk(scene, config, data, directionX, directionY) {
    const directions = { directionX, directionY }; // Ensure correct keys
    const chunkSize = config.chunkSizes[data.chunkSizeIndex];
    
    adjustChunkPosition(data, directions, chunkSize);
    const oldChunk = updateChunkIds(config, data, directions);

    fadeInNewChunks(scene, config, data, directions);
    
    animateGridChunks(config, data, directions);
    fadeOutOldChunks(config, data, scene, oldChunk);
}

// Handles zooming in and out by updating chunk size
export function handleZoom(config, data, scene, zoomIncrement) {
    const oldChunkSize = config.chunkSizes[data.chunkSizeIndex];
    
    data.chunkSizeIndex = THREE.MathUtils.clamp(
        data.chunkSizeIndex + zoomIncrement,
        0,
        config.chunkSizes.length - 1
    );
    
    const newChunkSize = config.chunkSizes[data.chunkSizeIndex];
    data.chunkPosition.x += (oldChunkSize - newChunkSize) / 2;
    data.chunkPosition.y += (oldChunkSize - newChunkSize) / 2;

    data.gridChunk.forEach(chunk => scene.remove(chunk.mesh));
    data.gridChunk = generateTerrainChunks(config, data);
    data.gridChunk.forEach(chunk => scene.add(chunk.mesh));
    updateChunkLocationDisplay(data);
    console.log(`Chunk size: ${newChunkSize}`);
}
