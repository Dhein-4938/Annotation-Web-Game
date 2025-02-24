import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';

export function initScene(config) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    
    camera.position.set(config.cameraPosition.x, config.cameraPosition.y, config.cameraPosition.z);
    camera.lookAt(0, 0, 0);
    renderer.setSize(width, height);
    document.body.appendChild(renderer.domElement);
    
    return { scene, camera, renderer };
}

export function setupLighting(scene) {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1, 1);
    scene.add(light);
}

export function setupControls(camera, renderer) {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableDamping = true;
    controls.update();
    return controls;
}
