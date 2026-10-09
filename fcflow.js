/* =========================================================
   FOOD CONNECT — shared NGO → Donor → Volunteer flow store
   NGO posts a request (food name, type, date, time)
   → donors see it on their home page and accept it
   → volunteers free on that day pick it up from the donor
     address and deliver it to the NGO.
========================================================= */
var FC = (function () {
    function load(k) { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch (e) { return []; } }
    function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
    function me() { try { return JSON.parse(localStorage.getItem("rescueUser") || "null") || {}; } catch (e) { return {}; } }

    function notify(to, text) {
        var m = load("fcMessages"); m.unshift({ to: to, text: text, time: new Date().toISOString() });
        save("fcMessages", m.slice(0, 40));
    }
    function addRequest(r) {
        var list = load("fcRequests");
        r.id = "req-" + Date.now(); r.status = "open"; r.createdAt = new Date().toISOString();
        list.unshift(r); save("fcRequests", list);
        notify("donor", "🏛️ " + r.ngoName + " needs " + r.foodName + " on " + fmtDate(r.date) + " at " + r.time + ".");
        notify("ngo", "📨 Your request for " + r.foodName + " was sent to donors.");
        return r;
    }
    function getRequest(id) { return load("fcRequests").filter(function (r) { return r.id === id; })[0]; }
    function updateRequest(id, patch) {
        var list = load("fcRequests");
        list.forEach(function (r) { if (r.id === id) Object.assign(r, patch); });
        save("fcRequests", list);
    }
    function fmtDate(d) {
        var x = new Date(d + "T00:00:00");
        return isNaN(x) ? d : x.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
    }
    /* is the volunteer free on that date/time? */
    function volunteerFree(av, date, time) {
        var t = (Array.isArray(av) ? av.join(",") : av || "").toLowerCase();
        if (!t || t.indexOf("any") > -1) return true;
        var d = new Date(date + "T00:00:00"); if (isNaN(d)) return true;
        var day = d.getDay(), names = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        return t.indexOf(names[day]) > -1 ||
            (t.indexOf("weekday") > -1 && day >= 1 && day <= 5) ||
            (t.indexOf("weekend") > -1 && (day === 0 || day === 6)) ||
            (t.indexOf("evening") > -1 && (time || "12:00") >= "17:00");
    }
    function volunteerProfile() { try { return JSON.parse(localStorage.getItem("volunteerProfile") || "null"); } catch (e) { return null; } }

    /* ---------- role panel on the home page ---------- */
    function homePanel(role) {
        var host = document.getElementById("roleHomeGrid"); if (!host) return;
        var reqs = load("fcRequests"), msgs = load("fcMessages").filter(function (m) { return m.to === role; }).slice(0, 3);
        var html = "", title = "", body = "";
        function card(inner) { return '<div class="fc-flow-item">' + inner + "</div>"; }

        if (role === "donor") {
            title = "🏛️ NGOs need food";
            var open = reqs.filter(function (r) { return r.status === "open"; });
            body = open.map(function (r) {
                return card("<b>" + r.ngoName + "</b> wants <b>" + r.foodName + "</b> (" + r.category + ", " + r.quantity + ")" +
                    "<br><small>📅 " + fmtDate(r.date) + " · ⏰ " + r.time + "</small>" +
                    '<a class="fc-flow-btn" href="05-donate.html?request=' + r.id + '">Accept &amp; Donate →</a>');
            }).join("") || card("No NGO requests right now. Check back soon!");
        } else if (role === "volunteer") {
            title = "🚗 Pickups on your free days";
            var vp = volunteerProfile() || {};
            var dons = load("rescueDonations").filter(function (d) {
                return d.status === "pending" && d.ngoName && volunteerFree(vp.availability, d.wantedDate, d.wantedTime);
            });
            body = dons.map(function (d) {
                return card("<b>" + d.foodType + "</b> · " + d.quantity + " · 📅 " + fmtDate(d.wantedDate) + " " + d.wantedTime +
                    "<br><small>📍 " + d.address + " → 🏛️ " + d.ngoName + "</small>");
            }).join("") + (dons.length ? '<a class="fc-flow-btn" href="10-request-pickup.html">Open pickups →</a>' : card("No pickups match your free days yet."));
        } else if (role === "ngo") {
            title = "📋 Your requests";
            var name = (me().name || "");
            body = reqs.slice(0, 4).map(function (r) {
                var st = { open: "⏳ Waiting for donor", accepted: "🥗 Donor accepted", picked: "🚗 Volunteer on the way", delivered: "✅ Delivered" }[r.status] || r.status;
                return card("<b>" + r.foodName + "</b> · " + fmtDate(r.date) + " " + r.time + "<br><small>" + st + "</small>");
            }).join("") || card("You haven't made a request yet.");
        } else return;

        if (msgs.length) body = '<div class="fc-flow-msgs">' + msgs.map(function (m) { return "<div>" + m.text + "</div>"; }).join("") + "</div>" + body;
        var sec = document.createElement("div");
        sec.className = "fc-flow";
        sec.innerHTML = '<div class="section-head"><h3>' + title + "</h3></div>" + body;
        host.parentNode.insertBefore(sec, host.nextSibling);
    }

    return { load: load, save: save, notify: notify, addRequest: addRequest, getRequest: getRequest,
             updateRequest: updateRequest, fmtDate: fmtDate, volunteerFree: volunteerFree,
             volunteerProfile: volunteerProfile, homePanel: homePanel, me: me };
})();
