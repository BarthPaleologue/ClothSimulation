import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";

export function createProceduralPlaneData(nbSubdivisions: number, size: number): VertexData {
    const positions = new Float32Array(nbSubdivisions * nbSubdivisions * 3);
    const indices = new Uint32Array((nbSubdivisions - 1) * (nbSubdivisions - 1) * 3 * 2);
    const uvs = new Float32Array(nbSubdivisions * nbSubdivisions * 2);
    const normals = new Float32Array(nbSubdivisions * nbSubdivisions * 3);

    for (let x = 0; x < nbSubdivisions; x++) {
        const xPosition = (x / nbSubdivisions) * size - size / 2;
        const xUV = x / nbSubdivisions;

        for (let z = 0; z < nbSubdivisions; z++) {
            const zPosition = (z / nbSubdivisions) * size - size / 2;
            const zUV = z / nbSubdivisions;

            const positionIndex = 3 * (x * nbSubdivisions + z);
            positions[positionIndex] = xPosition;
            positions[positionIndex + 1] = 0;
            positions[positionIndex + 2] = zPosition;

            const normalIndex = 3 * (x * nbSubdivisions + z);
            normals[normalIndex] = 0;
            normals[normalIndex + 1] = 1;
            normals[normalIndex + 2] = 0;

            const uvIndex = 2 * (x * nbSubdivisions + z);
            uvs[uvIndex] = xUV;
            uvs[uvIndex + 1] = zUV;

            if (x === nbSubdivisions - 1 || z === nbSubdivisions - 1) continue;

            const index = 6 * (x * (nbSubdivisions - 1) + z);
            indices[index] = (x + 1) * nbSubdivisions + z;
            indices[index + 1] = x * nbSubdivisions + z;
            indices[index + 2] = x * nbSubdivisions + z + 1;

            indices[index + 3] = (x + 1) * nbSubdivisions + z;
            indices[index + 4] = x * nbSubdivisions + z + 1;
            indices[index + 5] = (x + 1) * nbSubdivisions + z + 1;
        }
    }

    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.uvs = uvs;
    vertexData.normals = normals;

    return vertexData;
}
