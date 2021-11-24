class Cube extends Shape {
    static count = 0;

    constructor() {
        super();

        this.setVertices()
    }

    setVertices() {
        var vertices = [
            vec4(-0.35, -0.35, 0.35, 1.0),
            vec4(-0.35, 0.35, 0.35, 1.0),
            vec4(0.35, 0.35, 0.35, 1.0),
            vec4(0.35, -0.35, 0.35, 1.0),
            vec4(-0.35, -0.35, -0.35, 1.0),
            vec4(-0.35, 0.35, -0.35, 1.0),
            vec4(0.35, 0.35, -0.35, 1.0),
            vec4(0.35, -0.35, -0.35, 1.0)
        ];

        var textureCoords = [
            vec2(0.0,1.0),
            vec2(0.0,0.0),
            vec2(1.0,0.0),
            vec2(1.0,1.0)

        ]
        const quad = (a, b, c, d, normals) => {
            let indices = [a, b, c, a, c, d];
            let color = getRandomColor();
            for (let i = 0; i < indices.length - 3; ++i) {
                this.points.push(vertices[indices[i]]);
                this.colors.push(color);
                this.textureCord.push(textureCoords[i]);
                Array.prototype.push.apply(this.normals, normals)
            }
            this.textureCord.push(textureCoords[0]);
            this.textureCord.push(textureCoords[2]);
            this.textureCord.push(textureCoords[3]);
            color = getRandomColor();
            for (let i = 3; i < indices.length; ++i) {
                this.points.push(vertices[indices[i]]);
                this.colors.push(color);
                Array.prototype.push.apply(this.normals, normals)
            }
        }

        quad(1, 0, 3, 2, [0, 0, 1]); // front face
        quad(2, 3, 7, 6, [1, 0, 0]); // right
        quad(3, 0, 4, 7, [0, -1, 0]); // bottom
        quad(6, 5, 1, 2, [0, 1, 0]); // up
        quad(4, 5, 6, 7, [0, 0, -1]); // back
        quad(5, 4, 0, 1, [-1, 0, 0]); // left

    }
}