// --- GEONEXUS UNIFIED SPA ROUTER & VIEW SWITCHER ---
(function () {
    function route() {
        const rawHash = window.location.hash.slice(1) || 'home';
        const mains = document.querySelectorAll('main');
        const hero = document.getElementById('view-hero');
        const heroPanels = hero ? hero.querySelectorAll('[data-view]') : [];
        const navLinks = document.querySelectorAll('nav a');

        let targetMainId = 'view-hero';
        let activeSubView = 'home';

        // Map hash routes to view containers
        if (rawHash === 'home' || rawHash === 'about') {
            targetMainId = 'view-hero';
            activeSubView = rawHash;
        } else if (rawHash === 'blog') {
            targetMainId = 'view-blog';
        } else if (rawHash === 'map') {
            targetMainId = 'view-map';
        } else if (rawHash.startsWith('post-')) {
            targetMainId = `view-${rawHash}`;
        }

        // 1. Hide all main view sections
        mains.forEach(main => {
            main.hidden = true;
        });

        // 2. Unhide target main section
        const activeMain = document.getElementById(targetMainId);
        if (activeMain) {
            activeMain.hidden = false;
        }

        // 3. Toggle inner sub-views for Home and About
        if (targetMainId === 'view-hero') {
            heroPanels.forEach(p => {
                p.hidden = (p.getAttribute('data-view') !== activeSubView);
            });
        }

        // 4. Force single active highlight on navigation links
        navLinks.forEach(a => {
            a.classList.remove('active');

            const linkTarget = a.getAttribute('data-link');
            const hrefTarget = a.getAttribute('href') ? a.getAttribute('href').replace('#', '') : '';

            const matchesActiveSubView = (targetMainId === 'view-hero' && (linkTarget === activeSubView || hrefTarget === activeSubView));
            const matchesDirectHash = (linkTarget === rawHash || hrefTarget === rawHash);
            const matchesPostToBlog = (rawHash.startsWith('post-') && (linkTarget === 'blog' || hrefTarget === 'blog'));

            if (matchesActiveSubView || matchesDirectHash || matchesPostToBlog) {
                a.classList.add('active');
            }
        });

        window.scrollTo(0, 0);

        // Notify 3D Viewport / Canvas to resize properly after view changes
        requestAnimationFrame(() => {
            window.dispatchEvent(new Event('resize'));
        });
    }

    window.addEventListener('hashchange', route);
    document.addEventListener('DOMContentLoaded', route);
})();

// --- IMAGE MAXIMIZER LIGHTBOX MODAL ---
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImg");
    const captionText = document.getElementById("modalCaption");
    const closeBtn = document.querySelector(".modal-close");

    // Attach click zoom handler to article and zoomable images
    document.querySelectorAll(".zoomable-img, article img").forEach(img => {
        img.addEventListener("click", function () {
            if (modal && modalImg) {
                modal.classList.add("open");
                modal.style.display = "flex";
                modalImg.src = this.src;
                if (captionText) {
                    captionText.innerHTML = this.alt || "Image View";
                }
            }
        });
    });

    // Close handlers
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            modal.classList.remove("open");
            modal.style.display = "none";
        });
    }

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.remove("open");
                modal.style.display = "none";
            }
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal) {
            modal.classList.remove("open");
            modal.style.display = "none";
        }
    });
});