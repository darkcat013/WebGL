class Sphere extends Shape {
    static count = 0;

    constructor( scale = 1) {
        super()
        this.scaling = [scale, scale, scale]
        this.setVertices()
    }

    setVertices() {
        let radius = 0.40;
        let stackCount = 15;
        let sectorCount = 15;
        let sectorStep = 2 * Math.PI / sectorCount;
        let stackStep = Math.PI / stackCount;
        let lengthInv = 1.0 / radius;

        let vertices = [];
        let normals = [];
        for (let i = 0; i <= stackCount; i++) {
            let stackAngle = Math.PI / 2 - i * stackStep;
            let xy = radius * Math.cos(stackAngle);
            let z = radius * Math.sin(stackAngle);

            for (let j = 0; j <= sectorCount; j++) {
                let sectorAngle = j * sectorStep;

                // vertex position
                let x = xy * Math.cos(sectorAngle);
                let y = xy * Math.sin(sectorAngle);
                vertices.push([x, y, z, 1.0]);

                // normals
                let nx = x * lengthInv;
                let ny = y * lengthInv;
                let nz = z * lengthInv;
                normals.push([nx, ny, nz]);
            }
        }

        for (let i = 0; i < stackCount; i++) {
            let k1 = i * (sectorCount + 1);
            let k2 = k1 + sectorCount + 1;

            for (let j = 0; j < sectorCount; j++, k1++, k2++) {
                if (i != 0) {
                    this.points.push(vertices[k1]);
                    this.points.push(vertices[k2]);
                    this.points.push(vertices[k1 + 1]);

                    this.normals.push(normals[k1])
                    this.normals.push(normals[k2])
                    this.normals.push(normals[k1 + 1])
                    let color = getRandomColor();
                    this.colors.push(color);
                    this.colors.push(color);

                    // this.colors.push(COLORS['white']);
                    this.colors.push(color);
                }

                if (i != stackCount - 1) {
                    this.points.push(vertices[k1 + 1]);
                    this.points.push(vertices[k2]);
                    this.points.push(vertices[k2 + 1]);

                    this.normals.push(normals[k1 + 1])
                    this.normals.push(normals[k2])
                    this.normals.push(normals[k2 + 1])
                    let color = getRandomColor();
                    this.colors.push(color);
                    this.colors.push(color);
                    this.colors.push(color);

                    // this.colors.push(this.color.map(x => x * 0.95));
                }

            }
        }
    }
}