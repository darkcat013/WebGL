class LightSource extends Sphere {
    static count = 0;

    constructor(diffuseColor = [1, 1, 1], specularColor = [1, 1, 1], shininess = 5.0) {
        super(0.1);

        this.diffuseColor = diffuseColor;
        this.specularColor = specularColor;
        this.shininess = shininess;
        this.adjustFragColor()
    }

    adjustFragColor() {
        this.color = vec4(this.diffuseColor, 1)
        for (let i = 0; i < this.colors.length; i++) {
            this.colors[i] = this.color;
        }
    }
}