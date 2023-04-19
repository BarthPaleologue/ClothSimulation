import { Scene } from "@babylonjs/core/scene";
import { Cloth } from "./cloth";
import { createProceduralPlaneData } from "./proceduralPlane";

import albedoColor from "../assets/carpet.jpg"; //"../assets/carpet/fabrics_0077_color_1k.jpg";
import normalMap from "../assets/carpet/fabrics_0077_normal_directx_1k.png";
import roughnessMap from "../assets/carpet/fabrics_0077_roughness_1k.jpg";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";


export class Carpet extends Cloth {
    static readonly nbSubdivisions = 20;
    static readonly size = 10;

    constructor(scene: Scene) {
        super(createProceduralPlaneData(Carpet.nbSubdivisions, Carpet.size), scene);

        this.fixedIndices.push(0);
        this.fixedIndices.push(Carpet.nbSubdivisions - 1);

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
    }
}