// ==========================================
// GEONEXUS CONFIGURATION (settings only; routing logic lives in routing.js)
// ==========================================

window.GEONEXUS = {
    PUBLIC_BASE_URL: "https://matimu7.github.io/GeoNexus/",
    ROUTE_PAGE: "route.html",

    // Your NEW Cesium Ion token. Rotate the old one and restrict the new one
    // to your site's URL (and only the assets you need) in the Cesium Ion dashboard.
    CESIUM_TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjF4NEQ2RXVIdnhEU3ZVQ0wiLCJqdGkiOiIzNjViYjNhMS04ODJlLTRkYWItYmVkMC0xN2I1NTdjZjgxYjIiLCJpZCI6NTEyMTU0LCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3OTA3NzY3MDl9.NcMiDOBCqxHQfxRQC35kOslp0cXZeyWPPo9m-MklGpY",

    DATA: {
        BUILDINGS: "Buildings.geojson",
        PATHWAYS: "Pathways.geojson",
        AOI: "campus_aoi.geojson",
        SCREENS: "Dashboard_loc.geojson",
        ENTRANCES: "building_entrances.geojson"
    },

    ROUTING: {
        WALK_SPEED_MS: 1.4,
        ROUTE_COLOR: "#ec4899",
        START_COLOR: "#22c55e",
        DESTINATION_COLOR: "#ef4444"
       
    }

    
};
