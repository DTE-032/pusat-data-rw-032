/**
 * Pusat Data RW 032 — Interactive Application Controller
 * Vanilla JS Modular Architecture (Zero External Framework Dependencies)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inisialisasi Ikon Lucide
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // 2. Elemen DOM Utama
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
    ];

    // Filtering & Search
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    const mobileSearchFocusBtn = document.getElementById('mobileSearchFocusBtn');
    const directoryCards = document.querySelectorAll('.dir-card');
    const emptyState = document.getElementById('emptyState');

    let currentFilter = 'all';
    let currentSearchQuery = '';

    /* ======================================================================
       A. THEME SWITCHER (DARK / LIGHT MODE + SYSTEM PREFERENCE)
       ====================================================================== */
    const initTheme = () => {
        const savedTheme = localStorage.getItem('rw032_theme');
        if (savedTheme) {
            htmlEl.setAttribute('data-theme', savedTheme);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            htmlEl.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    };

    themeToggleBtn?.addEventListener('click', () => {
        const current = htmlEl.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        htmlEl.setAttribute('data-theme', next);
        localStorage.setItem('rw032_theme', next);
    });

    initTheme();

    /* ======================================================================
       B. DISCLAIMER MODAL MANAGEMENT
       ====================================================================== */
    const openModal = () => {
        disclaimerModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        closeMobileDrawer();
    };

    const closeModal = () => {
        disclaimerModal.classList.remove('show');
        document.body.style.overflow = '';
    };

    // Tampilkan otomatis jika pengguna belum menyetujui
    if (!localStorage.getItem('rw032_disclaimer_accepted')) {
        openModal();
    }

    acceptDisclaimerBtn?.addEventListener('click', () => {
        localStorage.setItem('rw032_disclaimer_accepted', 'true');
        closeModal();
    });

    openDisclaimerTriggers.forEach(btn => {
        btn?.addEventListener('click', openModal);
    });

    // Tutup modal saat klik area luar atau menekan tombol Escape
    disclaimerModal?.addEventListener('click', (e) => {
        if (e.target === disclaimerModal && localStorage.getItem('rw032_disclaimer_accepted')) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileDrawer();
            if (disclaimerModal.classList.contains('show') && localStorage.getItem('rw032_disclaimer_accepted')) {
                closeModal();
            }
        }
    });

    /* ======================================================================
       C. SIDEBAR (DESKTOP COLLAPSE) & OFF-CANVAS DRAWER (MOBILE)
       ====================================================================== */
    const openMobileDrawer = () => {
        appSidebar.classList.add('open');
        drawerOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    };

    const closeMobileDrawer = () => {
        appSidebar.classList.remove('open');
        drawerOverlay.classList.remove('show');
        if (!disclaimerModal.classList.contains('show')) {
            document.body.style.overflow = '';
        }
    };

    drawerOpenBtn?.addEventListener('click', openMobileDrawer);
    drawerCloseBtn?.addEventListener('click', closeMobileDrawer);
    drawerOverlay?.addEventListener('click', closeMobileDrawer);

    sidebarCollapseBtn?.addEventListener('click', () => {
        appSidebar.classList.toggle('collapsed');
    });

    // Bersihkan state drawer saat berpindah ke layar desktop
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
            const isOpen = card.classList.toggle('is-open');
            header.setAttribute('aria-expanded', String(isOpen));
        });
    });

    /* ======================================================================
       E. FILTER KATEGORI & PENCARIAN REAL-TIME
       ====================================================================== */
    const syncNavigationActiveState = (filterValue) => {
        // Sinkronisasi Sidebar, Filter Chips, dan Bottom Navigation
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
                // Otomatis buka akordeon saat sedang mencari agar hasil langsung terlihat
                if (query !== '') {
                    card.classList.add('is-open');
                    card.querySelector('.dir-card-header')?.setAttribute('aria-expanded', 'true');
                }
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });

        emptyState.classList.toggle('hidden', visibleCount > 0);
    };

    // Event listener untuk semua tombol filter (Sidebar, Chips, Bottom Nav)
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.getAttribute('data-filter');
            syncNavigationActiveState(currentFilter);
            applyFilters();
            closeMobileDrawer();
        });
    });

    // Input Pencarian
    searchInput?.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value;
        clearSearchBtn.classList.toggle('hidden', currentSearchQuery === '');
        applyFilters();
    });

    clearSearchBtn?.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchQuery = '';
        clearSearchBtn.classList.add('hidden');
        searchInput.focus();
        applyFilters();
    });

    resetFilterBtn?.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchQuery = '';
        currentFilter = 'all';
        clearSearchBtn.classList.add('hidden');
        syncNavigationActiveState('all');
        applyFilters();
    });

    // Tombol Cari pada Bottom Bar Mobile
    mobileSearchFocusBtn?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => searchInput?.focus(), 300);
    });
});