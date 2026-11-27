const CONTACT_EMAIL = "mallamo.simone@gmail.com";
// Chiave di Web3Forms (web3forms.com): è pubblica per natura, serve solo a sapere a quale email inoltrare i messaggi.
const WEB3FORMS_KEY = "070a9db1-fe8d-47d6-b1da-efb452ec5d16";
const LANGS = ["it", "en", "es"];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// Foto: un percorso locale (es. "assets/progetti/.../01.jpg") oppure un ID Unsplash segnaposto.
// Per le foto locali, a misure piccole (miniature, cartelle) si usa la copia in "small/".
const photo = (id, width) => id.includes("/")
  ? (width <= 500 ? id.replace(/\/([^/]+)$/, "/small/$1") : id)
  : `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=75`;
// Copertina della scheda: `cover` se c'è (es. fotogramma del video), altrimenti la prima foto.
const coverOf = (project, width) => project.cover || photo(project.gallery[0], width);

/* ---------- Lingue ---------- */
// L'italiano si legge da index.html, così i testi non sono duplicati.
const italian = {
  metaTitle: document.title,
  metaDescription: document.querySelector('meta[name="description"]').content,
  formSubject: "Richiesta contenuti",
  formSending: "Invio in corso…",
  formSent: "Grazie! Ho ricevuto la tua richiesta e ti risponderò al più presto.",
  formError: "Invio non riuscito. Riprova oppure scrivimi a",
  tagExample: "Esempio",
  baExample: "Esempio",
  openCard: "Apri la scheda",
  folderOpen: "Apri la cartella",
  comingSoon: "In arrivo",
  dFoto: "Foto",
  dVideo: "Video",
};
document.querySelectorAll("[data-i18n]").forEach((el) => { italian[el.dataset.i18n] = el.textContent; });
document.querySelectorAll("[data-i18n-aria]").forEach((el) => { italian[el.dataset.i18nAria] = el.getAttribute("aria-label"); });
TRANSLATIONS.it = italian;

function savedLang() {
  try { return localStorage.getItem("lang"); } catch { return null; }
}
let currentLang = [new URLSearchParams(location.search).get("lang"), savedLang(), navigator.language.slice(0, 2)]
  .find((lang) => LANGS.includes(lang)) || "en"; // lingua di riserva: inglese
const t = (key) => TRANSLATIONS[currentLang][key] ?? italian[key];

function applyLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.title = t("metaTitle");
  document.querySelector('meta[name="description"]').content = t("metaDescription");
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
  document.querySelectorAll("[data-lang]").forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang)));
  renderPortfolio();
  renderBeforeAfterTabs();
  showStop(activeStop, false);
}

document.querySelectorAll("[data-lang]").forEach((btn) => {
  btn.addEventListener("click", () => {
    applyLang(btn.dataset.lang);
    try { localStorage.setItem("lang", btn.dataset.lang); } catch { /* preferenza non salvata */ }
  });
});

/* ---------- Header ---------- */
const header = document.getElementById("site-header");
const updateHeader = () => header.classList.toggle("is-solid", window.scrollY > 40);

/* ---------- Hero: parallasse col mouse ---------- */
const depthLayers = [...document.querySelectorAll("[data-depth]")];
if (!reducedMotion && matchMedia("(pointer: fine)").matches) {
  document.querySelector(".hero").addEventListener("pointermove", (event) => {
    const x = event.clientX / innerWidth - 0.5;
    const y = event.clientY / innerHeight - 0.5;
    depthLayers.forEach((layer) => {
      const depth = Number(layer.dataset.depth);
      layer.style.transform = `translate(${-x * depth}px, ${-y * depth}px)`;
    });
  });
}

/* ---------- Parallasse delle fasce fotografiche ---------- */
const parallaxLayers = [...document.querySelectorAll("[data-parallax]")];
function updateParallax() {
  parallaxLayers.forEach((layer) => {
    const rect = layer.parentElement.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const progress = (rect.top + rect.height / 2 - innerHeight / 2) / innerHeight;
    layer.style.transform = `translateY(${progress * -12}%)`;
  });
}

/* ---------- Prima / dopo ---------- */
const compare = document.getElementById("compare");
const compareInput = compare.querySelector("input");
compareInput.addEventListener("input", (event) => {
  compare.style.setProperty("--pos", `${event.target.value}%`);
});
const baTabs = document.getElementById("ba-tabs");
let baIndex = 0;

const baImgs = [document.getElementById("ba-before"), document.getElementById("ba-after")];
const baVideos = [document.getElementById("ba-before-video"), document.getElementById("ba-after-video")];
let baVisible = false;

// I video partono solo quando il confronto è sullo schermo e restano allineati:
// il "prima" segue sempre il tempo del "dopo".
function playBeforeAfterVideos() {
  const [before, after] = baVideos;
  if (after.hidden) return;
  if (!baVisible) { baVideos.forEach((v) => v.pause()); return; }
  before.currentTime = after.currentTime;
  baVideos.forEach((v) => v.play().catch(() => {}));
}
baVideos[1].addEventListener("timeupdate", () => {
  const [before, after] = baVideos;
  if (Math.abs(before.currentTime - after.currentTime) > 0.08) before.currentTime = after.currentTime;
});
new IntersectionObserver(([entry]) => {
  baVisible = entry.isIntersecting;
  playBeforeAfterVideos();
}).observe(compare);

function showBeforeAfter(index) {
  baIndex = index;
  const pair = BEFORE_AFTER[index];
  const isVideo = Boolean(pair.video);
  compare.classList.toggle("is-split", Boolean(pair.split));
  document.getElementById("ba-note").hidden = !pair.split;
  baImgs.forEach((img) => { img.hidden = isVideo; });
  baVideos.forEach((video) => { video.hidden = !isVideo; video.pause(); });
  if (isVideo) {
    const [before, after] = baVideos;
    before.poster = pair.beforePoster; before.src = pair.before;
    after.poster = pair.afterPoster; after.src = pair.after;
    baVideos.forEach((v) => { v.preload = "auto"; });
    playBeforeAfterVideos();
  } else {
    baImgs[0].src = pair.before;
    baImgs[1].src = pair.after;
  }
  [...baTabs.children].forEach((tab, i) => tab.setAttribute("aria-selected", String(i === index)));
  // A ogni cambio di esempio il cursore torna a metà.
  compareInput.value = 50;
  compare.style.setProperty("--pos", "50%");
}

function renderBeforeAfterTabs() {
  baTabs.replaceChildren(...BEFORE_AFTER.map((_, i) => {
    const tab = el("button", "ba-tab", `${t("baExample")} ${i + 1}`);
    tab.type = "button";
    tab.setAttribute("role", "tab");
    tab.addEventListener("click", () => showBeforeAfter(i));
    return tab;
  }));
  baTabs.hidden = BEFORE_AFTER.length < 2;
  showBeforeAfter(baIndex);
}

/* ---------- Percorso dell'ospite ---------- */
const journey = document.getElementById("percorso");
const routePath = document.getElementById("route-path");
const routeReveal = document.getElementById("route-reveal");
const pins = [...document.querySelectorAll(".pin")];
const journeyCard = document.querySelector(".journey-card");
const journeyPhotos = [...journey.querySelectorAll(".journey-photos img")];
let activeStop = 0;

function placePins() {
  const total = routePath.getTotalLength();
  pins.forEach((pin) => {
    const point = routePath.getPointAtLength(total * Number(pin.dataset.at));
    pin.style.left = `${point.x / 10}%`;
    pin.style.top = `${point.y / 6}%`;
  });
}

function showStop(index, animate = true) {
  activeStop = index;
  const n = index + 1;
  document.getElementById("journey-num").textContent = `0${n}`;
  document.getElementById("journey-title").textContent = t(`j${n}Title`);
  document.getElementById("journey-text").textContent = t(`j${n}Text`);
  journeyPhotos.forEach((img, i) => img.classList.toggle("is-active", i === index));
  pins.forEach((pin, i) => {
    pin.classList.toggle("is-active", i === index);
    pin.setAttribute("aria-pressed", String(i === index));
    pin.setAttribute("aria-label", `${i + 1}. ${t(`j${i + 1}Title`)}`);
  });
  if (animate && !reducedMotion) {
    journeyCard.classList.remove("is-changing");
    void journeyCard.offsetWidth;
    journeyCard.classList.add("is-changing");
  }
}

// Disegna il percorso fino a "progress" (0 = punto 1, 1 = punto 4) e accende i punti raggiunti.
function drawRoute(progress) {
  routeReveal.setAttribute("stroke-dashoffset", String(1 - progress));
  let reached = 0;
  pins.forEach((pin, i) => {
    const isReached = progress >= Number(pin.dataset.at) - 0.02;
    pin.classList.toggle("is-reached", isReached);
    if (isReached) reached = i;
  });
  return reached;
}

// Animazione unica: quando il percorso entra nello schermo va da 1 a 4, poi torna sull'1.
// Da lì in poi è il visitatore a scegliere il numero.
const JOURNEY_DURATION = 4200;
const JOURNEY_PAUSE = 1600;
let journeyFrame = 0;
let journeyTimeout = 0;

function playJourney() {
  const startTime = performance.now();
  let shown = 0;
  const step = (now) => {
    const progress = Math.min(1, (now - startTime) / JOURNEY_DURATION);
    const reached = drawRoute(progress);
    if (reached !== shown) {
      shown = reached;
      showStop(reached);
    }
    if (progress < 1) journeyFrame = requestAnimationFrame(step);
    else journeyTimeout = setTimeout(() => showStop(0), JOURNEY_PAUSE);
  };
  journeyFrame = requestAnimationFrame(step);
}

function stopJourney() {
  cancelAnimationFrame(journeyFrame);
  clearTimeout(journeyTimeout);
  drawRoute(1);
}

if (!reducedMotion && "IntersectionObserver" in window) {
  drawRoute(0);
  const journeyObserver = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    journeyObserver.disconnect();
    playJourney();
  }, { threshold: 0.6 });
  journeyObserver.observe(journey.querySelector(".journey-map"));
} else {
  drawRoute(1);
}

pins.forEach((pin, i) => pin.addEventListener("click", () => {
  stopJourney();
  showStop(i);
}));

/* ---------- Chi sono: una foto per luogo, con il paese in oro dietro ---------- */
// Le foto cambiano da sole ogni pochi secondi (solo quando la sezione è sullo schermo);
// clic/tocco o pallini per passare subito a un'altra foto.
const aboutFrame = document.querySelector(".jt-frame");
if (aboutFrame) {
  const items = [...aboutFrame.querySelectorAll(".jt-item")];
  const dots = el("div", "place-dots");
  const ABOUT_INTERVAL = 3000;
  let active = 0, timer = 0, onScreen = false;
  const restart = () => {
    clearInterval(timer);
    timer = onScreen && !document.hidden ? setInterval(() => show(active + 1, false), ABOUT_INTERVAL) : 0;
  };
  const show = (index, manual = true) => {
    active = (index + items.length) % items.length;
    items.forEach((item, i) => item.classList.toggle("is-active", i === active));
    [...dots.children].forEach((dot, i) => dot.setAttribute("aria-current", String(i === active)));
    if (manual) restart();
  };
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    // Quando la sezione si avvicina carico subito tutte le foto, così il cambio non mostra vuoti.
    if (onScreen) aboutFrame.querySelectorAll("img[loading='lazy']").forEach((img) => { img.loading = "eager"; });
    restart();
  }, { threshold: 0.3 })
    .observe(aboutFrame);
  document.addEventListener("visibilitychange", restart);
  items.forEach((_, i) => {
    const dot = el("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `${i + 1} / ${items.length}`);
    dot.addEventListener("click", () => show(i));
    dots.append(dot);
  });
  aboutFrame.after(dots);
  aboutFrame.addEventListener("click", () => show(active + 1));
  show(0);
}

/* ---------- Servizi: "il mirino" ---------- */
// Il selettore (come nell'app fotocamera) cambia la modalità: il riquadro prende la forma del servizio
// e accanto compare il suo testo. In modalità TOUR il timecode scorre come in una ripresa vera.
const viewfinder = document.getElementById("vf");
if (viewfinder) {
  const modes = [...document.querySelectorAll(".vf-mode")];
  const copies = [...document.querySelectorAll(".vf-copy")];
  const timecode = document.getElementById("vf-tc");
  let frames = 0, ticker = 0, onScreen = false;
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    frames += 1;
    const f = frames % 25, sec = Math.floor(frames / 25);
    timecode.textContent = `00:${pad(Math.floor(sec / 60) % 60)}:${pad(sec % 60)}:${pad(f)}`;
  };
  const videos = [...viewfinder.querySelectorAll(".vf-media video")];
  // Timecode e video girano solo per la modalità attiva e solo con il mirino sullo schermo.
  const runTimecode = () => {
    clearInterval(ticker);
    if (onScreen && viewfinder.dataset.mode === "tour") ticker = setInterval(tick, 40);
    videos.forEach((video) => {
      const active = onScreen && video.closest(".vf-media").dataset.for === viewfinder.dataset.mode;
      if (active) video.play().catch(() => {});
      else video.pause();
    });
  };
  const setMode = (button, focus) => {
    const mode = button.dataset.mode;
    viewfinder.dataset.mode = mode;
    modes.forEach((b) => {
      const on = b === button;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
    });
    copies.forEach((c) => { c.hidden = c.dataset.for !== mode; });
    frames = 0;
    videos.forEach((video) => { if (video.closest(".vf-media").dataset.for === mode) video.currentTime = 0; });
    runTimecode();
    if (focus) button.focus();
  };
  modes.forEach((button, i) => {
    button.tabIndex = i === 0 ? 0 : -1;
    button.addEventListener("click", () => setMode(button));
    button.addEventListener("keydown", (event) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      setMode(modes[(i + step + modes.length) % modes.length], true);
    });
  });
  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; runTimecode(); }).observe(viewfinder);
}

/* ---------- Portfolio: cartelle e cartoline ---------- */
const foldersEl = document.getElementById("folders");
const deck = document.getElementById("deck");
const deckCards = document.getElementById("deck-cards");
const dialog = document.getElementById("project-dialog");
const TAG_KEYS = { foto: "dFoto", video: "dVideo" };
let openCategory = null;
let deckIndex = 0;
let landingTimer = 0;

const projectsOf = (id) => PROJECTS.filter((project) => project.category === id);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderFolders() {
  const visible = CATEGORIES.filter((cat) => cat.soon || projectsOf(cat.id).length > 0);
  foldersEl.style.setProperty("--count", visible.length);
  foldersEl.replaceChildren(...visible.map((cat, i) => {
    const items = projectsOf(cat.id);
    const folder = el("button", "folder");
    folder.type = "button";
    folder.style.setProperty("--tilt", `${[-1.5, 1, -0.5][i % 3]}deg`);
    folder.setAttribute("aria-expanded", String(openCategory === cat.id));
    folder.classList.toggle("is-open", openCategory === cat.id);

    const back = el("span", "folder-back");
    back.append(el("span", "folder-tab"));
    // Le copertine dei primi progetti sbucano dalla cartella.
    const peek = el("span", "folder-peek");
    items.slice(0, 3).forEach((project, n) => {
      const img = el("img");
      img.src = coverOf(project, 500);
      if (project.coverPosition) img.style.objectPosition = project.coverPosition;
      img.alt = "";
      img.loading = "lazy";
      img.style.setProperty("--n", n);
      peek.append(img);
    });
    const front = el("span", "folder-front");
    front.append(el("span", "folder-mark", "◆"), el("strong", "", cat.name[currentLang]));
    folder.setAttribute("aria-label", `${t("folderOpen")}: ${cat.name[currentLang]}`);
    if (items.length === 0) {
      // Cartella ancora vuota: timbro "In arrivo", non si apre.
      folder.classList.add("is-soon");
      folder.disabled = true;
      folder.removeAttribute("aria-expanded");
      folder.setAttribute("aria-label", `${cat.name[currentLang]}: ${t("comingSoon")}`);
      front.append(el("span", "folder-stamp", t("comingSoon")));
    }
    folder.append(back, peek, front);
    folder.addEventListener("click", () => (openCategory === cat.id ? closeDeck() : openDeck(cat.id)));
    return folder;
  }));
}

function postcard(project, i) {
  const card = el("button", "postcard");
  card.type = "button";
  card.style.setProperty("--i", i);
  const img = el("img");
  img.src = coverOf(project, 700);
  img.alt = "";
  if (project.coverPosition) img.style.objectPosition = project.coverPosition;
  const body = el("span", "postcard-body");
  const tags = el("span", "postcard-tags");
  project.filters.forEach((f) => tags.append(el("span", "", f === "drone" ? "Drone" : t(TAG_KEYS[f]))));
  body.append(el("span", "postcard-place", project.place[currentLang]), el("strong", "postcard-title", project.title[currentLang]), tags);
  card.append(img, body);
  if (project.example) card.append(el("span", "draft-tag", t("tagExample")));
  card.addEventListener("click", () => {
    if (Date.now() - swipedAt < 400) return;
    if (i === deckIndex) openProject(project);
    else showCard(i);
  });
  return card;
}

// Ventaglio: la cartolina attiva al centro, le altre ai lati, ruotate e più piccole.
function showCard(index) {
  const cards = [...deckCards.children];
  deckIndex = Math.max(0, Math.min(index, cards.length - 1));
  const wide = window.innerWidth > 620;
  cards.forEach((card, i) => {
    const off = i - deckIndex;
    const dist = Math.abs(off);
    card.style.setProperty("--x", `${off * (wide ? 58 : 46)}%`);
    card.style.setProperty("--r", `${off * 5}deg`);
    card.style.setProperty("--s", String(1 - Math.min(dist, 3) * 0.12));
    card.style.zIndex = String(20 - dist);
    card.classList.toggle("is-active", off === 0);
    card.classList.toggle("is-hidden", dist > 2);
    card.tabIndex = dist > 2 ? -1 : 0;
    card.setAttribute("aria-current", String(off === 0));
  });
  document.getElementById("deck-count").textContent = `${deckIndex + 1} / ${cards.length}`;
  document.getElementById("deck-prev").disabled = deckIndex === 0;
  document.getElementById("deck-next").disabled = deckIndex === cards.length - 1;
  deck.classList.toggle("is-single", cards.length < 2);
}

function renderDeck(animate) {
  const cat = CATEGORIES.find((c) => c.id === openCategory);
  document.getElementById("deck-title").textContent = cat.name[currentLang];
  deckCards.replaceChildren(...projectsOf(cat.id).map(postcard));
  if (animate) {
    // Le cartoline partono "dentro la cartella" e poi si aprono a ventaglio.
    clearTimeout(landingTimer);
    deck.classList.add("is-entering");
    showCard(deckIndex);
    void deckCards.offsetWidth;
    deck.classList.replace("is-entering", "is-landing");
    landingTimer = setTimeout(() => deck.classList.remove("is-landing"), 1400);
  }
  showCard(deckIndex);
}

function openDeck(id) {
  openCategory = id;
  deckIndex = 0;
  renderFolders();
  deck.hidden = false;
  renderDeck(true);
  const top = deck.getBoundingClientRect().top;
  if (top > window.innerHeight * 0.6) deck.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
}

function closeDeck() {
  openCategory = null;
  deck.hidden = true;
  renderFolders();
}

function renderPortfolio() {
  renderFolders();
  if (openCategory) renderDeck(false);
}

document.getElementById("deck-close").addEventListener("click", closeDeck);
document.getElementById("deck-prev").addEventListener("click", () => showCard(deckIndex - 1));
document.getElementById("deck-next").addEventListener("click", () => showCard(deckIndex + 1));
deck.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") showCard(deckIndex - 1);
  if (event.key === "ArrowRight") showCard(deckIndex + 1);
  if (event.key === "Escape") closeDeck();
});
// Trascinare o scorrere col dito per sfogliare.
let swipeX = null;
let swipedAt = 0;
deckCards.addEventListener("pointerdown", (event) => { swipeX = event.clientX; });
deckCards.addEventListener("pointerup", (event) => {
  if (swipeX === null) return;
  const dx = event.clientX - swipeX;
  swipeX = null;
  if (Math.abs(dx) > 40) {
    showCard(deckIndex + (dx < 0 ? 1 : -1));
    swipedAt = Date.now(); // il click che segue il trascinamento non deve aprire la scheda
  }
});
window.addEventListener("resize", () => { if (openCategory) showCard(deckIndex); });

/* Galleria nella scheda */
const sliderImg = document.getElementById("slider-img");
const sliderVideo = document.getElementById("slider-video");
const thumbs = document.getElementById("slider-thumbs");
let gallery = [];
let slide = 0;

// Trasforma un link Vimeo (anche "non in elenco", con il codice dopo l'ID) nell'indirizzo del player.
function vimeoPlayer(url) {
  const match = String(url).match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([0-9a-z]+))?/i);
  if (!match) return "";
  const hash = match[2] || new URL(url, location.href).searchParams.get("h");
  const params = new URLSearchParams({ autoplay: "0", dnt: "1", title: "0", byline: "0", portrait: "0", color: "c9a24b" });
  if (hash) params.set("h", hash);
  return `https://player.vimeo.com/video/${match[1]}?${params}`;
}

function showSlide(index) {
  slide = (index + gallery.length) % gallery.length;
  const item = gallery[slide];
  const isVideo = item.type === "video";
  sliderImg.hidden = isVideo;
  sliderVideo.hidden = !isVideo;
  // Togliere l'indirizzo ferma il video quando si passa a un'altra foto.
  sliderVideo.src = isVideo ? item.src : "about:blank";
  if (!isVideo) {
    sliderImg.src = photo(item.id, 1600);
    sliderImg.classList.remove("is-changing");
    void sliderImg.offsetWidth;
    sliderImg.classList.add("is-changing");
  }
  const count = document.getElementById("slider-count");
  count.textContent = `${slide + 1} / ${gallery.length}`;
  count.hidden = isVideo; // non copre i comandi del player Vimeo
  [...thumbs.children].forEach((thumb, i) => thumb.setAttribute("aria-current", String(i === slide)));
}

function openProject(project) {
  const videos = [].concat(project.video || []).map(vimeoPlayer).filter(Boolean);
  gallery = [
    ...videos.map((src) => ({ type: "video", src, thumb: coverOf(project, 200) })),
    ...(project.gallery || []).map((id) => ({ type: "photo", id, thumb: photo(id, 200) })),
  ];
  // Con un solo elemento (es. solo il video) niente miniature né frecce.
  dialog.classList.toggle("is-single", gallery.length < 2);
  // Video verticale: player 9:16 affiancato al testo.
  dialog.classList.toggle("is-vertical", Boolean(project.vertical));
  document.getElementById("dialog-place").textContent = project.place[currentLang];
  document.getElementById("dialog-title").textContent = project.title[currentLang];
  document.getElementById("dialog-text").textContent = project.text[currentLang];
  document.getElementById("dialog-work").textContent = project.work[currentLang];
  document.getElementById("dialog-tools").textContent = project.tools;
  thumbs.replaceChildren(...gallery.map((item, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", `${item.type === "video" ? "Video " : ""}${i + 1} / ${gallery.length}`);
    if (item.type === "video") btn.classList.add("is-video");
    const img = document.createElement("img");
    img.src = item.thumb;
    img.alt = "";
    btn.append(img);
    btn.addEventListener("click", () => showSlide(i));
    return btn;
  }));
  showSlide(0);
  dialog.showModal();
  dialog.scrollTop = 0;
}

document.getElementById("slider-prev").addEventListener("click", () => showSlide(slide - 1));
document.getElementById("slider-next").addEventListener("click", () => showSlide(slide + 1));
document.getElementById("dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener("close", () => { sliderVideo.src = "about:blank"; });
dialog.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") showSlide(slide - 1);
  if (event.key === "ArrowRight") showSlide(slide + 1);
});

/* ---------- Form ---------- */
// Web3Forms: il form invia la richiesta, che arriva direttamente nella tua casella email.
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(contactForm);
  const button = contactForm.querySelector('button[type="submit"]');
  button.disabled = true;
  formStatus.hidden = false;
  formStatus.className = "form-status";
  formStatus.textContent = t("formSending");
  try {
    if (!WEB3FORMS_KEY) throw new Error("chiave Web3Forms mancante");
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `${t("formSubject")}: ${data.get("struttura") || data.get("nome")}`,
        from_name: "Sito Simone Mallamo",
        name: data.get("nome"),
        email: data.get("email"),
        replyto: data.get("email"),
        [italian.formProperty]: data.get("struttura"),
        message: data.get("messaggio"),
        botcheck: data.get("botcheck") ? true : "",
      }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    contactForm.reset();
    formStatus.classList.add("is-sent");
    formStatus.textContent = t("formSent");
  } catch {
    formStatus.classList.add("is-error");
    const link = Object.assign(document.createElement("a"), { href: `mailto:${CONTACT_EMAIL}`, textContent: CONTACT_EMAIL });
    formStatus.replaceChildren(`${t("formError")} `, link, ".");
  } finally {
    button.disabled = false;
  }
});

/* ---------- Animazioni in ingresso ---------- */
if (!reducedMotion && "IntersectionObserver" in window) {
  document.documentElement.classList.add("js-motion");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -10% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

/* ---------- Attrezzatura: lo zaino si apre ---------- */
const gearStage = document.getElementById("gear-stage");
const packPhotos = gearStage.querySelector(".pack-photos");
const packOpenImg = gearStage.querySelector(".pack-open");
const gearItems = [...gearStage.querySelectorAll(".gear-item")];

// Distanza fra l'apertura dello zaino e ogni scheda: da lì parte l'attrezzo.
function aimGearAtPack() {
    // Ogni strumento parte dalla sua miniatura nello scomparto (griglia 2×2, vedi .pack-slot in styles.css).
  const photos = packPhotos.getBoundingClientRect();
  const openImg = packOpenImg.querySelector("img");
  const openHeight = photos.width * (openImg.naturalHeight / openImg.naturalWidth || 269 / 700);
  const openTop = photos.bottom - photos.height * 0.08 - openHeight;
  gearItems.forEach((item, i) => {
    const mx = photos.left + photos.width * (0.193 + 0.286 * ((i % 2) + 0.5) / 2);
    const my = openTop + openHeight * (0.13 + 0.78 * (Math.floor(i / 2) + 0.5) / 2);
    // Misura la scheda nella sua posizione finale, senza la trasformazione in corso.
    item.style.transition = "none";
    const current = item.style.transform;
    item.style.transform = "none";
    const box = item.getBoundingClientRect();
    item.style.transform = current;
    void item.offsetWidth;
    item.style.transition = "";
    item.style.setProperty("--dx", `${Math.round(mx - (box.left + box.width / 2))}px`);
    item.style.setProperty("--dy", `${Math.round(my - (box.top + box.height / 2))}px`);
    item.style.setProperty("--i", i);
  });
}

function openPack() {
  aimGearAtPack();
  void gearStage.offsetWidth;
  gearStage.classList.add("is-open");
}

if (document.documentElement.classList.contains("js-motion")) {
  aimGearAtPack();
  const packObserver = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    packObserver.disconnect();
    openPack();
  }, { threshold: 0.35 });
  packObserver.observe(gearStage);
  window.addEventListener("resize", () => { if (!gearStage.classList.contains("is-open")) aimGearAtPack(); });

  // Toccando lo zaino gli attrezzi rientrano e poi escono di nuovo.
  let packTimer = 0;
  document.getElementById("backpack").addEventListener("click", () => {
    clearTimeout(packTimer);
    if (!gearStage.classList.contains("is-open")) { openPack(); return; }
    aimGearAtPack();
    gearStage.classList.remove("is-open");
    packTimer = setTimeout(openPack, 750);
  });
} else {
  gearStage.classList.add("is-open");
}

/* ---------- Avvio ---------- */
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateHeader();
    if (!reducedMotion) updateParallax();
    ticking = false;
  });
}
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", () => { placePins(); onScroll(); });

document.getElementById("year").textContent = new Date().getFullYear();
placePins();
applyLang(currentLang);
updateHeader();
updateParallax();

/* ---------- Protezione immagini ----------
   Blocca il menu del tasto destro e il trascinamento su foto e video. */
const PROTECTED = "img, video, .slider, .postcard, .folder, .place-img, .about-travel, .hero";
["contextmenu", "dragstart"].forEach((type) => {
  document.addEventListener(type, (event) => {
    if (event.target.closest?.(PROTECTED)) event.preventDefault();
  });
});
