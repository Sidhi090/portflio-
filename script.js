const loader = document.querySelector("[data-loader]");
const loaderVideo = document.querySelector(".loader-video");
const ADMIN_PASSWORD = "disha2026";
const MEDIA_KEY = "dishaPortfolioMediaV3";
const ADMIN_SESSION_KEY = "dishaAdminAuthed";
const DB_NAME = "dishaPortfolioUploads";
const DB_STORE = "files";
const DS_LOGO_SRC = "assets/images/ds-logo.png";
const homeImageIndexes = new Set([0, 16, 24, 32, 56, 64, 72, 80, 104, 112, 115]);
const portfolioImages = Array.from({ length: 116 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  return `assets/images/disha-web/disha-${number}.jpg`;
});

const defaultMedia = [
  { id: "hero-main", type: "image", src: "assets/images/disha-hero.png", title: "Hero Banner", gallery: false, home: false, hero: true },
  ...portfolioImages.map((src, index) => ({
    id: `img-${String(index + 1).padStart(3, "0")}`,
    type: "image",
    src,
    title: `Disha Shamwani editorial ${index + 1}`,
    gallery: true,
    home: homeImageIndexes.has(index),
    hero: false,
  })),
  { id: "vid-01", type: "video", src: "assets/videos/reel-01.mp4", poster: DS_LOGO_SRC, title: "Portrait reel", gallery: true, home: false },
  { id: "vid-02", type: "video", src: "assets/videos/reel-02.mp4", poster: DS_LOGO_SRC, title: "Poolside reel", gallery: true, home: true },
  { id: "vid-03", type: "video", src: "assets/videos/reel-03.mp4", poster: DS_LOGO_SRC, title: "Runway reel", gallery: true, home: true },
  { id: "vid-04", type: "video", src: "assets/videos/reel-04.mp4", poster: DS_LOGO_SRC, title: "Travel reel", gallery: true, home: false },
  { id: "vid-05", type: "video", src: "assets/videos/reel-05.mp4", poster: DS_LOGO_SRC, title: "Face card reel", gallery: true, home: true },
];

function getMedia() {
  const saved = localStorage.getItem(MEDIA_KEY);
  if (!saved) return [...defaultMedia];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [...defaultMedia];
  } catch {
    return [...defaultMedia];
  }
}

function saveMedia(media) {
  localStorage.setItem(MEDIA_KEY, JSON.stringify(media));
}

function openUploadDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(DB_STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveUpload(file) {
  const db = await openUploadDb();
  const id = `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put({ id, file });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return id;
}

async function resolveUploadUrl(id) {
  if (!id) return "";
  const db = await openUploadDb();
  const record = await new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const request = tx.objectStore(DB_STORE).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return record?.file ? URL.createObjectURL(record.file) : "";
}

async function resolveMediaSource(item, field = "src") {
  const uploadId = field === "poster" ? item.posterFileId : item.storedFileId;
  if (uploadId) return resolveUploadUrl(uploadId);
  return item[field] || "";
}

function mediaImage(item) {
  const img = document.createElement("img");
  img.alt = item.title || "Disha Shamwani portfolio image";
  resolveMediaSource(item).then((src) => {
    img.src = src;
  });
  return img;
}

function mediaVideo(item) {
  const video = document.createElement("video");
  video.playsInline = true;
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  resolveMediaSource(item).then((src) => {
    video.src = src;
    video.play().catch(() => {});
  });
  resolveMediaSource(item, "poster").then((poster) => {
    if (poster) video.poster = poster;
  });
  return video;
}

function renderSeasonCarousel(container, items) {
  const track = document.createElement("div");
  track.className = "season-track";
  const visibleItems = items.length ? items : defaultMedia.filter((item) => item.type === "image").slice(0, 5);
  [...visibleItems, ...visibleItems].forEach((item) => {
    const frame = document.createElement("div");
    frame.className = "season-card";
    frame.append(mediaImage(item));
    track.append(frame);
  });
  container.replaceChildren(track);
  setupSeasonDrag(container, track);
}

function setupSeasonDrag(container, track) {
  let pointerDown = false;
  let startX = 0;
  let startOffset = 0;
  let manualOffset = 0;

  container.onpointerdown = (event) => {
    pointerDown = true;
    startX = event.clientX;
    startOffset = manualOffset;
    container.classList.add("is-dragging");
    container.setPointerCapture(event.pointerId);
  };

  container.onpointermove = (event) => {
    if (!pointerDown) return;
    manualOffset = startOffset + event.clientX - startX;
    track.style.setProperty("--drag-offset", `${manualOffset}px`);
  };

  container.onpointerup = (event) => {
    pointerDown = false;
    container.classList.remove("is-dragging");
    container.releasePointerCapture(event.pointerId);
  };

  container.onpointercancel = () => {
    pointerDown = false;
    container.classList.remove("is-dragging");
  };
}

function renderPublicMedia() {
  const media = getMedia();
  const heroImage = document.querySelector("[data-hero-image]");
  const homeRibbon = document.querySelector("[data-home-ribbon]");
  const homeReels = document.querySelector("[data-home-reels]");
  const galleryImages = document.querySelector("[data-gallery-images]");
  const galleryVideos = document.querySelector("[data-gallery-videos]");

  if (heroImage) {
    const hero =
      media.find((item) => item.type === "image" && item.hero) ||
      media.find((item) => item.src === "assets/images/disha-web/disha-02.jpg") ||
      media.find((item) => item.type === "image" && item.home);
    if (hero) {
      heroImage.alt = hero.title || "Disha Shamwani banner image";
      resolveMediaSource(hero).then((src) => {
        heroImage.src = src;
      });
    }
  }

  if (homeRibbon) {
    renderSeasonCarousel(homeRibbon, media.filter((item) => item.type === "image" && item.home).slice(0, 7));
  }

  if (homeReels) {
    homeReels.replaceChildren(...media.filter((item) => item.type === "video" && item.home).slice(0, 3).map((item) => mediaVideo(item)));
  }

  if (galleryImages) {
    galleryImages.replaceChildren(...media.filter((item) => item.type === "image" && item.gallery).map(mediaImage));
  }

  if (galleryVideos) {
    galleryVideos.replaceChildren(...media.filter((item) => item.type === "video" && item.gallery).map((item) => mediaVideo(item)));
  }
}

function hideLoader() {
  if (!loader || loader.classList.contains("is-hidden")) return;
  document.body.classList.add("site-ready");
  loader.classList.add("is-hidden");
  window.setTimeout(() => loader.remove(), 800);
}

if (loader) {
  if (new URLSearchParams(window.location.search).has("skipLoader")) {
    hideLoader();
  }
  if (loaderVideo) {
    loaderVideo.addEventListener("ended", hideLoader, { once: true });
    loaderVideo.addEventListener("loadedmetadata", () => {
      const dur = loaderVideo.duration;
      if (isFinite(dur) && dur > 0) {
        window.setTimeout(hideLoader, dur * 1000 + 600);
      }
    }, { once: true });
  }
  window.setTimeout(hideLoader, 15000);
}

window.addEventListener("scroll", () => {
  document.querySelector(".site-header")?.classList.toggle("scrolled", window.scrollY > 40);
});

const menuToggle = document.querySelector("[data-menu-toggle]");
const navShell = document.querySelector(".nav-shell");
const closeMenu = () => {
  document.body.classList.remove("menu-open");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "Open menu");
};

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });
}

document.querySelectorAll("[data-nav-links] a").forEach((link) => {
  link.addEventListener("click", () => {
    closeMenu();
  });
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

document.addEventListener("click", (event) => {
  if (!document.body.classList.contains("menu-open")) return;
  if (navShell?.contains(event.target)) return;
  closeMenu();
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 980) closeMenu();
});

renderPublicMedia();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: "0px 0px -40px 0px" }
);

document.querySelectorAll(".reveal").forEach((node) => revealObserver.observe(node));

const animObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        animObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0, rootMargin: "0px 0px -80px 0px" }
);
document.querySelectorAll("[data-anim]").forEach((el) => animObserver.observe(el));

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("section-in");
        sectionObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
);
document.querySelectorAll("[data-section]").forEach((el) => sectionObserver.observe(el));

function isAdminAuthed() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

function setAdminState(isAuthed) {
  const login = document.querySelector("[data-admin-login]");
  const dashboard = document.querySelector("[data-admin-dashboard]");
  if (!login || !dashboard) return;
  login.hidden = isAuthed;
  dashboard.hidden = !isAuthed;
  if (isAuthed) renderAdminList();
}

let adminTab = "home";

function buildAdminRow(item, index) {
  const row = document.createElement("article");
  row.className = "admin-row";
  row.dataset.id = item.id;
  const preview = item.type === "image" ? mediaImage(item) : mediaVideo(item);
  preview.className = "admin-preview";
  row.append(
    replacementTarget(item, preview),
    field("Title", "title", item.title || ""),
    field("Path", "src", item.src || ""),
    field("Poster", "poster", item.poster || "", item.type !== "video"),
    toggle("Gallery", "gallery", item.gallery),
    toggle("Home", "home", item.home),
    toggle("Hero", "hero", item.hero, item.type !== "image"),
    rowActions(index)
  );
  return row;
}

function renderAdminGroup(label, items, allMedia, container) {
  if (!items.length) return;
  const heading = document.createElement("h3");
  heading.className = "admin-group-heading";
  heading.textContent = label + ` (${items.length})`;
  container.append(heading);
  items.forEach((item) => container.append(buildAdminRow(item, allMedia.indexOf(item))));
}

function renderAdminList() {
  const list = document.querySelector("[data-admin-list]");
  if (!list) return;
  const media = getMedia();
  list.replaceChildren();

  if (adminTab === "home") {
    const hero      = media.filter((item) => item.hero);
    const slideshow = media.filter((item) => item.home && item.type === "image" && !item.hero);
    const reels     = media.filter((item) => item.home && item.type === "video");

    if (!hero.length && !slideshow.length && !reels.length) {
      list.append(adminEmpty());
      return;
    }
    renderAdminGroup("Hero Banner", hero, media, list);
    renderAdminGroup("Slideshow Images", slideshow, media, list);
    renderAdminGroup("Home Reels", reels, media, list);

  } else if (adminTab === "gallery") {
    const images = media.filter((item) => item.gallery && item.type === "image");
    const videos  = media.filter((item) => item.gallery && item.type === "video");

    if (!images.length && !videos.length) {
      list.append(adminEmpty());
      return;
    }
    renderAdminGroup("Gallery Images", images, media, list);
    renderAdminGroup("Gallery Videos", videos, media, list);

  } else {
    if (!media.length) { list.append(adminEmpty()); return; }
    media.forEach((item, index) => list.append(buildAdminRow(item, index)));
  }
}

function adminEmpty() {
  const p = document.createElement("p");
  p.className = "admin-note";
  p.textContent = "No media here yet. Go to All Media and toggle Home or Gallery on any item.";
  return p;
}

function replacementTarget(item, preview) {
  const wrapper = document.createElement("div");
  wrapper.className = "replace-target";
  wrapper.dataset.replaceId = item.id;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*,video/*";
  input.addEventListener("change", () => {
    const [file] = input.files;
    if (file) replaceMediaFile(item.id, file);
  });
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Replace";
  button.addEventListener("click", () => input.click());
  wrapper.append(preview, input, button);
  ["dragenter", "dragover"].forEach((eventName) => {
    wrapper.addEventListener(eventName, (event) => {
      event.preventDefault();
      wrapper.classList.add("is-dragging");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    wrapper.addEventListener(eventName, (event) => {
      event.preventDefault();
      wrapper.classList.remove("is-dragging");
    });
  });
  wrapper.addEventListener("drop", (event) => {
    const [file] = event.dataTransfer.files;
    if (file) replaceMediaFile(item.id, file);
  });
  return wrapper;
}

function field(label, name, value, disabled = false) {
  const wrapper = document.createElement("label");
  wrapper.className = "admin-field";
  const span = document.createElement("span");
  span.textContent = label;
  const input = document.createElement("input");
  input.name = name;
  input.value = value;
  input.disabled = disabled;
  input.addEventListener("change", updateMediaItem);
  wrapper.append(span, input);
  return wrapper;
}

function toggle(label, name, checked, disabled = false) {
  const wrapper = document.createElement("label");
  wrapper.className = "admin-toggle";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.name = name;
  input.checked = Boolean(checked);
  input.disabled = disabled;
  input.addEventListener("change", updateMediaItem);
  wrapper.append(input, document.createTextNode(label));
  return wrapper;
}

function rowActions(index) {
  const actions = document.createElement("div");
  actions.className = "admin-row-actions";
  const up = document.createElement("button");
  up.type = "button";
  up.textContent = "Up";
  up.disabled = index === 0;
  up.addEventListener("click", () => moveMedia(index, -1));
  const down = document.createElement("button");
  down.type = "button";
  down.textContent = "Down";
  down.addEventListener("click", () => moveMedia(index, 1));
  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "Delete";
  remove.addEventListener("click", () => deleteMedia(index));
  actions.append(up, down, remove);
  return actions;
}

function updateMediaItem(event) {
  const row = event.target.closest("[data-id]");
  if (!row) return;
  const media = getMedia();
  const item = media.find((entry) => entry.id === row.dataset.id);
  if (!item) return;
  const input = event.target;
  if (input.name === "hero" && input.checked) {
    media.forEach((entry) => {
      entry.hero = false;
    });
  }
  item[input.name] = input.type === "checkbox" ? input.checked : input.value.trim();
  saveMedia(media);
  renderPublicMedia();
  renderAdminList();
}

function moveMedia(index, direction) {
  const media = getMedia();
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= media.length) return;
  const [item] = media.splice(index, 1);
  media.splice(nextIndex, 0, item);
  saveMedia(media);
  renderAdminList();
}

function deleteMedia(index) {
  const media = getMedia();
  media.splice(index, 1);
  saveMedia(media);
  renderAdminList();
}

const loginForm = document.querySelector("[data-login-form]");
if (loginForm) {
  setAdminState(isAdminAuthed());
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = document.querySelector("[data-login-message]");
    const password = new FormData(loginForm).get("password");
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      setAdminState(true);
      return;
    }
    if (message) message.textContent = "Wrong password.";
  });
}

document.querySelectorAll("[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    adminTab = btn.dataset.tab;
    renderAdminList();
  });
});

const addMediaForm = document.querySelector("[data-add-media]");
if (addMediaForm) {
  addMediaForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(addMediaForm);
    const media = getMedia();
    media.push({
      id: `${form.get("type")}-${Date.now()}`,
      type: form.get("type"),
      title: String(form.get("title") || "Portfolio media").trim(),
      src: String(form.get("src") || "").trim(),
      poster: String(form.get("poster") || "").trim(),
      gallery: true,
      home: false,
    });
    saveMedia(media);
    addMediaForm.reset();
    renderAdminList();
  });
}

async function addUploadedFiles(files) {
  const media = getMedia();
  for (const file of files) {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) continue;
    const storedFileId = await saveUpload(file);
    const isImage = file.type.startsWith("image/");
    media.push({
      id: `${isImage ? "image" : "video"}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type: isImage ? "image" : "video",
      title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      src: file.name,
      storedFileId,
      poster: "",
      gallery: true,
      home: false,
      hero: false,
    });
  }
  saveMedia(media);
  renderAdminList();
}

async function replaceMediaFile(id, file) {
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
  const media = getMedia();
  const item = media.find((entry) => entry.id === id);
  if (!item) return;
  const isImage = file.type.startsWith("image/");
  item.type = isImage ? "image" : "video";
  item.src = file.name;
  item.storedFileId = await saveUpload(file);
  item.poster = isImage ? "" : item.poster || "";
  item.posterFileId = "";
  item.title = item.title || file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
  if (!isImage) item.hero = false;
  saveMedia(media);
  renderPublicMedia();
  renderAdminList();
}

const dropZone = document.querySelector("[data-drop-zone]");
const fileInput = document.querySelector("[data-file-input]");
if (dropZone && fileInput) {
  dropZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => addUploadedFiles(fileInput.files));
  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add("is-dragging");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove("is-dragging");
    });
  });
  dropZone.addEventListener("drop", (event) => addUploadedFiles(event.dataTransfer.files));
}

document.querySelector("[data-logout]")?.addEventListener("click", () => {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  setAdminState(false);
});

document.querySelector("[data-reset-media]")?.addEventListener("click", () => {
  saveMedia(defaultMedia);
  renderAdminList();
});
