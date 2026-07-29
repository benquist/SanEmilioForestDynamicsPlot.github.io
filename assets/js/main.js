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

      if (menuButton) {
        menuButton.setAttribute("aria-expanded", "false");
        siteNav.classList.remove("open");
      }
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
    return;
  }

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
})();
