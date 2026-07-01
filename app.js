// A remplacer par l'URL Railway du bot, ex: "https://applebot-production.up.railway.app/api/reserve"
const API_URL = "https://applebot-bot-production.up.railway.app/api/reserve";

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
