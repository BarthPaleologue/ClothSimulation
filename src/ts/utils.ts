import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";

export function cloneVertexData(vertexData: VertexData) {
    if (!vertexData.positions) throw new Error("VertexData.positions is undefined");
    if (!vertexData.indices) throw new Error("VertexData.indices is undefined");
    if (!vertexData.normals) throw new Error("VertexData.normals is undefined");
    if (!vertexData.uvs) throw new Error("VertexData.uvs is undefined");

    const clonedVertexData = new VertexData();
    clonedVertexData.positions = vertexData.positions.slice();
    clonedVertexData.indices = vertexData.indices.slice();
    clonedVertexData.normals = vertexData.normals.slice();
    clonedVertexData.uvs = vertexData.uvs.slice();
    return clonedVertexData;
}