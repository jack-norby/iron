/* Iron journal: a monthly log (one-line highlight per day + up to 3 habits),
   the month's actions, Remember / Gratitude / Prayers pages, and dated entries.
   Stored in the same saved data as the tracker (state.journal), so it syncs to
   your account. It is never shared with group leaders. */
(function () {
  "use strict";

  var I = window.Iron;
  if (!I) return;
  var $ = function (id) { return document.getElementById(id); };
  var DOW = ["S", "M", "T", "W", "T", "F", "S"];
  var now = new Date();
  var view = new Date(now.getFullYear(), now.getMonth(), 1);

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function monthKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function todayKey() { return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()); }
  function shortDate(k) {
    var p = k.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // ---------- data ----------
  function journal() {
    var s = I.getState();
    if (!s.journal) s.journal = { months: {}, remember: [], gratitude: [], prayers: [], entries: [] };
    ["remember", "gratitude", "prayers", "entries"].forEach(function (k) { s.journal[k] = s.journal[k] || []; });
    s.journal.months = s.journal.months || {};
    return s.journal;
  }
  // A new month starts with last month's habits and list titles (not the items).
  function month(key) {
    var j = journal();
    if (!j.months[key]) {
      var prev = Object.keys(j.months).sort().filter(function (k) { return k < key; }).pop();
      var p = prev ? j.months[prev] : null;
      j.months[key] = {
        habits: p ? p.habits.slice() : ["", "", ""],
        days: {},
        lists: p ? p.lists.map(function (l) { return { title: l.title, items: [] }; }) : [{ title: "Personal", items: [] }, { title: "School", items: [] }]
      };
    }
    return j.months[key];
  }
  function change(fn) { I.update(function () { fn(journal()); }); }
  var timers = {};
  function changeLater(key, fn) { // for typing: save after a short pause
    clearTimeout(timers[key]);
    timers[key] = setTimeout(function () { change(fn); }, 600);
  }

  // ---------- monthly log ----------
  var CYCLE = { "": "done", done: "miss", miss: "" };
  function renderMonth() {
    var key = monthKey(view);
    var m = month(key);
    var days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    var isNow = key === monthKey(now);
    $("month-name").textContent = view.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    $("actions-title").textContent = "Actions for " + view.toLocaleDateString(undefined, { month: "long" });
    $("next-month").disabled = isNow;

    // habit names
    m.habits.forEach(function (h, i) {
      var input = $("habit-" + i);
      input.value = h;
    });

    var log = $("log");
    log.innerHTML = "";
    var head = el("div", "jrow jhead");
    head.appendChild(el("span", "jday", "Day"));
    head.appendChild(el("span", "jhi-label", "Highlight"));
    m.habits.forEach(function (h, i) {
      var letter = el("span", "jletter", h ? h.trim().charAt(0).toUpperCase() : String(i + 1));
      letter.title = h || "Habit " + (i + 1);
      head.appendChild(letter);
    });
    log.appendChild(head);

    for (var d = 1; d <= days; d++) {
      var date = new Date(view.getFullYear(), view.getMonth(), d);
      var row = el("div", "jrow" + (isNow && d === now.getDate() ? " is-today" : "") + (isNow && d > now.getDate() ? " is-future" : ""));
      var label = el("span", "jday");
      label.appendChild(el("b", "", String(d)));
      label.appendChild(el("i", "", DOW[date.getDay()]));
      row.appendChild(label);
      var day = m.days[d] || {};
      var hi = el("input", "jhi");
      hi.type = "text";
      hi.maxLength = 120;
      hi.value = day.hi || "";
      hi.placeholder = isNow && d === now.getDate() ? "What made today memorable?" : "";
      hi.setAttribute("aria-label", date.toLocaleDateString(undefined, { month: "long", day: "numeric" }) + " highlight");
      (function (dd, input) {
        input.addEventListener("input", function () {
          changeLater("hi" + key + dd, function () {
            var mm = month(key);
            mm.days[dd] = mm.days[dd] || {};
            mm.days[dd].hi = input.value;
          });
        });
      })(d, hi);
      row.appendChild(hi);
      for (var h = 0; h < 3; h++) {
        var marks = day.h || [];
        var cell = el("button", "jh");
        cell.type = "button";
        cell.dataset.state = marks[h] || "";
        cell.setAttribute("aria-label", (m.habits[h] || "Habit " + (h + 1)) + ", day " + d + ": " + (marks[h] === "done" ? "done" : marks[h] === "miss" ? "missed" : "not marked"));
        (function (dd, hh, button) {
          button.addEventListener("click", function () {
            var next = CYCLE[button.dataset.state || ""];
            button.dataset.state = next;
            button.setAttribute("aria-label", (m.habits[hh] || "Habit " + (hh + 1)) + ", day " + dd + ": " + (next === "done" ? "done" : next === "miss" ? "missed" : "not marked"));
            change(function () {
              var mm = month(key);
              mm.days[dd] = mm.days[dd] || {};
              var arr = mm.days[dd].h || ["", "", ""];
              arr[hh] = next;
              mm.days[dd].h = arr;
            });
          });
        })(d, h, cell);
        row.appendChild(cell);
      }
      log.appendChild(row);
    }
    renderActions();
  }

  // ---------- this month's actions (two lists) ----------
  function renderActions() {
    var key = monthKey(view);
    var m = month(key);
    var box = $("actions");
    box.innerHTML = "";
    m.lists.forEach(function (list, li) {
      var col = el("div", "jlist");
      var title = el("input", "jlist-title");
      title.type = "text";
      title.maxLength = 30;
      title.value = list.title;
      title.setAttribute("aria-label", "List name");
      title.addEventListener("input", function () {
        changeLater("title" + key + li, function () { month(key).lists[li].title = title.value; });
      });
      col.appendChild(title);
      var ul = el("ul", "jitems");
      list.items.forEach(function (item) {
        ul.appendChild(itemRow(item, function () { return month(key).lists[li].items; }, renderActions));
      });
      col.appendChild(ul);
      col.appendChild(addForm("Add an action", function (text) {
        change(function () { month(key).lists[li].items.push({ id: uid(), t: text, done: false }); });
        renderActions();
      }));
      box.appendChild(col);
    });
  }

  // one row in any list: check it off, or remove it
  function itemRow(item, getList, rerender, extra) {
    var li = el("li", "jitem" + (item.done ? " is-done" : ""));
    var check = el("button", "jcheck");
    check.type = "button";
    check.setAttribute("aria-pressed", String(!!item.done));
    check.setAttribute("aria-label", (item.done ? "Mark not done: " : "Mark done: ") + item.t);
    check.addEventListener("click", function () {
      change(function () {
        var it = getList().filter(function (x) { return x.id === item.id; })[0];
        if (it) it.done = !it.done;
      });
      rerender();
    });
    li.appendChild(check);
    var text = el("span", "jitem-text", item.t);
    li.appendChild(text);
    if (extra) li.appendChild(extra);
    var rm = el("button", "jrm", "×");
    rm.type = "button";
    rm.setAttribute("aria-label", "Remove " + item.t);
    rm.addEventListener("click", function () {
      change(function () {
        var list = getList();
        var i = list.findIndex(function (x) { return x.id === item.id; });
        if (i !== -1) list.splice(i, 1);
      });
      rerender();
    });
    li.appendChild(rm);
    return li;
  }
  function addForm(placeholder, onAdd) {
    var f = el("form", "jadd");
    var input = el("input");
    input.type = "text";
    input.maxLength = 160;
    input.placeholder = placeholder;
    input.setAttribute("aria-label", placeholder);
    var b = el("button", "btn btn--ghost", "Add");
    b.type = "submit";
    f.appendChild(input);
    f.appendChild(b);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v) { input.focus(); return; }
      onAdd(v);
      var again = document.querySelector('[placeholder="' + placeholder + '"]');
      if (again) again.focus();
    });
    return f;
  }

  // ---------- Remember / Gratitude / Prayers ----------
  var PAGES = [
    { key: "remember", el: "page-remember", placeholder: "A truth or verse" },
    { key: "gratitude", el: "page-gratitude", placeholder: "I’m thankful for…" },
    { key: "prayers", el: "page-prayers", placeholder: "Pray for…" }
  ];
  function renderPages() {
    PAGES.forEach(function (p) {
      var box = $(p.el);
      box.innerHTML = "";
      var items = journal()[p.key];
      var ul = el("ul", "jitems");
      if (!items.length) ul.appendChild(el("li", "jempty", p.key === "prayers" ? "Write down prayers, then mark them answered when God answers." : "Nothing here yet."));
      items.forEach(function (item) {
        var extra = null;
        if (p.key === "prayers") {
          extra = el("span", "jmeta", item.done ? "Answered " + shortDate(item.answered || item.date) : "Since " + shortDate(item.date));
        }
        var row = itemRow(item, function () { return journal()[p.key]; }, renderPages, extra);
        if (p.key === "prayers") {
          row.querySelector(".jcheck").setAttribute("aria-label", (item.done ? "Mark not answered: " : "Mark answered: ") + item.t);
          row.querySelector(".jcheck").addEventListener("click", function () {
            change(function () {
              var it = journal().prayers.filter(function (x) { return x.id === item.id; })[0];
              if (it) it.answered = it.done ? todayKey() : null;
            });
            renderPages();
          });
        }
        ul.appendChild(row);
      });
      box.appendChild(ul);
      box.appendChild(addForm(p.placeholder, function (text) {
        change(function (j) { j[p.key].push({ id: uid(), t: text, date: todayKey(), done: false }); });
        renderPages();
      }));
    });
  }

  // ---------- entries ----------
  function renderEntries() {
    var list = $("entries");
    list.innerHTML = "";
    var items = journal().entries.slice().sort(function (a, b) { return (b.date + b.time).localeCompare(a.date + a.time); });
    if (!items.length) list.appendChild(el("p", "jempty", "No entries yet. Write when something’s on your mind: a sermon, a prayer, a decision you’re weighing."));
    items.forEach(function (e) {
      var card = el("article", "jentry");
      var meta = el("p", "jentry-meta");
      meta.appendChild(el("b", "", e.type));
      meta.appendChild(document.createTextNode(" · " + shortDate(e.date) + " · " + e.time));
      card.appendChild(meta);
      card.appendChild(el("p", "jentry-text", e.text));
      var rm = el("button", "link-btn", "Delete");
      rm.type = "button";
      rm.addEventListener("click", function () {
        if (!rm.classList.contains("armed")) { rm.classList.add("armed"); rm.textContent = "Tap again to delete"; return; }
        change(function (j) { j.entries = j.entries.filter(function (x) { return x.id !== e.id; }); });
        renderEntries();
      });
      card.appendChild(rm);
      list.appendChild(card);
    });
  }

  // ---------- wire up ----------
  [0, 1, 2].forEach(function (i) {
    $("habit-" + i).addEventListener("input", function (e) {
      var v = e.target.value;
      var key = monthKey(view);
      changeLater("habit" + key + i, function () { month(key).habits[i] = v; });
      var letter = document.querySelectorAll("#log .jhead .jletter")[i];
      if (letter) letter.textContent = v.trim() ? v.trim().charAt(0).toUpperCase() : String(i + 1);
    });
  });
  $("prev-month").addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderMonth(); });
  $("next-month").addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderMonth(); });

  $("entry-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var text = $("entry-text").value.trim();
    if (!text) { $("entry-text").focus(); return; }
    var t = new Date();
    change(function (j) {
      j.entries.push({ id: uid(), date: todayKey(), time: t.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }), type: $("entry-type").value, text: text });
    });
    $("entry-text").value = "";
    $("entry-status").textContent = "Saved.";
    renderEntries();
  });

  function renderAll() { renderMonth(); renderPages(); renderEntries(); }
  I.subscribe(renderAll); // e.g. after signing in, the account's journal loads
  renderAll();
})();
