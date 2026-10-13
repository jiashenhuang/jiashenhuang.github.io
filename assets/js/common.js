document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.site-navbar-toggler');
    const navMenu = document.querySelector('#navbarResponsive');

    if (navToggle && navMenu) {
        const closeNav = () => {
            navMenu.classList.remove('show');
            navToggle.setAttribute('aria-expanded', 'false');
        };

        navToggle.addEventListener('click', () => {
            const isOpen = navMenu.classList.toggle('show');
            navToggle.setAttribute('aria-expanded', String(isOpen));
        });

        navMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', closeNav);
        });

        document.addEventListener('click', (event) => {
            if (!navMenu.contains(event.target) && !navToggle.contains(event.target)) closeNav();
        });
    }

    const modalTriggers = document.querySelectorAll('[data-target^="#modal-"]');
    modalTriggers.forEach((trigger) => {
        const modal = document.querySelector(trigger.dataset.target);
        if (!modal) return;

        const closeModal = () => {
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
        };

        trigger.addEventListener('click', () => {
            modal.classList.add('show');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
            modal.querySelector('button')?.focus();
        });

        modal.querySelectorAll('[data-dismiss="modal"]').forEach((button) => {
            button.addEventListener('click', closeModal);
        });

        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeModal();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.classList.contains('show')) closeModal();
        });
    });

    const yearLinks = Array.from(document.querySelectorAll('.year-nav a[href^="#year-"]'));
    if (yearLinks.length && 'IntersectionObserver' in window) {
        const linksById = new Map(yearLinks.map((link) => [link.hash.slice(1), link]));
        const observer = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
            if (!visible) return;

            yearLinks.forEach((link) => link.classList.remove('active'));
            linksById.get(visible.target.id)?.classList.add('active');
        }, { rootMargin: '-20% 0px -65% 0px' });

        linksById.forEach((_, id) => {
            const section = document.getElementById(id);
            if (section) observer.observe(section);
        });
    }

    const showcaseGrids = Array.from(document.querySelectorAll('.showcase-media-grid'));
    if (showcaseGrids.length) {
        const layoutGrid = (grid) => {
            const styles = getComputedStyle(grid);
            const rowHeight = parseFloat(styles.gridAutoRows);
            const rowGap = parseFloat(styles.rowGap);
            if (!rowHeight) return;

            grid.querySelectorAll('.showcase-grid-item').forEach((item) => {
                const itemHeight = item.getBoundingClientRect().height;
                const rowSpan = Math.ceil((itemHeight + rowGap) / (rowHeight + rowGap));
                const nextValue = `span ${rowSpan}`;
                if (item.style.gridRowEnd !== nextValue) item.style.gridRowEnd = nextValue;
            });
        };

        const layoutAllShowcaseGrids = () => {
            requestAnimationFrame(() => showcaseGrids.forEach(layoutGrid));
        };

        showcaseGrids.forEach((grid) => {
            grid.querySelectorAll('img').forEach((image) => {
                if (!image.complete) image.addEventListener('load', layoutAllShowcaseGrids, { once: true });
                else image.decode?.().then(layoutAllShowcaseGrids).catch(() => {});
            });
        });

        if ('ResizeObserver' in window) {
            const showcaseObserver = new ResizeObserver((entries) => {
                const changedGrids = new Set(
                    entries.map((entry) => entry.target.closest('.showcase-media-grid')).filter(Boolean)
                );
                requestAnimationFrame(() => changedGrids.forEach(layoutGrid));
            });
            showcaseGrids.forEach((grid) => {
                grid.querySelectorAll('.showcase-grid-item').forEach((item) => showcaseObserver.observe(item));
            });
        }

        let showcaseResizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(showcaseResizeTimer);
            showcaseResizeTimer = setTimeout(layoutAllShowcaseGrids, 120);
        });

        layoutAllShowcaseGrids();
    }
});
