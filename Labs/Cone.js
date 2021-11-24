class Cone extends Shape {
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
        let apex = vec4(0, 0.5, 0, 1);
        let baseCenter = vec4(0, -0.5, 0, 1);
        let baseVertices = []
        let n = this.nBase;

        // generate base vertices
        for (let i = 0; i < n; i++) {
            let alpha = i * 2.0 * Math.PI / n;
            let currVertex = vec4(baseCenter);

            currVertex[0] += Math.sin(alpha) * R;
            currVertex[2] += Math.cos(alpha) * R;

            baseVertices.push(currVertex);
        }
        //connect first and last triangle from the base
        baseVertices.push(baseVertices[0]);

        for (let i = 0; i < baseVertices.length - 1; i++) {
            let color = getRandomColor();
            // connect to base center
            this.points.push(baseVertices[i])
            this.points.push(baseVertices[i + 1])
            this.points.push(baseCenter)

            this.normals.push(vec3(0, -1, 0))
            this.normals.push(vec3(0, -1, 0))
            this.normals.push(vec3(0, -1, 0))

            this.colors.push(color);
            this.colors.push(color);
            this.colors.push(color);

            color = getRandomColor();
            // connect to apex
            this.points.push(baseVertices[i]);
            this.points.push(baseVertices[i + 1]);
            this.points.push(apex);

            this.colors.push(color);
            this.colors.push(color);
            this.colors.push(color);

            let p1 = vec3(baseVertices[i]);
            let p2 = vec3(baseVertices[i + 1]);
            let p3 = vec3(apex);

            let v = subtractArray(p2, p1);
            let w = subtractArray(p3, p1);

            let nx = v[1] * w[2] - v[2] * w[1];
            let ny = v[2] * w[0] - v[0] * w[2];
            let nz = v[0] * w[1] - v[1] * w[0];
            console.log({p1: p1, p2:p2, p3:p3, v:v, w:w, nx:nx, ny:ny, nz:nz})
            this.normals.push([nx, ny, nz])
            this.normals.push([nx, ny, nz])
            this.normals.push([nx, ny, nz])
        }
    }
}