import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Helpers/sceneHelpers";
import "@babylonjs/core/Misc/screenshotTools";

import { Tools } from "@babylonjs/core/Misc/tools";

import "../styles/index.scss";

import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Carpet } from "./carpet";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas);

engine.displayLoadingUI();

const scene = new Scene(engine);
scene.createDefaultEnvironment({ skyboxSize: 100, groundYBias: 1, groundShadowLevel: 0.5, enableGroundShadow: true, groundSize: 50 });
scene.executeWhenReady(() => {
    engine.hideLoadingUI();
});

const camera = new ArcRotateCamera("camera", -0.8, 1.2, 25, new Vector3(0, 1, 0), scene);
camera.attachControl();
camera.lowerRadiusLimit = 3;
camera.upperRadiusLimit = 30;

const light = new DirectionalLight("light", new Vector3(0, 5, 10).negate().normalize(), scene);
light.position = new Vector3(0, 5, 10);

const shadowGenerator = new ShadowGenerator(1024, light);

const carpet = new Carpet(scene);
carpet.mesh.position.y = 7;
carpet.mesh.receiveShadows = true;
shadowGenerator.addShadowCaster(carpet.mesh);

let sphereRadius = 1;
const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2 }, scene);
sphere.scaling = Vector3.One().scale(sphereRadius);
sphere.position = new Vector3(0, sphereRadius, 0);
sphere.receiveShadows = true;
shadowGenerator.addShadowCaster(sphere);

const sphereMat = new PBRMaterial("sphereMat", scene);
sphereMat.metallic = 0.0;
sphereMat.roughness = 0.5;
sphereMat.albedoColor = new Color3(1, 1, 1);
sphere.material = sphereMat;

let isPaused = false;

let clock = 0;

function updateScene() {
    if (isPaused) return;

    // move the sphere in periodic motion
    const orbitRadius = Math.sin(clock) * 2;
    sphere.position.x = orbitRadius * Math.cos(clock);
    sphere.position.z = orbitRadius * Math.sin(clock);
    //sphere.position.x = -sphereRadius + 2 * Math.sin(clock);
    //sphere.position.y = 0.5 + 0.5 * Math.sin(clock * 2) + sphereRadius;

    carpet.registerSphereData(sphere.position, sphereRadius);

    const deltaTime = 1 / 60;
    clock += deltaTime;

    carpet.update(deltaTime);
}

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    scene.registerBeforeRender(() => updateScene());
    engine.runRenderLoop(() => scene.render());
});

window.addEventListener("resize", () => {
    engine.resize();
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

window.addEventListener("keydown", (event) => {
    if (event.key === " ") {
        isPaused = !isPaused;
    }
    if (event.key === "w") {
        carpet.toggleWireframe();
    }
    if (event.key === "-") {
        sphereRadius -= 0.1;
        sphere.scaling = Vector3.One().scale(sphereRadius);
    }
    if (event.key === "+") {
        sphereRadius += 0.1;
        sphere.scaling = Vector3.One().scale(sphereRadius);
    }
    if (event.key === "r") {
        carpet.reset();
    }
    if (event.key === "f") {
        carpet.toggleFixedPoints();
    }
    if (event.key === "p") {
        Tools.CreateScreenshot(engine, camera, { precision: 2 });
    }
});
