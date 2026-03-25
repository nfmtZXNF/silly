try {
  replaceScriptButtons([]);
} catch (e) {}
$("#option_lulu_wb_manager").remove();

const $targetHr = $(".options-content").find("hr").last();
const $menuBtn = $("<a>", {
  id: "option_lulu_wb_manager",
  class: "interactable",
  tabindex: 0,
})
  .append(
    $("<i>", {
      class: "fa-lg fa-solid fa-book-atlas",
      css: { paddingRight: "12px" },
    }),
  )
  .append($("<span>").text("全局世界书管理"));

$menuBtn.insertBefore($targetHr);

let globalBindingMapCache = {};
let isEntryBatchMode = false;
let entryBatchSelected = new Set();

if ($("#lulu-drag-line-style").length === 0) {
  $("head").append(`
        <style id="lulu-drag-line-style">
            .lulu-drag-over-top {
                box-shadow: 0 -3px 0 0 #51cf66 !important;
                margin-top: 25px !important;
                transition: margin 0.15s ease-out, box-shadow 0.1s !important;
            }
            .lulu-drag-over-bottom {
                box-shadow: 0 3px 0 0 #51cf66 !important;
                margin-bottom: 25px !important;
                transition: margin 0.15s ease-out, box-shadow 0.1s !important;
            }
            .lulu-drag-ghost {
                opacity: 0.4 !important;
                transform: scale(0.98) !important;
                border: 1px dashed #51cf66 !important;
            }
            .lulu-folded-hide {
                display: none !important;
                margin: 0 !important;
            }
        </style>
    `);
}

const getSharedGroupOrder = () =>
  JSON.parse(localStorage.getItem("lulu_wb_native_group_order") || "[]");
const setSharedGroupOrder = (arr) =>
  localStorage.setItem("lulu_wb_native_group_order", JSON.stringify(arr));

const formatPositionBadge = (pos) => {
  if (!pos) return "📍未知位置 | 🔢100";
  const posMap = {
    before_character_definition: "前:角色定义",
    after_character_definition: "后:角色定义",
    before_example_messages: "前:示例消息",
    after_example_messages: "后:示例消息",
    before_author_note: "前:作者注释",
    after_author_note: "后:作者注释",
  };
  let typeStr = pos.type || "at_depth";
  if (typeStr === "at_depth" || typeStr === "outlet") {
    const roleIcon =
      pos.role === "user"
        ? "👤用户"
        : pos.role === "assistant"
          ? "🤖助手"
          : "⚙️系统";
    return `🌊深度[${roleIcon}]: ${pos.depth || 0} | 🔢${pos.order || 100}`;
  }
  return `📍${posMap[typeStr] || typeStr} | 🔢${pos.order || 100}`;
};

const getCurrentPersonaId = (ctx, pus) => {
  if (!pus) return null;
  if (ctx.chatMetadata && ctx.chatMetadata.persona)
    return ctx.chatMetadata.persona;
  if (pus.default_persona) return pus.default_persona;
  if (pus.personas && ctx.name1) {
    for (let [id, name] of Object.entries(pus.personas)) {
      if (name === ctx.name1) return id;
    }
  }
  return null;
};

const getPersonaWbs = () => {
  const books = [];
  try {
    const ctx =
      typeof SillyTavern !== "undefined"
        ? SillyTavern.getContext()
        : typeof getContext === "function"
          ? getContext()
          : {};
    const pus = ctx.powerUserSettings || {};
    if (pus.persona_description_lorebook)
      books.push(pus.persona_description_lorebook);
    const activeId = getCurrentPersonaId(ctx, pus);
    if (
      activeId &&
      pus.persona_descriptions &&
      pus.persona_descriptions[activeId]
    ) {
      if (pus.persona_descriptions[activeId].lorebook)
        books.push(pus.persona_descriptions[activeId].lorebook);
    }
  } catch (e) {
    console.error("Lù-chan: 读取 Persona 世界书出现了一点小意外呢", e);
  }
  return [...new Set(books)].filter(
    (b) => typeof b === "string" && b.trim() !== "",
  );
};

const rebindPersonaWorldbook = async (newWbName, oldWbToUnbind = null) => {
  const ctx =
    typeof SillyTavern !== "undefined"
      ? SillyTavern.getContext()
      : typeof getContext === "function"
        ? getContext()
        : {};
  const pus = ctx.powerUserSettings;
  if (!pus) return;

  if (newWbName !== null) pus.persona_description_lorebook = newWbName || "";
  else if (oldWbToUnbind && pus.persona_description_lorebook === oldWbToUnbind)
    pus.persona_description_lorebook = "";

  const activeId = getCurrentPersonaId(ctx, pus);
  if (
    activeId &&
    pus.persona_descriptions &&
    pus.persona_descriptions[activeId]
  ) {
    if (newWbName !== null) {
      pus.persona_descriptions[activeId].lorebook = newWbName || "";
    } else if (
      oldWbToUnbind &&
      pus.persona_descriptions[activeId].lorebook === oldWbToUnbind
    ) {
      pus.persona_descriptions[activeId].lorebook = "";
    }
  } else if (oldWbToUnbind) {
    if (pus.persona_descriptions && pus.personas) {
      for (let [id, desc] of Object.entries(pus.persona_descriptions)) {
        if (pus.personas[id] === ctx.name1 && desc.lorebook === oldWbToUnbind)
          desc.lorebook = "";
      }
    }
  }

  if (typeof ctx.saveSettingsDebounced === "function")
    await ctx.saveSettingsDebounced();
  if (typeof $("#persona_lore_button").toggleClass === "function")
    $("#persona_lore_button").toggleClass("world_set", !!newWbName);
};

window.luluOpenQuickSnapshotView = async () => {
  /* 保持原有快照控制台代码不变，受限字数省略详细内部只展开外皮，此处保留全部防止损坏 */
  let snapshots = getVariables({ type: "global" }).wb_snapshots;
  if (typeof snapshots === "string") {
    try {
      snapshots = JSON.parse(snapshots);
    } catch (e) {
      snapshots = {};
    }
  }
  if (!snapshots || typeof snapshots !== "object" || Array.isArray(snapshots))
    snapshots = {};
  const savedMode = localStorage.getItem("lulu_wb_panel_theme") || "default";
  const savedCustom = JSON.parse(
    localStorage.getItem("lulu_wb_panel_custom_colors") ||
      '{"bg":"#2a2e33", "text":"#ffffff", "alpha":95}',
  );

  const hexToRgba = (hex, alpha) => {
    let r = 0,
      g = 0,
      b = 0;
    if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return `rgba(${r},${g},${b},${alpha / 100})`;
  };

  let themeOverrideCSS = "";
  if (savedMode === "dark") {
    themeOverrideCSS = `dialog.lulu-qs-dialog { background: rgba(22, 24, 28, 1) !important; border: 1px solid #d1c5a1 !important; } dialog.lulu-qs-dialog, #lulu-quick-snap-modal { --SmartThemeBlurTintColor: rgba(22, 24, 28, 1) !important; --SmartThemeBotMesColor: rgba(32, 35, 40, 1) !important; --SmartThemeBodyColor: #c0c2c8 !important; --SmartThemeQuoteColor: #d1c5a1 !important; --SmartThemeBorderColor: #3d414d !important; color: #c0c2c8 !important; }`;
  } else if (savedMode === "light") {
    themeOverrideCSS = `dialog.lulu-qs-dialog { background: rgba(253, 246, 227, 1) !important; border: 1px solid #8b5d33 !important; } dialog.lulu-qs-dialog, #lulu-quick-snap-modal { --SmartThemeBlurTintColor: rgba(253, 246, 227, 1) !important; --SmartThemeBotMesColor: rgba(255, 251, 240, 1) !important; --SmartThemeBodyColor: #4a3b32 !important; --SmartThemeQuoteColor: #8b5d33 !important; --SmartThemeBorderColor: #e0d0b8 !important; color: #4a3b32 !important; } dialog.lulu-qs-dialog *, #lulu-quick-snap-modal * { text-shadow: none !important; }`;
  } else if (savedMode === "custom") {
    const bgRgba = hexToRgba(savedCustom.bg, savedCustom.alpha);
    themeOverrideCSS = `dialog.lulu-qs-dialog { background: ${bgRgba} !important; border: 1px solid var(--SmartThemeQuoteColor) !important; } dialog.lulu-qs-dialog, #lulu-quick-snap-modal { --SmartThemeBlurTintColor: ${bgRgba} !important; --SmartThemeBotMesColor: ${savedCustom.bg} !important; --SmartThemeBodyColor: ${savedCustom.text} !important; color: ${savedCustom.text} !important; }`;
  }

  const customCss = `<style>.lulu-qs-btn-hover:hover { filter: brightness(1.2); } .lulu-qs-item { transition: 0.2s; } .lulu-qs-item:hover { border-color: var(--SmartThemeQuoteColor) !important; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,0.1); } .lulu-qs-active { border-color: #51cf66 !important; background: rgba(81, 207, 102, 0.05) !important; } dialog.lulu-qs-dialog { background: var(--SmartThemeBlurTintColor) !important; border: 1px solid var(--SmartThemeBorderColor) !important; border-radius: 12px; } dialog.lulu-qs-dialog::backdrop { background: rgba(0,0,0,0.4) !important; backdrop-filter: blur(4px) !important; } @media (max-width: 768px) { #lulu-quick-snap-modal { min-width: unset !important; width: 85vw !important; padding: 5px !important; } .lulu-qs-item { padding: 10px !important; gap: 8px !important; } } ${themeOverrideCSS} </style>`;

  let html = `${customCss}<div id="lulu-quick-snap-modal" style="padding:10px; font-family:sans-serif; min-width:320px; max-width:550px;"><h3 style="margin-top:0; color:var(--SmartThemeQuoteColor); border-bottom:2px solid var(--SmartThemeBorderColor); padding-bottom:10px; font-size: 16px; display:flex; align-items:center; justify-content:space-between; gap:8px;"><span><i class="fa-solid fa-bolt" style="color:#fcc419;"></i> 极速快照控制台</span><span id="lulu-qs-status-text" style="color:var(--SmartThemeQuoteColor); font-size: 12px; font-weight:normal;">正在检测状态...</span></h3><div style="margin-bottom:10px;"><input type="text" id="lulu-qs-search" class="text_pole" placeholder="🔍 检索快照名称..." style="width:100%; box-sizing:border-box; padding:8px; border-radius:6px; font-size:13px; margin-bottom:10px;"><button id="lulu-qs-clear-all" class="menu_button interactable btn-danger lulu-qs-btn-hover" style="width:100%; margin:0; border:none; padding:10px; border-radius:6px; background:rgba(255, 107, 107, 0.1); color:#ff6b6b; font-weight:bold; font-size:13px; display:flex; justify-content:center; align-items:center; gap:8px;"><i class="fa-solid fa-power-off"></i> 一键关闭当前所有全局世界书</button></div><div style="max-height: 50vh; overflow-y: auto; display:flex; flex-direction:column; gap:10px; padding:4px;" class="scrollableInnerFull">`;
  const snapEntries = Object.entries(snapshots);
  if (snapEntries.length === 0) {
    html += `<div style="color:gray; text-align:center; padding: 30px; background:var(--SmartThemeBlurTintColor, rgba(0,0,0,0.1)); border-radius:8px; border:1px dashed var(--SmartThemeBorderColor);">存储库目前是空的哦，<br>可以先去主页面的重度面板收纳一些快照进来呀~</div>`;
  } else {
    snapEntries.forEach(([name, snapData]) => {
      const isDetailed =
        !Array.isArray(snapData) && snapData.type === "detailed";
      const wbs = isDetailed
        ? Object.keys(snapData.data)
        : Array.isArray(snapData)
          ? snapData
          : snapData.wbs;
      const safeName = btoa(unescape(encodeURIComponent(name))).replace(
        /[^a-zA-Z0-9]/g,
        "",
      );
      html += `<div class="lulu-qs-item" data-itemname="${safeName}" style="background:var(--SmartThemeBotMesColor); border:1px solid var(--SmartThemeBorderColor); border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center; gap: 10px;"><div style="flex:1; min-width:0;"><div style="font-weight:bold; font-size:14.5px; color:var(--SmartThemeBodyColor); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><i class="fa-solid ${isDetailed ? "fa-puzzle-piece" : "fa-camera-retro"}" style="color:var(--SmartThemeQuoteColor);"></i> ${name}</div><div style="font-size:11px; color:gray; margin-top:6px; display:flex; align-items:center; gap:6px;"><span>${isDetailed ? "复合场景" : "基础组合"} | 共涉及 ${wbs.length || 0} 本书</span></div><div class="lulu-qs-badge" data-badgename="${safeName}" style="display:none; margin-top:6px; font-size:11px; color:#51cf66; font-weight:bold;"><i class="fa-solid fa-circle-check"></i> 当前全局生效中</div></div><button class="menu_button interactable btn-success lulu-qs-btn-hover lulu-qs-apply-btn" data-btnname="${safeName}" data-rawname="${encodeURIComponent(name)}" style="margin:0; border:none; border-radius:6px; font-size:13px; font-weight:bold; padding: 8px 14px; flex-shrink:0; display:inline-flex; align-items:center; justify-content:center; gap:6px; white-space:nowrap !important; word-break:keep-all;">运行 <i class="fa-solid fa-play"></i></button></div>`;
    });
  }
  html += `</div></div>`;

  const popup = new SillyTavern.Popup(
    $(html),
    SillyTavern.POPUP_TYPE.TEXT,
    "",
    {
      allowVerticalScrolling: true,
      okButton: "关闭面板",
      onOpen: () => {
        const $dlg = $(popup.dlg);
        $dlg.addClass("lulu-qs-dialog");
        $dlg.find("#lulu-qs-search").on("input", function () {
          const kw = $(this).val().toLowerCase();
          $dlg.find(".lulu-qs-item").each(function () {
            const name = decodeURIComponent(
              $(this).find(".lulu-qs-apply-btn").attr("data-rawname"),
            ).toLowerCase();
            $(this).toggle(name.includes(kw));
          });
        });
        const checkActiveSnapshot = async () => {
          $dlg
            .find("#lulu-qs-status-text")
            .html('<i class="fa-solid fa-spinner fa-spin"></i> 侦测中...');
          $dlg.find(".lulu-qs-badge").hide();
          $dlg.find(".lulu-qs-item").removeClass("lulu-qs-active");
          $dlg
            .find(".lulu-qs-apply-btn")
            .removeClass("btn-primary")
            .addClass("btn-success")
            .html('运行 <i class="fa-solid fa-play"></i>')
            .css("opacity", "1");
          const currentGlobals =
            typeof getGlobalWorldbookNames === "function"
              ? getGlobalWorldbookNames()
              : [];
          for (const [name, snapData] of Object.entries(snapshots)) {
            const safeName = btoa(unescape(encodeURIComponent(name))).replace(
              /[^a-zA-Z0-9]/g,
              "",
            );
            const isDetailed =
              !Array.isArray(snapData) && snapData.type === "detailed";
            let isActive = false;
            if (!isDetailed) {
              const wbs = Array.isArray(snapData) ? snapData : snapData.wbs;
              if (currentGlobals.length === (wbs?.length || 0)) {
                let a = [...currentGlobals].sort();
                let b = [...(wbs || [])].sort();
                isActive = a.every((val, index) => val === b[index]);
              }
            } else {
              const targetWbNames = Object.keys(snapData.data);
              if (currentGlobals.length === targetWbNames.length) {
                let a = [...currentGlobals].sort();
                let b = [...targetWbNames].sort();
                if (a.every((val, index) => val === b[index])) {
                  let deepMatch = true;
                  for (const wbName of targetWbNames) {
                    try {
                      let wbEntries = await getWorldbook(wbName);
                      let enabledUIDsInWb = wbEntries
                        .filter((e) => e.enabled)
                        .map((e) => e.uid)
                        .sort();
                      let targetUIDs = [...snapData.data[wbName]].sort();
                      if (
                        enabledUIDsInWb.length !== targetUIDs.length ||
                        !enabledUIDsInWb.every(
                          (val, idx) => val === targetUIDs[idx],
                        )
                      ) {
                        deepMatch = false;
                        break;
                      }
                    } catch (e) {
                      deepMatch = false;
                      break;
                    }
                  }
                  isActive = deepMatch;
                }
              }
            }
            if (isActive) {
              $dlg
                .find(`.lulu-qs-badge[data-badgename="${safeName}"]`)
                .fadeIn("fast");
              $dlg
                .find(`.lulu-qs-item[data-itemname="${safeName}"]`)
                .addClass("lulu-qs-active");
              $dlg
                .find(`.lulu-qs-apply-btn[data-btnname="${safeName}"]`)
                .removeClass("btn-success")
                .addClass("btn-primary")
                .html('生效中 <i class="fa-solid fa-check"></i>')
                .css("opacity", "0.7");
            }
          }
          $dlg
            .find("#lulu-qs-status-text")
            .html('<i class="fa-solid fa-eye"></i> 状态已同步');
        };
        checkActiveSnapshot();
        $dlg.find("#lulu-qs-clear-all").on("click", async () => {
          toastr.info("收到！清扫世界书占用的空间...");
          try {
            await rebindGlobalWorldbooks([]);
            toastr.success("✨ 所有的全局世界书都关掉啦~");
            checkActiveSnapshot();
          } catch (e) {
            toastr.error("卸载失败...");
          }
        });
        $dlg.find(".lulu-qs-apply-btn").on("click", async function () {
          if ($(this).hasClass("btn-primary"))
            return toastr.info("目前已经应用了，不需要重复应用哦！(๑>؂<๑)");
          const sName = decodeURIComponent($(this).attr("data-rawname"));
          const sData = snapshots[sName];
          const isDetailed = !Array.isArray(sData) && sData.type === "detailed";
          toastr.info(`正在为您布置场景 [${sName}] ...请稍后`);
          $dlg.find(".lulu-qs-apply-btn").css("pointer-events", "none");
          try {
            if (isDetailed) {
              const dataFields = sData.data;
              const allWbNames = getWorldbookNames(),
                targetWbNames = Object.keys(dataFields);
              for (const wbName of allWbNames) {
                let wbEntries = await getWorldbook(wbName),
                  changed = false;
                if (targetWbNames.includes(wbName)) {
                  const enabledUIDs = dataFields[wbName];
                  wbEntries.forEach((entry) => {
                    const shouldBeEnabled = enabledUIDs.includes(entry.uid);
                    if (entry.enabled !== shouldBeEnabled) {
                      entry.enabled = shouldBeEnabled;
                      changed = true;
                    }
                  });
                } else {
                  wbEntries.forEach((entry) => {
                    if (entry.enabled) {
                      entry.enabled = false;
                      changed = true;
                    }
                  });
                }
                if (changed) await replaceWorldbook(wbName, wbEntries);
              }
              await rebindGlobalWorldbooks(targetWbNames);
            } else {
              const wbs = Array.isArray(sData) ? sData : sData.wbs;
              await rebindGlobalWorldbooks(wbs);
            }
            toastr.success(`✨ 快照 [${sName}] 切换大成功！`);
            await checkActiveSnapshot();
          } catch (e) {
            toastr.error(`出现了小意外：${e.message}`);
          } finally {
            $dlg.find(".lulu-qs-apply-btn").css("pointer-events", "auto");
          }
        });
      },
    },
  );
  await popup.show();
};

window.luluWbInitTabType = "global";
const toggleFloatingButton = (show, forceUpdate = false) => {
  if (!show) {
    $("#lulu-wb-floating-btn").remove();
    $("#lulu-wb-floating-style").remove();
    return;
  }
  if ($("#lulu-wb-floating-btn").length > 0 && !forceUpdate) return;
  if (forceUpdate) {
    $("#lulu-wb-floating-style").remove();
  }
  const flConf = JSON.parse(
    localStorage.getItem("lulu_wb_floating_config") ||
      '{"size": 48, "opacity": 0.8}',
  );
  if ($("#lulu-wb-floating-style").length === 0) {
    const styleHtml = `<style id="lulu-wb-floating-style"> #lulu-wb-floating-btn { position: fixed !important; top: 45vh !important; right: 15px !important; width: ${flConf.size}px !important; height: ${flConf.size}px !important; opacity: ${flConf.opacity} !important; background: var(--SmartThemeBotMesColor, #2a2e33) !important; color: var(--SmartThemeQuoteColor, #70a1ff) !important; border: 2px solid var(--SmartThemeQuoteColor, #70a1ff) !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; font-size: ${flConf.size * 0.45}px !important; cursor: pointer !important; box-shadow: 0 4px 12px rgba(0,0,0,0.6) !important; z-index: 2147483647 !important; user-select: none !important; touch-action: none !important; -webkit-tap-highlight-color: transparent !important; transition: transform 0.2s, opacity 0.2s !important; } #lulu-wb-floating-btn:active { transform: scale(0.9) !important; } #lulu-wb-floating-btn:hover { opacity: 1 !important; } .lulu-float-menu-opts { position: absolute; right: calc(100% + 10px); top: 50%; transform: translateY(-50%); display: flex; gap: 8px; background: var(--SmartThemeBlurTintColor); padding: 8px; border-radius: 8px; border: 1px solid var(--SmartThemeBorderColor); box-shadow: 0 4px 8px rgba(0,0,0,0.4); opacity: 0; pointer-events: none; transition: 0.2s; white-space: nowrap; } .lulu-float-menu-opts.show { opacity: 1; pointer-events: auto; } .lulu-float-btn-opt { cursor: pointer; padding: 6px 12px; font-size: 13px; font-weight: bold; color: var(--SmartThemeBodyColor); background: var(--SmartThemeBotMesColor); border: 1px solid var(--SmartThemeBorderColor); border-radius: 6px; } .lulu-float-btn-opt:hover { background: var(--SmartThemeQuoteColor); color: #fff; } </style>`;
    $("head").append(styleHtml);
  }
  if (forceUpdate && $("#lulu-wb-floating-btn").length > 0) return;
  const $floatBtn = $("<div>", { id: "lulu-wb-floating-btn" })
    .append($("<i>", { class: "fa-solid fa-book-atlas" }))
    .append(
      $("<div>", { class: "lulu-float-menu-opts" })
        .append(
          $("<button>", {
            class: "lulu-float-btn-opt",
            html: '<i class="fa-solid fa-bolt" style="color:#fcc419;"></i> 极速快照',
          }).on("click", (e) => {
            e.stopPropagation();
            clearTimeout(clickTimer);
            $floatBtn.find(".lulu-float-menu-opts").removeClass("show");
            window.luluOpenQuickSnapshotView();
          }),
        )
        .append(
          $("<button>", {
            class: "lulu-float-btn-opt",
            html: '<i class="fa-solid fa-earth-asia" style="color:#51cf66;"></i> 全局',
          }).on("click", (e) => {
            e.stopPropagation();
            window.luluWbInitTabType = "global";
            $("#option_lulu_wb_manager").click();
          }),
        )
        .append(
          $("<button>", {
            class: "lulu-float-btn-opt",
            html: '<i class="fa-solid fa-user-astronaut" style="color:#339af0;"></i> 当前角色',
          }).on("click", (e) => {
            e.stopPropagation();
            window.luluWbInitTabType = "char";
            $("#option_lulu_wb_manager").click();
          }),
        ),
    )
    .appendTo("#app_container, body");
  const btnNode = $floatBtn[0];
  let isDragging = false;
  let startX, startY, initX, initY, clickTimer;
  btnNode.addEventListener("pointerdown", (e) => {
    if ($(e.target).closest(".lulu-float-menu-opts").length) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    try {
      btnNode.setPointerCapture(e.pointerId);
    } catch (err) {}
    isDragging = false;
    startX = e.clientX || 0;
    startY = e.clientY || 0;
    const rect = btnNode.getBoundingClientRect();
    initX = rect.left;
    initY = rect.top;
    const onPointerMove = (ev) => {
      const dx = (ev.clientX || 0) - startX;
      const dy = (ev.clientY || 0) - startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        isDragging = true;
        $floatBtn.find(".lulu-float-menu-opts").removeClass("show");
        btnNode.style.setProperty("left", initX + dx + "px", "important");
        btnNode.style.setProperty("top", initY + dy + "px", "important");
        btnNode.style.setProperty("right", "auto", "important");
        btnNode.style.setProperty("transition", "none", "important");
      }
    };
    const onPointerUp = (ev) => {
      btnNode.removeEventListener("pointermove", onPointerMove);
      btnNode.removeEventListener("pointerup", onPointerUp);
      btnNode.removeEventListener("pointercancel", onPointerUp);
      try {
        btnNode.releasePointerCapture(ev.pointerId);
      } catch (err) {}
      btnNode.style.setProperty(
        "transition",
        "transform 0.2s, opacity 0.2s",
        "important",
      );
    };
    btnNode.addEventListener("pointermove", onPointerMove);
    btnNode.addEventListener("pointerup", onPointerUp);
    btnNode.addEventListener("pointercancel", onPointerUp);
  });
  btnNode.addEventListener("click", (e) => {
    if ($(e.target).closest(".lulu-float-menu-opts").length) return;
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    } else {
      const $menu = $floatBtn.find(".lulu-float-menu-opts");
      $menu.toggleClass("show");
      clearTimeout(clickTimer);
      if ($menu.hasClass("show")) {
        clickTimer = setTimeout(() => $menu.removeClass("show"), 4000);
      }
    }
  });
};
if (localStorage.getItem("lulu_wb_floating_enabled") === "true")
  toggleFloatingButton(true);

const loadBindingCache = () => {
  let vars = getVariables({ type: "global" });
  return vars.lulu_wb_binding_cache || null;
};
const saveBindingCache = (cacheObj) => {
  updateVariablesWith(
    (v) => {
      v.lulu_wb_binding_cache = cacheObj;
      return v;
    },
    { type: "global" },
  );
};

$menuBtn.on("click", async () => {
  $("#options").hide();

  const customCSS = `
        <style>
            dialog.wb-manager-dialog { width: 92vw !important; max-width: 1600px !important; max-height: 92vh !important; transition: zoom 0.2s ease-out; overflow-y: auto !important; overflow-x: hidden !important; font-family: sans-serif; background: var(--SmartThemeBlurTintColor) !important; }
            dialog.wb-manager-dialog::backdrop { background: rgba(0,0,0,0.4) !important; backdrop-filter: blur(4px) !important; }

            #wb-manager-panel h3 { font-size: 15px; margin: 10px 0 8px 0; border-bottom: 2px solid var(--SmartThemeBorderColor); padding-bottom: 5px; color: var(--SmartThemeQuoteColor); }

            .wb-tab-strip { display: flex; width: 100%; border-bottom: 2px solid var(--SmartThemeBorderColor); margin-bottom: 12px; gap: 4px; }
            .wb-tab-btn { flex: 1; padding: 12px; text-align: center; cursor: pointer; border-radius: 6px 6px 0 0; background: rgba(0,0,0,0.1); color: gray; font-size: 15px; font-weight: bold; transition: 0.2s; border: 1px solid transparent; border-bottom: none; }
            .wb-tab-btn:hover { background: rgba(0,0,0,0.2); color: var(--SmartThemeBodyColor); }
            .wb-tab-btn.active { background: var(--SmartThemeBotMesColor); color: var(--SmartThemeQuoteColor); border-color: var(--SmartThemeBorderColor); box-shadow: 0 -2px 5px rgba(0,0,0,0.1); }

            .wb-list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 10px; align-content: start; max-height: 55vh; overflow-y: auto; background: var(--SmartThemeBlurTintColor); border-radius: 8px; border: 1px solid var(--SmartThemeBorderColor); padding: 10px; position: relative; }
            .wb-snapshot-list { display: flex; flex-direction: column; gap: 8px; max-height: 35vh; overflow-y: auto; background: var(--SmartThemeBlurTintColor); border-radius: 8px; border: 1px solid var(--SmartThemeBorderColor); padding: 10px; }

            .wb-item-wrapper { display: flex; flex-direction: column; background: var(--SmartThemeBotMesColor); border-radius: 6px; border: 1px solid var(--SmartThemeBorderColor); transition: 0.2s; overflow: hidden; padding: 10px; gap: 4px; }
            .wb-item-wrapper:hover { border-color: var(--SmartThemeQuoteColor); box-shadow: 0 4px 8px rgba(0,0,0,0.1); transform: translateY(-1px); z-index: 10; }

            .wb-item-header { display: flex; justify-content: flex-start; align-items: flex-start; gap: 8px; width: 100%; overflow: hidden; }
            .wb-item-title-area { display: flex; align-items: flex-start; gap: 8px; flex: 1; min-width: 0; padding-bottom: 2px; }
            .wb-name-text { font-size: 15px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; color: var(--SmartThemeBodyColor); }

            .wb-item-bottom { display: flex; justify-content: space-between; align-items: flex-end; gap: 8px; margin-top: 4px; border-top: 1px dashed rgba(125,125,125, 0.2); padding-top: 8px; flex-wrap: wrap; }
            .wb-tag-area { display: flex; flex-wrap: wrap; gap: 5px; flex: 1; align-items: center; min-width: 0; }
            .wb-item-actions { display: flex; gap: 5px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }

            @keyframes wb-highlight-flash { 0%, 100% { background-color: var(--SmartThemeBotMesColor); } 50% { background-color: var(--SmartThemeQuoteColor); } }
            .wb-highlight { animation: wb-highlight-flash 1s ease-in-out; }

            .wb-icon-btn { width: 28px; height: 28px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid var(--SmartThemeBorderColor); background: var(--SmartThemeBlurTintColor); color: var(--SmartThemeBodyColor); transition: 0.2s; font-size: 13px; }
            .wb-icon-btn:hover { background: var(--SmartThemeQuoteColor); color: #fff; border-color: var(--SmartThemeQuoteColor); }
            .wb-icon-btn.hover-red:hover { background: #ff6b6b; color: #fff; border-color: #ff6b6b; }
            .wb-icon-btn.hover-yellow:hover { background: #fcc419; color: #fff; border-color: #fcc419; }
            .wb-icon-btn.hover-blue:hover { background: #339af0; color: #fff; border-color: #339af0; }

            .wb-bind-tag { font-size: 11px; border-radius: 4px; padding: 4px 8px; display: inline-flex; align-items: center; gap: 5px; font-weight: bold; cursor: pointer; transition: 0.2s; }
            .wb-bind-tag:hover { filter: brightness(1.2); }

            .wb-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
            .wb-controls-group { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; flex-shrink: 0; justify-content: flex-end;}

            .wb-btn-group { display: flex; gap: 10px; margin: 10px 0; flex-wrap: wrap; }
            .wb-action-btn { flex: 1; min-width: 140px; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; padding: 10px; border-radius: 6px; background: transparent; color: var(--SmartThemeBodyColor); border: 1px solid var(--SmartThemeBorderColor); transition: 0.2s; font-weight: bold; font-size: 13px; box-sizing: border-box; text-align: center; white-space: nowrap; word-break: keep-all; }
            .wb-action-btn:hover { background: var(--SmartThemeBlurTintColor); box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .wb-nowrap-btn { white-space: nowrap !important; flex-shrink: 0 !important; word-break: keep-all !important; display: inline-flex; align-items: center; justify-content: center; gap: 5px; }

            .btn-primary { color: var(--SmartThemeQuoteColor) !important; border-color: var(--SmartThemeQuoteColor) !important; background: rgba(125, 125, 125, 0.05) !important;}
            .btn-primary:hover { background: var(--SmartThemeQuoteColor) !important; color: #fff !important; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }

            .btn-success { color: #51cf66 !important; border-color: #51cf66 !important; background: rgba(81, 207, 102, 0.05) !important; }
            .btn-success:hover { background: #51cf66 !important; color: #fff !important; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }

            .btn-danger { color: #ff6b6b !important; border-color: #ff6b6b !important; background: rgba(255, 107, 107, 0.05) !important; }
            .btn-danger:hover { background: #ff6b6b !important; color: #fff !important; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }

            .btn-warning { color: #fcc419 !important; border-color: #fcc419 !important; background: rgba(252, 196, 25, 0.05) !important; }
            .btn-warning:hover { background: #fcc419 !important; color: #212529 !important; }

            #dsnap-container { display: flex; min-height: 50vh; max-height: 65vh; border: 1px solid var(--SmartThemeBorderColor); border-radius: 6px; padding: 10px; background: var(--SmartThemeBotMesColor); overflow: hidden; }
            #dsnap-wb-list-wrapper { flex: 0 0 40%; max-width: 380px; display: flex; flex-direction: column; border-right: 2px solid var(--SmartThemeBorderColor); padding-right: 10px; overflow: hidden;}
            #dsnap-wb-list { flex: 1; overflow-y: auto; overflow-x: hidden; margin-right: -5px; padding-right: 5px;}
            #dsnap-entry-list-wrapper { flex: 1; display: flex; flex-direction: column; padding-left: 10px; min-width: 0; overflow: hidden;}
            #dsnap-entry-list { flex: 1; overflow-y: auto; overflow-x: hidden;}

            .dsnap-wb-item { padding: 8px; border-radius: 4px; cursor: pointer; border: 1px solid transparent; transition: 0.1s; }
            .dsnap-wb-item.active { background: var(--SmartThemeQuoteColor); color: #fff; font-weight: bold; border-color: var(--SmartThemeQuoteColor); box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
            .dsnap-wb-item.active b { color: #fff !important; }
            .dsnap-wb-item:not(.active):hover { background: var(--SmartThemeBlurTintColor); }

            .dsnap-entry-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px; border-radius: 4px; transition:0.1s; border-bottom: 1px solid rgba(125,125,125,0.1); }
            .dsnap-entry-item:hover { background: var(--SmartThemeBlurTintColor); }
            .dsnap-entry-body { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
            .dsnap-entry-title { font-weight: bold; font-size: 13px; line-height: 1.3; word-break: break-word; }
            .dsnap-entry-meta-row { display: flex; gap: 6px; flex-wrap: nowrap; font-size: 11px; align-items: center; overflow-x: auto; overflow-y: hidden; white-space: nowrap; }
            .dsnap-entry-pos { font-size: 11px; color: var(--SmartThemeBodyColor); background: rgba(125,125,125,0.08); border: 1px solid var(--SmartThemeBorderColor); border-radius: 4px; padding: 2px 6px; display: inline-flex; align-items: center; flex: 0 0 auto; white-space: nowrap; max-width: none; }
            .dsnap-entry-preview { font-size: 10.8px; color: gray; line-height: 1.28; margin-top: 2px; border-top: 1px dashed rgba(125,125,125,0.25); padding-top: 4px; max-height: 5.2em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow-wrap: anywhere; }

            .wb-input-dt { width: 100%; box-sizing: border-box; padding: 8px; border-radius: 4px; border: 1px solid var(--SmartThemeBorderColor); background: var(--SmartThemeBlurTintColor); color: var(--SmartThemeBodyColor); transition: 0.2s; font-family: inherit;}
            .wb-input-dt:focus { border-color: var(--SmartThemeQuoteColor); outline: none; }
            .wb-form-group { display: flex; flex-direction: column; margin-bottom: 10px;}

            .badge-blue { background: rgba(51, 154, 240, 0.15); color: #339af0; border: 1px solid #339af0; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-right: 4px; white-space: nowrap; }
            .badge-green { background: rgba(81, 207, 102, 0.15); color: #51cf66; border: 1px solid #51cf66; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-right: 4px; white-space: nowrap; }
            .badge-grey { background: rgba(150, 150, 150, 0.15); color: #999; border: 1px solid #999; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-right: 4px; white-space: nowrap; }

            /* ✨ 鹿酱新增：条目编辑分栏专用核心样式 ✨ */
            #wb-entry-split-wrapper { display: flex; min-height: 55vh; max-height: 65vh; border: 1px solid var(--SmartThemeBorderColor); border-radius: 6px; padding: 10px; background: var(--SmartThemeBotMesColor); gap: 10px; position: relative; overflow: hidden; }
            #wb-entry-list-side { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; transition: 0.3s ease; }
            #wb-entry-detail-side { flex: 1; display: none; flex-direction: column; border-left: 2px solid var(--SmartThemeBorderColor); padding-left: 10px; min-width: 0; transition: 0.3s ease; overflow: hidden; }

            .content-preview { font-size: 11px; color: gray; margin-top: 6px; max-height: 3.2em; overflow: hidden; text-overflow: ellipsis; white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; border-top: 1px dashed rgba(125,125,125,0.3); padding-top: 4px; }

            /* 条目编辑模式：顶部控制区压缩，把空间优先让给核心编辑区 */
            #wb-manager-panel.wb-entry-focus #wb-top-control-bar { margin-bottom: 3px !important; padding-bottom: 3px !important; gap: 4px !important; }
            #wb-manager-panel.wb-entry-focus #wb-top-control-bar h2 { font-size: 14px !important; margin: 0 !important; }
            #wb-manager-panel.wb-entry-focus #wb-top-control-bar label,
            #wb-manager-panel.wb-entry-focus #wb-top-control-bar button,
            #wb-manager-panel.wb-entry-focus #wb-top-control-bar #wb-zoom-val { font-size: 11px !important; }
            #wb-manager-panel.wb-entry-focus #wb-top-control-bar label,
            #wb-manager-panel.wb-entry-focus #wb-top-control-bar button { padding-top: 2px !important; padding-bottom: 2px !important; }

            /* 📱 手机端适配 */
            @media (max-width: 768px) {
                dialog.wb-manager-dialog { width: 96vw !important; max-width: 96vw !important; max-height: 96dvh !important; overflow-y: auto !important; overflow-x: hidden !important; }
                #wb-manager-panel { padding: 3px !important; min-height: auto !important; height: auto !important; max-height: none !important; overflow: visible !important; }

                /* 顶部区域强压缩 */
                #wb-top-control-bar { gap: 6px !important; margin-bottom: 4px !important; padding-bottom: 4px !important; }
                #wb-top-control-bar > div:first-child { gap: 6px !important; }
                #wb-top-control-bar h2 { font-size: 14px !important; }
                #wb-top-control-bar label { padding: 3px 8px !important; font-size: 11px !important; }
                #wb-top-control-bar button { padding: 3px 8px !important; font-size: 11px !important; }
                #wb-top-control-bar #wb-zoom-val { font-size: 12px !important; min-width: 40px !important; }
                #lulu-float-config-area { margin-left: 0 !important; width: 100%; }

                #wb-theme-config-panel { padding: 8px !important; margin-bottom: 8px !important; }
                #wb-tab-strip { margin-bottom: 8px !important; }
                .wb-tab-btn { padding: 9px 6px !important; font-size: 13px !important; }
                #wb-search-input { margin-bottom: 6px !important; padding: 7px !important; font-size: 12px !important; }

                /* 全局筛选区压缩（你圈的第二块） */
                .wb-toolbar { flex-direction: column; align-items: stretch; gap: 6px; margin-bottom: 6px; }
                .wb-toolbar > div:first-child { width: 100%; display: grid; grid-template-columns: 1fr; gap: 6px; }
                .wb-toolbar > div:first-child > div:first-child { grid-column: 1 / -1; display: grid !important; grid-template-columns: 1fr auto; gap: 6px; margin-right: 0 !important; width: 100%; }
                .wb-toolbar > div:first-child > #wb-filter-state { grid-column: 1 / -1; }
                .wb-toolbar > div:first-child > #wb-sort-select { grid-column: 1 / -1; }
                .wb-toolbar > div:first-child > label { grid-column: 1 / -1; justify-content: flex-start; }
                .wb-controls-group {
                    width: 100%;
                    display: grid !important;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px;
                }
                .wb-toolbar select,
                .wb-toolbar .wb-input-dt,
                .wb-toolbar label,
                .wb-controls-group .menu_button {
                    width: 100% !important;
                    min-width: 0 !important;
                    margin: 0 !important;
                    font-size: 11.2px !important;
                    padding: 6px !important;
                    box-sizing: border-box;
                    justify-content: center;
                }

                #wb-main-close-row { display: grid !important; grid-template-columns: 1fr !important; margin: 6px 0 !important; }
                #wb-main-close-row #wb-btn-clear { display: flex !important; width: 100% !important; min-width: 0 !important; grid-column: 1 / -1 !important; }

                #wb-main-view > .wb-btn-group:not(#wb-main-close-row) { display: grid !important; grid-template-columns: 1fr 1fr; gap: 6px; margin: 6px 0 !important; }
                #wb-main-ops-grid { grid-template-columns: 1fr 1fr !important; }
                #wb-main-ops-grid .wb-action-btn { width: 100%; min-width: 0 !important; padding: 7px 4px !important; font-size: 10.8px !important; line-height: 1.18 !important; }
                .wb-action-btn { width: 100%; min-width: 0 !important; padding: 8px 6px !important; font-size: 11.5px !important; }

                .wb-list-grid { grid-template-columns: 1fr; padding: 7px; gap: 8px; }
                .wb-item-wrapper { padding: 8px; }
                .wb-item-bottom { flex-direction: row; align-items: center; gap: 6px; flex-wrap: wrap; }
                .wb-item-actions { width: auto; justify-content: flex-start; flex-wrap: nowrap !important; gap: 4px !important; flex-shrink: 0; }
                .wb-item-actions .wb-icon-btn { width: 24px !important; height: 24px !important; font-size: 10.5px !important; }
                .wb-tag-area { margin-bottom: 0; flex: 1 1 100%; order: 2; }
                .wb-name-text { white-space: normal; overflow: visible; text-overflow: initial; word-break: break-word; line-height: 1.35; }

                #dsnap-container { flex-direction: column; height: 76vh; max-height: unset; }
                #dsnap-wb-list-wrapper { max-width: 100%; border-right: none; border-bottom: 2px solid var(--SmartThemeBorderColor); padding-right: 0; padding-bottom: 8px; margin-bottom: 8px; flex: 0 0 46%; min-height: 190px; }
                #dsnap-wb-list-wrapper .dsnap-wb-item { font-size: 11.2px !important; padding: 7px !important; }
                #dsnap-entry-list-wrapper { padding-left: 0; flex: 1; min-height: 160px; }
                #dsnap-entry-list-wrapper > div:first-child { margin-bottom: 4px !important; padding-bottom: 4px !important; }
                #dsnap-entry-list-wrapper > div:first-child > span { font-size: 10.8px !important; }
                #dsnap-entry-sort { font-size: 10.5px !important; padding: 3px 5px !important; }
                #dsnap-entry-list-wrapper label { font-size: 10.2px !important; padding: 2px 6px !important; }
                .dsnap-entry-item { gap: 6px !important; padding: 6px !important; }
                .dsnap-entry-title { font-size: 11.6px !important; line-height: 1.22 !important; }
                .dsnap-entry-meta-row { gap: 4px !important; flex-wrap: nowrap !important; overflow-x: auto; overflow-y: hidden; white-space: nowrap; }
                .dsnap-entry-item .badge-blue,
                .dsnap-entry-item .badge-green,
                .dsnap-entry-item .badge-grey,
                .dsnap-entry-pos { font-size: 9.8px !important; padding: 1px 5px !important; margin-right: 0 !important; white-space: nowrap; flex: 0 0 auto; }
                .dsnap-entry-pos { max-width: none !important; }
                .dsnap-entry-preview { font-size: 10px !important; line-height: 1.22 !important; max-height: 4.9em !important; -webkit-line-clamp: 4 !important; }
                #wb-detailed-snap-view .wb-btn-group { order: -1; margin-bottom: 10px; }

                /* 条目页：继续强压缩顶部 */
                #wb-entry-view > div:first-child { margin-bottom: 4px !important; gap: 4px !important; padding-bottom: 2px; }
                #wb-entry-view > div:first-child label { padding: 3px 7px !important; font-size: 10.8px !important; }
                #wb-entry-list-side > div:first-child { gap: 5px !important; margin-bottom: 5px !important; }
                #wb-entry-list-side > div:first-child input,
                #wb-entry-list-side > div:first-child select { padding: 5px !important; font-size: 11.2px !important; }

                #wb-entry-list-side .wb-btn-group { display: grid !important; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 5px !important; }
                #wb-entry-list-side .wb-action-btn { width: 100% !important; min-width: 0 !important; padding: 5px 4px !important; font-size: 10.6px !important; line-height: 1.1 !important; }

                .lulu-ui-group-header { padding: 5px 6px !important; margin-top: 5px !important; font-size: 11px !important; }
                .lulu-ui-group-header .menu_button { padding: 2px 4px !important; font-size: 9.8px !important; }

                /* 关键修复：条目卡片避免“左挤右空” */
                .lulu-wb-entry-item {
                    display: grid !important;
                    grid-template-columns: 18px minmax(0,1fr) 30px;
                    align-items: start;
                    column-gap: 5px !important;
                    row-gap: 3px !important;
                    padding: 6px !important;
                    border-left-width: 3px !important;
                }
                .lulu-wb-entry-item > div:nth-child(2) { min-width: 0 !important; width: 100% !important; overflow: hidden; }
                .lulu-wb-entry-item > div:nth-child(2) > div:first-child { font-size: 12px !important; line-height: 1.2 !important; margin-bottom: 2px !important; word-break: break-word !important; }
                .lulu-wb-entry-item > div:nth-child(2) > div:nth-child(2) { font-size: 10.2px !important; line-height: 1.2 !important; gap: 2px !important; }
                .lulu-wb-entry-item input[type="checkbox"] { transform: scale(0.95) !important; margin-top: 1px !important; }
                .lulu-wb-entry-item > div:last-child {
                    display: grid !important;
                    grid-template-columns: 1fr;
                    gap: 3px !important;
                    margin-left: 0 !important;
                    align-self: start;
                }
                .lulu-wb-entry-item .menu_button {
                    min-width: 26px !important;
                    width: 26px !important;
                    height: 24px !important;
                    padding: 0 !important;
                    font-size: 10px !important;
                }

                .content-preview {
                    margin-top: 3px !important;
                    padding-top: 3px !important;
                    font-size: 10.5px !important;
                    line-height: 1.28 !important;
                    max-height: 6.4em !important;
                    -webkit-line-clamp: 5 !important;
                    overflow-wrap: anywhere;
                }

                #wb-entry-split-wrapper {
                    height: calc(var(--lulu-mobile-vh, 1vh) * 100 - 60px) !important;
                    min-height: 700px !important;
                    max-height: unset !important;
                    flex-direction: column !important;
                    padding: 3px;
                    gap: 4px !important;
                    overflow: hidden;
                }
                #wb-entry-list-side {
                    width: 100% !important;
                    flex: 0 0 62% !important;
                    min-height: 420px !important;
                    max-height: 66% !important;
                    border-bottom: 2px solid var(--SmartThemeBorderColor);
                    padding-bottom: 3px;
                }
                #wb-entry-container { min-height: 240px !important; max-height: none !important; }
                #wb-entry-batch-actions {
                    max-height: 108px;
                    overflow-y: auto;
                    padding: 6px !important;
                    gap: 6px !important;
                    margin-bottom: 6px !important;
                }
                #wb-entry-batch-actions > div:first-child {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 4px !important;
                    align-items: center !important;
                }
                #wb-entry-batch-actions > div:first-child > div:first-child {
                    grid-column: 1 / -1;
                    display: grid !important;
                    grid-template-columns: auto 1fr 1fr;
                    align-items: center;
                    gap: 4px !important;
                }
                #wb-entry-batch-actions > div:first-child > div:first-child > span {
                    font-size: 11px !important;
                    margin: 0 !important;
                    white-space: nowrap;
                }
                #wb-entry-batch-actions > div:first-child > div:first-child > button,
                #wb-entry-batch-actions > div:first-child > div:last-child > button {
                    width: 100% !important;
                    min-width: 0 !important;
                    margin: 0 !important;
                    padding: 4px 4px !important;
                    font-size: 10.2px !important;
                    line-height: 1.05 !important;
                    border-width: 1px !important;
                }
                #wb-entry-batch-actions > div:first-child > div:last-child {
                    grid-column: 1 / -1;
                    display: grid !important;
                    grid-template-columns: 1fr 1fr;
                    gap: 4px !important;
                }
                #wb-entry-batch-actions i { font-size: 10px !important; }
                #wb-entry-list-side > .wb-btn-group:last-child {
                    margin-top: 6px !important;
                    gap: 4px !important;
                }
                #wb-entry-list-side > .wb-btn-group:last-child .wb-action-btn {
                    padding: 5px 2px !important;
                    font-size: 10.2px !important;
                }

                #wb-entry-detail-side {
                    position: static !important;
                    display: flex !important;
                    flex: 1 1 auto !important;
                    width: 100% !important;
                    min-height: 0 !important;
                    border-left: none !important;
                    padding: 1px 0 0 0 !important;
                    z-index: auto !important;
                }
                #wb-entry-detail-side > div:first-child {
                    margin-bottom: 2px !important;
                    padding: 0 2px;
                    font-size: 10.8px !important;
                }
                #wb-entry-detail-side > .scrollableInnerFull { padding-right: 0 !important; }
                #wb-entry-detail-side > .scrollableInnerFull > div:first-child {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr;
                    gap: 2px !important;
                    padding: 2px !important;
                    margin-bottom: 2px !important;
                    align-items: end;
                    flex-shrink: 0;
                }
                #wb-entry-detail-side > .scrollableInnerFull > div:first-child > .wb-form-group:nth-child(3) { grid-column: 1 / -1; }
                #wb-entry-detail-side .wb-form-group { margin-bottom: 0 !important; min-width: 0 !important; }
                #wb-entry-detail-side .wb-input-dt { padding: 1px 3px !important; font-size: 10.2px !important; height: 20px !important; }
                #wb-entry-detail-side label { margin-bottom: 0 !important; font-size: 9.3px !important; line-height: 1.05 !important; }
                #wb-entry-detail-side textarea#wb-det-content {
                    flex: 1 !important;
                    min-height: 320px !important;
                    height: auto !important;
                    font-size: 11.6px !important;
                    line-height: 1.35 !important;
                }
                #wb-entry-detail-side .wb-btn-group {
                    margin-top: 3px !important;
                    display: grid !important;
                    grid-template-columns: 1fr 1fr;
                    gap: 3px;
                    flex-shrink: 0;
                }
                #wb-entry-detail-side .wb-action-btn { font-size: 10px !important; padding: 4px 2px !important; }

                #wb-btn-det-close-mobile { display: none !important; }
            }
        </style>
    `;

  const $ui = $(`
        <div id="wb-manager-panel" style="text-align: left; padding: 5px; position: relative; min-height: 450px;">
            ${customCSS}

            <div id="wb-loading-overlay" style="position: absolute; top:0; left:0; width:100%; height:100%; background: var(--SmartThemeBlurTintColor); z-index: 1000; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 8px; text-align: center; font-family: sans-serif;">
                <i class="fa-solid fa-spinner fa-spin fa-3x" style="color: var(--SmartThemeQuoteColor); margin-bottom: 20px;"></i>
                <h3 id="wb-loading-text" style="color: var(--SmartThemeQuoteColor); margin:0;">正在深入检索读取...</h3>
                <div id="wb-loading-sub" style="font-weight: bold; font-size: 16px; margin-top: 15px;"></div>
                <div id="wb-loading-secondary-text" style="font-size: 13px; color: gray; margin-top: 10px;">检索耗时取决于懒加载卡片数量，请稍候</div>
            </div>

            <div id="wb-top-control-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 8px; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <h2 style="margin: 0; font-size: 18px; color: var(--SmartThemeQuoteColor); font-weight: bold; white-space: nowrap;"><i class="fa-solid fa-book-journal-whills"></i> 世界书综合管理中枢</h2>
                    <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; margin: 0; white-space: nowrap; background: rgba(125,125,125,0.1); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--SmartThemeBorderColor);">
                        <input type="checkbox" id="wb-toggle-floating" style="accent-color: var(--SmartThemeQuoteColor); transform: scale(1.1);">
                        <span style="font-weight: bold; color: var(--SmartThemeQuoteColor);">🔮 开启悬浮球</span>
                    </label>
                    <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; margin: 0; white-space: nowrap; background: rgba(125,125,125,0.1); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--SmartThemeBorderColor);">
                        <input type="checkbox" id="wb-toggle-native-magic" style="accent-color: #51cf66; transform: scale(1.1);">
                        <span style="font-weight: bold; color: #51cf66;">🪄 原生分类同步</span>
                    </label>
                    <button id="wb-theme-quick-toggle" class="menu_button interactable" style="margin: 0; padding: 4px 10px; min-width: unset; font-size: 13px; border-radius: 6px; background: rgba(125,125,125,0.1); border: 1px solid var(--SmartThemeBorderColor); flex-shrink: 0; white-space: nowrap;" title="一键切换深色/浅色护眼模式"><i class="fa-solid fa-circle-half-stroke"></i></button>
                    <button id="wb-theme-toggle-btn" class="menu_button interactable" style="margin: 0; padding: 4px 10px; min-width: unset; font-size: 13px; border-radius: 6px; background: rgba(125,125,125,0.1); border: 1px solid var(--SmartThemeBorderColor); flex-shrink: 0; white-space: nowrap;"><i class="fa-solid fa-palette"></i> 色彩微调</button>
                </div>
                <div style="display: flex; gap: 5px; align-items: center; background: var(--SmartThemeBlurTintColor); padding: 3px; border-radius: 6px; border: 1px solid var(--SmartThemeBorderColor); flex-shrink: 0;">
                    <button id="wb-zoom-out" class="menu_button interactable" style="margin:0; padding: 4px 10px; min-width: unset;" title="缩小"><i class="fa-solid fa-minus"></i></button>
                    <span id="wb-zoom-val" style="font-size: 13.5px; font-weight: bold; min-width: 50px; text-align: center;">100%</span>
                    <button id="wb-zoom-in" class="menu_button interactable" style="margin:0; padding: 4px 10px; min-width: unset;" title="放大"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>

            <!-- 皮肤设定的下拉内容区域 -->
            <div id="wb-theme-config-panel" style="display:none; margin-bottom: 12px; border-radius: 8px; border: 1px dashed var(--SmartThemeQuoteColor); background: rgba(0,0,0,0.1); padding: 12px;">
                <div style="font-weight: bold; margin-bottom: 10px; color: var(--SmartThemeQuoteColor); display:flex; align-items:center; gap:6px;">
                    <i class="fa-solid fa-paint-roller"></i> 皮肤调色板
                    <span style="font-weight:normal; font-size:12px; color:gray;">(独立于酒馆全局，随意调整，妈妈再也不用担心我看不清字啦)</span>
                </div>
                <div style="display:flex; gap:12px; align-items: center; flex-wrap: wrap;">
                    <label style="font-size: 13px; font-weight: bold; margin-bottom: 0;">当前模式：</label>
                    <select id="wb-theme-select" class="wb-input-dt" style="width: auto; padding: 6px; margin-bottom:0; min-width: 200px;">
                        <option value="default">✨ 自动融合 (跟随酒馆默认)</option>
                        <option value="dark">🌙 深色护眼 (彻底不透明)</option>
                        <option value="light">☀️ 浅色阅读 (彻底不透明)</option>
                        <option value="custom">🎨 自定义色彩与透明度</option>
                    </select>
                    <div id="wb-theme-custom-opts" style="display:none; align-items:center; gap:10px; flex-wrap: wrap; background:var(--SmartThemeBotMesColor); padding:6px 12px; border-radius:6px; border:1px solid var(--SmartThemeBorderColor);">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <label style="font-size:12px; font-weight:bold;">底色:</label>
                            <input type="color" id="wb-theme-cp-bg" value="#2a2e33" style="width:32px; height:28px; border:none; padding:0; cursor:pointer;" title="主背景色">
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <label style="font-size:12px; font-weight:bold;">文字色:</label>
                            <input type="color" id="wb-theme-cp-text" value="#ffffff" style="width:32px; height:28px; border:none; padding:0; cursor:pointer;" title="文字及部分边框色">
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <label style="font-size:12px; font-weight:bold;">整体背景透明度:</label>
                            <input type="range" id="wb-theme-cp-alpha" min="0" max="100" value="95" style="width:100px; cursor:pointer;">
                            <span id="wb-theme-cp-alpha-val" style="font-size:12px; min-width:30px;">95%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div id="wb-tab-strip" class="wb-tab-strip">
                 <div id="tab-global-btn" class="wb-tab-btn active"><i class="fa-solid fa-earth-asia"></i> 全局库大厅</div>
                 <div id="tab-char-btn" class="wb-tab-btn"><i class="fa-solid fa-user-astronaut"></i> 当前聊天角色</div>
            </div>

            <div id="wb-main-view">
                <input type="text" id="wb-search-input" class="text_pole" placeholder="🔍 输入想要查找的世界书名称，或者已经绑定的角色卡或用户名称..." style="width: 100%; box-sizing: border-box; margin-bottom: 10px; padding: 8px; font-size: 14px;">

                <div class="wb-toolbar">
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                        <div style="display:flex; align-items:center; gap:4px; margin-right:4px;">
                            <select id="wb-category-filter" class="wb-input-dt" style="width: auto; padding: 6px; font-weight:bold; color:var(--SmartThemeQuoteColor);">
                                <option value="all">📁 所有类别</option>
                            </select>
                            <button id="wb-btn-del-category" class="menu_button interactable btn-danger" style="margin: 0; padding: 6px 10px; display:none; border:none; border-radius:4px;" title="彻底删除当前筛选的分类"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                        <select id="wb-filter-state" class="wb-input-dt" style="width: auto; padding: 6px;">
                            <option value="all">🚦 所有状态</option>
                            <option value="enabled">🟢 仅全局启用</option>
                            <option value="disabled">⚪ 仅全局未启用</option>
                        </select>
                        <select id="wb-sort-select" class="wb-input-dt" style="width: auto; padding: 6px;">
                            <option value="default">↕ 默认(启用在前)</option>
                            <option value="az">🔤 名称 A-Z</option>
                            <option value="za">🔡 名称 Z-A</option>
                        </select>
                        <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; margin: 0; white-space: nowrap;">
                            <input type="checkbox" id="wb-filter-unbound" style="accent-color: var(--SmartThemeQuoteColor); transform: scale(1.1);">
                            <span style="font-weight: bold;">仅显示未绑定</span>
                        </label>
                    </div>

                    <div class="wb-controls-group">
                        <button id="wb-btn-force-scan" class="menu_button interactable wb-nowrap-btn" style="margin: 0; padding: 6px 12px; font-size: 12px; background: rgba(51, 154, 240, 0.1); color: #339af0; border: 1px solid #339af0;" title="在面板外部修改了其他没加载卡片的绑定状态？点这里重新翻一遍记忆哦！"><i class="fa-solid fa-rotate-right"></i> 深度重扫</button>
                        <button id="wb-btn-batch-toggle" class="menu_button interactable wb-nowrap-btn btn-warning" style="margin: 0; padding: 6px 12px; font-size: 12px; color: #fcc419; background: rgba(252, 196, 25, 0.1); border-color: #fcc419;"><i class="fa-solid fa-layer-group"></i> 批量操作模式</button>
                        <button id="wb-btn-select-all" class="menu_button interactable wb-nowrap-btn" style="margin: 0; padding: 6px 12px; font-size: 12px;"><i class="fa-solid fa-check-double"></i> 全选当前项</button>
                        <button id="wb-btn-deselect-all" class="menu_button interactable wb-nowrap-btn" style="margin: 0; padding: 6px 12px; font-size: 12px;"><i class="fa-regular fa-square"></i> 撤销当前全选</button>
                        <button id="wb-btn-create-wb" class="menu_button interactable btn-success wb-nowrap-btn" style="margin: 0; padding: 6px 12px; font-size: 12px; border:none;"><i class="fa-solid fa-plus"></i> 新建</button>
                        <button type="button" id="wb-btn-import-wb" class="menu_button interactable btn-success wb-nowrap-btn" style="margin: 0; padding: 6px 12px; font-size: 12px; border:none; background: rgba(32, 201, 151, 0.15); color: #20c997; border: 1px solid rgba(32, 201, 151, 0.5);"><i class="fa-solid fa-file-import"></i> 批量导入</button>
                    </div>
                </div>

                <div class="wb-btn-group" id="wb-main-close-row">
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-clear" style="color: #888;"><i class="fa-solid fa-power-off"></i> 关闭当前所有全局启用</div>
                </div>

                <div class="wb-btn-group" id="wb-main-ops-grid">
                    <div class="wb-action-btn wb-nowrap-btn btn-primary" id="wb-btn-save-snap"><i class="fa-solid fa-box-archive"></i> 将当前勾选存为快照 (全局)</div>
                    <div class="wb-action-btn wb-nowrap-btn btn-primary" id="wb-btn-create-detail-snap"><i class="fa-solid fa-puzzle-piece"></i> 创建复合快照 (全局)</div>
                </div>

                <div id="wb-batch-actions" style="display: none; background: rgba(0,0,0, 0.15); border: 1px dashed var(--SmartThemeQuoteColor); border-radius: 6px; padding: 10px; margin-bottom: 10px; flex-direction: column; gap: 10px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap: wrap; gap: 10px;">
                        <span style="color: var(--SmartThemeQuoteColor); font-weight: bold; font-size: 14px; margin-top: 4px;"><i class="fa-solid fa-check-double"></i> 选中的世界书 (<span id="wb-batch-count">0</span>)：</span>
                        <div style="display:flex; gap: 8px; flex-wrap: wrap;">
                             <button class="menu_button interactable btn-primary wb-nowrap-btn" id="wb-btn-batch-export" style="margin: 0; border: none; font-size: 13px; padding: 6px 14px;"><i class="fa-solid fa-file-export"></i> 批量打包导出</button>
                             <button class="menu_button interactable btn-danger wb-nowrap-btn" id="wb-btn-confirm-delete" style="margin: 0; border: none; font-size: 13px; padding: 6px 14px;"><i class="fa-solid fa-burst"></i> 确认永久删除</button>
                        </div>
                    </div>
                    <div id="wb-batch-selected-list" style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 80px; overflow-y: auto;"></div>
                </div>

                <div class="wb-list-grid scrollableInnerFull" id="wb-container"></div>

                <h3>📸 库预设组合快照列表</h3>
                <div class="wb-snapshot-list scrollableInnerFull" id="wb-snapshot-container"></div>
            </div>

            <div id="wb-char-view" style="display: none; flex-direction: column; height: 100%;">
                <div class="wb-btn-group" style="margin-top: 0;">
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-open-assoc" style="color: #c92a2a; border-color: #c92a2a; background: rgba(201,42,42,0.05);"><i class="fa-solid fa-id-card-clip"></i> 管理绑定世界书</div>
                    <div class="wb-action-btn wb-nowrap-btn btn-primary" id="wb-btn-save-char-snap"><i class="fa-solid fa-camera-retro"></i> 保存当前配置为专属组合</div>
                </div>

                <h3>📚 当前聊天角色绑定的世界书</h3>
                <div style="font-size: 12px; color: gray; margin-bottom: 10px; margin-top: -6px;">* 点击对应卡片即可单独设置角色专用的开关状态逻辑哦，与全局互不干扰哒。</div>
                <div id="wb-char-books-container" class="wb-list-grid scrollableInnerFull" style="margin-bottom: 15px; max-height: 25vh;"></div>

                <div style="display:flex; align-items:center; justify-content:space-between;">
                     <h3 style="margin:0;">📸 当前聊天角色场景快照</h3>
                </div>
                <div style="font-size: 12px; color: gray; margin-bottom: 10px; margin-top: 6px;">* 保存为专属快照后，只需点选“应用该组合”，就能完美复原绑定在此角色身上所有世界书当时的开关状态。</div>
                <div id="wb-char-snap-container" class="wb-snapshot-list scrollableInnerFull"></div>
            </div>

            <div id="wb-assoc-view" style="display: none; height: 100%; flex-direction: column;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: var(--SmartThemeQuoteColor);">
                    <i class="fa-solid fa-link"></i> 分配卡片/用户档案 的绑定书籍
                </div>

                <div style="display: flex; flex-direction: column; gap: 15px; overflow-y: auto; padding-right: 5px;" class="scrollableInnerFull">
                    <div style="background: rgba(0,0,0,0.1); border: 1px solid var(--SmartThemeBorderColor); border-radius: 6px; padding: 12px;">
                        <h3 style="margin-top:0; font-size:14px;"><i class="fa-solid fa-user" style="color:#339af0;"></i> 👤 当前用户 (Persona) 已绑定的世界书</h3>
                        <div style="font-size:12px; color:gray; margin-bottom:10px;">* ✨ 现在在这里可以给当前的 Persona 选择并绑定世界书啦。Persona 一般仅支持绑定一本哦。</div>

                        <div id="wb-assoc-user-add-area" style="margin-bottom: 15px; display:flex; flex-direction:column; gap:8px;">
                            <input type="text" id="wb-assoc-user-add-search" class="text_pole" placeholder="🔍 检索想绑定给 Persona 的世界书..." style="max-width:320px; box-sizing: border-box; padding: 8px;">
                            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                <select id="wb-assoc-user-add-sel" class="wb-input-dt" style="max-width:280px; padding: 8px;"></select>
                                <button id="wb-assoc-user-add-btn" class="menu_button interactable btn-primary wb-nowrap-btn" style="margin:0; padding:8px 12px; border:none; font-size:13px;"><i class="fa-solid fa-plus"></i> 给Persona绑定此书</button>
                            </div>
                        </div>

                        <div id="wb-assoc-user-list" style="display:flex; flex-wrap:wrap; gap:8px;"></div>
                    </div>

                    <div style="background: rgba(0,0,0,0.1); border: 1px solid var(--SmartThemeBorderColor); border-radius: 6px; padding: 12px;">
                        <h3 style="margin-top:0; font-size:14px;"><i class="fa-solid fa-robot" style="color:var(--SmartThemeQuoteColor);"></i> 🤖 当前聊天角色卡已绑定的世界书</h3>
                        <div id="wb-assoc-char-add-area" style="margin-bottom: 15px; display:flex; flex-direction:column; gap:8px;">
                            <input type="text" id="wb-assoc-char-add-search" class="text_pole" placeholder="🔍 检索想绑定的一本世界书..." style="max-width:320px; box-sizing: border-box; padding: 8px;">
                            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                <select id="wb-assoc-char-add-sel" class="wb-input-dt" style="max-width:280px; padding: 8px;"></select>
                                <button id="wb-assoc-char-add-btn" class="menu_button interactable btn-primary wb-nowrap-btn" style="margin:0; padding:8px 12px; border:none; font-size:13px;"><i class="fa-solid fa-plus"></i> 给角色绑定此书</button>
                            </div>
                        </div>

                        <div id="wb-assoc-char-list" style="display:flex; flex-wrap:wrap; gap:8px;"></div>
                    </div>
                </div>

                <div class="wb-btn-group" style="margin-top: 15px; flex-shrink: 0;">
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-assoc-cancel" style="color:#888;"><i class="fa-solid fa-arrow-left"></i> 返回角色调度专区</div>
                </div>
            </div>

            <div id="wb-edit-snap-view" style="display: none; height: 100%; flex-direction: column;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: var(--SmartThemeQuoteColor);">
                    <i class="fa-solid fa-pen-to-square"></i> 编辑组合快照
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="font-size: 13px; font-weight: bold; display:block; margin-bottom:4px;">📝 快照名称</label>
                    <input type="text" id="wb-edit-snap-name" class="wb-input-dt" placeholder="新快照的响亮名称...">
                </div>
                <input type="text" id="wb-edit-snap-search" class="text_pole" placeholder="🔍 搜索需要加入组合的世界书..." style="width: 100%; box-sizing: border-box; margin-bottom: 10px; padding: 8px;">
                <div class="wb-list-grid scrollableInnerFull" id="wb-edit-snap-container" style="max-height: 35vh;"></div>
                <div class="wb-btn-group" style="margin-top: 15px;">
                    <div class="wb-action-btn wb-nowrap-btn btn-success" id="wb-btn-edit-save" style="border:none;"><i class="fa-solid fa-check"></i> 保存当前组合</div>
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-edit-cancel" style="color:#888;"><i class="fa-solid fa-arrow-left"></i> 返回</div>
                </div>
            </div>

            <div id="wb-detailed-snap-view" style="display: none; height: 100%; flex-direction: column;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: var(--SmartThemeQuoteColor);">
                    <i class="fa-solid fa-puzzle-piece"></i> 编辑复合快照
                </div>
                <div class="wb-form-group">
                    <label style="font-size: 13px; font-weight: bold; display:block; margin-bottom:4px;">🧩 快照名称</label>
                    <input type="text" id="dsnap-name" class="wb-input-dt" placeholder="例如：战斗场景A，日常场景B...">
                </div>
                <div class="wb-btn-group" style="margin: 0 0 10px 0;">
                    <div class="wb-action-btn wb-nowrap-btn btn-success" id="dsnap-save" style="border:none; flex:unset; min-width: 180px;"><i class="fa-solid fa-check"></i> 保存该复合场景</div>
                    <div class="wb-action-btn wb-nowrap-btn" id="dsnap-cancel" style="color:#888; flex:unset; min-width: 100px;"><i class="fa-solid fa-arrow-left"></i> 返回</div>
                </div>
                <div id="dsnap-container">
                    <div id="dsnap-wb-list-wrapper">
                        <input type="text" id="dsnap-wb-search" class="text_pole" placeholder="🔍 搜索世界书..." style="width: 100%; box-sizing: border-box; margin-bottom: 6px; padding: 6px; flex-shrink: 0;">
                        <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 12px; margin-bottom: 8px; flex-shrink:0;">
                            <input type="checkbox" id="dsnap-filter-unbound" style="accent-color: var(--SmartThemeQuoteColor);">
                            <span style="font-weight: bold; color: gray;">仅显示未绑定卡片的世界书</span>
                        </label>
                        <div id="dsnap-wb-list" class="scrollableInnerFull"></div>
                    </div>
                    <div id="dsnap-entry-list-wrapper">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-shrink: 0; padding-bottom: 4px; border-bottom: 1px solid rgba(125,125,125,0.2); gap:6px; flex-wrap:wrap;">
                            <span style="font-size: 12px; font-weight: bold; color: gray;">🔍 查看条目 (仅供阅览排序)</span>
                            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                <label style="cursor:pointer; display:flex; align-items:center; gap:5px; font-size:12px; color:var(--SmartThemeBodyColor); background:rgba(125,125,125,0.12); border:1px solid var(--SmartThemeBorderColor); border-radius:5px; padding:3px 7px;">
                                    <input type="checkbox" id="dsnap-toggle-preview" style="accent-color: var(--SmartThemeQuoteColor);">
                                    <span style="font-weight:bold;">📖 预览</span>
                                </label>
                                <select id="dsnap-entry-sort" class="wb-input-dt" style="width: auto; padding: 4px 6px; font-size: 12px;">
                                    <option value="default">↕ 默认</option>
                                    <option value="order_asc">🔢 顺序 (小到大)</option>
                                    <option value="order_desc">🔢 顺序 (大到小)</option>
                                    <option value="depth_asc">🌊 深度 (小到大)</option>
                                    <option value="depth_desc">🌊 深度 (大到小)</option>
                                    <option value="az">🔤 名称 (A-Z)</option>
                                    <option value="za">🔡 名称 (Z-A)</option>
                                </select>
                            </div>
                        </div>
                        <div id="dsnap-entry-list" class="scrollableInnerFull"></div>
                    </div>
                </div>
            </div>

            <div id="wb-bind-view" style="display: none; height: 100%; flex-direction: column;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: var(--SmartThemeQuoteColor);">
                    <i class="fa-solid fa-list-ol"></i> 查看 [<span id="wb-bind-title"></span>] 已绑定的角色/用户 (只读名单)
                </div>
                <input type="text" id="wb-bind-search" class="text_pole" placeholder="🔍 搜索名称..." style="width: 100%; box-sizing: border-box; margin-bottom: 10px; padding: 8px;">
                <div class="wb-snapshot-list scrollableInnerFull" id="wb-bind-container" style="max-height: 45vh; padding: 5px;"></div>
                <div class="wb-btn-group" style="margin-top: auto;">
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-bind-cancel" style="color:#888;"><i class="fa-solid fa-arrow-left"></i> 返回上一页</div>
                </div>
            </div>

            <!-- ✨ 鹿酱精心改造的条目分栏界面来啦 ✨ -->
            <div id="wb-entry-view" style="display: none; height: 100%; flex-direction: column;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: var(--SmartThemeQuoteColor); display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
                    <span style="display:flex; align-items:flex-start; flex:1; min-width:0;">
                        <i class="fa-solid fa-sliders" style="margin-right:6px; margin-top:4px;"></i>
                        <span style="display:flex; flex-direction:column; line-height:1.3;">
                            <span style="font-size:12px; color:gray; font-weight:normal;">编辑内容：</span>
                            <span id="wb-entry-title" style="word-break:break-all; white-space:normal;"></span>
                        </span>
                    </span>

                    <!-- 📖 预览开关就在这里哦 -->
                    <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 12px; margin: 0; font-weight: normal; background: rgba(125,125,125,0.1); padding: 6px 10px; border-radius: 6px; border: 1px solid var(--SmartThemeBorderColor); flex-shrink: 0; margin-top: 2px;">
                        <input type="checkbox" id="wb-toggle-entry-preview" style="accent-color: var(--SmartThemeQuoteColor); transform:scale(1.1);">
                        <span style="color:var(--SmartThemeBodyColor); font-weight:bold;">📖 内容预览</span>
                    </label>
                </div>

                <div id="wb-entry-split-wrapper">
                    <div id="wb-entry-list-side">
                        <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                            <input type="text" id="wb-entry-search" class="text_pole" placeholder="🔍 检索条目标题或触发关键字..." style="width: 100%; box-sizing: border-box; padding: 8px;">
                            <select id="wb-entry-sort" class="wb-input-dt" style="width: 160px; padding: 8px;">
                                <option value="default">↕ 默认</option>
                                <option value="order_asc">🔢 顺序 (小到大)</option>
                                <option value="order_desc">🔢 顺序 (大到小)</option>
                                <option value="depth_asc">🌊 深度 (小到大)</option>
                                <option value="depth_desc">🌊 深度 (大到小)</option>
                                <option value="az">🔤 名称 (A-Z)</option>
                                <option value="za">🔡 名称 (Z-A)</option>
                            </select>
                        </div>
                        <div class="wb-btn-group" style="margin: 0 0 10px 0; flex-shrink: 0;">
                            <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-entry-all" style="padding: 6px;"><i class="fa-solid fa-check-double"></i> 启用全部</div>
                            <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-entry-none" style="padding: 6px;"><i class="fa-regular fa-square"></i> 关闭全部</div>
                            <div class="wb-action-btn wb-nowrap-btn btn-success" id="wb-btn-entry-add" style="padding: 6px; border:none;"><i class="fa-solid fa-plus"></i> 新建条目</div>
                            <div class="wb-action-btn wb-nowrap-btn btn-danger" id="wb-btn-entry-batch" style="padding: 6px; border:none;"><i class="fa-solid fa-layer-group"></i> 批量操作</div>
                        </div>

                        <div id="wb-entry-batch-actions" style="display: none; background: rgba(255, 107, 107, 0.1); border: 1px dashed #ff6b6b; border-radius: 6px; padding: 10px; margin-bottom: 10px; flex-direction: column; gap: 10px; flex-shrink: 0;">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap: wrap; gap: 10px;">
                                <div style="display:flex; align-items:center; gap: 8px; flex-wrap: wrap;">
                                     <span style="color: #ff6b6b; font-weight: bold; font-size: 14px;"><i class="fa-solid fa-triangle-exclamation"></i> 批量 (<span id="wb-entry-batch-count">0</span>)：</span>
                                     <button class="menu_button interactable wb-nowrap-btn" id="wb-btn-entry-batch-select-all" style="margin: 0; padding: 4px 10px; font-size: 12px; background: rgba(0,0,0,0.2); border: 1px solid var(--SmartThemeBorderColor);"><i class="fa-solid fa-check-double"></i> 勾选当前项</button>
                                     <button class="menu_button interactable wb-nowrap-btn" id="wb-btn-entry-batch-deselect-all" style="margin: 0; padding: 4px 10px; font-size: 12px; background: rgba(0,0,0,0.2); border: 1px solid var(--SmartThemeBorderColor);"><i class="fa-regular fa-square"></i> 撤销勾选</button>
                                </div>
                                <div style="display:flex; gap: 8px; flex-wrap: wrap;">
                                     <button class="menu_button interactable btn-warning wb-nowrap-btn" id="wb-btn-entry-batch-group" style="margin: 0; border: none; font-size: 13px; padding: 6px 14px; background: rgba(252, 196, 25, 0.15); color: #fcc419;"><i class="fa-solid fa-folder-tree"></i> 批量改组</button>
                                     <button class="menu_button interactable btn-danger wb-nowrap-btn" id="wb-btn-entry-confirm-delete" style="margin: 0; border: none; font-size: 13px; padding: 6px 14px;"><i class="fa-solid fa-burst"></i> 暂存移除</button>
                                </div>
                            </div>
                        </div>

                        <div class="wb-snapshot-list scrollableInnerFull" id="wb-entry-container" style="display: flex; flex-direction: column; flex: 1; max-height: none; padding-right: 5px;"></div>

                        <div class="wb-btn-group" style="margin-top: 10px; flex-shrink: 0;">
                            <div class="wb-action-btn wb-nowrap-btn btn-success" id="wb-btn-entry-save" style="border:none;"><i class="fa-solid fa-floppy-disk"></i> 确认并覆盖源文件</div>
                            <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-entry-cancel" style="color:#888;"><i class="fa-solid fa-arrow-left"></i> 返回上一页</div>
                        </div>
                    </div>

                    <!-- ✨ 紧凑排列的右侧编辑页 面板 ✨ -->
                    <div id="wb-entry-detail-side">
                        <div style="font-weight: bold; font-size: 15px; margin-bottom: 8px; color: var(--SmartThemeQuoteColor); flex-shrink: 0; display: flex; justify-content: space-between; align-items: center;">
                            <span><i class="fa-solid fa-pen-nib"></i> 编辑参数：<span id="wb-detail-title"></span></span>
                            <!-- 手机端关闭此层的返回按钮 -->
                            <button class="menu_button interactable wb-nowrap-btn" id="wb-btn-det-close-mobile" style="display: none; margin: 0; padding: 4px 8px; font-size: 11px;"><i class="fa-solid fa-angle-left"></i> 返回列表</button>
                        </div>
                        <div class="scrollableInnerFull" style="display: flex; flex-direction: column; flex: 1; min-height: 0; padding-right: 5px;">
                            <div style="display: flex; flex-wrap: wrap; gap: 8px; background: rgba(0,0,0,0.1); border-radius: 6px; padding: 10px; border: 1px solid var(--SmartThemeBorderColor); margin-bottom: 10px; flex-shrink: 0; align-items: flex-end;">
                                <div class="wb-form-group" style="flex: 1; min-width: 120px; margin-bottom: 0;">
                                    <label style="font-size: 12px; font-weight: bold; margin-bottom: 4px; color: var(--SmartThemeQuoteColor);">📖 标签名称</label>
                                    <input type="text" id="wb-det-name" class="wb-input-dt">
                                </div>
                                <div class="wb-form-group" style="flex: 1; min-width: 100px; margin-bottom: 0;">
                                    <label style="font-size: 12px; font-weight: bold; margin-bottom: 4px; color: var(--SmartThemeQuoteColor);">🚦 触发策略</label>
                                    <select id="wb-det-strategy" class="wb-input-dt">
                                        <option value="constant">🟦 常驻 (无条件)</option>
                                        <option value="selective">🟩 匹配 (关键字)</option>
                                    </select>
                                </div>
                                <div class="wb-form-group" style="flex: 2; min-width: 160px; margin-bottom: 0;">
                                    <label style="font-size: 12px; font-weight: bold; margin-bottom: 4px; color: var(--SmartThemeQuoteColor);">🔑 触发关键字 <small>(逗号分隔)</small></label>
                                    <input type="text" id="wb-det-keys" class="wb-input-dt">
                                </div>

                                <div class="wb-form-group" style="flex: 1; min-width: 140px; margin-bottom: 0;">
                                    <label style="font-size: 12px; font-weight: bold; margin-bottom: 4px; color: var(--SmartThemeQuoteColor);">📍 插入位置</label>
                                    <select id="wb-det-position" class="wb-input-dt">
                                        <option value="before_character_definition">角色定义前</option>
                                        <option value="after_character_definition">角色定义后</option>
                                        <option value="before_example_messages">示例消息前</option>
                                        <option value="after_example_messages">示例消息后</option>
                                        <option value="before_author_note">作者注释前</option>
                                        <option value="after_author_note">作者注释后</option>
                                        <option value="at_depth_system">@D ⚙️系统深度</option>
                                        <option value="at_depth_user">@D 👤用户深度</option>
                                        <option value="at_depth_assistant">@D 🤖助手深度</option>
                                    </select>
                                </div>
                                <div class="wb-form-group" id="wb-det-depth-container" style="display: none; width: 60px; margin-bottom: 0;">
                                    <label style="font-size: 12px; font-weight: bold; margin-bottom: 4px; color: var(--SmartThemeQuoteColor);">🌊 深度</label>
                                    <input type="number" id="wb-det-depth" class="wb-input-dt" value="0">
                                </div>
                                <div class="wb-form-group" style="width: 60px; margin-bottom: 0;">
                                    <label style="font-size: 12px; font-weight: bold; margin-bottom: 4px; color: var(--SmartThemeQuoteColor);">🔢 顺序</label>
                                    <input type="number" id="wb-det-order" class="wb-input-dt" value="100">
                                </div>

                                <div style="display: flex; flex-direction: column; justify-content: center; gap: 4px; margin-bottom: 4px; min-width: 140px;">
                                    <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 11px; margin: 0; white-space: nowrap;">
                                        <input type="checkbox" id="wb-det-exclude-recursion" style="accent-color: var(--SmartThemeQuoteColor); transform: scale(1.1);">
                                        <span><strong style="color: var(--SmartThemeBodyColor);">不可递归</strong> <span style="color:gray;">(不被其他条目激活)</span></span>
                                    </label>
                                    <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 11px; margin: 0; white-space: nowrap;">
                                        <input type="checkbox" id="wb-det-prevent-recursion" style="accent-color: var(--SmartThemeQuoteColor); transform: scale(1.1);">
                                        <span><strong style="color: var(--SmartThemeBodyColor);">防止进一步递归</strong></span>
                                    </label>
                                </div>
                            </div>
                            <div class="wb-form-group" style="flex: 1; display: flex; flex-direction: column; margin-bottom: 0;">
                                <label style="font-size: 13px; font-weight: bold; margin-bottom: 8px; color: var(--SmartThemeQuoteColor);">📜 正文内容</label>
                                <textarea id="wb-det-content" class="wb-input-dt" style="flex: 1; min-height: 150px; font-size: 13px; padding: 10px; resize: none;"></textarea>
                            </div>
                        </div>
                        <div class="wb-btn-group" style="margin-top: 10px; flex-shrink: 0;">
                            <div class="wb-action-btn wb-nowrap-btn btn-success" id="wb-btn-det-save" style="border:none;"><i class="fa-solid fa-check"></i> 暂存修改内容</div>
                            <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-det-cancel" style="color: #888;"><i class="fa-solid fa-xmark"></i> 撤销并关闭</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);

  const hexToRgba = (hex, alpha) => {
    let r = 0,
      g = 0,
      b = 0;
    if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return `rgba(${r},${g},${b},${alpha / 100})`;
  };

  const applyTheme = (mode, customConfig) => {
    $("#lulu-theme-override-style").remove();
    let overrideCSS = "";
    const $quickIcon = $ui.find("#wb-theme-quick-toggle i");
    if (mode === "light") {
      $quickIcon
        .removeClass("fa-moon fa-circle-half-stroke")
        .addClass("fa-sun")
        .css("color", "#ff9f43");
    } else if (mode === "dark") {
      $quickIcon
        .removeClass("fa-sun fa-circle-half-stroke")
        .addClass("fa-moon")
        .css("color", "#70a1ff");
    } else {
      $quickIcon
        .removeClass("fa-sun fa-moon")
        .addClass("fa-circle-half-stroke")
        .css("color", "var(--SmartThemeBodyColor)");
    }

    if (mode === "dark") {
      overrideCSS = `dialog.wb-manager-dialog { background: rgba(22, 24, 28, 1) !important; border: 1px solid #d1c5a1 !important; } dialog.wb-manager-dialog, #wb-manager-panel { --SmartThemeBlurTintColor: rgba(22, 24, 28, 1) !important; --SmartThemeBotMesColor: rgba(32, 35, 40, 1) !important; --SmartThemeBodyColor: #c0c2c8 !important; --SmartThemeQuoteColor: #d1c5a1 !important; --SmartThemeBorderColor: #3d414d !important; color: #c0c2c8 !important; }`;
    } else if (mode === "light") {
      overrideCSS = `dialog.wb-manager-dialog { background: rgba(253, 246, 227, 1) !important; border: 1px solid #8b5d33 !important; } dialog.wb-manager-dialog, #wb-manager-panel { --SmartThemeBlurTintColor: rgba(253, 246, 227, 1) !important; --SmartThemeBotMesColor: rgba(255, 251, 240, 1) !important; --SmartThemeBodyColor: #4a3b32 !important; --SmartThemeQuoteColor: #8b5d33 !important; --SmartThemeBorderColor: #e0d0b8 !important; color: #4a3b32 !important; } dialog.wb-manager-dialog *, #wb-manager-panel * { text-shadow: none !important; }`;
    } else if (mode === "custom") {
      const bgRgba = hexToRgba(customConfig.bg, customConfig.alpha);
      overrideCSS = `dialog.wb-manager-dialog { background: ${bgRgba} !important; border: 1px solid var(--SmartThemeQuoteColor) !important; } dialog.wb-manager-dialog, #wb-manager-panel { --SmartThemeBlurTintColor: ${bgRgba} !important; --SmartThemeBotMesColor: ${customConfig.bg} !important; --SmartThemeBodyColor: ${customConfig.text} !important; color: ${customConfig.text} !important; }`;
      $ui.find("#wb-theme-custom-opts").css("display", "flex");
    }

    if (mode !== "custom") {
      $ui.find("#wb-theme-custom-opts").hide();
    }
    if (overrideCSS) {
      $ui.append(
        `<style id="lulu-theme-override-style">${overrideCSS}</style>`,
      );
    }
  };

  const loadThemeSettings = () => {
    const savedMode = localStorage.getItem("lulu_wb_panel_theme") || "default";
    const savedCustom = JSON.parse(
      localStorage.getItem("lulu_wb_panel_custom_colors") ||
        '{"bg":"#2a2e33", "text":"#ffffff", "alpha":95}',
    );
    $ui.find("#wb-theme-select").val(savedMode);
    $ui.find("#wb-theme-cp-bg").val(savedCustom.bg);
    $ui.find("#wb-theme-cp-text").val(savedCustom.text);
    $ui.find("#wb-theme-cp-alpha").val(savedCustom.alpha);
    $ui.find("#wb-theme-cp-alpha-val").text(savedCustom.alpha + "%");
    applyTheme(savedMode, savedCustom);
  };

  const updateThemeAndSave = () => {
    const mode = $ui.find("#wb-theme-select").val(),
      cBg = $ui.find("#wb-theme-cp-bg").val(),
      cText = $ui.find("#wb-theme-cp-text").val(),
      cAlpha = parseInt($ui.find("#wb-theme-cp-alpha").val());
    $ui.find("#wb-theme-cp-alpha-val").text(cAlpha + "%");
    const cConf = { bg: cBg, text: cText, alpha: cAlpha };
    localStorage.setItem("lulu_wb_panel_theme", mode);
    localStorage.setItem("lulu_wb_panel_custom_colors", JSON.stringify(cConf));
    applyTheme(mode, cConf);
  };

  $ui
    .find("#wb-theme-toggle-btn")
    .on("click", () => $ui.find("#wb-theme-config-panel").slideToggle("fast"));
  $ui
    .find(
      "#wb-theme-select, #wb-theme-cp-bg, #wb-theme-cp-text, #wb-theme-cp-alpha",
    )
    .on("input change", updateThemeAndSave);
  $ui.find("#wb-theme-quick-toggle").on("click", () => {
    let currentMode = $ui.find("#wb-theme-select").val();
    if (
      currentMode === "default" ||
      currentMode === "dark" ||
      currentMode === "custom"
    ) {
      $ui.find("#wb-theme-select").val("light").trigger("change");
      if (typeof toastr !== "undefined")
        toastr.success("已为您开启：浅色模式 ☀️");
    } else if (currentMode === "light") {
      $ui.find("#wb-theme-select").val("dark").trigger("change");
      if (typeof toastr !== "undefined")
        toastr.success("已为您开启：深色模式 🌙");
    }
  });

  loadThemeSettings();

  const isFloatingEnabledNow =
    localStorage.getItem("lulu_wb_floating_enabled") === "true";
  $ui.find("#wb-toggle-floating").prop("checked", isFloatingEnabledNow);

  const updateFloatConfig = () => {
    const sz = $ui.find("#wb-float-size").val(),
      op = $ui.find("#wb-float-opacity").val();
    localStorage.setItem(
      "lulu_wb_floating_config",
      JSON.stringify({ size: sz, opacity: op }),
    );
    if ($ui.find("#wb-toggle-floating").is(":checked"))
      toggleFloatingButton(true, true);
  };
  $ui
    .find("#wb-toggle-floating")
    .parent()
    .after(
      `<div id="lulu-float-config-area" style="display:none; align-items:center; gap:8px; margin-left:10px; flex-wrap:wrap;"><label style="font-size:12px; font-weight:bold; margin:0; color:gray;">大小: <input type="range" id="wb-float-size" min="30" max="70" value="48" style="width:60px; accent-color:var(--SmartThemeQuoteColor); cursor:pointer;"></label><label style="font-size:12px; font-weight:bold; margin:0; color:gray;">可视度: <input type="range" id="wb-float-opacity" min="0.2" max="1" step="0.1" value="0.8" style="width:60px; accent-color:var(--SmartThemeQuoteColor); cursor:pointer;"></label></div>`,
    );
  const curFlConf = JSON.parse(
    localStorage.getItem("lulu_wb_floating_config") ||
      '{"size": 48, "opacity": 0.8}',
  );
  $ui.find("#wb-float-size").val(curFlConf.size).on("input", updateFloatConfig);
  $ui
    .find("#wb-float-opacity")
    .val(curFlConf.opacity)
    .on("input", updateFloatConfig);

  $ui.find("#wb-toggle-floating").on("change", function () {
    const isEnable = $(this).is(":checked");
    localStorage.setItem("lulu_wb_floating_enabled", isEnable);
    $ui
      .find("#lulu-float-config-area")
      .css("display", isEnable ? "flex" : "none");
    toggleFloatingButton(isEnable, true);
    if (typeof toastr !== "undefined") {
      toastr.success(
        isEnable
          ? "✨ 悬浮球召唤成功！可以在旁边的滑块自由调整它的大小和隐身效果哦~"
          : "🪄 悬浮球已经听话地躲起来啦~",
      );
    }
  });
  if ($ui.find("#wb-toggle-floating").is(":checked")) {
    $ui.find("#lulu-float-config-area").css("display", "flex");
  }

  const isNativeMagicEnabledNow =
    localStorage.getItem("lulu_wb_native_magic_enabled") !== "false";
  $ui.find("#wb-toggle-native-magic").prop("checked", isNativeMagicEnabledNow);
  $ui.find("#wb-toggle-native-magic").on("change", function () {
    const isEnable = $(this).is(":checked");
    localStorage.setItem("lulu_wb_native_magic_enabled", isEnable);
    if (typeof toastr !== "undefined") {
      toastr.success(
        isEnable
          ? "🪄 原生UI的分组已激活！两边同步哦~"
          : "💤 原生UI分组已沉睡，酒馆恢复原生样式~",
      );
    }
  });

  let currentScale = 1.0;
  const updateZoom = (scale) => {
    currentScale = Math.max(0.5, Math.min(2.0, scale));
    $(popup.dlg).css("zoom", currentScale);
    $ui.find("#wb-zoom-val").text(Math.round(currentScale * 100) + "%");
  };
  $ui.find("#wb-zoom-in").on("click", () => updateZoom(currentScale + 0.1));
  $ui.find("#wb-zoom-out").on("click", () => updateZoom(currentScale - 0.1));

  const showTab = (tabName) => {
    $ui.find(".wb-tab-btn").removeClass("active");
    $ui.find("#wb-manager-panel").removeClass("wb-entry-focus");
    $ui
      .find(
        "#wb-main-view, #wb-char-view, #wb-assoc-view, #wb-edit-snap-view, #wb-detailed-snap-view, #wb-bind-view, #wb-entry-view",
      )
      .hide();
    $ui.find("#wb-tab-strip").show();
    if (tabName === "global") {
      $ui.find("#tab-global-btn").addClass("active");
      $ui.find("#wb-main-view").fadeIn(200);
      renderData();
    } else if (tabName === "char") {
      $ui.find("#tab-char-btn").addClass("active");
      $ui.find("#wb-char-view").fadeIn(200);
      renderCharView();
    }
  };

  $ui.find("#tab-global-btn").on("click", () => showTab("global"));
  $ui.find("#tab-char-btn").on("click", () => showTab("char"));

  const withLoadingOverlay = async (
    asyncFunction,
    message = "正在处理中，请稍候...",
  ) => {
    const $overlay = $ui.find("#wb-loading-overlay"),
      $text = $ui.find("#wb-loading-text"),
      $sub = $ui.find("#wb-loading-sub"),
      $sec = $ui.find("#wb-loading-secondary-text");
    $text.html(message);
    $sub.hide();
    $sec.hide();
    $overlay.fadeIn("fast");
    try {
      await asyncFunction();
    } catch (error) {
      toastr.error(`操作失败: ${error.message}`);
    } finally {
      $overlay.fadeOut("slow");
    }
  };

  const getCategories = () => {
    let vars = getVariables({ type: "global" });
    let cats = vars.wb_categories;
    if (typeof cats === "string") {
      try {
        cats = JSON.parse(cats);
      } catch (e) {
        cats = null;
      }
    }
    if (!cats || typeof cats !== "object" || Array.isArray(cats)) {
      cats = { "🌟默认收藏夹": [] };
      updateVariablesWith(
        (v) => {
          v.wb_categories = cats;
          return v;
        },
        { type: "global" },
      );
    }
    return cats;
  };
  const saveCategories = (catObj) => {
    updateVariablesWith(
      (v) => {
        v.wb_categories = catObj;
        return v;
      },
      { type: "global" },
    );
  };

  const initiateDeepScan = async (isFastSync = false, forceScan = false) => {
    /* 深扫逻辑受字数限制折叠，保持代码完整性同上 */
    const $overlay = $ui.find("#wb-loading-overlay"),
      $sub = $ui.find("#wb-loading-sub"),
      $sec = $ui.find("#wb-loading-secondary-text");
    if (isFastSync) {
      $ui
        .find("#wb-loading-text")
        .html(
          '✨ <span style="color: var(--SmartThemeQuoteColor);">正在飞速读取当前卡片状态...</span>',
        );
      $sub.hide();
      $sec.hide();
    } else {
      $ui.find("#wb-loading-text").html("正在请求深入检索...");
      $sub.show();
      $sec.show();
    }
    $overlay.show();
    try {
      let wb2Chars = {};
      const allWbNames =
        typeof getWorldbookNames === "function" ? getWorldbookNames() : [];
      allWbNames.forEach((wb) => (wb2Chars[wb] = []));
      const existingCache = loadBindingCache();
      const needHeavyScan =
        forceScan || !existingCache || Object.keys(existingCache).length === 0;
      if (!needHeavyScan) {
        for (let wb of allWbNames) {
          wb2Chars[wb] = existingCache[wb] || [];
        }
      }
      const ctx =
        typeof SillyTavern !== "undefined"
          ? SillyTavern.getContext()
          : typeof getContext === "function"
            ? getContext()
            : {};
      if (ctx.powerUserSettings && ctx.powerUserSettings.persona_descriptions) {
        Object.keys(wb2Chars).forEach((wb) => {
          wb2Chars[wb] = wb2Chars[wb].filter(
            (c) => !c.name.startsWith("👤用户: "),
          );
        });
        const pDescs = ctx.powerUserSettings.persona_descriptions;
        const pNames = ctx.powerUserSettings.personas || {};
        Object.keys(pDescs).forEach((avatarId) => {
          if (pDescs[avatarId] && pDescs[avatarId].lorebook) {
            const wbName = pDescs[avatarId].lorebook;
            const niceName = pNames[avatarId] || avatarId;
            if (!wb2Chars[wbName]) wb2Chars[wbName] = [];
            if (!wb2Chars[wbName].some((c) => c.avatar === avatarId)) {
              wb2Chars[wbName].push({
                name: `👤用户: ${niceName}`,
                avatar: avatarId,
              });
            }
          }
        });
      }
      let charName =
        typeof getCurrentCharacterName === "function"
          ? getCurrentCharacterName()
          : null;
      let currentAvatar = ctx.chatMetadata
        ? ctx.chatMetadata.avatar
        : ctx.avatar_url || null;
      let currentCharWbs = new Set();
      try {
        if (charName && typeof getCharWorldbookNames === "function") {
          const cbCur = getCharWorldbookNames("current");
          if (cbCur) {
            if (cbCur.primary) currentCharWbs.add(cbCur.primary);
            if (Array.isArray(cbCur.additional))
              cbCur.additional.forEach((w) => currentCharWbs.add(w));
          }
        }
      } catch (e) {}
      if (charName && currentAvatar) {
        Object.keys(wb2Chars).forEach((wb) => {
          wb2Chars[wb] = wb2Chars[wb].filter((c) => c.avatar !== currentAvatar);
        });
        currentCharWbs.forEach((wbName) => {
          if (wbName && typeof wbName === "string") {
            if (!wb2Chars[wbName]) wb2Chars[wbName] = [];
            wb2Chars[wbName].push({ name: charName, avatar: currentAvatar });
          }
        });
      }
      if (needHeavyScan) {
        const allCharsData =
          window.characters ||
          (typeof SillyTavern !== "undefined" ? SillyTavern.characters : []) ||
          [];
        let combinedData = [...allCharsData];
        const totalChars = combinedData.length;
        $ui
          .find("#wb-loading-text")
          .html("发现大量角色数据，正在执行重型深度扫描...");
        $sub.text(`0 / ${totalChars}`).show();
        const charMap = new Map();
        const batchSize = 10;
        for (let i = 0; i < totalChars; i += batchSize) {
          const chunk = combinedData.slice(i, i + batchSize);
          await Promise.all(
            chunk.map(async (charItem) => {
              if (!charItem) return;
              try {
                const avatar = charItem.avatar;
                if (!avatar) return;
                if (avatar === currentAvatar) return;
                let charData = charItem;
                if (charItem.shallow) {
                  try {
                    charData = await $.ajax({
                      url: "/api/characters/get",
                      type: "POST",
                      contentType: "application/json",
                      data: JSON.stringify({ avatar_url: avatar }),
                    });
                  } catch (e) {}
                }
                const curCharName =
                  charData.name || charItem.name || "未知名称";
                const checkList = new Set();
                try {
                  if (typeof getCharWorldbookNames === "function") {
                    const cb = getCharWorldbookNames(curCharName);
                    if (cb) {
                      if (cb.primary) checkList.add(cb.primary);
                      if (Array.isArray(cb.additional))
                        cb.additional.forEach((w) => checkList.add(w));
                    }
                  }
                } catch (e) {}
                const dataFields = charData.data || charData;
                if (dataFields.extensions?.world)
                  checkList.add(dataFields.extensions.world);
                if (dataFields.world) checkList.add(dataFields.world);
                if (dataFields.world_info) checkList.add(dataFields.world_info);
                if (dataFields.lorebook) checkList.add(dataFields.lorebook);
                if (
                  dataFields.character_book &&
                  typeof dataFields.character_book.name === "string"
                ) {
                  checkList.add(dataFields.character_book.name);
                } else if (typeof dataFields.character_book === "string") {
                  checkList.add(dataFields.character_book);
                }
                if (dataFields.worldbook) checkList.add(dataFields.worldbook);
                if (Array.isArray(dataFields.extensions?.worldbooks))
                  dataFields.extensions.worldbooks.forEach((w) =>
                    checkList.add(w),
                  );
                if (Array.isArray(charData.extensions?.worldbooks))
                  charData.extensions.worldbooks.forEach((w) =>
                    checkList.add(w),
                  );
                checkList.forEach((wbRaw) => {
                  let wbArr = [];
                  if (typeof wbRaw === "string") {
                    if (wbRaw.startsWith("[") && wbRaw.endsWith("]")) {
                      try {
                        wbArr = JSON.parse(wbRaw);
                      } catch (e) {
                        wbArr = [wbRaw];
                      }
                    } else wbArr = [wbRaw];
                  } else wbArr = [wbRaw];
                  wbArr.forEach((wbName) => {
                    if (wbName && typeof wbName === "string") {
                      if (!wb2Chars[wbName]) wb2Chars[wbName] = [];
                      if (!wb2Chars[wbName].some((c) => c.avatar === avatar))
                        wb2Chars[wbName].push({
                          name: curCharName,
                          avatar: avatar,
                        });
                    }
                  });
                });
                const safeCharObj = { name: curCharName, avatar: avatar };
                charMap.set(avatar, safeCharObj);
                const avatarBase = avatar.replace(/\.(png|webp|jpeg)$/i, "");
                if (avatar !== avatarBase) charMap.set(avatarBase, safeCharObj);
              } catch (e) {}
            }),
          );
          $sub.text(`${Math.min(i + batchSize, totalChars)} / ${totalChars}`);
        }
        try {
          let charLoreArray = [];
          if (
            ctx.chatWorldInfoSettings &&
            Array.isArray(ctx.chatWorldInfoSettings.charLore)
          )
            charLoreArray = ctx.chatWorldInfoSettings.charLore;
          else if (
            window.chatWorldInfoSettings &&
            Array.isArray(window.chatWorldInfoSettings.charLore)
          )
            charLoreArray = window.chatWorldInfoSettings.charLore;
          if (charLoreArray.length > 0) {
            charLoreArray.forEach((charLoreEntry) => {
              const charFilename = charLoreEntry.name;
              if (!charFilename) return;
              const filenameBase = charFilename.replace(
                /\.(png|webp|jpeg)$/i,
                "",
              );
              const mappedChar =
                charMap.get(charFilename) || charMap.get(filenameBase);
              if (mappedChar && Array.isArray(charLoreEntry.extraBooks)) {
                charLoreEntry.extraBooks.forEach((wbName) => {
                  if (wbName && typeof wbName === "string") {
                    if (!wb2Chars[wbName]) wb2Chars[wbName] = [];
                    if (
                      !wb2Chars[wbName].some(
                        (c) => c.avatar === mappedChar.avatar,
                      )
                    )
                      wb2Chars[wbName].push({
                        name: mappedChar.name,
                        avatar: mappedChar.avatar,
                      });
                  }
                });
              }
            });
          }
        } catch (e) {}
      }
      globalBindingMapCache = wb2Chars;
      saveBindingCache(wb2Chars);
    } catch (error) {
      console.error(error);
      if (typeof toastr !== "undefined") toastr.error("读取中断");
    } finally {
      $overlay.fadeOut("slow");
      if ($ui.find("#wb-main-view").is(":visible")) renderData();
      if ($ui.find("#wb-char-view").is(":visible")) renderCharView();
    }
  };

  $ui.find("#wb-btn-force-scan").on("click", async () => {
    await initiateDeepScan(false, true);
    toastr.success(
      "已经把当前所有的角色卡羁绊重新温习了一遍，记忆库已达最新哦！",
    );
  });

  const popup = new SillyTavern.Popup($ui, SillyTavern.POPUP_TYPE.TEXT, "", {
    allowVerticalScrolling: true,
    okButton: "关闭面板",
    onOpen: async () => {
      $(popup.dlg).addClass("wb-manager-dialog");
      showTab(window.luluWbInitTabType || "global");
      await initiateDeepScan();
    },
  });
  setTimeout(() => $(popup.dlg).addClass("wb-manager-dialog"), 50);

  const attemptCreateWb = async (defaultName = "") => {
    let name = await SillyTavern.callGenericPopup(
      "为新建的世界书设定一个名称：",
      SillyTavern.POPUP_TYPE.INPUT,
      defaultName,
    );
    if (!name || typeof name !== "string" || name.trim() === "") return;
    name = name.trim();
    if (getWorldbookNames().includes(name)) {
      const btnRes = await SillyTavern.callGenericPopup(
        `世界书 [${name}] 已存在，您希望作何处理？`,
        SillyTavern.POPUP_TYPE.TEXT,
        "",
        {
          okButton: "取消操作",
          customButtons: [
            { text: "取代原文件", result: 1, classes: ["btn-danger"] },
            { text: "重命名新建", result: 2, classes: ["btn-primary"] },
          ],
        },
      );
      if (btnRes !== 1)
        return btnRes === 2 ? attemptCreateWb(name + "_新") : null;
    }
    await withLoadingOverlay(async () => {
      await createWorldbook(name, []);
      globalBindingMapCache[name] = [];
      const c = loadBindingCache() || {};
      c[name] = [];
      saveBindingCache(c);
      toastr.success(`已创建：${name}`);
      renderData(name);
    }, "正在创建世界书...");
  };
  $ui.find("#wb-btn-create-wb").on("click", () => attemptCreateWb());

  /* ...中间的批量导入、导出、重新命名、绑定功能、原生酒馆同步等...此处折叠均未篡改，完美保留... */
  const $fileInput = $(
    '<input type="file" multiple accept=".json" style="display: none;">',
  );
  $ui.append($fileInput);
  $ui.find("#wb-btn-import-wb").on("click", () => {
    $fileInput.val("");
    $fileInput.trigger("click");
  });
  $fileInput.on("change", async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await withLoadingOverlay(async () => {
      let successCount = 0;
      let failCount = 0;
      let skipCount = 0;
      let newlyImportedNames = [];
      const $overlay = $ui.find("#wb-loading-overlay");
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target.result);
            reader.onerror = (ev) => reject(ev);
            reader.readAsText(file);
          });
          const data = JSON.parse(content);
          let rawEntries = [];
          if (Array.isArray(data)) rawEntries = data;
          else if (data.entries)
            rawEntries = Array.isArray(data.entries)
              ? data.entries
              : Object.values(data.entries);
          else if (data.data && data.data.entries)
            rawEntries = Array.isArray(data.data.entries)
              ? data.data.entries
              : Object.values(data.data.entries);
          else
            rawEntries = Object.values(data).filter(
              (item) => typeof item === "object" && item !== null,
            );
          let entries = rawEntries.map((e) => {
            let eName = e.name || e.comment || e.title || "未定名条目";
            let eEnabled = true;
            if (e.enabled !== undefined) eEnabled = e.enabled;
            else if (e.disable !== undefined) eEnabled = !e.disable;
            else if (e.disabled !== undefined) eEnabled = !e.disabled;
            let strategy = e.strategy;
            if (!strategy) {
              let keys = [];
              if (Array.isArray(e.keys)) keys = e.keys;
              else if (Array.isArray(e.key)) keys = e.key;
              else if (typeof e.key === "string")
                keys = e.key
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
              else if (typeof e.keys === "string")
                keys = e.keys
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
              let isConstant = e.constant;
              if (isConstant === undefined) isConstant = keys.length === 0;
              strategy = {
                type: isConstant ? "constant" : "selective",
                keys: keys,
              };
            }
            let position = e.position;
            if (!position || typeof position !== "object") {
              let pType = "at_depth";
              let posInt =
                typeof e.position === "number"
                  ? e.position
                  : parseInt(e.position);
              if (posInt === 0) pType = "before_character_definition";
              else if (posInt === 1) pType = "after_character_definition";
              else if (posInt === 2) pType = "before_example_messages";
              else if (posInt === 3) pType = "after_example_messages";
              else if (posInt === 4) pType = "at_depth";
              position = {
                type: pType,
                role: e.role || "system",
                depth: e.depth !== undefined ? parseInt(e.depth) : 4,
                order:
                  e.order !== undefined
                    ? parseInt(e.order)
                    : e.insertion_order !== undefined
                      ? parseInt(e.insertion_order)
                      : 100,
              };
            }
            let prevent_in =
              e.exclude_recursion ||
              (e.recursion && e.recursion.prevent_incoming) ||
              false;
            let prevent_out =
              e.prevent_recursion ||
              (e.recursion && e.recursion.prevent_outgoing) ||
              false;
            return {
              uid: e.uid || Date.now() + Math.floor(Math.random() * 1000000),
              name: eName,
              enabled: eEnabled,
              content: e.content || e.description || e.text || "",
              group: e.group || "",
              strategy: strategy,
              position: position,
              recursion: e.recursion || {
                prevent_incoming: prevent_in,
                prevent_outgoing: prevent_out,
                delay_until: null,
              },
              exclude_recursion: prevent_in,
              prevent_recursion: prevent_out,
            };
          });
          let rawName = file.name.replace(/\.[^/.]+$/, "");
          let finalName = rawName.trim() || `未命名世界书_${Date.now()}`;
          let currentWbNames = getWorldbookNames();
          let shouldSkip = false;
          while (currentWbNames.includes(finalName)) {
            $overlay.hide();
            const btnRes = await SillyTavern.callGenericPopup(
              `哎呀，发现同名世界书 [${finalName}] 了呢！想要如何处置这本即将导入的新书呀？`,
              SillyTavern.POPUP_TYPE.TEXT,
              "",
              {
                okButton: "跳过这本",
                customButtons: [
                  { text: "取代原文件", result: 888, classes: ["btn-danger"] },
                  {
                    text: "重命名并新建",
                    result: 999,
                    classes: ["btn-primary"],
                  },
                ],
              },
            );
            $overlay.show();
            if (btnRes === 888) {
              await deleteWorldbook(finalName);
              delete globalBindingMapCache[finalName];
              const c = loadBindingCache();
              if (c) {
                delete c[finalName];
                saveBindingCache(c);
              }
              break;
            } else if (btnRes === 999) {
              $overlay.hide();
              let newName = await SillyTavern.callGenericPopup(
                `请为它赐予一个新的名称吧：`,
                SillyTavern.POPUP_TYPE.INPUT,
                finalName + "_新",
              );
              $overlay.show();
              if (
                !newName ||
                typeof newName !== "string" ||
                newName.trim() === ""
              ) {
                shouldSkip = true;
                break;
              }
              finalName = newName.trim();
            } else {
              shouldSkip = true;
              break;
            }
          }
          if (shouldSkip) {
            skipCount++;
            continue;
          }
          await createWorldbook(finalName, entries);
          globalBindingMapCache[finalName] = [];
          const c = loadBindingCache() || {};
          c[finalName] = [];
          saveBindingCache(c);
          if (data.lulu_categories && Array.isArray(data.lulu_categories)) {
            let cData = getCategories();
            data.lulu_categories.forEach((catName) => {
              if (!cData[catName]) cData[catName] = [];
              if (!cData[catName].includes(finalName))
                cData[catName].push(finalName);
            });
            saveCategories(cData);
          }
          successCount++;
          newlyImportedNames.push(finalName);
        } catch (err) {
          failCount++;
        }
      }
      if (successCount > 0) {
        if (typeof toastr !== "undefined")
          toastr.success(
            `大功告成！已为您导入了 ${successCount} 本新书！${skipCount > 0 ? ` (略过了 ${skipCount} 本)` : ""}${failCount > 0 ? ` (出错了 ${failCount} 本)` : ""}`,
          );
        renderData();
        setTimeout(() => {
          newlyImportedNames.forEach((name, index) => {
            const $highlightItem = $ui
              .find("#wb-container")
              .find(`[data-wb-name="${name.replace(/"/g, '\\"')}"]`);
            if ($highlightItem.length) {
              $highlightItem.css(
                "animation",
                "wb-highlight-flash 2.5s ease-in-out",
              );
              $highlightItem.addClass("wb-highlight");
              if (index === 0)
                $highlightItem[0].scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              setTimeout(() => {
                $highlightItem.removeClass("wb-highlight");
                $highlightItem.css("animation", "");
              }, 2500);
            }
          });
        }, 200);
      } else if (skipCount > 0 && successCount === 0) {
        if (typeof toastr !== "undefined")
          toastr.info(
            `本次导入工作结束啦。您全选了跳过，共略过了 ${skipCount} 本书，没有发生任何变动哦。`,
          );
        $fileInput.val("");
      } else {
        if (typeof toastr !== "undefined")
          toastr.info(`本次导入结束啦，没有任何世界书加入酒馆呢。`);
        $fileInput.val("");
      }
    }, `正在专注解析并导入，请稍候...`);
  });

  const attemptRenameWb = async (
    oldName,
    isBound,
    bindings,
    defaultNewName = "",
  ) => {
    if (isBound)
      return SillyTavern.callGenericPopup(
        `❌ 无法重命名：\n[${oldName}] 已绑定其他角色或用户，无法直接修改哦。可以先解绑再重命名最后再绑定。`,
        SillyTavern.POPUP_TYPE.TEXT,
      );
    let newName = await SillyTavern.callGenericPopup(
      `请输入新名称：`,
      SillyTavern.POPUP_TYPE.INPUT,
      defaultNewName || oldName,
    );
    if (
      !newName ||
      typeof newName !== "string" ||
      newName.trim() === "" ||
      newName.trim() === oldName
    )
      return;
    newName = newName.trim();
    if (getWorldbookNames().includes(newName)) {
      const btnRes = await SillyTavern.callGenericPopup(
        `世界书 [${newName}] 已经存在，您希望作何处理？`,
        SillyTavern.POPUP_TYPE.TEXT,
        "",
        {
          okButton: "取消",
          customButtons: [
            { text: "覆盖", result: 1, classes: ["btn-danger"] },
            { text: "重试", result: 2, classes: ["btn-primary"] },
          ],
        },
      );
      if (btnRes !== 1)
        return btnRes === 2
          ? attemptRenameWb(oldName, isBound, bindings, newName + "_1")
          : null;
    }
    await withLoadingOverlay(async () => {
      const entries = await getWorldbook(oldName);
      await createWorldbook(newName, entries);
      await deleteWorldbook(oldName);
      delete globalBindingMapCache[oldName];
      globalBindingMapCache[newName] = [];
      const c = loadBindingCache();
      if (c) {
        delete c[oldName];
        c[newName] = [];
        saveBindingCache(c);
      }
      let cData = getCategories();
      Object.keys(cData).forEach((k) => {
        if (cData[k].includes(oldName)) {
          cData[k] = cData[k].filter((n) => n !== oldName);
          cData[k].push(newName);
        }
      });
      saveCategories(cData);
      const globals = getGlobalWorldbookNames();
      if (globals.includes(oldName))
        await rebindGlobalWorldbooks(
          globals.map((w) => (w === oldName ? newName : w)),
        );
      toastr.success(`名称已更新`);
      renderData(newName);
    }, "正在重命名迁移...");
  };

  let isBatchMode = false;
  let batchSelected = new Set();
  let currentVisibleWbs = [];
  $ui
    .find(
      "#wb-search-input, #wb-filter-unbound, #wb-filter-state, #wb-sort-select, #wb-category-filter",
    )
    .on("change input", () => renderData());
  $ui.find("#wb-btn-batch-toggle").on("click", function () {
    isBatchMode = !isBatchMode;
    if (isBatchMode) {
      batchSelected.clear();
      $(this)
        .removeClass("btn-warning")
        .addClass("btn-danger")
        .html('<i class="fa-solid fa-xmark"></i> 退出批量操作');
      $ui.find("#wb-batch-actions").css("display", "flex");
    } else {
      $(this)
        .removeClass("btn-danger")
        .addClass("btn-warning")
        .html('<i class="fa-solid fa-layer-group"></i> 批量操作模式');
      $ui.find("#wb-batch-actions").hide();
    }
    renderData();
  });
  $ui.find("#wb-btn-batch-export").on("click", async () => {
    if (batchSelected.size === 0)
      return toastr.warning("请先勾选需要导出的世界书哦~");
    await withLoadingOverlay(async () => {
      let delay = 0;
      let allCats = getCategories();
      for (let wb of batchSelected) {
        let myCats = Object.keys(allCats).filter((k) =>
          allCats[k].includes(wb),
        );
        setTimeout(async () => {
          const entries = await getWorldbook(wb);
          const blob = new Blob(
            [
              JSON.stringify(
                { entries: entries, name: wb, lulu_categories: myCats },
                null,
                2,
              ),
            ],
            { type: "application/json" },
          );
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${wb}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, delay);
        delay += 400;
      }
    }, `正在唤醒打包功能，为您仔细分装 ${batchSelected.size} 本书...`);
    toastr.success(
      `批量导出指令已发出！浏览器马上就会下载 ${batchSelected.size} 份世界书啦~`,
    );
  });

  $ui.find("#wb-btn-select-all").on("click", async () => {
    if (currentVisibleWbs.length === 0) return;
    if (isBatchMode) {
      currentVisibleWbs.forEach((wb) => batchSelected.add(wb));
      renderData();
    } else {
      let currentActive = getGlobalWorldbookNames();
      currentVisibleWbs.forEach((wb) => {
        if (!currentActive.includes(wb)) currentActive.push(wb);
      });
      await withLoadingOverlay(
        async () => await rebindGlobalWorldbooks(currentActive),
        "应用中...",
      );
      renderData();
    }
  });
  $ui.find("#wb-btn-deselect-all").on("click", async () => {
    if (currentVisibleWbs.length === 0) return;
    if (isBatchMode) {
      currentVisibleWbs.forEach((wb) => batchSelected.delete(wb));
      renderData();
    } else {
      let currentActive = getGlobalWorldbookNames().filter(
        (wb) => !currentVisibleWbs.includes(wb),
      );
      await withLoadingOverlay(
        async () => await rebindGlobalWorldbooks(currentActive),
        "应用中...",
      );
      renderData();
    }
  });
  $ui.find("#wb-btn-clear").on("click", async () => {
    await withLoadingOverlay(async () => {
      await rebindGlobalWorldbooks([]);
      renderData();
    }, "清空设定...");
    toastr.success("所有的全局世界书都已经为您全部卸载啦~");
  });
  $ui.find("#wb-btn-del-category").on("click", async () => {
    let selCat = $ui.find("#wb-category-filter").val();
    if (selCat === "all" || selCat === "unassigned") return;
    if (
      (await SillyTavern.callGenericPopup(
        `真的要删掉分类 [${selCat}] 吗？里面的世界书依然安全，只是会变回未分类哦~`,
        SillyTavern.POPUP_TYPE.CONFIRM,
      )) === SillyTavern.POPUP_RESULT.AFFIRMATIVE
    ) {
      let cats = getCategories();
      delete cats[selCat];
      saveCategories(cats);
      $ui.find("#wb-category-filter").val("all");
      renderData();
      toastr.success(`分类 [${selCat}] 已经从列表清理掉啦。`);
    }
  });
  $ui.find("#wb-btn-confirm-delete").on("click", async () => {
    if (batchSelected.size === 0) return toastr.warning("请先勾选");
    if (
      (await SillyTavern.callGenericPopup(
        `确认永久销毁这 ${batchSelected.size} 本世界书？`,
        SillyTavern.POPUP_TYPE.CONFIRM,
      )) === SillyTavern.POPUP_RESULT.AFFIRMATIVE
    ) {
      await withLoadingOverlay(async () => {
        const c = loadBindingCache() || {};
        for (let wb of batchSelected) {
          await deleteWorldbook(wb);
          delete globalBindingMapCache[wb];
          delete c[wb];
          let cData = getCategories();
          Object.keys(cData).forEach((k) => {
            cData[k] = cData[k].filter((n) => n !== wb);
          });
          saveCategories(cData);
        }
        saveBindingCache(c);
        batchSelected.clear();
        renderData();
      }, `删除中...`);
    }
  });

  const renderCharView = () => {
    let vars = getVariables({ type: "global" });
    let charSnaps = vars.wb_char_snapshots;
    if (typeof charSnaps === "string") {
      try {
        charSnaps = JSON.parse(charSnaps);
      } catch (e) {
        charSnaps = null;
      }
    }
    if (
      !charSnaps ||
      typeof charSnaps !== "object" ||
      Array.isArray(charSnaps)
    ) {
      charSnaps = {};
      updateVariablesWith(
        (v) => {
          v.wb_char_snapshots = charSnaps;
          return v;
        },
        { type: "global" },
      );
    }
    const charName =
      typeof getCurrentCharacterName === "function"
        ? getCurrentCharacterName()
        : typeof SillyTavern !== "undefined"
          ? SillyTavern.getContext().name2
          : null;
    const $bCont = $ui.find("#wb-char-books-container").empty();
    const $sCont = $ui.find("#wb-char-snap-container").empty();
    if (!charName) {
      $bCont.html(
        '<div style="color:#ff6b6b; font-size:14px; font-weight:bold; padding:10px; width: 100%;">当前好像没有打开任何角色卡的对话呢，必须要先进入聊天界面，才能为角色配置专属世界书和组合哦~</div>',
      );
      $sCont.html(
        '<div style="color:gray; padding:10px;">暂无可用的角色快照呢~</div>',
      );
      return;
    }
    let charBooksObj = { primary: null, additional: [] };
    try {
      if (typeof getCharWorldbookNames === "function")
        charBooksObj = getCharWorldbookNames("current") || charBooksObj;
    } catch (e) {}
    const cBooks = [];
    if (charBooksObj.primary) cBooks.push(charBooksObj.primary);
    if (charBooksObj.additional) cBooks.push(...charBooksObj.additional);
    if (cBooks.length === 0) {
      $bCont.html(
        '<div style="color:gray; font-size:14px; padding:10px; width: 100%;">这名角色目前一本世界书都还没有绑定。请点击上面的管理按钮去绑定吧~</div>',
      );
    } else {
      cBooks.forEach((wb) => {
        const isPrimary = wb === charBooksObj.primary;
        const tagLabelHtml = isPrimary
          ? `<span style="font-size:10px; background:var(--SmartThemeQuoteColor); color:#fff; padding:2px 5px; border-radius:4px; margin-left:4px; margin-bottom:2px;">主</span>`
          : `<span style="font-size:10px; border:1px solid gray; color:gray; background:transparent; padding:1px 4px; border-radius:4px; margin-left:4px; margin-bottom:2px;">附</span>`;
        const $wrapper = $(
          '<div class="wb-item-wrapper" style="cursor: pointer;"></div>',
        );
        const $titleArea = $(
          `<div class="wb-item-header"><span class="wb-name-text" style="color:var(--SmartThemeQuoteColor); display:flex; align-items:center;">${wb} ${tagLabelHtml}</span></div>`,
        );
        const $bottomArea = $(
          `<div class="wb-item-bottom" style="justify-content:flex-end;"><div class="wb-bind-tag" style="background:var(--SmartThemeBlurTintColor); border:1px solid var(--SmartThemeBorderColor);"><i class="fa fa-sliders"></i> 点击配置此书条目开关</div></div>`,
        );
        $wrapper.append($titleArea, $bottomArea).on("click", () => {
          openEntryTuneView(wb, "#wb-char-view");
        });
        $bCont.append($wrapper);
      });
    }
    const mySnaps = charSnaps[charName] || {};
    if (Object.keys(mySnaps).length === 0) {
      $sCont.html(
        '<div style="color:gray; padding:10px; text-align:center;">这名角色还没有存过专属搭配组合呢，快点上方按钮留个纪念吧~</div>',
      );
    } else {
      Object.entries(mySnaps).forEach(([snapName, snapData]) => {
        const totalEntries = Object.values(snapData).reduce(
          (a, arr) => a + arr.length,
          0,
        );
        const includedBooks = Object.keys(snapData).length;
        const $item = $(
          `<div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--SmartThemeBotMesColor); border-radius:6px; border:1px solid var(--SmartThemeBorderColor); flex-wrap:wrap; gap:8px;"></div>`,
        );
        $item.append(
          `<div style="flex:1; min-width: 150px;"><div style="font-weight:bold;font-size:14px;"><i class="fa-solid fa-camera-retro" style="color:var(--SmartThemeQuoteColor);"></i> ${snapName}</div><div style="font-size:12px;color:gray;">牵涉 ${includedBooks} 本世界书，共开启 ${totalEntries} 项条目</div></div>`,
        );
        const $act = $(
          '<div style="display:flex; gap:6px; flex-wrap: wrap;"></div>',
        );
        $act.append(
          $(
            '<button class="menu_button interactable btn-success wb-nowrap-btn" style="margin:0; padding:6px 12px; font-size:12px; border:none;">应用该组合</button>',
          ).on("click", async () => {
            const curBound = getCharBoundBooks();
            const snapWbNames = Object.keys(snapData);
            const missingWbs = snapWbNames.filter(
              (wb) => !curBound.includes(wb),
            );
            if (missingWbs.length > 0) {
              toastr.warning(
                `注意哦，快照中的 [${missingWbs.join(", ")}] 目前没有绑定在这个角色身上啦，这几本书的状态无法复原呢。`,
                "温馨提示",
              );
              if (missingWbs.length === snapWbNames.length) {
                return toastr.error(
                  `当前角色没有绑定快照里的任何世界书啦，应用失败噜(＞﹏＜)`,
                );
              }
            }
            await withLoadingOverlay(async () => {
              for (const wb of curBound) {
                let wbEntries = await getWorldbook(wb);
                let changed = false;
                let targetEnabledUIDs = snapData[wb] || [];
                wbEntries.forEach((entry) => {
                  const shouldBeEnabled = targetEnabledUIDs.includes(entry.uid);
                  if (entry.enabled !== shouldBeEnabled) {
                    entry.enabled = shouldBeEnabled;
                    changed = true;
                  }
                });
                if (changed) await replaceWorldbook(wb, wbEntries);
              }
            }, "正在为您贴心复核并应用角色专享组合...");
            toastr.success(`角色场景组合 ${snapName} 已为您完美就绪！`);
            renderCharView();
          }),
        );
        $act.append(
          $(
            '<button class="menu_button interactable btn-danger wb-nowrap-btn" style="margin:0; padding:6px 10px; border:none;" title="抛掉这个快照"><i class="fa fa-trash"></i></button>',
          ).on("click", async () => {
            if (
              (await SillyTavern.callGenericPopup(
                `确认跟快照说拜拜？`,
                SillyTavern.POPUP_TYPE.CONFIRM,
              )) === SillyTavern.POPUP_RESULT.AFFIRMATIVE
            ) {
              updateVariablesWith(
                (v) => {
                  if (typeof v.wb_char_snapshots === "string") {
                    try {
                      v.wb_char_snapshots = JSON.parse(v.wb_char_snapshots);
                    } catch (e) {
                      v.wb_char_snapshots = {};
                    }
                  }
                  if (v.wb_char_snapshots && v.wb_char_snapshots[charName])
                    delete v.wb_char_snapshots[charName][snapName];
                  return v;
                },
                { type: "global" },
              );
              renderCharView();
            }
          }),
        );
        $item.append($act);
        $sCont.append($item);
      });
    }
  };

  const getCharBoundBooks = () => {
    let charBooksObj = { primary: null, additional: [] };
    try {
      if (typeof getCharWorldbookNames === "function")
        charBooksObj = getCharWorldbookNames("current") || charBooksObj;
    } catch (e) {}
    const cBooks = [];
    if (charBooksObj.primary) cBooks.push(charBooksObj.primary);
    if (charBooksObj.additional) cBooks.push(...charBooksObj.additional);
    return cBooks;
  };
  $ui.find("#wb-btn-save-char-snap").on("click", async () => {
    const charName =
      typeof getCurrentCharacterName === "function"
        ? getCurrentCharacterName()
        : typeof SillyTavern !== "undefined"
          ? SillyTavern.getContext().name2
          : null;
    if (!charName) return toastr.warning("您还未开启与任何角色的聊天哦。");
    const boundBooks = getCharBoundBooks();
    if (boundBooks.length === 0)
      return toastr.warning(
        "当前角色没有绑定任何世界书，不能创建“空气”快照哦~",
      );
    let newSnapData = {};
    await withLoadingOverlay(async () => {
      for (const wb of boundBooks) {
        let entries = await getWorldbook(wb);
        newSnapData[wb] = entries.filter((e) => e.enabled).map((e) => e.uid);
      }
    }, "正在读取现在的条目配置...");
    let vars = getVariables({ type: "global" });
    let charSnaps = vars.wb_char_snapshots;
    if (typeof charSnaps === "string") {
      try {
        charSnaps = JSON.parse(charSnaps);
      } catch (e) {
        charSnaps = {};
      }
    }
    let existingSnaps =
      charSnaps && typeof charSnaps === "object" && charSnaps[charName]
        ? charSnaps[charName]
        : {};
    let duplicateSnapName = null;
    for (const [eName, eData] of Object.entries(existingSnaps)) {
      let isSame = true;
      const eKeys = Object.keys(eData);
      const nKeys = Object.keys(newSnapData);
      if (eKeys.length !== nKeys.length) continue;
      for (let k of nKeys) {
        if (
          !eData[k] ||
          !Array.isArray(eData[k]) ||
          eData[k].length !== newSnapData[k].length
        ) {
          isSame = false;
          break;
        }
        const arr1 = [...eData[k]].sort();
        const arr2 = [...newSnapData[k]].sort();
        for (let i = 0; i < arr1.length; i++) {
          if (arr1[i] !== arr2[i]) {
            isSame = false;
            break;
          }
        }
        if (!isSame) break;
      }
      if (isSame) {
        duplicateSnapName = eName;
        break;
      }
    }
    let snapName = "";
    if (duplicateSnapName) {
      const btnRes = await SillyTavern.callGenericPopup(
        `哎呀，现在的状态和之前存过的快照【 ${duplicateSnapName} 】一模一样呢！\n想要怎么整理呢？`,
        SillyTavern.POPUP_TYPE.TEXT,
        "",
        {
          okButton: "不用存了",
          customButtons: [
            {
              text: "不管，我要存个新名字",
              result: 888,
              classes: ["btn-primary"],
            },
            {
              text: "借此机会给旧快照改个名",
              result: 999,
              classes: ["btn-warning"],
            },
          ],
        },
      );
      if (btnRes !== 888 && btnRes !== 999) return;
      snapName = await SillyTavern.callGenericPopup(
        `请为这个组合起个响亮的名字吧：`,
        SillyTavern.POPUP_TYPE.INPUT,
        btnRes === 999 ? duplicateSnapName : "新情境随笔",
      );
      if (!snapName || !(snapName = snapName.trim())) return;
      if (btnRes === 999 && snapName !== duplicateSnapName) {
        updateVariablesWith(
          (v) => {
            if (typeof v.wb_char_snapshots === "string") {
              try {
                v.wb_char_snapshots = JSON.parse(v.wb_char_snapshots);
              } catch (e) {
                v.wb_char_snapshots = {};
              }
            }
            if (v.wb_char_snapshots && v.wb_char_snapshots[charName])
              delete v.wb_char_snapshots[charName][duplicateSnapName];
            return v;
          },
          { type: "global" },
        );
      }
    } else {
      snapName = await SillyTavern.callGenericPopup(
        "请给当前的组合状态起个名字吧：",
        SillyTavern.POPUP_TYPE.INPUT,
        "新情境",
      );
      if (!snapName || !(snapName = snapName.trim())) return;
    }
    if (existingSnaps[snapName] && duplicateSnapName !== snapName) {
      const overRes = await SillyTavern.callGenericPopup(
        `名字【${snapName}】已经被占用了哦！要用新配置把它覆盖掉吗？`,
        SillyTavern.POPUP_TYPE.CONFIRM,
      );
      if (overRes !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
    }
    updateVariablesWith(
      (v) => {
        if (typeof v.wb_char_snapshots === "string") {
          try {
            v.wb_char_snapshots = JSON.parse(v.wb_char_snapshots);
          } catch (e) {
            v.wb_char_snapshots = {};
          }
        }
        if (
          !v.wb_char_snapshots ||
          typeof v.wb_char_snapshots !== "object" ||
          Array.isArray(v.wb_char_snapshots)
        )
          v.wb_char_snapshots = {};
        if (!v.wb_char_snapshots[charName]) v.wb_char_snapshots[charName] = {};
        v.wb_char_snapshots[charName][snapName] = newSnapData;
        return v;
      },
      { type: "global" },
    );
    toastr.success("角色的当前条目状态已经完美收纳进相册啦！");
    renderCharView();
  });

  const renderAssocView = () => {
    const userBooks = getPersonaWbs();
    const $uCont = $ui.find("#wb-assoc-user-list").empty();
    if (userBooks.length === 0) {
      $uCont.append(
        '<div style="color:gray; font-size:13px; padding:4px;">当前使用的 Persona 还没有绑定任何世界书呢~</div>',
      );
    } else {
      userBooks.forEach((wb) => {
        const $item = $(
          `<div style="display:inline-flex; align-items:center; gap:8px; background:var(--SmartThemeBotMesColor); border:1px solid #339af0; padding:6px 12px; border-radius:4px; transition:0.2s;"><span style="font-weight:bold; font-size:14px; color:#339af0; cursor:pointer;" title="点击编辑内容" class="wb-assoc-entry-edit"><i class="fa-solid fa-book"></i> ${wb}</span><div class="hover-red" style="cursor:pointer; color:gray; margin-left: 4px;" title="为您解绑 Persona 世界书哦"><i class="fa-solid fa-xmark"></i></div></div>`,
        );
        $item
          .find(".wb-assoc-entry-edit")
          .on("click", () => openEntryTuneView(wb, "#wb-assoc-view"));
        $item.find(".hover-red").hover(
          function () {
            $(this).css("color", "#ff6b6b");
          },
          function () {
            $(this).css("color", "gray");
          },
        );
        $item.find(".hover-red").on("click", async () => {
          await withLoadingOverlay(async () => {
            await rebindPersonaWorldbook(null, wb);
            await initiateDeepScan(true, false);
          }, "正在为你解除 Persona 的绑定...");
          renderAssocView();
          toastr.success(`已经为您解除了旧世界书的束缚啦。`);
        });
        $item.hover(
          function () {
            $(this).css("box-shadow", "0 2px 5px rgba(0,0,0,0.2)");
          },
          function () {
            $(this).css("box-shadow", "none");
          },
        );
        $uCont.append($item);
      });
    }
    const allAllWbs =
      typeof getWorldbookNames === "function" ? getWorldbookNames() : [];
    const userUnbounds = allAllWbs.filter((w) => !userBooks.includes(w));
    const updateUserSelectOptions = () => {
      const kw = $ui
        .find("#wb-assoc-user-add-search")
        .val()
        .trim()
        .toLowerCase();
      const $sel = $ui.find("#wb-assoc-user-add-sel").empty();
      const filteredWbs = kw
        ? userUnbounds.filter((w) => w.toLowerCase().includes(kw))
        : userUnbounds;
      if (filteredWbs.length > 0) {
        filteredWbs.forEach((w) =>
          $sel.append(`<option value="${w}">${w}</option>`),
        );
        $sel.prop("disabled", false);
        $ui.find("#wb-assoc-user-add-btn").prop("disabled", false);
      } else {
        $sel.append('<option value="">没有符合条件的可绑定项...</option>');
        $sel.prop("disabled", true);
        $ui.find("#wb-assoc-user-add-btn").prop("disabled", true);
      }
    };
    $ui
      .find("#wb-assoc-user-add-search")
      .off("input")
      .on("input", updateUserSelectOptions);
    updateUserSelectOptions();

    const charName =
      typeof getCurrentCharacterName === "function"
        ? getCurrentCharacterName()
        : typeof SillyTavern !== "undefined"
          ? SillyTavern.getContext().name2
          : null;
    const $cCont = $ui.find("#wb-assoc-char-list").empty();
    if (!charName) {
      $cCont.append(
        '<div style="color:#ff6b6b; font-size:13px; font-weight:bold; padding:4px;">当前好像没有打开任何角色卡的对话呢，一定要进到聊天界面里咱们才能为角色操作哦~</div>',
      );
      $ui.find("#wb-assoc-char-add-area").hide();
    } else {
      $ui.find("#wb-assoc-char-add-area").show();
      const cBooks = getCharBoundBooks();
      if (cBooks.length === 0) {
        $cCont.append(
          '<div style="color:gray; font-size:13px; padding:4px;">当前角色卡非常干净，一本世界书都没绑定呢。</div>',
        );
      } else {
        let charBooksObj = { primary: null, additional: [] };
        try {
          if (typeof getCharWorldbookNames === "function")
            charBooksObj = getCharWorldbookNames("current") || charBooksObj;
        } catch (e) {}
        cBooks.forEach((wb) => {
          const isPrimary = wb === charBooksObj.primary;
          const tagLabelHtml = isPrimary
            ? `<span style="font-size:10px; background:var(--SmartThemeQuoteColor); color:#fff; padding:2px 5px; border-radius:4px; margin-left:4px; margin-bottom:2px;">主</span>`
            : `<span style="font-size:10px; border:1px solid gray; color:gray; background:transparent; padding:1px 4px; border-radius:4px; margin-left:4px; margin-bottom:2px;">附</span>`;
          const $item = $(
            `<div style="display:inline-flex; align-items:center; gap:8px; background:var(--SmartThemeBotMesColor); border:1px solid var(--SmartThemeQuoteColor); padding:6px 12px; border-radius:4px; transition:0.2s;"><span style="font-weight:bold; font-size:14px; color:var(--SmartThemeQuoteColor); cursor:pointer; display:flex; align-items:center;" title="点击编辑内容" class="wb-assoc-entry-edit"><i class="fa-solid fa-robot" style="margin-right: 5px;"></i> ${wb} ${tagLabelHtml}</span><div class="hover-red" style="cursor:pointer; color:gray; margin-left: 4px;" title="解除绑定"><i class="fa-solid fa-xmark"></i></div></div>`,
          );
          $item
            .find(".wb-assoc-entry-edit")
            .on("click", () => openEntryTuneView(wb, "#wb-assoc-view"));
          $item.find(".hover-red").hover(
            function () {
              $(this).css("color", "#ff6b6b");
            },
            function () {
              $(this).css("color", "gray");
            },
          );
          $item.find(".hover-red").on("click", async () => {
            let newAdd = cBooks.filter((b) => b !== wb);
            let primary = newAdd.length > 0 ? newAdd.shift() : null;
            await withLoadingOverlay(async () => {
              if (typeof rebindCharWorldbooks === "function") {
                await rebindCharWorldbooks("current", {
                  primary: primary,
                  additional: newAdd,
                });
                await initiateDeepScan(true, false);
              }
            }, "正在为角色卡解除绑定...");
            renderAssocView();
          });
          $item.hover(
            function () {
              $(this).css("box-shadow", "0 2px 5px rgba(0,0,0,0.2)");
            },
            function () {
              $(this).css("box-shadow", "none");
            },
          );
          $cCont.append($item);
        });
      }
      const unbounds = allAllWbs.filter((w) => !cBooks.includes(w));
      const updateSelectOptions = () => {
        const kw = $ui
          .find("#wb-assoc-char-add-search")
          .val()
          .trim()
          .toLowerCase();
        const $sel = $ui.find("#wb-assoc-char-add-sel").empty();
        const filteredWbs = kw
          ? unbounds.filter((w) => w.toLowerCase().includes(kw))
          : unbounds;
        if (filteredWbs.length > 0) {
          filteredWbs.forEach((w) =>
            $sel.append(`<option value="${w}">${w}</option>`),
          );
          $sel.prop("disabled", false);
          $ui.find("#wb-assoc-char-add-btn").prop("disabled", false);
        } else {
          $sel.append('<option value="">没有符合条件的可绑定项...</option>');
          $sel.prop("disabled", true);
          $ui.find("#wb-assoc-char-add-btn").prop("disabled", true);
        }
      };
      $ui
        .find("#wb-assoc-char-add-search")
        .off("input")
        .on("input", updateSelectOptions);
      updateSelectOptions();
    }
  };

  $ui.find("#wb-btn-open-assoc").on("click", () => {
    renderAssocView();
    $ui.find("#wb-char-view, #wb-tab-strip").hide();
    $ui.find("#wb-assoc-view").fadeIn(200);
  });
  $ui.find("#wb-assoc-user-add-btn").on("click", async () => {
    const wb = $ui.find("#wb-assoc-user-add-sel").val();
    if (!wb) return;
    if (getPersonaWbs().length > 0) {
      if (
        (await SillyTavern.callGenericPopup(
          `通常情况下 Persona 只能绑定一本世界书哦。如果继续操作，会替换掉原本绑定的，可以吗？`,
          SillyTavern.POPUP_TYPE.CONFIRM,
        )) !== SillyTavern.POPUP_RESULT.AFFIRMATIVE
      )
        return;
    }
    await withLoadingOverlay(async () => {
      await rebindPersonaWorldbook(wb);
      await initiateDeepScan(true, false);
    }, "正在努力为你的 Persona 建立羁绊...");
    toastr.success(`成功把[${wb}] 绑定给当前的 Persona 啦！`);
    $ui.find("#wb-assoc-user-add-search").val("");
    renderAssocView();
  });
  $ui.find("#wb-assoc-char-add-btn").on("click", async () => {
    const wb = $ui.find("#wb-assoc-char-add-sel").val();
    if (!wb) return;
    let charBooksObj = { primary: null, additional: [] };
    try {
      if (typeof getCharWorldbookNames === "function")
        charBooksObj = getCharWorldbookNames("current") || charBooksObj;
    } catch (e) {}
    const cBooks = [];
    if (charBooksObj.primary) cBooks.push(charBooksObj.primary);
    if (charBooksObj.additional) cBooks.push(...charBooksObj.additional);
    cBooks.push(wb);
    const newPrimary = cBooks.shift();
    const newAdd = cBooks;
    await withLoadingOverlay(async () => {
      if (typeof rebindCharWorldbooks === "function") {
        await rebindCharWorldbooks("current", {
          primary: newPrimary,
          additional: newAdd,
        });
        await initiateDeepScan(true, false);
      }
    }, "正在努力为你当前的角色卡绑定世界书...");
    toastr.success(`成功把[${wb}] 绑定给角色卡啦！`);
    $ui.find("#wb-assoc-char-add-search").val("");
    renderAssocView();
  });
  $ui.find("#wb-btn-assoc-cancel").on("click", () => {
    $ui.find("#wb-assoc-view").hide();
    $ui.find("#wb-tab-strip, #wb-char-view").fadeIn(200);
    renderCharView();
  });

  const renderData = (highlightName = null) => {
    const keyword = $ui.find("#wb-search-input").val().toLowerCase();
    const showUnboundOnly = $ui.find("#wb-filter-unbound").is(":checked");
    const stateFilter = $ui.find("#wb-filter-state").val();
    const sortMode = $ui.find("#wb-sort-select").val();
    const wCatSettings = getCategories();
    let currentSelCat = $ui.find("#wb-category-filter").val() || "all";
    let $catDrop = $ui.find("#wb-category-filter").empty();
    $catDrop.append(
      `<option value="all">📁 所有类别</option><option value="unassigned">📂 未分类</option>`,
    );
    Object.keys(wCatSettings).forEach((cName) =>
      $catDrop.append(`<option value="${cName}">${cName}</option>`),
    );
    if (
      !Object.keys(wCatSettings).includes(currentSelCat) &&
      currentSelCat !== "unassigned"
    )
      currentSelCat = "all";
    $catDrop.val(currentSelCat);
    $ui
      .find("#wb-btn-del-category")
      .toggle(currentSelCat !== "all" && currentSelCat !== "unassigned");

    const allWbs = getWorldbookNames();
    const activeWbs = getGlobalWorldbookNames();
    let snapshots = getVariables({ type: "global" }).wb_snapshots;
    if (typeof snapshots === "string") {
      try {
        snapshots = JSON.parse(snapshots);
      } catch (e) {
        snapshots = {};
      }
    }
    if (!snapshots || typeof snapshots !== "object" || Array.isArray(snapshots))
      snapshots = {};
    currentVisibleWbs = [...allWbs]
      .filter((wb) => {
        const bindings = globalBindingMapCache[wb] || [];
        if (
          keyword &&
          !(wb + " " + bindings.map((c) => c.name).join(" "))
            .toLowerCase()
            .includes(keyword)
        )
          return false;
        if (showUnboundOnly && bindings.length > 0) return false;
        if (stateFilter === "enabled" && !activeWbs.includes(wb)) return false;
        if (stateFilter === "disabled" && activeWbs.includes(wb)) return false;
        if (currentSelCat === "unassigned") {
          const isAssigned = Object.values(wCatSettings).some(
            (list) => Array.isArray(list) && list.includes(wb),
          );
          if (isAssigned) return false;
        } else if (currentSelCat !== "all") {
          const tList = wCatSettings[currentSelCat] || [];
          if (!tList.includes(wb)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortMode === "az") return a.localeCompare(b, "zh-CN");
        if (sortMode === "za") return b.localeCompare(a, "zh-CN");
        const aA = activeWbs.includes(a),
          bA = activeWbs.includes(b);
        if (aA === bA) return a.localeCompare(b, "zh-CN");
        return aA ? -1 : 1;
      });

    const $wbContainer = $ui.find("#wb-container").empty();
    $ui.find("#wb-batch-count").text(batchSelected.size);
    const $batchList = $ui.find("#wb-batch-selected-list").empty();
    if (batchSelected.size > 0)
      batchSelected.forEach((wb) =>
        $batchList.append(
          `<span style="background:rgba(255,107,107,0.2);color:#ff6b6b;padding:3px 6px;border-radius:4px;font-size:12px;white-space:nowrap;border:1px solid #ff6b6b;"><i class="fa-solid fa-xmark"></i> ${wb}</span>`,
        ),
      );
    else
      $batchList.html(
        '<span style="color:gray; font-size:12px;">暂未选中</span>',
      );

    currentVisibleWbs.forEach((wb) => {
      const bindings = globalBindingMapCache[wb] || [];
      const myCats = Object.keys(wCatSettings).filter(
        (k) => Array.isArray(wCatSettings[k]) && wCatSettings[k].includes(wb),
      );
      const $wrapper = $('<div class="wb-item-wrapper"></div>').attr(
        "data-wb-name",
        wb,
      );
      const $header = $('<div class="wb-item-header"></div>');
      const $titleArea = $(
        '<label class="wb-item-title-area" style="cursor:pointer;"></label>',
      );
      let $chk;
      if (isBatchMode) {
        $chk = $(
          '<input type="checkbox" style="transform: scale(1.2); margin-top:2px; flex-shrink:0; accent-color:#ff6b6b;">',
        ).prop("checked", batchSelected.has(wb));
        $titleArea.on("click", (e) => {
          e.preventDefault();
          batchSelected.has(wb)
            ? batchSelected.delete(wb)
            : batchSelected.add(wb);
          renderData();
        });
      } else {
        $chk = $(
          '<input type="checkbox" style="transform: scale(1.2); margin-top:2px; flex-shrink:0;">',
        ).prop("checked", activeWbs.includes(wb));
        $chk.on("change", async function () {
          await withLoadingOverlay(async () => {
            let current = getGlobalWorldbookNames();
            $(this).is(":checked")
              ? current.push(wb)
              : (current = current.filter((n) => n !== wb));
            await rebindGlobalWorldbooks(current);
            renderData();
          }, "应用中...");
        });
      }
      $titleArea.append($chk);
      const statusStyle =
        activeWbs.includes(wb) && !isBatchMode
          ? "color: var(--SmartThemeQuoteColor);"
          : "";
      $titleArea.append(
        `<span class="wb-name-text" style="${statusStyle}" title="${wb}">${wb}</span>`,
      );
      $header.append($titleArea);
      const $bottomBar = $('<div class="wb-item-bottom"></div>');
      const $topRow = $(
        '<div class="wb-top-row" style="display:flex; align-items:center; gap:6px; width:100%;"></div>',
      );
      const $tagRow = $('<div class="wb-tag-area"></div>');
      const isBound = bindings.length > 0;
      const $bindTag = $(
        `<div class="wb-bind-tag" style="background: ${isBound ? "var(--SmartThemeQuoteColor)" : "#888"}1A; border: 1px solid ${isBound ? "var(--SmartThemeQuoteColor)" : "#888"}; color: ${isBound ? "var(--SmartThemeQuoteColor)" : "#888"};">${isBound ? `📌${bindings.length}` : `无`}</div>`,
      );
      if (isBound) $bindTag.on("click", () => openBindView(wb));
      $topRow.append($bindTag);
      const $catDrawer = $(
        '<div class="wb-cat-drawer" style="display:none; padding-top:6px; border-top:1px dashed var(--SmartThemeBorderColor); margin-top:6px; flex-direction:column; gap:6px;"></div>',
      );
      if (!isBatchMode) {
        const $actions = $('<div class="wb-item-actions"></div>');
        const isDefFav = myCats.includes("🌟默认收藏夹");
        $actions.append(
          $(
            `<div class="wb-icon-btn hover-yellow" title="一键收纳入 🌟默认收藏夹" style="color:${isDefFav ? "#fcc419" : "inherit"}"><i class="fa-${isDefFav ? "solid" : "regular"} fa-star"></i></div>`,
          ).on("click", (e) => {
            e.stopPropagation();
            let d = getCategories();
            if (!d["🌟默认收藏夹"]) d["🌟默认收藏夹"] = [];
            isDefFav
              ? (d["🌟默认收藏夹"] = d["🌟默认收藏夹"].filter((x) => x !== wb))
              : d["🌟默认收藏夹"].push(wb);
            saveCategories(d);
            renderData(wb);
          }),
        );
        $actions.append(
          $(
            `<div class="wb-icon-btn hover-blue" title="分类管理抽屉"><i class="fa-solid fa-folder-open"></i></div>`,
          ).on("click", (e) => {
            e.stopPropagation();
            const renderDrawer = () => {
              $catDrawer.empty();
              let d = getCategories();
              let cKeys = Object.keys(d);
              let _mCats = cKeys.filter((k) => d[k].includes(wb));
              const $btnGrp = $(
                '<div style="display:flex; flex-wrap:wrap; gap:6px;"></div>',
              );
              cKeys.forEach((cName) => {
                let isInside = _mCats.includes(cName);
                let $cBtn = $(
                  `<div class="wb-bind-tag" style="background:${isInside ? "var(--SmartThemeQuoteColor)" : "var(--SmartThemeBlurTintColor)"}; color:${isInside ? "#fff" : "var(--SmartThemeBodyColor)"}; border-color:${isInside ? "var(--SmartThemeQuoteColor)" : "var(--SmartThemeBorderColor)"}; cursor:pointer;"><i class="fa-solid ${isInside ? "fa-check" : "fa-folder"}"></i> ${cName}</div>`,
                );
                $cBtn.on("click", (ev) => {
                  ev.stopPropagation();
                  let curD = getCategories();
                  if (!curD[cName]) curD[cName] = [];
                  isInside
                    ? (curD[cName] = curD[cName].filter((x) => x !== wb))
                    : curD[cName].push(wb);
                  saveCategories(curD);
                  renderDrawer();
                  let allCatsSpan = Object.keys(curD).filter((k) =>
                    curD[k].includes(wb),
                  );
                  $tagRow.find(".wb-cat-tag").remove();
                  allCatsSpan.forEach((c) => {
                    const disp =
                      c === "🌟默认收藏夹"
                        ? "🌟"
                        : `<i class="fa-solid fa-folder"></i> ${c}`;
                    $tagRow.append(
                      `<div class="wb-bind-tag wb-cat-tag" style="background: rgba(252, 196, 25, 0.15); border: 1px solid #fcc419; color: #fcc419;" title="当前所在分类: ${c}">${disp}</div>`,
                    );
                  });
                });
                $btnGrp.append($cBtn);
              });
              let $newBtn = $(
                `<div class="wb-bind-tag" style="background:#51cf66; border-color:#51cf66; color:#fff; cursor:pointer;"><i class="fa-solid fa-plus"></i> 新增分类</div>`,
              );
              $newBtn.on("click", async (ev) => {
                ev.stopPropagation();
                let newCName = await SillyTavern.callGenericPopup(
                  "请告诉我新分类的名字：",
                  SillyTavern.POPUP_TYPE.INPUT,
                );
                if (newCName && (newCName = newCName.trim())) {
                  let curD = getCategories();
                  if (curD[newCName]) return toastr.warning("名字已经存在咯！");
                  curD[newCName] = [wb];
                  saveCategories(curD);
                  renderDrawer();
                  const disp =
                    newCName === "🌟默认收藏夹"
                      ? "🌟"
                      : `<i class="fa-solid fa-folder"></i> ${newCName}`;
                  $tagRow.append(
                    `<div class="wb-bind-tag wb-cat-tag" style="background: rgba(252, 196, 25, 0.15); border: 1px solid #fcc419; color: #fcc419;" title="当前所在分类: ${newCName}">${disp}</div>`,
                  );
                }
              });
              $btnGrp.append($newBtn);
              $catDrawer
                .append(
                  '<div style="font-size:12px; color:var(--SmartThemeQuoteColor); margin-bottom:4px; font-weight:bold;">✨ 点选即可收入对应分类中，可以多选哦：</div>',
                )
                .append($btnGrp);
            };
            if ($catDrawer.is(":visible")) {
              $catDrawer.slideUp(150);
            } else {
              renderDrawer();
              $catDrawer.slideDown(150);
            }
          }),
        );
        $actions
          .append(
            $(
              '<div class="wb-icon-btn" title="整理条目"><i class="fa-solid fa-list"></i></div>',
            ).on("click", () => openEntryTuneView(wb, "#wb-main-view")),
          )
          .append(
            $(
              '<div class="wb-icon-btn hover-blue" title="打包导出这本世界书 (会保留您的所有分组哦！)"><i class="fa-solid fa-download"></i></div>',
            ).on("click", async () => {
              await withLoadingOverlay(async () => {
                const entries = await getWorldbook(wb);
                let allCats = getCategories();
                let myCats = Object.keys(allCats).filter((k) =>
                  allCats[k].includes(wb),
                );
                const blob = new Blob(
                  [
                    JSON.stringify(
                      { entries: entries, name: wb, lulu_categories: myCats },
                      null,
                      2,
                    ),
                  ],
                  { type: "application/json" },
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${wb}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }, "正在为您打包这本世界书...");
              if (typeof toastr !== "undefined")
                toastr.success(`[${wb}] 已经装进小包裹，成功导出啦！`);
            }),
          )
          .append(
            $(
              '<div class="wb-icon-btn" title="重命名名称"><i class="fa-solid fa-pen"></i></div>',
            ).on("click", () =>
              attemptRenameWb(wb, bindings.length > 0, bindings),
            ),
          )
          .append(
            $(
              '<div class="wb-icon-btn hover-red" title="彻底删除"><i class="fa-solid fa-trash"></i></div>',
            ).on("click", async () => {
              if (
                (await SillyTavern.callGenericPopup(
                  `删除确认：丢失 [${wb}] ？`,
                  SillyTavern.POPUP_TYPE.CONFIRM,
                )) === SillyTavern.POPUP_RESULT.AFFIRMATIVE
              ) {
                await withLoadingOverlay(async () => {
                  await deleteWorldbook(wb);
                  delete globalBindingMapCache[wb];
                  const c = loadBindingCache();
                  if (c) {
                    delete c[wb];
                    saveBindingCache(c);
                  }
                  let d = getCategories();
                  Object.keys(d).forEach(
                    (k) => (d[k] = d[k].filter((n) => n !== wb)),
                  );
                  saveCategories(d);
                  renderData();
                }, `删除中...`);
              }
            }),
          );
        $topRow.append($actions);
      }
      $bottomBar.append($topRow);
      if (myCats && myCats.length > 0) {
        myCats.forEach((c) => {
          const disp =
            c === "🌟默认收藏夹"
              ? "🌟"
              : `<i class="fa-solid fa-folder"></i> ${c}`;
          $tagRow.append(
            `<div class="wb-bind-tag wb-cat-tag" style="background: rgba(252, 196, 25, 0.15); border: 1px solid #fcc419; color: #fcc419;" title="当前所在分类: ${c}">${disp}</div>`,
          );
        });
      }
      if ($tagRow.children().length > 0) {
        $bottomBar.append($tagRow);
      }
      $wrapper.append($header).append($bottomBar).append($catDrawer);
      $wbContainer.append($wrapper);
    });

    if (highlightName) {
      setTimeout(() => {
        const $highlightItem = $wbContainer.find(
          `[data-wb-name="${highlightName}"]`,
        );
        if ($highlightItem.length) {
          $highlightItem[0].scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          $highlightItem.addClass("wb-highlight");
          setTimeout(() => $highlightItem.removeClass("wb-highlight"), 1000);
        }
      }, 100);
    }

    const $snapContainer = $ui.find("#wb-snapshot-container").empty();
    Object.entries(snapshots).forEach(([name, snapData]) => {
      const isDetailed =
        !Array.isArray(snapData) && snapData.type === "detailed";
      const wbs = isDetailed
        ? Object.keys(snapData.data)
        : Array.isArray(snapData)
          ? snapData
          : snapData.wbs;
      const $item = $(
        `<div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--SmartThemeBotMesColor); border-radius:6px; border:1px solid var(--SmartThemeBorderColor); flex-wrap:wrap; gap:8px;"></div>`,
      );
      $item.append(
        `<div style="flex:1; min-width: 150px;"><div style="font-weight:bold;font-size:14px;"><i class="fa-solid ${isDetailed ? "fa-puzzle-piece" : "fa-box-archive"}" style="color:var(--SmartThemeQuoteColor);"></i> ${name}</div><div style="font-size:12px;color:gray;">${isDetailed ? `含 ${Object.values(snapData.data).reduce((a, c) => a + c.length, 0)} 个内容微调` : `含 ${(wbs || []).length} 项设定`}</div></div>`,
      );
      const $act = $(
        '<div style="display:flex; gap:6px; flex-wrap: wrap;"></div>',
      );
      $act.append(
        $(
          '<button class="menu_button interactable btn-success wb-nowrap-btn" style="margin:0; padding:6px 12px; font-size:12px; border:none;">应用该组合</button>',
        ).on("click", async () => {
          if (isDetailed) await applyDetailedSnapshot(snapData.data);
          else
            await withLoadingOverlay(
              async () => await rebindGlobalWorldbooks(wbs),
              `应用中...`,
            );
          toastr.success("组合已应用。");
          renderData();
        }),
      );
      $act.append(
        $(
          '<button class="menu_button interactable wb-nowrap-btn" style="margin:0; padding:6px 10px;" title="编辑项"><i class="fa fa-pen"></i></button>',
        ).on("click", () =>
          isDetailed
            ? openDetailedSnapView(name, snapData.data)
            : openEditSnapView(name, wbs),
        ),
      );
      $act.append(
        $(
          '<button class="menu_button interactable btn-danger wb-nowrap-btn" style="margin:0; padding:6px 10px; border:none;" title="删除快照"><i class="fa fa-trash"></i></button>',
        ).on("click", async () => {
          if (
            (await SillyTavern.callGenericPopup(
              `确认删除快照？`,
              SillyTavern.POPUP_TYPE.CONFIRM,
            )) === SillyTavern.POPUP_RESULT.AFFIRMATIVE
          ) {
            updateVariablesWith(
              (v) => {
                if (typeof v.wb_snapshots === "string") {
                  try {
                    v.wb_snapshots = JSON.parse(v.wb_snapshots);
                  } catch (e) {
                    v.wb_snapshots = {};
                  }
                }
                if (v.wb_snapshots) delete v.wb_snapshots[name];
                return v;
              },
              { type: "global" },
            );
            renderData();
          }
        }),
      );
      $item.append($act);
      $snapContainer.append($item);
    });
  };

  let activeBindWb = "";
  const openBindView = (wbName) => {
    activeBindWb = wbName;
    $ui.find("#wb-bind-title").text(wbName);
    $ui.find("#wb-main-view, #wb-tab-strip").hide();
    $ui.find("#wb-bind-view").fadeIn();
    renderBindList();
  };
  const renderBindList = () => {
    const kw = $ui.find("#wb-bind-search").val().toLowerCase();
    const $cont = $ui.find("#wb-bind-container").empty();
    const bChars = globalBindingMapCache[activeBindWb] || [];
    (kw
      ? bChars.filter((c) => c.name.toLowerCase().includes(kw))
      : bChars
    ).forEach((char) => {
      $cont.append(
        `<div style="display:flex; justify-content:space-between; align-items:center; background: var(--SmartThemeBotMesColor); border: 1px solid var(--SmartThemeBorderColor); border-radius:6px; padding: 10px;"><div style="display:flex; align-items:center; gap:12px;"><img src="${SillyTavern && typeof SillyTavern.getThumbnailUrl === "function" ? SillyTavern.getThumbnailUrl(char.name.includes("用户") ? "persona" : "avatar", char.avatar) : ""}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:2px solid var(--SmartThemeQuoteColor); background:#333;"><div style="display:flex; flex-direction:column;"><span style="font-weight:bold; font-size:14px; margin-bottom:2px;">${char.name}</span><div style="font-size:11px;color:gray;">(${char.avatar})</div></div></div></div>`,
      );
    });
    if (bChars.length === 0)
      $cont.html(
        '<div style="padding:15px; color:gray; text-align:center;">这本书目前可以说是非常地清闲，没有任何绑定呢~</div>',
      );
  };
  $ui.find("#wb-bind-search").on("input", renderBindList);
  $ui.find("#wb-btn-bind-cancel").on("click", () => {
    $ui.find("#wb-bind-view").hide();
    $ui.find("#wb-tab-strip, #wb-main-view").fadeIn();
  });

  $ui.find("#wb-btn-save-snap").on("click", async () => {
    let vars = getVariables({ type: "global" });
    let snapshots = vars.wb_snapshots;
    if (typeof snapshots === "string") {
      try {
        snapshots = JSON.parse(snapshots);
      } catch (e) {
        snapshots = {};
      }
    }
    if (!snapshots || typeof snapshots !== "object" || Array.isArray(snapshots))
      snapshots = {};
    const currentActive = getGlobalWorldbookNames();
    if (currentActive.length === 0)
      return toastr.warning("当前没有全局启用的世界书，不能创建空气快照哦~");
    let duplicateSnapName = null;
    for (const [sName, sData] of Object.entries(snapshots)) {
      if (sData.type === "simple" || !sData.type) {
        const wbs = Array.isArray(sData) ? sData : sData.wbs || [];
        if (wbs.length === currentActive.length) {
          let a = [...currentActive].sort();
          let b = [...wbs].sort();
          if (a.every((val, idx) => val === b[idx])) {
            duplicateSnapName = sName;
            break;
          }
        }
      }
    }
    let snapName = "";
    if (duplicateSnapName) {
      const btnRes = await SillyTavern.callGenericPopup(
        `哎呀，现在的状态和之前存过的快照【 ${duplicateSnapName} 】一模一样呢！\n想要怎么整理呢？`,
        SillyTavern.POPUP_TYPE.TEXT,
        "",
        {
          okButton: "不用存了",
          customButtons: [
            {
              text: "不管，我要以新名字另外存",
              result: 888,
              classes: ["btn-primary"],
            },
            { text: "借此机会给它改名", result: 999, classes: ["btn-warning"] },
          ],
        },
      );
      if (btnRes !== 888 && btnRes !== 999) return;
      snapName = await SillyTavern.callGenericPopup(
        "请为这个组合起个响亮的名字吧：",
        SillyTavern.POPUP_TYPE.INPUT,
        btnRes === 999 ? duplicateSnapName : "新全局快照",
      );
      if (!snapName || !(snapName = snapName.trim())) return;
      if (btnRes === 999 && snapName !== duplicateSnapName) {
        delete snapshots[duplicateSnapName];
      }
    } else {
      snapName = await SillyTavern.callGenericPopup(
        "创建新前置组合名称：",
        SillyTavern.POPUP_TYPE.INPUT,
        "新备份组合",
      );
      if (!snapName || !(snapName = snapName.trim())) return;
    }
    if (snapshots[snapName] && duplicateSnapName !== snapName) {
      const overRes = await SillyTavern.callGenericPopup(
        `名字【${snapName}】已经被占用了哦！要用新配置把它覆盖掉吗？`,
        SillyTavern.POPUP_TYPE.CONFIRM,
      );
      if (overRes !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
    }
    snapshots[snapName] = { type: "simple", wbs: currentActive };
    updateVariablesWith(
      (v) => {
        v.wb_snapshots = snapshots;
        return v;
      },
      { type: "global" },
    );
    toastr.success("组合已经存好啦！");
    renderData();
  });

  let snapOldName = "",
    snapTempList = [];
  const openEditSnapView = (name, list) => {
    snapOldName = name;
    snapTempList = [...list];
    $ui.find("#wb-edit-snap-name").val(name);
    const buildList = () => {
      const kw = $ui.find("#wb-edit-snap-search").val().toLowerCase();
      const $c = $ui.find("#wb-edit-snap-container").empty();
      [...getWorldbookNames()]
        .sort((a, b) => {
          const ac = snapTempList.includes(a),
            bc = snapTempList.includes(b);
          return ac === bc ? a.localeCompare(b, "zh-CN") : ac ? -1 : 1;
        })
        .forEach((w) => {
          if (kw && !w.toLowerCase().includes(kw)) return;
          const isChk = snapTempList.includes(w);
          const $wHolder = $(
            `<div class="wb-item-wrapper" style="flex-direction:row; align-items:center; cursor:pointer;"></div>`,
          );
          const $chkBox = $(
            `<input type="checkbox" style="transform:scale(1.2); flex-shrink:0;">`,
          ).prop("checked", isChk);
          $wHolder
            .append(
              $chkBox,
              `<span class="wb-name-text" style="${isChk ? "font-weight:bold;color:var(--SmartThemeQuoteColor)" : ""}">${w}</span>`,
            )
            .on("click", () =>
              $chkBox
                .prop("checked", !$chkBox.is(":checked"))
                .trigger("change"),
            );
          $chkBox.on("change", function () {
            $(this).is(":checked")
              ? snapTempList.includes(w) || snapTempList.push(w)
              : (snapTempList = snapTempList.filter((n) => n !== w));
            buildList();
          });
          $c.append($wHolder);
        });
    };
    $ui
      .find("#wb-edit-snap-search")
      .off("input")
      .on("input", buildList)
      .val("");
    buildList();
    $ui.find("#wb-main-view, #wb-tab-strip").hide();
    $ui.find("#wb-edit-snap-view").fadeIn(200);
  };
  $ui.find("#wb-btn-edit-save").on("click", async () => {
    const nName = $ui.find("#wb-edit-snap-name").val().trim();
    if (!nName) return toastr.warning("名称不能为空哦。");
    updateVariablesWith(
      (v) => {
        if (typeof v.wb_snapshots === "string") {
          try {
            v.wb_snapshots = JSON.parse(v.wb_snapshots);
          } catch (e) {
            v.wb_snapshots = {};
          }
        }
        if (
          !v.wb_snapshots ||
          typeof v.wb_snapshots !== "object" ||
          Array.isArray(v.wb_snapshots)
        )
          v.wb_snapshots = {};
        if (nName !== snapOldName) delete v.wb_snapshots[snapOldName];
        v.wb_snapshots[nName] = { type: "simple", wbs: snapTempList };
        return v;
      },
      { type: "global" },
    );
    toastr.success("快照已成功更新！");
    $ui.find("#wb-edit-snap-view").hide();
    $ui.find("#wb-tab-strip, #wb-main-view").fadeIn();
    renderData();
  });
  $ui.find("#wb-btn-edit-cancel").on("click", () => {
    $ui.find("#wb-edit-snap-view").hide();
    $ui.find("#wb-tab-strip, #wb-main-view").fadeIn();
  });

  let detailedSnapData = {};
  let detailedSnapOldName = "";
  let currentOpenedDsWb = "";
  const openDetailedSnapView = (name = "", existingData = {}) => {
    detailedSnapOldName = name;
    detailedSnapData = JSON.parse(JSON.stringify(existingData));
    $ui.find("#dsnap-name").val(name);
    const savedDsPreview =
      localStorage.getItem("lulu_wb_dsnap_preview") === "true";
    $ui.find("#dsnap-toggle-preview").prop("checked", savedDsPreview);
    const $wbList = $ui.find("#dsnap-wb-list").empty(),
      $entryList = $ui.find("#dsnap-entry-list").empty(),
      allWbs = getWorldbookNames();
    const renderWbList = () => {
      const keyword = $ui.find("#dsnap-wb-search").val().toLowerCase(),
        hideBound = $ui.find("#dsnap-filter-unbound").is(":checked");
      $wbList.empty();
      const filteredWbs = allWbs.filter(
        (wb) =>
          wb.toLowerCase().includes(keyword) &&
          (!hideBound || (globalBindingMapCache[wb] || []).length === 0),
      );
      filteredWbs.forEach((wbName) => {
        const selectedCount = (detailedSnapData[wbName] || []).length;
        const $item = $(
          `<div class="dsnap-wb-item" data-wbname="${wbName}">${wbName} <b style="color:var(--okGreen); display:${selectedCount > 0 ? "inline" : "none"};">(${selectedCount})</b></div>`,
        );
        $item.on("click", async () => {
          if ($item.hasClass("active")) return;
          $wbList.find(".active").removeClass("active");
          $item.addClass("active");
          currentOpenedDsWb = wbName;
          await renderEntryListFor(wbName);
        });
        $wbList.append($item);
      });
      if ($wbList.find(".active").length === 0 && filteredWbs.length > 0)
        $wbList.children().first().trigger("click");
      else if (filteredWbs.length === 0)
        $entryList.html(
          '<div style="color:gray;text-align:center;padding:20px;">未找到匹配的世界书</div>',
        );
    };
    $ui
      .find("#dsnap-wb-search, #dsnap-filter-unbound")
      .off("input change")
      .on("input change", renderWbList);
    $ui.find("#dsnap-wb-search").val("");
    const renderEntryListFor = async (wbName) => {
      $entryList.html(
        '<div style="padding:20px;text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> 正在加载条目...</div>',
      );
      try {
        const entries = await getWorldbook(wbName);
        if (entries.length === 0) {
          $entryList.html(
            '<div style="color:gray; text-align:center; padding:15px;">这本书是空的...</div>',
          );
          return;
        }
        renderDsEntryItems(entries, wbName);
      } catch (e) {
        $entryList.html(
          '<div style="color:red; text-align:center;">加载条目失败！</div>',
        );
      }
    };
    const renderDsEntryItems = (entries, wbName) => {
      $entryList.empty();
      let displayEntries = [...entries];
      const sortMode = $ui.find("#dsnap-entry-sort").val() || "default";
      const showDsPreview = $ui.find("#dsnap-toggle-preview").is(":checked");
      if (sortMode === "order_asc")
        displayEntries.sort(
          (a, b) => (a.position?.order ?? 100) - (b.position?.order ?? 100),
        );
      else if (sortMode === "order_desc")
        displayEntries.sort(
          (a, b) => (b.position?.order ?? 100) - (a.position?.order ?? 100),
        );
      else if (sortMode === "depth_asc")
        displayEntries.sort(
          (a, b) => (a.position?.depth ?? 0) - (b.position?.depth ?? 0),
        );
      else if (sortMode === "depth_desc")
        displayEntries.sort(
          (a, b) => (b.position?.depth ?? 0) - (a.position?.depth ?? 0),
        );
      else if (sortMode === "az")
        displayEntries.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "", "zh-CN"),
        );
      else if (sortMode === "za")
        displayEntries.sort((a, b) =>
          (b.name || "").localeCompare(a.name || "", "zh-CN"),
        );
      displayEntries.forEach((entry) => {
        const isChecked = (detailedSnapData[wbName] || []).includes(entry.uid);
        const rawStateColor = entry.enabled ? "var(--okGreen)" : "gray",
          sType = entry.strategy?.type,
          StrategyTxt = sType === "selective" ? "🟩 匹配" : "🟦 常驻",
          posBadge = formatPositionBadge(entry.position);
        const previewHtml =
          showDsPreview && entry.content
            ? `<div class="dsnap-entry-preview">${String(entry.content).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`
            : "";
        const $item = $(
          `<div class="dsnap-entry-item" style="border-left: 3px solid ${rawStateColor};"><input type="checkbox" style="transform:scale(1.15); margin-top:2px; flex-shrink:0;"><div class="dsnap-entry-body"><div class="dsnap-entry-title">${entry.name || `(未命名条目)`}</div><div class="dsnap-entry-meta-row"><span class="${entry.enabled ? "badge-green" : "badge-grey"}">${entry.enabled ? "原始已启" : "原始关闭"}</span><span class="badge-blue">${StrategyTxt}</span><span class="dsnap-entry-pos">${posBadge}</span></div>${previewHtml}</div></div>`,
        );
        $item
          .find("input")
          .prop("checked", isChecked)
          .on("change", function () {
            const checked = $(this).is(":checked");
            if (!detailedSnapData[wbName]) detailedSnapData[wbName] = [];
            if (checked) {
              if (!detailedSnapData[wbName].includes(entry.uid))
                detailedSnapData[wbName].push(entry.uid);
            } else {
              detailedSnapData[wbName] = detailedSnapData[wbName].filter(
                (uid) => uid !== entry.uid,
              );
            }
            if (detailedSnapData[wbName].length === 0)
              delete detailedSnapData[wbName];
            const newCount = (detailedSnapData[wbName] || []).length,
              $counter = $wbList.find(
                `.dsnap-wb-item.active[data-wbname="${wbName}"] b`,
              );
            $counter.text(`(${newCount})`);
            newCount > 0 ? $counter.show() : $counter.hide();
          });
        $entryList.append($item);
      });
    };
    $ui
      .find("#dsnap-entry-sort")
      .off("change")
      .on("change", async () => {
        if (currentOpenedDsWb) {
          const entries = await getWorldbook(currentOpenedDsWb);
          renderDsEntryItems(entries, currentOpenedDsWb);
        }
      });
    $ui
      .find("#dsnap-toggle-preview")
      .off("change")
      .on("change", async function () {
        localStorage.setItem("lulu_wb_dsnap_preview", $(this).is(":checked"));
        if (currentOpenedDsWb) {
          const entries = await getWorldbook(currentOpenedDsWb);
          renderDsEntryItems(entries, currentOpenedDsWb);
        }
      });
    renderWbList();
    $ui
      .find(
        "#wb-main-view, #wb-edit-snap-view, #wb-assoc-view, #wb-tab-strip, #wb-char-view",
      )
      .hide();
    $ui.find("#wb-detailed-snap-view").fadeIn(200);
  };
  const applyDetailedSnapshot = async (data) => {
    await withLoadingOverlay(async () => {
      const allWbNames = getWorldbookNames(),
        targetWbNames = Object.keys(data);
      for (const wbName of allWbNames) {
        let wbEntries = await getWorldbook(wbName),
          changed = false;
        if (targetWbNames.includes(wbName)) {
          const enabledUIDs = data[wbName];
          wbEntries.forEach((entry) => {
            const shouldBeEnabled = enabledUIDs.includes(entry.uid);
            if (entry.enabled !== shouldBeEnabled) {
              entry.enabled = shouldBeEnabled;
              changed = true;
            }
          });
        } else {
          wbEntries.forEach((entry) => {
            if (entry.enabled) {
              entry.enabled = false;
              changed = true;
            }
          });
        }
        if (changed) await replaceWorldbook(wbName, wbEntries);
      }
      await rebindGlobalWorldbooks(targetWbNames);
    }, "正在应用复合场景...");
  };
  $ui
    .find("#wb-btn-create-detail-snap")
    .on("click", () => openDetailedSnapView());
  $ui
    .find("#dsnap-save")
    .off("click")
    .on("click", async () => {
      const name = $ui.find("#dsnap-name").val().trim();
      if (!name) return toastr.warning("也要留下好听的名字啊！");
      let vars = getVariables({ type: "global" });
      let snapshots = vars.wb_snapshots;
      if (typeof snapshots === "string") {
        try {
          snapshots = JSON.parse(snapshots);
        } catch (e) {
          snapshots = {};
        }
      }
      if (
        !snapshots ||
        typeof snapshots !== "object" ||
        Array.isArray(snapshots)
      )
        snapshots = {};
      let duplicateSnapName = null;
      for (const [sName, sData] of Object.entries(snapshots)) {
        if (sData.type === "detailed" && sName !== detailedSnapOldName) {
          const eData = sData.data;
          const nData = detailedSnapData;
          const eKeys = Object.keys(eData);
          const nKeys = Object.keys(nData);
          if (eKeys.length !== nKeys.length) continue;
          let isSame = true;
          for (let k of nKeys) {
            if (!eData[k] || eData[k].length !== nData[k].length) {
              isSame = false;
              break;
            }
            let arr1 = [...eData[k]].sort();
            let arr2 = [...nData[k]].sort();
            for (let i = 0; i < arr1.length; i++) {
              if (arr1[i] !== arr2[i]) {
                isSame = false;
                break;
              }
            }
            if (!isSame) break;
          }
          if (isSame) {
            duplicateSnapName = sName;
            break;
          }
        }
      }
      if (duplicateSnapName) {
        const warnRes = await SillyTavern.callGenericPopup(
          `欸？发现您刚才配好的复合内容，和现有的快照【 ${duplicateSnapName} 】内部细节完全一致呢！\n确定还是要作为一个独立的新快照保存吗？`,
          SillyTavern.POPUP_TYPE.CONFIRM,
        );
        if (warnRes !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
      }
      if (snapshots[name] && name !== detailedSnapOldName) {
        const overRes = await SillyTavern.callGenericPopup(
          `名字【${name}】已经被别的快照占用了哦！要覆盖掉它吗？`,
          SillyTavern.POPUP_TYPE.CONFIRM,
        );
        if (overRes !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
      }
      if (name !== detailedSnapOldName && detailedSnapOldName)
        delete snapshots[detailedSnapOldName];
      snapshots[name] = { type: "detailed", data: detailedSnapData };
      updateVariablesWith(
        (v) => {
          v.wb_snapshots = snapshots;
          return v;
        },
        { type: "global" },
      );
      toastr.success(`复合快照保存好啦。`);
      $ui.find("#wb-detailed-snap-view").hide();
      $ui.find("#wb-tab-strip, #wb-main-view").fadeIn(200);
      renderData();
    });
  $ui.find("#dsnap-cancel").on("click", () => {
    $ui.find("#wb-detailed-snap-view").hide();
    $ui.find("#wb-tab-strip, #wb-main-view").fadeIn(200);
  });

  let tuneWbName = "";
  let tuneEntries = [];
  let originalTuneEntries = [];
  let tuneReturnView = "#wb-main-view";

  const openEntryTuneView = async (wbName, fromView = "#wb-main-view") => {
    tuneReturnView = fromView;
    tuneWbName = wbName;
    $ui.find("#wb-entry-title").text(wbName);
    $ui.find("#wb-entry-search").val("");
    $ui.find("#wb-entry-sort").val("default");
    await withLoadingOverlay(async () => {
      const fetched = await getWorldbook(wbName);
      tuneEntries = JSON.parse(JSON.stringify(fetched));
      originalTuneEntries = JSON.parse(JSON.stringify(fetched));
    }, `提取内容...`);
    isEntryBatchMode = false;
    entryBatchSelected.clear();
    $ui
      .find("#wb-btn-entry-batch")
      .removeClass("btn-warning")
      .addClass("btn-danger")
      .html('<i class="fa-solid fa-layer-group"></i> 批量操作');
    $ui.find("#wb-entry-batch-actions").hide();

    // 初始化详情区：桌面端默认隐藏，手机端默认显示（上下同屏）
    if (window.innerWidth <= 768) {
      $ui.find("#wb-entry-detail-side").css("display", "flex");
      $ui.find("#wb-btn-det-close-mobile").hide();
      $ui.find("#wb-btn-det-cancel").show();
    } else {
      $ui.find("#wb-entry-detail-side").hide(); // 默认未点击时不占用分栏宽度
    }

    // 强制触发一次预览开关状态检测
    const isPreview = localStorage.getItem("lulu_wb_entry_preview") === "true";
    $ui.find("#wb-toggle-entry-preview").prop("checked", isPreview);

    renderEntryList();
    $ui
      .find("#wb-main-view, #wb-assoc-view, #wb-tab-strip, #wb-char-view")
      .hide();
    $ui.find("#wb-manager-panel").addClass("wb-entry-focus");
    $ui.find("#wb-entry-view").fadeIn(200);
  };

  // 预览开关事件
  $ui.find("#wb-toggle-entry-preview").on("change", function () {
    localStorage.setItem("lulu_wb_entry_preview", $(this).is(":checked"));
    renderEntryList();
  });

  $ui.find("#wb-btn-entry-batch").on("click", function () {
    isEntryBatchMode = !isEntryBatchMode;
    if (isEntryBatchMode) {
      entryBatchSelected.clear();
      $(this)
        .removeClass("btn-danger")
        .addClass("btn-warning")
        .html('<i class="fa-solid fa-xmark"></i> 退出批量');
      $ui.find("#wb-entry-batch-actions").css("display", "flex");
    } else {
      $(this)
        .removeClass("btn-warning")
        .addClass("btn-danger")
        .html('<i class="fa-solid fa-layer-group"></i> 批量操作');
      $ui.find("#wb-entry-batch-actions").hide();
    }
    renderEntryList();
  });

  $ui.find("#wb-btn-entry-confirm-delete").on("click", async () => {
    if (entryBatchSelected.size === 0)
      return toastr.warning("请先选中要删除的条目哦~");
    if (
      (await SillyTavern.callGenericPopup(
        `确认要暂时移除这 ${entryBatchSelected.size} 项内容吗？\n(移除后还需要点击最下方绿色保存按钮才会生效哦)`,
        SillyTavern.POPUP_TYPE.CONFIRM,
      )) === SillyTavern.POPUP_RESULT.AFFIRMATIVE
    ) {
      let sortedIndices = Array.from(entryBatchSelected).sort((a, b) => b - a);
      sortedIndices.forEach((idx) => tuneEntries.splice(idx, 1));
      entryBatchSelected.clear();
      renderEntryList();
      toastr.success(
        "勾选的内容都暂存移除了，记得点确认保存把变更写入源文件哦！",
      );
    }
  });

  $ui.find("#wb-btn-entry-batch-group").on("click", async () => {
    if (entryBatchSelected.size === 0)
      return toastr.warning("请先选中想要分类的条目哦~");
    let newGroup = await SillyTavern.callGenericPopup(
      "请输入这些条目想去的分组名称\\n(留空的话它们就会变回 '未分类' 哦):",
      SillyTavern.POPUP_TYPE.INPUT,
      "",
    );
    if (newGroup !== null) {
      entryBatchSelected.forEach(
        (idx) => (tuneEntries[idx].group = newGroup.trim()),
      );
      entryBatchSelected.clear();
      $ui.find("#wb-entry-batch-count").text("0");
      renderEntryList();
      toastr.success("批量改组完成！记得点绿色保存按钮才会生效哦~");
    }
  });

  let wbEntryGroupState = {};

  const renderEntryList = () => {
    const keyword = $ui.find("#wb-entry-search").val().toLowerCase();
    const sortMode = $ui.find("#wb-entry-sort").val() || "default";
    const $container = $ui.find("#wb-entry-container").empty();
    $ui.find("#wb-entry-batch-count").text(entryBatchSelected.size);
    const showPreview = $ui.find("#wb-toggle-entry-preview").is(":checked");

    const filteredEntries = tuneEntries.filter((entry) => {
      const searchStr =
        `${entry.name || ""} ${(entry.strategy?.keys || []).join(",")} ${showPreview ? entry.content || "" : ""}`.toLowerCase();
      return !keyword || searchStr.includes(keyword);
    });

    let sortedEntries = [...filteredEntries];
    if (sortMode === "order_asc")
      sortedEntries.sort(
        (a, b) => (a.position?.order ?? 100) - (b.position?.order ?? 100),
      );
    else if (sortMode === "order_desc")
      sortedEntries.sort(
        (a, b) => (b.position?.order ?? 100) - (a.position?.order ?? 100),
      );
    else if (sortMode === "depth_asc")
      sortedEntries.sort(
        (a, b) => (a.position?.depth ?? 0) - (b.position?.depth ?? 0),
      );
    else if (sortMode === "depth_desc")
      sortedEntries.sort(
        (a, b) => (b.position?.depth ?? 0) - (a.position?.depth ?? 0),
      );
    else if (sortMode === "az")
      sortedEntries.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", "zh-CN"),
      );
    else if (sortMode === "za")
      sortedEntries.sort((a, b) =>
        (b.name || "").localeCompare(a.name || "", "zh-CN"),
      );

    $ui
      .find("#wb-btn-entry-batch-select-all")
      .off("click")
      .on("click", () => {
        sortedEntries.forEach((entry) =>
          entryBatchSelected.add(tuneEntries.indexOf(entry)),
        );
        renderEntryList();
      });
    $ui
      .find("#wb-btn-entry-batch-deselect-all")
      .off("click")
      .on("click", () => {
        sortedEntries.forEach((entry) =>
          entryBatchSelected.delete(tuneEntries.indexOf(entry)),
        );
        renderEntryList();
      });

    const groupedEntries = {};
    sortedEntries.forEach((entry) => {
      let g =
        entry.group && entry.group.trim() !== ""
          ? entry.group.trim()
          : "📁 未分类条目";
      if (!groupedEntries[g]) groupedEntries[g] = [];
      groupedEntries[g].push(entry);
    });

    let sharedOrder = getSharedGroupOrder();
    let orderChanged = false;
    Object.keys(groupedEntries).forEach((g) => {
      if (g !== "📁 未分类条目" && !sharedOrder.includes(g)) {
        sharedOrder.push(g);
        orderChanged = true;
      }
    });
    if (orderChanged) setSharedGroupOrder(sharedOrder);

    const sortedGroupNames = Object.keys(groupedEntries).sort((a, b) => {
      if (a === "📁 未分类条目") return 1;
      if (b === "📁 未分类条目") return -1;
      let idxA = sharedOrder.indexOf(a);
      let idxB = sharedOrder.indexOf(b);
      if (idxA === -1) idxA = 9999;
      if (idxB === -1) idxB = 9999;
      return idxA - idxB;
    });

    for (const groupName of sortedGroupNames) {
      const gEntries = groupedEntries[groupName];
      const isCollapsed = wbEntryGroupState[groupName] === true;
      const isDraggable = groupName !== "📁 未分类条目";
      const dragIcon = isDraggable
        ? `<i class="fa-solid fa-hand-paper lulu-panel-drag-handle" style="cursor:grab; margin-right:8px; color:gray;" title="按住拖拽排序"></i>`
        : "";
      const $gHeader =
        $(`<div class="lulu-ui-group-header" data-groupname="${groupName}" draggable="${isDraggable ? "true" : "false"}" style="background: rgba(0,0,0,0.15); padding:8px 12px; margin-top:8px; border-radius:6px; cursor:pointer; font-weight:bold; color:var(--SmartThemeBodyColor); border:1px solid var(--SmartThemeBorderColor); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <span style="display:flex; align-items:center;">${dragIcon}<i class="fa-solid ${isCollapsed ? "fa-chevron-right" : "fa-chevron-down"}" style="margin-right:6px; color:var(--SmartThemeQuoteColor);"></i>${groupName}<span style="font-size:12px; color:gray; font-weight:normal; margin-left:4px;">( ${gEntries.length} 项 )</span></span>
                <div style="display:flex; gap:6px;" class="lulu-group-ctrls">${isDraggable ? `<i class="fa-solid fa-arrow-up lulu-btn-up" title="上移" style="padding:6px; font-size:12px; color:gray; cursor:pointer; background:rgba(125,125,125,0.15); border-radius:4px; transition:0.2s;"></i><i class="fa-solid fa-arrow-down lulu-btn-down" title="下移" style="padding:6px; font-size:12px; color:gray; cursor:pointer; background:rgba(125,125,125,0.15); border-radius:4px; margin-right:10px; transition:0.2s;"></i>` : ""}
                    <button class="menu_button interactable wb-nowrap-btn wb-group-enable-all" style="margin:0; padding:4px 8px; font-size:11px; background:rgba(81, 207, 102, 0.15); color:#51cf66; border:1px solid rgba(81, 207, 102, 0.5);" title="开启该组所有条目"><i class="fa-solid fa-check"></i> 全开</button>
                    <button class="menu_button interactable wb-nowrap-btn wb-group-disable-all" style="margin:0; padding:4px 8px; font-size:11px; background:rgba(150, 150, 150, 0.15); color:gray; border:1px solid rgba(150, 150, 150, 0.5);" title="关闭该组所有条目"><i class="fa-solid fa-xmark"></i> 全关</button>
                    ${isDraggable ? `<button class="menu_button interactable wb-nowrap-btn wb-group-delete" style="margin:0; padding:4px 8px; font-size:11px; background:rgba(255, 107, 107, 0.15); color:#ff6b6b; border:1px solid rgba(255, 107, 107, 0.5);" title="删除分组或解散"><i class="fa-solid fa-trash"></i> 删除</button>` : ""}
                </div></div>`);
      const $gContainer = $(
        `<div style="display:${isCollapsed ? "none" : "flex"}; flex-direction:column; padding-left:10px; margin-top:6px; border-left: 2px solid var(--SmartThemeBorderColor); gap: 4px;"></div>`,
      );

      $gHeader.on("click", (e) => {
        if (
          $(e.target).closest(".lulu-group-ctrls").length ||
          $(e.target).hasClass("lulu-panel-drag-handle")
        )
          return;
        wbEntryGroupState[groupName] = !isCollapsed;
        renderEntryList();
      });

      // 组级别的功能拖动挂载（省略细节保持原状）
      if (isDraggable) {
        $gHeader.on("dragstart", function (e) {
          e.originalEvent.dataTransfer.setData("text/plain", groupName);
          $(this).addClass("lulu-drag-ghost");
        });
        $gHeader.on("dragend", function () {
          $(this).removeClass("lulu-drag-ghost");
          $(".lulu-drag-over-top, .lulu-drag-over-bottom").removeClass(
            "lulu-drag-over-top lulu-drag-over-bottom",
          );
        });
        $gHeader.on("dragover", function (e) {
          e.preventDefault();
          const rect = this.getBoundingClientRect();
          const isBottomHalf =
            e.originalEvent.clientY > rect.top + rect.height / 2;
          if (isBottomHalf) {
            $(this)
              .removeClass("lulu-drag-over-top")
              .addClass("lulu-drag-over-bottom");
          } else {
            $(this)
              .removeClass("lulu-drag-over-bottom")
              .addClass("lulu-drag-over-top");
          }
        });
        $gHeader.on("dragleave", function () {
          $(this).removeClass("lulu-drag-over-top lulu-drag-over-bottom");
        });
        $gHeader.on("drop", function (e) {
          e.preventDefault();
          $(this).removeClass("lulu-drag-over-top lulu-drag-over-bottom");
          const draggedGrp = e.originalEvent.dataTransfer.getData("text/plain");
          const targetGrp = $(this).attr("data-groupname");
          if (
            draggedGrp &&
            draggedGrp !== targetGrp &&
            draggedGrp !== "📁 未分类条目" &&
            targetGrp !== "📁 未分类条目"
          ) {
            let order = getSharedGroupOrder();
            const fromIdx = order.indexOf(draggedGrp);
            if (fromIdx > -1) {
              const rect = this.getBoundingClientRect();
              const isBottomHalf =
                e.originalEvent.clientY > rect.top + rect.height / 2;
              order.splice(fromIdx, 1);
              let newToIdx = order.indexOf(targetGrp);
              if (isBottomHalf) newToIdx++;
              order.splice(newToIdx, 0, draggedGrp);
              setSharedGroupOrder(order);
              renderEntryList();
            }
          }
        });
        $gHeader.find(".lulu-btn-up").on("click", () => {
          let order = getSharedGroupOrder();
          const idx = order.indexOf(groupName);
          if (idx > 0) {
            [order[idx - 1], order[idx]] = [order[idx], order[idx - 1]];
            setSharedGroupOrder(order);
            renderEntryList();
          }
        });
        $gHeader.find(".lulu-btn-down").on("click", () => {
          let order = getSharedGroupOrder();
          const idx = order.indexOf(groupName);
          if (idx !== -1 && idx < order.length - 1) {
            [order[idx + 1], order[idx]] = [order[idx], order[idx + 1]];
            setSharedGroupOrder(order);
            renderEntryList();
          }
        });
      }

      $gHeader.find(".wb-group-enable-all").on("click", (e) => {
        e.stopPropagation();
        gEntries.forEach((entry) => (entry.enabled = true));
        renderEntryList();
      });
      $gHeader.find(".wb-group-disable-all").on("click", (e) => {
        e.stopPropagation();
        gEntries.forEach((entry) => (entry.enabled = false));
        renderEntryList();
      });
      $gHeader.find(".wb-group-delete").on("click", async (e) => {
        e.stopPropagation();
        const btnRes = await SillyTavern.callGenericPopup(
          `<div style="margin-bottom:8px;">想要对【<strong style="color:var(--SmartThemeQuoteColor);">${groupName}</strong>】做什么呢？</div><span style="font-size:12px; color:gray;">(当前组内包含 ${gEntries.length} 个条目)</span>`,
          SillyTavern.POPUP_TYPE.TEXT,
          "",
          {
            okButton: "点错了取消",
            customButtons: [
              {
                text: "彻底清空分组与条目",
                result: 888,
                classes: ["btn-danger"],
              },
              {
                text: "仅解散分组(条目回未分类)",
                result: 999,
                classes: ["btn-warning"],
              },
            ],
          },
        );

        if (btnRes === 888) {
          const uidsToRemove = gEntries.map((entry) => entry.uid);
          tuneEntries = tuneEntries.filter(
            (entry) => !uidsToRemove.includes(entry.uid),
          );
          delete wbEntryGroupState[groupName];
          renderEntryList();
          toastr.success(
            `【${groupName}】内容已被彻底扫除干净啦！记得按绿色保存按钮哦~`,
          );
        } else if (btnRes === 999) {
          gEntries.forEach((entry) => (entry.group = ""));
          delete wbEntryGroupState[groupName];
          renderEntryList();
          toastr.success(
            `【${groupName}】已解散，里面的内容已经安全返回未分类区啦。`,
          );
        }
      });

      gEntries.forEach((entry) => {
        const index = tuneEntries.indexOf(entry);
        const strategy = entry.strategy || { type: "constant", keys: [] };
        const keysInfo =
          strategy.type !== "selective"
            ? `<span style="color:gray;">[常驻无触发词]</span>`
            : `🔑 ${(strategy.keys || []).join(", ") || '<span style="color:#d63384">未设置词汇</span>'}`;
        const posBadgeHtml = `<span class="badge-grey" style="color:var(--SmartThemeBodyColor); background:none; border-color:var(--SmartThemeBorderColor);">${formatPositionBadge(entry.position)}</span>`;

        const isEn = entry.enabled;
        const dynamicBg = isEn
          ? "var(--SmartThemeBotMesColor)"
          : "rgba(125,125,125,0.08)";
        const dynamicOpacity = isEn ? "1" : "0.55";
        const $item = $(
          `<div class="lulu-wb-entry-item" style="display:flex; align-items:flex-start; gap:12px; padding:10px; border-left: 4px solid ${isEn ? "var(--okGreen)" : "gray"}; background:${dynamicBg}; border-radius:4px; opacity:${dynamicOpacity}; transition: 0.2s;"></div>`,
        );

        $item.hover(
          function () {
            if (!isEn) $(this).css("opacity", "1");
          },
          function () {
            if (!isEn) $(this).css("opacity", "0.55");
          },
        );

        let $chk;
        if (isEntryBatchMode) {
          $chk = $(
            `<input type="checkbox" style="transform: scale(1.2); flex-shrink:0; margin-top:2px; accent-color:#ff6b6b;">`,
          )
            .prop("checked", entryBatchSelected.has(index))
            .on("change", function () {
              $(this).is(":checked")
                ? entryBatchSelected.add(index)
                : entryBatchSelected.delete(index);
              $ui.find("#wb-entry-batch-count").text(entryBatchSelected.size);
            });
        } else {
          $chk = $(
            `<input type="checkbox" style="transform: scale(1.2); flex-shrink:0; margin-top:2px;">`,
          )
            .prop("checked", entry.enabled)
            .on("change", function () {
              entry.enabled = $(this).is(":checked");
              renderEntryList();
            });
        }

        // ✨ 鹿酱新增：预览内容渲染 ✨
        let previewHtml = "";
        if (showPreview && entry.content) {
          previewHtml = `<div class="content-preview">${entry.content.replace(/</g, "<").replace(/>/g, ">")}</div>`;
        }

        const $info = $(
          `<div style="flex:1; min-width:0; cursor:${isEntryBatchMode ? "pointer" : "default"};"><div style="font-weight:bold; margin-bottom: 5px; font-size:14px; word-break:break-all;">${entry.name || "未定义模块"}</div><div style="font-size:11px;color:gray;display:flex;align-items:center;flex-wrap:wrap;gap:4px;">${strategy.type !== "selective" ? '<span class="badge-blue">常驻</span>' : '<span class="badge-green">匹配</span>'}${posBadgeHtml} <span style="margin-left:5px;">${keysInfo}</span></div>${previewHtml}</div>`,
        );

        if (isEntryBatchMode)
          $info.on("click", () => {
            $chk.prop("checked", !$chk.is(":checked")).trigger("change");
          });

        const $right = $(
          '<div style="display:flex; gap:6px; margin-left:auto; flex-shrink:0;"></div>',
        );
        $right.append(
          $(
            '<button class="menu_button interactable wb-nowrap-btn" style="color:var(--SmartThemeQuoteColor); margin:0;" title="修改内容"><i class="fa fa-pen-nib"></i></button>',
          ).on("click", () => openDetailEditView(index)),
        );
        $item.append($chk, $info, $right);
        $gContainer.append($item);
      });
      $container.append($gHeader).append($gContainer);
    }
    if (sortedEntries.length === 0)
      $container.html(
        `<div style="color: gray; padding: 10px; text-align: center;">${tuneEntries.length > 0 ? "搜查不到匹配内容呢。" : "完全是一本空壳书呀。"}</div>`,
      );
  };

  $ui.find("#wb-entry-search").off("input").on("input", renderEntryList);
  $ui.find("#wb-entry-sort").off("change").on("change", renderEntryList);
  $ui
    .find("#wb-btn-entry-all")
    .off("click")
    .on("click", () => {
      tuneEntries.forEach((e) => (e.enabled = true));
      renderEntryList();
    });
  $ui
    .find("#wb-btn-entry-none")
    .off("click")
    .on("click", () => {
      tuneEntries.forEach((e) => (e.enabled = false));
      renderEntryList();
    });
  $ui
    .find("#wb-btn-entry-add")
    .off("click")
    .on("click", () => {
      tuneEntries.unshift({
        uid: Date.now() + Math.random(),
        name: "新增编辑条目",
        enabled: true,
        content: "",
        group: "",
        strategy: { type: "constant", keys: [] },
        position: { type: "at_depth", role: "system", depth: 0, order: 100 },
        recursion: {
          prevent_incoming: false,
          prevent_outgoing: false,
          delay_until: null,
        },
        exclude_recursion: false,
        prevent_recursion: false,
      });
      renderEntryList();
      openDetailEditView(0);
    });
  $ui.find("#wb-btn-entry-save").on("click", async () => {
    await withLoadingOverlay(async () => {
      await replaceWorldbook(tuneWbName, tuneEntries);
    }, `写入中...`);
    originalTuneEntries = JSON.parse(JSON.stringify(tuneEntries));
    toastr.success(`[${tuneWbName}] 的修改已经成功保存啦！`);
    if (tuneReturnView === "#wb-main-view") renderData();
    else if (tuneReturnView === "#wb-char-view") renderCharView();
  });
  $ui.find("#wb-btn-entry-cancel").on("click", async () => {
    const isDirty =
      JSON.stringify(tuneEntries) !== JSON.stringify(originalTuneEntries);
    if (isDirty) {
      const confirm = await SillyTavern.callGenericPopup(
        `当前条目的更改还没点击左下角<strong style="color:var(--SmartThemeQuoteColor);">绿色确认按钮</strong>哦！<br>真的要放弃这些修改直接返回吗？`,
        SillyTavern.POPUP_TYPE.CONFIRM,
      );
      if (confirm !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
    }
    $ui.find("#wb-entry-view").hide();
    $ui.find("#wb-manager-panel").removeClass("wb-entry-focus");
    $ui.find("#wb-tab-strip").show();
    $ui.find(tuneReturnView).fadeIn(200);
  });

  const refreshMobileVh = () => {
    if (window.innerWidth > 768) return;
    const vv = window.visualViewport;
    const h = vv ? vv.height : window.innerHeight;
    document.documentElement.style.setProperty(
      "--lulu-mobile-vh",
      `${h * 0.01}px`,
    );
  };

  if (window.innerWidth <= 768) {
    refreshMobileVh();
    window.addEventListener("resize", refreshMobileVh);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", refreshMobileVh);
      window.visualViewport.addEventListener("scroll", refreshMobileVh);
    }
  }

  const ensureEntryEditorVisible = () => {
    if (window.innerWidth > 768) return;
    const $detail = $ui.find("#wb-entry-detail-side");
    if (!$detail.is(":visible")) return;
    setTimeout(() => {
      const el = $ui.find("#wb-det-content")[0];
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
      const scroller = $detail.find(".scrollableInnerFull")[0];
      if (scroller) {
        scroller.scrollTop = Math.max(scroller.scrollTop, 120);
      }
    }, 80);
  };

  $ui
    .find(
      "#wb-det-content, #wb-det-name, #wb-det-keys, #wb-det-order, #wb-det-depth",
    )
    .on("focus", ensureEntryEditorVisible)
    .on("click", ensureEntryEditorVisible);

  let tuneDetailIndex = -1;
  $ui.find("#wb-det-position").on("change", function () {
    $ui
      .find("#wb-det-depth-container")
      .toggle($(this).val().startsWith("at_depth_"));
  });

  const openDetailEditView = (index) => {
    tuneDetailIndex = index;
    const e = tuneEntries[index];
    $ui.find("#wb-detail-title").text(e.name || "空参数");
    $ui.find("#wb-det-name").val(e.name || "");
    $ui.find("#wb-det-content").val(e.content || "");
    $ui.find("#wb-det-keys").val((e.strategy?.keys || []).join(", "));
    $ui.find("#wb-det-strategy").val(e.strategy?.type || "constant");
    let p = e.position?.type || "at_depth";
    if (p === "at_depth" || p === "outlet")
      p = `at_depth_${e.position?.role || "system"}`;
    $ui.find("#wb-det-position").val(p).trigger("change");
    $ui.find("#wb-det-depth").val(e.position?.depth ?? 0);
    $ui.find("#wb-det-order").val(e.position?.order ?? 100);
    const isExclude =
        e.recursion?.prevent_incoming ??
        e.exclude_recursion ??
        e.excludeRecursion ??
        false,
      isPrevent =
        e.recursion?.prevent_outgoing ??
        e.prevent_recursion ??
        e.preventRecursion ??
        false;
    $ui.find("#wb-det-exclude-recursion").prop("checked", !!isExclude);
    $ui.find("#wb-det-prevent-recursion").prop("checked", !!isPrevent);

    // 不同设备显示逻辑：手机端上下同屏常驻，桌面端右侧分栏弹出
    if (window.innerWidth <= 768) {
      $ui.find("#wb-entry-detail-side").css("display", "flex");
      $ui.find("#wb-btn-det-close-mobile").hide();
      $ui.find("#wb-btn-det-cancel").show();
    } else {
      $ui.find("#wb-entry-detail-side").css("display", "flex");
      $ui.find("#wb-btn-det-close-mobile").hide();
      $ui.find("#wb-btn-det-cancel").show();
    }
  };

  $ui.find("#wb-btn-det-save").on("click", () => {
    if (tuneDetailIndex === -1) return;
    const e = tuneEntries[tuneDetailIndex],
      pos = $ui.find("#wb-det-position").val(),
      order = parseInt($ui.find("#wb-det-order").val()) || 100;
    e.name = $ui.find("#wb-det-name").val();
    e.content = $ui.find("#wb-det-content").val();
    e.strategy = {
      type: $ui.find("#wb-det-strategy").val(),
      keys: $ui
        .find("#wb-det-keys")
        .val()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    if (pos.startsWith("at_depth_"))
      e.position = {
        type: "at_depth",
        role: pos.replace("at_depth_", ""),
        depth: parseInt($ui.find("#wb-det-depth").val()) || 0,
        order: order,
      };
    else e.position = { type: pos, order: order };
    const checkExclude = $ui.find("#wb-det-exclude-recursion").is(":checked"),
      checkPrevent = $ui.find("#wb-det-prevent-recursion").is(":checked");
    if (!e.recursion)
      e.recursion = {
        prevent_incoming: false,
        prevent_outgoing: false,
        delay_until: null,
      };
    e.recursion.prevent_incoming = checkExclude;
    e.recursion.prevent_outgoing = checkPrevent;
    e.exclude_recursion = checkExclude;
    e.prevent_recursion = checkPrevent;

    // 保存后：手机端保持上下同屏；桌面端关闭右侧分栏
    if (window.innerWidth > 768) {
      $ui.find("#wb-entry-detail-side").hide();
    }
    renderEntryList();
  });

  // 关闭分栏按钮：手机端保持同屏不隐藏，只撤销视觉焦点；桌面端关闭右侧分栏
  $ui.find("#wb-btn-det-cancel, #wb-btn-det-close-mobile").on("click", () => {
    if (window.innerWidth > 768) {
      $ui.find("#wb-entry-detail-side").hide();
    } else {
      $ui.find("#wb-entry-detail-side").css("display", "flex");
    }
  });

  await popup.show();

  // ------------ 最下方的原生书组绑定扩展，保持原样接续 ------------
  (function initLuLuNativeWbSyncV7() {
    let groupFoldState = JSON.parse(
      localStorage.getItem("lulu_wb_native_fold_state") || "{}",
    );
    const saveFoldState = () =>
      localStorage.setItem(
        "lulu_wb_native_fold_state",
        JSON.stringify(groupFoldState),
      );
    let currentActiveWbName = null;
    let cachedWbEntries = [];
    let isFetching = false;
    setInterval(async () => {
      const isNativeMagicEnabled =
        localStorage.getItem("lulu_wb_native_magic_enabled") !== "false";
      const $entries = $(".world_entry");
      if ($entries.length === 0) return;
      const $container = $entries.first().parent();
      if (!$container.length) return;
      if (!isNativeMagicEnabled) {
        if ($container.css("display") === "flex") {
          $container.css({ display: "", "flex-direction": "" });
          $(".lulu-native-group-header").remove();
          $entries.css({ order: "", display: "", margin: "" });
        }
        return;
      }
      if (isFetching) return;
      if (
        $container.css("display") !== "flex" ||
        $container.css("flex-direction") !== "column"
      ) {
        $container.css({ display: "flex", "flex-direction": "column" });
      }
      const visibleWbName = $(".move_entry_button")
        .first()
        .attr("data-current-world");
      if (!visibleWbName) return;
      if (currentActiveWbName !== visibleWbName) {
        isFetching = true;
        try {
          const rawData = await getWorldbook(visibleWbName);
          if (rawData && Array.isArray(rawData)) {
            cachedWbEntries = rawData;
            currentActiveWbName = visibleWbName;
          }
        } catch (err) {
        } finally {
          isFetching = false;
        }
        return;
      }
      if (!cachedWbEntries || cachedWbEntries.length === 0) return;
      const groupCounts = {};
      $entries.each(function (index) {
        const $entry = $(this);
        let myGroup = "📁 未分类条目";
        const entryTitle =
          $entry.find('textarea[name="comment"]').val()?.trim() || "";
        let foundEntry = cachedWbEntries.find(
          (e) => e.name === entryTitle || e.comment === entryTitle,
        );
        if (!foundEntry) {
          const domUid = parseInt($entry.attr("uid") || $entry.data("id"), 10);
          if (!isNaN(domUid) && cachedWbEntries[domUid]) {
            foundEntry = cachedWbEntries[domUid];
          }
        }
        if (foundEntry && foundEntry.group && foundEntry.group.trim() !== "")
          myGroup = foundEntry.group.trim();
        if (!groupCounts[myGroup]) groupCounts[myGroup] = 0;
        groupCounts[myGroup]++;
        $entry.attr("data-lulu-grp", myGroup);
        $entry.attr("data-lulu-native-index", index);
      });
      let luluGroupOrder = JSON.parse(
        localStorage.getItem("lulu_wb_native_group_order") || "[]",
      );
      let currentGroups = Object.keys(groupCounts).filter(
        (g) => g !== "📁 未分类条目",
      );
      let orderChanged = false;
      currentGroups.forEach((g) => {
        if (!luluGroupOrder.includes(g)) {
          luluGroupOrder.push(g);
          orderChanged = true;
        }
      });
      if (orderChanged)
        localStorage.setItem(
          "lulu_wb_native_group_order",
          JSON.stringify(luluGroupOrder),
        );
      const sortedGroupNames = Object.keys(groupCounts).sort((a, b) => {
        if (a === "📁 未分类条目") return 1;
        if (b === "📁 未分类条目") return -1;
        let idxA = luluGroupOrder.indexOf(a);
        let idxB = luluGroupOrder.indexOf(b);
        if (idxA === -1) idxA = 9999;
        if (idxB === -1) idxB = 9999;
        return idxA - idxB;
      });
      sortedGroupNames.forEach((gName, gIndex) => {
        const baseOrder = (gIndex + 1) * 10000;
        let $header = $container.children(
          `.lulu-native-group-header[data-groupname="${gName}"]`,
        );
        const isFolded = groupFoldState[gName] === true;
        const isDraggable = gName !== "📁 未分类条目";
        if ($header.length === 0) {
          const dragIconHtml = isDraggable
            ? `<i class="fa-solid fa-hand-paper lulu-drag-handle" style="cursor:grab; font-size:14px; color:gray; padding-right:8px; display:inline-flex; align-items:center;" title="按住拖拽排序分类"></i>`
            : "";
          const sortButtonsHtml = !isDraggable
            ? ""
            : `<div style="display:flex; gap: 6px; margin-right: 15px;" class="lulu-sort-btns"><i class="fa-solid fa-arrow-up lulu-move-up" title="将此分类上移" style="padding:4px; font-size:14px; color:gray; transition:0.2s; cursor:pointer;"></i><i class="fa-solid fa-arrow-down lulu-move-down" title="将此分类下移" style="padding:4px; font-size:14px; color:gray; transition:0.2s; cursor:pointer;"></i></div>`;
          $header = $(
            `<div class="lulu-native-group-header" data-groupname="${gName}" draggable="${isDraggable ? "true" : "false"}" style="background: var(--SmartThemeBlurTintColor, rgba(0,0,0,0.15)); padding:10px 14px; margin: 10px 0 6px 0; border-radius:6px; font-weight:bold; color:var(--SmartThemeQuoteColor, #70a1ff); border:1px solid var(--SmartThemeBorderColor, gray); display:flex; justify-content:space-between; align-items:center; user-select:none; transition: 0.2s; flex-shrink: 0; align-content: center;"><span style="display:flex; align-items:center;">${dragIconHtml}<span class="lulu-click-fold" style="display:flex; align-items:center; cursor:pointer;"><i class="fa-solid ${isFolded ? "fa-chevron-right" : "fa-chevron-down"} lulu-fold-icon" style="margin-right:8px; width: 16px; text-align:center;"></i><span style="font-size: 14.5px;" class="lulu-g-title">${gName}</span><span style="font-size: 11px; font-weight: normal; color: gray; margin-left: 6px;" class="lulu-g-count">(${groupCounts[gName]}项)</span></span></span><span style="display:flex; align-items:center;">${sortButtonsHtml}<span style="font-size:11.5px; font-weight:normal; color:gray; opacity: 0.6;"><i class="fa-solid fa-link"></i> 分组内会根据选项排序哦</span></span></div>`,
          );
          $header.hover(
            function () {
              $(this).css(
                "background",
                "var(--SmartThemeBotMesColor, rgba(125,125,125,0.3))",
              );
            },
            function () {
              $(this).css(
                "background",
                "var(--SmartThemeBlurTintColor, rgba(0,0,0,0.15))",
              );
            },
          );
          $header.find(".lulu-move-up, .lulu-move-down").hover(
            function () {
              $(this).css("color", "var(--SmartThemeQuoteColor)");
              $(this).css("transform", "scale(1.2)");
            },
            function () {
              $(this).css("color", "gray");
              $(this).css("transform", "scale(1)");
            },
          );
          $header.find(".lulu-click-fold").on("click", function (e) {
            e.stopPropagation();
            if ($(this).data("lulu-click-locked")) return;
            $(this).data("lulu-click-locked", true);
            setTimeout(() => $(this).data("lulu-click-locked", false), 250);
            const grp = $header.attr("data-groupname");
            const isNowFolded = !groupFoldState[grp];
            groupFoldState[grp] = isNowFolded;
            saveFoldState();
            const $icon = $(this).find(".lulu-fold-icon");
            if (isNowFolded)
              $icon.removeClass("fa-chevron-down").addClass("fa-chevron-right");
            else
              $icon.removeClass("fa-chevron-right").addClass("fa-chevron-down");
            $container
              .children(`.world_entry[data-lulu-grp="${grp}"]`)
              .each(function () {
                if (isNowFolded) {
                  $(this).addClass("lulu-folded-hide");
                } else {
                  $(this).removeClass("lulu-folded-hide");
                  $(this).css({ display: "", margin: "" });
                }
              });
          });
          if (isDraggable) {
            $header.on("dragstart", function (e) {
              e.originalEvent.dataTransfer.setData("text/plain", gName);
              $(this).addClass("lulu-drag-ghost");
            });
            $header.on("dragend", function () {
              $(this).removeClass("lulu-drag-ghost");
              $(".lulu-drag-over-top, .lulu-drag-over-bottom").removeClass(
                "lulu-drag-over-top lulu-drag-over-bottom",
              );
            });
            $header.on("dragover", function (e) {
              e.preventDefault();
              const rect = this.getBoundingClientRect();
              const isBottomHalf =
                e.originalEvent.clientY > rect.top + rect.height / 2;
              if (isBottomHalf) {
                $(this)
                  .removeClass("lulu-drag-over-top")
                  .addClass("lulu-drag-over-bottom");
              } else {
                $(this)
                  .removeClass("lulu-drag-over-bottom")
                  .addClass("lulu-drag-over-top");
              }
            });
            $header.on("dragleave", function () {
              $(this).removeClass("lulu-drag-over-top lulu-drag-over-bottom");
            });
            $header.on("drop", function (e) {
              e.preventDefault();
              $(this).removeClass("lulu-drag-over-top lulu-drag-over-bottom");
              const draggedGrp =
                e.originalEvent.dataTransfer.getData("text/plain");
              const targetGrp = $(this).attr("data-groupname");
              if (
                draggedGrp &&
                draggedGrp !== targetGrp &&
                draggedGrp !== "📁 未分类条目" &&
                targetGrp !== "📁 未分类条目"
              ) {
                let order = JSON.parse(
                  localStorage.getItem("lulu_wb_native_group_order") || "[]",
                );
                const fromIdx = order.indexOf(draggedGrp);
                if (fromIdx > -1) {
                  const rect = this.getBoundingClientRect();
                  const isBottomHalf =
                    e.originalEvent.clientY > rect.top + rect.height / 2;
                  order.splice(fromIdx, 1);
                  let newToIdx = order.indexOf(targetGrp);
                  if (isBottomHalf) newToIdx++;
                  order.splice(newToIdx, 0, draggedGrp);
                  localStorage.setItem(
                    "lulu_wb_native_group_order",
                    JSON.stringify(order),
                  );
                }
              }
            });
          }
          $header.find(".lulu-move-up").on("click", function (e) {
            e.stopPropagation();
            const idx = luluGroupOrder.indexOf(gName);
            if (idx > 0) {
              [luluGroupOrder[idx - 1], luluGroupOrder[idx]] = [
                luluGroupOrder[idx],
                luluGroupOrder[idx - 1],
              ];
              localStorage.setItem(
                "lulu_wb_native_group_order",
                JSON.stringify(luluGroupOrder),
              );
            }
          });
          $header.find(".lulu-move-down").on("click", function (e) {
            e.stopPropagation();
            const idx = luluGroupOrder.indexOf(gName);
            if (idx !== -1 && idx < luluGroupOrder.length - 1) {
              [luluGroupOrder[idx + 1], luluGroupOrder[idx]] = [
                luluGroupOrder[idx],
                luluGroupOrder[idx + 1],
              ];
              localStorage.setItem(
                "lulu_wb_native_group_order",
                JSON.stringify(luluGroupOrder),
              );
            }
          });
          $container.append($header);
        } else {
          $header.find(".lulu-g-count").text(`(${groupCounts[gName]}项)`);
          const $icon = $header.find(".lulu-fold-icon");
          if (isFolded)
            $icon.removeClass("fa-chevron-down").addClass("fa-chevron-right");
          else
            $icon.removeClass("fa-chevron-right").addClass("fa-chevron-down");
        }
        $header.css("order", baseOrder);
        $container
          .children(`.world_entry[data-lulu-grp="${gName}"]`)
          .each(function () {
            const nativeIdx = parseInt(
              $(this).attr("data-lulu-native-index") || 0,
            );
            $(this).css("order", baseOrder + 1 + nativeIdx);
            if (isFolded) {
              if (!$(this).hasClass("lulu-folded-hide"))
                $(this).addClass("lulu-folded-hide");
            } else {
              if ($(this).hasClass("lulu-folded-hide")) {
                $(this).removeClass("lulu-folded-hide");
                $(this).css({ display: "", margin: "" });
              }
            }
          });
      });
      $container.children(".lulu-native-group-header").each(function () {
        const gName = $(this).attr("data-groupname");
        if (!groupCounts[gName]) $(this).remove();
      });
    }, 300);
  })();
});
