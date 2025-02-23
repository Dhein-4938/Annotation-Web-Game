import * as THREE from "three";

export function createTerrainMesh(geometry, opacity = 1) {
    const material = new THREE.MeshPhongMaterial({
        color: 0x808080,
        wireframe: false,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: opacity
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
}

export function updateGeometryHeights(geometry, config, heightData, position) {
    const vertices = geometry.attributes.position.array;
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

export function createTerrainGeometry(config, rows=1, cols=1) {
    const chunkSize = config.chunkSizes[config.chunkSizeIndex];
    const geometry = new THREE.PlaneGeometry(
        config.scale.plane * rows, 
        config.scale.plane * cols, 
        chunkSize * rows - 1, 
        chunkSize * cols - 1);

    return geometry;
}

export function generateTerrainChunks(config, heightData, gridProperties=null) {
    const properties = gridProperties 
        ? [{ gridX: gridProperties.x, 
             gridY: gridProperties.y, 
             opacity: gridProperties.opacity }]
        : [
            { gridX:-1, gridY:-1, opacity: 0.3}, { gridX:-1, gridY: 0, opacity: 0.3 }, { gridX:-1, gridY: 1, opacity: 0.3 },
            { gridX: 0, gridY:-1, opacity: 0.3}, { gridX: 0, gridY: 0, opacity: 1.0 }, { gridX: 0, gridY: 1, opacity: 0.3 },
            { gridX: 1, gridY:-1, opacity: 0.3}, { gridX: 1, gridY: 0, opacity: 0.3 }, { gridX: 1, gridY: 1, opacity: 0.3 }
          ];
    
    return properties.map(prop => {
        return createTerrainForPosition(
            config, 
            heightData, 
            { gridX: prop.gridX, gridY: prop.gridY }, 
            prop.opacity
        );
    });
}

export function createTerrainForPosition(config, heightData, position, opacity = 0.3) {
    const chunkSize = config.chunkSizes[config.chunkSizeIndex];
    const geometry = createTerrainGeometry(config);
    
    updateGeometryHeights(geometry, config, heightData, {
        x: config.chunkPosition.x + position.gridX * chunkSize,
        y: config.chunkPosition.y + position.gridY * chunkSize
    });
    
    const mesh = createTerrainMesh(geometry, opacity);
    mesh.position.set(
        position.gridY * config.scale.plane,
        0,
        position.gridX * config.scale.plane
    );
    return mesh;
}