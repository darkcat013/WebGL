function getRandomColor() {
    return vec4(Math.random(), Math.random(), Math.random(), 1.0)
}

function subtractArray(a, b) {
    let c = []

    for (let i = 0; i < a.length; i++) {
        c.push(a[i] - b[i]);
    }

    return c;
}

function hexToRGB(hex) {
    let R = hex.slice(1, 3);
    let G = hex.slice(3, 5);
    let B = hex.slice(5, 7);
    return vec3(parseInt(R, 16) / 255, parseInt(G, 16) / 255, parseInt(B, 16) / 255);
}

function intToHex(integer) {
    let str = parseInt(integer*255).toString(16);
    return str.length == 1 ? "0" + str : str;
};

function intRGB_ToHex(r, g, b) { return "#" + intToHex(r) + intToHex(g) + intToHex(b); }