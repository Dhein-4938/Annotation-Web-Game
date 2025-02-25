import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';

export function initScene() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: 'high-performance',
        precision: 'highp'
    });
    
    camera.lookAt(0, 0, 0);
    renderer.setSize(width, height);
    document.getElementById('container').appendChild(renderer.domElement);
    
    return { scene, camera, renderer };
}

export function setupDirectLighting(scene) {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1, 1);
    scene.add(light);
}

export function setupAmbientLighting(scene) {
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);
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
