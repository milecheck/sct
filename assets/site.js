(function () {
  "use strict";

  var rail = document.querySelector("[data-km-now]");
  function updateRail() {
    if (!rail) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var progress = max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
    rail.textContent = "KM " + String(Math.round(progress * 178)).padStart(3, "0");
  }
  window.addEventListener("scroll", updateRail, { passive: true });
  window.addEventListener("resize", updateRail);
  updateRail();

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var reveals = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (element) { element.classList.add("in"); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (element) { observer.observe(element); });
  }

  document.querySelectorAll(".nav-menu__panel a").forEach(function (link) {
    link.addEventListener("click", function () {
      var menu = link.closest("details");
      if (menu) menu.open = false;
    });
  });

  var checklist = document.querySelector("[data-packing-checklist]");
  if (checklist) {
    var storageKey = "sct-packing-checklist-v1";
    var boxes = Array.prototype.slice.call(checklist.querySelectorAll('input[type="checkbox"]'));
    var count = checklist.querySelector("[data-checklist-count]");
    var clear = checklist.querySelector("[data-checklist-clear]");
    var saved = [];
    try { saved = JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch (_) { saved = []; }
    boxes.forEach(function (box) { box.checked = saved.indexOf(box.value) !== -1; });

    function updateChecklist(save) {
      var checked = boxes.filter(function (box) { return box.checked; });
      if (count) count.textContent = checked.length + " of " + boxes.length + " packed";
      if (save) {
        try { localStorage.setItem(storageKey, JSON.stringify(checked.map(function (box) { return box.value; }))); } catch (_) {}
      }
    }
    boxes.forEach(function (box) { box.addEventListener("change", function () { updateChecklist(true); }); });
    if (clear) clear.addEventListener("click", function () {
      boxes.forEach(function (box) { box.checked = false; });
      updateChecklist(true);
    });
    updateChecklist(false);
  }
})();
