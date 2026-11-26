const titleElement = document.getElementById('page-title');
const homeEyebrow = document.getElementById('home-eyebrow');
const messageElement = document.getElementById('message');
const statusElement = document.getElementById('status');
const guestNavigation = document.getElementById('guest-navigation');
const guestList = document.getElementById('guest-list');
const musicSection = document.getElementById('music-section');
const playerElement = document.getElementById('spotify-player');
const guestOrder = ['ton', 'jose', 'sonja', 'ramon', 'monique', 'arthur', 'brigit', 'tim', 'bob', 'joep', 'eva', 'sophie', 'mats'];
const guestPortraits = {
    ton: 'images/sint-ton.jpg',
    jose: 'images/hoodpiet-jose.jpg',
    sonja: 'images/piet-sonja.jpg',
    monique: 'images/piet-monique.jpg',
    arthur: 'images/piet-arthur.jpg',
    ramon: 'images/piet-ramon.jpg',
    brigit: 'images/piet-brigit.jpg',
    tim: 'images/piet-tim.jpg',
    bob: 'images/piet-bob.jpg',
    joep: 'images/piet-joep.jpg',
    eva: 'images/piet-eva.jpg',
    sophie: 'images/piet-sophie.jpg',
    mats: 'images/piets-mats.png'
};

function showStatus(text) {
    statusElement.textContent = text;
}

function spotifyEmbedUrl(shareUrl) {
    try {
        const url = new URL(shareUrl);
        if (url.protocol !== 'https:' || url.hostname !== 'open.spotify.com') {
            return null;
        }

        const match = url.pathname.match(/\/(track|playlist|album|episode|show)\/([A-Za-z0-9]+)/);
        return match ? `https://open.spotify.com/embed/${match[1]}/${match[2]}` : null;
    } catch {
        return null;
    }
}

function applyGuestTheme(theme = {}) {
    const themeProperties = {
        backgroundColor: '--theme-bg',
        backgroundDeep: '--theme-bg-deep',
        glow: '--theme-glow',
        overlayTop: '--theme-overlay-top',
        overlayBottom: '--theme-overlay-bottom',
        card: '--theme-card',
        heading: '--theme-heading',
        text: '--theme-text',
        accent: '--theme-accent',
        border: '--theme-border'
    };

    for (const [key, property] of Object.entries(themeProperties)) {
        if (typeof theme[key] === 'string') {
            document.body.style.setProperty(property, theme[key]);
        }
    }

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta && theme.backgroundColor) {
        themeColorMeta.content = theme.backgroundColor;
    }

    if (typeof theme.backgroundImage === 'string' && theme.backgroundImage) {
        const imageUrl = new URL(theme.backgroundImage, document.baseURI);
        if (imageUrl.origin === window.location.origin && imageUrl.pathname.includes('/images/')) {
            document.body.style.setProperty('--theme-image', `url("${imageUrl.href}")`);
        }
    }
}

async function loadPersonalPage() {
    const guestId = new URLSearchParams(window.location.search).get('voor');

    if (!guestId) {
        document.body.dataset.page = 'home';
        homeEyebrow.hidden = false;
        titleElement.textContent = 'Kies je naam';
    }

    try {
        const response = await fetch('data/gasten.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('Gastenbestand niet beschikbaar');

        const guests = await response.json();

        if (!guestId) {
            document.title = 'Kies je naam | Pakjesavond';
            if (guests.length === 0) {
                showStatus('Er zijn nog geen gasten toegevoegd.');
                return;
            }

            const orderedGuests = [
                ...guestOrder.map((id) => guests.find((guest) => guest.id === id)).filter(Boolean),
                ...guests.filter((guest) => !guestOrder.includes(guest.id))
            ];

            for (const guest of orderedGuests) {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = `?voor=${encodeURIComponent(guest.id)}`;

                if (guestPortraits[guest.id]) {
                    const portrait = document.createElement('img');
                    portrait.src = guestPortraits[guest.id];
                    portrait.alt = '';
                    portrait.loading = 'lazy';
                    portrait.decoding = 'async';
                    link.append(portrait);
                }

                const name = document.createElement('span');
                name.textContent = guest.name;
                link.append(name);
                listItem.append(link);
                guestList.append(listItem);
            }
            guestNavigation.hidden = false;
            return;
        }

        const guest = guests.find((item) => item.id === guestId.toLowerCase());

        if (!guest) {
            titleElement.textContent = 'Pagina niet gevonden';
            messageElement.textContent = 'Controleer de QR-code of vraag de organisator om hulp.';
            messageElement.hidden = false;
            return;
        }

        document.body.dataset.guest = guest.id;
        document.title = `${guest.name} | Pakjesavond`;
        applyGuestTheme(guest.theme);
        titleElement.textContent = `Lieve ${guest.name},`;

        try {
            const poemResponse = await fetch('data/rijmtekst.txt', { cache: 'no-store' });
            if (poemResponse.ok) {
                const poem = (await poemResponse.text()).trim();
                if (poem) {
                    messageElement.textContent = poem;
                    messageElement.hidden = false;
                }
            }
        } catch {
            showStatus('Het gezamenlijke rijm kon niet worden geladen.');
        }

        if (guest.spotifyUrl) {
            const embedUrl = spotifyEmbedUrl(guest.spotifyUrl);
            if (!embedUrl) {
                showStatus('De Spotify-link lijkt niet geldig. Controleer de link in data/gasten.json.');
                return;
            }

            musicSection.hidden = false;
            const iframe = document.createElement('iframe');
            const playerUrl = new URL(embedUrl);
            if (!playerUrl.searchParams.has('theme')) {
                playerUrl.searchParams.set('theme', '0');
            }
            iframe.src = playerUrl.toString();
            iframe.title = `Spotify-player voor ${guest.name}`;
            iframe.loading = 'eager';
            iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
            iframe.allowFullscreen = true;
            playerElement.append(iframe);
        }
    } catch {
        titleElement.textContent = 'Oeps, de pagina kon niet laden';
        messageElement.textContent = 'Probeer het later nog eens of vraag de organisator om hulp.';
        messageElement.hidden = false;
    }
}

loadPersonalPage();