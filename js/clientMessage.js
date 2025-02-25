import { io } from 'socket.io-client';
import * as THREE from 'three';

export function versionMessage() {
    console.log('THREE version:', THREE.REVISION);
}

export function ConnectionLogger() {
    // Establish WebSocket connection
    const socket = io();

    // Log connection status
    socket.on('connect', () => { console.log('Connected to server'); });
    socket.on('disconnect', () => { console.log('Disconnected from server'); });
}