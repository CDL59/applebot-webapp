const API_BASE = "https://applebot-bot-production.up.railway.app";
const API_URL = `${API_BASE}/api/reserve`;
const SLOTS_URL = `${API_BASE}/api/slots`;
const PROMO_URL = `${API_BASE}/api/promo`;

const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();
tg?.setHeaderColor?.("#000000");
tg?.setBackgroundColor?.("#000000");

const screens = {
  main: document.getElementById("screen-main"),
  slot: document.getElementById("screen-slot"),
  confirm: document.getElementById("screen-confirm"),
  success: document.getElementById("screen-success"),
  error: document.getElementById("screen-error"),
};

const history = ["main"];
let selectedSlot = null;

function show(name) {
  Object.values(screens).forEach((el) => el.setAttribute("data-active", "false"));
  screens[name].setAttribute("data-active", "true");
}

function goTo(name) {
  history.push(name);
  show(name);
}

function goBack() {
  if (history.length <= 1) return;
  history.pop();
  show(history[history.length - 1]);
}

document.querySelectorAll("[data-back]").forEach((btn) => {
  btn.addEventListener("click", goBack);
});

document.getElementById("btn-reserve").addEventListener("click", () => goTo("slot"));

function renderSlots(slots) {
  if (!slots || !slots.total) {
    document.getElementById("slots-progress").hidden = true;
    return;
  }
  const { total, remaining } = slots;
  const taken = total - remaining;
  const pct = Math.max(0, Math.min(100, (taken / total) * 100));

  document.getElementById("slots-progress").hidden = false;
  document.getElementById("slots-text").textContent =
    remaining > 0 ? `Plus que ${remaining} places sur ${total}` : "Complet";
  document.getElementById("slots-fill").style.width = `${pct}%`;
}

function renderPromo(promo) {
  const el = document.getElementById("promo-progress");
  if (!promo || !promo.active || !promo.total || promo.remaining <= 0) {
    el.hidden = true;
    return;
  }
  const { price, total, remaining } = promo;
  const taken = total - remaining;
  const pct = Math.max(0, Math.min(100, (taken / total) * 100));

  el.hidden = false;
  document.getElementById("promo-text").textContent =
    `PROMO ${price} € — plus que ${remaining} place${remaining > 1 ? "s" : ""} a ce prix`;
  document.getElementById("promo-fill").style.width = `${pct}%`;
}

function loadPromo() {
  fetch(PROMO_URL)
    .then((res) => (res.ok ? res.json() : null))
    .then(renderPromo)
    .catch(() => {});
}

fetch(SLOTS_URL)
  .then((res) => (res.ok ? res.json() : null))
  .then(renderSlots)
  .catch(() => {});

loadPromo();

const slotButtons = document.querySelectorAll("#slot-options .option");
const btnToConfirm = document.getElementById("btn-to-confirm");

slotButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    slotButtons.forEach((b) => b.setAttribute("data-selected", "false"));
    btn.setAttribute("data-selected", "true");
    selectedSlot = btn.dataset.slot;
    btnToConfirm.disabled = false;
  });
});

btnToConfirm.addEventListener("click", () => {
  document.getElementById("recap-slot").textContent = selectedSlot;
  goTo("confirm");
});

document.getElementById("btn-confirm").addEventListener("click", async () => {
  const button = document.getElementById("btn-confirm");
  button.disabled = true;
  button.textContent = "Envoi en cours...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initData: tg?.initData ?? "",
        preferredTime: selectedSlot,
      }),
    });

    if (!res.ok) throw new Error("request_failed");

    const data = await res.json();
    renderSlots(data.slots);
    loadPromo();

    goTo("success");
    tg?.HapticFeedback?.notificationOccurred?.("success");
  } catch (err) {
    document.getElementById("error-message").textContent =
      "Merci de reessayer dans quelques instants.";
    goTo("error");
    tg?.HapticFeedback?.notificationOccurred?.("error");
  } finally {
    button.disabled = false;
    button.textContent = "Confirmer la reservation";
  }
});
