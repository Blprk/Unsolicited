
document.addEventListener('DOMContentLoaded', () => {
  // --- Service Worker Registration ---
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');

        // Trigger Pre-caching of Audio Starts
        const audioUrls = Array.from(document.querySelectorAll('.podcast-card'))
          .map(card => card.getAttribute('data-src'));

        if (registration.active) {
          registration.active.postMessage({ type: 'PRECACHE_AUDIO', urls: audioUrls });
        }
      })
      .catch(err => console.log('ServiceWorker registration failed: ', err));
  }

  // SVG Icons
  const PLAY_ICON = `▶`;
  const PAUSE_ICON = `⏸`;

  // Curated Image Mapping (Unsplash IDs)
  // Keys are slugified titles for robust matching
  const PODCAST_IMAGES = {
    "games-people-play": "1586165368502-1bad197a6461",
    "epicness-of-epictetus": "1554188248-986adbb73be4",
    "the-fastlane-to-metabolic-health": "1490645935967-10de6ba17061",
    "historical-jesus": "1544427920-c49ccfb85579",
    "anatolia-the-rise-of-chruch": "1527838832702-585f23df5bb2",
    "anatolia-the-rise-of-church": "1527838832702-585f23df5bb2",
    "st-francis-riches-to-rags": "1554188248-986adbb73be4",
    "econs-vs-humans": "1611974714024-463798e3c636",
    "taming-the-beast": "1518773553398-650c184e0bb3",
    "think-and-grow-rich-part-i": "1507679722336-4309b3aa59c3",
    "think-and-grow-rich-part-ii": "1556761175-59731cb7204f",
    "deep-work": "1499750310107-5fef28a66643",
    "stop-worrying-start-living": "1471922694854-ff1b63b20054",
    "the-art-of-influence": "1521791136364-798a730bb3be",
    "the-gene-an-intimate-history": "1530026405186-ed1f139313f8",
    "the-creative-process": "1460661419201-94ceb1ca4ff9",
    "thinking-strategically-hbr": "1529612700005-e35377bf1415",
    "finite-and-infinite-games": "1550684848-86a5d8727436",
    "the-black-swan": "1516934024742-b461fbc4760e",
    "the-strange-death-of-europe": "1467269204594-9661b134dd2b",
    "the-good-life": "1506126613408-eca07ce68773",
    "wounded-men": "1513519245088-0e12902e5a38",
    "your-gita": "1582510003544-4d00b7f74220",
    "superman-for-dummies": "1496442226666-8d4d0e62e6e9"
  };

  const getSlug = (text) => text ? text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : '';

  const DEFAULT_IMAGE_ID = "1508700115892-45ecd05ae2ad";

  // Selectors
  const toggleContainer = document.getElementById('theme-toggle');
  const rootElement = document.documentElement;
  const bottomPlayer = document.querySelector('.bottom-player');
  const mainAudio = document.getElementById('main-audio');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const progressBar = document.getElementById('progress-bar');
  const currentTimeEl = document.getElementById('current-time');
  const totalDurationEl = document.getElementById('total-duration');
  const playingTitle = document.querySelector('.playing-title');
  const playingDesc = document.querySelector('.playing-description');
  const heroArt = document.getElementById('hero-art');
  const heroTitle = document.querySelector('.featured-title');
  const heroFullDesc = document.querySelector('.featured-full-description');
  const heroPlayBtn = document.querySelector('.hero-play-button');
  const podcastCards = document.querySelectorAll('.podcast-card');
  const jumpToTopBtn = document.getElementById('jump-to-top-btn');

  // --- Theme Toggle ---
  const savedTheme = localStorage.getItem('theme') || 'light';
  rootElement.setAttribute('data-theme', savedTheme);
  if (toggleContainer) {
    toggleContainer.addEventListener('click', () => {
      const newTheme = rootElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      rootElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);

      // Update PWA theme-color meta
      const metaThemeColor = document.getElementById('theme-color-meta');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', newTheme === 'light' ? '#F4F7F6' : '#121212');
      }
    });
  }

  // --- Jump to Top Logic ---
  window.onscroll = function () {
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
      if (jumpToTopBtn) jumpToTopBtn.style.display = "flex";
    } else {
      if (jumpToTopBtn) jumpToTopBtn.style.display = "none";
    }
  };
  if (jumpToTopBtn) {
    jumpToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const initCardThumbnails = () => {
    podcastCards.forEach(card => {
      const title = card.getAttribute('data-title');
      const slug = getSlug(title);
      const imgEl = card.querySelector('.card-thumb-img');
      const imageId = PODCAST_IMAGES[slug] || DEFAULT_IMAGE_ID;

      if (imgEl) {
        const src = `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=400&h=400&q=80`;
        const fallbackSrc = `https://images.unsplash.com/photo-${DEFAULT_IMAGE_ID}?auto=format&fit=crop&w=400&h=400&q=80`;

        // Simple preloader for cards
        const tempImg = new Image();
        tempImg.src = src;
        tempImg.onload = () => { imgEl.src = src; };
        tempImg.onerror = () => { imgEl.src = fallbackSrc; };
      }
    });
  };

  initCardThumbnails();

  // --- Carousel Logic ---
  const podcastList = document.querySelector('.podcast-list');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');

  if (podcastList && prevBtn && nextBtn) {
    const scrollAmount = 400;

    nextBtn.addEventListener('click', () => {
      podcastList.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    prevBtn.addEventListener('click', () => {
      podcastList.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    const update3DScroll = () => {
      const containerRect = podcastList.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;

      podcastCards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const distanceFromCenter = cardCenterX - centerX;
        const absDistance = Math.abs(distanceFromCenter);

        // Calculate progress (0 at center, 1 at edges)
        const maxDistance = containerRect.width * 0.7; // Range of effect
        const progress = Math.min(absDistance / maxDistance, 1);

        // 3D Transformations
        const scale = 1 - (progress * 0.15); // 1.0 down to 0.85
        const rotation = (distanceFromCenter / maxDistance) * -20; // Tilt away
        const opacity = 1 - (progress * 0.5); // Fade out
        const translateZ = progress * -150; // Move into background

        card.style.transform = `scale(${scale}) rotateY(${rotation}deg) translateZ(${translateZ}px)`;
        card.style.opacity = opacity;
        card.style.zIndex = Math.round(100 * (1 - progress));
      });
    };

    podcastList.addEventListener('scroll', () => {
      // Logic for button visibility
      const scrollLeft = podcastList.scrollLeft;
      const maxScroll = podcastList.scrollWidth - podcastList.clientWidth;
      prevBtn.style.display = scrollLeft > 10 ? 'flex' : 'none';
      nextBtn.style.display = scrollLeft < maxScroll - 10 ? 'flex' : 'none';

      // Blazing fast 3D updates
      requestAnimationFrame(update3DScroll);
    });

    // Initialize state
    update3DScroll();
    window.addEventListener('resize', update3DScroll);
  }

  // --- Helper Functions ---
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const fetchAlbumArt = (title) => {
    if (!heroArt) return;
    heroArt.classList.add('hidden');

    const slug = getSlug(title);
    const imageId = PODCAST_IMAGES[slug] || DEFAULT_IMAGE_ID;
    const src = `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=600&h=600&q=80`;

    // Preload image
    const tempImg = new Image();
    tempImg.src = src;
    tempImg.onload = () => {
      heroArt.src = src;
      heroArt.classList.remove('hidden');
    };
    tempImg.onerror = () => {
      heroArt.src = `https://images.unsplash.com/photo-${DEFAULT_IMAGE_ID}?auto=format&fit=crop&w=600&h=600&q=80`;
      heroArt.classList.remove('hidden');
    };
  };

  const updateHero = (title, description) => {
    if (heroTitle) heroTitle.textContent = title;
    if (heroFullDesc) heroFullDesc.textContent = description;
    fetchAlbumArt(title);
  };

  const updatePlayerUI = (src, title, description, shouldPlay = true) => {
    const isNew = !mainAudio.src.includes(src);
    if (isNew) {
      mainAudio.src = src;
      playingTitle.textContent = title;
      playingDesc.textContent = description;
      // mainAudio.load(); // REDUNDANT: Setting src already triggers load
      updateHero(title, description);
    }
    bottomPlayer.classList.remove('hidden');
    document.body.classList.add('player-active');

    // Trigger play immediately to kick off buffering
    if (shouldPlay) {
      const playPromise = mainAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => console.log("Playback interrupted or blocked:", error));
      }
    }

    // Update active states for both carousel and archive list
    const archiveItems = document.querySelectorAll('.archive-item');

    podcastCards.forEach(card => {
      if (card.getAttribute('data-src').includes(src)) {
        card.classList.add('active');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        card.classList.remove('active');
      }
    });

    archiveItems.forEach(item => {
      if (item.getAttribute('data-src').includes(src)) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    history.pushState(null, '', `?podcast=${slug}`);
  };

  // --- Event Listeners ---
  podcastCards.forEach(card => {
    card.addEventListener('click', () => {
      const src = card.getAttribute('data-src');
      const title = card.getAttribute('data-title');
      const desc = card.getAttribute('data-description');

      const isCurrentSource = mainAudio.src.includes(src);
      const isPlayerHidden = bottomPlayer.classList.contains('hidden');

      if (isCurrentSource && !isPlayerHidden) {
        if (mainAudio.paused) {
          mainAudio.play();
        } else {
          mainAudio.pause();
        }
      } else {
        updatePlayerUI(src, title, desc);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  if (heroPlayBtn) {
    heroPlayBtn.addEventListener('click', () => {
      const activeCard = document.querySelector('.podcast-card.active');
      const targetCard = activeCard || podcastCards[0];
      if (targetCard) {
        const src = targetCard.getAttribute('data-src');
        if (mainAudio.src.includes(src) && !mainAudio.paused) {
          mainAudio.pause();
        } else {
          updatePlayerUI(src, targetCard.getAttribute('data-title'), targetCard.getAttribute('data-description'));
        }
      }
    });
  }

  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      if (mainAudio.paused) mainAudio.play();
      else mainAudio.pause();
    });
  }

  mainAudio.ontimeupdate = () => {
    const progress = (mainAudio.currentTime / mainAudio.duration) * 100;
    progressBar.value = progress || 0;
    currentTimeEl.textContent = formatTime(mainAudio.currentTime);
  };
  mainAudio.onloadedmetadata = () => {
    totalDurationEl.textContent = formatTime(mainAudio.duration);
  };
  mainAudio.onplay = () => {
    playPauseBtn.textContent = PAUSE_ICON;
    if (heroPlayBtn) heroPlayBtn.innerHTML = `<span class="icon">⏸</span> Pause`;
    document.body.classList.add('player-engaged');
  };
  mainAudio.onpause = () => {
    playPauseBtn.textContent = PLAY_ICON;
    if (heroPlayBtn) heroPlayBtn.innerHTML = `<span class="icon">▶</span> Play`;
    document.body.classList.remove('player-engaged');
  };
  progressBar.oninput = () => {
    const time = (progressBar.value / 100) * mainAudio.duration;
    mainAudio.currentTime = time;
  };

  // --- Archive List Logic ---
  const initArchiveList = () => {
    const archiveList = document.getElementById('episode-archive-list');
    if (!archiveList) return;

    podcastCards.forEach(card => {
      const src = card.getAttribute('data-src');
      const title = card.getAttribute('data-title');
      const desc = card.getAttribute('data-description');
      const slug = getSlug(title);
      const imageId = PODCAST_IMAGES[slug] || DEFAULT_IMAGE_ID;
      const imageUrl = `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=150&h=150&q=80`;
      const fallbackUrl = `https://images.unsplash.com/photo-${DEFAULT_IMAGE_ID}?auto=format&fit=crop&w=150&h=150&q=80`;

      const item = document.createElement('div');
      item.className = 'archive-item';
      item.setAttribute('data-src', src);
      item.innerHTML = `
        <div class="archive-thumb">
          <img class="archive-list-img" src="" alt="${title}">
        </div>
        <div class="archive-content">
          <h4>${title}</h4>
          <p>${desc}</p>
        </div>
        <div class="archive-play-btn">▶</div>
      `;

      const listImg = item.querySelector('.archive-list-img');
      if (listImg) {
        const tempImg = new Image();
        tempImg.src = imageUrl;
        tempImg.onload = () => { listImg.src = imageUrl; };
        tempImg.onerror = () => { listImg.src = fallbackUrl; };
      }

      item.addEventListener('click', () => {
        updatePlayerUI(src, title, desc);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      archiveList.appendChild(item);
    });
  };

  initArchiveList();

  // --- Initial Load ---
  const urlParams = new URLSearchParams(window.location.search);
  const podcastParam = urlParams.get('podcast');
  let startCard = podcastCards[0];
  if (podcastParam) {
    const matchingCard = Array.from(podcastCards).find(card =>
      getSlug(card.getAttribute('data-title')) === podcastParam
    );
    if (matchingCard) startCard = matchingCard;
  }
  if (startCard) {
    const src = startCard.getAttribute('data-src');
    const title = startCard.getAttribute('data-title');
    const desc = startCard.getAttribute('data-description');
    updateHero(title, desc);
    startCard.classList.add('active');
    mainAudio.src = src;
    playingTitle.textContent = title;
    playingDesc.textContent = desc;
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (mainAudio.src) {
        if (mainAudio.paused) mainAudio.play();
        else mainAudio.pause();
      }
    }
  });
});
