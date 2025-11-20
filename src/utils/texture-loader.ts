import * as THREE from 'three';

import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader";
import { getRenderer } from "../renderer";


export const loadTexture = async (fileName: string): Promise<THREE.Texture> => {
    // adds some reflections
    const renderer = getRenderer();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const hdrEquirect = await new HDRLoader().loadAsync(`textures/${fileName}`);
    const texture = pmremGenerator.fromEquirectangular(hdrEquirect).texture;

    // cleanup raw texture and generator
    hdrEquirect.dispose?.();
    pmremGenerator.dispose();
    return texture;
};