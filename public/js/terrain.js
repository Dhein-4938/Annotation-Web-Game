import * as THREE from "three";

export function createTerrainMesh(geometry) {
    const material = new THREE.MeshPhongMaterial({
        color: 0x808080,
        wireframe: false,
        side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
}

export function updateGeometryHeights(geometry, config, heightData) {
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
        const dataX = Math.floor(position.x + row);
        const dataY = Math.floor(position.y + col);
        
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

export async function loadHeightData(url) {
    try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const dataView = new DataView(buffer);
        const rows = dataView.getUint32(0, true);
        const cols = dataView.getUint32(4, true);
        const heightData = Array.from({ length: rows }, (_, i) =>
            Array.from({ length: cols }, (_, j) =>
                dataView.getFloat32(8 + (i * cols + j) * 4, true)
            )
        );
        return { heightData, rows, cols };
    } catch (error) {
        console.error('Error loading height data:', error);
        return { heightData: [], rows: 0, cols: 0 };
    }
}

export function createTerrainGeometry(config, rows, cols) {
    const chunkSize = config.chunkSizes[config.chunkSizeIndex];
    const plane = config.scale.plane;
    const geometry = new THREE.PlaneGeometry(plane * rows, plane * cols, chunkSize * rows - 1, chunkSize * cols - 1);
    return geometry;
}
