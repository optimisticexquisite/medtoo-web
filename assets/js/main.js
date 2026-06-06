/* ============================================================
   MedToo India — interactions
   Vanilla JS, progressive-enhancement, no dependencies.
   ============================================================ */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from((c || document).querySelectorAll(s));

  /* ---------- year stamps ---------- */
  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- header scroll state ---------- */
  const header = $(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- mobile menu ---------- */
  const burger = $("[data-nav-toggle]");
  const menu = $("#mobile-menu");
  if (burger && menu) {
    const setOpen = (open) => {
      burger.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };
    burger.addEventListener("click", () => setOpen(burger.getAttribute("aria-expanded") !== "true"));
    $$(".mobile-menu__link", menu).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("is-open")) setOpen(false); });
  }

  /* ---------- reveal on scroll ---------- */
  const revealEls = $$(".reveal, .reveal-x, .clip-rise");
  if (revealEls.length) {
    const reveal = (el) => el.classList.add("in");
    if (prefersReduced || !("IntersectionObserver" in window)) {
      revealEls.forEach(reveal);
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
        });
      }, { threshold: 0, rootMargin: "0px 0px -6% 0px" });
      revealEls.forEach((el) => io.observe(el));
      // failsafe: reveal anything already on screen at load (covers async IO timing)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const vh = window.innerHeight || document.documentElement.clientHeight;
        revealEls.forEach((el) => {
          if (el.classList.contains("in")) return;
          const r = el.getBoundingClientRect();
          if (r.top < vh * 0.92 && r.bottom > 0) { reveal(el); io.unobserve(el); }
        });
      }));
    }
  }

  /* ---------- animated counters ---------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.counter) || 0;
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const dur = prefersReduced ? 0 : (parseInt(el.dataset.dur, 10) || 1800);
    const start = performance.now();
    const fmt = (n) => (decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString("en-IN"));
    if (dur === 0) { el.textContent = fmt(target) + suffix; return; }
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(target) + suffix;
    }
    requestAnimationFrame(tick);
  }

  const counters = $$("[data-counter]");
  if (counters.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      counters.forEach(animateCount);
    } else {
      const cio = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
        });
      }, { threshold: 0.4 });
      counters.forEach((el) => cio.observe(el));
    }
  }

  /* ---------- live "responses" ticker (cosmetic, gentle increment) ---------- */
  const liveEls = $$("[data-live-count]");
  if (liveEls.length) {
    // base value rendered immediately; the big counter animates separately.
    const base = parseInt(liveEls[0].dataset.liveCount, 10) || 3000;
    let current = base;
    const render = () => liveEls.forEach((el) => { el.textContent = current.toLocaleString("en-IN"); });
    render();
    if (!prefersReduced) {
      // occasional +1 to convey an ongoing, living dataset (max +20 per session)
      let added = 0;
      const bump = () => {
        if (added >= 20 || document.hidden) { schedule(); return; }
        current += 1; added += 1; render();
        liveEls.forEach((el) => {
          el.style.transition = "color .3s"; el.style.color = "var(--teal-bright)";
          setTimeout(() => { el.style.color = ""; }, 350);
        });
        schedule();
      };
      function schedule() { setTimeout(bump, 14000 + Math.floor((current % 7) * 2200)); }
      schedule();
    }
  }

  /* ---------- hero spotlight (cursor follow) ---------- */
  const spot = $("[data-spotlight]");
  if (spot && !prefersReduced && window.matchMedia("(pointer:fine)").matches) {
    const host = spot.closest(".hero") || spot.parentElement;
    host.addEventListener("pointermove", (e) => {
      const r = host.getBoundingClientRect();
      spot.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      spot.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  }

  /* ---------- poll ("would you report?") ---------- */
  const poll = $("[data-poll]");
  if (poll) {
    // illustrative distribution — anchored to the real finding that disclosure is rare
    const dist = { yes: 31, unsure: 27, no: 42 };
    const opts = $$(".poll__opt", poll);
    let voted = false;
    opts.forEach((opt) => {
      opt.addEventListener("click", () => {
        if (voted) return;
        voted = true;
        poll.classList.add("voted");
        opts.forEach((o) => {
          o.disabled = true;
          const key = o.dataset.vote;
          const pct = dist[key] != null ? dist[key] : 0;
          const fill = $(".fill", o); const lbl = $(".pct", o);
          if (fill) fill.style.width = pct + "%";
          if (lbl) lbl.textContent = pct + "%";
          if (o === opt) o.style.borderColor = "var(--bone)";
        });
      });
    });
  }

  /* ---------- copy to clipboard ---------- */
  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy || $(btn.dataset.copyTarget)?.value || "";
      const original = btn.dataset.label || btn.textContent;
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        const tmp = document.createElement("textarea");
        tmp.value = text; document.body.appendChild(tmp); tmp.select();
        try { document.execCommand("copy"); } catch (e) {}
        tmp.remove();
      }
      btn.classList.add("copied");
      const span = $(".copy-label", btn) || btn;
      span.textContent = "Copied ✓";
      setTimeout(() => { btn.classList.remove("copied"); span.textContent = original; }, 1900);
    });
  });

  /* ---------- web share (native, with fallback) ---------- */
  $$("[data-share-native]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const data = {
        title: btn.dataset.title || document.title,
        text: btn.dataset.text || "",
        url: btn.dataset.url || window.location.href,
      };
      if (navigator.share) {
        try { await navigator.share(data); } catch (_) {}
      } else {
        try {
          await navigator.clipboard.writeText(data.url);
          const s = $(".copy-label", btn) || btn;
          const o = s.textContent; s.textContent = "Link copied ✓";
          setTimeout(() => (s.textContent = o), 1800);
        } catch (e) {}
      }
    });
  });

  /* ---------- quick exit (safety) ---------- */
  const exits = $$("[data-quick-exit]");
  function quickExit() {
    // replace history entry so back button doesn't return here, then leave.
    try { window.location.replace("https://www.google.com"); }
    catch (_) { window.location.href = "https://www.google.com"; }
    // best-effort: open a neutral page on top
    try { window.open("https://weather.com", "_blank"); } catch (e) {}
  }
  exits.forEach((b) => b.addEventListener("click", quickExit));
  // double-tap ESC for quick exit
  let escTimer = null, escCount = 0;
  if (exits.length) {
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      escCount += 1;
      clearTimeout(escTimer);
      if (escCount >= 2) { escCount = 0; quickExit(); }
      escTimer = setTimeout(() => (escCount = 0), 600);
    });
  }

  /* ---------- form iframe loader ---------- */
  const frame = $("#form-frame");
  const loading = $("#form-loading");
  if (frame && loading) {
    let done = false;
    const hide = () => { if (done) return; done = true; loading.classList.add("hide"); };
    frame.addEventListener("load", hide);
    // safety fallback in case load doesn't fire (cross-origin quirks)
    setTimeout(hide, 4000);
  }

  /* ---------- smooth anchor offset for in-page links already handled by scroll-padding ---------- */

})();
