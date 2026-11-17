/**
 * ============================================================================
 * GARIS CERITA STUDIO (PT GARIS CERITA KARYA / GCK)
 * V6: 2D SKETCH PARALLAX & MINIMALIST BORDERLESS TABS
 * ============================================================================
 * Mengelola ruang sketsa 2D interaktif layar penuh dengan efek multi-layer
 * paralaks, 5 tombol tautan menu di dalam gambar sketsa, tampilan tab modal
 * yang simpel & minimalis, kartu proyek tanpa border dengan aksen sketsa,
 * serta katalog Research & Lab cukup dengan tombol "Lihat" (tanpa link repo).
 */

class GarisCeritaApp {
  constructor() {
    this.data = window.STUDIO_DATA;
    this.sound = window.soundEngine;

    this.activeOverlay = null;
    this.selectedProjectId = null;
    this.portfolioFilter = "all";
    this.portfolioSearch = "";
    this.labFilter = "all";
    this.aboutTab = "philosophy";
    this.teamFilter = "all";
    this.archiveTab = "history";
    this.modalOpenTimer = null;
    this.phoneShakeTimer = null;

    // Parallax state
    this.viewport = document.getElementById("sketch-parallax-viewport");
    this.sceneFrame = document.getElementById("sketch-scene-frame");
    this.zoomRig = document.getElementById("sketch-zoom-rig");
    this.parallaxPlanes = Array.from(document.querySelectorAll(".parallax-plane[data-depth]"));

    this.targetX = 0;
    this.targetY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.lastPointerMoveTime = 0;
    this.isFitMode = false;

    this._initParallaxEngine();
    this._initParticlesCanvas();
    this._bindInSketchMenuLinks();
    this._bindGlobalControls();
    this._centerMobileStageOnLoad();
    this._hideLoadingScreen();
  }

  // --------------------------------------------------------------------------
  // 1. MULTI-PLANE 2D SKETCH PARALLAX ENGINE (MOUSE, TOUCH, GYRO & BREATHING)
  // --------------------------------------------------------------------------
  _initParallaxEngine() {
    window.addEventListener(
      "pointermove",
      (e) => {
        if (this.activeOverlay) return;
        const nx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
        const ny = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
        this.targetX = Math.max(-1, Math.min(1, nx));
        this.targetY = Math.max(-1, Math.min(1, ny));
        this.lastPointerMoveTime = performance.now();
      },
      { passive: true }
    );

    window.addEventListener(
      "deviceorientation",
      (e) => {
        if (this.activeOverlay || e.gamma === null || e.beta === null) return;
        const gx = Math.max(-1, Math.min(1, e.gamma / 28));
        const gy = Math.max(-1, Math.min(1, (e.beta - 45) / 28));
        this.targetX = gx * 0.75;
        this.targetY = gy * 0.75;
        this.lastPointerMoveTime = performance.now();
      },
      { passive: true }
    );

    if (this.viewport) {
      this.viewport.addEventListener(
        "scroll",
        () => {
          const maxScroll = this.viewport.scrollWidth - this.viewport.clientWidth;
          if (maxScroll > 10) {
            const ratio = (this.viewport.scrollLeft / maxScroll - 0.5) * 2;
            this.targetX = Math.max(-1, Math.min(1, ratio * 0.85));
            this.lastPointerMoveTime = performance.now();
          }
        },
        { passive: true }
      );
    }

    const tick = (now) => {
      const idleElapsed = now - this.lastPointerMoveTime;
      let goalX = this.targetX;
      let goalY = this.targetY;

      if (idleElapsed > 2200 && !this.activeOverlay) {
        const t = now * 0.00075;
        goalX = Math.sin(t) * 0.28;
        goalY = Math.cos(t * 0.82) * 0.22;
      }

      this.currentX += (goalX - this.currentX) * 0.075;
      this.currentY += (goalY - this.currentY) * 0.075;

      const isCompact = window.innerWidth <= 900;
      const maxShiftX = isCompact ? 10 : 22;
      const maxShiftY = isCompact ? 6 : 14;

      for (let i = 0; i < this.parallaxPlanes.length; i++) {
        const plane = this.parallaxPlanes[i];
        const depth = parseFloat(plane.dataset.depth || "0.5");
        const dx = (-this.currentX * depth * maxShiftX).toFixed(2);
        const dy = (-this.currentY * depth * maxShiftY).toFixed(2);
        plane.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  // --------------------------------------------------------------------------
  // 2. FLOATING ARCHITECTURAL SUNLIGHT DUST & DRAFTING PARTICLES
  // --------------------------------------------------------------------------
  _initParticlesCanvas() {
    const canvas = document.getElementById("sketch-particles-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.clientWidth || 1376;
      canvas.height = canvas.clientHeight || 768;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const count = 26;
    const particles = Array.from({ length: count }, (_, idx) => ({
      x: Math.random(),
      y: Math.random(),
      r: 1.2 + Math.random() * 2.1,
      vx: (Math.random() - 0.5) * 0.00022,
      vy: -0.00012 - Math.random() * 0.00024,
      alpha: 0.16 + Math.random() * 0.34,
      isCross: idx % 7 === 0
    }));

    const drawParticles = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const pxOffset = -this.currentX * 16;
      const pyOffset = -this.currentY * 10;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -0.05) p.y = 1.05;
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;

        const sx = p.x * w + pxOffset;
        const sy = p.y * h + pyOffset;

        if (p.isCross) {
          ctx.strokeStyle = `rgba(224, 122, 46, ${p.alpha * 0.72})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(sx - 3.5, sy);
          ctx.lineTo(sx + 3.5, sy);
          ctx.moveTo(sx, sy - 3.5);
          ctx.lineTo(sx, sy + 3.5);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(255, 245, 222, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      requestAnimationFrame(drawParticles);
    };

    requestAnimationFrame(drawParticles);
  }

  // --------------------------------------------------------------------------
  // 3. SYNCHRONIZED IN-SKETCH MENU LINKS, HOVER STATES & OBJECT ZOOM
  // --------------------------------------------------------------------------
  _bindInSketchMenuLinks() {
    const interactiveTargets = document.querySelectorAll("[data-menu-target]");

    interactiveTargets.forEach((el) => {
      const sectionId = el.dataset.menuTarget;

      el.addEventListener("mouseenter", () => {
        this._setMenuHoverState(sectionId, true);
        if (this.sound) this.sound.playHoverTick();
      });

      el.addEventListener("mouseleave", () => {
        this._setMenuHoverState(sectionId, false);
      });

      el.addEventListener("focus", () => {
        this._setMenuHoverState(sectionId, true);
      });

      el.addEventListener("blur", () => {
        this._setMenuHoverState(sectionId, false);
      });

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        this.openSection(sectionId);
      });

      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.openSection(sectionId);
        }
      });
    });
  }

  _setMenuHoverState(sectionId, isHovered) {
    document
      .querySelectorAll(`.sketch-object-hitbox[data-menu-target="${sectionId}"]`)
      .forEach((box) => box.classList.toggle("is-hovered", isHovered));

    document
      .querySelectorAll(`.sketch-menu-node[data-menu-node="${sectionId}"]`)
      .forEach((node) => node.classList.toggle("is-hovered", isHovered));

    document
      .querySelectorAll(`.portrait-sketch-card[data-menu-target="${sectionId}"]`)
      .forEach((card) => card.classList.toggle("active", isHovered));
  }

  zoomSketchToObject(sectionId) {
    if (!this.zoomRig) return;

    this._scrollMobileViewportToObject(sectionId);

    const targets = {
      about: { origin: "13.2% 34.5%", scale: 1.85 },
      portfolio: { origin: "31.0% 41.5%", scale: 1.78 },
      lab: { origin: "53.8% 45.0%", scale: 1.88 },
      archive: { origin: "75.0% 38.0%", scale: 1.72 },
      contact: { origin: "14.8% 53.5%", scale: 1.95 }
    };

    const t = targets[sectionId];
    if (t) {
      this.zoomRig.style.transformOrigin = t.origin;
      this.zoomRig.style.transform = `scale(${t.scale})`;
    }
  }

  resetSketchZoom() {
    if (!this.zoomRig) return;
    this.zoomRig.style.transform = "scale(1)";
  }

  _scrollMobileViewportToObject(sectionId) {
    if (!this.viewport || this.isFitMode) return;
    const maxScroll = this.viewport.scrollWidth - this.viewport.clientWidth;
    if (maxScroll <= 10) return;

    const xCenters = {
      about: 0.12,
      contact: 0.14,
      portfolio: 0.32,
      lab: 0.54,
      archive: 0.80
    };
    const ratio = xCenters[sectionId] ?? 0.42;
    const targetLeft = Math.max(
      0,
      Math.min(
        maxScroll,
        ratio * this.viewport.scrollWidth - this.viewport.clientWidth * 0.5
      )
    );
    this.viewport.scrollTo({ left: targetLeft, behavior: "smooth" });
  }

  _centerMobileStageOnLoad() {
    setTimeout(() => {
      if (!this.viewport) return;
      const maxScroll = this.viewport.scrollWidth - this.viewport.clientWidth;
      if (maxScroll > 20) {
        this.viewport.scrollLeft = maxScroll * 0.36;
      }
    }, 120);
  }

  _triggerPhoneSketchAnimation() {
    const phoneBox = document.getElementById("sketch-phone-object");
    if (!phoneBox) return;
    phoneBox.classList.add("phone-ringing-anim");
    if (this.phoneShakeTimer) clearTimeout(this.phoneShakeTimer);
    this.phoneShakeTimer = setTimeout(() => {
      phoneBox.classList.remove("phone-ringing-anim");
    }, 3200);
  }

  // --------------------------------------------------------------------------
  // 4. GLOBAL UI CONTROLS
  // --------------------------------------------------------------------------
  _bindGlobalControls() {
    document.getElementById("btn-brand-reset")?.addEventListener("click", () => {
      this.closeOverlay(true);
    });

    const updateSoundButtons = (muted) => {
      const icon = muted ? "🔇" : "🔊";
      const btnDesktop = document.querySelector("#btn-sound-toggle .sound-icon");
      const btnMobile = document.getElementById("btn-sound-mobile");
      if (btnDesktop) btnDesktop.textContent = icon;
      if (btnMobile) btnMobile.textContent = icon;
    };

    const handleSoundToggle = () => {
      if (!this.sound) return;
      const muted = this.sound.toggleMute();
      updateSoundButtons(muted);
    };

    document.getElementById("btn-sound-toggle")?.addEventListener("click", handleSoundToggle);
    document.getElementById("btn-sound-mobile")?.addEventListener("click", handleSoundToggle);

    const fitBtn = document.getElementById("btn-mobile-fit");
    const fitLabel = document.getElementById("mobile-fit-label");
    if (fitBtn && this.viewport) {
      fitBtn.addEventListener("click", () => {
        this.isFitMode = !this.isFitMode;
        this.viewport.classList.toggle("fit-mode", this.isFitMode);
        if (fitLabel) {
          fitLabel.textContent = this.isFitMode ? "🔍 Perbesar Sketsa" : "🖼️ Lihat Utuh";
        }
        if (!this.isFitMode) {
          this._centerMobileStageOnLoad();
        }
      });
    }

    const backdrop = document.getElementById("overlay-backdrop");
    backdrop?.addEventListener("click", (e) => {
      if (e.target === backdrop) this.closeOverlay(true);
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.activeOverlay) {
        this.closeOverlay(true);
      }
    });
  }

  _hideLoadingScreen() {
    setTimeout(() => {
      const loader = document.getElementById("loading-screen");
      if (loader) loader.classList.add("hidden");
    }, 420);
  }

  // --------------------------------------------------------------------------
  // 5. OPEN / CLOSE OVERLAY MODAL & OBJECT ZOOM TRANSITION
  // --------------------------------------------------------------------------
  openSection(sectionId) {
    if (this.modalOpenTimer) clearTimeout(this.modalOpenTimer);

    document.querySelectorAll(".portrait-sketch-card").forEach((c) => {
      c.classList.toggle("active", c.dataset.menuTarget === sectionId);
    });

    if (sectionId === "contact") {
      this._triggerPhoneSketchAnimation();
      if (this.sound) {
        this.sound.playTelephoneRingSequence((status) => {
          this._updatePhoneVisualizerUI(status);
        });
      }
    } else if (this.sound) {
      this.sound.playPaperZoom();
    }

    this.zoomSketchToObject(sectionId);
    this.activeOverlay = sectionId;
    this._renderOverlayContent(sectionId);

    this.modalOpenTimer = setTimeout(() => {
      const backdrop = document.getElementById("overlay-backdrop");
      if (backdrop && this.activeOverlay === sectionId) {
        backdrop.classList.add("open");
      }
    }, 320);
  }

  closeOverlay(resetZoom = true) {
    if (this.modalOpenTimer) clearTimeout(this.modalOpenTimer);
    this.activeOverlay = null;
    this.selectedProjectId = null;
    if (this.sound) this.sound.stopPhoneRing();

    const phoneBox = document.getElementById("sketch-phone-object");
    phoneBox?.classList.remove("phone-ringing-anim");

    document.querySelectorAll(".portrait-sketch-card").forEach((c) => {
      c.classList.remove("active");
    });

    const backdrop = document.getElementById("overlay-backdrop");
    backdrop?.classList.remove("open");

    if (resetZoom) {
      this.resetSketchZoom();
    }
  }

  // --------------------------------------------------------------------------
  // 6. ROUTER RENDER KONTEN MODAL STUDIO (MINIMALIST TABS)
  // --------------------------------------------------------------------------
  _renderOverlayContent(sectionId) {
    const win = document.getElementById("sketch-window");
    if (!win) return;

    switch (sectionId) {
      case "portfolio":
        this._renderPortfolioWindow(win);
        break;
      case "lab":
        this._renderLabWindow(win);
        break;
      case "about":
        this._renderAboutWindow(win);
        break;
      case "archive":
        this._renderArchiveWindow(win);
        break;
      case "contact":
        this._renderContactWindow(win);
        break;
      default:
        break;
    }
  }

  // ==========================================================================
  // A. PORTFOLIO — BORDERLESS MINIMALIST PROJECT DIVS WITH SKETCH ACCENTS
  // ==========================================================================
  _renderPortfolioWindow(win) {
    if (this.selectedProjectId) {
      const proj = this.data.portfolio.find((p) => p.id === this.selectedProjectId);
      if (proj) {
        this._renderProjectDetailView(win, proj);
        return;
      }
    }

    const filtered = this.data.portfolio.filter((p) => {
      const matchCat =
        this.portfolioFilter === "all" || p.category.includes(this.portfolioFilter);
      const q = this.portfolioSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q) ||
        p.program.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });

    const simpleCategories = [
      { id: "all", label: "Semua" },
      { id: "architecture", label: "Arsitektur" },
      { id: "urban", label: "Urban" },
      { id: "masterplan", label: "Masterplan" },
      { id: "interior", label: "Interior" },
      { id: "commercial", label: "Komersial" },
      { id: "residential", label: "Residensial" },
      { id: "government", label: "Pemerintah" }
    ];

    win.innerHTML = `
      <div class="window-header">
        <div class="window-title-group">
          <span class="window-badge">Portfolio Desain</span>
          <h2 class="window-title">Karya &amp; Masterplan Studio</h2>
        </div>
        <div class="window-header-actions">
          <button class="back-studio-btn" id="btn-back-studio">← Kembali</button>
          <button class="window-close-btn" id="btn-close-win" aria-label="Tutup">×</button>
        </div>
      </div>

      <div class="window-tabs-bar">
        <div class="tab-pills">
          ${simpleCategories
            .map(
              (cat) => `
            <button class="tab-pill ${this.portfolioFilter === cat.id ? "active" : ""}" data-port-cat="${cat.id}">
              ${cat.label}
            </button>
          `
            )
            .join("")}
        </div>
        <input
          type="search"
          id="portfolio-search"
          class="portfolio-search-input"
          placeholder="Cari proyek atau lokasi..."
          value="${this.portfolioSearch}"
        />
      </div>

      <div class="window-body">
        <div class="portfolio-grid">
          ${filtered
            .map(
              (item) => `
            <article class="project-card" data-project-id="${item.id}">
              <div class="project-thumb-wrap">
                <img src="${item.image}" alt="${item.title}" loading="lazy" />
              </div>
              <div class="project-card-body">
                <div class="project-sketch-kicker">
                  <span class="project-cat-sketch">${item.categoryLabel}</span>
                  <span class="project-year-sketch">${item.year}</span>
                </div>
                <h3 class="project-card-title">${item.title}</h3>
                <div class="project-card-loc">${item.location}</div>
                <p class="project-card-desc">${item.summary}</p>
                <div class="project-meta-row">
                  <span>Lahan ${item.siteArea}</span>
                  <span>·</span>
                  <span>Bangunan ${item.builtArea}</span>
                </div>
              </div>
            </article>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    this._bindWindowHeaderClose(win);

    win.querySelectorAll("[data-port-cat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.portfolioFilter = btn.dataset.portCat;
        this._renderPortfolioWindow(win);
      });
    });

    const searchInput = win.querySelector("#portfolio-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.portfolioSearch = e.target.value;
        this._renderPortfolioWindow(win);
        const refocused = win.querySelector("#portfolio-search");
        if (refocused) {
          refocused.focus();
          refocused.setSelectionRange(refocused.value.length, refocused.value.length);
        }
      });
    }

    win.querySelectorAll("[data-project-id]").forEach((card) => {
      card.addEventListener("click", () => {
        this.selectedProjectId = card.dataset.projectId;
        if (this.sound) this.sound.playPaperZoom();
        this._renderPortfolioWindow(win);
      });
    });
  }

  _renderProjectDetailView(win, proj) {
    const idx = this.data.portfolio.findIndex((p) => p.id === proj.id);
    const prevProj =
      this.data.portfolio[(idx - 1 + this.data.portfolio.length) % this.data.portfolio.length];
    const nextProj = this.data.portfolio[(idx + 1) % this.data.portfolio.length];

    win.innerHTML = `
      <div class="window-header">
        <div class="window-title-group">
          <span class="window-badge">${proj.categoryLabel} · ${proj.year}</span>
          <h2 class="window-title">${proj.title}</h2>
        </div>
        <div class="window-header-actions">
          <button class="back-studio-btn" id="btn-back-grid">← Semua Proyek</button>
          <button class="window-close-btn" id="btn-close-win">×</button>
        </div>
      </div>

      <div class="window-body">
        <div class="project-detail-sheet">
          <div class="detail-gallery">
            <img src="${proj.image}" alt="${proj.title}" />
            <img src="${proj.secondaryImage || proj.image}" alt="Visualisasi ${proj.title}" />
          </div>

          <div class="detail-specs-grid">
            <div class="spec-box">
              <div class="spec-label">Lokasi</div>
              <div class="spec-val">${proj.location}</div>
            </div>
            <div class="spec-box">
              <div class="spec-label">Klien / Mitra</div>
              <div class="spec-val">${proj.client}</div>
            </div>
            <div class="spec-box">
              <div class="spec-label">Luas Tapak</div>
              <div class="spec-val">${proj.siteArea}</div>
            </div>
            <div class="spec-box">
              <div class="spec-label">Luas Bangunan</div>
              <div class="spec-val">${proj.builtArea}</div>
            </div>
            <div class="spec-box">
              <div class="spec-label">Program</div>
              <div class="spec-val">${proj.program}</div>
            </div>
            <div class="spec-box">
              <div class="spec-label">Lingkup</div>
              <div class="spec-val">${proj.scope}</div>
            </div>
          </div>

          <h3 style="font-family:var(--font-display);font-size:1.02rem;margin-bottom:8px;">Konsep &amp; Pendekatan Desain</h3>
          <p style="color:var(--ink-secondary);font-size:0.88rem;line-height:1.68;margin-bottom:14px;">${proj.summary}</p>
          <ul style="padding-left:18px;color:var(--ink-secondary);font-size:0.85rem;line-height:1.65;margin-bottom:24px;">
            ${(proj.conceptDetails || []).map((c) => `<li style="margin-bottom:5px;">${c}</li>`).join("")}
          </ul>

          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;border-top:1px dashed var(--line-sketch);padding-top:16px;">
            <button class="btn-sketch-secondary" id="btn-prev-proj">← ${prevProj.title}</button>
            <button class="btn-sketch-primary" id="btn-consult-proj">Diskusikan Proyek Serupa</button>
            <button class="btn-sketch-secondary" id="btn-next-proj">${nextProj.title} →</button>
          </div>
        </div>
      </div>
    `;

    this._bindWindowHeaderClose(win);
    win.querySelector("#btn-back-grid").addEventListener("click", () => {
      this.selectedProjectId = null;
      this._renderPortfolioWindow(win);
    });
    win.querySelector("#btn-prev-proj").addEventListener("click", () => {
      this.selectedProjectId = prevProj.id;
      this._renderPortfolioWindow(win);
    });
    win.querySelector("#btn-next-proj").addEventListener("click", () => {
      this.selectedProjectId = nextProj.id;
      this._renderPortfolioWindow(win);
    });
    win.querySelector("#btn-consult-proj").addEventListener("click", () => {
      this.openSection("contact");
    });
  }

  // ==========================================================================
  // B. RESEARCH & LAB — SIMPLE TABS, BORDERLESS ITEMS & ONLY "LIHAT" BUTTON
  //    (NO GITHUB REPOSITORY LINKS)
  // ==========================================================================
  _renderLabWindow(win) {
    const items = this.data.lab.items.filter(
      (item) => this.labFilter === "all" || item.category === this.labFilter
    );

    const simpleLabTabs = [
      { id: "all", label: "Semua Studi" },
      { id: "feasibility", label: "Feasibility Study" },
      { id: "bim", label: "BIM & Simulasi" },
      { id: "tools", label: "Tools & Riset" }
    ];

    win.innerHTML = `
      <div class="window-header">
        <div class="window-title-group">
          <span class="window-badge">Research &amp; Lab</span>
          <h2 class="window-title">Riset, Feasibility Study &amp; Digital BIM</h2>
        </div>
        <div class="window-header-actions">
          <button class="back-studio-btn" id="btn-back-studio">← Kembali</button>
          <button class="window-close-btn" id="btn-close-win">×</button>
        </div>
      </div>

      <div class="window-tabs-bar">
        <div class="tab-pills">
          ${simpleLabTabs
            .map(
              (c) => `
            <button class="tab-pill ${this.labFilter === c.id ? "active" : ""}" data-lab-cat="${c.id}">
              <span>${c.label}</span>
            </button>
          `
            )
            .join("")}
        </div>
      </div>

      <div class="window-body">
        <!-- Lightbox Preview Visual (Tanpa Link Repo) -->
        <div id="lab-ss-lightbox" class="lab-ss-lightbox" style="display:none;">
          <div class="lab-ss-lightbox-head">
            <strong id="lab-ss-lightbox-title" style="font-family:var(--font-display);font-size:0.9rem;">Pratinjau Studi</strong>
            <button id="btn-close-ss-lightbox" class="btn-sketch-secondary" style="color:#fff;border-color:rgba(255,255,255,0.35);padding:4px 12px;">Tutup ×</button>
          </div>
          <img id="lab-ss-lightbox-img" src="" alt="Preview Studi" />
        </div>

        <!-- Embedded Live Preview Container (Tanpa Link Repo) -->
        <div id="lab-iframe-container" style="display:none;margin-bottom:24px;padding-bottom:18px;border-bottom:1px dashed var(--line-sketch);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
            <strong id="lab-iframe-title" style="font-family:var(--font-display);font-size:0.92rem;">Pratinjau Interaktif</strong>
            <div style="display:flex;gap:8px;">
              <a id="lab-iframe-ext" href="#" target="_blank" rel="noopener noreferrer" class="btn-sketch-primary" style="padding:4px 12px;font-size:0.74rem;">Lihat Layar Penuh ↗</a>
              <button id="btn-close-iframe" class="btn-sketch-secondary" style="padding:4px 12px;font-size:0.74rem;">Tutup ×</button>
            </div>
          </div>
          <iframe
            id="lab-live-iframe"
            src=""
            title="Live Study Preview"
            style="width:100%;height:480px;border:1px solid var(--line-sketch-strong);border-radius:8px;background:#141a1d;"
          ></iframe>
        </div>

        <div class="lab-cards-grid">
          ${items
            .map((item) => {
              return `
                <article class="lab-card">
                  ${
                    item.screenshot
                      ? `
                    <div
                      class="lab-ss-frame"
                      ${
                        item.hasLivePages
                          ? `data-embed-url="${item.liveUrl}" data-embed-title="${item.title}"`
                          : `data-ss-src="${item.screenshot}" data-ss-title="${item.title}"`
                      }
                    >
                      <div class="lab-ss-img-wrap">
                        <img src="${item.screenshot}" alt="${item.title}" loading="lazy" />
                      </div>
                    </div>
                  `
                      : ""
                  }

                  <div class="lab-card-top">
                    <span class="lab-code-pill">${item.code}</span>
                    <span class="lab-status-pill">${item.year}</span>
                  </div>

                  <h3 class="lab-card-title">${item.title}</h3>
                  <p class="lab-card-desc">${item.description}</p>

                  <div class="lab-visual-preview">
                    ${item.metrics
                      .map(
                        (m) => `
                      <div class="lab-metric-item">
                        <div class="lab-metric-label">${m.label}</div>
                        <div class="lab-metric-val">${m.value}</div>
                      </div>
                    `
                      )
                      .join("")}
                  </div>

                  <div class="lab-actions-row">
                    ${
                      item.hasLivePages
                        ? `
                      <button type="button" class="btn-sketch-primary" data-embed-url="${item.liveUrl}" data-embed-title="${item.title}">
                        Lihat
                      </button>
                    `
                        : `
                      <button type="button" class="btn-sketch-primary" data-ss-src="${item.screenshot || ""}" data-ss-title="${item.title}">
                        Lihat
                      </button>
                    `
                    }
                  </div>
                </article>
              `;
            })
            .join("")}
        </div>
      </div>
    `;

    this._bindWindowHeaderClose(win);

    win.querySelectorAll("[data-lab-cat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.labFilter = btn.dataset.labCat;
        this._renderLabWindow(win);
      });
    });

    win.querySelectorAll("[data-embed-url]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const box = win.querySelector("#lab-iframe-container");
        const iframe = win.querySelector("#lab-live-iframe");
        const titleEl = win.querySelector("#lab-iframe-title");
        const extLink = win.querySelector("#lab-iframe-ext");
        const lb = win.querySelector("#lab-ss-lightbox");
        if (lb) lb.style.display = "none";

        if (box && iframe) {
          iframe.src = btn.dataset.embedUrl;
          if (titleEl) {
            titleEl.textContent = btn.dataset.embedTitle || "Pratinjau Interaktif";
          }
          if (extLink) {
            extLink.href = btn.dataset.embedUrl;
          }
          box.style.display = "block";
          box.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    win.querySelector("#btn-close-iframe")?.addEventListener("click", () => {
      const box = win.querySelector("#lab-iframe-container");
      const iframe = win.querySelector("#lab-live-iframe");
      if (box && iframe) {
        iframe.src = "";
        box.style.display = "none";
      }
    });

    win.querySelectorAll("[data-ss-src]").forEach((el) => {
      el.addEventListener("click", () => {
        const src = el.dataset.ssSrc;
        if (!src) return;
        const lb = win.querySelector("#lab-ss-lightbox");
        const img = win.querySelector("#lab-ss-lightbox-img");
        const title = win.querySelector("#lab-ss-lightbox-title");
        const iframeBox = win.querySelector("#lab-iframe-container");
        if (iframeBox) iframeBox.style.display = "none";

        if (lb && img) {
          img.src = src;
          if (title) title.textContent = el.dataset.ssTitle || "Pratinjau Studi";
          lb.style.display = "block";
          lb.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    win.querySelector("#btn-close-ss-lightbox")?.addEventListener("click", () => {
      const lb = win.querySelector("#lab-ss-lightbox");
      if (lb) lb.style.display = "none";
    });
  }

  // ==========================================================================
  // C. ABOUT STUDIO — SIMPLE TABS & BORDERLESS SKETCH SECTIONS
  // ==========================================================================
  _renderAboutWindow(win) {
    const p = this.data.profile;

    win.innerHTML = `
      <div class="window-header">
        <div class="window-title-group">
          <span class="window-badge">About Studio</span>
          <h2 class="window-title">${p.officialName} (${p.shortName})</h2>
        </div>
        <div class="window-header-actions">
          <button class="back-studio-btn" id="btn-back-studio">← Kembali</button>
          <button class="window-close-btn" id="btn-close-win">×</button>
        </div>
      </div>

      <div class="window-tabs-bar">
        <div class="tab-pills">
          <button class="tab-pill ${this.aboutTab === "philosophy" ? "active" : ""}" data-about-tab="philosophy">Profil &amp; Visi</button>
          <button class="tab-pill ${this.aboutTab === "team" ? "active" : ""}" data-about-tab="team">Tim Studio</button>
          <button class="tab-pill ${this.aboutTab === "services" ? "active" : ""}" data-about-tab="services">Layanan &amp; Alur</button>
          <button class="tab-pill ${this.aboutTab === "connections" ? "active" : ""}" data-about-tab="connections">Mitra &amp; Klien</button>
        </div>
      </div>

      <div class="window-body">
        ${this._getAboutTabHTML(p)}
      </div>
    `;

    this._bindWindowHeaderClose(win);

    win.querySelectorAll("[data-about-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.aboutTab = btn.dataset.aboutTab;
        this._renderAboutWindow(win);
      });
    });

    win.querySelectorAll("[data-team-div]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.teamFilter = btn.dataset.teamDiv;
        this._renderAboutWindow(win);
      });
    });
  }

  _getAboutTabHTML(p) {
    if (this.aboutTab === "team") {
      const divisions = [
        "all",
        "Leadership & Principal",
        "Planning & Design",
        "Engineering",
        "Interior & Graphic",
        "Production & Supervision"
      ];
      const filteredTeam = this.data.team.filter(
        (m) => this.teamFilter === "all" || m.division === this.teamFilter
      );
      return `
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">
          ${divisions
            .map(
              (d) => `
            <button class="viewpoint-btn ${this.teamFilter === d ? "active" : ""}" data-team-div="${d}">
              ${d === "all" ? "Semua Divisi" : d}
            </button>
          `
            )
            .join("")}
        </div>
        <div class="team-grid">
          ${filteredTeam
            .map(
              (member) => `
            <div class="team-card">
              <div class="team-photo-wrap">
                <img src="${member.photo}" alt="${member.name}" loading="lazy" />
                <span class="team-div-badge">${member.division}</span>
              </div>
              <div class="team-info">
                <div class="team-name">${member.name}</div>
                <div class="team-role">${member.role}</div>
                <div class="team-meta">
                  <strong>${member.certs}</strong><br/>
                  <span>${member.education}</span>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }

    if (this.aboutTab === "services") {
      return `
        <div class="portfolio-grid" style="margin-bottom:28px;">
          ${p.services
            .map(
              (srv) => `
            <div class="sketch-panel">
              <span class="lab-code-pill">${srv.title}</span>
              <p style="font-size:0.83rem;color:var(--ink-secondary);margin:6px 0 10px;line-height:1.52;">${srv.desc}</p>
              <ul style="padding-left:16px;font-size:0.81rem;color:var(--ink-primary);line-height:1.6;">
                ${srv.items.map((i) => `<li>${i}</li>`).join("")}
              </ul>
            </div>
          `
            )
            .join("")}
        </div>

        <div>
          <span class="lab-code-pill">Metodologi Kerja</span>
          <h3 style="font-family:var(--font-display);font-size:1.05rem;margin:4px 0 14px;">Tahapan Perancangan Studio</h3>
          <div class="detail-specs-grid" style="border-top:none;padding-top:0;">
            ${p.workflow
              .map(
                (w) => `
              <div class="spec-box">
                <div class="spec-label">TAHAP ${w.step}</div>
                <div class="spec-val" style="color:var(--accent-orange-deep);margin-bottom:3px;">${w.name}</div>
                <p style="font-size:0.76rem;color:var(--ink-secondary);line-height:1.45;">${w.desc}</p>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    if (this.aboutTab === "connections") {
      const partners = p.connections?.partners || [];
      return `
        <div class="sketch-panel" style="margin-bottom:24px;">
          <span class="lab-code-pill">Kolaborasi &amp; Jaringan</span>
          <h3 style="font-family:var(--font-display);font-size:1.05rem;margin:4px 0 12px;">Mitra Konsultan &amp; Asosiasi Profesi</h3>
          <div class="connections-grid">
            ${partners
              .map(
                (pt) => `
              <div class="connection-card">
                <span class="connection-badge">${pt.type}</span>
                <h4>${pt.name}</h4>
                <p>${pt.desc}</p>
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <div>
          <span class="lab-code-pill">Klien &amp; Instansi</span>
          <h3 style="font-family:var(--font-display);font-size:1.05rem;margin:4px 0 12px;">Klien yang Mempercayai Garis Cerita</h3>
          <div class="detail-specs-grid" style="border-top:none;padding-top:0;">
            ${p.clients
              .map(
                (c) => `
              <div class="spec-box">
                <div class="spec-label">${c.category}</div>
                <div class="spec-val" style="font-size:0.9rem;margin-top:3px;">${c.name}</div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    return `
      <div class="stats-row">
        ${p.stats
          .map(
            (s) => `
          <div class="stat-card">
            <div class="stat-value">${s.value}</div>
            <div class="stat-label">${s.label}</div>
          </div>
        `
          )
          .join("")}
      </div>

      <div class="about-hero-grid">
        <div class="sketch-panel" style="border-bottom:none;">
          <span class="lab-code-pill">Cerita &amp; Filosofi</span>
          <h3 style="font-family:var(--font-display);font-size:1.15rem;margin:6px 0 10px;">
            ${p.officialName}
          </h3>
          <p style="font-size:0.88rem;color:var(--ink-secondary);line-height:1.65;margin-bottom:14px;">
            ${p.description}
          </p>
          <div style="border-left:2.5px solid var(--accent-orange);padding-left:14px;margin:16px 0;font-family:var(--font-hand);font-size:1.18rem;color:var(--ink-primary);">
            "${p.philosophyQuote}"
          </div>
          <p style="font-size:0.84rem;color:var(--ink-secondary);line-height:1.62;">
            ${p.philosophyBody}
          </p>
        </div>

        <div class="sketch-panel" style="border-bottom:none;">
          <span class="lab-code-pill">Visi &amp; Misi</span>
          <h4 style="font-family:var(--font-display);font-size:1rem;margin:6px 0 6px;">Visi Studio</h4>
          <p style="font-size:0.84rem;color:var(--ink-secondary);line-height:1.58;margin-bottom:16px;">
            ${p.vision}
          </p>
          <h4 style="font-family:var(--font-display);font-size:1rem;margin-bottom:6px;">Misi &amp; Komitmen</h4>
          <ul style="padding-left:18px;font-size:0.82rem;color:var(--ink-secondary);line-height:1.58;">
            ${p.missions.map((m) => `<li style="margin-bottom:6px;">${m}</li>`).join("")}
          </ul>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // D. ARCHIVE / HISTORY — SIMPLE TABS & BORDERLESS TIMELINE
  // ==========================================================================
  _renderArchiveWindow(win) {
    const ar = this.data.archive;

    win.innerHTML = `
      <div class="window-header">
        <div class="window-title-group">
          <span class="window-badge">Archive &amp; History</span>
          <h2 class="window-title">Sejarah, Penghargaan &amp; Arsip Studio</h2>
        </div>
        <div class="window-header-actions">
          <a href="${ar.portfolioPdfPath}" target="_blank" class="btn-sketch-primary" style="padding:5px 14px;">
            PDF Portofolio ↗
          </a>
          <button class="back-studio-btn" id="btn-back-studio">← Kembali</button>
          <button class="window-close-btn" id="btn-close-win">×</button>
        </div>
      </div>

      <div class="window-tabs-bar">
        <div class="tab-pills">
          <button class="tab-pill ${this.archiveTab === "history" ? "active" : ""}" data-arch-tab="history">Sejarah &amp; Milestone</button>
          <button class="tab-pill ${this.archiveTab === "awards" ? "active" : ""}" data-arch-tab="awards">Penghargaan</button>
          <button class="tab-pill ${this.archiveTab === "legal" ? "active" : ""}" data-arch-tab="legal">Legalitas &amp; SBU</button>
        </div>
      </div>

      <div class="window-body">
        ${this._getArchiveTabHTML(ar)}
      </div>
    `;

    this._bindWindowHeaderClose(win);

    win.querySelectorAll("[data-arch-tab]").forEach((el) => {
      el.addEventListener("click", () => {
        this.archiveTab = el.dataset.archTab;
        if (this.sound) this.sound.playPaperZoom();
        this._renderArchiveWindow(win);
      });
    });
  }

  _getArchiveTabHTML(ar) {
    if (this.archiveTab === "awards") {
      return `
        <div class="portfolio-grid">
          ${ar.awards
            .map(
              (a) => `
            <div class="sketch-panel">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <span class="lab-code-pill">${a.rank}</span>
                <span class="lab-status-pill">${a.year}</span>
              </div>
              <h4 style="font-family:var(--font-display);font-size:0.98rem;margin-bottom:4px;">${a.event}</h4>
              <div style="font-family:var(--font-mono);font-size:0.72rem;color:var(--ink-muted);">${a.location}</div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }

    if (this.archiveTab === "legal") {
      return `
        <div class="portfolio-grid">
          ${ar.legalDocs
            .map(
              (doc) => `
            <div class="sketch-panel">
              <span class="lab-code-pill">${doc.code}</span>
              <h4 style="font-family:var(--font-display);font-size:0.98rem;margin:4px 0;">${doc.title}</h4>
              <div style="font-family:var(--font-mono);font-size:0.73rem;color:var(--accent-orange-deep);margin-bottom:4px;">
                ${doc.number}
              </div>
              <p style="font-size:0.78rem;color:var(--ink-secondary);line-height:1.5;">${doc.detail}</p>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }

    return `
      <div class="sketch-panel" style="margin-bottom:22px;">
        <span class="lab-code-pill">Perjalanan Studio (2012 – 2026)</span>
        <p style="font-size:0.86rem;color:var(--ink-secondary);line-height:1.65;margin-top:6px;">
          ${ar.historyNarrative}
        </p>
      </div>
      <div class="timeline-list">
        ${ar.milestones
          .map(
            (m) => `
          <div class="timeline-item">
            <div class="timeline-year">${m.year}</div>
            <div>
              <h4 style="font-family:var(--font-display);font-size:0.98rem;margin-bottom:3px;">${m.title}</h4>
              <p style="font-size:0.83rem;color:var(--ink-secondary);line-height:1.55;">${m.desc}</p>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  // ==========================================================================
  // E. CONTACT — MINIMALIST SOUND WAVE & BORDERLESS FORM
  // ==========================================================================
  _renderContactWindow(win) {
    const c = this.data.contact;
    const isRinging = this.sound ? this.sound.isRinging : false;

    win.innerHTML = `
      <div class="window-header">
        <div class="window-title-group">
          <span class="window-badge">Contact Studio</span>
          <h2 class="window-title">Hubungi ${c.companyName}</h2>
        </div>
        <div class="window-header-actions">
          <button class="back-studio-btn" id="btn-back-studio">← Kembali</button>
          <button class="window-close-btn" id="btn-close-win">×</button>
        </div>
      </div>

      <div class="window-body">
        <div class="phone-visualizer-bar">
          <div class="phone-wave-wrap">
            <button class="phone-ring-btn ${isRinging ? "ringing" : ""}" id="btn-replay-phone" title="Bunyikan Efek Telepon Studio">
              📞
            </button>
            <div>
              <div style="font-family:var(--font-hand);font-size:1.05rem;font-weight:700;color:var(--accent-orange-deep);" id="phone-status-label">
                ${isRinging ? "Telepon studio sedang berdering..." : "Klik ikon telepon untuk mendengar dering studio"}
              </div>
              <div style="font-family:var(--font-display);font-size:0.92rem;font-weight:700;">
                ${c.phoneOffice} · WhatsApp ${c.phoneMobile}
              </div>
            </div>
          </div>

          <div class="waveform-bars ${isRinging ? "active" : ""}" id="phone-waveform">
            ${Array.from({ length: 18 })
              .map(() => `<span class="waveform-bar"></span>`)
              .join("")}
          </div>

          <button class="btn-sketch-secondary" id="btn-ring-again">
            🔔 Deringkan Ulang
          </button>
        </div>

        <div class="contact-layout">
          <div>
            <span class="lab-code-pill">Informasi Kontak</span>
            <h3 style="font-family:var(--font-display);font-size:1.06rem;margin:4px 0 14px;">Studio Jakarta Selatan</h3>

            <div class="contact-info-list">
              <div class="contact-item">
                <span>✉️</span>
                <div>
                  <strong style="font-size:0.83rem;">Email</strong>
                  <p style="font-size:0.82rem;color:var(--ink-secondary);">
                    <a href="mailto:${c.email}" style="color:inherit;text-decoration:none;">${c.email}</a>
                  </p>
                </div>
              </div>

              <div class="contact-item">
                <span>📞</span>
                <div>
                  <strong style="font-size:0.83rem;">Telepon &amp; WhatsApp</strong>
                  <p style="font-size:0.82rem;color:var(--ink-secondary);">
                    ${c.phoneMobile} · ${c.phoneOffice}
                  </p>
                </div>
              </div>

              <div class="contact-item">
                <span>📍</span>
                <div>
                  <strong style="font-size:0.83rem;">Alamat Studio</strong>
                  <p style="font-size:0.8rem;color:var(--ink-secondary);line-height:1.48;margin-top:2px;">
                    ${c.addressLine1}<br/>${c.addressLine2}, ${c.cityPostal}
                  </p>
                  <a href="${c.googleMapsQuery}" target="_blank" rel="noopener noreferrer" style="font-family:var(--font-hand);font-size:0.98rem;color:var(--accent-orange-deep);font-weight:700;display:inline-block;margin-top:4px;text-decoration:none;">
                    Lihat Lokasi di Peta ↗
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div>
            <span class="lab-code-pill">Diskusi Proyek</span>
            <h3 style="font-family:var(--font-display);font-size:1.06rem;margin:4px 0 14px;">Kirim Pesan Singkat</h3>

            <form id="contact-form">
              <div class="form-field">
                <label for="f-name">Nama / Instansi</label>
                <input type="text" id="f-name" required placeholder="Nama Anda atau perusahaan..." />
              </div>
              <div class="form-field">
                <label for="f-type">Kebutuhan Proyek</label>
                <select id="f-type">
                  <option value="Arsitektur & Engineering">Arsitektur &amp; Engineering</option>
                  <option value="Urban Design & Masterplan">Urban Design &amp; Masterplan</option>
                  <option value="Desain Interior & Komersial">Desain Interior &amp; Komersial</option>
                  <option value="Feasibility Study & BIM">Feasibility Study &amp; BIM</option>
                </select>
              </div>
              <div class="form-field">
                <label for="f-msg">Catatan Proyek</label>
                <textarea id="f-msg" rows="2" required placeholder="Lokasi tapak, luas lahan, atau rencana singkat..."></textarea>
              </div>
              <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
                <button type="submit" class="btn-sketch-primary">
                  Kirim via WhatsApp ↗
                </button>
                <button type="button" id="btn-send-email" class="btn-sketch-secondary">
                  Kirim Email
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    this._bindWindowHeaderClose(win);

    const triggerRing = () => {
      this._triggerPhoneSketchAnimation();
      if (this.sound) {
        this.sound.playTelephoneRingSequence((status) => {
          this._updatePhoneVisualizerUI(status);
        });
      }
    };

    win.querySelector("#btn-replay-phone")?.addEventListener("click", triggerRing);
    win.querySelector("#btn-ring-again")?.addEventListener("click", triggerRing);

    const form = win.querySelector("#contact-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = win.querySelector("#f-name").value.trim();
        const type = win.querySelector("#f-type").value;
        const msg = win.querySelector("#f-msg").value.trim();
        const text = encodeURIComponent(
          `Halo Studio Garis Cerita (PT Garis Cerita Karya),\n\nSaya *${name}* ingin berdiskusi mengenai proyek *${type}*.\n\nDetail: ${msg}`
        );
        window.open(`https://wa.me/${c.phoneMobileRaw}?text=${text}`, "_blank");
      });
    }

    win.querySelector("#btn-send-email")?.addEventListener("click", () => {
      const name = win.querySelector("#f-name").value.trim() || "Klien";
      const type = win.querySelector("#f-type").value;
      const msg = win.querySelector("#f-msg").value.trim();
      const subj = encodeURIComponent(`[Inquiry Proyek ${type}] — ${name}`);
      const body = encodeURIComponent(
        `Halo PT Garis Cerita Karya,\n\nNama: ${name}\nKategori: ${type}\n\nPesan:\n${msg}`
      );
      window.location.href = `mailto:${c.email}?subject=${subj}&body=${body}`;
    });
  }

  _updatePhoneVisualizerUI(status) {
    const btn = document.getElementById("btn-replay-phone");
    const wave = document.getElementById("phone-waveform");
    const label = document.getElementById("phone-status-label");
    if (!btn || !wave || !label) return;

    if (status === "ringing-1" || status === "ringing-2") {
      btn.classList.add("ringing");
      wave.classList.add("active");
      label.textContent = "Kriiing... telepon studio sedang berdering!";
    } else if (status === "connected") {
      btn.classList.remove("ringing");
      wave.classList.add("active");
      label.textContent = "Gagang diangkat — Halo Garis Cerita Studio!";
    } else if (status === "muted") {
      btn.classList.remove("ringing");
      wave.classList.remove("active");
      label.textContent = "Mode senyap aktif (klik tombol suara di sketsa)";
    } else {
      btn.classList.remove("ringing");
      wave.classList.remove("active");
      label.textContent = "Terhubung ke kontak PT Garis Cerita Karya";
    }
  }

  _bindWindowHeaderClose(win) {
    win.querySelector("#btn-close-win")?.addEventListener("click", () => this.closeOverlay(true));
    win.querySelector("#btn-back-studio")?.addEventListener("click", () => this.closeOverlay(true));
  }
}

function bootStudioApp() {
  if (!window.gckApp) {
    window.gckApp = new GarisCeritaApp();
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", bootStudioApp);
} else {
  bootStudioApp();
}
