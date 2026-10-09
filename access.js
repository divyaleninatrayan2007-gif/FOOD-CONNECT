/* =========================================================
   Food Connect — ROLE-BASED ACCESS CONTROL (prototype logic)
   =========================================================
   Roles: "donor", "volunteer", "ngo", "admin"
   Admin always passes every check — every other role is
   restricted to the pages that belong to its own workflow.
========================================================= */

const RESCUE_ROLES = ["donor", "volunteer", "ngo", "admin"];

/* Pages that require SOME logged-in session (any role) */
const LOGIN_REQUIRED_PAGES = [
    "04-home.html",
    "05-donate.html",
    "06-ai-matching.html",
    "07-ngo-detail.html",
    "08-profile.html",
    "09-alerts.html",
    "10-request-pickup.html",
    "11-track-delivery.html",
    "13-ngo-request-food.html",
    "14-ngo-confirmation.html",
    "15-volunteer-profile.html"
];
/* NOTE: 12-ngo-register.html and 16-volunteer-register.html are intentionally
   NOT gated — new NGO/volunteer users reach them from the login screen
   before a session exists. */

/* Pages restricted to specific roles (admin is always added automatically) */
const ROLE_PAGE_ACCESS = {
    "05-donate.html":        ["donor"],
    "06-ai-matching.html":   ["ngo"],
    "07-ngo-detail.html":    ["donor", "ngo"],
    "10-request-pickup.html":["volunteer"],
    "11-track-delivery.html":["donor", "volunteer"],
    "13-ngo-request-food.html": ["ngo"],
    "14-ngo-confirmation.html": ["ngo"],
    "15-volunteer-profile.html": ["volunteer"]
    /* 04-home, 08-profile, 09-alerts: open to any logged-in role */
};

function rescueCurrentPage() {
    return location.pathname.split("/").pop();
}

function rescueGetSession() {
    return JSON.parse(localStorage.getItem("rescueSession") || "null");
}

function rescueGetRole() {
    const session = rescueGetSession();
    return session ? session.role : null;
}

function rescueSetSession(role, name) {
    localStorage.setItem(
        "rescueSession",
        JSON.stringify({ role: role, name: name || "" })
    );
}

function rescueClearSession() {
    localStorage.removeItem("rescueSession");
}

function rescueRoleLabel(role) {
    const labels = {
        donor: "🎁 Donor",
        volunteer: "🚗 Volunteer",
        ngo: "🏛️ NGO Partner",
        admin: "🛡️ Admin"
    };
    return labels[role] || role;
}

/* =========================================================
   ROLE-AWARE BOTTOM NAVIGATION
   Each role only sees the tabs that matter to its own
   workflow. Every page has an empty <nav class="bottom-nav">
   placeholder — this function fills it in based on the
   signed-in role, so the same 5 links don't show up on
   every single screen for every single role anymore.
========================================================= */

const ROLE_NAV_ITEMS = {

    donor: [
        { href: "04-home.html",       icon: "⌂",  label: "Home" },
        { href: "05-donate.html",     icon: "🎁", label: "Donate" },
                { href: "09-alerts.html",     icon: "🔔", label: "Alerts" },
        { href: "08-profile.html",    icon: "👤", label: "Profile" }
    ],

    /* Volunteers only need two stops: Home (to pick a new
       mission from the role grid) and Profile (their account +
       the link into their pickup-details form). Everything else
       on the old 5-tab bar didn't belong to their workflow. */
    volunteer: [
        { href: "04-home.html",    icon: "⌂",  label: "Home" },
        { href: "08-profile.html", icon: "👤", label: "Profile" }
    ],

    ngo: [
        { href: "04-home.html",             icon: "⌂",  label: "Home" },
        { href: "07-ngo-detail.html",        icon: "🏛️", label: "NGO Profile" },
        { href: "13-ngo-request-food.html",  icon: "✚",  label: "Request", center: true },
        { href: "09-alerts.html",            icon: "🔔", label: "Alerts" },
        { href: "08-profile.html",           icon: "👤", label: "Profile" }
    ],

    /* Admin sees everything, same as donor's full bar */
    admin: [
        { href: "04-home.html",       icon: "⌂",  label: "Home" },
        { href: "05-donate.html",     icon: "🎁", label: "Donate" },
                { href: "09-alerts.html",     icon: "🔔", label: "Alerts" },
        { href: "08-profile.html",    icon: "👤", label: "Profile" }
    ]
};

function rescueRenderBottomNav(role, page) {

    const nav = document.querySelector(".bottom-nav");
    if (!nav) return;

    const items = ROLE_NAV_ITEMS[role] || ROLE_NAV_ITEMS.donor;

    nav.innerHTML = "";

    items.forEach(function (item) {

        const a = document.createElement("a");

        let cls = "nav-item";
        if (item.center) cls += " center";
        if (item.href === page) cls += " active";
        a.className = cls;
        a.href = item.href;

        const iconSpan = document.createElement("span");
        iconSpan.className = item.center ? "ic-circle" : "ic";
        iconSpan.textContent = item.icon;

        a.appendChild(iconSpan);
        a.appendChild(document.createTextNode(item.label));

        nav.appendChild(a);
    });
}

/* =========================================================
   MAIN GATE — runs on every page that includes this file
========================================================= */

function rescueInjectTopBarBadge(role) {

    const screen = document.querySelector(".phone .screen");

    if (!screen || document.getElementById("rescueCornerBadge")) return;

    const wrap = document.createElement("div");
    wrap.id = "rescueCornerBadge";
    wrap.style.cssText =
        "position:absolute; top:8px; right:12px; z-index:30;" +
        "display:flex; align-items:center; gap:6px;" +
        "font-size:9px; font-family:Arial, Helvetica, sans-serif;";

    const badge = document.createElement("span");
    badge.style.cssText =
        "background:#1f2b22; color:#7ed389; padding:3px 8px;" +
        "border-radius:20px; font-weight:700;";
    badge.textContent = rescueRoleLabel(role);

    const logoutLink = document.createElement("a");
    logoutLink.href = "#";
    logoutLink.textContent = "Log out";
    logoutLink.style.cssText =
        "background:#fff0f0; color:#c62828; padding:3px 8px;" +
        "border-radius:20px; font-weight:700; text-decoration:none;";
    logoutLink.addEventListener("click", function (e) {
        e.preventDefault();
        rescueClearSession();
        localStorage.removeItem("loggedInUser");
        window.location.href = "02-login.html";
    });

    wrap.appendChild(badge);
    wrap.appendChild(logoutLink);
    screen.appendChild(wrap);
}

function rescueEnforceAccess() {

    const page = rescueCurrentPage();
    const session = rescueGetSession();
    const role = session ? session.role : null;

    /* 1. Must be logged in at all for app pages */
    if (LOGIN_REQUIRED_PAGES.includes(page) && !role) {
        alert("Please log in to continue.");
        window.location.href = "02-login.html";
        return;
    }

    if (role && LOGIN_REQUIRED_PAGES.includes(page)) {
        rescueInjectTopBarBadge(role);
        rescueRenderBottomNav(role, page);
    }

    /* 2. Admin bypasses every role restriction */
    if (role === "admin") return;

    /* 3. Role-specific page restriction */
    const allowedRoles = ROLE_PAGE_ACCESS[page];

    if (allowedRoles && !allowedRoles.includes(role)) {
        alert(
            "This page isn't part of the " +
            rescueRoleLabel(role) +
            " workflow. Taking you back to Home."
        );
        window.location.href = "04-home.html";
    }
}

document.addEventListener("DOMContentLoaded", rescueEnforceAccess);


/* Turn a volunteer record from MongoDB into the profile shape the pages use,
   and sign the volunteer in. */
function rescueSignInVolunteer(v) {
    const profile = {
        id: v._id, name: v.name, email: v.email, phone: v.phone, vehicle: v.vehicle,
        address: v.baseAddress, baseAddress: v.baseAddress,
        maxDistance: v.maxDistance,
        availability: Array.isArray(v.availability) ? v.availability : [v.availability]
    };
    localStorage.setItem("volunteerProfile", JSON.stringify(profile));
    localStorage.setItem("rescueUser", JSON.stringify({ name: v.name, email: v.email, role: "volunteer" }));
    localStorage.setItem("loggedInUser", JSON.stringify({ name: v.name, email: v.email, role: "volunteer" }));
    rescueSetSession("volunteer", v.name);
    return profile;
}
