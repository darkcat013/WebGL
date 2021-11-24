class ObjShape extends Shape {
    static count = 0;

    constructor(vertices, textureCord, normals, faces) {
        super();

        
        
        
        let c = 0;
        for (let face of faces) {
            let color  = getRandomColor();
            for (let i=0; i<3; i++) {
                let vi = face[i][0]
                let vti = face[i][1]
                let ni = face[i][2]

                this.points.push(vertices[vi]);
                this.textureCord.push(textureCord[vti]);
                this.normals.push(normals[ni]);
                this.colors.push(color);
            }
        }
    }
}