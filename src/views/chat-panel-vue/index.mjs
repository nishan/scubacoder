import { defineComponent as P, computed as $, openBlock as n, createElementBlock as l, normalizeClass as S, createElementVNode as t, toDisplayString as y, createCommentVNode as b, Fragment as I, renderList as A, createTextVNode as K, ref as f, onMounted as H, onUnmounted as q, watch as B, withDirectives as R, vModelText as W, nextTick as N, unref as w, createBlock as G, createVNode as L, createApp as J } from "vue";
const Q = { class: "message-header" }, X = { class: "role-badge" }, Y = { class: "timestamp" }, Z = { class: "message-content" }, ee = {
  key: 0,
  class: "loading-indicator"
}, te = ["innerHTML"], se = {
  key: 0,
  class: "message-actions"
}, oe = /* @__PURE__ */ P({
  __name: "MessageCard",
  props: {
    message: {},
    isLoading: { type: Boolean }
  },
  emits: ["insert-code"],
  setup(r, { emit: _ }) {
    const i = r, d = _, c = $(() => i.message.content.includes("```")), v = (o) => o.toLocaleTimeString(), g = (o) => o.replace(/```(\w+)?\n([\s\S]*?)```/g, (u, e, s) => `<div class="code-block">
        <div class="code-header">${e || "text"}</div>
        <pre class="code-content" data-code="${encodeURIComponent(s.trim())}">${s.trim()}</pre>
      </div>`).replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>'), h = () => {
      const o = document.querySelectorAll(".code-content");
      if (o.length > 0) {
        const u = Array.from(o).map((e) => e.textContent).join(`

`);
        navigator.clipboard.writeText(u).then(() => {
          console.log("Code copied to clipboard");
        });
      }
    }, m = () => {
      const o = document.querySelectorAll(".code-content");
      if (o.length > 0) {
        const u = Array.from(o).map((e) => e.textContent).join(`

`);
        d("insert-code", u);
      }
    };
    return (o, u) => (n(), l("div", {
      class: S(["message-card", [`role-${o.message.role}`, { loading: o.isLoading }]])
    }, [
      t("div", Q, [
        t("div", X, y(o.message.role === "user" ? "User" : "Assistant"), 1),
        t("div", Y, y(v(o.message.timestamp)), 1)
      ]),
      t("div", Z, [
        o.message.role === "assistant" && o.isLoading ? (n(), l("div", ee, [...u[0] || (u[0] = [
          t("div", { class: "typing-dots" }, [
            t("span"),
            t("span"),
            t("span")
          ], -1)
        ])])) : (n(), l("div", {
          key: 1,
          class: "content-text",
          innerHTML: g(o.message.content)
        }, null, 8, te))
      ]),
      o.message.role === "assistant" && !o.isLoading ? (n(), l("div", se, [
        c.value ? (n(), l("button", {
          key: 0,
          onClick: h,
          class: "action-btn",
          title: "Copy code"
        }, " 📋 Copy ")) : b("", !0),
        c.value ? (n(), l("button", {
          key: 1,
          onClick: m,
          class: "action-btn",
          title: "Insert into editor"
        }, " ➕ Insert ")) : b("", !0)
      ])) : b("", !0)
    ], 2));
  }
});
const T = (r, _) => {
  const i = r.__vccOpts || r;
  for (const [d, c] of _)
    i[d] = c;
  return i;
}, j = /* @__PURE__ */ T(oe, [["__scopeId", "data-v-a87faf0c"]]), ne = { class: "context-pills" }, ae = { class: "pills-header" }, le = {
  key: 0,
  class: "selected-count"
}, ie = { class: "pills-container" }, re = ["onClick", "title"], ce = {
  key: 0,
  class: "checkmark"
}, de = {
  key: 0,
  class: "no-files",
  disabled: ""
}, ue = { class: "pills-actions" }, pe = /* @__PURE__ */ P({
  __name: "ContextPills",
  props: {
    availableFiles: {},
    selectedUris: {}
  },
  emits: ["toggle-file", "add-context", "clear-selection"],
  setup(r, { emit: _ }) {
    const i = r, d = _, c = $(() => i.selectedUris.length), v = (m) => {
      d("toggle-file", m);
    }, g = () => {
      d("add-context");
    }, h = () => {
      d("clear-selection");
    };
    return (m, o) => (n(), l("div", ne, [
      t("div", ae, [
        o[0] || (o[0] = t("span", { class: "pills-title" }, "Context Files", -1)),
        c.value > 0 ? (n(), l("span", le, y(c.value) + " selected", 1)) : b("", !0)
      ]),
      t("div", ie, [
        (n(!0), l(I, null, A(m.availableFiles, (u) => (n(), l("button", {
          key: u.uri,
          class: S(["context-pill", { active: u.isSelected }]),
          onClick: (e) => v(u.uri),
          title: u.label
        }, [
          K(y(u.label) + " ", 1),
          u.isSelected ? (n(), l("span", ce, "✓")) : b("", !0)
        ], 10, re))), 128)),
        m.availableFiles.length === 0 ? (n(), l("button", de, " No context files available ")) : b("", !0)
      ]),
      t("div", ue, [
        t("button", {
          onClick: g,
          class: "add-context-btn",
          title: "Add more context files"
        }, " ➕ Add Context "),
        c.value > 0 ? (n(), l("button", {
          key: 0,
          onClick: h,
          class: "clear-btn",
          title: "Clear all selections"
        }, " 🗑️ Clear ")) : b("", !0)
      ])
    ]));
  }
});
const ve = /* @__PURE__ */ T(pe, [["__scopeId", "data-v-945ce016"]]), ge = { class: "provider-selector" }, me = { class: "selector-header" }, _e = { class: "current-provider" }, he = ["title"], Ce = { class: "provider-info" }, fe = { class: "provider-name" }, be = { class: "model-name" }, ye = {
  key: 0,
  class: "dropdown-content"
}, ke = { class: "provider-groups" }, we = { class: "group-header" }, xe = { class: "group-models" }, Me = ["onClick"], $e = { class: "model-name" }, Se = {
  key: 0,
  class: "checkmark"
}, Pe = {
  key: 0,
  class: "no-models"
}, Le = /* @__PURE__ */ P({
  __name: "ProviderSelector",
  props: {
    availableModels: {},
    currentProvider: {},
    currentModel: {}
  },
  emits: ["change-provider-model"],
  setup(r, { emit: _ }) {
    const i = r, d = _, c = f(!1), v = $(() => {
      const e = {};
      return i.availableModels.forEach((s) => {
        e[s.provider] || (e[s.provider] = []), e[s.provider].push(s);
      }), Object.entries(e).map(([s, C]) => ({
        provider: s,
        models: C.sort((k, M) => k.model.localeCompare(M.model))
      }));
    }), g = (e, s) => e === i.currentProvider && s === i.currentModel, h = () => {
      c.value = !c.value;
    }, m = () => {
      c.value = !1;
    }, o = (e, s) => {
      d("change-provider-model", e, s), m();
    }, u = (e) => {
      e.target.closest(".provider-selector") || m();
    };
    return H(() => {
      document.addEventListener("click", u);
    }), q(() => {
      document.removeEventListener("click", u);
    }), (e, s) => (n(), l("div", ge, [
      t("div", me, [
        s[0] || (s[0] = t("span", { class: "selector-title" }, "AI Provider", -1)),
        t("span", _e, y(e.currentProvider) + " • " + y(e.currentModel), 1)
      ]),
      t("div", {
        class: S(["selector-dropdown", { open: c.value }])
      }, [
        t("button", {
          onClick: h,
          class: "selector-button",
          title: `Current: ${e.currentProvider} • ${e.currentModel}`
        }, [
          t("span", Ce, [
            t("span", fe, y(e.currentProvider), 1),
            t("span", be, y(e.currentModel), 1)
          ]),
          s[1] || (s[1] = t("span", { class: "dropdown-arrow" }, "▼", -1))
        ], 8, he),
        c.value ? (n(), l("div", ye, [
          t("div", { class: "dropdown-header" }, [
            s[2] || (s[2] = t("span", null, "Select Provider & Model", -1)),
            t("button", {
              onClick: m,
              class: "close-btn"
            }, "×")
          ]),
          t("div", ke, [
            (n(!0), l(I, null, A(v.value, (C) => (n(), l("div", {
              key: C.provider,
              class: "provider-group"
            }, [
              t("div", we, y(C.provider), 1),
              t("div", xe, [
                (n(!0), l(I, null, A(C.models, (k) => (n(), l("button", {
                  key: `${C.provider}-${k.model}`,
                  class: S(["model-option", { active: g(C.provider, k.model) }]),
                  onClick: (M) => o(C.provider, k.model)
                }, [
                  t("span", $e, y(k.model), 1),
                  g(C.provider, k.model) ? (n(), l("span", Se, "✓")) : b("", !0)
                ], 10, Me))), 128))
              ])
            ]))), 128))
          ]),
          e.availableModels.length === 0 ? (n(), l("div", Pe, " No provider models available ")) : b("", !0)
        ])) : b("", !0)
      ], 2),
      s[3] || (s[3] = t("div", { class: "provider-info" }, [
        t("span", { class: "info-text" }, "No code leaves your machine")
      ], -1))
    ]));
  }
});
const Ie = /* @__PURE__ */ T(Le, [["__scopeId", "data-v-15970ce8"]]), Ae = { class: "chat-composer" }, Te = { class: "composer-header" }, Ee = {
  key: 0,
  class: "context-indicator"
}, Fe = { class: "input-container" }, De = ["disabled"], Ve = { class: "input-actions" }, Ue = ["disabled"], Be = { key: 0 }, Ne = {
  key: 1,
  class: "loading-spinner"
}, He = { class: "input-tips" }, Oe = {
  key: 0,
  class: "tip context-tip"
}, ze = /* @__PURE__ */ P({
  __name: "ChatComposer",
  props: {
    isLoading: { type: Boolean },
    hasContext: { type: Boolean },
    contextCount: {}
  },
  emits: ["send-message"],
  setup(r, { emit: _ }) {
    const i = r, d = _, c = f(""), v = f(), g = $(() => c.value.trim().length > 0 && !i.isLoading), h = (e) => {
      e.key === "Enter" && !e.shiftKey && (e.preventDefault(), o());
    }, m = () => {
      v.value && (v.value.style.height = "auto", v.value.style.height = Math.min(v.value.scrollHeight, 200) + "px");
    }, o = () => {
      const e = c.value.trim();
      !e || !g.value || (d("send-message", e), c.value = "", N(() => {
        v.value && (v.value.style.height = "auto");
      }));
    }, u = () => {
      N(() => {
        v.value && v.value.focus();
      });
    };
    return B(() => i.isLoading, (e, s) => {
      s && !e && u();
    }), u(), (e, s) => (n(), l("div", Ae, [
      t("div", Te, [
        s[1] || (s[1] = t("span", { class: "composer-title" }, "Ask ScubaCoder", -1)),
        e.hasContext ? (n(), l("span", Ee, y(e.contextCount) + " context file" + y(e.contextCount !== 1 ? "s" : "") + " selected ", 1)) : b("", !0)
      ]),
      t("div", Fe, [
        R(t("textarea", {
          "onUpdate:modelValue": s[0] || (s[0] = (C) => c.value = C),
          onKeydown: h,
          onInput: m,
          placeholder: "Ask a question about your codebase... (Shift+Enter = newline)",
          class: "chat-input",
          disabled: e.isLoading,
          ref_key: "inputRef",
          ref: v
        }, null, 40, De), [
          [W, c.value]
        ]),
        t("div", Ve, [
          t("button", {
            onClick: o,
            disabled: !g.value || e.isLoading,
            class: S(["send-button", { loading: e.isLoading }])
          }, [
            e.isLoading ? (n(), l("span", Ne, "⏳")) : (n(), l("span", Be, "Send"))
          ], 10, Ue),
          t("div", He, [
            s[2] || (s[2] = t("span", { class: "tip" }, "Shift+Enter for new line", -1)),
            e.hasContext ? (n(), l("span", Oe, " Context files will be included ")) : b("", !0)
          ])
        ])
      ])
    ]));
  }
});
const je = /* @__PURE__ */ T(ze, [["__scopeId", "data-v-cde4467d"]]);
function qe() {
  const r = f(!1), _ = () => {
    r.value = typeof window < "u" && "vscode" in window;
  }, i = (g) => {
    r.value && window.vscode ? window.vscode.postMessage(g) : console.log("VSCode message (dev mode):", g);
  }, d = (g) => {
    const h = (m) => {
      m.data && typeof m.data == "object" && g(m.data);
    };
    return window.addEventListener("message", h), () => {
      window.removeEventListener("message", h);
    };
  }, c = () => r.value && window.vscode ? window.vscode.getState() : null, v = (g) => {
    r.value && window.vscode && window.vscode.setState(g);
  };
  return H(() => {
    _();
  }), {
    isVSCode: r,
    postMessage: i,
    onMessage: d,
    getState: c,
    setState: v
  };
}
function Ke() {
  const { postMessage: r, onMessage: _ } = qe(), i = f([]), d = f([]), c = f([]), v = f([]), g = f(""), h = f(""), m = f(!1), o = f(""), u = $(() => d.value.length > 0), e = $(() => d.value.length), s = () => {
    i.value = [{
      id: "welcome",
      role: "assistant",
      content: "Ask a question about your codebase. Use the context pills below to include files. For example: `How do I open the chat panel?`",
      timestamp: /* @__PURE__ */ new Date()
    }];
  }, C = () => {
    const p = o.value.trim();
    if (!p)
      return;
    const a = {
      id: Date.now().toString(),
      role: "user",
      content: p,
      timestamp: /* @__PURE__ */ new Date(),
      contextUris: d.value
    };
    i.value.push(a), o.value = "", r({
      type: "chat",
      text: p,
      contextUris: d.value
    });
  }, k = (p) => {
    switch (p.type) {
      case "userMessage":
        break;
      case "loading":
        m.value = !0;
        break;
      case "reply":
        m.value = !1;
        const a = {
          id: Date.now().toString(),
          role: "assistant",
          content: p.text,
          timestamp: /* @__PURE__ */ new Date()
        };
        i.value.push(a);
        break;
      case "updateProviderModel":
        p.provider && (g.value = p.provider), p.model && (h.value = p.model);
        break;
    }
  }, M = (p) => {
    const a = d.value.indexOf(p);
    a > -1 ? d.value.splice(a, 1) : d.value.push(p);
  }, E = (p, a) => {
    r({
      type: "changeProviderModel",
      provider: p,
      model: a
    });
  }, F = (p) => {
    r({
      type: "insert",
      code: p
    });
  }, D = (p) => {
    r({
      type: "searchWorkspace",
      query: p
    });
  }, V = (p, a, x) => {
    r({
      type: "log",
      level: p,
      message: a,
      data: x
    });
  }, U = _(k);
  return {
    // State
    messages: i,
    selectedContextUris: d,
    availableContextFiles: c,
    availableProviderModels: v,
    currentProvider: g,
    currentModel: h,
    isLoading: m,
    inputText: o,
    // Computed
    hasSelectedContext: u,
    contextSelectionCount: e,
    // Methods
    initializeChat: s,
    sendMessage: C,
    toggleContextFile: M,
    changeProviderModel: E,
    insertCode: F,
    searchWorkspace: D,
    logMessage: V,
    // Cleanup
    unsubscribe: U
  };
}
const Re = {
  id: "app",
  class: "chat-panel-app"
}, We = {
  key: 0,
  class: "loading-message"
}, Ge = /* @__PURE__ */ P({
  __name: "App",
  setup(r) {
    const {
      messages: _,
      selectedContextUris: i,
      availableContextFiles: d,
      availableProviderModels: c,
      currentProvider: v,
      currentModel: g,
      isLoading: h,
      initializeChat: m,
      sendMessage: o,
      toggleContextFile: u,
      changeProviderModel: e,
      insertCode: s,
      logMessage: C,
      unsubscribe: k
    } = Ke(), M = f(), E = $(() => i.value.length > 0), F = $(() => i.value.length), D = (a) => {
      o();
    }, V = () => {
      C("info", "Add context functionality would be implemented here");
    }, U = () => {
      i.value.length = 0;
    }, p = () => {
      N(() => {
        M.value && (M.value.scrollTop = M.value.scrollHeight);
      });
    };
    return B(_, () => {
      p();
    }, { deep: !0 }), H(() => {
      if (m(), window.vscode)
        try {
          const a = window.vscode.getState();
          a && a.candidates && (d.value = a.candidates.map((x) => ({
            label: x.label,
            uri: x.uri,
            isSelected: !1
          }))), a && a.availableProviderModels && (c.value = a.availableProviderModels), a && a.providerId && (v.value = a.providerId), a && a.model && (g.value = a.model);
        } catch (a) {
          console.warn("Failed to initialize from VSCode state:", a);
        }
      B(i, (a) => {
        d.value.forEach((x) => {
          x.isSelected = a.includes(x.uri);
        });
      });
    }), q(() => {
      k();
    }), (a, x) => (n(), l("div", Re, [
      x[0] || (x[0] = t("div", { class: "app-header" }, [
        t("h1", { class: "app-title" }, "ScubaCoder — Chat"),
        t("div", { class: "app-subtitle" }, "AI-powered coding assistant")
      ], -1)),
      t("div", {
        class: "messages-container",
        ref_key: "messagesContainer",
        ref: M
      }, [
        (n(!0), l(I, null, A(w(_), (z) => (n(), G(j, {
          key: z.id,
          message: z,
          "is-loading": !1,
          onInsertCode: w(s)
        }, null, 8, ["message", "onInsertCode"]))), 128)),
        w(h) ? (n(), l("div", We, [
          L(j, {
            message: {
              id: "loading",
              role: "assistant",
              content: "Thinking...",
              timestamp: /* @__PURE__ */ new Date()
            },
            "is-loading": !0
          }, null, 8, ["message"])
        ])) : b("", !0)
      ], 512),
      L(ve, {
        "available-files": w(d),
        "selected-uris": w(i),
        onToggleFile: w(u),
        onAddContext: V,
        onClearSelection: U
      }, null, 8, ["available-files", "selected-uris", "onToggleFile"]),
      L(Ie, {
        "available-models": w(c),
        "current-provider": w(v),
        "current-model": w(g),
        onChangeProviderModel: w(e)
      }, null, 8, ["available-models", "current-provider", "current-model", "onChangeProviderModel"]),
      L(je, {
        "is-loading": w(h),
        "has-context": E.value,
        "context-count": F.value,
        onSendMessage: D
      }, null, 8, ["is-loading", "has-context", "context-count"])
    ]));
  }
});
const O = J(Ge);
process.env.NODE_ENV === "development" && (O.config.errorHandler = (r, _, i) => {
  console.error("Vue Error:", r), console.error("Component:", _), console.error("Info:", i);
});
O.mount("#app");
window.ScubaCoderChatPanel = {
  createApp: (r) => (console.log("Vue app initialized with config:", r), O)
};
export {
  O as default
};
