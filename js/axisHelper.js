import * as THREE from "three";

export function createAxisHelper(scene) {
    const axisHelper = new THREE.AxesHelper(1000);
    axisHelper.position.set(0, 0, 0);
    axisHelper.rotation.set(0, 0, 0);
    scene.add(axisHelper);
}
