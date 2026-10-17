/* Iron accounts and groups (Firebase). Does nothing until firebase-config.js
   has a config; see ACCOUNTS.md.

   Firestore layout:
     users/{uid}                  { name, state, groups: [code] }
     groups/{code}                { name, code, leaders: [uid], members: [uid] }
     groups/{code}/members/{uid}  { name, streak, week, today, total, lastCheckin, areas, date }
   Leaders read the members subcollection. Members only ever share those numbers,
   never their goals. */
(function () {
  "use strict";

  var L = window.Iron;
  var cfg = window.IRON_FIREBASE;
  var btn = document.getElementById("account-btn");
  var crew = document.getElementById("crew");
  var body = document.getElementById("crew-body");
  var note = document.getElementById("sync-note");
  if (!L || !cfg) return; // accounts not set up: everything stays on this device

  var SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
  var CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var auth, db, user = null, profile = null, userRef = null, unsub = null, pending = null;
  var groups = {}; // code -> group doc data

  crew.hidden = false;
  if (btn) btn.hidden = false;

  // ---------- helpers ----------
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function button(text, cls, onClick) {
    var b = el("button", cls || "btn", text);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }
  function stable(v) {
    if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
    if (v && typeof v === "object") return "{" + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ":" + stable(v[k]); }).join(",") + "}";
    return JSON.stringify(v);
  }
  function friendly(err) {
    var code = (err && err.code) || "";
    if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(code)) return "That email and password don’t match. Try again, or create an account.";
    if (/email-already-in-use/.test(code)) return "There’s already an account with that email. Tap Sign in instead.";
    if (/weak-password/.test(code)) return "Use a password with at least 6 characters.";
    if (/invalid-email/.test(code)) return "That email doesn’t look right.";
    if (/too-many-requests/.test(code)) return "Too many tries. Wait a minute and try again.";
    if (/network-request-failed|unavailable/.test(code)) return "No connection. Check your internet and try again.";
    if (/permission-denied/.test(code)) return "You don’t have permission to do that.";
    if (/popup-closed-by-user|cancelled-popup-request/.test(code)) return "";
    if (/unauthorized-domain/.test(code)) return "This website isn’t on the Firebase authorized domains list yet (see ACCOUNTS.md).";
    return "Something went wrong. Try again.";
  }
  function dayText(k) {
    if (!k) return "No check-ins yet";
    var today = L.summary().date;
    var diff = Math.round((new Date(today + "T12:00") - new Date(k + "T12:00")) / 864e5);
    if (diff <= 0) return "Checked in today";
    if (diff === 1) return "Last check-in yesterday";
    return "Last check-in " + diff + " days ago";
  }
  function daysSince(k) {
    if (!k) return 99;
    return Math.round((new Date(L.summary().date + "T12:00") - new Date(k + "T12:00")) / 864e5);
  }

  // ---------- sign-in window ----------
  var dlg = el("dialog", "account-dialog");
  dlg.setAttribute("aria-label", "Your Iron account");
  dlg.innerHTML =
    '<div class="acct-out">' +
      '<p class="eyebrow">Your account</p>' +
      '<h3 class="acct-title">Sign in to Iron</h3>' +
      '<p>Save your goals and check-ins to your account and join your connection group.</p>' +
      '<button class="btn acct-google" type="button">Continue with Google</button>' +
      '<p class="acct-or">or use email</p>' +
      '<form class="acct-form">' +
        '<label for="acct-email">Email</label>' +
        '<input id="acct-email" type="email" autocomplete="email" required>' +
        '<label for="acct-pass">Password</label>' +
        '<input id="acct-pass" type="password" autocomplete="current-password" minlength="6" required>' +
        '<div class="btn-row">' +
          '<button class="btn" type="submit" value="signin">Sign in</button>' +
          '<button class="btn btn--ghost" type="submit" value="signup">Create account</button>' +
        '</div>' +
        '<button class="link-btn acct-forgot" type="button">Forgot password?</button>' +
      '</form>' +
    '</div>' +
    '<div class="acct-in" hidden>' +
      '<p class="eyebrow">Your account</p>' +
      '<h3 class="acct-title">You’re signed in.</h3>' +
      '<p>Signed in as <b class="acct-who"></b>. Your goals and check-ins save to your account automatically.</p>' +
      '<button class="btn acct-signout" type="button">Sign out</button>' +
      '<p class="hint">Signing out removes Iron from this device. Everything stays in your account.</p>' +
    '</div>' +
    '<p class="acct-msg" role="status"></p>' +
    '<button class="acct-close" type="button" aria-label="Close">×</button>';
  document.body.appendChild(dlg);
  var $ = function (sel) { return dlg.querySelector(sel); };
  var msg = $(".acct-msg");
  function openDialog() { msg.textContent = ""; if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); }
  function closeDialog() { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); }
  $(".acct-close").addEventListener("click", closeDialog);
  if (btn) btn.addEventListener("click", openDialog);

  // ---------- syncing your tracker ----------
  function untouched(s) {
    var logged = Object.keys(s.log).some(function (k) { return s.log[k].length; });
    return !logged && stable(s.goals) === stable(L.fresh().goals);
  }
  function merge(cloud, local) {
    if (untouched(local)) return cloud;
    var goals = cloud.goals.slice();
    local.goals.forEach(function (g) { if (!goals.some(function (c) { return c.id === g.id; })) goals.push(g); });
    var log = {};
    [cloud.log, local.log].forEach(function (src) {
      Object.keys(src).forEach(function (k) {
        var have = log[k] || [];
        log[k] = have.concat(src[k].filter(function (id) { return have.indexOf(id) === -1; }));
      });
    });
    return { goals: goals, log: log, created: cloud.created < local.created ? cloud.created : local.created, welcomed: true };
  }
  function memberSummary() {
    var s = L.summary();
    return {
      name: (profile && profile.name) || "",
      streak: s.streak, best: s.best, week: s.week,
      today: s.today, total: s.total,
      lastCheckin: s.lastCheckin, areas: s.areas, date: s.date,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
  }
  function write() {
    if (!userRef) return Promise.resolve();
    var state = JSON.parse(JSON.stringify(L.getState()));
    var jobs = [userRef.set({ state: state, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true })];
    ((profile && profile.groups) || []).forEach(function (code) {
      jobs.push(db.collection("groups").doc(code).collection("members").doc(user.uid).set(memberSummary()));
    });
    return Promise.all(jobs).catch(function () {
      if (note) note.textContent = "Couldn’t save to your account just now. Your check-ins are still saved on this device.";
    });
  }
  function queueWrite() {
    clearTimeout(pending);
    pending = setTimeout(function () { pending = null; write(); }, 700);
  }
  function setNote() {
    if (!note) return;
    note.textContent = user
      ? "Saved to your account (" + (user.email || "signed in") + "). Sign in on any device to pick up where you left off."
      : "Your goals and check-ins are saved on this device only. Sign in to save them to your account, or move them with a backup code.";
  }

  function connect(u) {
    user = u;
    userRef = db.collection("users").doc(u.uid);
    $(".acct-out").hidden = true;
    $(".acct-in").hidden = false;
    $(".acct-who").textContent = u.email || "your account";
    if (btn) { btn.textContent = "Account"; btn.classList.add("signed-in"); }
    setNote();
    renderCrew("loading");
    userRef.get().then(function (snap) {
      var data = snap.exists ? snap.data() : {};
      profile = { name: data.name || u.displayName || "", groups: data.groups || [] };
      var local = L.getState();
      var next = data.state && L.valid(data.state) ? merge(data.state, local) : local;
      next.welcomed = true;
      L.setState(next);
      L.onSave = queueWrite;
      return userRef.set({ name: profile.name, groups: profile.groups }, { merge: true }).then(write);
    }).then(function () {
      unsub = userRef.onSnapshot(function (s) {
        // another device changed something; skip our own echoes and anything older than a pending edit
        if (!s.exists || s.metadata.hasPendingWrites || pending) return;
        var remote = s.data().state;
        if (remote && L.valid(remote) && stable(remote) !== stable(L.getState())) L.setState(remote);
      });
      return loadGroups();
    }).catch(function (err) {
      renderCrew("error", friendly(err));
    });
  }

  function disconnect() {
    if (unsub) unsub();
    unsub = null; user = null; profile = null; userRef = null; groups = {};
    clearTimeout(pending); pending = null;
    L.onSave = null;
    $(".acct-out").hidden = false;
    $(".acct-in").hidden = true;
    if (btn) { btn.textContent = "Sign in"; btn.classList.remove("signed-in"); }
    setNote();
    renderCrew();
  }

  // ---------- groups ----------
  function loadGroups() {
    var codes = (profile && profile.groups) || [];
    groups = {};
    return Promise.all(codes.map(function (code) {
      return db.collection("groups").doc(code).get().then(function (snap) {
        if (snap.exists && (snap.data().members || []).indexOf(user.uid) !== -1) groups[code] = snap.data();
      });
    })).then(function () {
      var kept = Object.keys(groups);
      if (kept.length !== codes.length) {
        profile.groups = kept;
        return userRef.set({ groups: kept }, { merge: true });
      }
    }).then(function () { renderCrew(); });
  }
  function newCode() {
    var c = "";
    for (var i = 0; i < 6; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    return c;
  }
  function addMyGroup(code) {
    if (profile.groups.indexOf(code) === -1) profile.groups.push(code);
    return userRef.set({ groups: profile.groups }, { merge: true })
      .then(function () { return db.collection("groups").doc(code).collection("members").doc(user.uid).set(memberSummary()); });
  }
  function createGroup(name, status) {
    var tries = 0;
    var attempt = function () {
      var code = newCode();
      var ref = db.collection("groups").doc(code);
      return ref.get().then(function (snap) {
        if (snap.exists) { if (++tries > 5) throw new Error("no code"); return attempt(); }
        return ref.set({ name: name, code: code, leaders: [user.uid], members: [user.uid], createdAt: firebase.firestore.FieldValue.serverTimestamp() })
          .then(function () { return addMyGroup(code); });
      });
    };
    status.textContent = "Creating your group…";
    return attempt().then(loadGroups).catch(function (err) { status.textContent = friendly(err); });
  }
  function joinGroup(code, status) {
    code = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length !== 6) { status.textContent = "Group codes are 6 letters and numbers."; return; }
    var ref = db.collection("groups").doc(code);
    status.textContent = "Joining…";
    return ref.get().then(function (snap) {
      if (!snap.exists) { status.textContent = "No group with that code. Double-check it with your leader."; return; }
      return ref.update({ members: firebase.firestore.FieldValue.arrayUnion(user.uid) })
        .then(function () { return addMyGroup(code); })
        .then(loadGroups);
    }).catch(function (err) { status.textContent = friendly(err); });
  }
  function leaveGroup(code, status) {
    var g = groups[code];
    var leader = g.leaders.indexOf(user.uid) !== -1;
    if (leader && g.leaders.length === 1 && g.members.length > 1) {
      status.textContent = "You’re the only leader. Make someone else a leader before you leave.";
      return;
    }
    var ref = db.collection("groups").doc(code);
    var change = { members: firebase.firestore.FieldValue.arrayRemove(user.uid) };
    if (leader) change.leaders = firebase.firestore.FieldValue.arrayRemove(user.uid);
    return ref.collection("members").doc(user.uid).delete()
      .then(function () { return ref.update(change); })
      .then(function () {
        profile.groups = profile.groups.filter(function (c) { return c !== code; });
        return userRef.set({ groups: profile.groups }, { merge: true });
      })
      .then(loadGroups)
      .catch(function (err) { status.textContent = friendly(err); });
  }
  function makeLeader(code, uid, status) {
    return db.collection("groups").doc(code).update({ leaders: firebase.firestore.FieldValue.arrayUnion(uid) })
      .then(loadGroups).catch(function (err) { status.textContent = friendly(err); });
  }
  function removeMember(code, uid, status) {
    var ref = db.collection("groups").doc(code);
    return ref.collection("members").doc(uid).delete()
      .then(function () { return ref.update({ members: firebase.firestore.FieldValue.arrayRemove(uid), leaders: firebase.firestore.FieldValue.arrayRemove(uid) }); })
      .then(loadGroups).catch(function (err) { status.textContent = friendly(err); });
  }

  // ---------- the "Your group" section ----------
  function renderCrew(mode, errText) {
    body.innerHTML = "";
    if (mode === "loading") { body.appendChild(el("p", "hint", "Loading your group…")); return; }
    if (mode === "error") { body.appendChild(el("p", "status", errText || "Couldn’t load your group.")); return; }

    if (!user) {
      body.appendChild(el("p", "", "Sign in to join your connection group. Your leaders see your streak and how much of your list you finish each day, never what your goals are."));
      body.appendChild(button("Sign in", "btn", openDialog));
      return;
    }

    // name first: it's what the group sees
    var nameForm = el("form", "crew-form");
    nameForm.innerHTML = '<label for="crew-name">Your name <span>what your group sees</span></label><div class="add-row"><input id="crew-name" type="text" maxlength="40" autocomplete="name"><button class="btn btn--ghost" type="submit">Save</button></div>';
    nameForm.querySelector("input").value = profile.name;
    nameForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = nameForm.querySelector("input").value.trim();
      if (!v) return;
      profile.name = v;
      userRef.set({ name: v }, { merge: true }).then(write).then(function () { renderCrew(); });
    });

    var codes = Object.keys(groups);
    if (!profile.name) {
      body.appendChild(el("p", "", "First, add your name so your group knows who you are."));
      body.appendChild(nameForm);
      return;
    }

    codes.forEach(function (code) { body.appendChild(groupCard(code)); });

    // join or start (always available, so a leader can also be in another group)
    var more = el("div", "crew-actions");
    var join = el("form", "crew-form");
    join.innerHTML = '<label for="join-code">' + (codes.length ? "Join another group" : "Join your group") + ' <span>ask your leader for the code</span></label><div class="add-row"><input id="join-code" type="text" maxlength="8" placeholder="ABC123" autocapitalize="characters" autocomplete="off"><button class="btn" type="submit">Join</button></div><p class="status" role="status"></p>';
    join.addEventListener("submit", function (e) {
      e.preventDefault();
      joinGroup(join.querySelector("input").value, join.querySelector(".status"));
    });
    var start = el("form", "crew-form");
    start.innerHTML = '<label for="new-group">Leading a group? <span>start one and share the code</span></label><div class="add-row"><input id="new-group" type="text" maxlength="40" placeholder="e.g. Tuesday night guys"><button class="btn btn--ghost" type="submit">Start group</button></div><p class="status" role="status"></p>';
    start.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = start.querySelector("input").value.trim();
      if (!v) { start.querySelector("input").focus(); return; }
      createGroup(v, start.querySelector(".status"));
    });
    more.appendChild(join);
    more.appendChild(start);
    body.appendChild(more);

    var details = el("details", "crew-name-edit");
    details.appendChild(el("summary", "", "Change my name (" + profile.name + ")"));
    details.appendChild(nameForm);
    body.appendChild(details);
  }

  function groupCard(code) {
    var g = groups[code];
    var leader = g.leaders.indexOf(user.uid) !== -1;
    var card = el("div", "crew-card");
    var head = el("div", "crew-head");
    var title = el("div");
    title.appendChild(el("h3", "crew-title", g.name));
    title.appendChild(el("p", "hint", (leader ? "You’re a leader · " : "") + g.members.length + (g.members.length === 1 ? " person" : " people")));
    head.appendChild(title);
    var codeBox = el("div", "crew-code");
    codeBox.appendChild(el("span", "eyebrow", "Group code"));
    codeBox.appendChild(el("b", "", code));
    head.appendChild(codeBox);
    card.appendChild(head);
    var status = el("p", "status");
    status.setAttribute("role", "status");

    var actions = el("div", "btn-row");
    actions.appendChild(button("Copy invite", "btn btn--ghost", function () {
      var text = "Join " + g.name + " on Iron: " + location.href.split("#")[0] + " (group code " + code + ")";
      try { navigator.clipboard.writeText(text).then(function () { status.textContent = "Invite copied. Paste it in your group chat."; }, function () { status.textContent = text; }); }
      catch (e) { status.textContent = text; }
    }));

    if (leader) {
      var list = el("div", "crew-members");
      list.appendChild(el("p", "hint", "Loading your guys…"));
      card.appendChild(list);
      actions.appendChild(button("Refresh", "btn btn--ghost", function () { loadMembers(code, list, status); }));
      loadMembers(code, list, status);
    } else {
      card.appendChild(el("p", "", "Your leaders can see your streak, how much of your list you finish each day and how each area is going. They can’t see your goals."));
    }
    actions.appendChild(button("Leave group", "link-btn", function () { leaveGroup(code, status); }));
    card.appendChild(actions);
    card.appendChild(status);
    return card;
  }

  function loadMembers(code, list, status) {
    var g = groups[code];
    db.collection("groups").doc(code).collection("members").get().then(function (qs) {
      var rows = [];
      qs.forEach(function (d) { rows.push({ uid: d.id, data: d.data() }); });
      rows = rows.filter(function (r) { return g.members.indexOf(r.uid) !== -1; });
      rows.sort(function (a, b) { return (a.data.name || "").localeCompare(b.data.name || ""); });
      list.innerHTML = "";
      if (!rows.length) { list.appendChild(el("p", "hint", "Nobody here yet. Share the code.")); return; }
      var today = L.summary().date;
      rows.forEach(function (r) {
        var m = r.data;
        var isLeader = g.leaders.indexOf(r.uid) !== -1;
        var current = m.date === today;
        var quiet = daysSince(m.lastCheckin) >= 3;
        var row = el("div", "member" + (quiet ? " is-quiet" : ""));
        var top = el("div", "member-top");
        var who = el("div", "member-who");
        who.appendChild(el("b", "", (m.name || "Unnamed") + (r.uid === user.uid ? " (you)" : "")));
        if (isLeader) who.appendChild(el("span", "badge", "Leader"));
        top.appendChild(who);
        top.appendChild(el("span", "member-last", dayText(m.lastCheckin)));
        row.appendChild(top);
        var stats = el("div", "member-stats");
        [["Today", current ? (m.today || 0) + "/" + (m.total || 0) : "0/" + (m.total || 0)], ["Streak", String(m.streak || 0)], ["Last 7 days", (m.week || 0) + "%"]]
          .forEach(function (s) {
            var d = el("div");
            d.appendChild(el("b", "", s[1]));
            d.appendChild(el("span", "", s[0]));
            stats.appendChild(d);
          });
        row.appendChild(stats);
        var bars = el("div", "member-bars");
        window.AREAS.forEach(function (a) {
          var v = m.areas ? m.areas[a.id] : null;
          var b = el("div", "mbar area-" + a.id);
          b.title = a.name + ": " + (v == null ? "no goals" : v + "% this week");
          b.appendChild(el("span", "mbar-name", a.name.charAt(0)));
          var track = el("span", "mbar-track");
          var fill = el("span");
          fill.style.width = (v || 0) + "%";
          track.appendChild(fill);
          b.appendChild(track);
          bars.appendChild(b);
        });
        row.appendChild(bars);
        if (r.uid !== user.uid) {
          var ctl = el("div", "member-ctl");
          if (!isLeader) ctl.appendChild(button("Make leader", "link-btn", function () { makeLeader(code, r.uid, status); }));
          ctl.appendChild(button("Remove", "link-btn", function (e) {
            var t = e.currentTarget;
            if (!t.classList.contains("armed")) { t.classList.add("armed"); t.textContent = "Tap again to remove"; return; }
            removeMember(code, r.uid, status);
          }));
          row.appendChild(ctl);
        }
        list.appendChild(row);
      });
    }).catch(function (err) { list.innerHTML = ""; status.textContent = friendly(err); });
  }

  // ---------- buttons in the sign-in window ----------
  $(".acct-google").addEventListener("click", function () {
    msg.textContent = "";
    var provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(closeDialog).catch(function (err) {
      if (err && err.code === "auth/popup-blocked") return auth.signInWithRedirect(provider);
      msg.textContent = friendly(err);
    });
  });
  var lastSubmit = "signin";
  dlg.querySelectorAll('.acct-form [type="submit"]').forEach(function (b) {
    b.addEventListener("click", function () { lastSubmit = b.value; });
  });
  $(".acct-form").addEventListener("submit", function (e) {
    e.preventDefault();
    msg.textContent = "";
    var email = $("#acct-email").value.trim();
    var pass = $("#acct-pass").value;
    var go = lastSubmit === "signup" ? auth.createUserWithEmailAndPassword(email, pass) : auth.signInWithEmailAndPassword(email, pass);
    go.then(function () { $("#acct-pass").value = ""; closeDialog(); }).catch(function (err) { msg.textContent = friendly(err); });
  });
  $(".acct-forgot").addEventListener("click", function () {
    var email = $("#acct-email").value.trim();
    if (!email) { msg.textContent = "Type your email above first, then tap Forgot password."; return; }
    auth.sendPasswordResetEmail(email)
      .then(function () { msg.textContent = "Check your email for a link to reset your password."; })
      .catch(function (err) { msg.textContent = friendly(err); });
  });
  $(".acct-signout").addEventListener("click", function () {
    auth.signOut().then(function () {
      L.setState(L.fresh()); // shared computers: don't leave someone's goals behind
      msg.textContent = "Signed out. Your check-ins are saved in your account.";
    });
  });

  // ---------- load Firebase, then start ----------
  function load(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = SDK + src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  setNote();
  renderCrew("loading");
  load("firebase-app-compat.js")
    .then(function () { return Promise.all([load("firebase-auth-compat.js"), load("firebase-firestore-compat.js")]); })
    .then(function () {
      firebase.initializeApp(cfg);
      auth = firebase.auth();
      db = firebase.firestore();
      auth.onAuthStateChanged(function (u) { if (u) connect(u); else disconnect(); });
    })
    .catch(function () {
      if (btn) btn.hidden = true;
      crew.hidden = true;
      if (note) note.textContent = "Saved on this device only. Accounts couldn’t load right now.";
    });
})();
