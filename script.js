// --- VIEW SWITCHING (Home / About / Blog / Map) ---
(function () {
    const hero = document.getElementById('view-hero');
    const blog = document.getElementById('view-blog');
    const map = document.getElementById('view-map');
    const heroPanels = hero.querySelectorAll('[data-view]');
    const links = document.querySelectorAll('nav a[data-link]');
    const valid = ['home', 'about', 'blog', 'map'];

    function show(view) {
        if (!valid.includes(view)) view = 'home';

        hero.hidden = !(view === 'home' || view === 'about');
        blog.hidden = view !== 'blog';
        map.hidden = view !== 'map';

        heroPanels.forEach(function (p) {
            p.hidden = p.dataset.view !== view;
        });

        links.forEach(function (a) {
            a.classList.toggle('active', a.dataset.link === view);
        });

        window.scrollTo(0, 0);

        // Let the globe and Cesium re-measure their containers after being shown
        requestAnimationFrame(function () {
            window.dispatchEvent(new Event('resize'));
        });
    }

    window.addEventListener('hashchange', function () {
        show(location.hash.slice(1));
    });

    show(location.hash.slice(1));
})();

// Image Maximizer Lightbox functionality
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImg");
    const captionText = document.getElementById("modalCaption");
    const closeBtn = document.querySelector(".modal-close");

    // Enable zoom on any image with class "zoomable-img" or blog images
    document.querySelectorAll(".zoomable-img, .blog-feed img").forEach(img => {
        img.addEventListener("click", function() {
            if (modal && modalImg) {
                modal.style.display = "block";
                modalImg.src = this.src;
                captionText.innerHTML = this.alt || "Image View";
            }
        });
    });

    // Close modal when clicking 'X'
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    // Close modal when clicking outside the image
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });
    }
});
