/**
 * Pusat Data RW 032 — Interactive Application Controller
 * Vanilla JS Modular Architecture (Zero External Framework Dependencies)
 */

document.addEventListener('DOMContentLoaded', () => {
    const htmlEl = document.documentElement;
    const themeToggleBtn = document.getElementById('themeToggleBtn');

    // Sidebar & Mobile Drawer
    const appSidebar = document.getElementById('appSidebar');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const drawerOpenBtn = document.getElementById('drawerOpenBtn');
    const drawerCloseBtn = document.getElementById('drawerCloseBtn');
    const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');

    // Modal Disclaimer
    const disclaimerModal = document.getElementById('disclaimerModal');
    const acceptDisclaimerBtn = document.getElementById('acceptDisclaimerBtn');
    const openDisclaimerTriggers = [
        document.getElementById('openDisclaimerBtn'),
        document.getElementById('headerDisclaimerBtn'),
        document.getElementById('footerDisclaimerLink'),
        document.getElementById('mobilePolicyBtn')
    ].filter(Boolean);

    // Filtering & Search
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    const mobileSearchFocusBtn = document.getElementById('mobileSearchFocusBtn');
    const directoryCards = document.querySelectorAll('.dir-card');
    const emptyState = document.getElementById('emptyState');

    let currentFilter = 'all';
    let currentSearchQuery = '';

    // Helper aman untuk storage (menghindari error di mode privat/restricted)
    const storage = {
        get(key) {
            try {
                return window.localStorage.getItem(key);
            } catch (_) {
                return null;
            }
        },
        set(key, value) {
            try {
                window.localStorage.setItem(key, value);
            } catch (_) {
                // Abaikan jika penyimpanan diblokir peramban
            }
        }
    };

    // Render ikon Lucide secara aman tanpa menghentikan event listener
    const renderIcons = () => {
        try {
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        } catch (err) {
            console.warn('Lucide icons gagal dirender:', err);
        }
    };

    renderIcons();

    /* ======================================================================
       A. THEME SWITCHER
       ====================================================================== */
    const initTheme = () => {
        const savedTheme = storage.get('rw032_theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
            htmlEl.setAttribute('data-theme', savedTheme);
        } else {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            htmlEl.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    };

    themeToggleBtn?.addEventListener('click', () => {
        const current = htmlEl.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        htmlEl.setAttribute('data-theme', next);
        storage.set('rw032_theme', next);
    });

    initTheme();

    /* ======================================================================
       B. DISCLAIMER MODAL MANAGEMENT
       ====================================================================== */
    const isDisclaimerAccepted = () => storage.get('rw032_disclaimer_accepted') === 'true';

    const openModal = () => {
        if (!disclaimerModal) return;
        disclaimerModal.classList.add('show');
        document.body.classList.add('modal-open');
        closeMobileDrawer();
    };

    const closeModal = () => {
        if (!disclaimerModal) return;
        disclaimerModal.classList.remove('show');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    };

    if (!isDisclaimerAccepted()) {
        openModal();
    }

    // Event delegation pada dokumen agar klik pada tombol maupun SVG/teks di dalamnya selalu terbaca
    document.addEventListener('click', (e) => {
        const acceptTarget = e.target.closest('#acceptDisclaimerBtn');
        if (acceptTarget) {
            e.preventDefault();
            e.stopPropagation();
            storage.set('rw032_disclaimer_accepted', 'true');
            closeModal();
        }
    });

    openDisclaimerTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    });

    disclaimerModal?.addEventListener('click', (e) => {
        if (e.target === disclaimerModal && isDisclaimerAccepted()) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileDrawer();
            if (disclaimerModal?.classList.contains('show') && isDisclaimerAccepted()) {
                closeModal();
            }
        }
    });

    /* ======================================================================
       C. SIDEBAR & OFF-CANVAS DRAWER
       ====================================================================== */
    const openMobileDrawer = () => {
        appSidebar?.classList.add('open');
        drawerOverlay?.classList.add('show');
        document.body.classList.add('modal-open');
    };

    const closeMobileDrawer = () => {
        appSidebar?.classList.remove('open');
        drawerOverlay?.classList.remove('show');
        if (!disclaimerModal?.classList.contains('show')) {
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
        }
    };

    drawerOpenBtn?.addEventListener('click', openMobileDrawer);
    drawerCloseBtn?.addEventListener('click', closeMobileDrawer);
    drawerOverlay?.addEventListener('click', closeMobileDrawer);

    sidebarCollapseBtn?.addEventListener('click', () => {
        appSidebar?.classList.toggle('collapsed');
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            closeMobileDrawer();
        }
    });

    /* ======================================================================
       D. ACCORDION KARTU DIREKTORI
       ====================================================================== */
    document.querySelectorAll('.dir-card-header').forEach(header => {
        header.addEventListener('click', () => {
            const card = header.closest('.dir-card');
            if (!card) return;
            const isOpen = card.classList.toggle('is-open');
            header.setAttribute('aria-expanded', String(isOpen));
        });
    });

    /* ======================================================================
       E. FILTER KATEGORI & PENCARIAN REAL-TIME
       ====================================================================== */
    const syncNavigationActiveState = (filterValue) => {
        document.querySelectorAll('[data-filter]').forEach(el => {
            const isMatch = el.getAttribute('data-filter') === filterValue;
            el.classList.toggle('active', isMatch);
            if (el.hasAttribute('aria-selected')) {
                el.setAttribute('aria-selected', String(isMatch));
            }
        });
    };

    const applyFilters = () => {
        let visibleCount = 0;
        const query = currentSearchQuery.trim().toLowerCase();

        directoryCards.forEach(card => {
            const category = card.getAttribute('data-category');
            const cardText = card.textContent.toLowerCase();

            const matchesCategory = currentFilter === 'all' || category === currentFilter;
            const matchesSearch = query === '' || cardText.includes(query);

            if (matchesCategory && matchesSearch) {
                card.classList.remove('hidden');
                if (query !== '') {
                    card.classList.add('is-open');
                    card.querySelector('.dir-card-header')?.setAttribute('aria-expanded', 'true');
                }
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });

        emptyState?.classList.toggle('hidden', visibleCount > 0);
    };

    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.getAttribute('data-filter') || 'all';
            syncNavigationActiveState(currentFilter);
            applyFilters();
            closeMobileDrawer();
        });
    });

    searchInput?.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value;
        clearSearchBtn?.classList.toggle('hidden', currentSearchQuery === '');
        applyFilters();
    });

    clearSearchBtn?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        currentSearchQuery = '';
        clearSearchBtn.classList.add('hidden');
        searchInput?.focus();
        applyFilters();
    });

    resetFilterBtn?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        currentSearchQuery = '';
        currentFilter = 'all';
        clearSearchBtn?.classList.add('hidden');
        syncNavigationActiveState('all');
        applyFilters();
    });

    mobileSearchFocusBtn?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => searchInput?.focus(), 300);
    });
});
