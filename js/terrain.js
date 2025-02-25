import * as THREE from "three";

export function indexToXYMap(maxIndex) {
    const size = Math.sqrt(maxIndex);
    return Array.from({length: maxIndex}, (_, i) => ({
        x: (i % size) / size * 2 - 1,
        y: Math.floor(i / size) / size * 2 - 1
    }));
}

export function createTerrainGeometry(config, data, rows=1, cols=1) {
    const chunkSize = config.chunkSizes[data.chunkSizeIndex];
    const geometry = new THREE.PlaneGeometry(
        config.scale.plane * rows, 
        config.scale.plane * cols, 
        chunkSize * rows - 1, 
        chunkSize * cols - 1);

    return geometry;
}

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

export function createTerrainChunks(config, data, gridProperties=null) {
    const otherOpacity = config.opacity.other;
    const centerOpacity = config.opacity.center;
    const properties = gridProperties 
        ? [{ gridX: gridProperties.x, 
             gridY: gridProperties.y, 
             opacity: gridProperties.opacity,
             id: gridProperties.id }]
        : [
            { gridX:-1, gridY: 1, opacity: otherOpacity, id:20 }, { gridX: 0, gridY: 1, opacity:  otherOpacity, id:21 }, { gridX: 1, gridY: 1, opacity: otherOpacity, id:22 },
            { gridX:-1, gridY: 0, opacity: otherOpacity, id:10 }, { gridX: 0, gridY: 0, opacity: centerOpacity, id:11 }, { gridX: 1, gridY: 0, opacity: otherOpacity, id:12 },
            { gridX:-1, gridY:-1, opacity: otherOpacity, id: 0 }, { gridX: 0, gridY:-1, opacity:  otherOpacity, id: 1 }, { gridX: 1, gridY:-1, opacity: otherOpacity, id: 2 }
          ];
    
    return properties.map(prop => {
        return createTerrainChunkAtPosition(
            config, 
            data, 
            { gridX: prop.gridX, gridY: prop.gridY, opacity: prop.opacity , id: prop.id }
        );
    });
}

export function createTerrainChunkAtPosition(config, data, properties) {
    const chunkSize = config.chunkSizes[data.chunkSizeIndex];
    const plane = config.scale.plane;
    const geometry = createTerrainGeometry(config, data);
    const {gridX, gridY, opacity, id} = properties;
    
    updateGeometryHeights(geometry, config, data, {
        x: data.chunkPosition.x + gridX * chunkSize,
        y: data.chunkPosition.y + gridY * chunkSize
    });
    
    const mesh = createTerrainMesh(geometry, opacity);
    mesh.position.set( gridY * plane, 0, gridX * plane );
    return { mesh: mesh, id: id };
}

export function updateGeometryHeights(geometry, config, data, position) {
    const vertices = geometry.attributes.position.array;
    const chunkSize = config.chunkSizes[data.chunkSizeIndex];
    const totalVertices = chunkSize * chunkSize;
    const heightData = data.heightData;
    const scale = config.scale.height;
    const posX = position.x;
    const posY = position.y;
    
    for (let i = 0; i < totalVertices; i++) {
        const dataX = Math.floor(posX + (i / chunkSize));
        const dataY = Math.floor(posY + (i % chunkSize));
        const vertexIndex = i * 3 + 2;
        
        if (heightData[dataX] && heightData[dataX][dataY] !== undefined) {
            vertices[vertexIndex] = heightData[dataX][dataY] * scale;
        } else {
            vertices[vertexIndex] = 0;
        }
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


