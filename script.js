document.addEventListener('DOMContentLoaded', () => {
    const cardHeaders = document.querySelectorAll('.dir-card-header');

    cardHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const currentCard = header.closest('.dir-card');
            const isCurrentlyOpen = currentCard.classList.contains('is-open');

            // Opsional: Tutup kartu lain secara otomatis (mode accordion)
            // Hapus 4 baris di bawah ini jika ingin pengguna bisa membuka banyak kartu sekaligus
            document.querySelectorAll('.dir-card.is-open').forEach(openCard => {
                openCard.classList.remove('is-open');
                openCard.querySelector('.dir-card-header').setAttribute('aria-expanded', 'false');
            });

            // Toggle kartu yang diklik
            if (!isCurrentlyOpen) {
                currentCard.classList.add('is-open');
                header.setAttribute('aria-expanded', 'true');
            } else {
                currentCard.classList.remove('is-open');
                header.setAttribute('aria-expanded', 'false');
            }
        });
    });
});
