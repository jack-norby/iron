/* Lock In resources: the bridge walkthrough, the 60-second story builder
   and the Repenter quadrant. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  // ---------- the bridge: reveal it in the order you'd draw it ----------
  var figure = $("bridge-figure");
  var parts = document.querySelectorAll("[data-part]");
  var stepBtns = document.querySelectorAll("#bridge-steps [data-step]");
  var step = 0; // 0 = show everything
  function showStep(n) {
    step = n;
    parts.forEach(function (p) {
      var k = Number(p.getAttribute("data-part"));
      p.classList.toggle("is-faded", n > 0 && k > n);
      p.classList.toggle("is-new", n > 0 && k === n);
    });
    stepBtns.forEach(function (b) {
      var k = Number(b.dataset.step);
      b.setAttribute("aria-current", n > 0 && k === n ? "step" : "false");
      b.classList.toggle("is-done", n > 0 && k < n);
    });
    figure.classList.toggle("walking", n > 0);
    $("bridge-prev").disabled = n <= 1;
    $("bridge-next").textContent = n === 0 ? "Walk through it" : n >= 6 ? "Start over" : "Next step →";
  }
  stepBtns.forEach(function (b) {
    b.addEventListener("click", function () { showStep(Number(b.dataset.step)); });
  });
  $("bridge-next").addEventListener("click", function () { showStep(step >= 6 ? 1 : step + 1); });
  $("bridge-prev").addEventListener("click", function () { if (step > 1) showStep(step - 1); });
  $("bridge-all").addEventListener("click", function () { showStep(0); });
  showStep(0);

  // ---------- your story: saved on this device ----------
  var STORY = "lockin-story";
  var fields = ["story-before", "story-met", "story-since"];
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORY)) || {}; } catch (e) { /* no storage */ }
  function count() {
    var words = fields.reduce(function (n, id) {
      var t = $(id).value.trim();
      return n + (t ? t.split(/\s+/).length : 0);
    }, 0);
    var secs = Math.round(words / 2.5); // about 150 spoken words a minute
    $("story-words").textContent = words;
    $("story-time").textContent = secs < 60 ? "about " + secs + " seconds" : "about " + Math.floor(secs / 60) + " min " + (secs % 60) + " sec";
    $("story-time").classList.toggle("over", secs > 75);
  }
  fields.forEach(function (id) {
    var el = $(id);
    if (saved[id]) el.value = saved[id];
    el.addEventListener("input", function () {
      saved[id] = el.value;
      try { localStorage.setItem(STORY, JSON.stringify(saved)); } catch (e) { /* not saved */ }
      count();
    });
  });
  count();

  // ---------- the Repenter quadrant ----------
  var Q = {
    repenter: {
      name: "Repenter",
      axes: "Confess + Action",
      what: "You bring sin into the light quickly and completely, then actually turn. You confess to God and to a brother, and you take real steps.",
      driver: "Faith: you trust Jesus more than your comfort or your control.",
      next: "Keep going. Confess fast (set a time limit) and full (the whole truth), and help a brother do the same.",
      verse: "“Therefore, confess your sins to one another and pray for one another, that you may be healed.” James 5:16"
    },
    talker: {
      name: "Talker",
      axes: "Confess + Apathy",
      what: "You’re honest about your sin, maybe even open about it, but nothing changes. Confession becomes a way to feel better, not a turn.",
      driver: "Comfort: you move toward comfort, not toward Christ.",
      next: "Pair your next confession with one concrete action this week, and ask your group to follow up on it.",
      verse: "“For godly grief produces a repentance that leads to salvation without regret, whereas worldly grief produces death.” 2 Corinthians 7:10"
    },
    hider: {
      name: "Hider",
      axes: "Conceal + Apathy",
      what: "You keep it hidden and stay stuck. The longer it stays in the dark, the heavier the shame gets.",
      driver: "Fear: of being known and of what people will think.",
      next: "Tell one brother today. Sin loses a lot of its power the moment it’s said out loud.",
      verse: "“Whoever conceals his transgressions will not prosper, but he who confesses and forsakes them will obtain mercy.” Proverbs 28:13"
    },
    fixer: {
      name: "Fixer",
      axes: "Conceal + Action",
      what: "You try to fix it alone with willpower, rules and new systems, without telling anyone.",
      driver: "Pride and fear: you move toward control, not toward Christ.",
      next: "You can’t white-knuckle your way clean. Confess it, receive grace and let your brothers carry it with you.",
      verse: "“Come to me, all who labor and are heavy laden, and I will give you rest.” Matthew 11:28"
    }
  };
  var quadBtns = document.querySelectorAll("#quad [data-q]");
  var detail = $("quad-detail");
  function pick(key) {
    var q = Q[key];
    quadBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.q === key)); });
    detail.innerHTML =
      '<p class="eyebrow"></p><h3 class="q-name"></h3>' +
      '<p class="q-what"></p>' +
      '<p class="q-row"><b>What’s driving it</b><span class="q-driver"></span></p>' +
      '<p class="q-row"><b>Next step</b><span class="q-next"></span></p>' +
      '<p class="q-verse"></p>';
    detail.querySelector(".eyebrow").textContent = q.axes;
    detail.querySelector(".q-name").textContent = q.name;
    detail.querySelector(".q-what").textContent = q.what;
    detail.querySelector(".q-driver").textContent = q.driver;
    detail.querySelector(".q-next").textContent = q.next;
    detail.querySelector(".q-verse").textContent = q.verse;
    detail.className = "quad-detail q-" + key;
  }
  quadBtns.forEach(function (b) {
    b.addEventListener("click", function () { pick(b.dataset.q); });
  });
  pick("repenter");
})();
