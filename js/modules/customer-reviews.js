const AUTOPLAY_DELAY_MS = 7000;

function createStars(rating) {
    const roundedRating = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)));
    return `${'★'.repeat(roundedRating)}${'☆'.repeat(5 - roundedRating)}`;
}

function createReviewCard(review) {
    const card = document.createElement('article');
    card.className = 'customer-review-card';

    const author = document.createElement('h3');
    author.className = 'customer-review-author';
    author.textContent = review.author;

    const published = document.createElement('p');
    published.className = 'customer-review-published';
    published.textContent = review.published || 'Cliente de MADE ACRÍLICO';

    const stars = document.createElement('p');
    stars.className = 'customer-review-stars';
    stars.setAttribute('aria-label', `${review.rating} de 5 estrellas`);
    stars.textContent = createStars(review.rating);

    const text = document.createElement('p');
    text.className = 'customer-review-text';
    text.textContent = review.text;

    card.append(author, published, stars, text);
    return card;
}

export function initializeCustomerReviews(reviews) {
    const carousel = document.getElementById('customer-reviews-carousel');
    const track = document.getElementById('customer-reviews-track');
    if (!carousel || !track || !Array.isArray(reviews) || !reviews.length) return;

    track.replaceChildren(...reviews.map(createReviewCard));
    carousel.hidden = false;

    const controls = document.getElementById('customer-reviews-controls');
    const previous = document.getElementById('customer-reviews-previous');
    const next = document.getElementById('customer-reviews-next');
    const position = document.getElementById('customer-reviews-position');
    let currentIndex = 0;
    let autoplayTimer = null;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = () => {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        if (position) position.textContent = `${currentIndex + 1} / ${reviews.length}`;
    };
    const stopAutoplay = () => {
        if (autoplayTimer) window.clearInterval(autoplayTimer);
        autoplayTimer = null;
    };
    const startAutoplay = () => {
        stopAutoplay();
        if (reducedMotion || reviews.length < 2) return;
        autoplayTimer = window.setInterval(() => {
            currentIndex = (currentIndex + 1) % reviews.length;
            render();
        }, AUTOPLAY_DELAY_MS);
    };
    const move = direction => {
        currentIndex = (currentIndex + direction + reviews.length) % reviews.length;
        render();
        startAutoplay();
    };

    if (controls) controls.hidden = reviews.length < 2;
    previous?.addEventListener('click', () => move(-1));
    next?.addEventListener('click', () => move(1));
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);
    carousel.addEventListener('focusin', stopAutoplay);
    carousel.addEventListener('focusout', event => {
        if (!carousel.contains(event.relatedTarget)) startAutoplay();
    });

    render();
    startAutoplay();
}
