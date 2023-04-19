import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";

export function drawLine(pointA: Vector3, pointB: Vector3, color: Color3, scene: Scene) {
    const line = MeshBuilder.CreateLines("line", { points: [pointA, pointB] }, scene);
    line.color = color;
    return line;
}

export function drawEmptyLine(color: Color3, scene: Scene) {
    const line = MeshBuilder.CreateLines("line", { points: [Vector3.Zero(), Vector3.Zero()] }, scene);
    line.color = color;
    return line;
}

export function updateLine(line: LinesMesh, pointA: Vector3, pointB: Vector3) {
    line.setVerticesData("position", [pointA.x, pointA.y, pointA.z, pointB.x, pointB.y, pointB.z]);
}

export function drawPoint(point: Vector3, color: Color3, scene: Scene) {
    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 0.5 }, scene);
    sphere.position = point;

    const material = new StandardMaterial("material", scene);
    material.emissiveColor = color;
    material.disableLighting = true;
    sphere.material = material;

    return sphere;
}

export function updatePoint(point: Mesh, position: Vector3) {
    point.position = position;
}