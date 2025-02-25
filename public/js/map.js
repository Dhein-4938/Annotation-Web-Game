import { initScene, setupDirectLighting, setupControls } from './sceneSetup.js';
import { loadHeightData, createTerrainChunks } from './terrain.js';
import { handleWindowResize, handleMovement, handleButtonMovement } from './eventHandlers.js';
import { updateChunkLocationDisplay } from './movement.js';
import { ConnectionLogger, versionMessage } from './clientMessage.js';

versionMessage();
ConnectionLogger();

export function initializeMap(config, data, heightDataPath) {
    const { scene, camera, renderer } = initScene();
    camera.position.set(config.cameraPosition.x, config.cameraPosition.y, config.cameraPosition.z);
    const controls = setupControls(camera, renderer);
    setupDirectLighting(scene);

    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.style.display = 'flex';

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
        controls.update();
    }
    
    loadHeightData(heightDataPath).then(({ heightData, rows, cols }) => {
        data.heightData = heightData;
        data.mapSize.width = rows;
        data.mapSize.height = cols;

        data.gridChunk.forEach(chunk => scene.remove(chunk.mesh));
        data.gridChunk = createTerrainChunks(config, data);
        data.gridChunk.forEach(chunk => scene.add(chunk.mesh));
        controls.update();
        updateChunkLocationDisplay(data);
        loadingOverlay.style.display = 'none';
        animate();
    });

    window.addEventListener('resize', () => handleWindowResize(camera, renderer), false);

    document.addEventListener('keydown', (event) => {
        handleMovement(config, data, scene, event.key);
    });

    const buttons = ['up', 'down', 'left', 'right'];
    buttons.forEach(direction => {
        const button = document.getElementById(`move-${direction}`);
        button.addEventListener('click', () => handleButtonMovement(config, data, scene, direction));
    });
}
