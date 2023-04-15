precision highp float;

varying vec2 vUV;

uniform sampler2D textureSampler;

void main() {
    vec3 screenColor = texture2D(textureSampler, vUV).rgb;

    // gamma correction
    screenColor = pow(screenColor, vec3(0.4545));

    gl_FragColor = vec4(screenColor, 1.0);
}