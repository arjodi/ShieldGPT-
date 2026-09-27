(() => {
  "use strict";

  const Patterns = window.SensitiveChatGuardPatterns;
  const Dom = window.SensitiveChatGuardDom;
  const Panel = window.SensitiveChatGuardPanel;

  if (!Patterns || !Dom || !Panel) return;

  let bypassUntil = 0;
  let activePanel = null;

  function isBypassing() {
    return Date.now() < bypassUntil;
  }

  function allowNextSend() {
    bypassUntil = Date.now() + 1500;
  }

  function showWarning(composer, text, findings, trigger) {
    activePanel?.hide();
    activePanel = Panel.panel();

    activePanel.render(findings, {
      onDismiss() {
        activePanel = null;
        composer.focus();
      },
      onRandomize() {
        const randomized = Patterns.randomize(text, findings);
        Dom.setText(composer, randomized);
        composer.focus();
      },
      onSendAnyway() {
        activePanel = null;
        allowNextSend();
        sendThrough(trigger);
      }
    });
  }

  function inspectBeforeSend(event, trigger) {
    if (isBypassing()) return false;

    const composer = trigger.composer || Dom.activeComposer();
    if (!composer) return false;

    const text = Dom.getText(composer).trim();
    if (!text) return false;

    const findings = Patterns.scan(text);
    if (findings.length === 0) return false;

    event.preventDefault();
    event.stopImmediatePropagation();
    showWarning(composer, text, findings, trigger);
    return true;
  }

  function sendThrough(trigger) {
    const button = trigger.button || Dom.findSendButton();
    if (button) {
      button.click();
      return;
    }

    const composer = trigger.composer || Dom.activeComposer();
    const form = composer?.closest?.("form");
    if (form) {
      form.requestSubmit?.();
      return;
    }

    composer?.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      bubbles: true,
      cancelable: true
    }));
  }

  document.addEventListener("keydown", (event) => {
    if (!Dom.shouldTreatEnterAsSend(event)) return;

    const composer = Dom.closestComposer(event.target);
    if (!composer) return;

    inspectBeforeSend(event, { type: "keyboard", composer });
  }, true);

  document.addEventListener("click", (event) => {
    const button = Dom.isSendButton(event.target) ? event.target.closest("button,[role='button']") : null;
    if (!button) return;

    inspectBeforeSend(event, { type: "click", button, composer: Dom.activeComposer() });
  }, true);

  document.addEventListener("submit", (event) => {
    inspectBeforeSend(event, { type: "submit", composer: Dom.activeComposer() });
  }, true);
})();