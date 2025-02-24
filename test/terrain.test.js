import assert from 'assert';
import { generateTerrainChunks, createTerrainGeometry, updateGeometryHeights } from '../public/js/terrain.js';

describe('generateTerrainChunks', function() {
  it('should return an array of terrain chunks', function() {
    const config = {
      chunkSizes: [10, 20, 50],
      scale: { height: 20, plane: 10 },
      moveStepScale: 0.25,
      cameraPosition: { x: -5, y: 5, z: 0 },
      opacity: { center: 1.0, other: 0.3 },
      animationDuration: 300,
    };
    const data = {
      heightData: Array(10000).fill(10),
      mapSize: { width: 100, height: 100 },
      gridChunk: [],
      chunkPosition: { x: 200.0, y: 200.0 },
      meshPosition: { x: 0, y: 0, z: 0 },
      chunkSizeIndex: 0,
    };

    const result = generateTerrainChunks(config, data);
    assert(Array.isArray(result), 'Expected result to be an array');
  });

  it('should generate chunks with correct opacity', function() {
    const config = {
      chunkSizes: [10, 20, 50],
      scale: { height: 20, plane: 10 },
      moveStepScale: 0.25,
      cameraPosition: { x: -5, y: 5, z: 0 },
      opacity: { center: 1.0, other: 0.3 },
      animationDuration: 300,
    };
    const data = {
      heightData: Array(10000).fill(10),
      mapSize: { width: 100, height: 100 },
      gridChunk: [],
      chunkPosition: { x: 200.0, y: 200.0 },
      meshPosition: { x: 0, y: 0, z: 0 },
      chunkSizeIndex: 0,
    };

    const result = generateTerrainChunks(config, data);
    assert.strictEqual(result[4].mesh.material.opacity, 1.0, 'Expected center chunk to have opacity 1.0');
    assert.strictEqual(result[0].mesh.material.opacity, 0.3, 'Expected other chunks to have opacity 0.3');
  });

  it('should handle empty height data gracefully', function() {
    const config = {
      chunkSizes: [10, 20, 50],
      scale: { height: 20, plane: 10 },
      moveStepScale: 0.25,
      cameraPosition: { x: -5, y: 5, z: 0 },
      opacity: { center: 1.0, other: 0.3 },
      animationDuration: 300,
    };
    const data = {
      heightData: [],
      mapSize: { width: 0, height: 0 },
      gridChunk: [],
      chunkPosition: { x: 200.0, y: 200.0 },
      meshPosition: { x: 0, y: 0, z: 0 },
      chunkSizeIndex: 0,
    };

    const result = generateTerrainChunks(config, data);
    assert(Array.isArray(result), 'Expected result to be an array');
    assert.strictEqual(result.length, 9, 'Expected 9 chunks to be generated');
  });
});