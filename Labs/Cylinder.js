class Cylinder extends Shape {
    static count = 0;

    constructor(n = 15) {
        super();

        this.nBase = n;
        this.setVertices();
    }

    setVertices() {
        this.points = []
        this.colors = []

        let R = 0.35;
        let topCenter = vec4(0, 0.5, 0, 1);
        let bottomCenter = vec4(0, -0.5, 0, 1);
        let topVertices = [];
        let bottomVertices = [];
        let n = this.nBase;

        // generate bottom and top vertices
        for (let i = 0; i < n; i++) {
            let alpha = i * 2.0 * Math.PI / n;
            let currVertex = vec4(bottomCenter);

            currVertex[0] += Math.sin(alpha) * R;
            currVertex[2] += Math.cos(alpha) * R;

            bottomVertices.push(currVertex);

            currVertex = vec4(topCenter);

            currVertex[0] += Math.sin(alpha) * R;
            currVertex[2] += Math.cos(alpha) * R;

            topVertices.push(currVertex);
        }

        bottomVertices.push(bottomVertices[0]);
        topVertices.push(topVertices[0]);

        for (let i = 0; i < bottomVertices.length - 1; i++) {
            let color = getRandomColor();
            // connect to bottom center
            this.points.push(bottomVertices[i]);
            this.points.push(bottomVertices[i + 1]);
            this.points.push(bottomCenter);

            this.normals.push(vec3(0, -1, 0))
            this.normals.push(vec3(0, -1, 0))
            this.normals.push(vec3(0, -1, 0))

            this.colors.push(color);
            this.colors.push(color);
            this.colors.push(color);


            color = getRandomColor();
            // connect to top center
            this.points.push(topVertices[i]);
            this.points.push(topVertices[i + 1]);
            this.points.push(topCenter);

            this.normals.push(vec3(0, 1, 0))
            this.normals.push(vec3(0, 1, 0))
            this.normals.push(vec3(0, 1, 0))

            this.colors.push(color);
            this.colors.push(color);
            this.colors.push(color);

            color = getRandomColor();
            //connect bottom to top
            this.points.push(bottomVertices[i])
            this.points.push(bottomVertices[i + 1]);
            this.points.push(topVertices[i]);

            let p1 = vec3(bottomVertices[i]);
            let p2 = vec3(bottomVertices[i + 1]);
            let p3 = vec3(topVertices[i]);

            let v = subtractArray(p2, p1);
            let w = subtractArray(p3, p1);
            

            let nx = v[1] * w[2] - v[2] * w[1];
            let ny = v[2] * w[0] - v[0] * w[2];
            let nz = v[0] * w[1] - v[1] * w[0];

            this.normals.push([nx, ny, nz])
            this.normals.push([nx, ny, nz])
            this.normals.push([nx, ny, nz])

            this.colors.push(color);
            this.colors.push(color);
            this.colors.push(color);

            color = getRandomColor();

            this.points.push(topVertices[i])
            this.points.push(topVertices[i + 1]);
            this.points.push(bottomVertices[i + 1]);

            this.normals.push([nx, ny, nz])
            this.normals.push([nx, ny, nz])
            this.normals.push([nx, ny, nz])

            this.colors.push(color);
            this.colors.push(color);
            this.colors.push(color);
        }
    }
}