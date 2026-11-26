/**
 * Pusat Data RW 032 — Core UI Controller
 * Engineered with Event Delegation, A11y Compliance, and Zero-Layout-Shift Dropdowns.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inisialisasi Ikon Lucide
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // 2. Cache DOM Elements
    const state = {
        activeFilter: 'all',
        searchQuery: '',
        theme: localStorage.getItem('rw032-theme') || 'dark'
    };

    const dom = {
        html: document.documentElement,
        directoryGrid: document.getElementById('directoryGrid'),
        cards: Array.from(document.querySelectorAll('.dir-card')),
        filterButtons: Array.from(document.querySelectorAll('[data-filter]')),
        searchInput: document.getElementById('searchInput'),
        clearSearchBtn: document.getElementById('clearSearchBtn'),
        emptyState: document.getElementById('emptyState'),
        resetFilterBtn: document.getElementById('resetFilterBtn'),
        themeToggleBtn: document.getElementById('themeToggleBtn'),
        sidebar: document.getElementById('appSidebar'),
        sidebarCollapseBtn: document.getElementById('sidebarCollapseBtn'),
        drawerOpenBtn: document.getElementById('drawerOpenBtn'),
        drawerCloseBtn: document.getElementById('drawerCloseBtn'),
        drawerOverlay: document.getElementById('drawerOverlay'),
        modal: document.getElementById('disclaimerModal'),
        acceptDisclaimerBtn: document.getElementById('acceptDisclaimerBtn'),
        openDisclaimerTriggers: [
            document.getElementById('openDisclaimerBtn'),
            document.getElementById('headerDisclaimerBtn'),
            document.getElementById('footerDisclaimerLink'),
            document.getElementById('mobilePolicyBtn')
        ].filter(Boolean),
        mobileSearchFocusBtn: document.getElementById('mobileSearchFocusBtn')
    };

    // 3. Fungsi Kontrol Dropdown Flashcard
    const setCardExpanded = (card, isOpen) => {
        const headerBtn = card.querySelector('.dir-card-header');
        if (!headerBtn) return;

        card.classList.toggle('is-open', isOpen);
        headerBtn.setAttribute('aria-expanded', String(isOpen));
    };

    const collapseAllCards = () => {
        dom.cards.forEach((card) => setCardExpanded(card, false));
    };

    // Pastikan seluruh flashcard tertutup saat inisialisasi awal
    collapseAllCards();

    // Event Delegation untuk Dropdown Flashcard (Hanya terbuka saat diklik)
    dom.directoryGrid?.addEventListener('click', (event) => {
        const headerBtn = event.target.closest('.dir-card-header');
        if (!headerBtn) return;

        const card = headerBtn.closest('.dir-card');
        if (!card) return;

        const isCurrentlyOpen = card.classList.contains('is-open');
        setCardExpanded(card, !isCurrentlyOpen);
    });

    // 4. Filter Kategori & Pencarian Terintegrasi
    const applyFilters = () => {
        const query = state.searchQuery.trim().toLowerCase();
        let visibleCount = 0;

        dom.cards.forEach((card) => {
            const category = card.dataset.category || '';
            const matchesCategory = state.activeFilter === 'all' || category === state.activeFilter;
            const textContent = card.textContent.toLowerCase();
            const matchesQuery = query === '' || textContent.includes(query);

            const isVisible = matchesCategory && matchesQuery;
            card.classList.toggle('hidden', !isVisible);

            if (isVisible) {
                visibleCount++;
                // Jika user mengetik pencarian spesifik, buka kartu yang cocok agar hasil terlihat;
                // jika pencarian dihapus, kembalikan ke posisi tertutup default.
                if (query.length > 0) {
                    setCardExpanded(card, true);
                } else if (card.dataset.autoOpenedBySearch === 'true') {
                    setCardExpanded(card, false);
                }
                card.dataset.autoOpenedBySearch = query.length > 0 ? 'true' : 'false';
            }
        });

        dom.emptyState?.classList.toggle('hidden', visibleCount > 0);
        dom.clearSearchBtn?.classList.toggle('hidden', query.length === 0);
    };

    const updateActiveFilterUI = (selectedFilter) => {
        state.activeFilter = selectedFilter;

        dom.filterButtons.forEach((btn) => {
            const isMatch = btn.dataset.filter === selectedFilter;
            btn.classList.toggle('active', isMatch);
            if (btn.getAttribute('role') === 'tab') {
                btn.setAttribute('aria-selected', String(isMatch));
            }
        });

        applyFilters();
    };

    dom.filterButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            updateActiveFilterUI(btn.dataset.filter);
            closeMobileDrawer();
        });
    });

    dom.searchInput?.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        applyFilters();
    });

    dom.clearSearchBtn?.addEventListener('click', () => {
        state.searchQuery = '';
        if (dom.searchInput) dom.searchInput.value = '';
        applyFilters();
        dom.searchInput?.focus();
    });

    dom.resetFilterBtn?.addEventListener('click', () => {
        state.searchQuery = '';
        if (dom.searchInput) dom.searchInput.value = '';
        updateActiveFilterUI('all');
        collapseAllCards();
    });

    dom.mobileSearchFocusBtn?.addEventListener('click', () => {
        dom.searchInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        dom.searchInput?.focus();
    });

    // 5. Manajemen Tema (Dark / Light)
    const applyTheme = (theme) => {
        dom.html.setAttribute('data-theme', theme);
        localStorage.setItem('rw032-theme', theme);
    };

    applyTheme(state.theme);

    dom.themeToggleBtn?.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme(state.theme);
    });

    // 6. Sidebar Collapse (Desktop) & Drawer (Mobile)
    dom.sidebarCollapseBtn?.addEventListener('click', () => {
        dom.sidebar?.classList.toggle('is-collapsed');
    });

    const openMobileDrawer = () => {
        dom.sidebar?.classList.add('is-mobile-open');
        dom.drawerOverlay?.classList.add('is-active');
    };

    const closeMobileDrawer = () => {
        dom.sidebar?.classList.remove('is-mobile-open');
        dom.drawerOverlay?.classList.remove('is-active');
    };

    dom.drawerOpenBtn?.addEventListener('click', openMobileDrawer);
    dom.drawerCloseBtn?.addEventListener('click', closeMobileDrawer);
    dom.drawerOverlay?.addEventListener('click', closeMobileDrawer);

    // 7. Modal Kebijakan Privasi Data
    const openModal = () => {
        if (!dom.modal) return;
        dom.modal.hidden = false;
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        if (!dom.modal) return;
        dom.modal.hidden = true;
        document.body.style.overflow = '';
        localStorage.setItem('rw032-policy-accepted', 'true');
    };

    // Tampilkan modal hanya jika belum pernah disetujui sebelumnya
    if (localStorage.getItem('rw032-policy-accepted') !== 'true') {
        openModal();
    }

    dom.openDisclaimerTriggers.forEach((trigger) => {
        trigger.addEventListener('click', () => {
            closeMobileDrawer();
            openModal();
        });
    });

    dom.acceptDisclaimerBtn?.addEventListener('click', closeModal);

    dom.modal?.addEventListener('click', (e) => {
        if (e.target === dom.modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (dom.modal && !dom.modal.hidden) closeModal();
            closeMobileDrawer();
        }
    });
});
