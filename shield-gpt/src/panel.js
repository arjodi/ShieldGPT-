(() => {
  "use strict";

  const hostId = "sensitive-chat-guard-panel";

  function createPanel() {
    const host = document.createElement("div");
    host.id = hostId;
    const root = host.attachShadow({ mode: "closed" });

    root.innerHTML = `
      <style>
        :host { all: initial; }
        .shell {
          position: fixed;
          top: 18px;
          right: 18px;
          width: min(380px, calc(100vw - 32px));
          z-index: 2147483647;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #16201d;
          background: #fbfcfb;
          border: 1px solid #cfd8d3;
          border-radius: 8px;
          box-shadow: 0 18px 48px rgba(16, 24, 20, 0.18);
          overflow: hidden;
        }
        .top {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 14px 10px;
          border-bottom: 1px solid #e4e9e6;
        }
        .mark {
          flex: 0 0 auto;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: grid;
          place-items: center;
          color: #fff;
          background: #b83a33;
          font-size: 17px;
          font-weight: 700;
          line-height: 1;
        }
        .title {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.3;
        }
        .copy {
          margin: 3px 0 0;
          color: #52615b;
          font-size: 12px;
          line-height: 1.45;
        }
        .close {
          appearance: none;
          border: 0;
          background: transparent;
          color: #5d6c66;
          cursor: pointer;
          font-size: 20px;
          line-height: 1;
          margin-left: auto;
          padding: 0 2px;
        }
        .body { padding: 10px 14px 14px; }
        .items {
          display: grid;
          gap: 8px;
          margin: 0 0 12px;
          padding: 0;
          max-height: 240px;
          overflow: auto;
          list-style: none;
        }
        .item {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          align-items: center;
          min-width: 0;
          padding: 9px 10px;
          border: 1px solid #e1e7e4;
          border-radius: 6px;
          background: #fff;
        }
        .label {
          min-width: 0;
          font-size: 12px;
          font-weight: 650;
          color: #25312d;
          overflow-wrap: anywhere;
        }
        .preview {
          min-width: 0;
          color: #6a7871;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
          font-size: 11px;
          overflow-wrap: anywhere;
          text-align: right;
        }
        .actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        button.action {
          appearance: none;
          border: 1px solid #bdc8c3;
          border-radius: 6px;
          background: #fff;
          color: #1f2b27;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
          font-weight: 650;
          line-height: 1;
          min-height: 34px;
          padding: 0 11px;
        }
        button.primary {
          border-color: #1f6f5b;
          background: #1f6f5b;
          color: #fff;
        }
        .status {
          display: none;
          margin: 0 0 12px;
          color: #285f4f;
          font-size: 12px;
          line-height: 1.45;
        }
        .status.visible { display: block; }
      </style>
      <section class="shell" role="dialog" aria-live="assertive" aria-label="Sensitive data warning">
        <div class="top">
          <div class="mark">!</div>
          <div>
            <p class="title">Sensitive data found</p>
            <p class="copy">Review these matches before the message leaves this page.</p>
          </div>
          <button class="close" type="button" aria-label="Dismiss">&times;</button>
        </div>
        <div class="body">
          <p class="status"></p>
          <ul class="items"></ul>
          <div class="actions">
            <button class="action randomize" type="button">Randomize this data</button>
            <button class="action primary send" type="button">Send anyway</button>
          </div>
        </div>
      </section>
    `;

    document.documentElement.append(host);

    const nodes = {
      host,
      items: root.querySelector(".items"),
      status: root.querySelector(".status"),
      close: root.querySelector(".close"),
      randomize: root.querySelector(".randomize"),
      send: root.querySelector(".send")
    };

    return nodes;
  }

  function panel() {
    document.getElementById(hostId)?.remove();
    const nodes = createPanel();

    function hide() {
      nodes.host.remove();
    }

    function render(findings, handlers) {
      nodes.items.replaceChildren(...findings.map((finding) => {
        const item = document.createElement("li");
        item.className = "item";

        const label = document.createElement("span");
        label.className = "label";
        label.textContent = finding.label;

        const preview = document.createElement("span");
        preview.className = "preview";
        preview.textContent = finding.preview;

        item.append(label, preview);
        return item;
      }));

      nodes.close.onclick = () => {
        handlers.onDismiss?.();
        hide();
      };

      nodes.randomize.onclick = () => {
        handlers.onRandomize?.();
        nodes.status.textContent = "Random values replaced the sensitive matches. Review the message before sending.";
        nodes.status.classList.add("visible");
        nodes.randomize.disabled = true;
        nodes.randomize.textContent = "Randomized";
        nodes.send.textContent = "Send randomized message";
      };

      nodes.send.onclick = () => {
        hide();
        handlers.onSendAnyway?.();
      };
    }

    return { hide, render };
  }

  window.SensitiveChatGuardPanel = Object.freeze({ panel });
})();
