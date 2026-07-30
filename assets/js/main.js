(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function createElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (typeof text === "string") element.textContent = text;
    return element;
  }

  function fetchJson(path) {
    return fetch(path).then(function (response) {
      if (!response.ok) throw new Error("Failed to load " + path);
      return response.json();
    });
  }

  function initNavigation() {
    var header = document.querySelector(".site-header");
    var menuButton = document.querySelector(".menu-toggle");
    var siteNav = document.querySelector(".site-nav");
    var navLinks = siteNav ? Array.from(siteNav.querySelectorAll("a")) : [];
    var sections = document.querySelectorAll("main section[id]");

    function setHeaderState() {
      if (header) header.classList.toggle("is-scrolled", window.scrollY > 32);
    }

    if (menuButton && siteNav) {
      menuButton.addEventListener("click", function () {
        var open = menuButton.getAttribute("aria-expanded") === "true";
        menuButton.setAttribute("aria-expanded", String(!open));
        menuButton.setAttribute("aria-label", open ? "Open menu" : "Close menu");
        siteNav.classList.toggle("open", !open);
      });

      siteNav.addEventListener("click", function (event) {
        var link = event.target.closest("a");
        if (!link) return;
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open menu");
        siteNav.classList.remove("open");
      });
    }

    function updateActiveLink() {
      var fromTop = window.scrollY + 140;
      sections.forEach(function (section) {
        if (fromTop >= section.offsetTop && fromTop < section.offsetTop + section.offsetHeight) {
          navLinks.forEach(function (link) {
            var active = link.getAttribute("href") === "#" + section.id;
            link.classList.toggle("active", active);
            if (active) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
          });
        }
      });
    }

    setHeaderState();
    window.addEventListener("scroll", function () {
      setHeaderState();
      updateActiveLink();
    }, { passive: true });
  }

  function initReveals() {
    var elements = document.querySelectorAll(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      elements.forEach(function (element) { element.classList.add("visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, instance) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          instance.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -45px" });

    elements.forEach(function (element) { observer.observe(element); });
  }

  function initSlideshow() {
    var viewer = document.querySelector("[data-slide-viewer]");
    if (!viewer) return;

    var track = viewer.querySelector(".slide-track");
    var loading = viewer.querySelector(".slide-loading");
    var previousButton = viewer.querySelector(".slide-prev");
    var nextButton = viewer.querySelector(".slide-next");
    var playButton = viewer.querySelector(".slide-play");
    var thumbnailToggle = viewer.querySelector(".slide-thumbnails-toggle");
    var thumbnailPanel = viewer.querySelector(".slide-thumbnails");
    var currentLabel = viewer.querySelector(".slide-current");
    var totalLabel = viewer.querySelector(".slide-total");
    var progress = viewer.querySelector(".slide-progress span");
    var transcript = viewer.querySelector(".slide-transcript-text");
    var slides = [];
    var figures = [];
    var thumbnails = [];
    var activeIndex = 0;
    var autoplayTimer = null;
    var userScrolling = false;
    var scrollTimer = null;
    var updateSlideHash = /^#slide-\d+$/.test(window.location.hash);

    if (reduceMotion) {
      playButton.disabled = true;
      playButton.setAttribute("aria-label", "Autoplay unavailable because reduced motion is enabled");
      playButton.setAttribute("title", "Autoplay unavailable because reduced motion is enabled");
    }

    function pad(value) { return String(value).padStart(2, "0"); }

    function stopAutoplay() {
      if (autoplayTimer) window.clearInterval(autoplayTimer);
      autoplayTimer = null;
      playButton.textContent = "▶";
      playButton.setAttribute("aria-label", "Play slideshow");
      playButton.setAttribute("title", "Play slideshow");
      playButton.setAttribute("aria-pressed", "false");
    }

    function showSlide(index, options) {
      var settings = options || {};
      var bounded = Math.max(0, Math.min(index, figures.length - 1));
      if (!figures[bounded]) return;
      if (settings.userInitiated) {
        updateSlideHash = true;
        stopAutoplay();
      }
      activeIndex = bounded;
      figures[bounded].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
      updateStatus();
    }

    function startAutoplay() {
      if (reduceMotion || autoplayTimer || figures.length < 2) return;
      updateSlideHash = true;
      playButton.textContent = "Ⅱ";
      playButton.setAttribute("aria-label", "Pause slideshow");
      playButton.setAttribute("title", "Pause slideshow");
      playButton.setAttribute("aria-pressed", "true");
      autoplayTimer = window.setInterval(function () {
        if (activeIndex >= figures.length - 1) {
          stopAutoplay();
          return;
        }
        showSlide(activeIndex + 1);
      }, 9000);
    }

    function updateStatus() {
      var slide = slides[activeIndex];
      if (!slide) return;
      currentLabel.textContent = pad(activeIndex + 1);
      totalLabel.textContent = pad(slides.length);
      progress.style.width = (((activeIndex + 1) / slides.length) * 100) + "%";
      transcript.textContent = slide.transcript || "No text transcript is available for this image-led slide.";
      previousButton.disabled = activeIndex === 0;
      nextButton.disabled = activeIndex === slides.length - 1;
      thumbnails.forEach(function (button, index) {
        var active = index === activeIndex;
        button.classList.toggle("is-active", active);
        if (active) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
      });
      if (updateSlideHash && window.history && window.history.replaceState) {
        window.history.replaceState(null, "", "#slide-" + pad(activeIndex + 1));
      }
    }

    function syncToScroll() {
      if (!track.clientWidth) return;
      var nextIndex = Math.round(track.scrollLeft / track.clientWidth);
      if (nextIndex !== activeIndex && nextIndex >= 0 && nextIndex < slides.length) {
        activeIndex = nextIndex;
        updateStatus();
      }
    }

    function buildViewer(data) {
      var validSlides = data.every(function (slide, index) {
        return slide && slide.number === index + 1 && slide.src && slide.thumbnail && slide.title && slide.alt;
      });
      if (!validSlides) throw new Error("Invalid slide metadata");
      slides = data;
      track.innerHTML = "";
      thumbnailPanel.innerHTML = "";

      slides.forEach(function (slide, index) {
        var figure = createElement("figure", "slide-figure");
        figure.id = "slide-" + pad(slide.number);
        var image = createElement("img");
        image.src = slide.src;
        image.alt = slide.alt;
        image.width = 1600;
        image.height = 900;
        image.loading = index < 2 ? "eager" : "lazy";
        image.decoding = "async";
        figure.appendChild(image);
        figure.appendChild(createElement("figcaption", "", slide.title));
        track.appendChild(figure);
        figures.push(figure);

        var thumbnailButton = createElement("button", "slide-thumb");
        thumbnailButton.type = "button";
        thumbnailButton.setAttribute("aria-label", "Go to slide " + slide.number + ": " + slide.title);
        var thumbnailImage = createElement("img");
        thumbnailImage.src = slide.thumbnail;
        thumbnailImage.alt = "";
        thumbnailImage.loading = "lazy";
        thumbnailImage.width = 320;
        thumbnailImage.height = 180;
        thumbnailButton.appendChild(thumbnailImage);
        thumbnailButton.appendChild(createElement("span", "", pad(slide.number)));
        thumbnailButton.addEventListener("click", function () { showSlide(index, { userInitiated: true }); });
        thumbnailPanel.appendChild(thumbnailButton);
        thumbnails.push(thumbnailButton);
      });

      loading.hidden = true;
      var hashMatch = window.location.hash.match(/^#slide-(\d+)$/);
      if (hashMatch) activeIndex = Math.min(Math.max(Number(hashMatch[1]) - 1, 0), slides.length - 1);
      updateStatus();
      if (activeIndex > 0) showSlide(activeIndex);
    }

    previousButton.addEventListener("click", function () { showSlide(activeIndex - 1, { userInitiated: true }); });
    nextButton.addEventListener("click", function () { showSlide(activeIndex + 1, { userInitiated: true }); });
    playButton.addEventListener("click", function () { if (autoplayTimer) stopAutoplay(); else startAutoplay(); });
    thumbnailToggle.addEventListener("click", function () {
      var expanded = thumbnailToggle.getAttribute("aria-expanded") === "true";
      thumbnailToggle.setAttribute("aria-expanded", String(!expanded));
      thumbnailToggle.textContent = expanded ? "View slides" : "Hide slides";
      thumbnailPanel.hidden = expanded;
      stopAutoplay();
    });

    track.addEventListener("scroll", function () {
      userScrolling = true;
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(function () { userScrolling = false; syncToScroll(); }, 100);
    }, { passive: true });
    track.addEventListener("pointerdown", function () {
      updateSlideHash = true;
      stopAutoplay();
    });
    viewer.addEventListener("mouseenter", function () { if (autoplayTimer) stopAutoplay(); });
    viewer.addEventListener("focusin", function () { if (autoplayTimer) stopAutoplay(); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) stopAutoplay(); });

    track.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") { event.preventDefault(); showSlide(activeIndex - 1, { userInitiated: true }); }
      if (event.key === "ArrowRight") { event.preventDefault(); showSlide(activeIndex + 1, { userInitiated: true }); }
      if (event.key === "Home") { event.preventDefault(); showSlide(0, { userInitiated: true }); }
      if (event.key === "End") { event.preventDefault(); showSlide(figures.length - 1, { userInitiated: true }); }
      if (event.key === " ") { event.preventDefault(); if (autoplayTimer) stopAutoplay(); else startAutoplay(); }
    });

    window.addEventListener("resize", function () { if (!userScrolling) showSlide(activeIndex); });

    fetchJson("data/slides.json")
      .then(function (data) {
        if (!Array.isArray(data) || !data.length) throw new Error("No slides found");
        buildViewer(data);
      })
      .catch(function () {
        loading.textContent = "The slide presentation could not be loaded. Download the original presentation above.";
        loading.classList.add("slide-error");
      });
  }

  function initFindings() {
    var list = document.getElementById("findings-dashboard-grid");
    var buttons = document.querySelectorAll(".filter-btn");
    if (!list || !buttons.length) return;
    var findings = [];
    var activePeriod = "all";

    function render() {
      list.innerHTML = "";
      var filtered = findings.filter(function (item) {
        return activePeriod === "all" || (item.periods || []).indexOf(activePeriod) !== -1;
      });
      if (!filtered.length) {
        list.appendChild(createElement("p", "finding-source", "No findings are available for this interval."));
        return;
      }

      filtered.forEach(function (item) {
        var article = createElement("article", "finding-item");
        var copy = createElement("div", "finding-copy");
        copy.appendChild(createElement("h3", "", item.title));
        copy.appendChild(createElement("p", "", item.summary));
        copy.appendChild(createElement("p", "finding-uncertainty", "Interpretation boundary: " + item.uncertainty));
        copy.appendChild(createElement("p", "finding-source", "Source: " + item.source));
        article.appendChild(copy);
        if (item.figure) {
          var figure = createElement("figure", "finding-figure");
          var image = createElement("img");
          image.src = item.figure;
          image.alt = item.title;
          image.loading = "lazy";
          figure.appendChild(image);
          article.appendChild(figure);
        }
        list.appendChild(article);
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        activePeriod = button.getAttribute("data-period") || "all";
        buttons.forEach(function (candidate) {
          var active = candidate === button;
          candidate.classList.toggle("is-active", active);
          candidate.setAttribute("aria-pressed", String(active));
        });
        render();
      });
    });

    fetchJson("data/findings.json").then(function (data) { findings = data; render(); }).catch(function () {
      list.appendChild(createElement("p", "finding-source", "Finding data could not be loaded."));
    });
  }

  function initPublications() {
    var list = document.getElementById("publications-list");
    var buttons = document.querySelectorAll(".pub-filter-btn");
    if (!list || !buttons.length) return;
    var publications = [];
    var activeTopic = "all";

    function render() {
      list.innerHTML = "";
      var filtered = publications.filter(function (item) {
        return activeTopic === "all" || (item.topicTags || []).indexOf(activeTopic) !== -1;
      }).sort(function (a, b) { return b.year - a.year; });

      if (!filtered.length) {
        list.appendChild(createElement("p", "pub-summary", "No publications match this topic."));
        return;
      }

      filtered.forEach(function (item) {
        var article = createElement("article", "pub-item");
        article.setAttribute("role", "listitem");
        article.appendChild(createElement("div", "pub-year", String(item.year)));
        var details = createElement("div", "pub-details");
        details.appendChild(createElement("h3", "", item.title));
        details.appendChild(createElement("p", "", item.authors + " · " + item.journal));
        var href = item.doi ? "https://doi.org/" + item.doi : item.url;
        if (href) {
          var link = createElement("a", "pub-link", "Open publication ↗");
          link.href = href;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          details.appendChild(link);
        }
        article.appendChild(details);
        article.appendChild(createElement("div", "pub-summary", item.summary));
        list.appendChild(article);
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        activeTopic = button.getAttribute("data-topic") || "all";
        buttons.forEach(function (candidate) {
          var active = candidate === button;
          candidate.classList.toggle("is-active", active);
          candidate.setAttribute("aria-pressed", String(active));
        });
        render();
      });
    });

    fetchJson("data/publications.json").then(function (data) { publications = data; render(); }).catch(function () {
      list.appendChild(createElement("p", "pub-summary", "Publication data could not be loaded."));
    });
  }

  initNavigation();
  initReveals();
  initSlideshow();
  initFindings();
  initPublications();
})();
