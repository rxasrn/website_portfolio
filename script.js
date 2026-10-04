document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  const PASTEL = [
    "rgba(200,228,255,.95)", "rgba(255,215,235,.9)",
    "rgba(185,245,215,.85)", "rgba(210,245,255,.9)"
  ];
  const SPARKS = ["✦", "✧", "⋆", "✩"];

  /* soft mouse glow only — no custom bunny cursor */
  const glow = $("#mouseGlow");
  if (glow && fine && !reduce) {
    let mx = innerWidth / 2, my = innerHeight / 2, raf = 0;
    addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        glow.style.transform = `translate3d(${mx - 250}px, ${my - 250}px, 0)`;
        raf = 0;
      });
    }, { passive: true });
  }

  function burst(x, y, n = 8) {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const sp = document.createElement("span");
      const a = (Math.PI * 2 * i) / n;
      const d = 24 + Math.random() * 36;
      const col = PASTEL[(Math.random() * PASTEL.length) | 0];
      sp.textContent = SPARKS[(Math.random() * SPARKS.length) | 0];
      sp.className = "fx-spark";
      sp.style.cssText = `left:${x}px;top:${y}px;color:${col};text-shadow:0 0 8px ${col};--tx:${Math.cos(a) * d}px;--ty:${Math.sin(a) * d}px;`;
      document.body.appendChild(sp);
      setTimeout(() => sp.remove(), 650);
    }
  }

  /* ── hero name letters (once) ── */
  function splitLetters(sel, delay) {
    const el = $(sel); if (!el) return;
    const text = el.textContent.trim();
    el.textContent = "";
    el.style.cssText += "opacity:1;transform:none;animation:none;";
    [...text].forEach((ch, i) => {
      const s = document.createElement("span");
      s.textContent = ch === " " ? "\u00A0" : ch;
      s.style.cssText = `display:inline-block;opacity:0;transform:translateY(20px);
        transition:opacity .5s cubic-bezier(.22,1,.36,1) ${(delay + i * .04).toFixed(2)}s,
                   transform .5s cubic-bezier(.22,1,.36,1) ${(delay + i * .04).toFixed(2)}s;`;
      el.appendChild(s);
    });
    requestAnimationFrame(() => {
      el.querySelectorAll("span").forEach((s) => {
        s.style.opacity = "1";
        s.style.transform = "translateY(0)";
      });
    });
  }
  if (!reduce) {
    splitLetters(".name-first", 0.25);
    const nameLast = $(".name-last");
    if (nameLast) {
      const text = nameLast.textContent.trim();
      nameLast.dataset.text = text;
      nameLast.textContent = "";
      nameLast.style.cssText += "opacity:1;transform:none;animation:none;background:none;-webkit-text-fill-color:inherit;";
      [...text].forEach((ch, i) => {
        const s = document.createElement("span");
        s.textContent = ch === " " ? "\u00A0" : ch;
        s.style.cssText = `display:inline-block;opacity:0;transform:translateY(20px);
          background:linear-gradient(125deg,#102f43 0%,#234b63 12%,#5f8ca5 28%,#c2e1ee 42%,#edf9fd 48%,#7faec3 58%,#1b4057 74%,#0c2435 88%,#47748b 100%);
          background-size:280% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
          -webkit-text-stroke:.6px rgba(30,45,58,.55);
          filter:drop-shadow(0 2px 2px rgba(10,16,24,.4));
          animation:chrome-sweep 4.2s ease-in-out ${(1.2 + i * .05).toFixed(2)}s infinite;
          transition:opacity .5s cubic-bezier(.22,1,.36,1) ${(.5 + i * .04).toFixed(2)}s,
                     transform .5s cubic-bezier(.22,1,.36,1) ${(.5 + i * .04).toFixed(2)}s;`;
        nameLast.appendChild(s);
      });
      requestAnimationFrame(() => {
        nameLast.querySelectorAll("span").forEach((s) => {
          s.style.opacity = "1";
          s.style.transform = "translateY(0)";
        });
      });
    }
  }

  /* ── vinyl drag ── */
  const disc = $("#vinylDisc");
  let angle = 0, vel = 0.28, dragging = false, lastX = 0, scrollBoost = 0;
  let vinylVisible = true;
  if (disc && !reduce) {
    const hint = $("#vinylHint");
    const vio = new IntersectionObserver((entries) => {
      vinylVisible = entries.some((e) => e.isIntersecting);
    }, { threshold: 0.05 });
    vio.observe(disc);

    disc.addEventListener("pointerdown", (e) => {
      dragging = true;
      disc.classList.add("is-dragging");
      lastX = e.clientX;
      disc.setPointerCapture?.(e.pointerId);
      if (hint) hint.textContent = "Spinning ✦";
    });
    disc.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      angle += dx * 0.5;
      vel = clamp(dx * 0.06, -2.4, 2.4);
      lastX = e.clientX;
    });
    const end = () => {
      dragging = false;
      disc.classList.remove("is-dragging");
      if (!vel) vel = 0.28;
      if (hint) hint.textContent = "Drag to spin ✦";
    };
    disc.addEventListener("pointerup", end);
    disc.addEventListener("pointercancel", end);

    let last = performance.now();
    (function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const scrolling = document.body.classList.contains("is-scrolling");
      if (vinylVisible && !scrolling) {
        if (!dragging) {
          angle = (angle + (16 + scrollBoost + Math.abs(vel) * 50) * dt * Math.sign(vel || 1)) % 360;
          vel += (0.28 * Math.sign(vel || 1) - vel) * 0.03;
        }
        scrollBoost *= 0.92;
        disc.style.transform = `rotate(${angle}deg)`;
      }
      requestAnimationFrame(tick);
    })(last);
  }

  let lastSY = scrollY;
  addEventListener("scroll", () => {
    scrollBoost = clamp(Math.abs(scrollY - lastSY) * 2.2, 0, 120);
    lastSY = scrollY;
  }, { passive: true });

  /* ── reveal ── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const d = +(en.target.dataset.delay || 0);
      setTimeout(() => en.target.classList.add("in-view"), d);
      io.unobserve(en.target);
    });
  }, { threshold: 0.12 });
  $$(".animate-in").forEach((el) => io.observe(el));

  /* skills stagger needs .skills-list.in-view */
  const skillsList = $(".skills-list");
  if (skillsList) {
    const skIo = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("in-view");
        skIo.unobserve(en.target);
      });
    }, { threshold: 0.15 });
    skIo.observe(skillsList);
  }

  /* ── magnetic (desktop) ── */
  if (fine && !reduce) {
    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const b = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - (b.left + b.width / 2)) * 0.16}px, ${(e.clientY - (b.top + b.height / 2)) * 0.16}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* ── tilt cards ── */
  if (fine && !reduce) {
    $$(".proj-card, .folder-card, .journey-card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const b = card.getBoundingClientRect();
        const rx = ((e.clientY - b.top) / b.height - 0.5) * -8;
        const ry = ((e.clientX - b.left) / b.width - 0.5) * 10;
        const base = card.classList.contains("journey-card") ? "" : "translateY(-6px)";
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) ${base}`;
        const spot = card.querySelector(".proj-spotlight");
        if (spot) {
          spot.style.left = `${e.clientX - b.left}px`;
          spot.style.top = `${e.clientY - b.top}px`;
        }
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
    $$("[data-tilt-mini]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const b = el.getBoundingClientRect();
        const rx = ((e.clientY - b.top) / b.height - 0.5) * -6;
        const ry = ((e.clientX - b.left) / b.width - 0.5) * 8;
        el.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ── skills ── */
  $$(".skill").forEach((sk) => {
    sk.addEventListener("pointerenter", () => sk.classList.add("is-hot"));
    sk.addEventListener("pointerleave", () => sk.classList.remove("is-hot"));
    sk.addEventListener("click", (e) => burst(e.clientX, e.clientY, 8));
  });

  /* ── magic mode — full scene shift ── */
  const magicBtn = $("#magicToggle");
  const magicLabel = magicBtn?.querySelector(".mt-label");
  const magicFlash = $("#magicFlash");
  const fireMagic = (e, on) => {
    if (magicFlash && !reduce) {
      magicFlash.style.setProperty("--mx", `${e.clientX}px`);
      magicFlash.style.setProperty("--my", `${e.clientY}px`);
      magicFlash.classList.remove("is-firing");
      void magicFlash.offsetWidth;
      magicFlash.classList.add("is-firing");
      setTimeout(() => magicFlash.classList.remove("is-firing"), 750);
    }
    burst(e.clientX, e.clientY, on ? 22 : 10);
    if (on && !reduce) {
      for (let i = 0; i < 16; i++) {
        setTimeout(() => {
          burst(
            Math.random() * innerWidth,
            Math.random() * innerHeight * 0.7,
            4
          );
        }, 40 + i * 45);
      }
      scrollBoost = Math.max(scrollBoost, 90);
    }
  };
  magicBtn?.addEventListener("click", (e) => {
    const on = !document.body.classList.contains("magic-on");
    document.body.classList.toggle("magic-on", on);
    magicBtn.setAttribute("aria-pressed", on ? "true" : "false");
    if (magicLabel) magicLabel.textContent = on ? "Magic On" : "Magic";
    fireMagic(e, on);
  });

  /* ── statement cast ── */
  const stmt = $(".statement-section");
  const stmtTitle = $("#stmtTitle");
  $("#stmtMagic")?.addEventListener("click", (e) => {
    stmt?.classList.add("is-casting");
    burst(e.clientX, e.clientY, 14);
    if (stmtTitle && !reduce) {
      const html = 'Things That<br><span class="chrome-liquid">Feel Alive.</span>';
      const plain = "Things That Feel Alive.";
      const glyphs = "✦✧★ABCDEFGHIJKLMNOPQRSTUVWXYZ_/";
      let i = 0;
      const run = () => {
        if (i >= 18) { stmtTitle.innerHTML = html; return; }
        stmtTitle.textContent = [...plain].map((ch, idx) =>
          idx / plain.length < i / 18 || ch === " " ? ch : glyphs[(Math.random() * glyphs.length) | 0]
        ).join("");
        i++;
        requestAnimationFrame(run);
      };
      run();
    }
    setTimeout(() => stmt?.classList.remove("is-casting"), 700);
  });

  /* ── light deco clicks only ── */
  $$(".deco-bow-1,.deco-bow-2,.deco-bow-3,.deco-moon,.logo,.chain-ball").forEach((el) => {
    el.style.pointerEvents = "auto";
    el.addEventListener("click", (e) => burst(e.clientX, e.clientY, 8));
  });

  /* ── nav + progress + scroll-linked motion ── */
  const nav = $(".navbar");
  const fill = $(".scroll-chrome-fill");
  const hero = $("#home");
  const speedEls = $$("[data-speed]");
  const paraEls = $$("[data-parallax]");
  const mqWraps = $$(".marquee-wrap");
  const heroName = $(".hero-name");
  const navLinks = $$(".navbar nav a[href^='#']");
  const sections = navLinks
    .map((a) => $(a.getAttribute("href")))
    .filter(Boolean);
  let scrollTick = 0;
  let scrollEndTimer = 0;
  let prevY = scrollY;
  let spdSmooth = 0;
  let ptrX = 0, ptrY = 0;

  const applyScrollMotion = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    const rawSpd = clamp(Math.abs(y - prevY), 0, 80);
    spdSmooth += (rawSpd - spdSmooth) * 0.22;
    prevY = y;

    document.documentElement.style.setProperty("--sy", String(y.toFixed(1)));
    document.documentElement.style.setProperty("--spd", String(spdSmooth.toFixed(2)));

    nav?.classList.toggle("nav-scrolled", y > 40);
    if (hero) document.body.classList.toggle("scrolled-past-hero", y > hero.offsetHeight * 0.72);
    if (fill) fill.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;

    if (!reduce) {
      speedEls.forEach((el) => {
        const s = +el.dataset.speed || 0;
        const rot = el.classList.contains("sw-ring") ? y * s * 0.12 : 0;
        el.style.transform = `translate3d(0, ${(y * s).toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg)`;
      });
      paraEls.forEach((el) => {
        const s = +el.dataset.parallax || 0;
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > innerHeight + 100) return;
        const mid = rect.top + rect.height / 2 - innerHeight / 2;
        el.style.translate = `0 ${(-mid * s).toFixed(1)}px`;
      });
      mqWraps.forEach((el, i) => {
        const dir = i % 2 === 0 ? -1 : 1;
        el.style.transform = `translate3d(${(y * 0.12 * dir).toFixed(1)}px, 0, 0)`;
      });
      if (heroName && y < innerHeight) {
        heroName.style.transform = `translate3d(0, ${(y * 0.18).toFixed(1)}px, 0)`;
      }
    }

    /* active nav */
    let active = null;
    for (const sec of sections) {
      if (sec.getBoundingClientRect().top <= innerHeight * 0.35) active = sec.id;
    }
    navLinks.forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("href") === `#${active}`);
    });
  };

  const onScroll = () => {
    document.body.classList.add("is-scrolling");
    clearTimeout(scrollEndTimer);
    scrollEndTimer = setTimeout(() => document.body.classList.remove("is-scrolling"), 140);
    if (scrollTick) return;
    scrollTick = requestAnimationFrame(() => {
      applyScrollMotion();
      scrollTick = 0;
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  applyScrollMotion();

  /* ── clock ── */
  const clock = $("#clock");
  const tick = () => {
    if (!clock) return;
    const n = new Date();
    let h = n.getHours();
    const m = String(n.getMinutes()).padStart(2, "0");
    const s = String(n.getSeconds()).padStart(2, "0");
    const p = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    clock.textContent = `${String(h).padStart(2, "0")}:${m}:${s} ${p} — Online`;
  };
  tick();
  setInterval(tick, 1000);

  /* ── smooth anchors ── */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const t = $(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ── copy email (contact list only) ── */
  $$(".contact-creds a[href^='mailto:']").forEach((a) => {
    a.addEventListener("click", async (e) => {
      const mail = (a.getAttribute("href") || "").replace(/^mailto:/, "");
      if (!mail || !navigator.clipboard) return;
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(mail);
        const prev = a.textContent;
        a.textContent = "copied ✦";
        a.classList.add("copied");
        burst(e.clientX, e.clientY, 6);
        setTimeout(() => {
          a.textContent = prev;
          a.classList.remove("copied");
        }, 1400);
      } catch (_) {
        location.href = a.href;
      }
    });
  });

  /* ── pointer parallax (desktop, raf) ── */
  if (fine && !reduce) {
    let prow = 0;
    const heroRight = $(".hero-right");
    addEventListener("pointermove", (e) => {
      ptrX = (e.clientX / innerWidth - 0.5) * 2;
      ptrY = (e.clientY / innerHeight - 0.5) * 2;
      if (prow) return;
      prow = requestAnimationFrame(() => {
        if (heroRight && scrollY < innerHeight) {
          heroRight.style.transform = `translate3d(${ptrX * 14}px, ${ptrY * 10}px, 0)`;
        }
        speedEls.forEach((el, i) => {
          if (!el.classList.contains("sw-orb") && !el.classList.contains("sw-ring")) return;
          const s = +el.dataset.speed || 0;
          const y = scrollY;
          const rot = el.classList.contains("sw-ring") ? y * s * 0.12 : 0;
          el.style.transform = `translate3d(${(ptrX * (8 + i * 3)).toFixed(1)}px, ${(y * s + ptrY * (6 + i)).toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg)`;
        });
        prow = 0;
      });
    }, { passive: true });
  }
});
