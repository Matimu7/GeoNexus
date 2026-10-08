import createGlobe from 'https://cdn.skypack.dev/cobe';

// Target the canvas element from your HTML
const canvas = document.getElementById("cobe");

// Only run the globe animation if the canvas actually exists on the page
if (canvas) {
    let phi = 0;
    
    const globe = createGlobe(canvas, {
        devicePixelRatio: 2,
        width: 640,
        height: 640,
        phi: 0,
        theta: 0,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 6,
        baseColor: [0.04, 0.07, 0.13], /* GeoNexus Deep Navy */
        markerColor: [0.28, 0.89, 0.76], /* GeoNexus Cyan */
        glowColor: [0.13, 0.71, 0.64],
        markers: [],
        onRender: (state) => {
            state.phi = phi;
            phi += 0.005; 
        }
    });
}