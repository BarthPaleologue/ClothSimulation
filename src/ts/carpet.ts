import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Spring } from "./spring";
import { Scene } from "@babylonjs/core/scene";
import { createProceduralPlaneData } from "./proceduralPlane";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { drawLine, drawPoint, updateLine, updatePoint } from "./helper";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";

import albedoColor from "../assets/carpet.jpg"; //"../assets/carpet/fabrics_0077_color_1k.jpg";
import normalMap from "../assets/carpet/fabrics_0077_normal_directx_1k.png";
import roughnessMap from "../assets/carpet/fabrics_0077_roughness_1k.jpg";

import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";

export class Carpet {
    mesh: Mesh;
    vertexData: VertexData;

    private readonly springs: Spring[] = [];

    private readonly positions: Vector3[] = [];
    private readonly velocities: Vector3[] = [];

    private readonly forces: Vector3[] = [];

    private readonly fixedIndices: number[] = [];
    private readonly fixedPointsHelper: Mesh[] = [];
    private fixedPointEnabled = true;

    private spherePosition: Vector3 = new Vector3(0, 0, 0);
    private sphereRadius = 1;

    private nbSubdivisions = 20;
    private size = 10;

    private readonly mass = 1;

    private readonly DEFAULT_DAMPING = 60;

    private readonly STRUCTURAL_KS = 500;
    private readonly STRUCTURAL_KD = 0.5;

    private readonly SHEAR_KS = 500;
    private readonly SHEAR_KD = 0.5;
    private readonly BEND_KS = 500;
    private readonly BEND_KD = 0.5;

    private clock = 0;

    constructor(scene: Scene) {
        this.mesh = new Mesh("carpet", scene);

        this.vertexData = createProceduralPlaneData(this.nbSubdivisions, this.size);

        this.vertexData.applyToMesh(this.mesh);
        this.mesh.createNormals(true);

        const positions = this.vertexData.positions;
        if (positions === null) throw new Error("positions is null");

        for (let i = 0; i < positions.length; i += 3) {
            this.positions.push(new Vector3(positions[i], positions[i + 1], positions[i + 2]));
            this.velocities.push(Vector3.Zero());
            this.forces.push(Vector3.Zero());
        }

        this.fixedIndices.push(0);
        //this.fixedPointsHelper.push(drawPoint(this.positions[0], new Color3(1, 0, 0), scene));
        this.fixedIndices.push(this.nbSubdivisions - 1);
        //this.fixedPointsHelper.push(drawPoint(this.positions[this.nbSubdivisions - 1], new Color3(1, 0, 0), scene));

        // add first row of fixed points
        /*for (let i = 0; i < this.nbSubdivisions; i++) {
            this.fixedIndices.push(i);
            this.fixedPointsHelper.push(drawPoint(this.positions[i], new Color3(1, 0, 0), scene));
        }*/

        const diffuseTexture = new Texture(albedoColor, scene);
        diffuseTexture.uScale = 2;
        diffuseTexture.vScale = 2;

        const bumpTexture = new Texture(normalMap, scene);
        bumpTexture.uScale = 2;
        bumpTexture.vScale = 2;

        const roughnessTexture = new Texture(roughnessMap, scene);
        roughnessTexture.uScale = 2;
        roughnessTexture.vScale = 2;

        const matPBR = new PBRMaterial("matpbrCarpet", scene);
        matPBR.metallicTexture = roughnessTexture;
        matPBR.useRoughnessFromMetallicTextureGreen = true;
        matPBR.albedoTexture = diffuseTexture;
        //matPBR.roughness = 0.5;
        matPBR.bumpTexture = bumpTexture;
        matPBR.backFaceCulling = false;

        this.mesh.material = matPBR;

        this.createSprings();
    }

    private createSprings() {
        const indices = this.vertexData.indices;
        if (indices === null) throw new Error("indices is null");

        const positions = this.vertexData.positions;
        if (positions === null) throw new Error("positions is null");

        // horizontal springs
        for (let x = 0; x < this.nbSubdivisions; x++) {
            for (let y = 0; y < this.nbSubdivisions - 1; y++) {
                const horizontalSpring = Spring.FromIndices(x * this.nbSubdivisions + y, x * this.nbSubdivisions + y + 1, this.positions, this.STRUCTURAL_KS, this.STRUCTURAL_KD);
                this.springs.push(horizontalSpring);
            }
        }

        // vertical springs
        for (let x = 0; x < this.nbSubdivisions - 1; x++) {
            for (let y = 0; y < this.nbSubdivisions; y++) {
                const verticalSpring = Spring.FromIndices(x * this.nbSubdivisions + y, (x + 1) * this.nbSubdivisions + y, this.positions, this.STRUCTURAL_KS, this.STRUCTURAL_KD);
                this.springs.push(verticalSpring);
            }
        }

        // shear springs
        for (let x = 0; x < this.nbSubdivisions - 1; x++) {
            for (let y = 0; y < this.nbSubdivisions - 1; y++) {
                const shearSpring1 = Spring.FromIndices(x * this.nbSubdivisions + y, (x + 1) * this.nbSubdivisions + y + 1, this.positions, this.SHEAR_KS, this.SHEAR_KD);
                this.springs.push(shearSpring1);

                const shearSpring2 = Spring.FromIndices((x + 1) * this.nbSubdivisions + y, x * this.nbSubdivisions + y + 1, this.positions, this.SHEAR_KS, this.SHEAR_KD);
                this.springs.push(shearSpring2);
            }
        }

        // bend springs
        for (let x = 0; x < this.nbSubdivisions; x++) {
            for (let y = 0; y < (this.nbSubdivisions - 2); y++) {
                const bendSpring1 = Spring.FromIndices(x * this.nbSubdivisions + y, x * this.nbSubdivisions + y + 2, this.positions, this.BEND_KS, this.BEND_KD);
                this.springs.push(bendSpring1);
            }
            const bendSpring2 = Spring.FromIndices((x + 1) * this.nbSubdivisions - 3, (x + 1) * this.nbSubdivisions - 1, this.positions, this.BEND_KS, this.BEND_KD);
            this.springs.push(bendSpring2);
        }
        for (let x = 0; x < this.nbSubdivisions; x++) {
            for (let y = 0; y < this.nbSubdivisions - 2; y++) {
                const bendSpring3 = Spring.FromIndices(y * this.nbSubdivisions + x, (y + 2) * this.nbSubdivisions + x, this.positions, this.BEND_KS, this.BEND_KD);
                this.springs.push(bendSpring3);
            }
            const bs4Index1 = (this.nbSubdivisions - 3) * this.nbSubdivisions + x;
            const bs4Index2 = (this.nbSubdivisions - 1) * this.nbSubdivisions + x;

            const bendSpring4 = Spring.FromIndices(bs4Index1, bs4Index2, this.positions, this.BEND_KS, this.BEND_KD);
            this.springs.push(bendSpring4);
        }
    }

    private computeForces() {
        for (let i = 0; i < this.forces.length; i++) {
            // reset forces
            this.forces[i].scaleInPlace(0);

            // gravity
            this.forces[i].addInPlace(new Vector3(0, -9.81 * this.mass, 0));

            // damping
            this.forces[i].subtract(this.velocities[i].scale(this.DEFAULT_DAMPING));
        }

        for (const spring of this.springs) {
            const pointA = this.positions[spring.indice1];
            const pointB = this.positions[spring.indice2];

            const velocityA = this.velocities[spring.indice1];
            const velocityB = this.velocities[spring.indice2];

            const deltaP = pointA.subtract(pointB);
            const deltaV = velocityA.subtract(velocityB);

            const distance = deltaP.length();

            const leftTerm = -spring.Ks * (distance - spring.restLength);
            const rightTerm = -spring.Kd * Vector3.Dot(deltaV, deltaP) / distance;
            const springForce = deltaP.normalize().scale(leftTerm + rightTerm);

            this.forces[spring.indice1].addInPlace(springForce);
            this.forces[spring.indice2].subtractInPlace(springForce);
        }
    }

    private integrateEuler(deltaTime: number) {
        for (let i = 0; i < this.positions.length; i++) {
            if (this.fixedIndices.includes(i) && this.fixedPointEnabled) continue;
            this.velocities[i].addInPlace(this.forces[i].scale(deltaTime / this.mass));
            this.positions[i].addInPlace(this.velocities[i].scale(deltaTime));
        }
    }

    private applyProvotDynamicRelaxation() {
        for (let i = 0; i < this.springs.length; i++) {
            const spring = this.springs[i];

            const pointA = this.positions[spring.indice1];
            const pointB = this.positions[spring.indice2];

            const distance = Vector3.Distance(pointA, pointB);

            if (distance < spring.restLength) continue;

            const delta = distance - spring.restLength;

            let pointAWeight = 1 / 2;
            let pointBWeight = 1 / 2;

            if (this.fixedIndices.includes(spring.indice1) && this.fixedPointEnabled) {
                pointAWeight = 0;
                pointBWeight = 1;
            }

            if (this.fixedIndices.includes(spring.indice2) && this.fixedPointEnabled) {
                pointAWeight = 1;
                pointBWeight = 0;
            }

            const pointAOffset = pointB.subtract(pointA).normalize().scaleInPlace(delta * pointAWeight);
            const pointBOffset = pointA.subtract(pointB).normalize().scaleInPlace(delta * pointBWeight);

            this.positions[spring.indice1].addInPlace(pointAOffset);
            this.positions[spring.indice2].addInPlace(pointBOffset);
        }
    }

    private applyCollisions() {
        for (let i = 0; i < this.positions.length; i++) {

            const positionW = this.positions[i].add(this.mesh.position);

            // collision with ground plane
            if (positionW.y < 0.01) {
                this.positions[i].y = -this.mesh.position.y + 0.01;
                this.velocities[i].y = 0;
                this.velocities[i].scaleInPlace(0.9);
            }

            // collision with sphere
            const distance = Vector3.Distance(positionW, this.spherePosition);

            if (distance < this.sphereRadius + 0.3) {
                const normal = positionW.subtract(this.spherePosition).normalize();

                const penetration = this.sphereRadius - distance;

                this.positions[i].addInPlace(normal.scale(penetration + 0.3));
                this.velocities[i].addInPlace(normal.scale(-Vector3.Dot(this.velocities[i], normal)));
                this.velocities[i].scaleInPlace(0.9);
            }
        }
    }

    public registerSphereData(position: Vector3, radius: number) {
        this.spherePosition = position;
        this.sphereRadius = radius;
    }

    private updateHelperMeshes() {
        if (!(this.mesh.material as StandardMaterial).wireframe) return;

        // springs
        for (let i = 0; i < this.springs.length; i++) {
            const spring = this.springs[i];

            if (spring.helperMesh === null) continue;

            const pointA = this.positions[spring.indice1].add(this.mesh.position);
            const pointB = this.positions[spring.indice2].add(this.mesh.position);

            updateLine(spring.helperMesh, pointA, pointB);
        }

        if (!this.fixedPointEnabled) return;

        // fixed points
        for (let i = 0; i < this.fixedIndices.length; i++) {
            const index = this.fixedIndices[i];
            const point = this.positions[index].add(this.mesh.position);

            if (this.fixedPointsHelper[i]) updatePoint(this.fixedPointsHelper[i], point);
        }
    }

    private updateMesh() {
        const positions = this.vertexData.positions;
        if (positions === null) throw new Error("positions is null");

        // compute barycenter of new positions then translate all points to barycenter then update mesh
        /*const barycenter = Vector3.Zero();
        for (let i = 0; i < this.positions.length; i++) {
            barycenter.addInPlace(this.positions[i]);
        }
        barycenter.scaleInPlace(1 / this.positions.length);

        for (let i = 0; i < this.positions.length; i++) {
            this.positions[i].subtractInPlace(barycenter);
        }

        for (let i = 0; i < positions.length; i += 3) {
            positions[i] = this.positions[i / 3].x;
            positions[i + 1] = this.positions[i / 3].y;
            positions[i + 2] = this.positions[i / 3].z;
        }

        this.mesh.position.addInPlace(barycenter);*/

        for (let i = 0; i < positions.length; i += 3) {
            positions[i] = this.positions[i / 3].x;
            positions[i + 1] = this.positions[i / 3].y;
            positions[i + 2] = this.positions[i / 3].z;
        }

        const normals: number[] = [];
        VertexData.ComputeNormals(positions, this.mesh.getIndices(), normals, { useRightHandedSystem: true });
        this.mesh.setVerticesData(VertexBuffer.NormalKind, normals);
        this.mesh.setVerticesData(VertexBuffer.PositionKind, positions);
    }

    private moveFixedPoints() {
        for (let i = 0; i < this.fixedIndices.length; i++) {
            const index = this.fixedIndices[i];

            this.positions[index].copyFromFloats(
                Math.sin(this.clock * 0.5) * 10,
                3,
                this.size * i - this.size / 2
            );
        }
    }


    update(deltaTime: number) {
        this.clock += deltaTime;

        if (this.fixedPointEnabled) this.moveFixedPoints();

        this.computeForces();

        this.integrateEuler(deltaTime);

        this.applyProvotDynamicRelaxation();

        this.applyCollisions();

        this.updateHelperMeshes();

        this.updateMesh();
    }

    toggleWireframe() {
        (this.mesh.material as StandardMaterial).wireframe = !(this.mesh.material as StandardMaterial).wireframe;

        for (let i = 0; i < this.springs.length; i++) {
            const spring = this.springs[i];

            if (spring.helperMesh === null) continue;

            spring.helperMesh.setEnabled(!(spring.helperMesh.isEnabled()));
        }
    }

    reset() {
        this.vertexData = createProceduralPlaneData(this.nbSubdivisions, this.size);

        this.vertexData.applyToMesh(this.mesh);

        const positions = this.vertexData.positions;
        if (positions === null) throw new Error("positions is null");

        for (let i = 0; i < positions.length; i += 3) {
            this.positions[i / 3].copyFromFloats(positions[i], positions[i + 1], positions[i + 2]);
        }

        for (let i = 0; i < this.positions.length; i++) {
            this.velocities[i].copyFromFloats(0, 0, 0);
        }
    }

    toggleFixedPoints() {
        this.fixedPointEnabled = !this.fixedPointEnabled;

        for (let i = 0; i < this.fixedPointsHelper.length; i++) {
            if (this.fixedPointsHelper[i]) this.fixedPointsHelper[i].setEnabled(this.fixedPointEnabled);
        }

        this.reset();
    }
}
