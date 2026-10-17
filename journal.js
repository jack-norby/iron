/* This month's actions (four lists) and the prayer and thanks lists, on the main page.
   Stored in the same saved data as the tracker (state.journal), so it syncs to
   your account. It is never shared with group leaders. */
(function () {
  "use strict";

  var I = window.Iron;
  if (!I) return;
  var $ = function (id) { return document.getElementById(id); };
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
  // A new month starts with last month's list names (not the items). Every month has four lists.
  // Months saved by the first version may also hold daily highlights; they're left alone.
  var DEFAULT_LISTS = ["Personal", "School", "Work", "Spiritual"];
  function month(key) {
    var j = journal();
    if (!j.months[key]) {
      var prev = Object.keys(j.months).sort().filter(function (k) { return k < key; }).pop();
      j.months[key] = { lists: prev ? j.months[prev].lists.map(function (l) { return { title: l.title, items: [] }; }) : [] };
    }
    var m = j.months[key];
    m.lists = m.lists || [];
    DEFAULT_LISTS.forEach(function (name) {
      if (m.lists.length >= 4) return;
      if (!m.lists.some(function (l) { return l.title.trim().toLowerCase() === name.toLowerCase(); })) m.lists.push({ title: name, items: [] });
    });
    return m;
  }
  function change(fn) { I.update(function () { fn(journal()); }); }
  var timers = {};
  function changeLater(key, fn) { // for typing: save after a short pause
    clearTimeout(timers[key]);
    timers[key] = setTimeout(function () { change(fn); }, 600);
  }

  // ---------- which month ----------
  function renderMonth() {
    var isNow = monthKey(view) === monthKey(now);
    $("plan-title").textContent = view.toLocaleDateString(undefined, isNow ? { month: "long" } : { month: "long", year: "numeric" });
    $("plan-next").disabled = isNow;
    renderActions();
  }

  // ---------- this month's actions (four lists) ----------
  function renderActions() {
    var key = monthKey(view);
    var m = month(key);
    var box = $("actions");
    box.innerHTML = "";
    m.lists.forEach(function (list, li) {
      var col = el("div", "jlist");
      var head = el("label", "jlist-head");
      var title = el("input", "jlist-title");
      title.type = "text";
      title.maxLength = 24;
      title.value = list.title;
      title.placeholder = "Name this list";
      title.setAttribute("aria-label", "List " + (li + 1) + " name");
      title.addEventListener("input", function () {
        changeLater("title" + key + li, function () { month(key).lists[li].title = title.value; });
      });
      head.appendChild(title);
      head.appendChild(el("span", "jlist-count", list.items.length ? list.items.filter(function (x) { return x.done; }).length + "/" + list.items.length : "Rename"));
      col.appendChild(head);
      var ul = el("ul", "jitems");
      list.items.forEach(function (item) {
        ul.appendChild(itemRow(item, function () { return month(key).lists[li].items; }, renderActions));
      });
      col.appendChild(ul);
      col.appendChild(addForm("Add to " + (list.title.trim() || "list " + (li + 1)), function (text) {
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

  // ---------- prayers and thanks ----------
  // (The first version also had a Remember list and free-form entries. They stay saved but aren't shown.)
  var PAGES = [
    { key: "prayers", el: "page-prayers", placeholder: "Pray for…" },
    { key: "gratitude", el: "page-gratitude", placeholder: "I’m thankful for…" }
  ];
  function renderPages() {
    PAGES.forEach(function (p) {
      var box = $(p.el);
      box.innerHTML = "";
      var items = journal()[p.key];
      var ul = el("ul", "jitems");
      if (!items.length) ul.appendChild(el("li", "jempty", p.key === "prayers" ? "Write down who and what you’re praying for. Check it off when God answers." : "Small things count."));
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

  // ---------- wire up ----------
  $("plan-prev").addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderMonth(); });
  $("plan-next").addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderMonth(); });

  function renderAll() { renderMonth(); renderPages(); }
  I.subscribe(renderAll); // e.g. after signing in, the account's lists load
  renderAll();
})();
