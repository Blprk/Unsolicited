
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
  const PODCAST_IMAGES = {
    "Games People Play": "1586165368502-1bad197a6461",
    "Epicness of Epictetus": "1554188248-986adbb73be4",
    "The Fastlane to Metabolic Health": "1490645935967-10de6ba17061",
    "Historical Jesus": "1544427920-c49ccfb85579",
    "Anatolia-The Rise of Chruch": "1527838832702-585f23df5bb2",
    "Econs vs. Humans": "1611974714024-463798e3c636",
    "Taming the Beast": "1518773553398-650c184e0bb3",
    "Think and Grow Rich: Part I": "1507679722336-4309b3aa59c3",
    "Think and Grow Rich: Part II": "1556761175-59731cb7204f",
    "Deep Work": "1499750310107-5fef28a66643",
    "Stop Worrying-Start Living": "1471922694854-ff1b63b20054",
    "The Art of Influence": "1521791136364-798a730bb3be",
    "The Gene: An Intimate History": "1530026405186-ed1f139313f8",
    "The Creative Process": "1460661419201-94ceb1ca4ff9",
    "Thinking Strategically-HBR": "1529612700005-e35377bf1415",
    "Finite and Infinite Games": "1550684848-86a5d8727436",
    "The Black Swan": "1516934024742-b461fbc4760e",
    "The Strange Death of Europe": "1467269204594-9661b134dd2b",
    "The Good Life": "1506126613408-eca07ce68773",
    "Wounded Men": "1513519245088-0e12902e5a38",
    "Your Gita": "1582510003544-4d00b7f74220",
    "Superman for Dummies": "1496442226666-8d4d0e62e6e9"
  };

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

  // --- Helper Functions ---
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const fetchAlbumArt = (title) => {
    if (!heroArt) return;
    heroArt.classList.add('hidden');

    const imageId = PODCAST_IMAGES[title] || DEFAULT_IMAGE_ID;
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
      mainAudio.load();
      updateHero(title, description);
    }
    bottomPlayer.classList.remove('hidden');
    document.body.classList.add('player-active');
    if (shouldPlay) mainAudio.play();

    podcastCards.forEach(card => {
      if (card.getAttribute('data-src').includes(src)) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
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
      if (mainAudio.src.includes(src)) {
        if (mainAudio.paused) mainAudio.play();
        else mainAudio.pause();
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

  // --- Initial Load ---
  const urlParams = new URLSearchParams(window.location.search);
  const podcastParam = urlParams.get('podcast');
  let startCard = podcastCards[0];
  if (podcastParam) {
    const matchingCard = Array.from(podcastCards).find(card =>
      card.getAttribute('data-title').toLowerCase().replace(/[^a-z0-9]+/g, '-') === podcastParam
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
