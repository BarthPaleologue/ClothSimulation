import { LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class Spring {
    indice1: number;
    indice2: number;
    restLength: number;
    Ks: number;
    Kd: number;
    helperMesh: LinesMesh | null = null;

    constructor(indice1: number, indice2: number, restLength: number, Ks: number, Kd: number) {
        this.indice1 = indice1;
        this.indice2 = indice2;
        this.restLength = restLength;
        this.Ks = Ks;
        this.Kd = Kd;
    }

    static FromIndices(indice1: number, indice2: number, positions: Vector3[], Ks: number, Kd: number): Spring {
        const restLength = Vector3.Distance(positions[indice1], positions[indice2]);
        return new Spring(indice1, indice2, restLength, Ks, Kd);
    }
}
