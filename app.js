/* Iron: daily goals for the four areas, a calendar, stats, the reading plan
   and weekly group questions. Everything saves in this browser (localStorage). */
(function () {
  "use strict";

  var AREAS = window.AREAS;
  var PLAN = window.READING_PLAN;
  var SWP_QUESTIONS = window.SWP_QUESTIONS;
  var EXTRA_QUESTIONS = window.EXTRA_QUESTIONS;
  var STORE = "iron-v1";

  // ---------- dates (all local time, keyed YYYY-MM-DD) ----------
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function keyOf(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseKey(k) { var p = k.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(k, n) { var d = parseKey(k); return keyOf(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)); }
  var now = new Date();
  var TODAY = keyOf(now);

  // ---------- state ----------
  function starterGoals() {
    var list = [];
    AREAS.forEach(function (a) {
      a.goals.forEach(function (g) { if (g.starter) list.push({ id: g.id, area: a.id, label: g.label }); });
    });
    return list;
  }
  function fresh() { return { goals: starterGoals(), log: {}, created: TODAY, welcomed: false }; }
  function valid(s) { return s && Array.isArray(s.goals) && s.log && typeof s.log === "object"; }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE) || localStorage.getItem("lockin-v1")); // lockin-v1: the site's earlier name
      if (valid(s)) { if (!s.created) s.created = TODAY; return s; }
    } catch (e) { /* storage blocked or empty */ }
    return fresh();
  }
  var state = load();
  function saveLocal() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* not saved */ }
  }
  function save() {
    saveLocal();
    if (window.Iron.onSave) window.Iron.onSave(state);
  }

  function hasGoal(id) { return state.goals.some(function (g) { return g.id === id; }); }
  function addGoal(g) { if (!hasGoal(g.id)) { state.goals.push(g); save(); } }
  function removeGoal(id) {
    state.goals = state.goals.filter(function (g) { return g.id !== id; });
    Object.keys(state.log).forEach(function (k) {
      state.log[k] = state.log[k].filter(function (x) { return x !== id; });
    });
    save();
  }
  function doneOn(k) { return (state.log[k] || []).filter(hasGoal); }
  function fraction(k) { return state.goals.length ? doneOn(k).length / state.goals.length : 0; }
  function level(k) {
    var f = fraction(k);
    if (f === 0) return 0;
    if (f === 1) return 4;
    if (f >= 0.8) return 3;
    if (f >= 0.4) return 2;
    return 1;
  }
  function lockedIn(k) { return state.goals.length > 0 && fraction(k) >= 0.8; }
  function firstDay() {
    var keys = Object.keys(state.log).filter(function (k) { return state.log[k].length; }).sort();
    return keys.length && keys[0] < state.created ? keys[0] : state.created;
  }

  var selected = TODAY;
  var viewMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  var $ = function (id) { return document.getElementById(id); };

  // ---------- today ----------
  var CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>';

  function dayLabel(k) {
    if (k === TODAY) return "Today";
    if (k === addDays(TODAY, -1)) return "Yesterday";
    return parseKey(k).toLocaleDateString(undefined, { weekday: "long" });
  }

  function renderDay() {
    var d = parseKey(selected);
    $("day-label").textContent = dayLabel(selected);
    $("day-title").textContent = d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    $("next-day").disabled = selected >= TODAY;
    $("go-today").hidden = selected === TODAY;
    $("welcome").hidden = !!state.welcomed;

    var done = doneOn(selected);
    var list = $("checklist");
    list.innerHTML = "";
    if (!state.goals.length) {
      list.innerHTML = '<p class="empty">No goals yet. Add one below or pick some under <a href="#goals">Goals</a>.</p>';
    }
    AREAS.forEach(function (area) {
      var goals = state.goals.filter(function (g) { return g.area === area.id; });
      if (!goals.length) return;
      var group = document.createElement("div");
      group.className = "goal-group area-" + area.id;
      var h = document.createElement("h3");
      h.textContent = area.name;
      group.appendChild(h);
      goals.forEach(function (g) {
        var row = document.createElement("div");
        row.className = "goal";
        var id = "g-" + g.id;
        row.innerHTML =
          '<input type="checkbox" id="' + id + '">' +
          '<label for="' + id + '"><span class="box">' + CHECK + '</span><span class="txt"></span></label>' +
          '<button type="button" class="rm" title="Remove goal">×</button>';
        row.querySelector(".txt").textContent = g.label;
        row.querySelector(".rm").setAttribute("aria-label", "Remove " + g.label);
        var cb = row.querySelector("input");
        cb.checked = done.indexOf(g.id) !== -1;
        cb.addEventListener("change", function () {
          var ids = (state.log[selected] || []).filter(function (x) { return x !== g.id; });
          if (cb.checked) ids.push(g.id);
          state.log[selected] = ids;
          save();
          renderProgressBar();
          renderProgress();
        });
        row.querySelector(".rm").addEventListener("click", function () {
          removeGoal(g.id);
          renderAll();
        });
        group.appendChild(row);
      });
      list.appendChild(group);
    });
    renderProgressBar();
    renderReading();
  }

  function renderProgressBar() {
    var total = state.goals.length;
    var n = doneOn(selected).length;
    $("progress-bar").style.width = (total ? (n / total) * 100 : 0) + "%";
    $("progress-text").textContent = n + " of " + total + " done" + (total && n === total ? " · All done" : "");
  }

  // ---------- reading plan ----------
  function passageLink(ref) {
    var a = document.createElement("a");
    a.href = "https://www.biblegateway.com/passage/?search=" + encodeURIComponent(ref.replace(/–/g, "-")) + "&version=ESV";
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = ref;
    return a;
  }
  function readingFor(k) {
    if (!PLAN) return null;
    var d = parseKey(k);
    var i = (d.getDay() + 6) % 7; // Monday = 0
    var monday = addDays(k, -i);
    var wk = PLAN.weeks.filter(function (w) { return w.start === monday; })[0];
    if (!wk) return null;
    return { week: wk, i: i, weekend: i > 4 };
  }
  function renderReading() {
    var box = $("reading");
    var r = readingFor(selected);
    box.hidden = !r;
    if (!r) return;
    box.innerHTML = "";
    var h = document.createElement("h3");
    h.textContent = dayLabel(selected) + "’s reading";
    box.appendChild(h);
    if (r.weekend) {
      var p = document.createElement("p");
      p.textContent = "No reading today. Catch up, review your verse or rest.";
      box.appendChild(p);
    } else {
      var dl = document.createElement("dl");
      Object.keys(PLAN.tracks).forEach(function (t) {
        var dt = document.createElement("dt");
        dt.textContent = PLAN.tracks[t];
        var dd = document.createElement("dd");
        dd.appendChild(passageLink(r.week[t][r.i]));
        dl.appendChild(dt);
        dl.appendChild(dd);
      });
      box.appendChild(dl);
    }
    var mem = document.createElement("p");
    mem.className = "mem";
    mem.append("Memory verse: ", passageLink(r.week.mem));
    box.appendChild(mem);
    var src = document.createElement("p");
    src.className = "fine";
    var link = document.createElement("a");
    link.href = PLAN.url; link.target = "_blank"; link.rel = "noopener";
    link.textContent = PLAN.name;
    src.append(link);
    box.appendChild(src);
  }

  // ---------- progress ----------
  // The numbers shown here are also what group leaders see (never the goals themselves).
  function summary() {
    // streak: today counts once it's locked in; until then the streak runs through yesterday
    var streak = 0;
    for (var k = lockedIn(TODAY) ? TODAY : addDays(TODAY, -1); lockedIn(k); k = addDays(k, -1)) streak++;
    var best = 0, run = 0, checks = 0, last = "";
    for (var d = firstDay(); d <= TODAY; d = addDays(d, 1)) {
      if (lockedIn(d)) { run++; best = Math.max(best, run); } else run = 0;
      var n = doneOn(d).length;
      checks += n;
      if (n) last = d;
    }
    // last 7 days, or fewer for someone who started less than a week ago
    var span = 0, week = 0;
    for (var w = 0; w < 7 && addDays(TODAY, -w) >= firstDay(); w++) { week += fraction(addDays(TODAY, -w)); span++; }
    span = Math.max(span, 1);
    var areas = {};
    AREAS.forEach(function (a) {
      var ids = state.goals.filter(function (g) { return g.area === a.id; }).map(function (g) { return g.id; });
      var hits = 0;
      for (var i = 0; i < span; i++) hits += doneOn(addDays(TODAY, -i)).filter(function (x) { return ids.indexOf(x) !== -1; }).length;
      areas[a.id] = ids.length ? Math.round((hits / (ids.length * span)) * 100) : null;
    });
    return {
      streak: streak, best: best, checks: checks,
      week: Math.round((week / span) * 100),
      today: doneOn(TODAY).length, total: state.goals.length,
      lastCheckin: last, areas: areas, date: TODAY
    };
  }

  function renderProgress() {
    var s = summary();
    $("stat-streak").textContent = s.streak;
    $("hero-streak").textContent = s.streak;
    $("stat-best").textContent = s.best;
    $("stat-week").textContent = s.week + "%";
    $("stat-checks").textContent = s.checks;
    renderCalendar();
    renderAreaBars();
  }

  function renderCalendar() {
    var cal = $("calendar");
    cal.innerHTML = "";
    $("month-title").textContent = viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    $("next-month").disabled = viewMonth.getFullYear() === now.getFullYear() && viewMonth.getMonth() === now.getMonth();
    ["S", "M", "T", "W", "T", "F", "S"].forEach(function (x) {
      var s = document.createElement("span");
      s.className = "dow";
      s.textContent = x;
      cal.appendChild(s);
    });
    for (var o = 0; o < viewMonth.getDay(); o++) cal.appendChild(document.createElement("span"));
    var days = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    for (var day = 1; day <= days; day++) {
      var k = keyOf(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = String(day);
      b.dataset.key = k;
      b.dataset.lvl = k <= TODAY ? String(level(k)) : "";
      b.disabled = k > TODAY;
      b.setAttribute("aria-label", parseKey(k).toLocaleDateString(undefined, { month: "long", day: "numeric" }));
      b.setAttribute("aria-pressed", String(k === selected));
      if (k === TODAY) b.setAttribute("aria-current", "date");
      b.addEventListener("click", function (e) {
        selected = e.currentTarget.dataset.key;
        renderDay();
        renderCalendar();
        $("day").scrollIntoView({ behavior: "smooth", block: "start" });
      });
      cal.appendChild(b);
    }
  }

  function renderAreaBars() {
    var box = $("area-bars");
    box.innerHTML = "";
    var start = addDays(TODAY, -29);
    if (firstDay() > start) start = firstDay();
    var days = 0;
    for (var d = start; d <= TODAY; d = addDays(d, 1)) days++;
    AREAS.forEach(function (area) {
      var ids = state.goals.filter(function (g) { return g.area === area.id; }).map(function (g) { return g.id; });
      var hits = 0;
      for (var k = start; k <= TODAY; k = addDays(k, 1)) {
        hits += doneOn(k).filter(function (x) { return ids.indexOf(x) !== -1; }).length;
      }
      var rate = ids.length ? hits / (ids.length * days) : null;
      var row = document.createElement("div");
      row.className = "bar-row area-" + area.id;
      row.innerHTML = '<span class="bar-name"></span><span class="bar"><span></span></span><span class="bar-pct"></span>';
      row.querySelector(".bar-name").textContent = area.name;
      row.querySelector(".bar span").style.width = (rate === null ? 0 : Math.round(rate * 100)) + "%";
      row.querySelector(".bar-pct").textContent = rate === null ? "No goals" : Math.round(rate * 100) + "%";
      box.appendChild(row);
    });
  }

  // ---------- goals (the four areas) ----------
  function renderAreas() {
    var box = $("areas");
    box.innerHTML = "";
    AREAS.forEach(function (area, i) {
      var det = document.createElement("details");
      det.className = "area area-" + area.id;
      det.open = i === 0;
      det.innerHTML =
        '<summary><span class="plate plate-' + area.id + '" aria-hidden="true"></span><span><span class="area-name"></span><span class="area-tag"></span></span></summary>' +
        '<p class="area-why"></p>' +
        '<blockquote class="verse"><p></p><cite></cite></blockquote>' +
        '<ul class="suggestions"></ul>';
      det.querySelector(".area-name").textContent = area.name;
      det.querySelector(".area-tag").textContent = area.tagline;
      det.querySelector(".area-why").textContent = area.why;
      det.querySelector(".verse p").textContent = "“" + area.verse.text + "”";
      det.querySelector(".verse cite").textContent = area.verse.ref;
      var ul = det.querySelector(".suggestions");
      area.goals.forEach(function (g) {
        var li = document.createElement("li");
        li.innerHTML = '<div><b></b><span></span></div><button type="button" class="toggle"></button>';
        li.querySelector("b").textContent = g.label;
        li.querySelector("div span").textContent = g.detail;
        var btn = li.querySelector(".toggle");
        var sync = function () {
          var on = hasGoal(g.id);
          btn.textContent = on ? "✓ Added" : "+ Add";
          btn.setAttribute("aria-pressed", String(on));
          btn.setAttribute("aria-label", (on ? "Remove " : "Add ") + g.label);
        };
        btn.addEventListener("click", function () {
          if (hasGoal(g.id)) removeGoal(g.id);
          else addGoal({ id: g.id, area: area.id, label: g.label });
          sync();
          renderDay();
          renderProgress();
        });
        sync();
        ul.appendChild(li);
      });
      box.appendChild(det);
    });
  }

  // ---------- group questions: Spiritual Workout Plan on one side, the rest on the other ----------
  function renderQuestions() {
    [["questions-swp", SWP_QUESTIONS], ["questions-extra", EXTRA_QUESTIONS]].forEach(function (pair) {
      var ol = $(pair[0]);
      pair[1].forEach(function (x) {
        var li = document.createElement("li");
        li.innerHTML = "<b></b> <span></span>";
        li.querySelector("b").textContent = x.q;
        li.querySelector("span").textContent = x.a;
        ol.appendChild(li);
      });
    });
    var lines = function (list) { return list.map(function (x, i) { return (i + 1) + ". " + x.q + ": " + x.a; }).join("\n"); };
    $("questions-text").value = "Connection group check-in\n\nSpiritual Workout Plan\n" + lines(SWP_QUESTIONS) + "\n\nIron\n" + lines(EXTRA_QUESTIONS);
  }

  // ---------- reminders: a calendar file with daily alerts ----------
  function icsTime(hhmm) {
    var p = hhmm.split(":");
    var start = parseKey(addDays(TODAY, 1));
    return keyOf(start).replace(/-/g, "") + "T" + pad(+p[0]) + pad(+p[1]) + "00";
  }
  function icsEvent(id, title, desc, time, rule) {
    var url = location.href.split("#")[0];
    var stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    return [
      "BEGIN:VEVENT",
      "UID:iron-" + id + "-" + Date.now() + "@iron",
      "DTSTAMP:" + stamp,
      "DTSTART:" + icsTime(time),
      "DURATION:PT10M",
      "RRULE:" + rule,
      "SUMMARY:" + title,
      "DESCRIPTION:" + desc + " " + url,
      "URL:" + url,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:" + title,
      "TRIGGER:PT0M",
      "END:VALARM",
      "END:VEVENT"
    ];
  }
  function buildReminders() {
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Iron//Reminders//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Iron"];
    if ($("rem-read-on").checked) {
      lines = lines.concat(icsEvent("read", "Read your Bible", "Today’s Spiritual Workout Plan reading is in Iron.", $("rem-read").value,
        $("rem-weekdays").checked ? "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR" : "FREQ=DAILY"));
    }
    if ($("rem-check-on").checked) {
      lines = lines.concat(icsEvent("checkin", "Check in on Iron", "How did today go? Check off your goals.", $("rem-check").value, "FREQ=DAILY"));
    }
    lines.push("END:VCALENDAR");
    return lines.join("\r\n") + "\r\n";
  }
  function copyText(text, fallbackEl, status, okMsg) {
    var fallback = function () {
      fallbackEl.classList.remove("visually-hidden");
      fallbackEl.value = text;
      fallbackEl.focus();
      fallbackEl.select();
      status.textContent = "Selected. Copy it from the box above.";
    };
    try { navigator.clipboard.writeText(text).then(function () { status.textContent = okMsg; }, fallback); } catch (e) { fallback(); }
  }

  // ---------- wire up ----------
  function renderAll() { renderDay(); renderProgress(); renderAreas(); }

  $("prev-day").addEventListener("click", function () { selected = addDays(selected, -1); syncMonth(); renderDay(); renderCalendar(); });
  $("next-day").addEventListener("click", function () { if (selected < TODAY) { selected = addDays(selected, 1); syncMonth(); renderDay(); renderCalendar(); } });
  $("go-today").addEventListener("click", function () { selected = TODAY; syncMonth(); renderDay(); renderCalendar(); });
  function syncMonth() { var d = parseKey(selected); viewMonth = new Date(d.getFullYear(), d.getMonth(), 1); }
  $("prev-month").addEventListener("click", function () { viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1); renderCalendar(); });
  $("next-month").addEventListener("click", function () { viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1); renderCalendar(); });

  $("welcome-ok").addEventListener("click", function () { state.welcomed = true; save(); $("welcome").hidden = true; });

  var areaSel = $("new-area");
  AREAS.forEach(function (a) {
    var o = document.createElement("option");
    o.value = a.id;
    o.textContent = a.name;
    areaSel.appendChild(o);
  });
  $("add-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var input = $("new-goal");
    var text = input.value.trim();
    if (!text) { input.focus(); return; }
    addGoal({ id: "custom-" + Date.now().toString(36), area: areaSel.value, label: text });
    input.value = "";
    renderDay();
    renderProgress();
  });

  $("rem-add").addEventListener("click", function () {
    if (!$("rem-read-on").checked && !$("rem-check-on").checked) {
      $("rem-status").textContent = "Turn on at least one reminder first.";
      return;
    }
    var blob = new Blob([buildReminders()], { type: "text/calendar;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "iron-reminders.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    $("rem-status").textContent = "Open the file and tap “Add” to put the reminders on your calendar.";
  });

  $("copy-questions").addEventListener("click", function () {
    copyText($("questions-text").value, $("questions-text"), $("copy-status"), "Copied. Paste it in your group chat.");
  });

  $("backup-copy").addEventListener("click", function () {
    var code = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    var box = $("backup-code");
    box.value = code;
    copyText(code, box, $("backup-status"), "Copied. Paste it into Iron on your other phone and tap Restore.");
  });
  $("backup-restore").addEventListener("click", function () {
    try {
      var s = JSON.parse(decodeURIComponent(escape(atob($("backup-code").value.trim()))));
      if (!valid(s)) throw new Error("bad");
      state = s;
      state.welcomed = true;
      save();
      $("backup-status").textContent = "Restored. Your goals and check-ins are back.";
      renderAll();
    } catch (e) {
      $("backup-status").textContent = "That code didn’t work. Copy the whole thing from your other phone and try again.";
    }
  });

  var reset = $("reset"), armed;
  reset.addEventListener("click", function () {
    if (!reset.classList.contains("armed")) {
      reset.classList.add("armed");
      reset.textContent = "Tap again to erase all goals and check-ins";
      armed = setTimeout(function () { reset.classList.remove("armed"); reset.textContent = "Start over"; }, 4000);
      return;
    }
    clearTimeout(armed);
    state = fresh();
    save();
    selected = TODAY;
    syncMonth();
    reset.classList.remove("armed");
    reset.textContent = "Start over";
    renderAll();
  });

  // Hooks for account.js (sign-in, syncing and groups).
  window.Iron = {
    getState: function () { return state; },
    fresh: fresh,
    valid: valid,
    summary: summary,
    setState: function (next) {
      state = valid(next) ? next : fresh();
      if (!state.created) state.created = TODAY;
      saveLocal();
      selected = TODAY;
      syncMonth();
      renderAll();
    },
    onSave: null
  };

  renderQuestions();
  renderAll();
  if (!state.welcomed) saveLocal(); // remember the start date for newcomers
})();
