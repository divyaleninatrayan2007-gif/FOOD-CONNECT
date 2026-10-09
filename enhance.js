/* =========================================================
   FOOD CONNECT — enhance.js
   1. staggered reveal animations
   2. smooth page transitions
   3. fills pages that have empty space with a live impact panel
========================================================= */
(function () {
    function ready(fn) {
        if (document.readyState !== "loading") setTimeout(fn, 60);
        else document.addEventListener("DOMContentLoaded", function () { setTimeout(fn, 60); });
    }

    var TIPS = [
        "🍞 One rescued meal can feed a family tonight.",
        "🚗 Volunteers deliver surplus food in under 30 minutes.",
        "🌍 Saving food also saves water, energy and land.",
        "🤝 NGOs on Food Connect get matched to food automatically.",
        "♻️ A third of all food is wasted — together we can change that."
    ];

    function countUp(el, to) {
        var n = 0, step = Math.max(1, Math.ceil(to / 40));
        var t = setInterval(function () {
            n = Math.min(to, n + step);
            el.textContent = n.toLocaleString();
            if (n >= to) clearInterval(t);
        }, 30);
    }

    function fillSpace(content) {
        if (!content || content.querySelector(".fc-fill") || content.closest(".phone") === null) return;
        var free = content.clientHeight - content.scrollHeight;
        if (free < 140) return; // page already full

        var donations = JSON.parse(localStorage.getItem("rescueDonations") || "[]");
        var meals = 1240 + donations.length * 12;
        var panel = document.createElement("div");
        panel.className = "fc-fill fc-reveal";
        panel.innerHTML =
            '<span class="fc-float" style="left:8%;top:8%">🥕</span>' +
            '<span class="fc-float" style="right:10%;top:12%;animation-delay:-1.5s">🍎</span>' +
            '<span class="fc-float" style="right:6%;bottom:10%;animation-delay:-3s">🥖</span>' +
            '<h4>🌱 Food Connect Impact</h4>' +
            '<div class="fc-stats">' +
            '<div class="fc-stat"><b data-n="' + meals + '">0</b><small>Meals saved</small></div>' +
            '<div class="fc-stat"><b data-n="86">0</b><small>NGOs</small></div>' +
            '<div class="fc-stat"><b data-n="312">0</b><small>Volunteers</small></div>' +
            '</div><div class="fc-tip" id="fcTip">' + TIPS[0] + '</div>';
        content.appendChild(panel);
        panel.querySelectorAll("b[data-n]").forEach(function (b) { countUp(b, +b.dataset.n); });

        var i = 0, tip = panel.querySelector("#fcTip");
        setInterval(function () {
            i = (i + 1) % TIPS.length;
            tip.style.animation = "none"; void tip.offsetWidth; tip.style.animation = "";
            tip.textContent = TIPS[i];
        }, 3500);
        observe(panel, 0);
    }

    var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("fc-in"); io.unobserve(e.target); } });
    }, { threshold: .05 }) : null;

    function observe(el, delay) {
        el.style.setProperty("--fc-d", delay + "s");
        if (io) io.observe(el); else el.classList.add("fc-in");
    }

    ready(function () {
        var content = document.querySelector(".phone .content") || document.querySelector(".phone .screen > div");
        if (content) {
            Array.prototype.slice.call(content.children).forEach(function (el, i) {
                if (el.classList.contains("bottom-nav")) return;
                el.classList.add("fc-reveal");
                observe(el, Math.min(i * 0.07, 0.6));
            });
            fillSpace(content);
        }

        // smooth page-to-page transitions
        document.addEventListener("click", function (e) {
            var a = e.target.closest && e.target.closest("a[href]");
            if (!a || a.target === "_blank" || /^(#|mailto:|tel:|javascript:|https?:)/.test(a.getAttribute("href"))) return;
            e.preventDefault();
            document.body.classList.add("fc-leaving");
            setTimeout(function () { window.location.href = a.href; }, 240);
        });
    });
})();
