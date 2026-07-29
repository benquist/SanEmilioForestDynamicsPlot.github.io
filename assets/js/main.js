(function () {
  var menuButton = document.querySelector(".menu-toggle");
  var siteNav = document.querySelector(".site-nav");
  var navLinks = siteNav ? siteNav.querySelectorAll("a") : [];
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (menuButton && siteNav) {
    menuButton.addEventListener("click", function () {
      var expanded = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!expanded));
      siteNav.classList.toggle("open", !expanded);
    });

    siteNav.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (!link || !siteNav.contains(link)) {
        return;
      }

      if (link.getAttribute("href") && link.getAttribute("href").charAt(0) === "#") {
        var target = document.querySelector(link.getAttribute("href"));
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        }
      }

      menuButton.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("open");
    });
  }

  var sections = document.querySelectorAll("main section[id]");

  function updateActiveLink() {
    var fromTop = window.scrollY + 120;

    sections.forEach(function (section) {
      var id = section.getAttribute("id");
      var offsetTop = section.offsetTop;
      var offsetBottom = offsetTop + section.offsetHeight;

      if (fromTop >= offsetTop && fromTop < offsetBottom) {
        navLinks.forEach(function (link) {
          var isMatch = link.getAttribute("href") === "#" + id;
          link.classList.toggle("active", isMatch);
          if (isMatch) {
            link.setAttribute("aria-current", "true");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      }
    });
  }

  window.addEventListener("scroll", updateActiveLink, { passive: true });
  window.addEventListener("load", updateActiveLink);

  var reveals = document.querySelectorAll(".reveal");
  var motionReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (motionReduced || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) {
      el.classList.add("visible");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -50px 0px"
      }
    );

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  }

  function createElement(tag, className, text) {
    var el = document.createElement(tag);
    if (className) {
      el.className = className;
    }
    if (typeof text === "string") {
      el.textContent = text;
    }
    return el;
  }

  function fetchJson(path) {
    return fetch(path).then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load " + path);
      }
      return response.json();
    });
  }

  function initPublications() {
    var publicationsList = document.getElementById("publications-list");
    var filterButtons = document.querySelectorAll(".pub-filter-btn");
    if (!publicationsList || filterButtons.length === 0) {
      return;
    }

    var publications = [];
    var activeTopic = "all";

    function render() {
      publicationsList.innerHTML = "";
      var filtered = publications.filter(function (item) {
        return activeTopic === "all" || (item.topicTags || []).indexOf(activeTopic) !== -1;
      });

      if (filtered.length === 0) {
        publicationsList.appendChild(createElement("p", "small-note", "No publications match this filter."));
        return;
      }

      filtered
        .sort(function (a, b) {
          return b.year - a.year;
        })
        .forEach(function (item) {
          var article = createElement("article", "pub-item");
          article.setAttribute("role", "listitem");

          article.appendChild(createElement("h3", "", item.title));
          article.appendChild(createElement("p", "pub-meta", item.authors + " | " + item.year + " | " + item.journal));

          var doiWrap = createElement("p", "");
          doiWrap.appendChild(document.createTextNode("DOI: "));
          var doiLink = createElement("a", "", item.doi);
          doiLink.href = "https://doi.org/" + item.doi;
          doiLink.target = "_blank";
          doiLink.rel = "noopener noreferrer";
          doiWrap.appendChild(doiLink);
          article.appendChild(doiWrap);

          article.appendChild(createElement("p", "pub-note", item.summary));
          article.appendChild(createElement("p", "small-note", "Source file: " + item.sourceNotes));
          publicationsList.appendChild(article);
        });
    }

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        activeTopic = button.getAttribute("data-topic") || "all";
        filterButtons.forEach(function (btn) {
          var active = btn === button;
          btn.classList.toggle("is-active", active);
          btn.setAttribute("aria-selected", active ? "true" : "false");
        });
        render();
      });
    });

    fetchJson("data/publications.json")
      .then(function (data) {
        publications = Array.isArray(data) ? data : [];
        render();
      })
      .catch(function () {
        publicationsList.innerHTML = "";
        publicationsList.appendChild(createElement("p", "small-note", "Publication data could not be loaded."));
      });
  }

  function initFindingsDashboard() {
    var dashboardGrid = document.getElementById("findings-dashboard-grid");
    var filterButtons = document.querySelectorAll(".filter-btn");
    if (!dashboardGrid || filterButtons.length === 0) {
      return;
    }

    var findings = [];
    var activePeriod = "all";

    function render() {
      dashboardGrid.innerHTML = "";

      var filtered = findings.filter(function (item) {
        return activePeriod === "all" || (item.periods || []).indexOf(activePeriod) !== -1;
      });

      if (filtered.length === 0) {
        dashboardGrid.appendChild(createElement("p", "small-note", "No findings available for this census period."));
        return;
      }

      filtered.forEach(function (item) {
        var card = createElement("article", "dashboard-card");
        card.appendChild(createElement("h3", "", item.title));
        card.appendChild(createElement("p", "", item.summary));
        card.appendChild(createElement("p", "dashboard-uncertainty", "Uncertainty note: " + item.uncertainty));

        if (item.figure) {
          var figure = createElement("figure", "dashboard-figure");
          var image = createElement("img", "");
          image.src = item.figure;
          image.alt = item.title;
          image.loading = "lazy";
          figure.appendChild(image);
          card.appendChild(figure);
        }

        card.appendChild(createElement("p", "small-note", "Source: " + item.source));
        dashboardGrid.appendChild(card);
      });
    }

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        activePeriod = button.getAttribute("data-period") || "all";
        filterButtons.forEach(function (btn) {
          var active = btn === button;
          btn.classList.toggle("is-active", active);
          btn.setAttribute("aria-selected", active ? "true" : "false");
        });
        render();
      });
    });

    fetchJson("data/findings.json")
      .then(function (data) {
        findings = Array.isArray(data) ? data : [];
        render();
      })
      .catch(function () {
        dashboardGrid.innerHTML = "";
        dashboardGrid.appendChild(createElement("p", "small-note", "Findings data could not be loaded."));
      });
  }

  initPublications();
  initFindingsDashboard();
})();
