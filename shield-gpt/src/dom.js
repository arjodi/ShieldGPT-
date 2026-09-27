(() => {
  "use strict";

  const composerSelector = [
    "textarea",
    "[contenteditable='true']",
    "div[role='textbox']",
    "p[data-placeholder]"
  ].join(",");

  function isVisible(element) {
    if (!element || !(element instanceof Element)) return false;
    const box = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return box.width > 0 && box.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }

  function isComposer(element) {
    if (!element || !(element instanceof Element)) return false;
    const candidate = element.closest(composerSelector);
    if (!candidate || !isVisible(candidate)) return false;
    if (candidate.matches("input")) return false;
    return candidate.matches("textarea,[contenteditable='true'],div[role='textbox'],p[data-placeholder]");
  }

  function closestComposer(target) {
    if (!target || !(target instanceof Element)) return null;
    const candidate = target.closest(composerSelector);
    return isComposer(candidate) ? candidate : null;
  }

  function getText(element) {
    if (!element) return "";
    if ("value" in element) return element.value || "";
    return element.innerText || element.textContent || "";
  }

  function setText(element, text) {
    if (!element) return;

    if ("value" in element) {
      element.value = text;
      element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertReplacementText", data: text }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.focus();
      return;
    }

    element.focus();
    element.textContent = text;
    element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertReplacementText", data: text }));
  }

  function activeComposer() {
    const active = closestComposer(document.activeElement);
    if (active) return active;

    const candidates = Array.from(document.querySelectorAll(composerSelector)).filter(isComposer);
    return candidates.sort((a, b) => b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom)[0] || null;
  }

  function textLooksLikeSend(value) {
    return /\b(send|submit|arrow-up|send message)\b/i.test(value || "");
  }

  function isSendButton(element) {
    const button = element?.closest?.("button,[role='button']");
    if (!button || !isVisible(button)) return false;
    if (button.disabled || button.getAttribute("aria-disabled") === "true") return false;

    const fields = [
      button.getAttribute("aria-label"),
      button.getAttribute("title"),
      button.getAttribute("data-testid"),
      button.id,
      button.textContent
    ];

    return fields.some(textLooksLikeSend);
  }

  function findSendButton() {
    const selectors = [
      "button[data-testid*='send' i]",
      "button[aria-label*='send' i]",
      "button[title*='send' i]",
      "button[type='submit']",
      "[role='button'][aria-label*='send' i]"
    ];

    for (const selector of selectors) {
      const match = Array.from(document.querySelectorAll(selector)).find(isSendButton);
      if (match) return match.closest("button,[role='button']");
    }

    return null;
  }

  function shouldTreatEnterAsSend(event) {
    return event.key === "Enter" && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey;
  }

  window.SensitiveChatGuardDom = Object.freeze({
    activeComposer,
    closestComposer,
    findSendButton,
    getText,
    isSendButton,
    setText,
    shouldTreatEnterAsSend
  });
})();