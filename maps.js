/* =========================================================
   FOOD CONNECT — Google Maps live volunteer tracking
========================================================= */
var FCTracker = (function () {
    var state = { pos: null, map: null, marker: null, dirSvc: null, dirRen: null, lastRoute: 0, lastFrame: 0 };

    function dirLink(o, d) {
        return "https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=" + encodeURIComponent(d) +
            (o ? "&origin=" + encodeURIComponent(o) : "");
    }

    function setText(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }

    /* ---------- keyless fallback: Google Maps embed with route ---------- */
    function frameMode(box, origin, dest) {
        function draw() {
            var o = state.pos ? state.pos.lat + "," + state.pos.lng : origin;
            var src = "https://maps.google.com/maps?output=embed&saddr=" + encodeURIComponent(o || dest) +
                "&daddr=" + encodeURIComponent(dest);
            if (!box.firstChild || box.dataset.src !== src) {
                box.dataset.src = src;
                box.innerHTML = '<iframe loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade" src="' + src + '"></iframe>';
            }
        }
        draw();
        setInterval(function () { if (Date.now() - state.lastFrame > 20000) { state.lastFrame = Date.now(); draw(); } }, 5000);
        setText("fcEta", "Live"); setText("fcDist", "Route");
    }

    /* ---------- full Google Maps JS API mode ---------- */
    function apiMode(box, origin, dest) {
        state.map = new google.maps.Map(box, { zoom: 14, center: { lat: 20.5937, lng: 78.9629 }, disableDefaultUI: true, zoomControl: true });
        state.dirSvc = new google.maps.DirectionsService();
        state.dirRen = new google.maps.DirectionsRenderer({ map: state.map, polylineOptions: { strokeColor: "#2e7d32", strokeWeight: 6 } });
        state.marker = new google.maps.Marker({
            map: state.map, title: "Volunteer", zIndex: 9,
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: "#e53935", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 }
        });
        var path = [], step = 0;

        function route(force) {
            if (!force && Date.now() - state.lastRoute < 15000) return;
            state.lastRoute = Date.now();
            var o = state.pos ? new google.maps.LatLng(state.pos.lat, state.pos.lng) : origin || dest;
            state.dirSvc.route({ origin: o, destination: dest, travelMode: "DRIVING" }, function (res, status) {
                if (status !== "OK") { setText("fcEta", "—"); return; }
                state.dirRen.setDirections(res);
                var leg = res.routes[0].legs[0];
                setText("fcEta", leg.duration.text); setText("fcDist", leg.distance.text);
                setText("trackMapChip", "🚗 " + leg.duration.text + " to pickup");
                path = res.routes[0].overview_path; step = 0;
                if (!state.pos && path.length) state.marker.setPosition(path[0]);
            });
        }
        route(true);

        /* if GPS is unavailable, animate along the route so tracking is still visible */
        setInterval(function () {
            if (state.pos || !path.length) return;
            step = Math.min(step + 1, path.length - 1);
            state.marker.setPosition(path[step]);
        }, 1500);

        FCTracker.onPosition = function (p) {
            state.marker.setPosition(p); state.map.panTo(p); route(false);
        };
    }

    function init(cfg) {
        var box = document.getElementById(cfg.container);
        var origin = cfg.origin, dest = cfg.destination;
        var a = document.getElementById("fcOpenMaps");
        if (a) a.href = dirLink(origin, dest);

        /* live GPS from the volunteer's device */
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(function (p) {
                state.pos = { lat: p.coords.latitude, lng: p.coords.longitude };
                if (FCTracker.onPosition) FCTracker.onPosition(state.pos);
                if (a) a.href = dirLink(state.pos.lat + "," + state.pos.lng, dest);
                setText("fcGps", "GPS live");
            }, function () { setText("fcGps", "GPS off"); }, { enableHighAccuracy: true, maximumAge: 5000 });
        }

        var key = window.FC_GOOGLE_MAPS_KEY;
        if (!key) { frameMode(box, origin, dest); return; }
        window.__fcMapReady = function () { apiMode(box, origin, dest); };
        var s = document.createElement("script");
        s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(key) + "&callback=__fcMapReady";
        s.onerror = function () { frameMode(box, origin, dest); };
        document.head.appendChild(s);
    }

    return { init: init, onPosition: null };
})();
