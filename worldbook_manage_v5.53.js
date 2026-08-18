try {
  replaceScriptButtons([]);
} catch (e) {}
$("#option_lulu_wb_manager").remove();

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

let $insertTarget = $("#option_delete_mes");

if ($insertTarget.length === 0) {
  $insertTarget = $(".options-content").find("hr").last();
}

if ($insertTarget.length > 0) {
  $menuBtn.insertBefore($insertTarget);
} else {
  const $container = $(".options-content").length
    ? $(".options-content")
    : $("#options");
  $container.append($menuBtn);
}

let globalBindingMapCache = {};
// ✨ 【全局】已提取的卡内原版记号（供批量提取 & 单卡体检共用，避免重复建书）
window.luluGetExtractedMap = () => {
  try {
    return JSON.parse(
      localStorage.getItem("lulu_wb_extracted_originals") || "{}",
    );
  } catch (e) {
    return {};
  }
};
window.luluMarkExtracted = (avatar, bookName, newName) => {
  const map = window.luluGetExtractedMap();
  map[`${avatar}||${bookName}`] = newName;
  localStorage.setItem("lulu_wb_extracted_originals", JSON.stringify(map));
};
window.luluGetExtractedName = (avatar, bookName) => {
  const map = window.luluGetExtractedMap();
  return map[`${avatar}||${bookName}`] || null;
};
const getWbUiGroups = () => {
  let vars = getVariables({ type: "global" });
  let map = vars.lulu_wb_ui_groups;
  if (typeof map === "string") {
    try {
      map = JSON.parse(map);
    } catch (e) {
      map = {};
    }
  }
  return map && typeof map === "object" ? map : {};
};
const saveWbUiGroups = (obj) => {
  updateVariablesWith(
    (v) => {
      v.lulu_wb_ui_groups = obj;
      return v;
    },
    { type: "global" },
  );
};
const getEntryUiGroup = (wbName, uid, entry = null) => {
  const map = getWbUiGroups();
  if (map[wbName] && map[wbName][uid]) return map[wbName][uid];
  if (entry && entry.extensions && entry.extensions.lulu_group)
    return entry.extensions.lulu_group;
  return "";
};

// ========== 【通用】分配新条目 UID（模仿酒馆原生 getFreeWorldEntryUid） ==========
const luluGetFreeEntryUid = (entries) => {
  const used = new Set();
  (Array.isArray(entries) ? entries : []).forEach((e) => {
    if (e && (typeof e.uid === "number" || typeof e.uid === "string")) {
      const uidNum = Number(e.uid);
      if (Number.isInteger(uidNum) && uidNum >= 0) used.add(uidNum);
    }
  });
  let uid = 0;
  while (used.has(uid)) uid++;
  return uid;
};
// ========== 【通用】给弹窗生成跟随主题的 CSS（全局版）==========
window.buildPopupThemeCSS = (selector) => {
  const mode = localStorage.getItem("lulu_wb_panel_theme") || "default";
  const custom = JSON.parse(
    localStorage.getItem("lulu_wb_panel_custom_colors") ||
      '{"bg":"#2a2e33", "text":"#ffffff", "accent":"#70a1ff", "alpha":95, "inputBg":"#1a1c1f"}',
  );
  const toRgba = (hex, alpha) => {
    let r = 0,
      g = 0,
      b = 0;
    if (hex && hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return `rgba(${r},${g},${b},${alpha / 100})`;
  };

  let bg, botMes, body, quote, border, inputBg;

  if (mode === "dark") {
    bg = "rgba(22,24,28,1)";
    botMes = "rgba(32,35,40,1)";
    body = "#c0c2c8";
    quote = "#d1c5a1";
    border = "#3d414d";
    inputBg = "rgba(35,38,43,1)";
  } else if (mode === "light") {
    bg = "rgba(253,246,227,1)";
    botMes = "rgba(255,251,240,1)";
    body = "#4a3b32";
    quote = "#8b5d33";
    border = "#e0d0b8";
    inputBg = "rgba(255,255,255,0.7)";
  } else if (mode === "custom") {
    bg = toRgba(custom.bg, custom.alpha);
    botMes = custom.bg;
    body = custom.text;
    quote = custom.accent || "#70a1ff";
    border = custom.inputBg || custom.bg;
    inputBg = custom.inputBg || custom.bg;
  } else {
    // default 模式跟随酒馆，不强改，只统一输入框和按钮
    return `
      ${selector} input[type="text"],
      ${selector} input[type="number"],
      ${selector} select,
      ${selector} textarea {
        background: var(--SmartThemeBotMesColor) !important;
        color: var(--SmartThemeBodyColor) !important;
        border: 1px solid var(--SmartThemeBorderColor) !important;
      }
      ${selector} .menu_button:not(.btn-danger):not(.btn-success):not(.btn-warning):not(.btn-primary) {
        background: var(--SmartThemeBotMesColor) !important;
        color: var(--SmartThemeBodyColor) !important;
        border: 1px solid var(--SmartThemeBorderColor) !important;
      }
    `;
  }

  return `
    ${selector} {
      background: ${bg} !important;
      border: 1px solid ${quote} !important;
      --SmartThemeBlurTintColor: ${bg} !important;
      --SmartThemeBotMesColor: ${botMes} !important;
      --SmartThemeBodyColor: ${body} !important;
      --SmartThemeQuoteColor: ${quote} !important;
      --SmartThemeBorderColor: ${border} !important;
      color: ${body} !important;
    }
    ${selector} h3, ${selector} label, ${selector} span, ${selector} div {
      color: ${body};
    }
    ${selector} input[type="text"],
    ${selector} input[type="number"],
    ${selector} select,
    ${selector} textarea {
      background: ${inputBg} !important;
      color: ${body} !important;
      border: 1px solid ${border} !important;
    }
    ${selector} input::placeholder, ${selector} textarea::placeholder {
      color: gray !important;
    }
    ${selector} .menu_button:not(.btn-danger):not(.btn-success):not(.btn-warning):not(.btn-primary) {
      background: ${botMes} !important;
      color: ${body} !important;
      border: 1px solid ${border} !important;
    }
    ${selector} .btn-primary {
      color: ${quote} !important;
      border-color: ${quote} !important;
      background: rgba(125,125,125,0.08) !important;
    }
    ${selector} .btn-primary:hover {
      background: ${quote} !important;
      color: ${botMes} !important;
    }
    ${selector} .btn-success {
      color: #51cf66 !important;
      border-color: #51cf66 !important;
      background: rgba(81,207,102,0.08) !important;
    }
    ${selector} .btn-success:hover {
      background: #51cf66 !important;
      color: #fff !important;
    }
    ${selector} .btn-danger {
      color: #ff6b6b !important;
      border-color: #ff6b6b !important;
      background: rgba(255,107,107,0.08) !important;
    }
    ${selector} .btn-danger:hover {
      background: #ff6b6b !important;
      color: #fff !important;
    }
    ${selector} .btn-warning {
      color: #fcc419 !important;
      border-color: #fcc419 !important;
      background: rgba(252,196,25,0.08) !important;
    }
    ${selector} .btn-warning:hover {
      background: #fcc419 !important;
      color: #212529 !important;
    }
    ${selector} .btn-secondary {
      color: gray !important;
      border-color: rgba(150,150,150,0.5) !important;
      background: rgba(150,150,150,0.15) !important;
    }
    ${selector} .btn-secondary:hover {
      background: gray !important;
      color: #fff !important;
    }
    ${selector} .popup-controls .menu_button,
    ${selector} .popup-button-ok {
      background: ${mode === "default" ? "var(--SmartThemeBotMesColor)" : botMes} !important;
      color: ${mode === "default" ? "var(--SmartThemeBodyColor)" : body} !important;
      border: 1px solid ${mode === "default" ? "var(--SmartThemeQuoteColor)" : quote} !important;
    }
  `;
};
// ========== 【通用】主题函数结束 ==========
// ========== 【自定义前缀 + 对照表】工具函数 开始 ==========
// 对照表条目的固定标题标记（脚本靠它认出这是对照表，不是普通条目）
const LULU_MAP_ENTRY_TAG = "[LULU_GROUP_MAP]";

// 判断某个条目是不是"对照表条目"
const isLuluMapEntry = (entry) => {
  if (!entry) return false;
  const n = entry.name || entry.comment || "";
  return typeof n === "string" && n.indexOf(LULU_MAP_ENTRY_TAG) === 0;
};

// 从一整本世界书的条目数组里，读出对照表对象（前缀 -> 长分组名）
// 读不到就返回空对象 {}
const readGroupMapFromEntries = (entries) => {
  if (!Array.isArray(entries)) return {};
  const mapEntry = entries.find((e) => isLuluMapEntry(e));
  if (!mapEntry || !mapEntry.content) return {};
  try {
    const obj = JSON.parse(mapEntry.content);
    return obj && typeof obj === "object" && !Array.isArray(obj) ? obj : {};
  } catch (e) {
    return {};
  }
};

// 根据"前缀"反查"长分组名"；查不到就原样返回前缀本身（向下兼容）
const resolveGroupByPrefix = (prefixMap, prefix) => {
  if (!prefix) return "";
  if (prefixMap && prefixMap[prefix]) return prefixMap[prefix];
  return prefix;
};

// 根据"长分组名"正查"前缀"；查不到就返回长分组名本身（表示前缀=分组名）
const resolvePrefixByGroup = (prefixMap, groupName) => {
  if (!groupName) return "";
  if (prefixMap && typeof prefixMap === "object") {
    for (const [prefix, grp] of Object.entries(prefixMap)) {
      if (grp === groupName) return prefix;
    }
  }
  return groupName;
};
// —— 记住"每本书里，每个分组该用什么前缀" ——
// 存在全局变量 lulu_wb_group_prefix 里，结构：{ 世界书名: { 长分组名: 前缀 } }
const getGroupPrefixStore = () => {
  let vars = getVariables({ type: "global" });
  let store = vars.lulu_wb_group_prefix;
  if (typeof store === "string") {
    try {
      store = JSON.parse(store);
    } catch (e) {
      store = {};
    }
  }
  return store && typeof store === "object" && !Array.isArray(store)
    ? store
    : {};
};
const saveGroupPrefixStore = (obj) => {
  updateVariablesWith(
    (v) => {
      v.lulu_wb_group_prefix = obj;
      return v;
    },
    { type: "global" },
  );
};
// 取某本书某个分组的前缀；没设过就默认返回分组名本身
const getGroupPrefix = (wbName, groupName) => {
  const store = getGroupPrefixStore();
  if (store[wbName] && store[wbName][groupName])
    return store[wbName][groupName];
  return groupName;
};
// 设置某本书某个分组的前缀
const setGroupPrefix = (wbName, groupName, prefix) => {
  const store = getGroupPrefixStore();
  if (!store[wbName]) store[wbName] = {};
  store[wbName][groupName] = prefix;
  saveGroupPrefixStore(store);
};
// —— 核心：根据当前所有条目，生成/更新/清理对照表条目 ——
// 传入某本书的条目数组(会直接修改它)，返回处理后的数组
// prefixMapUsed 是一个 {前缀: 长分组名} 对象，由外面收集好传进来
const syncMapEntryIntoEntries = (entries, prefixMapUsed) => {
  if (!Array.isArray(entries)) return entries;

  // 先找出已有的对照表条目（可能有，也可能没有）
  const mapIdx = entries.findIndex((e) => isLuluMapEntry(e));

  // 如果对照表内容为空（没有任何"前缀≠分组名"的映射），就不需要对照表条目
  const needMap = prefixMapUsed && Object.keys(prefixMapUsed).length > 0;

  if (!needMap) {
    // 不需要了 → 如果原来有对照表条目，删掉它
    if (mapIdx !== -1) entries.splice(mapIdx, 1);
    return entries;
  }

  // 需要对照表 → 生成内容
  const contentJson = JSON.stringify(prefixMapUsed);
  const mapName = LULU_MAP_ENTRY_TAG + " 请勿删除/开启（本插件分组数据）";

  if (mapIdx !== -1) {
    // 已有 → 更新它，并强制关闭
    const m = entries[mapIdx];
    m.name = mapName;
    m.comment = mapName;
    m.title = mapName;
    m.content = contentJson;
    m.enabled = false;
    m.disable = true;
    m.disabled = true;
    if (m.strategy) m.strategy.type = "constant";
    m._lulu_ui_group = "";
  } else {
    // 没有 → 新建一个关闭状态的条目
    entries.push({
      uid: luluGetFreeEntryUid(entries),
      name: mapName,
      comment: mapName,
      title: mapName,
      enabled: false,
      disable: true,
      disabled: true,
      content: contentJson,
      group: "",
      key: [],
      keys: [],
      _lulu_ui_group: "",
      strategy: { type: "constant", keys: [] },
      position: { type: "at_depth", role: "system", depth: 0, order: 100 },
      recursion: {
        prevent_incoming: true,
        prevent_outgoing: true,
        delay_until: null,
      },
      exclude_recursion: true,
      prevent_recursion: true,
    });
  }
  return entries;
};
// ========== 【自定义前缀 + 对照表】工具函数 结束 ==========
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
                position: absolute !important;
                opacity: 0 !important;
                pointer-events: none !important;
                z-index: -9999 !important;
                max-height: 0 !important;
                margin: 0 !important;
                overflow: hidden !important;
                border: none !important;
                transform: scale(0) !important;
            }
        </style>
    `);
}

const getSharedGroupOrder = () =>
  JSON.parse(localStorage.getItem("lulu_wb_native_group_order") || "[]");
const setSharedGroupOrder = (arr) =>
  localStorage.setItem("lulu_wb_native_group_order", JSON.stringify(arr));
// ========== 【功能8：快照排序】工具函数 开始 ==========
const getSnapshotOrder = () => {
  let vars = getVariables({ type: "global" });
  let order = vars.wb_snapshot_order;
  if (typeof order === "string") {
    try {
      order = JSON.parse(order);
    } catch (e) {
      order = [];
    }
  }
  return Array.isArray(order) ? order : [];
};
const setSnapshotOrder = (arr) => {
  updateVariablesWith(
    (v) => {
      v.wb_snapshot_order = arr;
      return v;
    },
    { type: "global" },
  );
};
// 按顺序数组给快照名排序，新出现的排最后
const sortSnapshotNames = (names) => {
  let order = getSnapshotOrder();
  let changed = false;
  names.forEach((n) => {
    if (!order.includes(n)) {
      order.push(n);
      changed = true;
    }
  });
  if (changed) setSnapshotOrder(order);
  return [...names].sort((a, b) => {
    let ia = order.indexOf(a);
    let ib = order.indexOf(b);
    if (ia === -1) ia = 9999;
    if (ib === -1) ib = 9999;
    return ia - ib;
  });
};
// 角色快照顺序：按角色名分开存
const getCharSnapshotOrder = (charName) => {
  let vars = getVariables({ type: "global" });
  let allOrder = vars.wb_char_snapshot_order;
  if (typeof allOrder === "string") {
    try {
      allOrder = JSON.parse(allOrder);
    } catch (e) {
      allOrder = {};
    }
  }
  if (!allOrder || typeof allOrder !== "object" || Array.isArray(allOrder))
    allOrder = {};
  return Array.isArray(allOrder[charName]) ? allOrder[charName] : [];
};
const setCharSnapshotOrder = (charName, arr) => {
  updateVariablesWith(
    (v) => {
      let allOrder = v.wb_char_snapshot_order;
      if (typeof allOrder === "string") {
        try {
          allOrder = JSON.parse(allOrder);
        } catch (e) {
          allOrder = {};
        }
      }
      if (!allOrder || typeof allOrder !== "object" || Array.isArray(allOrder))
        allOrder = {};
      allOrder[charName] = arr;
      v.wb_char_snapshot_order = allOrder;
      return v;
    },
    { type: "global" },
  );
};
const sortCharSnapshotNames = (charName, names) => {
  let order = getCharSnapshotOrder(charName);
  let changed = false;
  names.forEach((n) => {
    if (!order.includes(n)) {
      order.push(n);
      changed = true;
    }
  });
  if (changed) setCharSnapshotOrder(charName, order);
  return [...names].sort((a, b) => {
    let ia = order.indexOf(a);
    let ib = order.indexOf(b);
    if (ia === -1) ia = 9999;
    if (ib === -1) ib = 9999;
    return ia - ib;
  });
};
// ========== 【功能8：快照排序】工具函数 结束 ==========

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

  const customCss = `<style>
.lulu-qs-tab { background: rgba(125,125,125,0.12); color: gray; border: 1px solid var(--SmartThemeBorderColor); }
.lulu-qs-tab:hover { color: var(--SmartThemeBodyColor); background: rgba(125,125,125,0.2); }
.lulu-qs-tab.lulu-qs-tab-active { background: var(--SmartThemeBotMesColor); color: var(--SmartThemeQuoteColor); border-color: var(--SmartThemeQuoteColor); }
.lulu-qs-btn-hover:hover { filter: brightness(1.2); }
 .lulu-qs-item { transition: 0.2s; } .lulu-qs-item:hover { border-color: var(--SmartThemeQuoteColor) !important; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,0.1); } .lulu-qs-active { border-color: #51cf66 !important; background: rgba(81, 207, 102, 0.05) !important; } dialog.lulu-qs-dialog { background: var(--SmartThemeBlurTintColor) !important; border: 1px solid var(--SmartThemeBorderColor) !important; border-radius: 12px; } dialog.lulu-qs-dialog::backdrop { background: rgba(0,0,0,0.4) !important; backdrop-filter: blur(4px) !important; } @media (max-width: 768px) { #lulu-quick-snap-modal { min-width: unset !important; width: 85vw !important; padding: 5px !important; } .lulu-qs-item { padding: 10px !important; gap: 8px !important; } } #lulu-quick-snap-modal input[type="text"] { background: var(--SmartThemeBotMesColor) !important; color: var(--SmartThemeBodyColor) !important; border: 1px solid var(--SmartThemeBorderColor) !important; } dialog.lulu-qs-dialog .popup-controls .menu_button, dialog.lulu-qs-dialog .popup-button-ok { background: var(--SmartThemeBotMesColor) !important; color: var(--SmartThemeBodyColor) !important; border: 1px solid var(--SmartThemeQuoteColor) !important; } dialog.lulu-qs-dialog .popup-controls .menu_button:hover, dialog.lulu-qs-dialog .popup-button-ok:hover { background: var(--SmartThemeQuoteColor) !important; color: #fff !important; }
/* 极速快照面板内部：上下排序等普通按钮统一跟随主题 */
#lulu-quick-snap-modal .menu_button:not(.btn-success):not(.btn-primary):not(.btn-danger) {
  background: var(--SmartThemeBotMesColor) !important;
  color: var(--SmartThemeBodyColor) !important;
  border: 1px solid var(--SmartThemeBorderColor) !important;
}
#lulu-quick-snap-modal .menu_button:not(.btn-success):not(.btn-primary):not(.btn-danger):hover {
  background: var(--SmartThemeQuoteColor) !important;
  color: #fff !important;
  border-color: var(--SmartThemeQuoteColor) !important;
}
/* “运行”按钮统一：跟随主题强调色（未生效）/ 灰色（生效中） */
#lulu-quick-snap-modal .lulu-qs-apply-btn.btn-primary,
#lulu-quick-snap-modal .lulu-qs-char-apply.btn-primary {
  background: rgba(125,125,125,0.12) !important;
  color: var(--SmartThemeQuoteColor) !important;
  border: 1px solid var(--SmartThemeQuoteColor) !important;
}
#lulu-quick-snap-modal .lulu-qs-apply-btn.btn-primary:hover,
#lulu-quick-snap-modal .lulu-qs-char-apply.btn-primary:hover {
  background: var(--SmartThemeQuoteColor) !important;
  color: var(--SmartThemeBotMesColor) !important;
}
#lulu-quick-snap-modal .lulu-qs-apply-btn.btn-secondary,
#lulu-quick-snap-modal .lulu-qs-char-apply.btn-secondary {
  background: rgba(150,150,150,0.15) !important;
  color: gray !important;
  border: 1px solid rgba(150,150,150,0.5) !important;
  cursor: default !important;
}
${themeOverrideCSS} </style>`;

  let html = `${customCss}<div id="lulu-quick-snap-modal" style="padding:10px; font-family:sans-serif; min-width:320px; max-width:550px;"><h3 style="margin-top:0; color:var(--SmartThemeQuoteColor); border-bottom:2px solid var(--SmartThemeBorderColor); padding-bottom:10px; font-size: 16px; display:flex; align-items:center; justify-content:space-between; gap:8px;"><span><i class="fa-solid fa-bolt" style="color:#fcc419;"></i> 极速快照控制台</span><span id="lulu-qs-status-text" style="color:var(--SmartThemeQuoteColor); font-size: 12px; font-weight:normal;">正在检测状态...</span></h3>`;

  // 切换标签栏
  html += `<div style="display:flex; gap:6px; margin-bottom:12px;">
    <div id="lulu-qs-tab-global" class="lulu-qs-tab lulu-qs-tab-active" style="flex:1; text-align:center; padding:9px; border-radius:6px; cursor:pointer; font-size:13.5px; font-weight:bold; transition:0.2s;"><i class="fa-solid fa-earth-asia"></i> 全局快照</div>
    <div id="lulu-qs-tab-char" class="lulu-qs-tab" style="flex:1; text-align:center; padding:9px; border-radius:6px; cursor:pointer; font-size:13.5px; font-weight:bold; transition:0.2s;"><i class="fa-solid fa-user-astronaut"></i> 当前角色</div>
  </div>`;

  // ===== 全局快照区（默认显示）=====
  html += `<div id="lulu-qs-global-section">`;
  html += `<div style="margin-bottom:10px;">
    <input type="text" id="lulu-qs-search" class="text_pole" placeholder="🔍 检索快照名称..." style="width:100%; box-sizing:border-box; padding:8px; border-radius:6px; font-size:13px; margin-bottom:10px;">
    <div style="display:flex; gap:6px; flex-wrap:wrap;">
      <button id="lulu-qs-clear-all" class="menu_button interactable lulu-qs-btn-hover" style="flex:1; margin:0; border:1px solid #fcc419; padding:9px; border-radius:6px; background:rgba(252,196,25,0.1); color:#fcc419; font-weight:bold; font-size:12.5px; display:flex; justify-content:center; align-items:center; gap:6px;"><i class="fa-solid fa-power-off"></i> 一键关闭</button>
      <button id="lulu-qs-batch-del" class="menu_button interactable lulu-qs-btn-hover" style="flex:1; margin:0; border:1px solid #ff6b6b; padding:9px; border-radius:6px; background:rgba(255,107,107,0.1); color:#ff6b6b; font-weight:bold; font-size:12.5px; display:flex; justify-content:center; align-items:center; gap:6px;"><i class="fa-solid fa-trash-can"></i> 批量删除</button>
    </div>
  </div>
  <div style="max-height: 50vh; overflow-y: auto; display:flex; flex-direction:column; gap:10px; padding:4px;" class="scrollableInnerFull">`;

  let __quickOrder = getSnapshotOrder();
  const __sortedQuickNames = Object.keys(snapshots).sort((a, b) => {
    let ia = __quickOrder.indexOf(a);
    let ib = __quickOrder.indexOf(b);
    if (ia === -1) ia = 9999;
    if (ib === -1) ib = 9999;
    return ia - ib;
  });
  const snapEntries = __sortedQuickNames.map((n) => [n, snapshots[n]]);
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
      html += `<div class="lulu-qs-item" data-itemname="${safeName}" style="background:var(--SmartThemeBotMesColor); border:1px solid var(--SmartThemeBorderColor); border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center; gap: 10px;"><div style="flex:1; min-width:0;"><div style="font-weight:bold; font-size:14.5px; color:var(--SmartThemeBodyColor); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><i class="fa-solid ${isDetailed ? "fa-puzzle-piece" : "fa-camera-retro"}" style="color:var(--SmartThemeQuoteColor);"></i> ${name}</div><div style="font-size:11px; color:gray; margin-top:6px; display:flex; align-items:center; gap:6px;"><span>${isDetailed ? "复合场景" : "基础组合"} | 共涉及 ${wbs.length || 0} 本书</span></div><div class="lulu-qs-badge" data-badgename="${safeName}" style="display:none; margin-top:6px; font-size:11px; color:#51cf66; font-weight:bold;"><i class="fa-solid fa-circle-check"></i> 当前全局生效中</div></div><div style="display:flex; align-items:center; gap:6px; flex-shrink:0;"><div style="display:flex; flex-direction:column; gap:2px;"><button class="menu_button interactable lulu-qs-move-up" data-rawname="${encodeURIComponent(name)}" style="margin:0; padding:2px 8px; min-width:unset; font-size:11px; line-height:1;" title="上移"><i class="fa-solid fa-chevron-up"></i></button><button class="menu_button interactable lulu-qs-move-down" data-rawname="${encodeURIComponent(name)}" style="margin:0; padding:2px 8px; min-width:unset; font-size:11px; line-height:1;" title="下移"><i class="fa-solid fa-chevron-down"></i></button></div><button class="menu_button interactable btn-primary lulu-qs-btn-hover lulu-qs-apply-btn"data-btnname="${safeName}" data-rawname="${encodeURIComponent(name)}" style="margin:0; border:none; border-radius:6px; font-size:13px; font-weight:bold; padding: 8px 14px; flex-shrink:0; display:inline-flex; align-items:center; justify-content:center; gap:6px; white-space:nowrap !important; word-break:keep-all;">运行 <i class="fa-solid fa-play"></i></button></div></div>`;
    });
  }
  html += `</div>`; // 关闭全局列表滚动区
  html += `</div>`; // 关闭 lulu-qs-global-section

  // ===== 当前角色快照区（默认隐藏，onOpen 时动态填充）=====
  html += `<div id="lulu-qs-char-section" style="display:none;">
    <div id="lulu-qs-char-header" style="font-size:13px; color:var(--SmartThemeQuoteColor); font-weight:bold; margin-bottom:6px; padding:8px 10px; background:var(--SmartThemeBotMesColor); border:1px solid var(--SmartThemeBorderColor); border-radius:6px; display:flex; align-items:center; gap:6px;"></div>
    <input type="text" id="lulu-qs-char-search" class="text_pole" placeholder="🔍 检索角色快照名称..." style="width:100%; box-sizing:border-box; padding:8px; border-radius:6px; font-size:13px; margin-bottom:8px;">
    <div style="display:flex; gap:6px; margin-bottom:10px;">
      <button id="lulu-qs-char-batch-del" class="menu_button interactable lulu-qs-btn-hover" style="flex:1; margin:0; border:1px solid #ff6b6b; padding:9px; border-radius:6px; background:rgba(255,107,107,0.1); color:#ff6b6b; font-weight:bold; font-size:12.5px; display:flex; justify-content:center; align-items:center; gap:6px;"><i class="fa-solid fa-trash-can"></i> 批量删除</button>
    </div>
    <div id="lulu-qs-char-list" style="max-height:50vh; overflow-y:auto; display:flex; flex-direction:column; gap:10px; padding:4px;" class="scrollableInnerFull"></div>
  </div>`;

  html += `</div>`; // 关闭 lulu-quick-snap-modal

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
        // ========== 当前角色快照：读取、渲染、应用 ==========
        // 读取当前角色名
        const qsGetCharName = () => {
          try {
            if (typeof getCurrentCharacterName === "function")
              return getCurrentCharacterName();
            if (typeof SillyTavern !== "undefined")
              return SillyTavern.getContext().name2;
          } catch (e) {}
          return null;
        };

        // 读取当前角色绑定的所有世界书
        const qsGetCharBoundBooks = () => {
          let obj = { primary: null, additional: [] };
          try {
            if (typeof getCharWorldbookNames === "function")
              obj = getCharWorldbookNames("current") || obj;
          } catch (e) {}
          const list = [];
          if (obj.primary) list.push(obj.primary);
          if (obj.additional) list.push(...obj.additional);
          return list;
        };

        // 读取角色快照对象
        const qsGetCharSnaps = () => {
          let cs = getVariables({ type: "global" }).wb_char_snapshots;
          if (typeof cs === "string") {
            try {
              cs = JSON.parse(cs);
            } catch (e) {
              cs = {};
            }
          }
          if (!cs || typeof cs !== "object" || Array.isArray(cs)) cs = {};
          return cs;
        };

        // 应用某个角色快照（精简独立版）
        const qsApplyCharSnap = async (snapData) => {
          const boundBooks = qsGetCharBoundBooks();
          const snapWbNames = Object.keys(snapData);
          const missing = snapWbNames.filter((wb) => !boundBooks.includes(wb));
          if (missing.length === snapWbNames.length) {
            toastr.error(
              `当前角色没有绑定快照里的任何世界书，无法应用哦(＞﹏＜)`,
            );
            return false;
          }
          if (missing.length > 0) {
            toastr.warning(
              `注意：快照里的 [${missing.join(", ")}] 当前没绑定在角色身上，这几本无法复原~`,
            );
          }
          for (const wb of boundBooks) {
            let entries = await getWorldbook(wb);
            let changed = false;
            const targetUIDs = snapData[wb] || [];
            entries.forEach((entry) => {
              const should = targetUIDs.includes(entry.uid);
              if (entry.enabled !== should) {
                entry.enabled = should;
                changed = true;
              }
            });
            if (changed) await replaceWorldbook(wb, entries);
          }
          return true;
        };

        // 检测某个角色快照当前是否正生效
        const qsIsCharSnapActive = async (snapData) => {
          const boundBooks = qsGetCharBoundBooks();
          const snapWbNames = Object.keys(snapData);
          for (const wb of snapWbNames) {
            if (!boundBooks.includes(wb)) return false;
          }
          for (const wb of boundBooks) {
            let entries = await getWorldbook(wb);
            const enabledUIDs = entries
              .filter((e) => e.enabled)
              .map((e) => e.uid)
              .sort();
            const targetUIDs = [...(snapData[wb] || [])].sort();
            if (
              enabledUIDs.length !== targetUIDs.length ||
              !enabledUIDs.every((v, i) => v === targetUIDs[i])
            )
              return false;
          }
          return true;
        };

        // 渲染角色快照列表
        const renderCharSnapList = async () => {
          const $header = $dlg.find("#lulu-qs-char-header");
          const $list = $dlg.find("#lulu-qs-char-list").empty();
          const charName = qsGetCharName();

          if (!charName) {
            $header.html(
              '<i class="fa-solid fa-circle-info" style="color:#fcc419;"></i> 未打开角色聊天',
            );
            $list.html(
              '<div style="color:gray; text-align:center; padding:30px; background:var(--SmartThemeBotMesColor); border-radius:8px; border:1px dashed var(--SmartThemeBorderColor); line-height:1.6;">当前没有打开任何角色的聊天哦~<br>进入聊天后，这里就会显示该角色的专属快照啦 (๑>؂<๑)</div>',
            );
            return;
          }

          $header.html(
            `<i class="fa-solid fa-user-astronaut"></i> 当前角色：${charName}`,
          );

          const allSnaps = qsGetCharSnaps();
          const mySnaps = allSnaps[charName] || {};
          const snapNames =
            typeof sortCharSnapshotNames === "function"
              ? sortCharSnapshotNames(charName, Object.keys(mySnaps))
              : Object.keys(mySnaps);

          if (snapNames.length === 0) {
            $list.html(
              '<div style="color:gray; text-align:center; padding:30px; background:var(--SmartThemeBotMesColor); border-radius:8px; border:1px dashed var(--SmartThemeBorderColor);">这个角色还没有保存过专属快照呢~<br>可以去管理面板的「当前聊天角色」页收纳哦</div>',
            );
            return;
          }

          for (const name of snapNames) {
            const snapData = mySnaps[name];
            const bookCount = Object.keys(snapData).length;
            const totalEntries = Object.values(snapData).reduce(
              (a, arr) => a + (Array.isArray(arr) ? arr.length : 0),
              0,
            );
            const $item = $(
              `<div class="lulu-qs-item" data-snapname="${encodeURIComponent(name)}" style="background:var(--SmartThemeBotMesColor); border:1px solid var(--SmartThemeBorderColor); border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
                <div style="flex:1; min-width:0;">
                  <div style="font-weight:bold; font-size:14.5px; color:var(--SmartThemeBodyColor); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><i class="fa-solid fa-camera-retro" style="color:var(--SmartThemeQuoteColor);"></i> ${name}</div>
                  <div style="font-size:11px; color:gray; margin-top:6px;">涉及 ${bookCount} 本书 · 共开启 ${totalEntries} 项</div>
                  <div class="lulu-qs-char-badge" style="display:none; margin-top:6px; font-size:11px; color:#51cf66; font-weight:bold;"><i class="fa-solid fa-circle-check"></i> 当前生效中</div>
                </div>
                <button class="menu_button interactable btn-primary lulu-qs-btn-hover lulu-qs-char-apply" style="margin:0; border:none; border-radius:6px; font-size:13px; font-weight:bold; padding:8px 14px; flex-shrink:0; display:inline-flex; align-items:center; gap:6px; white-space:nowrap;">运行 <i class="fa-solid fa-play"></i></button>
              </div>`,
            );

            // 检测是否生效
            let isActive = false;
            try {
              isActive = await qsIsCharSnapActive(snapData);
            } catch (e) {}
            if (isActive) {
              $item.find(".lulu-qs-char-badge").show();
              $item.addClass("lulu-qs-active");
              $item
                .find(".lulu-qs-char-apply")
                .removeClass("btn-primary")
                .addClass("btn-secondary")
                .html('生效中 <i class="fa-solid fa-check"></i>')
                .css("opacity", "0.7");
            }

            $item.find(".lulu-qs-char-apply").on("click", async function () {
              if ($(this).hasClass("btn-secondary"))
                return toastr.info("这个组合已经在生效啦~ (๑>؂<๑)");
              toastr.info(`正在为角色应用组合 [${name}] ...`);
              $dlg.find(".lulu-qs-char-apply").css("pointer-events", "none");
              try {
                const ok = await qsApplyCharSnap(snapData);
                if (ok) {
                  toastr.success(`✨ 角色组合 [${name}] 应用成功！`);
                  await renderCharSnapList();
                }
              } catch (e) {
                toastr.error(`出了点小意外：${e.message}`);
              } finally {
                $dlg.find(".lulu-qs-char-apply").css("pointer-events", "auto");
              }
            });

            $list.append($item);
          }
        };
        // 极速面板角色区：一键关闭
        $dlg
          .find("#lulu-qs-char-close-all")
          .off("click")
          .on("click", async () => {
            const charName = qsGetCharName();
            if (!charName) return toastr.warning("当前没有打开角色聊天哦~");
            const boundBooks = qsGetCharBoundBooks();
            if (boundBooks.length === 0)
              return toastr.info("当前角色没有绑定世界书~");
            const res = await SillyTavern.callGenericPopup(
              `确认关闭 [${charName}] 绑定的 ${boundBooks.length} 本世界书的所有条目吗？`,
              SillyTavern.POPUP_TYPE.CONFIRM,
            );
            if (res !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
            toastr.info("正在关闭...");
            $dlg.find("#lulu-qs-char-close-all").css("pointer-events", "none");
            try {
              for (const wb of boundBooks) {
                let entries = await getWorldbook(wb);
                let changed = false;
                entries.forEach((e) => {
                  if (e.enabled) {
                    e.enabled = false;
                    changed = true;
                  }
                });
                if (changed) await replaceWorldbook(wb, entries);
              }
              toastr.success(`✨ 已关闭 [${charName}] 所有条目~`);
              await renderCharSnapList();
            } catch (e) {
              toastr.error("关闭失败：" + e.message);
            } finally {
              $dlg
                .find("#lulu-qs-char-close-all")
                .css("pointer-events", "auto");
            }
          });

        // 极速面板角色区：批量删除
        $dlg
          .find("#lulu-qs-char-batch-del")
          .off("click")
          .on("click", async () => {
            const charName = qsGetCharName();
            if (!charName) return toastr.warning("当前没有打开角色聊天哦~");
            const allSnaps = qsGetCharSnaps();
            const mySnaps = allSnaps[charName] || {};
            const names =
              typeof sortCharSnapshotNames === "function"
                ? sortCharSnapshotNames(charName, Object.keys(mySnaps))
                : Object.keys(mySnaps);
            if (names.length === 0)
              return toastr.info("这个角色还没有快照可删~");

            let listHtml =
              '<div style="max-height:50vh; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">';
            names.forEach((name) => {
              const safeN = encodeURIComponent(name);
              listHtml += `<label style="display:flex; align-items:center; gap:8px; padding:8px 10px; background:var(--SmartThemeBotMesColor); border:1px solid var(--SmartThemeBorderColor); border-radius:6px; cursor:pointer;"><input type="checkbox" class="lulu-qscsdel-chk" data-name="${safeN}" style="accent-color:#ff6b6b;"><span style="flex:1; word-break:break-all;"><i class="fa-solid fa-camera-retro" style="color:var(--SmartThemeQuoteColor); margin-right:4px;"></i>${name}</span></label>`;
            });
            listHtml += "</div>";

            const $ddlg = $(
              `<div style="padding:6px; min-width:280px; text-align:left;"><h3 style="margin-top:0; color:#ff6b6b;"><i class="fa-solid fa-trash-can"></i> 批量删除角色快照</h3><div style="display:flex; gap:8px; margin-bottom:10px;"><button id="lulu-qscsdel-all" class="menu_button btn-success" style="margin:0; padding:6px 12px; font-size:12px; border:none; flex:1; white-space:nowrap; display:flex; justify-content:center; align-items:center;">全选</button><button id="lulu-qscsdel-none" class="menu_button btn-secondary" style="margin:0; padding:6px 12px; font-size:12px; flex:1; white-space:nowrap; display:flex; justify-content:center; align-items:center;">全不选</button></div>${listHtml}</div>`,
            );
            $ddlg
              .attr("id", "lulu-qscsdel-dialog")
              .prepend(
                `<style>${window.buildPopupThemeCSS("dialog:has(#lulu-qscsdel-dialog)")}</style>`,
              );
            // ✨ 补上：全选 / 全不选 按钮的点击事件
            $ddlg
              .find("#lulu-qscsdel-all")
              .on("click", () =>
                $ddlg.find(".lulu-qscsdel-chk").prop("checked", true),
              );
            $ddlg
              .find("#lulu-qscsdel-none")
              .on("click", () =>
                $ddlg.find(".lulu-qscsdel-chk").prop("checked", false),
              );
            const r = await SillyTavern.callGenericPopup(
              $ddlg,
              SillyTavern.POPUP_TYPE.CONFIRM,
              "",
              { okButton: "删除选中", cancelButton: "取消" },
            );
            if (r !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;

            const del = [];
            $ddlg.find(".lulu-qscsdel-chk:checked").each(function () {
              del.push(decodeURIComponent($(this).attr("data-name")));
            });
            if (del.length === 0) return toastr.info("没勾选任何快照~");

            updateVariablesWith(
              (v) => {
                if (typeof v.wb_char_snapshots === "string") {
                  try {
                    v.wb_char_snapshots = JSON.parse(v.wb_char_snapshots);
                  } catch (e) {
                    v.wb_char_snapshots = {};
                  }
                }
                if (v.wb_char_snapshots && v.wb_char_snapshots[charName]) {
                  del.forEach((n) => delete v.wb_char_snapshots[charName][n]);
                }
                return v;
              },
              { type: "global" },
            );
            toastr.success(`已删除 ${del.length} 个角色快照~`);
            await renderCharSnapList();
          });

        // ========== 标签切换 ==========
        $dlg.find("#lulu-qs-tab-global").on("click", function () {
          $dlg.find(".lulu-qs-tab").removeClass("lulu-qs-tab-active");
          $(this).addClass("lulu-qs-tab-active");
          $dlg.find("#lulu-qs-global-section").show();
          $dlg.find("#lulu-qs-char-section").hide();
        });
        $dlg.find("#lulu-qs-tab-char").on("click", function () {
          $dlg.find(".lulu-qs-tab").removeClass("lulu-qs-tab-active");
          $(this).addClass("lulu-qs-tab-active");
          $dlg.find("#lulu-qs-global-section").hide();
          $dlg.find("#lulu-qs-char-section").show();
          renderCharSnapList();
        });
        // ========== 当前角色快照逻辑结束 ==========
        $dlg.find("#lulu-qs-search").on("input", function () {
          const kw = $(this).val().toLowerCase();
          $dlg.find("#lulu-qs-global-section .lulu-qs-item").each(function () {
            const name = decodeURIComponent(
              $(this).find(".lulu-qs-apply-btn").attr("data-rawname"),
            ).toLowerCase();
            $(this).toggle(name.includes(kw));
          });
        });
        // 🆕 角色快照搜索
        $dlg.find("#lulu-qs-char-search").on("input", function () {
          const kw = $(this).val().toLowerCase();
          $dlg.find("#lulu-qs-char-list .lulu-qs-item").each(function () {
            const snapName = decodeURIComponent(
              $(this).attr("data-snapname") || "",
            ).toLowerCase();
            $(this).toggle(!kw || snapName.includes(kw));
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
            .removeClass("btn-secondary")
            .addClass("btn-primary")
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
                .removeClass("btn-primary")
                .addClass("btn-secondary")
                .html('生效中 <i class="fa-solid fa-check"></i>')
                .css("opacity", "0.7");
            }
          }
          $dlg
            .find("#lulu-qs-status-text")
            .html('<i class="fa-solid fa-eye"></i> 状态已同步');
        };
        // 极速面板：批量删除快照
        $dlg.find("#lulu-qs-batch-del").on("click", async () => {
          const names = Object.keys(snapshots);
          if (names.length === 0) return toastr.info("没有快照可删~");
          const sorted = sortSnapshotNames(names);
          let listHtml =
            '<div style="max-height:50vh; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">';
          sorted.forEach((name) => {
            const safeN = encodeURIComponent(name);
            listHtml += `<label style="display:flex; align-items:center; gap:8px; padding:8px 10px; background:var(--SmartThemeBotMesColor); border:1px solid var(--SmartThemeBorderColor); border-radius:6px; cursor:pointer;"><input type="checkbox" class="lulu-qsdel-chk" data-name="${safeN}" style="accent-color:#ff6b6b;"><span style="flex:1; word-break:break-all;">${name}</span></label>`;
          });
          listHtml += "</div>";
          const $ddlg = $(
            `<div style="padding:6px; min-width:280px; text-align:left;"><h3 style="margin-top:0; color:#ff6b6b;"><i class="fa-solid fa-trash-can"></i> 批量删除快照</h3><div style="display:flex; gap:8px; margin-bottom:10px;"><button id="lulu-qsdel-all" class="menu_button btn-success" style="margin:0; padding:6px 12px; font-size:12px; border:none; flex:1; white-space:nowrap; display:flex; justify-content:center; align-items:center;">全选</button><button id="lulu-qsdel-none" class="menu_button btn-secondary" style="margin:0; padding:6px 12px; font-size:12px; flex:1; white-space:nowrap; display:flex; justify-content:center; align-items:center;">全不选</button></div>${listHtml}</div>`,
          );
          $ddlg
            .attr("id", "lulu-qsdel-dialog")
            .prepend(
              `<style>${window.buildPopupThemeCSS("dialog:has(#lulu-qsdel-dialog)")}</style>`,
            );
          $ddlg
            .find("#lulu-qsdel-all")
            .on("click", () =>
              $ddlg.find(".lulu-qsdel-chk").prop("checked", true),
            );
          $ddlg
            .find("#lulu-qsdel-none")
            .on("click", () =>
              $ddlg.find(".lulu-qsdel-chk").prop("checked", false),
            );
          const r = await SillyTavern.callGenericPopup(
            $ddlg,
            SillyTavern.POPUP_TYPE.CONFIRM,
            "",
            { okButton: "删除选中", cancelButton: "取消" },
          );
          if (r !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
          const del = [];
          $ddlg.find(".lulu-qsdel-chk:checked").each(function () {
            del.push(decodeURIComponent($(this).attr("data-name")));
          });
          if (del.length === 0) return toastr.info("没勾选任何快照~");
          updateVariablesWith(
            (v) => {
              if (typeof v.wb_snapshots === "string") {
                try {
                  v.wb_snapshots = JSON.parse(v.wb_snapshots);
                } catch (e) {
                  v.wb_snapshots = {};
                }
              }
              if (v.wb_snapshots) del.forEach((n) => delete v.wb_snapshots[n]);
              return v;
            },
            { type: "global" },
          );
          del.forEach((n) => delete snapshots[n]);
          toastr.success(`已删除 ${del.length} 个快照~`);
          // 刷新极速面板：把对应卡片移除
          del.forEach((n) => {
            const safe = btoa(unescape(encodeURIComponent(n))).replace(
              /[^a-zA-Z0-9]/g,
              "",
            );
            $dlg.find(`.lulu-qs-item[data-itemname="${safe}"]`).remove();
          });
        });
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
        // 极速面板排序（功能8）——改的是同一个 wb_snapshot_order，自动和主面板同步
        const reorderQuickSnapshot = (rawName, dir) => {
          const sName = decodeURIComponent(rawName);
          let order = getSnapshotOrder();
          // 确保所有当前快照都在 order 里
          Object.keys(snapshots).forEach((n) => {
            if (!order.includes(n)) order.push(n);
          });
          const idx = order.indexOf(sName);
          const swapWith = idx + dir;
          if (swapWith < 0 || swapWith >= order.length) return;
          [order[idx], order[swapWith]] = [order[swapWith], order[idx]];
          setSnapshotOrder(order);
          // 重新排列 DOM 里的卡片顺序（不重建整个弹窗，体验更顺滑）
          const $items = $dlg.find(".lulu-qs-item").get();
          $items.sort((a, b) => {
            const na = decodeURIComponent(
              $(a).find(".lulu-qs-apply-btn").attr("data-rawname"),
            );
            const nb = decodeURIComponent(
              $(b).find(".lulu-qs-apply-btn").attr("data-rawname"),
            );
            let ia = order.indexOf(na);
            let ib = order.indexOf(nb);
            if (ia === -1) ia = 9999;
            if (ib === -1) ib = 9999;
            return ia - ib;
          });
          const $container = $dlg.find(".lulu-qs-item").first().parent();
          $items.forEach((el) => $container.append(el));
        };
        $dlg.find(".lulu-qs-move-up").on("click", function (e) {
          e.stopPropagation();
          reorderQuickSnapshot($(this).attr("data-rawname"), -1);
        });
        $dlg.find(".lulu-qs-move-down").on("click", function (e) {
          e.stopPropagation();
          reorderQuickSnapshot($(this).attr("data-rawname"), 1);
        });
        $dlg.find(".lulu-qs-apply-btn").on("click", async function () {
          if ($(this).hasClass("btn-secondary"))
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

// ✨ 内置矢量图标库（用户可从下拉框直接选）
const LULU_FLOAT_ICONS = {
  "fa-book-atlas": "📖 图集书（默认）",
  "fa-book-journal-whills": "📓 魔法书",
  "fa-book-open": "📖 打开的书",
  "fa-bolt": "⚡ 闪电",
  "fa-star": "⭐ 星星",
  "fa-wand-magic-sparkles": "🪄 魔法棒",
  "fa-dragon": "🐉 龙",
  "fa-cat": "🐱 猫咪",
  "fa-heart": "❤️ 爱心",
  "fa-gem": "💎 宝石",
  "fa-crown": "👑 皇冠",
  "fa-feather": "🪶 羽毛",
  "fa-moon": "🌙 月亮",
  "fa-fire": "🔥 火焰",
  "fa-ghost": "👻 幽灵",
  "fa-paw": "🐾 脚印",
  "fa-leaf": "🍃 叶子",
  "fa-compass": "🧭 罗盘",
};

// ✨ 读取悬浮球外观配置（含图标、颜色）
const getFloatAppearance = () => {
  return JSON.parse(
    localStorage.getItem("lulu_wb_floating_appearance") ||
      '{"iconType":"fa","iconValue":"fa-book-atlas","emoji":"📖","imgUrl":"","useThemeColor":true,"bgColor":"#2a2e33","bgAlpha":100,"iconColor":"#70a1ff","borderColor":"#70a1ff","borderAlpha":100}',
  );
};
const toggleFloatingButton = (show, forceUpdate = false) => {
  if (!show) {
    $("#lulu-wb-floating-btn").remove();
    $("#lulu-wb-floating-style").remove();
    return;
  }
  if ($("#lulu-wb-floating-btn").length > 0 && !forceUpdate) return;
  if (forceUpdate) {
    $("#lulu-wb-floating-style").remove();
    $("#lulu-wb-floating-btn").remove(); // 强制更新时把旧球也删掉重建，才能换图标
  }
  const flConf = JSON.parse(
    localStorage.getItem("lulu_wb_floating_config") ||
      '{"size": 48, "opacity": 0.8}',
  );
  const appear = getFloatAppearance();

  // 把 #rrggbb + 透明度 转成 rgba 颜色
  const luluHexToRgba = (hex, alpha) => {
    let r = 0,
      g = 0,
      b = 0;
    if (hex && hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return `rgba(${r},${g},${b},${alpha / 100})`;
  };

  // 决定颜色：跟随主题 or 自定义
  const bgAlpha = appear.bgAlpha === undefined ? 100 : appear.bgAlpha;
  const bgCss = appear.useThemeColor
    ? "var(--SmartThemeBotMesColor, #2a2e33)"
    : luluHexToRgba(appear.bgColor, bgAlpha);
  const iconColorCss = appear.useThemeColor
    ? "var(--SmartThemeQuoteColor, #70a1ff)"
    : appear.iconColor;
  const borderAlpha =
    appear.borderAlpha === undefined ? 100 : appear.borderAlpha;
  const borderColorCss = appear.useThemeColor
    ? "var(--SmartThemeQuoteColor, #70a1ff)"
    : luluHexToRgba(appear.borderColor, borderAlpha);

  if ($("#lulu-wb-floating-style").length === 0) {
    const styleHtml = `<style id="lulu-wb-floating-style">
        #lulu-wb-floating-btn {
            position: fixed !important;
            top: 45vh !important;
            right: 15px !important;
            width: ${flConf.size}px !important;
            height: ${flConf.size}px !important;
            opacity: ${flConf.opacity} !important;
            background: ${bgCss} !important;
            color: ${iconColorCss} !important;
            border: 2px solid ${borderColorCss} !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: ${flConf.size * 0.45}px !important;
            cursor: pointer !important;
            box-shadow: none !important;
            z-index: 2147483647 !important;
            user-select: none !important;
            touch-action: none !important;
            -webkit-tap-highlight-color: transparent !important;
            transition: transform 0.2s, opacity 0.2s !important;
            /* 新增：防止闪屏和性能优化 */
            will-change: auto !important;
            backface-visibility: hidden !important;
            -webkit-backface-visibility: hidden !important;
            transform: translateZ(0) !important;
            -webkit-transform: translateZ(0) !important;
        }
        #lulu-wb-floating-btn img.lulu-float-img {
            width: 90% !important;
            height: 90% !important;
            object-fit: cover !important;
            border-radius: 50% !important;
            pointer-events: none !important;
            /* 防止图片导致的闪烁 */
            image-rendering: -webkit-optimize-contrast !important;
            backface-visibility: hidden !important;
        }
        #lulu-wb-floating-btn span.lulu-float-emoji {
            font-size: ${flConf.size * 0.5}px !important;
            line-height: 1 !important;
            pointer-events: none !important;
        }
        #lulu-wb-floating-btn span.lulu-float-svg {
            width: 65% !important;
            height: 65% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            pointer-events: none !important;
        }
        #lulu-wb-floating-btn span.lulu-float-svg svg {
            width: 100% !important;
            height: 100% !important;
        }
        #lulu-wb-floating-btn > i {
            pointer-events: none !important;
        }
        #lulu-wb-floating-btn:active {
            transform: scale(0.9) !important;
        }
        #lulu-wb-floating-btn:hover {
            opacity: 1 !important;
        }
        .lulu-float-menu-opts {
            position: absolute;
            right: calc(100% + 10px);
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            gap: 8px;
            background: var(--SmartThemeBlurTintColor);
            padding: 8px;
            border-radius: 8px;
            border: 1px solid var(--SmartThemeBorderColor);
            box-shadow: 0 4px 8px rgba(0,0,0,0.4);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
            white-space: nowrap;
        }
        .lulu-float-menu-opts.show {
            opacity: 1;
            pointer-events: auto;
        }
        .lulu-float-btn-opt {
            cursor: pointer;
            padding: 6px 12px;
            font-size: 13px;
            font-weight: bold;
            color: var(--SmartThemeBodyColor);
            background: var(--SmartThemeBotMesColor);
            border: 1px solid var(--SmartThemeBorderColor);
            border-radius: 6px;
        }
        .lulu-float-btn-opt:hover {
            background: var(--SmartThemeQuoteColor);
            color: #fff;
        }
    </style>`;
    $("head").append(styleHtml);
  }

  if (forceUpdate && $("#lulu-wb-floating-btn").length > 0) return;

  // 根据配置生成球里面的内容（图片链接 / SVG代码 / emoji / 矢量图标）
  let $iconContent;
  if (appear.iconType === "img" && appear.imgUrl) {
    const val = appear.imgUrl.trim();
    // 智能识别：如果内容是 SVG 代码，就直接插入；否则当成图片网址
    if (val.toLowerCase().startsWith("<svg")) {
      $iconContent = $("<span>", { class: "lulu-float-svg" }).html(val);
    } else {
      $iconContent = $("<img>", {
        class: "lulu-float-img",
        src: val,
        alt: "icon",
      });
    }
  } else if (appear.iconType === "emoji" && appear.emoji) {
    $iconContent = $("<span>", {
      class: "lulu-float-emoji",
      text: appear.emoji,
    });
  } else {
    $iconContent = $("<i>", {
      class: `fa-solid ${appear.iconValue || "fa-book-atlas"}`,
    });
  }

  const $floatBtn = $("<div>", { id: "lulu-wb-floating-btn" })
    .append($iconContent)
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
  // ✨ 贴边后 hover 自动露出 / 移开缩回
  const edgeGapHover = 12;
  let hoverCollapseTimer = null; // 缩回的定时器

  const getRealWinW = () => {
    const realWin =
      window.parent && window.parent !== window ? window.parent : window;
    return realWin.innerWidth || document.documentElement.clientWidth;
  };

  // 滑出来
  const slideOut = () => {
    const edge = btnNode.dataset.dockedEdge;
    if (!edge) return;
    const winW = getRealWinW();
    const btnW = btnNode.offsetWidth || 48;
    btnNode.style.setProperty("transition", "left 0.22s ease", "important");
    if (edge === "left") {
      btnNode.style.setProperty("left", "2px", "important");
    } else {
      btnNode.style.setProperty("left", winW - btnW - 2 + "px", "important");
    }
  };

  // 缩回去
  const slideBack = () => {
    const edge = btnNode.dataset.dockedEdge;
    if (!edge) return;
    const winW = getRealWinW();
    const btnW = btnNode.offsetWidth || 48;
    btnNode.style.setProperty("transition", "left 0.22s ease", "important");
    if (edge === "left") {
      btnNode.style.setProperty(
        "left",
        edgeGapHover - btnW + "px",
        "important",
      );
    } else {
      btnNode.style.setProperty(
        "left",
        winW - edgeGapHover + "px",
        "important",
      );
    }
  };

  btnNode.addEventListener("mouseenter", () => {
    // 鼠标回来了，取消掉正在等待的"缩回"
    if (hoverCollapseTimer) {
      clearTimeout(hoverCollapseTimer);
      hoverCollapseTimer = null;
    }
    slideOut();
  });

  btnNode.addEventListener("mouseleave", () => {
    // 不立刻缩回，等 200 毫秒。如果这期间鼠标又进来，上面会 clear 掉
    if (hoverCollapseTimer) clearTimeout(hoverCollapseTimer);
    hoverCollapseTimer = setTimeout(() => {
      slideBack();
      hoverCollapseTimer = null;
    }, 200);
  });

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
    let lastLeft = initX; // 新增：记录当前left
    let lastTop = initY; // 新增：记录当前top

    const onPointerMove = (ev) => {
      const dx = (ev.clientX || 0) - startX;
      const dy = (ev.clientY || 0) - startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        isDragging = true;
        $floatBtn.find(".lulu-float-menu-opts").removeClass("show");
        lastLeft = initX + dx; // 新增：存起来
        lastTop = initY + dy; // 新增：存起来
        // 用 requestAnimationFrame 优化拖拽性能，减少闪屏
        requestAnimationFrame(() => {
          btnNode.style.setProperty("left", initX + dx + "px", "important");
          btnNode.style.setProperty("top", initY + dy + "px", "important");
          btnNode.style.setProperty("right", "auto", "important");
          btnNode.style.setProperty("transition", "none", "important");
        });
      }
    };
    const onPointerUp = (ev) => {
      btnNode.removeEventListener("pointermove", onPointerMove);
      btnNode.removeEventListener("pointerup", onPointerUp);
      btnNode.removeEventListener("pointercancel", onPointerUp);
      try {
        btnNode.releasePointerCapture(ev.pointerId);
      } catch (err) {}

      // 没拖动就啥也不干，直接返回，保持原样
      if (!isDragging) {
        btnNode.style.setProperty(
          "transition",
          "transform 0.2s, opacity 0.2s",
          "important",
        );
        return;
      }

      const btnW = btnNode.offsetWidth || 48;
      const realWin =
        window.parent && window.parent !== window ? window.parent : window;
      const winW = realWin.innerWidth || document.documentElement.clientWidth;
      const winH = realWin.innerHeight || document.documentElement.clientHeight;
      const edgeGap = 12;

      // 保护：lastLeft/lastTop 必须是正常数字，否则用当前位置兜底
      let curLeft = Number(lastLeft);
      let curTop = Number(lastTop);
      if (!Number.isFinite(curLeft)) curLeft = winW - btnW - 15;
      if (!Number.isFinite(curTop)) curTop = winH * 0.45;

      // 算吸附
      const distLeft = curLeft;
      const distRight = winW - (curLeft + btnW);
      let finalLeft = curLeft;
      let dockedEdge = null; // 记录贴哪边：'left' / 'right' / null(没贴)
      if (Math.min(distLeft, distRight) <= 40) {
        if (distLeft <= distRight) {
          finalLeft = edgeGap - btnW;
          dockedEdge = "left";
        } else {
          finalLeft = winW - edgeGap;
          dockedEdge = "right";
        }
      }
      // 把状态存到球的属性上，供 hover 时读取
      btnNode.dataset.dockedEdge = dockedEdge || "";

      // 【关键防呆】强制夹进合理范围，物理上不许飞
      const minLeft = edgeGap - btnW; // 最左（贴左边露一点）
      const maxLeft = winW - edgeGap; // 最右
      if (finalLeft < minLeft) finalLeft = minLeft;
      if (finalLeft > maxLeft) finalLeft = maxLeft;

      let finalTop = curTop;
      if (finalTop < 6) finalTop = 6;
      if (finalTop > winH - btnW - 6) finalTop = winH - btnW - 6;

      console.log("最终落点：", { finalLeft, finalTop, btnW, winW });

      btnNode.style.setProperty(
        "transition",
        "left 0.25s ease, top 0.25s ease, transform 0.2s, opacity 0.2s",
        "important",
      );
      btnNode.style.setProperty("left", finalLeft + "px", "important");
      btnNode.style.setProperty("top", finalTop + "px", "important");
      btnNode.style.setProperty("right", "auto", "important");
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

      // 看球现在在屏幕的左半区还是右半区，决定面板弹出方向
      const realWin =
        window.parent && window.parent !== window ? window.parent : window;
      const winW = realWin.innerWidth || document.documentElement.clientWidth;
      const rect = btnNode.getBoundingClientRect();
      const btnCenterX = rect.left + rect.width / 2; // 球的中心点横坐标

      if (btnCenterX < winW / 2) {
        // 球在左半区 → 面板朝右弹
        $menu.css({ right: "auto", left: "calc(100% + 10px)" });
      } else {
        // 球在右半区 → 面板朝左弹
        $menu.css({ left: "auto", right: "calc(100% + 10px)" });
      }

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
            /* 折叠触发条：电脑手机都显示，占满整行 */
            #wb-entry-btn-toggle, #wb-main-ctrl-toggle {
                display: flex !important;
                width: 100%;
                align-items: center;
                justify-content: center;
                gap: 6px;
                cursor: pointer;
                padding: 8px !important;
                border-radius: 6px;
                background: rgba(125,125,125,0.12);
                border: 1px solid var(--SmartThemeBorderColor);
                font-size: 13px;
                font-weight: bold;
                color: var(--SmartThemeQuoteColor);
                box-sizing: border-box;
                transition: 0.2s;
            }
            #wb-entry-btn-toggle:hover, #wb-main-ctrl-toggle:hover {
                background: rgba(125,125,125,0.22);
            }
            dialog.wb-manager-dialog {
    width: 92vw !important;
    max-width: 1600px !important;
    max-height: 92vh !important;
    transition: zoom 0.2s ease-out;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    font-family: sans-serif;
    background: var(--SmartThemeBlurTintColor) !important;
    /* 性能优化：防止面板内的操作导致页面重绘闪屏 */
    contain: layout style !important;
    will-change: auto !important;
}

            dialog.wb-manager-dialog::backdrop { background: rgba(0,0,0,0.4) !important; backdrop-filter: blur(4px) !important; }

            #wb-manager-panel h3 { font-size: 15px; margin: 10px 0 8px 0; border-bottom: 2px solid var(--SmartThemeBorderColor); padding-bottom: 5px; color: var(--SmartThemeQuoteColor); }

            .wb-tab-strip { display: flex; width: 100%; border-bottom: 2px solid var(--SmartThemeBorderColor); margin-bottom: 12px; gap: 4px; }
            .wb-tab-btn { flex: 1; padding: 12px; text-align: center; cursor: pointer; border-radius: 6px 6px 0 0; background: rgba(0,0,0,0.1); color: gray; font-size: 15px; font-weight: bold; transition: 0.2s; border: 1px solid transparent; border-bottom: none; }
            .wb-tab-btn:hover { background: rgba(0,0,0,0.2); color: var(--SmartThemeBodyColor); }
            .wb-tab-btn.active { background: var(--SmartThemeBotMesColor); color: var(--SmartThemeQuoteColor); border-color: var(--SmartThemeBorderColor); box-shadow: 0 -2px 5px rgba(0,0,0,0.1); }

            .wb-list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 10px; align-content: start; max-height: 55vh; overflow-y: auto; background: var(--SmartThemeBlurTintColor); border-radius: 8px; border: 1px solid var(--SmartThemeBorderColor); padding: 10px; position: relative; }
            .wb-snapshot-list { display: flex; flex-direction: column; gap: 8px; max-height: 35vh; overflow-y: auto; background: var(--SmartThemeBlurTintColor); border-radius: 8px; border: 1px solid var(--SmartThemeBorderColor); padding: 10px; }

            .wb-item-wrapper { display: flex; flex-direction: column; background: var(--SmartThemeBotMesColor); border-radius: 6px; border: 1px solid var(--SmartThemeBorderColor); border-left: 3px solid rgba(125,125,125,0.35); transition: 0.2s; overflow: hidden; padding: 10px; gap: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
            .wb-item-wrapper:hover { border-color: var(--SmartThemeQuoteColor); box-shadow: 0 4px 8px rgba(0,0,0,0.18); transform: translateY(-1px); z-index: 10; }

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
            #wb-transfer-a2b:hover, #wb-transfer-b2a:hover { background: #51cf66 !important; color: #fff !important; transform: scale(1.12); box-shadow: 0 4px 12px rgba(81,207,102,0.4) !important; }

            .wb-bind-tag { font-size: 11px; border-radius: 4px; padding: 4px 8px; display: inline-flex; align-items: center; gap: 5px; font-weight: bold; cursor: pointer; transition: 0.2s; }
            .wb-bind-tag:hover { filter: brightness(1.2); }

            .wb-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
            .wb-controls-group { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; flex-shrink: 0; justify-content: space-between; width: 100%;}
            @media (min-width: 769px) { #wb-main-controls-group > button { flex: 1; justify-content: center; } }
            /* 给筛选下拉框一个明确可见的边框，避免看起来没有边界 */
            .wb-toolbar select.wb-input-dt {
                border: 1px solid var(--SmartThemeQuoteColor) !important;
                border-radius: 6px !important;
                background: var(--lulu-input-bg, var(--SmartThemeBotMesColor)) !important;
            }
            .wb-toolbar select.wb-input-dt:hover {
                border-color: var(--SmartThemeQuoteColor) !important;
                box-shadow: 0 0 0 1px var(--SmartThemeQuoteColor) inset;
            }

            .wb-btn-group { display: flex; gap: 10px; margin: 10px 0; flex-wrap: wrap; }
            .wb-action-btn { flex: 1; min-width: 140px; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; padding: 10px; border-radius: 6px; background: transparent; color: var(--SmartThemeBodyColor); border: 1px solid var(--SmartThemeBorderColor); transition: 0.2s; font-weight: bold; font-size: 13px; box-sizing: border-box; text-align: center; white-space: nowrap; word-break: keep-all; }
            .wb-action-btn:hover { background: var(--SmartThemeBlurTintColor); box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .wb-nowrap-btn { white-space: nowrap !important; flex-shrink: 0 !important; word-break: keep-all !important; display: inline-flex; align-items: center; justify-content: center; gap: 5px; }
            dialog.wb-manager-dialog .wb-group-toggle-all {
                background: transparent !important; border: none !important; box-shadow: none !important;
            }
            /* 让这几个按钮的底色跟随主题，不再是刺眼的纯白 */
            dialog.wb-manager-dialog #wb-btn-recycle {
                background: rgba(252,196,25,0.08) !important;
            }
            dialog.wb-manager-dialog #wb-btn-transfer {
                background: rgba(32,201,151,0.08) !important;
            }
            dialog.wb-manager-dialog .wb-transfer-selall,
            dialog.wb-manager-dialog .wb-transfer-deselall {
                background: var(--SmartThemeBotMesColor) !important;
                color: var(--SmartThemeBodyColor) !important;
                border: 1px solid var(--SmartThemeBorderColor) !important;
            }
            .wb-transfer-wbdrop {
    background-color: var(--SmartThemeBlurTintColor) !important;
    background-image:
        linear-gradient(var(--SmartThemeBotMesColor), var(--SmartThemeBotMesColor)),
        linear-gradient(#22252b, #22252b) !important;
    backdrop-filter: blur(16px) saturate(1.6) !important;
    -webkit-backdrop-filter: blur(16px) saturate(1.6) !important;
    box-shadow: 0 6px 20px rgba(0,0,0,0.6) !important;
}

            .btn-primary { color: var(--SmartThemeQuoteColor) !important; border-color: var(--SmartThemeQuoteColor) !important; background: rgba(125, 125, 125, 0.05) !important;}
            .btn-primary:hover { background: var(--SmartThemeQuoteColor) !important; color: #fff !important; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }

            .btn-success { color: #51cf66 !important; border-color: #51cf66 !important; background: rgba(81, 207, 102, 0.05) !important; }
            .btn-success:hover { background: #51cf66 !important; color: #fff !important; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }

            .btn-danger { color: #ff6b6b !important; border-color: #ff6b6b !important; background: rgba(255, 107, 107, 0.05) !important; }
            .btn-danger:hover { background: #ff6b6b !important; color: #fff !important; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }

            .btn-warning { color: #fcc419 !important; border-color: #fcc419 !important; background: rgba(252, 196, 25, 0.08) !important; }
            .btn-warning:hover { background: #fcc419 !important; color: #212529 !important; }

            .btn-secondary { color: gray !important; border-color: rgba(150,150,150,0.5) !important; background: rgba(150,150,150,0.15) !important; }
            .btn-secondary:hover { background: gray !important; color: #fff !important; }

            .btn-info { color: #339af0 !important; border-color: rgba(51,154,240,0.5) !important; background: rgba(51,154,240,0.15) !important; }
            .btn-info:hover { background: #339af0 !important; color: #fff !important; }

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

            /* 酱新增：条目编辑分栏专用核心样式  */
            #wb-entry-split-wrapper { display: flex; min-height: 70vh; max-height: 85vh; border: 1px solid var(--SmartThemeBorderColor); border-radius: 6px; padding: 10px; background: var(--SmartThemeBotMesColor); gap: 10px; position: relative; overflow: hidden; }
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

            /*  新增：桌面端特化极限参数区压缩  */
            @media (min-width: 769px) {
                #wb-det-ui-compress {
                    display: flex !important;
                    flex-wrap: wrap !important;
                    gap: 8px 10px !important;
                    align-items: flex-end !important;
                    padding: 10px !important;
                    margin-bottom: 8px !important;
                }
                #wb-det-ui-compress .wb-form-group {
                    margin-bottom: 0 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 4px !important;
                }
                #wb-det-ui-compress label {
                    font-size: 11.2px !important;
                    margin-bottom: 0 !important;
                    line-height: 1 !important;
                }
                #wb-det-ui-compress .wb-input-dt {
                    padding: 3px 6px !important;
                    font-size: 11.6px !important;
                    height: 26px !important;
                }
                #wb-det-ui-compress .wb-re-checks {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 6px !important;
                    justify-content: center !important;
                    padding-bottom: 2px !important;
                }
                #wb-det-ui-compress .wb-re-checks label {
                    font-size: 10.5px !important;
                    padding: 0 !important;
                    display: flex !important;
                    align-items: center !important;
                }
                #wb-det-ui-compress input[type="checkbox"] {
                    transform: scale(0.95) !important;
                }
                #wb-det-ui-compress:not(.has-depth) #wb-det-depth-container {
                    display: none !important;
                }
                /* 将正文编辑区加长占比 */
                #wb-entry-detail-side > .scrollableInnerFull { flex: 1 1 auto; display: flex; flex-direction: column; overflow: hidden; }
                #wb-entry-detail-side .wb-form-group:last-child { flex: 1 1 auto; overflow: hidden; display: flex; flex-direction: column; }
                #wb-det-content { height: 100% !important; flex: 1 1 auto !important; margin-bottom: 4px; }
            }
/* ✨ 新增：独占/全屏编辑模式专用样式 */
            #wb-entry-split-wrapper.lulu-fullscreen-mode #wb-entry-list-side {
                width: 100% !important;
                flex: 1 1 100% !important;
                border-bottom: none !important;
            }
            #wb-entry-split-wrapper.lulu-fullscreen-mode #wb-entry-detail-side {
                display: none !important; /* 没点开条目时隐藏右侧 */
            }
            #wb-entry-split-wrapper.lulu-fullscreen-mode.is-editing-entry #wb-entry-list-side {
                display: none !important; /* 点开条目后隐藏左侧列表 */
            }
            #wb-entry-split-wrapper.lulu-fullscreen-mode.is-editing-entry #wb-entry-detail-side {
                display: flex !important;
                width: 100% !important;
                flex: 1 1 100% !important;
                border-left: none !important;
                padding: 0 !important;
            }
            /* 强迫症专属：批量操作网格布局 */
            .lulu-batch-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
                gap: 8px;
            }
            .lulu-batch-grid button {
                width: 100% !important;
                margin: 0 !important;
                justify-content: center;
                padding: 6px 4px !important;
                font-size: 12.5px !important;
            }
            @media (max-width: 768px) {
                .lulu-batch-grid {
                    grid-template-columns: 1fr 1fr !important; /* 手机端绝对严格2列对齐 */
                    gap: 6px !important;
                }
                #wb-entry-batch-actions {
                    padding: 8px !important;
                    max-height: none !important;
                }
            }

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

                .wb-toolbar { flex-direction: column; align-items: stretch; gap: 6px; margin-bottom: 6px; }
                .wb-toolbar > div:first-child { width: 100% !important; display: flex !important; flex-wrap: wrap; gap: 6px; align-items: center; }
                .wb-toolbar > div:first-child > div:first-child { flex: 1 1 100%; display: flex !important; gap: 6px; margin-right: 0 !important; width: auto; }
.wb-toolbar > div:first-child > #wb-filter-state,
.wb-toolbar > div:first-child > #wb-sort-select { flex: 1 1 100%; }
                .wb-toolbar > div:first-child > label { flex: 1 1 0 !important; min-width: 130px; max-width: 50%; box-sizing: border-box; justify-content: center !important; margin: 0 !important; padding: 6px 2px !important; font-size: 11.5px !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
                /* 📱 当前聊天角色页：四个操作按钮改为 2×2 网格，避免文字重叠 */
                #wb-char-view > .wb-btn-group {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 6px !important;
                }
                #wb-char-view > .wb-btn-group .wb-action-btn {
                    width: 100% !important;
                    min-width: 0 !important;
                    white-space: normal !important;
                    word-break: break-all !important;
                    padding: 8px 4px !important;
                    font-size: 11px !important;
                    line-height: 1.25 !important;
                }
                #wb-main-view > .wb-btn-group:not(#wb-main-close-row) { display: grid !important; grid-template-columns: 1fr 1fr; gap: 6px; margin: 6px 0 !important; }
                #wb-main-ops-grid { grid-template-columns: 1fr 1fr !important; }
                #wb-main-ops-grid .wb-action-btn { width: 100%; min-width: 0 !important; padding: 7px 4px !important; font-size: 10.8px !important; line-height: 1.18 !important; }
                .wb-action-btn { width: 100%; min-width: 0 !important; padding: 8px 6px !important; font-size: 11.5px !important; }

                .wb-list-grid { grid-template-columns: 1fr; padding: 7px; gap: 10px; }
                .wb-item-wrapper { padding: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); border-left-width: 4px; }
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
                #wb-entry-view > div:first-child {
                    margin-bottom: 4px !important;
                    gap: 4px !important;
                    padding-bottom: 2px;
                    flex-direction: column !important;
                    align-items: stretch !important;
                }
                /* 标题行：不换行超长省略号，不再把整个面板撑成竖长条 */
                #wb-entry-view > div:first-child > span:first-child {
                    width: 100% !important;
                    min-width: 0 !important;
                }
                #wb-entry-title {
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    max-width: 100% !important;
                    display: block !important;
                }
                /* 四个按钮（启用分组/按前缀分组/内容预览/全屏编辑）2×2整齐排列 */
                #wb-entry-view > div:first-child > div {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 4px !important;
                    width: 100% !important;
                }
                #wb-entry-view > div:first-child > div label {
                    width: 100% !important;
                    box-sizing: border-box !important;
                    justify-content: center !important;
                    padding: 5px 2px !important;
                    font-size: 10.5px !important;
                    margin: 0 !important;
                }
                #wb-entry-view > div:first-child > div label span {
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                }
                #wb-entry-view > div:first-child label { padding: 3px 7px !important; font-size: 10.8px !important; }
                #wb-entry-list-side > div:first-child { gap: 5px !important; margin-bottom: 5px !important; }
                #wb-entry-list-side > div:first-child input,
                #wb-entry-list-side > div:first-child select { padding: 5px !important; font-size: 11.2px !important; }

                #wb-entry-list-side .wb-btn-group { display: grid !important; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 5px !important; }
                #wb-entry-list-side .wb-action-btn { width: 100% !important; min-width: 0 !important; padding: 5px 4px !important; font-size: 10.6px !important; line-height: 1.1 !important; }
                /* 手机端：折叠触发条占满整行 */
                #wb-entry-list-side #wb-entry-btn-toggle,
                #wb-main-controls-group #wb-main-ctrl-toggle {
                    grid-column: 1 / -1 !important;
                    font-size: 11.5px !important;
                    padding: 6px !important;
                }
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
                #wb-entry-container { min-height: 150px !important; max-height: none !important; }
                #wb-entry-batch-actions {
                    max-height: 88px !important;
                    overflow-y: auto !important;
                    padding: 5px !important;
                    gap: 4px !important;
                    margin-bottom: 5px !important;
                }
                #wb-entry-batch-actions .lulu-batch-grid button {
                    min-height: 30px !important;
                    padding: 4px 4px !important;
                    font-size: 10.5px !important;
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
                    grid-template-columns: 1fr 1fr 1fr;
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

                /* ========== 【功能4：搬运台】手机适配 ========== */
                #wb-transfer-view {
                    height: auto !important;
                }
                #wb-transfer-split {
                    display: block !important;
                    max-height: none !important;
                    min-height: 0 !important;
                    overflow: visible !important;
                }
                .wb-transfer-side {
                    display: block !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                    padding: 6px !important;
                    margin-bottom: 6px !important;
                }
                .wb-transfer-wbsearch,
                .wb-transfer-search {
                    padding: 5px 7px !important;
                    font-size: 12px !important;
                    margin-bottom: 5px !important;
                }
                .wb-transfer-selall, .wb-transfer-deselall {
                    padding: 4px 6px !important;
                    font-size: 11px !important;
                }
                /* 条目列表：给一个明确的高度，能滚动 */
                .wb-transfer-side .wb-transfer-list {
                    height: 38vh !important;
                    max-height: 38vh !important;
                    min-height: 180px !important;
                    overflow-y: auto !important;
                }
                /* 中间搬运按钮：横排、小尺寸 */
                #wb-transfer-split > div:nth-child(2) {
                    display: flex !important;
                    flex-direction: row !important;
                    justify-content: center !important;
                    gap: 28px !important;
                    padding: 2px 0 !important;
                    margin: 4px 0 !important;
                }
                #wb-transfer-a2b, #wb-transfer-b2a {
                    width: 34px !important;
                    height: 34px !important;
                    font-size: 13px !important;
                    box-shadow: none !important;
                }
                #wb-transfer-a2b i::before { content: "\\f103"; }
                #wb-transfer-b2a i::before { content: "\\f102"; }
                .wb-transfer-wbdrop {
                    max-height: 160px !important;
                }
                /* ========== 搬运台手机适配 结束 ========== */

                /* 📱 修复手机端“全屏编辑”模式下列表无法占满屏幕的留白问题 */
                #wb-entry-split-wrapper.lulu-fullscreen-mode #wb-entry-list-side {
                    flex: 1 1 100% !important;
                    max-height: none !important;
                    height: 100% !important;
                }
            }
            .scrollableInnerFull {
                -webkit-overflow-scrolling: touch;
                will-change: scroll-position;
                contain: layout style;
            }

            /* 🔧 修复（电脑端）：分组表头/顶部按钮被纵向拉长、批量面板挤压列表 */
            @media (min-width: 769px) {
                .lulu-ui-group-header {
                    padding: 5px 10px !important;
                    align-items: center !important;
                }
                .lulu-ui-group-header .lulu-group-ctrls {
                    align-items: center !important;
                    flex-wrap: wrap !important;
                }
                .lulu-ui-group-header .lulu-group-ctrls .menu_button {
                    height: 26px !important;
                    min-height: 26px !important;
                    max-height: 26px !important;
                    line-height: 1 !important;
                    align-self: center !important;
                    box-sizing: border-box !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                .lulu-ui-group-header .lulu-group-ctrls i.lulu-btn-up,
                .lulu-ui-group-header .lulu-group-ctrls i.lulu-btn-down {
                    align-self: center !important;
                    line-height: 1 !important;
                }
                #wb-top-control-bar .menu_button {
                    height: 30px !important;
                    min-height: 30px !important;
                    line-height: 1 !important;
                    align-self: center !important;
                    box-sizing: border-box !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                #wb-entry-batch-actions {
                    max-height: none !important;
                    overflow-y: visible !important;
                    padding: 6px 8px !important;
                    gap: 5px !important;
                    flex-shrink: 0 !important;
                }
                #wb-entry-batch-actions > div:first-child {
                    padding-bottom: 5px !important;
                }
                #wb-entry-batch-actions > div:first-child span {
                    font-size: 13px !important;
                }
                #wb-entry-batch-actions > div:first-child .menu_button {
                    height: 28px !important;
                    min-height: 28px !important;
                    padding: 3px 10px !important;
                    font-size: 11.5px !important;
                }
                /* 8个批量按钮改为固定4列2行，整齐又不占高度 */
                #wb-entry-batch-actions .lulu-batch-grid {
                    grid-template-columns: repeat(4, 1fr) !important;
                    gap: 5px !important;
                }
                #wb-entry-batch-actions .lulu-batch-grid button {
                    height: 30px !important;
                    min-height: 30px !important;
                    padding: 4px 4px !important;
                    font-size: 11.5px !important;
                    line-height: 1 !important;
                }
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
                    <h2 style="margin: 0; font-size: 18px; color: var(--SmartThemeQuoteColor); font-weight: bold; white-space: nowrap;"><i class="fa-solid fa-book-journal-whills"></i> 世界书管理</h2>
                    <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; margin: 0; white-space: nowrap; background: rgba(125,125,125,0.1); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--SmartThemeBorderColor);">
                        <input type="checkbox" id="wb-toggle-floating" style="accent-color: var(--SmartThemeQuoteColor); transform: scale(1.1);">
                        <span style="font-weight: bold; color: var(--SmartThemeQuoteColor);">悬浮球</span>
                    </label>
                    <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; margin: 0; white-space: nowrap; background: rgba(125,125,125,0.1); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--SmartThemeBorderColor);">
                        <input type="checkbox" id="wb-toggle-native-magic" style="accent-color: #51cf66; transform: scale(1.1);">
                        <span style="font-weight: bold; color: #51cf66;">原生分类同步</span>
                    </label>
                    <button id="wb-theme-quick-toggle" class="menu_button interactable btn-primary" style="margin: 0; padding: 4px 10px; min-width: unset; font-size: 13px; border-radius: 6px; flex-shrink: 0; white-space: nowrap;" title="一键切换深色/浅色护眼模式"><i class="fa-solid fa-circle-half-stroke"></i></button>
                    <button id="wb-theme-toggle-btn" class="menu_button interactable btn-primary" style="margin: 0; padding: 4px 10px; min-width: unset; font-size: 13px; border-radius: 6px; flex-shrink: 0; white-space: nowrap;"><i class="fa-solid fa-palette"></i> 外观设置</button>
                    <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; margin: 0; white-space: nowrap; background: rgba(125,125,125,0.1); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--SmartThemeBorderColor);" title="开启后，进入/导入角色卡时会自动检测内嵌世界书是否被污染">
                        <input type="checkbox" id="wb-toggle-auto-detect" style="accent-color: #ff922b; transform: scale(1.1);">
                        <span style="font-weight: bold; color: #ff922b;">自动检测污染</span>
                    </label>
                </div>
            </div>

            <!-- 外观设定的下拉内容区域 -->
            <div id="wb-theme-config-panel" style="display:none; margin-bottom: 12px; border-radius: 8px; border: 1px dashed var(--SmartThemeQuoteColor); background: rgba(0,0,0,0.1); padding: 12px;">
                <!-- 切换器：改面板 or 改悬浮球 -->
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px; padding-bottom:12px; border-bottom:1px dashed var(--SmartThemeBorderColor); flex-wrap:wrap;">
                    <label style="font-size:13px; font-weight:bold; color:var(--SmartThemeQuoteColor);"><i class="fa-solid fa-sliders"></i> 当前设置：</label>
                    <select id="wb-config-section-select" class="wb-input-dt" style="width:auto; padding:6px; margin:0; min-width:200px;">
                        <option value="panel">🖼️ 管理面板皮肤</option>
                        <option value="float">🔮 悬浮球外观</option>
                    </select>
                </div>

                <!-- 面板皮肤设置区 -->
                <div id="wb-config-panel-section">
                <div style="font-weight: bold; margin-bottom: 10px; color: var(--SmartThemeQuoteColor); display:flex; align-items:center; gap:6px;">
                    <i class="fa-solid fa-paint-roller"></i> 皮肤调色板
                    <span style="font-weight:normal; font-size:12px; color:gray;">(独立于酒馆全局，随意调整)</span>
                </div>
                <div style="display:flex; gap:12px; align-items: center; flex-wrap: wrap;">
                    <label style="font-size: 13px; font-weight: bold; margin-bottom: 0;">当前模式：</label>
                    <select id="wb-theme-select" class="wb-input-dt" style="width: auto; padding: 6px; margin-bottom:0; min-width: 200px;">
                        <option value="default">✨ 自动融合 (跟随酒馆)</option>
                        <option value="dark">🌙 夜间深色 </option>
                        <option value="light">☀️ 日间浅色 </option>
                        <option value="custom">🎨 自定义</option>
                    </select>
                    <div id="wb-theme-custom-opts" style="display:none; align-items:center; gap:10px; flex-wrap: wrap; background:var(--SmartThemeBotMesColor); padding:6px 12px; border-radius:6px; border:1px solid var(--SmartThemeBorderColor);">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <label style="font-size:12px; font-weight:bold;">底色:</label>
                            <input type="color" id="wb-theme-cp-bg" value="#2a2e33" style="width:32px; height:28px; border:none; padding:0; cursor:pointer;" title="主背景色">
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <label style="font-size:12px; font-weight:bold;">文字色:</label>
                            <input type="color" id="wb-theme-cp-text" value="#ffffff" style="width:32px; height:28px; border:none; padding:0; cursor:pointer;" title="常规文字颜色">
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <label style="font-size:12px; font-weight:bold; color:var(--SmartThemeQuoteColor);">强调色:</label>
                            <input type="color" id="wb-theme-cp-accent" value="#70a1ff" style="width:32px; height:28px; border:none; padding:0; cursor:pointer;" title="按钮、边框、图标的高亮颜色">
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <label style="font-size:12px; font-weight:bold;">输入框:</label>
                            <input type="color" id="wb-theme-cp-input-bg" value="#1a1c1f" style="width:32px; height:28px; border:none; padding:0; cursor:pointer;" title="搜索框与下拉菜单的底色">
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <label style="font-size:12px; font-weight:bold;">整体透明度:</label>
                            <input type="range" id="wb-theme-cp-alpha" min="0" max="100" value="95" style="width:60px; cursor:pointer;">
                            <span id="wb-theme-cp-alpha-val" style="font-size:12px; min-width:30px;">95%</span>
                        </div>
                        <!-- 🎲 盲盒控制区 -->
                        <div style="display:flex; align-items:center; gap:6px; border-left: 1px dashed var(--SmartThemeBorderColor); padding-left: 10px;">
                            <select id="wb-theme-random-mode" class="wb-input-dt" style="width: auto; padding: 4px; font-size: 11.5px; height: 26px;" title="设定你想Roll出的色彩范围">
                                <option value="random">🎲 随机配色</option>
                                <option value="dark">🌙 仅Roll深色系</option>
                                <option value="light">☀️ 仅Roll浅色系</option>
                            </select>
                            <button id="wb-theme-random-btn" class="menu_button interactable btn-warning wb-nowrap-btn" style="margin:0; padding:4px 8px; font-size:12px; border:none; border-radius:4px;" title="生成随机配色方案"><i class="fa-solid fa-dice"></i> 随机盲盒</button>
                        </div>
                    </div>

                    <!-- 自定义配方盒面板（修复文字遮挡并新增重命名按钮） -->
                    <div id="wb-theme-presets-area" style="display:none; margin-top: 10px; align-items:center; gap:10px; flex-wrap: wrap; background:var(--SmartThemeBotMesColor); padding:6px 12px; border-radius:6px; border:1px solid var(--SmartThemeBorderColor); width: 100%;">
                        <label style="font-size:12px; font-weight:bold;"><i class="fa-solid fa-box-archive" style="color:var(--SmartThemeQuoteColor);"></i> 自定义配方盒:</label>
                        <select id="wb-theme-preset-select" class="wb-input-dt" style="width: auto; padding: 2px 8px; min-width: 140px; height: 30px; box-sizing: border-box; font-size: 13px;">
                            <option value="">-- 选择已存配方 --</option>
                        </select>
                        <button id="wb-theme-preset-rename" class="menu_button interactable btn-primary wb-nowrap-btn" style="margin:0; padding:4px 8px; font-size:11px; border:none; display:none; height: 30px;" title="修改选中的配方名字"><i class="fa-solid fa-pen-to-square"></i> 重命名</button>
                        <button id="wb-theme-preset-del" class="menu_button interactable btn-danger wb-nowrap-btn" style="margin:0; padding:4px 8px; font-size:11px; border:none; display:none; height: 30px;" title="抛弃这个配色配方"><i class="fa-solid fa-trash-can"></i> 删除</button>
                        <div style="display:flex; align-items:center; gap:6px; border-left: 1px dashed var(--SmartThemeBorderColor); padding-left: 10px; margin-left: auto;">
                            <input type="text" id="wb-theme-preset-name" class="wb-input-dt" placeholder="新配色起个名字..." style="width:130px; padding:2px 8px; height: 30px; font-size:12px; box-sizing: border-box;">
                            <button id="wb-theme-preset-save" class="menu_button interactable btn-success wb-nowrap-btn" style="margin:0; padding:4px 8px; font-size:11px; border:none; height: 30px;" title="保存当前配色方案"><i class="fa-solid fa-bookmark"></i> 存进配方盒</button>
                        </div>
                    </div>
                </div>
                </div>
                <!-- 面板皮肤设置区 结束 -->

                <!-- 悬浮球外观设置区（内容由脚本动态放入） -->
                <div id="wb-config-float-section" style="display:none;">
                    <div id="wb-float-appearance-inner"></div>
                </div>
            </div>

            <div id="wb-tab-strip" class="wb-tab-strip">
                 <div id="tab-global-btn" class="wb-tab-btn active"><i class="fa-solid fa-earth-asia"></i> 全局库大厅</div>
                 <div id="tab-char-btn" class="wb-tab-btn"><i class="fa-solid fa-user-astronaut"></i> 当前聊天角色</div>
            </div>

            <div id="wb-main-view">
                <div style="display:flex; gap:8px; margin-bottom:10px;">
                     <input type="text" id="wb-search-input" class="text_pole" placeholder="🔍 检索世界书或绑定的角色..." style="flex:1; min-width:0; box-sizing: border-box; padding: 8px; font-size: 13.5px;">
                     <label style="cursor:pointer; display:flex; align-items:center; gap:6px; font-size:12.5px; margin:0; white-space:nowrap; background:rgba(125,125,125,0.1); padding:4px 10px; border-radius:6px; border:1px solid var(--SmartThemeBorderColor); flex-shrink:0;" title="勾选后，检索将会深入翻看所有世界书的条目正文与关键字（文字极多时可能会有稍微的算力延迟喔）">
                         <input type="checkbox" id="wb-deep-search-toggle" style="accent-color: var(--SmartThemeQuoteColor); transform: scale(1.1);">
                         <span style="font-weight: bold; color: var(--SmartThemeQuoteColor);">🔎 深度搜索正文</span>
                     </label>
                </div>

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
<label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; margin: 0; white-space: nowrap;">
    <input type="checkbox" id="wb-filter-locked" style="accent-color: #fcc419; transform: scale(1.1);">
    <span style="font-weight: bold;">🔒 仅显示已锁定</span>
</label>

                    </div>

                    <div class="wb-controls-group" id="wb-main-controls-group">
                        <div id="wb-main-ctrl-toggle" class="lulu-mobile-only-toggle">
                            <i class="fa-solid fa-chevron-down"></i> 展开更多操作
                        </div>
                        <button id="wb-btn-recycle" class="menu_button interactable wb-nowrap-btn" style="margin: 0; padding: 6px 12px; font-size: 12px; color:#fcc419; border-color:#fcc419; background:rgba(252,196,25,0.08);" title="查看最近删除的世界书，可以还原哦"><i class="fa-solid fa-trash-arrow-up"></i> 回收站</button>
                        <button id="wb-btn-transfer" class="menu_button interactable wb-nowrap-btn" style="margin: 0; padding: 6px 12px; font-size: 12px; color:#20c997; border-color:#20c997; background:rgba(32,201,151,0.08);" title="在两本世界书之间复制搬运条目"><i class="fa-solid fa-truck-ramp-box"></i> 搬运条目</button>                        
                        <button id="wb-btn-force-scan" class="menu_button interactable wb-nowrap-btn btn-primary" style="margin: 0; padding: 6px 12px; font-size: 12px;" title="在面板外部修改了其他没加载卡片的绑定状态？点这里重新翻一遍记忆哦！"><i class="fa-solid fa-rotate-right"></i> 深度重扫</button>
                        <button id="wb-btn-batch-toggle" class="menu_button interactable wb-nowrap-btn btn-warning" style="margin: 0; padding: 6px 12px; font-size: 12px;"><i class="fa-solid fa-layer-group"></i> 批量操作模式</button>
                        <button id="wb-btn-select-all" class="menu_button interactable wb-nowrap-btn btn-success" style="margin: 0; padding: 6px 12px; font-size: 12px;"><i class="fa-solid fa-check-double"></i> 全选当前项</button>
                        <button id="wb-btn-deselect-all" class="menu_button interactable wb-nowrap-btn btn-danger" style="margin: 0; padding: 6px 12px; font-size: 12px;"><i class="fa-regular fa-square"></i> 撤销当前全选</button>
                        <button id="wb-btn-create-wb" class="menu_button interactable btn-success wb-nowrap-btn" style="margin: 0; padding: 6px 12px; font-size: 12px; border:none;"><i class="fa-solid fa-plus"></i> 新建</button>
                        <button type="button" id="wb-btn-import-wb" class="menu_button interactable btn-success wb-nowrap-btn" style="margin: 0; padding: 6px 12px; font-size: 12px; border:none; background: rgba(32, 201, 151, 0.15) !important; color: #20c997 !important; border: 1px solid rgba(32, 201, 151, 0.5) !important;"><i class="fa-solid fa-file-import"></i> 批量导入</button>
                    </div>
                </div>

                <div class="wb-btn-group" id="wb-main-close-row">
                    <div class="wb-action-btn wb-nowrap-btn btn-primary" id="wb-btn-clear"><i class="fa-solid fa-power-off"></i> 关闭当前所有全局启用</div>
                </div>

                <div class="wb-btn-group" id="wb-main-ops-grid">
                    <div class="wb-action-btn wb-nowrap-btn btn-primary" id="wb-btn-save-snap"><i class="fa-solid fa-box-archive"></i> 将当前勾选存为快照 (全局)</div>
                    <div class="wb-action-btn wb-nowrap-btn btn-primary" id="wb-btn-create-detail-snap"><i class="fa-solid fa-puzzle-piece"></i> 创建复合快照 (全局)</div>
                </div>

                <div id="wb-batch-actions" style="display: none; background: rgba(0,0,0, 0.15); border: 1px dashed var(--SmartThemeQuoteColor); border-radius: 6px; padding: 10px; margin-bottom: 10px; flex-direction: column; gap: 10px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap: wrap; gap: 10px;">
                        <span style="color: var(--SmartThemeQuoteColor); font-weight: bold; font-size: 14px; margin-top: 4px;"><i class="fa-solid fa-check-double"></i> 选中的世界书 (<span id="wb-batch-count">0</span>)：</span>
                        <div style="display:flex; gap: 8px; flex-wrap: wrap;">
                             <button class="menu_button interactable btn-warning wb-nowrap-btn" id="wb-btn-batch-group" style="margin: 0; border: none; font-size: 13px; padding: 6px 14px; background: rgba(252, 196, 25, 0.15); color: #fcc419;"><i class="fa-solid fa-folder-tree"></i> 批量分组</button>
                             <button class="menu_button interactable btn-secondary wb-nowrap-btn" id="wb-btn-batch-ungroup" style="margin: 0; border: none; font-size: 13px; padding: 6px 14px;"><i class="fa-solid fa-folder-minus"></i> 批量移出分类</button>
                             <button class="menu_button interactable btn-primary wb-nowrap-btn" id="wb-btn-batch-export" style="margin: 0; border: none; font-size: 13px; padding: 6px 14px;"><i class="fa-solid fa-file-export"></i> 批量打包导出</button>
                             <button class="menu_button interactable btn-danger wb-nowrap-btn" id="wb-btn-confirm-delete" style="margin: 0; border: none; font-size: 13px; padding: 6px 14px;"><i class="fa-solid fa-burst"></i> 确认永久删除</button>
                             <button class="menu_button interactable btn-warning wb-nowrap-btn" id="wb-btn-batch-lock" style="margin: 0; border: none; font-size: 13px; padding: 6px 14px;"><i class="fa-solid fa-lock"></i> 批量锁定</button>
                             <button class="menu_button interactable btn-info wb-nowrap-btn" id="wb-btn-batch-skip" style="margin: 0; border: none; font-size: 13px; padding: 6px 14px;"><i class="fa-solid fa-eye-slash"></i> 批量跳过对照</button>
                        </div>

                    </div>
                    <div id="wb-batch-selected-list" style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 80px; overflow-y: auto;"></div>
                </div>

                <div class="wb-list-grid scrollableInnerFull" id="wb-container"></div>

                <h3 style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                    <span>📸 库预设组合快照列表</span>
                    <button id="wb-btn-snap-batch-del" class="menu_button interactable btn-danger wb-nowrap-btn" style="margin:0; padding:4px 12px; font-size:12px; border:none; font-weight:normal;"><i class="fa-solid fa-trash-can"></i> 批量删除</button>
                </h3>
                <div class="wb-snapshot-list scrollableInnerFull" id="wb-snapshot-container"></div>
            </div>

            <div id="wb-char-view" style="display: none; flex-direction: column; height: 100%;">
                <div class="wb-btn-group" style="margin-top: 0;">
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-open-assoc" style="color: #c92a2a; border-color: #c92a2a; background: rgba(201,42,42,0.05);"><i class="fa-solid fa-id-card-clip"></i> 管理绑定世界书</div>
                    <div class="wb-action-btn wb-nowrap-btn btn-primary" id="wb-btn-save-char-snap"><i class="fa-solid fa-camera-retro"></i> 保存当前配置为专属组合</div>
                    <div class="wb-action-btn wb-nowrap-btn btn-warning" id="wb-btn-rescue-embedded"><i class="fa-solid fa-stethoscope"></i> 卡内世界书体检/救援</div>
                    <div class="wb-action-btn wb-nowrap-btn btn-info" id="wb-btn-batch-scan-pollution"><i class="fa-solid fa-clock-rotate-left"></i> 卡内原版 · 全库对照</div>
                </div>

                <h3>📚 当前聊天角色绑定的世界书</h3>
                <div style="font-size: 12px; color: gray; margin-bottom: 10px; margin-top: -6px;">* 点击对应卡片即可单独设置角色专用的开关状态逻辑哦，与全局互不干扰哒。</div>
                <div id="wb-char-books-container" class="wb-list-grid scrollableInnerFull" style="margin-bottom: 15px; max-height: 25vh;"></div>

                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                     <h3 style="margin:0;">📸 当前聊天角色场景快照</h3>
                     <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        <button id="wb-btn-char-snap-batch-del" class="menu_button interactable btn-danger wb-nowrap-btn" style="margin:0; padding:4px 12px; font-size:12px; border:none; font-weight:normal;"><i class="fa-solid fa-trash-can"></i> 批量删除</button>
                     </div>
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
                            <input type="text" id="wb-assoc-char-add-search" class="text_pole" placeholder="🔍 检索想绑定的世界书，可多选..." style="max-width:320px; box-sizing: border-box; padding: 8px;">
<div id="wb-assoc-char-add-list" style="max-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; margin: 8px 0; padding: 6px; background: var(--SmartThemeBotMesColor); border: 1px solid var(--SmartThemeBorderColor); border-radius: 6px;"></div>
<button id="wb-assoc-char-add-btn" class="menu_button interactable btn-primary wb-nowrap-btn" style="margin:0; padding:8px 12px; border:none; font-size:13px;"><i class="fa-solid fa-plus"></i> 批量绑定给当前角色</button>
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
                                    <option value="enabled_first">🟢 启用优先</option>
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

            <!-- 条目分栏界面 -->
            <div id="wb-entry-view" style="display: none; height: 100%; flex-direction: column;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: var(--SmartThemeQuoteColor); display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
                    <span style="display:flex; align-items:flex-start; flex:1; min-width:0;">
                        <i class="fa-solid fa-sliders" style="margin-right:6px; margin-top:4px;"></i>
                        <span style="display:flex; flex-direction:column; line-height:1.3;">
                            <span style="font-size:12px; color:gray; font-weight:normal;">编辑内容：</span>
                            <span id="wb-entry-title" style="word-break:break-all; white-space:normal;"></span>
                        </span>
                    </span>

                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        <!-- ✨ 分组视图切换开关 -->
                        <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 12px; margin: 0; font-weight: normal; background: rgba(125,125,125,0.1); padding: 6px 10px; border-radius: 6px; border: 1px solid var(--SmartThemeBorderColor); flex-shrink: 0;">
                            <input type="checkbox" id="wb-toggle-entry-group" style="accent-color: #51cf66; transform:scale(1.1);">
                            <span style="color:var(--SmartThemeBodyColor); font-weight:bold;">🗂️ 启用分组</span>
                        </label>
                        <!-- ✨ 按前缀分组（把带【】前缀的条目一键归入分组） -->
                        <button id="wb-btn-prefix-group" class="menu_button interactable wb-nowrap-btn btn-primary" style="margin: 0; padding: 6px 10px; font-size: 12px; border-radius: 6px; flex-shrink: 0; font-weight: bold;" title="扫描带【】前缀的条目，一键按前缀归入分组（会参考对照表，不会乱分）"><i class="fa-solid fa-wand-magic-sparkles"></i> 🗂️ 按前缀分组</button>
                        <!-- 📖 预览开关就在这里哦 -->
                        <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 12px; margin: 0; font-weight: normal; background: rgba(125,125,125,0.1); padding: 6px 10px; border-radius: 6px; border: 1px solid var(--SmartThemeBorderColor); flex-shrink: 0;">
                            <input type="checkbox" id="wb-toggle-entry-preview" style="accent-color: var(--SmartThemeQuoteColor); transform:scale(1.1);">
                            <span style="color:var(--SmartThemeBodyColor); font-weight:bold;">📖 内容预览</span>
                        </label>
<!-- ✨ 新增：独占编辑开关 -->
                        <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 12px; margin: 0; font-weight: normal; background: rgba(125,125,125,0.1); padding: 6px 10px; border-radius: 6px; border: 1px solid var(--SmartThemeBorderColor); flex-shrink: 0;">
                            <input type="checkbox" id="wb-toggle-entry-fullscreen" style="accent-color: #339af0; transform:scale(1.1);">
                            <span style="color:var(--SmartThemeBodyColor); font-weight:bold;">📱 全屏编辑</span>
                        </label>
                    </div>
                </div>

                <div id="wb-entry-split-wrapper">
                    <div id="wb-entry-list-side">
                        <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                            <input type="text" id="wb-entry-search" class="text_pole" placeholder="🔍 检索条目标题或触发关键字..." style="width: 100%; box-sizing: border-box; padding: 8px;">
                            <select id="wb-entry-sort" class="wb-input-dt" style="width: 160px; padding: 8px;">
                                <option value="default">↕ 默认</option>
                                <option value="enabled_first">🟢 启用优先</option>
                                <option value="order_asc">🔢 顺序 (小到大)</option>
                                <option value="order_desc">🔢 顺序 (大到小)</option>
                                <option value="depth_asc">🌊 深度 (小到大)</option>
                                <option value="depth_desc">🌊 深度 (大到小)</option>
                                <option value="az">🔤 名称 (A-Z)</option>
                                <option value="za">🔡 名称 (Z-A)</option>
                            </select>
                        </div>
                        <div class="wb-btn-group" id="wb-entry-btn-group" style="margin: 0 0 10px 0; flex-shrink: 0;">
                            <!-- 折叠触发条（class控制：仅手机端CSS显示） -->
                            <div id="wb-entry-btn-toggle" class="lulu-mobile-only-toggle">
                                <i class="fa-solid fa-chevron-down"></i> 展开操作按钮
                            </div>
                            <div class="wb-action-btn wb-nowrap-btn wb-entry-foldable" id="wb-btn-entry-all" style="padding: 6px;"><i class="fa-solid fa-check-double"></i> 启用全部</div>
                            <div class="wb-action-btn wb-nowrap-btn wb-entry-foldable" id="wb-btn-entry-none" style="padding: 6px;"><i class="fa-regular fa-square"></i> 关闭全部</div>
                            <div class="wb-action-btn wb-nowrap-btn btn-success wb-entry-foldable" id="wb-btn-entry-add" style="padding: 6px; border:none;"><i class="fa-solid fa-plus"></i> 新建条目</div>
                            <div class="wb-action-btn wb-nowrap-btn btn-danger wb-entry-foldable" id="wb-btn-entry-batch" style="padding: 6px; border:none;"><i class="fa-solid fa-layer-group"></i> 批量操作</div>
                            <div class="wb-action-btn wb-nowrap-btn wb-entry-foldable" id="wb-btn-entry-replace" style="padding: 6px; color:#339af0; border-color:#339af0; background:rgba(51,154,240,0.1);"><i class="fa-solid fa-magnifying-glass-arrow-right"></i> 查找替换</div>
                            <div class="wb-action-btn wb-nowrap-btn btn-primary wb-entry-foldable" id="wb-btn-entry-snapshot" style="padding: 6px;"><i class="fa-solid fa-camera-retro"></i> 存为快照</div>
                            <div class="wb-action-btn wb-nowrap-btn btn-primary wb-entry-foldable" id="wb-btn-entry-apply-snap" style="padding: 6px;"><i class="fa-solid fa-clapperboard"></i> 应用快照</div>
                        </div>
                        <div id="wb-entry-batch-actions" style="display: none; background: rgba(255, 107, 107, 0.08); border: 1px dashed #ff6b6b; border-radius: 6px; padding: 10px; margin-bottom: 10px; flex-direction: column; gap: 8px; flex-shrink: 0;">
                            <!-- 第一排：标题与全选/取消 -->
                            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px dashed rgba(255,107,107,0.3); padding-bottom: 8px;">
                                <span style="color: #ff6b6b; font-weight: bold; font-size: 14px; white-space: nowrap;"><i class="fa-solid fa-triangle-exclamation"></i> 选中 (<span id="wb-entry-batch-count">0</span>)</span>
                                <div style="display:flex; gap: 6px;">
                                     <button class="menu_button interactable wb-nowrap-btn btn-primary" id="wb-btn-entry-batch-select-all" style="margin: 0; padding: 4px 10px; font-size: 12px;"><i class="fa-solid fa-check-double"></i> 全页勾选</button>
                                     <button class="menu_button interactable wb-nowrap-btn btn-secondary" id="wb-btn-entry-batch-deselect-all" style="margin: 0; padding: 4px 10px; font-size: 12px;"><i class="fa-regular fa-square"></i> 全页撤销</button>
                                </div>
                            </div>
                            <!-- 第二排：强迫症专享网格按钮区 -->
                            <div class="lulu-batch-grid">
                                 <button class="menu_button interactable btn-success wb-nowrap-btn" id="wb-btn-entry-batch-enable"><i class="fa-solid fa-toggle-on"></i> 批量启用</button>
                                 <button class="menu_button interactable btn-secondary wb-nowrap-btn" id="wb-btn-entry-batch-disable"><i class="fa-solid fa-toggle-off"></i> 批量关闭</button>
                                 <button class="menu_button interactable btn-warning wb-nowrap-btn" id="wb-btn-entry-batch-group"><i class="fa-solid fa-folder-tree"></i> 批量改组</button>
                                 <button class="menu_button interactable btn-warning wb-nowrap-btn" id="wb-btn-entry-batch-prefix"><i class="fa-solid fa-tags"></i> 批量前缀</button>
                                 <button class="menu_button interactable btn-primary wb-nowrap-btn" id="wb-btn-entry-batch-recursion"><i class="fa-solid fa-shield-halved"></i> 防止递归</button>
                                 <button class="menu_button interactable btn-primary wb-nowrap-btn" id="wb-btn-entry-batch-strategy"><i class="fa-solid fa-lightbulb"></i> 批量灯色</button>
                                 <button class="menu_button interactable btn-info wb-nowrap-btn" id="wb-btn-entry-batch-position"><i class="fa-solid fa-location-dot"></i> 批量位移</button>
                                 <button class="menu_button interactable btn-danger wb-nowrap-btn" id="wb-btn-entry-confirm-delete"><i class="fa-solid fa-burst"></i> 暂存移除所选项</button>
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
                            <div id="wb-det-ui-compress" style="display: flex; flex-wrap: wrap; gap: 8px; background: rgba(0,0,0,0.1); border-radius: 6px; padding: 10px; border: 1px solid var(--SmartThemeBorderColor); margin-bottom: 10px; flex-shrink: 0; align-items: flex-end;">
                                <div class="wb-form-group" style="flex: 1; min-width: 120px; margin-bottom: 0;">
                                    <label style="font-size: 12px; font-weight: bold; margin-bottom: 4px; color: var(--SmartThemeQuoteColor);">📖 条目名称</label>
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
                                    <label style="font-size: 12px; font-weight: bold; margin-bottom: 4px; color: var(--SmartThemeQuoteColor);">🔑 触发关键字</label>
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

                                <div class="wb-re-checks" style="min-width: 120px;">
                                    <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 11px; margin: 0; white-space: nowrap;">
                                        <input type="checkbox" id="wb-det-exclude-recursion" style="accent-color: var(--SmartThemeQuoteColor);">
                                        <span><strong style="color: var(--SmartThemeBodyColor);">不可递归</strong></span>
                                    </label>
                                    <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 11px; margin: 0; white-space: nowrap;">
                                        <input type="checkbox" id="wb-det-prevent-recursion" style="accent-color: var(--SmartThemeQuoteColor);">
                                        <span><strong style="color: var(--SmartThemeBodyColor);">防止进一步递归</strong></span>
                                    </label>
                                </div>
                                <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 11px; margin: 0; white-space: nowrap; background: rgba(125,125,125,0.1); padding: 4px 8px; border-radius: 5px; border: 1px solid var(--SmartThemeBorderColor);">
                                    <input type="checkbox" id="wb-det-advanced-toggle" style="accent-color: var(--SmartThemeQuoteColor);">
                                    <span><strong style="color: var(--SmartThemeBodyColor);">详细参数</strong></span>
                                </label>
                                <div id="wb-det-advanced-panel" style="display:none; flex-wrap: wrap; gap: 8px; align-items: flex-end;">
                                    <div class="wb-form-group" style="min-width: 130px; flex: 1; margin-bottom: 0;">
                                        <label style="font-size: 12px; font-weight: bold; margin-bottom: 4px; color: var(--SmartThemeQuoteColor);">🆔 UID</label>
                                        <div style="display:flex; gap:4px; align-items:center;">
                                            <input type="text" id="wb-det-uid" class="wb-input-dt" readonly style="flex:1; min-width:0; cursor:default; background:rgba(125,125,125,0.1) !important;" title="这是条目的唯一ID，只读">
                                            <button id="wb-det-uid-copy" class="menu_button interactable btn-primary" style="margin:0; padding:0 10px; height:26px; min-width:unset; border-radius:4px; flex-shrink:0;" title="一键复制UID"><i class="fa-solid fa-copy"></i></button>
                                        </div>
                                    </div>
                                    <div class="wb-form-group" style="width: 70px; margin-bottom: 0;">
                                        <label style="font-size: 12px; font-weight: bold; margin-bottom: 4px; color: var(--SmartThemeQuoteColor);">🎲 概率%</label>
                                        <input type="number" id="wb-det-probability" class="wb-input-dt" min="0" max="100" placeholder="100">
                                    </div>
                                    <div class="wb-form-group" style="width: 60px; margin-bottom: 0;">
                                        <label style="font-size: 12px; font-weight: bold; margin-bottom: 4px; color: var(--SmartThemeQuoteColor);">🧲 黏性</label>
                                        <input type="number" id="wb-det-sticky" class="wb-input-dt" min="0" placeholder="0">
                                    </div>
                                    <div class="wb-form-group" style="width: 60px; margin-bottom: 0;">
                                        <label style="font-size: 12px; font-weight: bold; margin-bottom: 4px; color: var(--SmartThemeQuoteColor);">❄️ 冷却</label>
                                        <input type="number" id="wb-det-cooldown" class="wb-input-dt" min="0" placeholder="0">
                                    </div>
                                    <div class="wb-form-group" style="width: 60px; margin-bottom: 0;">
                                        <label style="font-size: 12px; font-weight: bold; margin-bottom: 4px; color: var(--SmartThemeQuoteColor);">⏳ 延迟</label>
                                        <input type="number" id="wb-det-delay" class="wb-input-dt" min="0" placeholder="0">
                                    </div>
                                </div>
                            </div>
                            <div class="wb-form-group" style="flex: 1; display: flex; flex-direction: column; margin-bottom: 0;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px;">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <label style="font-size: 13px; font-weight: bold; margin-bottom: 0; color: var(--SmartThemeQuoteColor);">📜 正文内容</label>
                                        <!-- ✨新增：调节字体大小的两个按钮 -->
                                        <div style="display: flex; gap: 4px;">
                                            <button id="wb-font-dec" class="menu_button interactable btn-primary" style="margin:0; padding:2px 8px; font-size:12px; border-radius:4px; min-width:unset; line-height:1;" title="缩小字体">A-</button>
                                            <button id="wb-font-inc" class="menu_button interactable btn-primary" style="margin:0; padding:2px 8px; font-size:12px; border-radius:4px; min-width:unset; line-height:1;" title="放大字体">A+</button>
                                        </div>
                                    </div>
                                    <span id="wb-det-token-count" style="font-size: 11px; color: gray; background: rgba(125,125,125,0.15); padding: 2px 6px; border-radius: 4px;">0 Tokens</span>
                                </div>
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

            <!-- ========== 【功能4：条目搬运工作台】界面 ========== -->
            <div id="wb-transfer-view" style="display: none; height: 100%; flex-direction: column;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: var(--SmartThemeQuoteColor); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <span><i class="fa-solid fa-truck-ramp-box"></i> 条目搬运工作台</span>
                </div>

                <div id="wb-transfer-split" style="display:flex; gap:10px; flex:1; min-height:45vh; max-height:60vh; overflow:hidden;">
                    <!-- 左栏 A -->
                    <div class="wb-transfer-side" data-side="A" style="flex:1; display:flex; flex-direction:column; min-width:0; border:1px solid var(--SmartThemeBorderColor); border-radius:6px; padding:8px; background:var(--SmartThemeBotMesColor); overflow:visible;">
                        <div class="wb-transfer-selbox" data-side="A" style="position:relative; margin-bottom:6px; flex-shrink:0;">
                            <input type="text" class="text_pole wb-transfer-wbsearch" data-side="A" placeholder="🔍 点此搜索并选择世界书..." style="width:100%; box-sizing:border-box; padding:6px; cursor:pointer;">
                            <div class="wb-transfer-wbdrop" data-side="A" style="display:none; z-index:2147483647; max-height:240px; overflow-y:auto; background:var(--lulu-input-bg, var(--SmartThemeBotMesColor)); border:1px solid var(--SmartThemeQuoteColor); border-radius:6px; margin-top:2px; box-shadow:0 4px 12px rgba(0,0,0,0.3);"></div>
                        </div>
                        <input type="text" class="text_pole wb-transfer-search" data-side="A" placeholder="🔍 搜索条目..." style="width:100%; box-sizing:border-box; padding:6px; margin-bottom:6px; flex-shrink:0;">
                        <div style="display:flex; gap:6px; margin-bottom:6px; flex-shrink:0;">
                            <button class="menu_button interactable wb-nowrap-btn wb-transfer-selall" data-side="A" style="margin:0; padding:4px 8px; font-size:11px; flex:1;"><i class="fa-solid fa-check-double"></i> 全选</button>
                            <button class="menu_button interactable wb-nowrap-btn wb-transfer-deselall" data-side="A" style="margin:0; padding:4px 8px; font-size:11px; flex:1;"><i class="fa-regular fa-square"></i> 取消</button>
                        </div>
                        <div class="wb-transfer-list scrollableInnerFull" data-side="A" style="flex:1; overflow-y:auto; overflow-x:hidden; display:flex; flex-direction:column; gap:4px;"></div>
                    </div>

                    <!-- 中间搬运按钮 -->
                    <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; gap:14px; flex-shrink:0; padding:0 2px;">
                        <div id="wb-transfer-a2b" title="把左边选中的条目复制到右边" style="width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; background:rgba(81,207,102,0.12); border:2px solid #51cf66; color:#51cf66; font-size:16px; transition:0.2s; box-shadow:0 2px 6px rgba(0,0,0,0.15);">
                            <i class="fa-solid fa-angles-right"></i>
                        </div>
                        <div id="wb-transfer-b2a" title="把右边选中的条目复制到左边" style="width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; background:rgba(81,207,102,0.12); border:2px solid #51cf66; color:#51cf66; font-size:16px; transition:0.2s; box-shadow:0 2px 6px rgba(0,0,0,0.15);">
                            <i class="fa-solid fa-angles-left"></i>
                        </div>
                    </div>

                    <!-- 右栏 B -->
                    <div class="wb-transfer-side" data-side="B" style="flex:1; display:flex; flex-direction:column; min-width:0; border:1px solid var(--SmartThemeBorderColor); border-radius:6px; padding:8px; background:var(--SmartThemeBotMesColor); overflow:visible;">
                                                <div class="wb-transfer-selbox" data-side="B" style="position:relative; margin-bottom:6px; flex-shrink:0;">
                            <input type="text" class="text_pole wb-transfer-wbsearch" data-side="B" placeholder="🔍 点此搜索并选择世界书..." style="width:100%; box-sizing:border-box; padding:6px; cursor:pointer;">
                            <div class="wb-transfer-wbdrop" data-side="B" style="display:none; z-index:2147483647; max-height:240px; overflow-y:auto; background:var(--lulu-input-bg, var(--SmartThemeBotMesColor)); border:1px solid var(--SmartThemeQuoteColor); border-radius:6px; margin-top:2px; box-shadow:0 4px 12px rgba(0,0,0,0.3);"></div>
                        </div>
                        <input type="text" class="text_pole wb-transfer-search" data-side="B" placeholder="🔍 搜索条目..." style="width:100%; box-sizing:border-box; padding:6px; margin-bottom:6px; flex-shrink:0;">
                        <div style="display:flex; gap:6px; margin-bottom:6px; flex-shrink:0;">
                            <button class="menu_button interactable wb-nowrap-btn wb-transfer-selall" data-side="B" style="margin:0; padding:4px 8px; font-size:11px; flex:1;"><i class="fa-solid fa-check-double"></i> 全选</button>
                            <button class="menu_button interactable wb-nowrap-btn wb-transfer-deselall" data-side="B" style="margin:0; padding:4px 8px; font-size:11px; flex:1;"><i class="fa-regular fa-square"></i> 取消</button>
                        </div>
                        <div class="wb-transfer-list scrollableInnerFull" data-side="B" style="flex:1; overflow-y:auto; overflow-x:hidden; display:flex; flex-direction:column; gap:4px;"></div>
                    </div>
                </div>

                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-top:10px; padding:8px; background:rgba(0,0,0,0.1); border-radius:6px;">
                    <label style="cursor:pointer; display:flex; align-items:center; gap:6px; font-size:13px; margin:0;">
                        <input type="checkbox" id="wb-transfer-jump" style="accent-color:var(--SmartThemeQuoteColor);">
                        <span style="font-weight:bold;">复制完成后，跳转到目标世界书编辑页</span>
                    </label>
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-transfer-back" style="color:#888; flex:unset; min-width:120px;"><i class="fa-solid fa-arrow-left"></i> 返回</div>
                </div>
            </div>
            <!-- ========== 搬运工作台界面 结束 ========== -->

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

    let inputBgCss = "";
    let accentCss = "";

    if (mode === "dark") {
      inputBgCss = `--lulu-input-bg: rgba(35, 38, 43, 1);`;
      accentCss = `--SmartThemeQuoteColor: #d1c5a1 !important;`;
      overrideCSS = `dialog.wb-manager-dialog { background: rgba(22, 24, 28, 1) !important; border: 1px solid #d1c5a1 !important; } dialog.wb-manager-dialog, #wb-manager-panel { --SmartThemeBlurTintColor: rgba(22, 24, 28, 1) !important; --SmartThemeBotMesColor: rgba(32, 35, 40, 1) !important; --SmartThemeBodyColor: #c0c2c8 !important; ${accentCss} --SmartThemeBorderColor: #3d414d !important; color: #c0c2c8 !important; }`;
    } else if (mode === "light") {
      inputBgCss = `--lulu-input-bg: rgba(255, 255, 255, 0.7);`;
      accentCss = `--SmartThemeQuoteColor: #8b5d33 !important;`;
      overrideCSS = `dialog.wb-manager-dialog { background: rgba(253, 246, 227, 1) !important; border: 1px solid #8b5d33 !important; } dialog.wb-manager-dialog, #wb-manager-panel { --SmartThemeBlurTintColor: rgba(253, 246, 227, 1) !important; --SmartThemeBotMesColor: rgba(255, 251, 240, 1) !important; --SmartThemeBodyColor: #4a3b32 !important; ${accentCss} --SmartThemeBorderColor: #e0d0b8 !important; color: #4a3b32 !important; } dialog.wb-manager-dialog *, #wb-manager-panel * { text-shadow: none !important; }`;
    } else if (mode === "custom") {
      inputBgCss = `--lulu-input-bg: ${customConfig.inputBg || customConfig.bg};`;
      accentCss = `--SmartThemeQuoteColor: ${customConfig.accent || "#70a1ff"} !important;`;
      const bgRgba = hexToRgba(customConfig.bg, customConfig.alpha);
      overrideCSS = `dialog.wb-manager-dialog { background: ${bgRgba} !important; border: 1px solid var(--SmartThemeQuoteColor) !important; } dialog.wb-manager-dialog, #wb-manager-panel { --SmartThemeBlurTintColor: ${bgRgba} !important; --SmartThemeBotMesColor: ${customConfig.bg} !important; --SmartThemeBodyColor: ${customConfig.text} !important; ${accentCss} color: ${customConfig.text} !important; }`;

      $ui
        .find("#wb-theme-custom-opts, #wb-theme-presets-area")
        .css("display", "flex");
    } else {
      inputBgCss = `--lulu-input-bg: var(--SmartThemeBotMesColor);`;
      accentCss = "";
    }

    if (mode !== "custom") {
      $ui.find("#wb-theme-custom-opts, #wb-theme-presets-area").hide();
    }

    overrideCSS += `
        dialog.wb-manager-dialog { ${inputBgCss} }

        /* 1. 基础状态：加入对 textarea 的颜色绑定 */
        dialog.wb-manager-dialog input[type="text"],
        dialog.wb-manager-dialog input[type="number"],
        dialog.wb-manager-dialog select,
        dialog.wb-manager-dialog textarea {
            background: var(--lulu-input-bg) !important;
            color: var(--SmartThemeBodyColor) !important;
            border: 1px solid var(--SmartThemeBorderColor) !important;
            transition: border-color 0.15s ease-in-out !important;
        }

        /* 2. 聚焦编辑状态 */
        dialog.wb-manager-dialog input[type="text"]:focus,
        dialog.wb-manager-dialog input[type="number"]:focus,
        dialog.wb-manager-dialog select:focus,
        dialog.wb-manager-dialog textarea:focus {
            background: var(--lulu-input-bg) !important;
            color: var(--SmartThemeBodyColor) !important;
            border: 1px solid var(--SmartThemeQuoteColor) !important;
            outline: none !important;
        }

        dialog.wb-manager-dialog input::placeholder,
        dialog.wb-manager-dialog textarea::placeholder { color: gray !important; }
        dialog.wb-manager-dialog input[type="checkbox"] {
            appearance: none !important;
            -webkit-appearance: none !important;
            width: 17px !important;
            height: 17px !important;
            border: 2px solid var(--SmartThemeQuoteColor) !important;
            border-radius: 4px !important;
            background: transparent !important;
            cursor: pointer !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            vertical-align: middle !important;
            transition: all 0.15s ease-in-out !important;
            flex-shrink: 0 !important;
            margin: 0 !important;
        }

        /* 未选中时悬浮，边框稍微发光提示 */
        dialog.wb-manager-dialog input[type="checkbox"]:hover {
            border-color: var(--SmartThemeQuoteColor) !important;
        }

        /* 选中状态：背景变成强调色，边框也变成强调色 */
        dialog.wb-manager-dialog input[type="checkbox"]:checked {
            background: var(--SmartThemeQuoteColor) !important;
            border-color: var(--SmartThemeQuoteColor) !important;
        }

        /* 自定义勾号 */
        dialog.wb-manager-dialog input[type="checkbox"]:checked::after {
            content: "✓" !important;
            color: var(--SmartThemeBotMesColor) !important;
            font-size: 13px !important;
            font-weight: 900 !important;
            line-height: 1 !important;
        }

        /* 批量操作模式下的复选框特化：醒目的红底白勾 */
        dialog.wb-manager-dialog input[type="checkbox"].wb-batch-chk:checked {
            background: #ff6b6b !important;
            border-color: #ff6b6b !important;
        }
        dialog.wb-manager-dialog select option {
            background-color: var(--lulu-input-bg) !important;
            color: var(--SmartThemeBodyColor) !important;
        }
        dialog.wb-manager-dialog input[type="checkbox"].wb-batch-chk:checked::after {
            color: #ffffff !important;
        }

        .wb-global-active {
            border: 1px solid var(--SmartThemeQuoteColor) !important;
            border-left: 4px solid var(--SmartThemeQuoteColor) !important;
            background: var(--SmartThemeBlurTintColor) !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
        }
        .wb-global-active .wb-name-text { font-weight: bold; }

        dialog.wb-manager-dialog .btn-primary {
            color: var(--SmartThemeQuoteColor) !important;
            border-color: var(--SmartThemeQuoteColor) !important;
            background: rgba(125, 125, 125, 0.08) !important;
        }
        dialog.wb-manager-dialog .btn-primary:hover {
            background: var(--SmartThemeQuoteColor) !important;
            color: var(--SmartThemeBotMesColor) !important;
        }

        /* 底部“关闭面板”按钮统一跟随主题 */
        dialog.wb-manager-dialog .popup-controls .menu_button,
        dialog.wb-manager-dialog .popup-button-ok {
            background: var(--SmartThemeBotMesColor) !important;
            color: var(--SmartThemeBodyColor) !important;
            border: 1px solid var(--SmartThemeQuoteColor) !important;
        }
        dialog.wb-manager-dialog .popup-controls .menu_button:hover,
        dialog.wb-manager-dialog .popup-button-ok:hover {
            background: var(--SmartThemeQuoteColor) !important;
            color: var(--SmartThemeBotMesColor) !important;
        }
    `;

    if (overrideCSS)
      $ui.append(
        `<style id="lulu-theme-override-style">${overrideCSS}</style>`,
      );
  };

  const getSavedUserThemes = () => {
    try {
      return JSON.parse(localStorage.getItem("lulu_wb_user_themes") || "{}");
    } catch (e) {
      return {};
    }
  };
  const saveUserThemes = (themes) => {
    localStorage.setItem("lulu_wb_user_themes", JSON.stringify(themes));
  };

  const renderPresetSelect = () => {
    const themes = getSavedUserThemes();
    const $select = $ui.find("#wb-theme-preset-select").empty();
    $select.append('<option value="">-- 选择已存配方 --</option>');
    Object.keys(themes).forEach((name) => {
      $select.append($("<option>", { value: name, text: name }));
    });
    $ui.find("#wb-theme-preset-del, #wb-theme-preset-rename").hide();
  };

  const loadThemeSettings = () => {
    const savedMode = localStorage.getItem("lulu_wb_panel_theme") || "default";
    const savedCustom = JSON.parse(
      localStorage.getItem("lulu_wb_panel_custom_colors") ||
        '{"bg":"#2a2e33", "text":"#ffffff", "accent":"#70a1ff", "alpha":95, "inputBg":"#1a1c1f"}',
    );
    $ui.find("#wb-theme-select").val(savedMode);
    $ui.find("#wb-theme-cp-bg").val(savedCustom.bg);
    $ui.find("#wb-theme-cp-text").val(savedCustom.text);
    $ui.find("#wb-theme-cp-accent").val(savedCustom.accent || "#70a1ff");
    $ui
      .find("#wb-theme-cp-input-bg")
      .val(savedCustom.inputBg || savedCustom.bg);
    $ui.find("#wb-theme-cp-alpha").val(savedCustom.alpha);
    $ui.find("#wb-theme-cp-alpha-val").text(savedCustom.alpha + "%");

    applyTheme(savedMode, savedCustom);
    renderPresetSelect();
    $ui
      .find("#wb-toggle-floating")
      .prop(
        "checked",
        localStorage.getItem("lulu_wb_floating_enabled") === "true",
      );
    $ui
      .find("#wb-toggle-native-magic")
      .prop(
        "checked",
        localStorage.getItem("lulu_wb_native_magic_enabled") !== "false",
      );
  };

  const updateThemeAndSave = () => {
    const mode = $ui.find("#wb-theme-select").val(),
      cBg = $ui.find("#wb-theme-cp-bg").val(),
      cText = $ui.find("#wb-theme-cp-text").val(),
      cAccent = $ui.find("#wb-theme-cp-accent").val(),
      cInputBg = $ui.find("#wb-theme-cp-input-bg").val(),
      cAlpha = parseInt($ui.find("#wb-theme-cp-alpha").val());
    $ui.find("#wb-theme-cp-alpha-val").text(cAlpha + "%");
    const cConf = {
      bg: cBg,
      text: cText,
      accent: cAccent,
      alpha: cAlpha,
      inputBg: cInputBg,
    };
    localStorage.setItem("lulu_wb_panel_theme", mode);
    localStorage.setItem("lulu_wb_panel_custom_colors", JSON.stringify(cConf));
    applyTheme(mode, cConf);
  };

  $ui
    .find(
      "#wb-theme-select, #wb-theme-cp-bg, #wb-theme-cp-text, #wb-theme-cp-accent, #wb-theme-cp-input-bg, #wb-theme-cp-alpha",
    )
    .on("input change", updateThemeAndSave);

  const hslToHex = (h, s, l) => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const curatedContrasts = [
    {
      bg: "#101622",
      text: "#e2e8f0",
      accent: "#fcc419",
      inputBg: "#172030",
      isDark: true,
      name: "深蓝金曜",
    },
    {
      bg: "#151b18",
      text: "#e8ede9",
      accent: "#ff6b6b",
      inputBg: "#1d2521",
      isDark: true,
      name: "抹茶绯红",
    },
    {
      bg: "#19141f",
      text: "#f1edf5",
      accent: "#a9e34b",
      inputBg: "#221c2a",
      isDark: true,
      name: "暗夜香橼",
    },
    {
      bg: "#151a1a",
      text: "#eef6f6",
      accent: "#ffa94d",
      inputBg: "#1d2424",
      isDark: true,
      name: "冷炭珊瑚",
    },
    {
      bg: "#1c1613",
      text: "#fcf5f2",
      accent: "#20c997",
      inputBg: "#261f1a",
      isDark: true,
      name: "沉香薄荷",
    },
    {
      bg: "#121a1d",
      text: "#edf4f6",
      accent: "#ff922b",
      inputBg: "#192429",
      isDark: true,
      name: "深海暖阳",
    },
    {
      bg: "#1a1012",
      text: "#fcf0f2",
      accent: "#3bc9db",
      inputBg: "#24171a",
      isDark: true,
      name: "绛红冰川",
    },
    {
      bg: "#25121b",
      text: "#fbf2f6",
      accent: "#ffc078",
      inputBg: "#331a26",
      isDark: true,
      name: "浆果奶酪",
    },
    {
      bg: "#121c25",
      text: "#eef5fc",
      accent: "#ff8787",
      inputBg: "#1b2835",
      isDark: true,
      name: "极夜晚霞",
    },

    {
      bg: "#fcf8f2",
      text: "#2c1c0c",
      accent: "#4c6ef5",
      inputBg: "#ffffff",
      isDark: false,
      name: "暖沙群青",
    },
    {
      bg: "#f0fdf4",
      text: "#143019",
      accent: "#fa5252",
      inputBg: "#ffffff",
      isDark: false,
      name: "竹青竹红",
    },
    {
      bg: "#fcf5f7",
      text: "#30141c",
      accent: "#0ca678",
      inputBg: "#ffffff",
      isDark: false,
      name: "晚樱黛绿",
    },
    {
      bg: "#f1f3f5",
      text: "#1a202c",
      accent: "#fd7e14",
      inputBg: "#ffffff",
      isDark: false,
      name: "冷灰暖橘",
    },
    {
      bg: "#f5f0fa",
      text: "#2d1b4e",
      accent: "#fab005",
      inputBg: "#ffffff",
      isDark: false,
      name: "香芋奶黄",
    },
    {
      bg: "#edfcf9",
      text: "#0c3029",
      accent: "#e8590c",
      inputBg: "#ffffff",
      isDark: false,
      name: "松石暖柿",
    },
  ];

  $ui
    .find("#wb-theme-random-btn")
    .off("click")
    .on("click", () => {
      const rollMode = $ui.find("#wb-theme-random-mode").val() || "random";

      let isDark = true;
      if (rollMode === "dark") isDark = true;
      else if (rollMode === "light") isDark = false;
      else isDark = Math.random() > 0.45;

      const useCurated = Math.random() > 0.45;

      let bg, text, inputBg, accent;

      if (useCurated) {
        const matchingCurated = curatedContrasts.filter(
          (p) => p.isDark === isDark,
        );
        const chosen =
          matchingCurated[Math.floor(Math.random() * matchingCurated.length)];
        bg = chosen.bg;
        text = chosen.text;
        accent = chosen.accent;
        inputBg = chosen.inputBg;
      } else {
        const isContrast = Math.random() > 0.45;
        const baseHue = Math.floor(Math.random() * 360);
        let accentHue = baseHue;

        if (isContrast) {
          accentHue = (baseHue + 140 + Math.floor(Math.random() * 80)) % 360;
        } else {
          accentHue =
            (baseHue + Math.floor(Math.random() * 40) - 20 + 360) % 360;
        }

        if (isDark) {
          const bgSat = Math.floor(Math.random() * 15) + 10;
          const bgLight = Math.floor(Math.random() * 8) + 12;
          bg = hslToHex(baseHue, bgSat, bgLight);
          inputBg = hslToHex(baseHue, bgSat, Math.max(8, bgLight - 4));

          const accSat = isContrast
            ? Math.floor(Math.random() * 25) + 65
            : Math.floor(Math.random() * 20) + 40;
          const accLight = Math.floor(Math.random() * 15) + 65;
          accent = hslToHex(accentHue, accSat, accLight);

          text = hslToHex(accentHue, 15, 85 + Math.floor(Math.random() * 10));
        } else {
          const bgSat = Math.floor(Math.random() * 20) + 15;
          const bgLight = Math.floor(Math.random() * 8) + 88;
          bg = hslToHex(baseHue, bgSat, bgLight);
          inputBg = hslToHex(baseHue, Math.max(0, bgSat - 10), 98);

          const accSat = isContrast
            ? Math.floor(Math.random() * 30) + 50
            : Math.floor(Math.random() * 20) + 35;
          const accLight = Math.floor(Math.random() * 15) + 30;
          accent = hslToHex(accentHue, accSat, accLight);

          text = hslToHex(accentHue, 20, 15 + Math.floor(Math.random() * 10));
        }
      }

      $ui.find("#wb-theme-cp-bg").val(bg);
      $ui.find("#wb-theme-cp-text").val(text);
      $ui.find("#wb-theme-cp-accent").val(accent);
      $ui.find("#wb-theme-cp-input-bg").val(inputBg);
      $ui
        .find("#wb-theme-cp-alpha")
        .val(Math.floor(Math.random() * 15) + 85)
        .trigger("input");
    });

  $ui
    .find("#wb-theme-preset-save")
    .off("click")
    .on("click", () => {
      const name = $ui.find("#wb-theme-preset-name").val().trim();
      if (!name) return toastr.warning("请先给这个配方起一个响亮的名字哦！");

      const currentCustom = {
        bg: $ui.find("#wb-theme-cp-bg").val(),
        text: $ui.find("#wb-theme-cp-text").val(),
        accent: $ui.find("#wb-theme-cp-accent").val(),
        inputBg: $ui.find("#wb-theme-cp-input-bg").val(),
        alpha: parseInt($ui.find("#wb-theme-cp-alpha").val()) || 95,
      };

      const themes = getSavedUserThemes();
      themes[name] = currentCustom;
      saveUserThemes(themes);

      $ui.find("#wb-theme-preset-name").val("");
      renderPresetSelect();
      $ui.find("#wb-theme-preset-select").val(name).trigger("change");
      toastr.success(`✨ 配方 [${name}] 已妥善收进配方盒啦！`);
    });

  $ui
    .find("#wb-theme-preset-select")
    .off("change")
    .on("change", function () {
      const name = $(this).val();
      if (!name) {
        $ui.find("#wb-theme-preset-del, #wb-theme-preset-rename").hide();
        return;
      }
      const themes = getSavedUserThemes();
      const config = themes[name];
      if (config) {
        $ui.find("#wb-theme-cp-bg").val(config.bg);
        $ui.find("#wb-theme-cp-text").val(config.text);
        $ui.find("#wb-theme-cp-accent").val(config.accent || "#70a1ff");
        $ui.find("#wb-theme-cp-input-bg").val(config.inputBg || config.bg);
        $ui.find("#wb-theme-cp-alpha").val(config.alpha || 95);
        updateThemeAndSave();
        $ui.find("#wb-theme-preset-del, #wb-theme-preset-rename").show();
      }
    });

  $ui
    .find("#wb-theme-preset-del")
    .off("click")
    .on("click", () => {
      const name = $ui.find("#wb-theme-preset-select").val();
      if (!name) return;
      const themes = getSavedUserThemes();
      delete themes[name];
      saveUserThemes(themes);
      renderPresetSelect();
      updateThemeAndSave();
      toastr.info(`配方 [${name}] 已丢弃。`);
    });

  $ui
    .find("#wb-theme-preset-rename")
    .off("click")
    .on("click", async () => {
      const oldName = $ui.find("#wb-theme-preset-select").val();
      if (!oldName) return;

      const newNameRaw = await SillyTavern.callGenericPopup(
        `请输入配方 [${oldName}] 的新名称：`,
        SillyTavern.POPUP_TYPE.INPUT,
        oldName,
      );
      if (!newNameRaw || typeof newNameRaw !== "string") return;
      const newName = newNameRaw.trim();
      if (!newName || newName === oldName) return;

      const themes = getSavedUserThemes();
      if (themes[newName]) {
        return toastr.warning("这个配方名称已经存在啦，换个别的名字吧！");
      }

      themes[newName] = themes[oldName];
      delete themes[oldName];
      saveUserThemes(themes);

      renderPresetSelect();

      $ui.find("#wb-theme-preset-select").val(newName).trigger("change");
      toastr.success(`✨ 配方已成功更名为 [${newName}] ！`);
    });

  $ui
    .find("#wb-theme-toggle-btn")
    .off("click")
    .on("click", () => $ui.find("#wb-theme-config-panel").slideToggle("fast"));
  $ui
    .find("#wb-theme-quick-toggle")
    .off("click")
    .on("click", () => {
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
    const sz = Number($ui.find("#wb-float-size").val()) || 48;
    const op = Number($ui.find("#wb-float-opacity").val()) || 0.8;
    localStorage.setItem(
      "lulu_wb_floating_config",
      JSON.stringify({ size: sz, opacity: op }),
    );
    const $btn = $("#lulu-wb-floating-btn");
    if (!$btn.length) return;
    const btnEl = $btn[0];
    btnEl.style.setProperty("width", sz + "px", "important");
    btnEl.style.setProperty("height", sz + "px", "important");
    btnEl.style.setProperty("opacity", String(op), "important");
    const $i = $btn.find("i");
    if ($i.length)
      $i[0].style.setProperty(
        "font-size",
        Math.round(sz * 0.45) + "px",
        "important",
      );
    const $emoji = $btn.find(".lulu-float-emoji");
    if ($emoji.length)
      $emoji[0].style.setProperty(
        "font-size",
        Math.round(sz * 0.5) + "px",
        "important",
      );
    const $svg = $btn.find(".lulu-float-svg");
    if ($svg.length) {
      $svg[0].style.setProperty(
        "width",
        Math.round(sz * 0.65) + "px",
        "important",
      );
      $svg[0].style.setProperty(
        "height",
        Math.round(sz * 0.65) + "px",
        "important",
      );
    }
  };
  // 构建内置图标下拉选项
  let iconOptionsHtml = "";
  Object.keys(LULU_FLOAT_ICONS).forEach((key) => {
    iconOptionsHtml += `<option value="${key}">${LULU_FLOAT_ICONS[key]}</option>`;
  });

  $ui
    .find("#wb-toggle-floating")
    .parent()
    .after(
      `<div id="lulu-float-config-area" style="display:none;"></div>
      <div id="wb-float-appearance-panel" style="display:none; width:100%; margin-top:10px; padding:12px; border-radius:8px; border:1px dashed var(--SmartThemeQuoteColor); background:rgba(0,0,0,0.1);">
        <div style="font-weight:bold; margin-bottom:10px; color:var(--SmartThemeQuoteColor);"><i class="fa-solid fa-wand-magic-sparkles"></i> 悬浮球外观自定义</div>

        <div style="display:flex; flex-direction:column; gap:12px;">
          <!-- 图标类型 -->
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <label style="font-size:13px; font-weight:bold; min-width:70px;">图标类型：</label>
            <select id="wb-float-icon-type" class="wb-input-dt" style="width:auto; padding:6px; margin:0;">
              <option value="fa">🎨 内置矢量图标</option>
              <option value="emoji">😀 输入 Emoji 表情</option>
              <option value="img">🖼️ 图片链接</option>
            </select>
          </div>

          <!-- 内置矢量图标 -->
          <div id="wb-float-fa-row" style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <label style="font-size:13px; font-weight:bold; min-width:70px;">选择图标：</label>
            <select id="wb-float-fa-select" class="wb-input-dt" style="width:auto; padding:6px; margin:0; min-width:180px;">${iconOptionsHtml}</select>
          </div>

          <!-- Emoji -->
          <div id="wb-float-emoji-row" style="display:none; align-items:center; gap:10px; flex-wrap:wrap;">
            <label style="font-size:13px; font-weight:bold; min-width:70px;">Emoji：</label>
            <input type="text" id="wb-float-emoji-input" class="wb-input-dt" placeholder="粘贴一个表情，如 🌸" maxlength="4" style="width:120px; padding:6px; margin:0; text-align:center; font-size:18px;">
          </div>

          <!-- 图片链接 或 SVG 代码 -->
          <div id="wb-float-img-row" style="display:none; flex-direction:column; gap:6px;">
            <label style="font-size:13px; font-weight:bold;">图片链接 或 SVG 代码：</label>
            <textarea id="wb-float-img-input" class="wb-input-dt" placeholder="粘贴图片网址（https://.../xxx.png）
或直接粘贴 <svg ...>...</svg> 代码" style="width:100%; box-sizing:border-box; padding:6px; margin:0; min-height:60px; resize:vertical; font-size:12px;"></textarea>
            <span style="font-size:11px; color:gray;">* 图片建议正方形，会自动裁圆；SVG 代码也可以直接粘贴哦~</span>

            <!-- 收藏区 -->
            <div style="margin-top:8px; padding:10px; border-radius:6px; border:1px dashed var(--SmartThemeBorderColor); background:rgba(0,0,0,0.08);">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
                <span style="font-size:12.5px; font-weight:bold; color:var(--SmartThemeQuoteColor);"><i class="fa-solid fa-bookmark"></i> 我的图标收藏</span>
                <input type="text" id="wb-float-fav-name" class="wb-input-dt" placeholder="给上面的图标起个名字..." style="flex:1; min-width:120px; padding:5px 8px; margin:0; font-size:12px;">
                <button id="wb-float-fav-save" class="menu_button interactable btn-success wb-nowrap-btn" style="margin:0; padding:5px 12px; border:none; font-size:12px;"><i class="fa-solid fa-plus"></i> 收藏当前</button>
              </div>
              <div id="wb-float-fav-list" style="display:flex; flex-wrap:wrap; gap:8px;"></div>
            </div>
          </div>


          <!-- 大小与可视度（从顶部搬进来） -->
          <div style="border-top:1px dashed var(--SmartThemeBorderColor); padding-top:10px; display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
            <label style="font-size:12px; font-weight:bold; margin:0;">大小: <input type="range" id="wb-float-size" min="30" max="70" value="48" style="width:80px; accent-color:var(--SmartThemeQuoteColor); cursor:pointer; vertical-align:middle;"></label>
            <label style="font-size:12px; font-weight:bold; margin:0;">可视度: <input type="range" id="wb-float-opacity" min="0.2" max="1" step="0.1" value="0.8" style="width:80px; accent-color:var(--SmartThemeQuoteColor); cursor:pointer; vertical-align:middle;"></label>
          </div>
          <!-- 颜色设置 -->
          <div style="border-top:1px dashed var(--SmartThemeBorderColor); padding-top:10px;">
            <label style="cursor:pointer; display:flex; align-items:center; gap:6px; font-size:13px; margin-bottom:10px;">
              <input type="checkbox" id="wb-float-use-theme" style="accent-color:var(--SmartThemeQuoteColor);">
              <span style="font-weight:bold;">🎨 颜色跟随酒馆主题（勾选后下方颜色无效）</span>
            </label>
            <div id="wb-float-color-row" style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
              <div style="display:flex; align-items:center; gap:6px;">
                <label style="font-size:12px; font-weight:bold;">球底色:</label>
                <input type="color" id="wb-float-bg-color" value="#2a2e33" style="width:32px; height:28px; border:none; padding:0; cursor:pointer;">
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <label style="font-size:12px; font-weight:bold;">底色透明度:</label>
                <input type="range" id="wb-float-bg-alpha" min="0" max="100" value="100" style="width:70px; accent-color:var(--SmartThemeQuoteColor); cursor:pointer;">
                <span id="wb-float-bg-alpha-val" style="font-size:12px; min-width:34px;">100%</span>
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <label style="font-size:12px; font-weight:bold;">图标色:</label>
                <input type="color" id="wb-float-icon-color" value="#70a1ff" style="width:32px; height:28px; border:none; padding:0; cursor:pointer;">
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <label style="font-size:12px; font-weight:bold;">边框色:</label>
                <input type="color" id="wb-float-border-color" value="#70a1ff" style="width:32px; height:28px; border:none; padding:0; cursor:pointer;">
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <label style="font-size:12px; font-weight:bold;">边框透明度:</label>
                <input type="range" id="wb-float-border-alpha" min="0" max="100" value="100" style="width:70px; accent-color:var(--SmartThemeQuoteColor); cursor:pointer;">
                <span id="wb-float-border-alpha-val" style="font-size:12px; min-width:34px;">100%</span>
              </div>
            </div>
            <span style="font-size:11px; color:gray; display:block; margin-top:6px;">* 图片模式下“图标色”无效哦~</span>
          </div>

          <div style="display:flex; gap:8px;">
            <button id="wb-float-appearance-save" class="menu_button interactable btn-success wb-nowrap-btn" style="margin:0; padding:8px 16px; border:none; font-weight:bold;"><i class="fa-solid fa-check"></i> 应用外观</button>
            <button id="wb-float-appearance-reset" class="menu_button interactable btn-warning wb-nowrap-btn" style="margin:0; padding:8px 16px; border:none;"><i class="fa-solid fa-rotate-left"></i> 恢复默认</button>
          </div>
        </div>
      </div>`,
    );

  // ===== 图标收藏库 =====
  const getIconFavorites = () => {
    try {
      return JSON.parse(
        localStorage.getItem("lulu_wb_floating_icon_favs") || "[]",
      );
    } catch (e) {
      return [];
    }
  };
  const saveIconFavorites = (arr) => {
    localStorage.setItem("lulu_wb_floating_icon_favs", JSON.stringify(arr));
  };

  // 生成一个小预览（图片 or SVG）
  const buildFavPreview = (val) => {
    const v = (val || "").trim();
    if (v.toLowerCase().startsWith("<svg")) {
      return `<span style="width:26px; height:26px; display:flex; align-items:center; justify-content:center; overflow:hidden;">${v.replace(/width="[^"]*"/, 'width="26"').replace(/height="[^"]*"/, 'height="26"')}</span>`;
    }
    return `<img src="${v}" style="width:26px; height:26px; object-fit:cover; border-radius:4px;" alt="icon">`;
  };

  const renderIconFavList = () => {
    const favs = getIconFavorites();
    const $list = $ui.find("#wb-float-fav-list").empty();
    if (favs.length === 0) {
      $list.html(
        '<span style="font-size:11px; color:gray;">还没有收藏任何图标哦，粘贴后点“收藏当前”试试~</span>',
      );
      return;
    }
    favs.forEach((fav, idx) => {
      const $item = $(
        `<div class="lulu-fav-item" title="点击使用这个图标" style="display:flex; align-items:center; gap:6px; padding:5px 8px; border-radius:6px; border:1px solid var(--SmartThemeBorderColor); background:var(--SmartThemeBotMesColor); cursor:pointer; transition:0.2s;">
          ${buildFavPreview(fav.value)}
          <span style="font-size:12px; max-width:100px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${fav.name || "未命名"}</span>
          <i class="fa-solid fa-xmark lulu-fav-del" title="删除这个收藏" style="color:gray; font-size:12px; padding:2px; margin-left:2px;"></i>
        </div>`,
      );
      // 点击整个卡片：填入输入框
      $item.on("click", function (e) {
        if ($(e.target).hasClass("lulu-fav-del")) return; // 点删除键不触发
        $ui.find("#wb-float-img-input").val(fav.value);
        $ui.find("#wb-float-fav-name").val(fav.name || "");
        toastr.info(`已载入图标 [${fav.name}]，点下方“应用外观”即可生效~`);
      });
      // 删除
      $item.find(".lulu-fav-del").on("click", function (e) {
        e.stopPropagation();
        const cur = getIconFavorites();
        cur.splice(idx, 1);
        saveIconFavorites(cur);
        renderIconFavList();
      });
      $item.hover(
        function () {
          $(this).css("border-color", "var(--SmartThemeQuoteColor)");
        },
        function () {
          $(this).css("border-color", "var(--SmartThemeBorderColor)");
        },
      );
      $list.append($item);
    });
  };

  // 收藏当前输入框里的内容
  $ui.find("#wb-float-fav-save").on("click", () => {
    const val = $ui.find("#wb-float-img-input").val().trim();
    let name = $ui.find("#wb-float-fav-name").val().trim();
    if (!val) return toastr.warning("上面的框还是空的呢，先粘贴图标再收藏哦~");
    if (!name) name = "图标 " + (getIconFavorites().length + 1);
    const favs = getIconFavorites();
    favs.push({ name: name, value: val });
    saveIconFavorites(favs);
    $ui.find("#wb-float-fav-name").val("");
    renderIconFavList();
    toastr.success(`✨ 已收藏 [${name}]！`);
  });
  // ===== 图标收藏库结束 =====
  // ===== 悬浮球外观设置的逻辑 =====
  const loadFloatAppearanceUI = () => {
    const ap = getFloatAppearance();
    $ui.find("#wb-float-icon-type").val(ap.iconType || "fa");
    $ui.find("#wb-float-fa-select").val(ap.iconValue || "fa-book-atlas");
    $ui.find("#wb-float-emoji-input").val(ap.emoji || "📖");
    $ui.find("#wb-float-img-input").val(ap.imgUrl || "");
    $ui.find("#wb-float-use-theme").prop("checked", ap.useThemeColor !== false);
    $ui.find("#wb-float-bg-color").val(ap.bgColor || "#2a2e33");
    const _bgAlpha = ap.bgAlpha === undefined ? 100 : ap.bgAlpha;
    $ui.find("#wb-float-bg-alpha").val(_bgAlpha);
    $ui.find("#wb-float-bg-alpha-val").text(_bgAlpha + "%");
    $ui.find("#wb-float-icon-color").val(ap.iconColor || "#70a1ff");
    $ui.find("#wb-float-border-color").val(ap.borderColor || "#70a1ff");
    const _bdAlpha = ap.borderAlpha === undefined ? 100 : ap.borderAlpha;
    $ui.find("#wb-float-border-alpha").val(_bdAlpha);
    $ui.find("#wb-float-border-alpha-val").text(_bdAlpha + "%");
    updateFloatAppearanceRows();
    renderIconFavList();
  };

  const updateFloatAppearanceRows = () => {
    const type = $ui.find("#wb-float-icon-type").val();
    $ui
      .find("#wb-float-fa-row")
      .css("display", type === "fa" ? "flex" : "none");
    $ui
      .find("#wb-float-emoji-row")
      .css("display", type === "emoji" ? "flex" : "none");
    $ui
      .find("#wb-float-img-row")
      .css("display", type === "img" ? "flex" : "none");
    const useTheme = $ui.find("#wb-float-use-theme").is(":checked");
    $ui.find("#wb-float-color-row").css("opacity", useTheme ? "0.4" : "1");
    $ui
      .find(
        "#wb-float-bg-color, #wb-float-icon-color, #wb-float-border-color, #wb-float-bg-alpha, #wb-float-border-alpha",
      )
      .prop("disabled", useTheme);
  };

  // 下拉切换：面板皮肤 / 悬浮球外观
  $ui.find("#wb-config-section-select").on("change", function () {
    const val = $(this).val();
    if (val === "float") {
      $ui.find("#wb-config-panel-section").hide();
      $ui.find("#wb-config-float-section").show();
      loadFloatAppearanceUI();
    } else {
      $ui.find("#wb-config-float-section").hide();
      $ui.find("#wb-config-panel-section").show();
    }
  });
  $ui
    .find("#wb-float-icon-type, #wb-float-use-theme")
    .on("change", updateFloatAppearanceRows);
  $ui.find("#wb-float-bg-alpha").on("input", function () {
    $ui.find("#wb-float-bg-alpha-val").text($(this).val() + "%");
  });
  $ui.find("#wb-float-border-alpha").on("input", function () {
    $ui.find("#wb-float-border-alpha-val").text($(this).val() + "%");
  });

  $ui.find("#wb-float-appearance-save").on("click", () => {
    const newAppear = {
      iconType: $ui.find("#wb-float-icon-type").val(),
      iconValue: $ui.find("#wb-float-fa-select").val(),
      emoji: $ui.find("#wb-float-emoji-input").val().trim() || "📖",
      imgUrl: $ui.find("#wb-float-img-input").val().trim(),
      useThemeColor: $ui.find("#wb-float-use-theme").is(":checked"),
      bgColor: $ui.find("#wb-float-bg-color").val(),
      bgAlpha: parseInt($ui.find("#wb-float-bg-alpha").val()),
      iconColor: $ui.find("#wb-float-icon-color").val(),
      borderColor: $ui.find("#wb-float-border-color").val(),
      borderAlpha: parseInt($ui.find("#wb-float-border-alpha").val()),
    };
    if (newAppear.iconType === "img" && !newAppear.imgUrl) {
      return toastr.warning("选择了图片模式，但还没填图片链接哦~");
    }
    localStorage.setItem(
      "lulu_wb_floating_appearance",
      JSON.stringify(newAppear),
    );
    // 如果悬浮球开着，立即刷新它的样子
    if ($ui.find("#wb-toggle-floating").is(":checked")) {
      toggleFloatingButton(true, true);
    }
    toastr.success("✨ 悬浮球换新装成功啦！");
  });

  $ui.find("#wb-float-appearance-reset").on("click", () => {
    localStorage.removeItem("lulu_wb_floating_appearance");
    loadFloatAppearanceUI();
    if ($ui.find("#wb-toggle-floating").is(":checked")) {
      toggleFloatingButton(true, true);
    }
    toastr.info("悬浮球外观已恢复默认~");
  });
  // ===== 悬浮球外观设置逻辑结束 =====

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
    toggleFloatingButton(isEnable, true);
    if (typeof toastr !== "undefined") {
      toastr.success(
        isEnable
          ? "✨ 悬浮球召唤成功！可以在旁边的滑块自由调整它的大小和隐身效果哦~"
          : "🪄 悬浮球已经听话地躲起来啦~",
      );
    }
  });

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
  // 自动检测污染开关（默认关闭）
  $ui
    .find("#wb-toggle-auto-detect")
    .prop(
      "checked",
      localStorage.getItem("lulu_wb_auto_detect_enabled") === "true",
    );
  $ui.find("#wb-toggle-auto-detect").on("change", function () {
    const isEnable = $(this).is(":checked");
    localStorage.setItem("lulu_wb_auto_detect_enabled", isEnable);
    if (typeof toastr !== "undefined") {
      toastr.success(
        isEnable
          ? "🛡️ 已开启自动检测：进入/导入角色卡时会自动比对卡内世界书~"
          : "💤 已关闭自动检测，安静模式启动~",
      );
    }
  });
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
      // ✨ 初始化顶部工具栏折叠状态（电脑手机统一折叠）
      {
        const $ctrlBtns = $ui
          .find("#wb-main-controls-group")
          .children("button");
        const collapsed =
          localStorage.getItem("lulu_wb_main_ctrl_collapsed") !== "false";
        if (collapsed) {
          $ctrlBtns.hide();
          $ui
            .find("#wb-main-ctrl-toggle")
            .html('<i class="fa-solid fa-chevron-down"></i> 展开更多操作');
        } else {
          $ctrlBtns.show();
          $ui
            .find("#wb-main-ctrl-toggle")
            .html('<i class="fa-solid fa-chevron-up"></i> 收起更多操作');
        }
      }
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
      return true; // 补丁：成功了就返回 true
    } catch (error) {
      toastr.error(`操作失败: ${error.message}`);
      return false; // 补丁：失败了就返回 false，告诉外面出错了
    } finally {
      $overlay.fadeOut("slow");
    }
  };
  // ========== 【功能1：回收站】 开始 ==========
  const RECYCLE_KEY = "lulu_wb_recycle_bin";
  const RECYCLE_MAX = 15;

  const getRecycleBin = () => {
    try {
      return JSON.parse(localStorage.getItem(RECYCLE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  };
  const saveRecycleBin = (arr) => {
    localStorage.setItem(RECYCLE_KEY, JSON.stringify(arr));
  };

  // 删书前调用：把整本书打包丢进回收站
  const moveWbToRecycle = async (wbName) => {
    try {
      let entries = [];
      try {
        entries = await getWorldbook(wbName);
      } catch (e) {
        entries = [];
      }
      // 顺便记住它所在的分类和UI分组，还原时一起恢复
      const cats = getCategories();
      const myCats = Object.keys(cats).filter(
        (k) => Array.isArray(cats[k]) && cats[k].includes(wbName),
      );
      const uiGroups = getWbUiGroups()[wbName] || {};

      let bin = getRecycleBin();
      // 同名的旧记录先去掉，避免重复
      bin = bin.filter((item) => item.name !== wbName);
      bin.unshift({
        name: wbName,
        entries: entries,
        cats: myCats,
        uiGroups: uiGroups,
        deletedAt: Date.now(),
      });
      if (bin.length > RECYCLE_MAX) bin = bin.slice(0, RECYCLE_MAX);
      saveRecycleBin(bin);
    } catch (e) {
      console.error("Lulu 回收站打包失败:", e);
    }
  };

  // 还原：把回收站里的书重新创建回来
  const restoreWbFromRecycle = async (idx) => {
    let bin = getRecycleBin();
    const item = bin[idx];
    if (!item) return;

    let finalName = item.name;
    // 重名处理
    if (getWorldbookNames().includes(finalName)) {
      const btnRes = await SillyTavern.callGenericPopup(
        `世界书 [${finalName}] 现在已经存在啦，怎么还原呢？`,
        SillyTavern.POPUP_TYPE.TEXT,
        "",
        {
          okButton: "取消还原",
          customButtons: [
            { text: "覆盖现有的", result: 1, classes: ["btn-danger"] },
            { text: "换个新名字", result: 2, classes: ["btn-primary"] },
          ],
        },
      );
      if (btnRes === 2) {
        let nn = await SillyTavern.callGenericPopup(
          "请赐予它一个新名字：",
          SillyTavern.POPUP_TYPE.INPUT,
          finalName + "_还原",
        );
        if (!nn || !(nn = nn.trim())) return;
        finalName = nn;
      } else if (btnRes !== 1) {
        return;
      }
    }

    await withLoadingOverlay(async () => {
      await createWorldbook(finalName, item.entries || []);
      // 恢复分类
      if (Array.isArray(item.cats) && item.cats.length > 0) {
        let cData = getCategories();
        item.cats.forEach((c) => {
          if (!cData[c]) cData[c] = [];
          if (!cData[c].includes(finalName)) cData[c].push(finalName);
        });
        saveCategories(cData);
      }
      // 恢复UI分组
      if (item.uiGroups && Object.keys(item.uiGroups).length > 0) {
        let grpMap = getWbUiGroups();
        grpMap[finalName] = item.uiGroups;
        saveWbUiGroups(grpMap);
      }
      // 从回收站移除这条
      let curBin = getRecycleBin();
      curBin.splice(idx, 1);
      saveRecycleBin(curBin);
    }, "正在从回收站找回世界书...");
    toastr.success(`✨ [${finalName}] 已经成功复活啦！`);
    renderData();
  };
  // ========== 【功能1：回收站】 结束 ==========
  // ========== 【锁定世界书】防误删 开始 ==========
  const getLockedWbs = () => {
    let vars = getVariables({ type: "global" });
    let locked = vars.wb_locked_list;
    if (typeof locked === "string") {
      try {
        locked = JSON.parse(locked);
      } catch (e) {
        locked = [];
      }
    }
    return Array.isArray(locked) ? locked : [];
  };
  const saveLockedWbs = (arr) => {
    updateVariablesWith(
      (v) => {
        v.wb_locked_list = arr;
        return v;
      },
      { type: "global" },
    );
  };
  const isWbLocked = (wbName) => getLockedWbs().includes(wbName);
  const toggleWbLock = (wbName) => {
    let list = getLockedWbs();
    if (list.includes(wbName)) {
      list = list.filter((n) => n !== wbName);
      saveLockedWbs(list);
      return false; // 现在是解锁状态
    } else {
      list.push(wbName);
      saveLockedWbs(list);
      return true; // 现在是锁定状态
    }
  };
  // ========== 【锁定世界书】防误删 结束 ==========

  // ========== 【锁定条目】防误删 开始 ==========
  const getLockedEntriesMap = () => {
    try {
      return JSON.parse(localStorage.getItem("lulu_wb_locked_entries") || "{}");
    } catch (e) {
      return {};
    }
  };
  const saveLockedEntriesMap = (obj) => {
    localStorage.setItem("lulu_wb_locked_entries", JSON.stringify(obj));
  };
  const getLockedEntryUIDs = (wbName) => {
    const map = getLockedEntriesMap();
    return Array.isArray(map[wbName]) ? map[wbName] : [];
  };
  const isEntryLocked = (wbName, uid) =>
    getLockedEntryUIDs(wbName).includes(uid);
  const toggleEntryLock = (wbName, uid) => {
    const map = getLockedEntriesMap();
    if (!Array.isArray(map[wbName])) map[wbName] = [];
    let nowLocked = false;
    if (map[wbName].includes(uid)) {
      map[wbName] = map[wbName].filter((u) => u !== uid);
    } else {
      map[wbName].push(uid);
      nowLocked = true;
    }
    saveLockedEntriesMap(map);
    return nowLocked;
  };
  // ========== 【锁定条目】防误删 结束 ==========
  // ========== 【全库对照跳过标记】 开始 ==========
  const getScanSkipList = () => {
    try {
      return JSON.parse(localStorage.getItem("lulu_wb_scan_skip_list") || "[]");
    } catch (e) {
      return [];
    }
  };

  const saveScanSkipList = (arr) => {
    localStorage.setItem("lulu_wb_scan_skip_list", JSON.stringify(arr));
  };

  const isScanSkipped = (wbName) => getScanSkipList().includes(wbName);

  const toggleScanSkip = (wbName) => {
    let list = getScanSkipList();
    let nowSkipped = false;
    if (list.includes(wbName)) {
      list = list.filter((n) => n !== wbName);
    } else {
      list.push(wbName);
      nowSkipped = true;
    }
    saveScanSkipList(list);
    return nowSkipped;
  };
  // ========== 【全库对照跳过标记】 结束 ==========

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
  // ---- 回收站弹窗（功能1）----
  $ui.find("#wb-btn-recycle").on("click", async () => {
    const renderRecycleList = () => {
      const bin = getRecycleBin();
      if (bin.length === 0) {
        return `<div style="color:gray; text-align:center; padding:30px;">回收站空空如也，很干净哦~ ✨</div>`;
      }
      let html =
        '<div style="display:flex; flex-direction:column; gap:8px; max-height:55vh; overflow-y:auto; padding:4px;">';
      bin.forEach((item, idx) => {
        const timeStr = new Date(item.deletedAt).toLocaleString();
        const entryCount = (item.entries || []).length;
        html += `
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:10px; background:var(--SmartThemeBotMesColor); border:1px solid var(--SmartThemeBorderColor); border-radius:6px; flex-wrap:wrap;">
            <div style="flex:1; min-width:150px;">
              <div style="font-weight:bold; font-size:14px;"><i class="fa-solid fa-book-skull" style="color:#fcc419;"></i> ${item.name}</div>
              <div style="font-size:11px; color:gray; margin-top:4px;">含 ${entryCount} 个条目 | 删除于 ${timeStr}</div>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="menu_button interactable btn-success wb-nowrap-btn lulu-recycle-restore" data-idx="${idx}" style="margin:0; padding:6px 12px; font-size:12px; border:none;"><i class="fa-solid fa-rotate-left"></i> 还原</button>
              <button class="menu_button interactable btn-danger wb-nowrap-btn lulu-recycle-purge" data-idx="${idx}" style="margin:0; padding:6px 10px; font-size:12px; border:none;" title="清除，无法再还原"><i class="fa-solid fa-fire"></i></button>
            </div>
          </div>`;
      });
      html += "</div>";
      return html;
    };

    const savedRecycleMode =
      localStorage.getItem("lulu_wb_panel_theme") || "default";
    const savedRecycleCustom = JSON.parse(
      localStorage.getItem("lulu_wb_panel_custom_colors") ||
        '{"bg":"#2a2e33", "text":"#ffffff", "accent":"#70a1ff", "alpha":95, "inputBg":"#1a1c1f"}',
    );
    const rcHexToRgba = (hex, alpha) => {
      let r = 0,
        g = 0,
        b = 0;
      if (hex && hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
      }
      return `rgba(${r},${g},${b},${alpha / 100})`;
    };
    let recycleThemeCSS = "";
    if (savedRecycleMode === "dark") {
      recycleThemeCSS = `dialog:has(#lulu-recycle-list-wrap) { background: rgba(22,24,28,1) !important; border: 1px solid #d1c5a1 !important; --SmartThemeBotMesColor: rgba(32,35,40,1) !important; --SmartThemeBodyColor: #c0c2c8 !important; --SmartThemeQuoteColor: #d1c5a1 !important; --SmartThemeBorderColor: #3d414d !important; color: #c0c2c8 !important; }`;
    } else if (savedRecycleMode === "light") {
      recycleThemeCSS = `dialog:has(#lulu-recycle-list-wrap) { background: rgba(253,246,227,1) !important; border: 1px solid #8b5d33 !important; --SmartThemeBotMesColor: rgba(255,251,240,1) !important; --SmartThemeBodyColor: #4a3b32 !important; --SmartThemeQuoteColor: #8b5d33 !important; --SmartThemeBorderColor: #e0d0b8 !important; color: #4a3b32 !important; }`;
    } else if (savedRecycleMode === "custom") {
      const bgRgba = rcHexToRgba(
        savedRecycleCustom.bg,
        savedRecycleCustom.alpha,
      );
      recycleThemeCSS = `dialog:has(#lulu-recycle-list-wrap) { background: ${bgRgba} !important; border: 1px solid ${savedRecycleCustom.accent || "#70a1ff"} !important; --SmartThemeBotMesColor: ${savedRecycleCustom.bg} !important; --SmartThemeBodyColor: ${savedRecycleCustom.text} !important; --SmartThemeQuoteColor: ${savedRecycleCustom.accent || "#70a1ff"} !important; color: ${savedRecycleCustom.text} !important; }`;
    }

    const dialogHtml = `
      <style>${recycleThemeCSS}</style>
      <div style="padding:6px; font-family:sans-serif; min-width:300px; max-width:520px; text-align:left;">
        <h3 style="margin-top:0; color:var(--SmartThemeQuoteColor); border-bottom:2px solid var(--SmartThemeBorderColor); padding-bottom:10px;">
          <i class="fa-solid fa-trash-arrow-up"></i> 世界书回收站
          <span style="font-size:12px; font-weight:normal; color:gray;">(最多保留最近 ${RECYCLE_MAX} 本)</span>
        </h3>
        <div id="lulu-recycle-list-wrap">${renderRecycleList()}</div>
      </div>`;

    const $dlg = $(dialogHtml);

    const bindEvents = () => {
      $dlg
        .find(".lulu-recycle-restore")
        .off("click")
        .on("click", async function () {
          const idx = parseInt($(this).attr("data-idx"));
          await restoreWbFromRecycle(idx);
          $dlg.find("#lulu-recycle-list-wrap").html(renderRecycleList());
          bindEvents();
        });
      $dlg
        .find(".lulu-recycle-purge")
        .off("click")
        .on("click", async function () {
          const idx = parseInt($(this).attr("data-idx"));
          const bin = getRecycleBin();
          const name = bin[idx] ? bin[idx].name : "";
          const res = await SillyTavern.callGenericPopup(
            `确认把 [${name}] 从回收站清除吗？之后就再也找不回来咯！`,
            SillyTavern.POPUP_TYPE.CONFIRM,
          );
          if (res === SillyTavern.POPUP_RESULT.AFFIRMATIVE) {
            const curBin = getRecycleBin();
            curBin.splice(idx, 1);
            saveRecycleBin(curBin);
            $dlg.find("#lulu-recycle-list-wrap").html(renderRecycleList());
            bindEvents();
            toastr.info(`[${name}] 已被清除。`);
          }
        });
    };

    setTimeout(bindEvents, 50);

    await SillyTavern.callGenericPopup($dlg, SillyTavern.POPUP_TYPE.TEXT, "", {
      okButton: "关闭",
    });
  });
  // ---- 回收站弹窗结束 ----
  // ========== 【功能4：搬运工作台】逻辑 开始 ==========
  const openTransferView = () => {
    $ui
      .find("#wb-main-view, #wb-char-view, #wb-assoc-view, #wb-tab-strip")
      .hide();
    $ui.find("#wb-transfer-view").css("display", "flex").hide().fadeIn(200);
    // Part 2 会在这里初始化两栏内容
    if (typeof initTransferView === "function") initTransferView();
  };

  $ui.find("#wb-btn-transfer").on("click", openTransferView);
  $ui.find("#wb-transfer-back").on("click", () => {
    $ui.find("#wb-transfer-view").hide();
    $ui.find("#wb-tab-strip, #wb-main-view").fadeIn(200);
  });
  // ---- Part 2：两栏数据与渲染 ----
  const transferState = {
    A: { wbName: "", entries: [], selected: new Set() },
    B: { wbName: "", entries: [], selected: new Set() },
  };

  // 渲染某一侧的世界书候选下拉列表
  const renderWbDropdown = (side) => {
    const $drop = $ui.find(`.wb-transfer-wbdrop[data-side="${side}"]`).empty();
    // 用 fixed 定位，浮到最顶层，不被任何容器裁剪
    const $searchInput = $ui.find(`.wb-transfer-wbsearch[data-side="${side}"]`);
    const rect = $searchInput[0].getBoundingClientRect();
    $drop.css({
      position: "fixed",
      top: rect.bottom + 2 + "px",
      left: rect.left + "px",
      width: rect.width + "px",
      "z-index": "2147483647",
    });
    const kw = $ui
      .find(`.wb-transfer-wbsearch[data-side="${side}"]`)
      .val()
      .toLowerCase();
    const curName = transferState[side].wbName;
    const list = getWorldbookNames().filter(
      (wb) => !kw || wb.toLowerCase().includes(kw),
    );
    if (list.length === 0) {
      $drop.html(
        '<div style="padding:10px; color:gray; text-align:center; font-size:12px;">没有匹配的世界书</div>',
      );
      return;
    }
    list.forEach((wb) => {
      const isCur = wb === curName;
      const $opt = $(
        `<div class="wb-transfer-wbopt" style="padding:8px 10px; cursor:pointer; font-size:13px; border-bottom:1px solid rgba(125,125,125,0.15); ${isCur ? "background:rgba(81,207,102,0.15); color:#51cf66; font-weight:bold;" : "color:var(--SmartThemeBodyColor);"}">${isCur ? '<i class="fa-solid fa-check" style="margin-right:4px;"></i>' : ""}${wb}</div>`,
      );
      $opt.on("mouseenter", function () {
        if (!isCur) $(this).css("background", "rgba(125,125,125,0.15)");
      });
      $opt.on("mouseleave", function () {
        if (!isCur) $(this).css("background", "");
      });
      $opt.on("click", async () => {
        $ui.find(`.wb-transfer-wbsearch[data-side="${side}"]`).val(wb);
        $drop.hide();
        await loadTransferSide(side, wb);
        updateTransferCount();
      });
      $drop.append($opt);
    });
  };

  // 加载某一侧的世界书条目
  const loadTransferSide = async (side, wbName) => {
    transferState[side].wbName = wbName;
    transferState[side].selected.clear();
    if (!wbName) {
      transferState[side].entries = [];
      renderTransferList(side);
      return;
    }
    const $list = $ui.find(`.wb-transfer-list[data-side="${side}"]`);
    $list.html(
      '<div style="text-align:center; color:gray; padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> 加载中...</div>',
    );
    try {
      const entries = await getWorldbook(wbName);
      transferState[side].entries = JSON.parse(JSON.stringify(entries));
    } catch (e) {
      transferState[side].entries = [];
      $list.html(
        '<div style="text-align:center; color:#ff6b6b; padding:20px;">加载失败了...</div>',
      );
      return;
    }
    renderTransferList(side);
  };

  // 渲染某一侧的条目列表
  const renderTransferList = (side) => {
    const $list = $ui.find(`.wb-transfer-list[data-side="${side}"]`).empty();
    const st = transferState[side];
    const kw = $ui
      .find(`.wb-transfer-search[data-side="${side}"]`)
      .val()
      .toLowerCase();

    if (!st.wbName) {
      $list.html(
        '<div style="text-align:center; color:gray; padding:20px;">请先在上方选择一本世界书~</div>',
      );
      return;
    }

    const filtered = st.entries.filter((e) => {
      const s =
        `${e.name || ""} ${(e.strategy?.keys || []).join(",")} ${e.content || ""}`.toLowerCase();
      return !kw || s.includes(kw);
    });

    if (filtered.length === 0) {
      $list.html(
        `<div style="text-align:center; color:gray; padding:20px;">${st.entries.length === 0 ? "这本书是空的呢" : "没有匹配的条目"}</div>`,
      );
      return;
    }

    filtered.forEach((entry) => {
      const realIdx = st.entries.indexOf(entry);
      const isSel = st.selected.has(realIdx);
      const isExpanded = st.expanded && st.expanded.has(realIdx);
      const isEn = entry.enabled;
      const strategy = entry.strategy || { type: "constant", keys: [] };
      const posBadge = formatPositionBadge(entry.position);
      const stratBadge =
        strategy.type === "selective"
          ? '<span class="badge-green">匹配</span>'
          : '<span class="badge-blue">常驻</span>';

      const $item = $(
        `<div style="border-left:3px solid ${isEn ? "var(--okGreen)" : "gray"}; background:${isSel ? "rgba(81,207,102,0.1)" : "var(--SmartThemeBlurTintColor)"}; border-radius:4px; opacity:${isEn ? "1" : "0.6"}; transition:0.15s;"></div>`,
      );

      // 顶部行：复选框 + 可点击展开的主体
      const $topRow = $(
        `<div style="display:flex; align-items:flex-start; gap:8px; padding:8px;"></div>`,
      );
      const $chk = $(
        `<input type="checkbox" style="transform:scale(1.1); margin-top:2px; flex-shrink:0; cursor:pointer;">`,
      ).prop("checked", isSel);
      $chk.on("click", function (e) {
        e.stopPropagation(); // 勾选时不触发展开
      });
      $chk.on("change", function () {
        $(this).is(":checked")
          ? st.selected.add(realIdx)
          : st.selected.delete(realIdx);
        $item.css(
          "background",
          $(this).is(":checked")
            ? "rgba(81,207,102,0.1)"
            : "var(--SmartThemeBlurTintColor)",
        );
        updateTransferCount();
      });

      const expandIcon = entry.content
        ? `<i class="fa-solid fa-chevron-${isExpanded ? "up" : "down"}" style="margin-left:6px; font-size:10px; color:gray;"></i>`
        : "";
      const $body = $(
        `<div style="flex:1; min-width:0; cursor:pointer;">
          <div style="font-weight:bold; font-size:13px; word-break:break-all; margin-bottom:3px; display:flex; align-items:center; justify-content:space-between; gap:4px;"><span>${entry.name || "(未命名条目)"}</span>${expandIcon}</div>
          <div style="display:flex; gap:4px; flex-wrap:wrap; align-items:center; font-size:11px;">
            <span class="${isEn ? "badge-green" : "badge-grey"}">${isEn ? "已启" : "关闭"}</span>
            ${stratBadge}
            <span class="dsnap-entry-pos">${posBadge}</span>
          </div>
        </div>`,
      );
      // 点主体区域 → 展开/折叠正文
      $body.on("click", () => {
        if (!entry.content) return;
        if (!st.expanded) st.expanded = new Set();
        st.expanded.has(realIdx)
          ? st.expanded.delete(realIdx)
          : st.expanded.add(realIdx);
        renderTransferList(side);
      });

      $topRow.append($chk, $body);
      $item.append($topRow);

      // 展开的正文区
      if (isExpanded && entry.content) {
        const keysLine =
          strategy.type === "selective" && (strategy.keys || []).length > 0
            ? `<div style="font-size:11px; color:var(--SmartThemeQuoteColor); margin-bottom:6px;">🔑 ${(strategy.keys || []).join(", ")}</div>`
            : "";
        $item.append(
          $(
            `<div style="padding:0 8px 8px 8px; border-top:1px dashed rgba(125,125,125,0.3); margin-top:2px; padding-top:8px;">${keysLine}<div style="font-size:12px; line-height:1.5; color:var(--SmartThemeBodyColor); white-space:pre-wrap; word-break:break-word; max-height:200px; overflow-y:auto;">${String(entry.content).replace(/</g, "<").replace(/>/g, ">")}</div></div>`,
          ),
        );
      }

      $list.append($item);
    });
  };

  // 更新中间按钮上的选中数提示
  const updateTransferCount = () => {
    const aN = transferState.A.selected.size;
    const bN = transferState.B.selected.size;
    $ui
      .find("#wb-transfer-a2b")
      .attr("title", `把左边选中的 ${aN} 项复制到右边`);
    $ui
      .find("#wb-transfer-b2a")
      .attr("title", `把右边选中的 ${bN} 项复制到左边`);
  };

  // 初始化整个搬运视图（Part1 里调用的就是它）
  const initTransferView = () => {
    $ui.find("#wb-transfer-jump").prop("checked", false);
    renderTransferList("A");
    renderTransferList("B");
  };

  // 事件绑定
  // 世界书搜索框：聚焦/输入时显示候选，选中后隐藏
  $ui.find(".wb-transfer-wbsearch").on("focus", function () {
    const side = $(this).attr("data-side");
    renderWbDropdown(side);
    $ui.find(`.wb-transfer-wbdrop[data-side="${side}"]`).show();
  });
  $ui.find(".wb-transfer-wbsearch").on("input", function () {
    const side = $(this).attr("data-side");
    renderWbDropdown(side);
    $ui.find(`.wb-transfer-wbdrop[data-side="${side}"]`).show();
  });
  // 点击别处收起候选框
  $ui.find("#wb-transfer-view").on("click", function (e) {
    if ($(e.target).closest(".wb-transfer-selbox").length === 0) {
      $ui.find(".wb-transfer-wbdrop").hide();
    }
  });
  // 条目搜索
  $ui.find(".wb-transfer-search").on("input", function () {
    renderTransferList($(this).attr("data-side"));
  });

  $ui.find(".wb-transfer-selall").on("click", function () {
    const side = $(this).attr("data-side");
    const st = transferState[side];
    const kw = $ui
      .find(`.wb-transfer-search[data-side="${side}"]`)
      .val()
      .toLowerCase();
    const showPreview = $ui.find("#wb-transfer-preview").is(":checked");
    st.entries.forEach((e, idx) => {
      const s =
        `${e.name || ""} ${(e.strategy?.keys || []).join(",")} ${showPreview ? e.content || "" : ""}`.toLowerCase();
      if (!kw || s.includes(kw)) st.selected.add(idx);
    });
    renderTransferList(side);
    updateTransferCount();
  });
  $ui.find(".wb-transfer-deselall").on("click", function () {
    const side = $(this).attr("data-side");
    transferState[side].selected.clear();
    renderTransferList(side);
    updateTransferCount();
  });
  // ---- Part 2 结束 ----
  // ---- Part 3：执行复制搬运 ----
  const doTransfer = async (fromSide, toSide) => {
    const from = transferState[fromSide];
    const to = transferState[toSide];

    if (!from.wbName) return toastr.warning("源世界书还没选呢~");
    if (!to.wbName) return toastr.warning("目标世界书还没选哦~");
    if (from.selected.size === 0)
      return toastr.warning("请先勾选要搬运的条目~");

    // 判断是否是同一本书（复制模式）
    const isSameBook = from.wbName === to.wbName;

    const count = from.selected.size;

    if (isSameBook) {
      // 同一本书：复制条目模式
      const res = await SillyTavern.callGenericPopup(
        `确认在 <strong style="color:var(--SmartThemeQuoteColor);">[${from.wbName}]</strong> 中复制选中的 <strong>${count}</strong> 个条目吗？<br><br><span style="font-size:12px;color:gray;">（会在同一本书中创建副本，条目名后面会加上"- 副本"标记哦~）</span>`,
        SillyTavern.POPUP_TYPE.CONFIRM,
      );
      if (res !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;

      await withLoadingOverlay(async () => {
        // 取出要复制的条目（深拷贝）
        const toCopy = [];
        from.selected.forEach((idx) => {
          if (from.entries[idx]) {
            toCopy.push(JSON.parse(JSON.stringify(from.entries[idx])));
          }
        });

        // 读取当前书的全部条目
        let currentEntries = await getWorldbook(from.wbName);

        // 给复制的条目分配新uid并加"副本"后缀
        let nextUid = luluGetFreeEntryUid(currentEntries);
        toCopy.forEach((e, i) => {
          e.uid = nextUid++;
          if (e.id !== undefined) e.id = e.uid;

          // 计算副本编号：看看同名的副本已经有几个了
          const originalName = e.name || "未命名条目";
          const copyPattern = new RegExp(
            `^${originalName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*-\\s*副本(\\d*)$`,
          );
          let maxCopyNum = 0;
          currentEntries.forEach((existing) => {
            const match = (existing.name || "").match(copyPattern);
            if (match) {
              const num = match[1] ? parseInt(match[1]) : 1;
              if (num > maxCopyNum) maxCopyNum = num;
            }
          });
          // 也检查已经准备要添加的副本（避免批量复制时编号重复）
          toCopy.slice(0, i).forEach((prev) => {
            const match = (prev.name || "").match(copyPattern);
            if (match) {
              const num = match[1] ? parseInt(match[1]) : 1;
              if (num > maxCopyNum) maxCopyNum = num;
            }
          });

          const copyNum = maxCopyNum + 1;
          e.name = `${originalName} - 副本${copyNum > 1 ? copyNum : ""}`;
          if (e.comment) e.comment = e.name;
          if (e.title) e.title = e.name;

          delete e._lulu_ui_group;
        });

        // 追加到书末尾
        currentEntries = currentEntries.concat(toCopy);
        await replaceWorldbook(from.wbName, currentEntries);

        if (typeof luluTokenCache !== "undefined")
          delete luluTokenCache[from.wbName];

        // 更新两侧的内存数据（因为是同一本书，两边都要刷新）
        const freshEntries = JSON.parse(JSON.stringify(currentEntries));
        from.entries = freshEntries;
        from.selected.clear();
        if (from.expanded) from.expanded.clear();
        to.entries = freshEntries;
        to.selected.clear();
        if (to.expanded) to.expanded.clear();
      }, `正在复制 ${count} 个条目...`);

      toastr.success(
        `✨ 成功在 [${from.wbName}] 中复制了 ${count} 个条目的副本！`,
      );

      renderTransferList(fromSide);
      renderTransferList(toSide);
      updateTransferCount();
    } else {
      // 不同书：原有的搬运逻辑
      const res = await SillyTavern.callGenericPopup(
        `确认把 <strong style="color:var(--SmartThemeQuoteColor);">[${from.wbName}]</strong> 中选中的 <strong>${count}</strong> 个条目，复制到 <strong style="color:var(--SmartThemeQuoteColor);">[${to.wbName}]</strong> 吗？<br><br><span style="font-size:12px;color:gray;">（源书条目不受影响，是复制不是移动哦~）</span>`,
        SillyTavern.POPUP_TYPE.CONFIRM,
      );
      if (res !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;

      await withLoadingOverlay(async () => {
        const toCopy = [];
        from.selected.forEach((idx) => {
          if (from.entries[idx]) {
            toCopy.push(JSON.parse(JSON.stringify(from.entries[idx])));
          }
        });

        let targetEntries = await getWorldbook(to.wbName);

        let nextUid = luluGetFreeEntryUid(targetEntries);
        toCopy.forEach((e, i) => {
          e.uid = nextUid++;
          if (e.id !== undefined) e.id = e.uid;
          delete e._lulu_ui_group;
        });

        targetEntries = targetEntries.concat(toCopy);
        await replaceWorldbook(to.wbName, targetEntries);

        if (typeof luluTokenCache !== "undefined")
          delete luluTokenCache[to.wbName];

        to.entries = JSON.parse(JSON.stringify(targetEntries));
        to.selected.clear();
        if (to.expanded) to.expanded.clear();
      }, `正在搬运 ${count} 个条目...`);

      toastr.success(`✨ 成功复制 ${count} 个条目到 [${to.wbName}] 啦！`);

      from.selected.clear();
      renderTransferList(fromSide);
      renderTransferList(toSide);
      updateTransferCount();

      if ($ui.find("#wb-transfer-jump").is(":checked")) {
        const targetWb = to.wbName;
        $ui.find("#wb-transfer-view").hide();
        await openEntryTuneView(targetWb, "#wb-main-view");
      }
    }
  };

  $ui.find("#wb-transfer-a2b").on("click", () => doTransfer("A", "B"));
  $ui.find("#wb-transfer-b2a").on("click", () => doTransfer("B", "A"));
  // ---- Part 3 结束 ----
  // ========== 【功能4：搬运工作台】逻辑（Part1）结束 ==========
  $ui.find("#wb-btn-force-scan").on("click", async () => {
    await initiateDeepScan(false, true);
    toastr.success(
      "已经把当前所有的角色卡羁绊重新温习了一遍，记忆库已达最新哦！",
    );
  });
  // ✨ 顶部工具栏折叠/展开点击事件（电脑手机通用）
  $ui
    .find("#wb-main-ctrl-toggle")
    .off("click")
    .on("click", function () {
      const $ctrlBtns = $ui.find("#wb-main-controls-group").children("button");
      const isNowHidden = $ctrlBtns.first().is(":hidden");
      if (isNowHidden) {
        // 展开：电脑端保持原本的横排显示
        if (window.innerWidth > 768) {
          $ctrlBtns.css("display", "inline-flex");
        } else {
          $ctrlBtns.css("display", "");
        }
        $ui
          .find("#wb-main-ctrl-toggle")
          .html('<i class="fa-solid fa-chevron-up"></i> 收起更多操作');
        localStorage.setItem("lulu_wb_main_ctrl_collapsed", "false");
      } else {
        $ctrlBtns.hide();
        $ui
          .find("#wb-main-ctrl-toggle")
          .html('<i class="fa-solid fa-chevron-down"></i> 展开更多操作');
        localStorage.setItem("lulu_wb_main_ctrl_collapsed", "true");
      }
    });
  const popup = new SillyTavern.Popup($ui, SillyTavern.POPUP_TYPE.TEXT, "", {
    allowVerticalScrolling: true,
    okButton: "关闭面板",
    onOpen: async () => {
      $(popup.dlg).addClass("wb-manager-dialog");

      // 🔧 确保悬浮球外观面板被搬进「外观设置」的下拉容器里
      const $floatPanel = $ui.find("#wb-float-appearance-panel");
      const $target = $ui.find("#wb-float-appearance-inner");
      if (
        $floatPanel.length &&
        $target.length &&
        $floatPanel.parent().attr("id") !== "wb-float-appearance-inner"
      ) {
        $floatPanel.appendTo($target);
        $floatPanel.css({
          display: "block",
          border: "none",
          background: "transparent",
          padding: "0",
          "margin-top": "0",
        });
      }
      $ui.find("#wb-float-appearance-btn").hide();
      // 默认显示面板皮肤区，隐藏悬浮球区
      $ui.find("#wb-config-float-section").hide();
      $ui.find("#wb-config-panel-section").show();

      showTab(window.luluWbInitTabType || "global");
      setTimeout(async () => {
        await initiateDeepScan();
      }, 600);
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
  // ---- 外面：全局启用总 Token 按钮 ----
  $ui.find("#wb-btn-clear").after(
    $(
      '<div class="wb-action-btn wb-nowrap-btn btn-primary" id="wb-btn-calc-global-tk"><i class="fa-solid fa-coins"></i> 计算全局已占用总 Token</div>',
    ).on("click", async function () {
      const $btn = $(this);
      $btn.html('<i class="fa-solid fa-spinner fa-spin"></i> 潜水计算中...');
      const activeWbs = getGlobalWorldbookNames(); // 获取当前全局启用的所有书
      if (activeWbs.length === 0) {
        $btn.html('<i class="fa-solid fa-coins"></i> 当前无启用，0 Tk');
        setTimeout(
          () =>
            $btn.html(
              '<i class="fa-solid fa-coins"></i> 计算全局已占用总 Token',
            ),
          3000,
        );
        return;
      }
      let totalTokens = 0;
      try {
        for (const wb of activeWbs) {
          const entries = await getWorldbook(wb);
          const text = entries
            .filter((e) => e.enabled)
            .map((e) => e.content || "")
            .join("\n");
          if (text) {
            totalTokens +=
              typeof getTokenCount === "function"
                ? await getTokenCount(text)
                : Math.ceil(text.length / 2.5);
          }
        }
        $btn.html(
          `<i class="fa-solid fa-check"></i> ⚠️ 全局总占用: ${totalTokens} Tk`,
        );
      } catch (e) {
        $btn.html(
          '<i class="fa-solid fa-triangle-exclamation"></i> 计算出错了',
        );
      }
      setTimeout(
        () =>
          $btn.html('<i class="fa-solid fa-coins"></i> 计算全局已占用总 Token'),
        5000,
      );
    }),
  );
  // ---- 结束 ----
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
          const toNum = (value, fallback = undefined) => {
            if (value === undefined || value === null || value === "")
              return fallback;
            const num = Number(value);
            return Number.isNaN(num) ? fallback : num;
          };
          const parseKeys = (value) => {
            if (Array.isArray(value)) return [...value];
            if (typeof value === "string")
              return value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            return [];
          };
          const nativeRoleToText = (value) => {
            if (value === 0 || value === "0") return "system";
            if (value === 1 || value === "1") return "user";
            if (value === 2 || value === "2") return "assistant";
            if (value === "user" || value === "assistant" || value === "system")
              return value;
            return "system";
          };
          const nativeRoleToNumber = (value) => {
            if (value === 1 || value === "1" || value === "user") return 1;
            if (value === 2 || value === "2" || value === "assistant") return 2;
            return 0;
          };
          const nativePositionToObject = (entry) => {
            if (entry.position && typeof entry.position === "object") {
              const posObj = { ...entry.position };
              if (posObj.type === "outlet") posObj.type = "at_depth";
              if (posObj.type === undefined && posObj.position !== undefined)
                posObj.type = nativePositionToObject({
                  position: posObj.position,
                }).type;
              posObj.role = nativeRoleToText(
                posObj.role ??
                  entry.role ??
                  entry.depth_role ??
                  entry.depthRole,
              );
              posObj.depth = toNum(
                posObj.depth ??
                  entry.depth ??
                  entry.scan_depth ??
                  entry.scanDepth,
                0,
              );
              posObj.order = toNum(
                posObj.order ??
                  entry.order ??
                  entry.insertion_order ??
                  entry.insertionOrder,
                100,
              );
              return posObj;
            }

            const posInt = toNum(
              entry.position ??
                entry.insertion_position ??
                entry.insertionPosition,
              4,
            );
            let type = "at_depth";
            if (posInt === 0) type = "before_character_definition";
            else if (posInt === 1) type = "after_character_definition";
            else if (posInt === 2) type = "before_example_messages";
            else if (posInt === 3) type = "after_example_messages";
            else if (posInt === 5) type = "before_author_note";
            else if (posInt === 6) type = "after_author_note";
            return {
              type: type,
              role: nativeRoleToText(
                entry.role ?? entry.depth_role ?? entry.depthRole,
              ),
              depth: toNum(
                entry.depth ?? entry.scan_depth ?? entry.scanDepth,
                0,
              ),
              order: toNum(
                entry.order ?? entry.insertion_order ?? entry.insertionOrder,
                100,
              ),
            };
          };
          let entries = rawEntries.map((e, entryIndex) => {
            const safeEntry =
              e && typeof e === "object" ? JSON.parse(JSON.stringify(e)) : {};
            const entry = { ...safeEntry };
            const sourceRecursion =
              safeEntry.recursion && typeof safeEntry.recursion === "object"
                ? { ...safeEntry.recursion }
                : {};
            const sourceExt =
              safeEntry.extensions && typeof safeEntry.extensions === "object"
                ? { ...safeEntry.extensions }
                : {};

            const eName =
              safeEntry.name ||
              safeEntry.comment ||
              safeEntry.title ||
              "未定名条目";
            const uid =
              safeEntry.uid ??
              safeEntry.id ??
              safeEntry.entry_id ??
              safeEntry.entryId ??
              safeEntry.uuid ??
              safeEntry._id ??
              safeEntry.index ??
              Date.now() + i * 100000 + entryIndex;
            const eEnabled =
              safeEntry.enabled !== undefined
                ? !!safeEntry.enabled
                : safeEntry.disable !== undefined
                  ? !safeEntry.disable
                  : safeEntry.disabled !== undefined
                    ? !safeEntry.disabled
                    : true;
            const keys =
              parseKeys(safeEntry.key).length > 0
                ? parseKeys(safeEntry.key)
                : parseKeys(safeEntry.keys).length > 0
                  ? parseKeys(safeEntry.keys)
                  : parseKeys(safeEntry.strategy?.keys);
            const isConstant =
              safeEntry.constant !== undefined
                ? !!safeEntry.constant
                : safeEntry.selective !== undefined
                  ? !safeEntry.selective
                  : safeEntry.strategy?.type === "constant" ||
                    keys.length === 0;
            const strategy =
              safeEntry.strategy && typeof safeEntry.strategy === "object"
                ? {
                    ...safeEntry.strategy,
                    keys: Array.isArray(safeEntry.strategy.keys)
                      ? [...safeEntry.strategy.keys]
                      : keys,
                  }
                : { type: isConstant ? "constant" : "selective", keys: keys };
            if (!strategy.type)
              strategy.type = isConstant ? "constant" : "selective";
            if (!Array.isArray(strategy.keys)) strategy.keys = keys;

            const positionObj = nativePositionToObject(safeEntry);
            const numericRole = nativeRoleToNumber(
              safeEntry.role ?? positionObj.role,
            );
            const preventIn =
              safeEntry.exclude_recursion ??
              safeEntry.excludeRecursion ??
              safeEntry.prevent_incoming ??
              safeEntry.preventIncoming ??
              sourceRecursion.prevent_incoming ??
              sourceRecursion.preventIncoming ??
              false;
            const preventOut =
              safeEntry.prevent_recursion ??
              safeEntry.preventRecursion ??
              safeEntry.prevent_outgoing ??
              safeEntry.preventOutgoing ??
              sourceRecursion.prevent_outgoing ??
              sourceRecursion.preventOutgoing ??
              false;
            const delayUntil =
              safeEntry.delay_until ??
              safeEntry.delayUntil ??
              sourceRecursion.delay_until ??
              sourceRecursion.delayUntil ??
              null;
            const sticky =
              safeEntry.sticky ??
              safeEntry.effect?.sticky ??
              sourceExt.sticky ??
              null;
            const cooldown =
              safeEntry.cooldown ??
              safeEntry.effect?.cooldown ??
              sourceExt.cooldown ??
              null;
            const delay =
              safeEntry.delay ??
              safeEntry.effect?.delay ??
              sourceExt.delay ??
              null;
            const probability =
              safeEntry.probability ?? sourceExt.probability ?? null;
            const ext = { ...sourceExt };
            ext.lulu_group =
              ext.lulu_group ||
              safeEntry.lulu_group_tag ||
              safeEntry.group ||
              "";
            if (probability !== null) ext.probability = probability;
            if (sticky !== null) ext.sticky = sticky;
            if (cooldown !== null) ext.cooldown = cooldown;
            if (delay !== null) ext.delay = delay;

            entry.uid = uid;
            entry.id = safeEntry.id ?? uid;
            entry.name = eName;
            entry.comment = safeEntry.comment || eName;
            entry.title = safeEntry.title || eName;
            entry.enabled = eEnabled;
            entry.disable = !eEnabled;
            entry.disabled = !eEnabled;
            entry.content =
              safeEntry.content ??
              safeEntry.description ??
              safeEntry.text ??
              "";
            entry.group = safeEntry.group || "";
            entry.extensions = ext;
            entry.strategy = strategy;
            entry.key = keys;
            entry.keys = keys;
            entry.constant = isConstant;
            entry.selective =
              safeEntry.selective !== undefined
                ? !!safeEntry.selective
                : !isConstant;
            entry.position = positionObj;
            entry.depth = positionObj.depth;
            entry.order = positionObj.order;
            entry.insertion_order = positionObj.order;
            entry.role = numericRole;
            entry.probability =
              probability !== null
                ? probability
                : (safeEntry.probability ?? 100);
            entry.recursion = {
              ...sourceRecursion,
              prevent_incoming: preventIn,
              prevent_outgoing: preventOut,
              delay_until: delayUntil,
            };
            entry.effect = {
              ...(safeEntry.effect && typeof safeEntry.effect === "object"
                ? safeEntry.effect
                : {}),
              sticky: sticky,
              cooldown: cooldown,
              delay: delay,
            };
            entry.exclude_recursion = preventIn;
            entry.prevent_recursion = preventOut;
            entry.delayUntilRecursion = delayUntil;
            entry.sticky = sticky;
            entry.cooldown = cooldown;
            entry.delay = delay;
            entry.delay_until = delayUntil;
            return entry;
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
              // 🔒 锁定拦截：锁定的书不许被覆盖
              if (isWbLocked(finalName)) {
                $overlay.hide();
                await SillyTavern.callGenericPopup(
                  `🔒 [${finalName}] 已被锁定，无法被覆盖取代哦~<br>请为新导入的书换个名字，或先去解锁。`,
                  SillyTavern.POPUP_TYPE.TEXT,
                  "",
                  { okButton: "知道啦" },
                );
                $overlay.show();
                continue; // 回到 while 循环，重新弹"跳过/取代/重命名"，用户可改选
              }
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
          if (data.lulu_entry_groups) {
            let grpMap = getWbUiGroups();
            grpMap[finalName] = data.lulu_entry_groups;
            saveWbUiGroups(grpMap);
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
    // 🔒 锁定拦截：重命名本质是"新建+删旧"，会动到原书，锁定则禁止
    if (isWbLocked(oldName)) {
      return SillyTavern.callGenericPopup(
        `🔒 [${oldName}] 已被锁定，无法重命名哦~<br>（重命名会删除原书并新建，为保护它已拦下。想改名请先解锁。）`,
        SillyTavern.POPUP_TYPE.TEXT,
      );
    }
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

      // 新增的修复补丁：搬运条目的分组数据
      let uiGroupsMap = getWbUiGroups();
      if (uiGroupsMap[oldName]) {
        uiGroupsMap[newName] = uiGroupsMap[oldName];
        delete uiGroupsMap[oldName];
        saveWbUiGroups(uiGroupsMap);
      }
      // 修复补丁结束

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
  let globalSearchDebounce = null;
  let renderDataDebounceTimer;
  const debouncedRenderData = () => {
    clearTimeout(renderDataDebounceTimer);
    renderDataDebounceTimer = setTimeout(() => renderData(), 250);
  };
  $ui
    .find("#wb-search-input")
    .off("input")
    .on("input", () => {
      let isDeep = $ui.find("#wb-deep-search-toggle").is(":checked");
      if (isDeep) {
        clearTimeout(globalSearchDebounce);
        globalSearchDebounce = setTimeout(() => renderData(), 600);
      } else {
        debouncedRenderData();
      }
    });
  $ui
    .find("#wb-deep-search-toggle")
    .off("change")
    .on("change", debouncedRenderData);
  $ui
    .find("#wb-filter-unbound")
    .off("change")
    .on("change", debouncedRenderData);
  $ui.find("#wb-filter-locked").off("change").on("change", debouncedRenderData);
  $ui.find("#wb-filter-state").off("change").on("change", debouncedRenderData);
  $ui.find("#wb-sort-select").off("change").on("change", debouncedRenderData);
  $ui
    .find("#wb-category-filter")
    .off("change")
    .on("change", debouncedRenderData);
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
  $ui.find("#wb-btn-batch-lock").on("click", () => {
    if (batchSelected.size === 0)
      return toastr.warning("请先勾选需要锁定的世界书哦~");
    let lockList = getLockedWbs();
    let addCount = 0;
    batchSelected.forEach((wb) => {
      if (!lockList.includes(wb)) {
        lockList.push(wb);
        addCount++;
      }
    });
    saveLockedWbs(lockList);
    toastr.success(
      `已锁定 ${addCount} 本世界书（共选中 ${batchSelected.size} 本）~`,
    );
    renderData();
  });

  $ui.find("#wb-btn-batch-skip").on("click", () => {
    if (batchSelected.size === 0)
      return toastr.warning("请先勾选需要标记跳过的世界书哦~");
    let skipList = getScanSkipList();
    let addCount = 0;
    batchSelected.forEach((wb) => {
      if (!skipList.includes(wb)) {
        skipList.push(wb);
        addCount++;
      }
    });
    saveScanSkipList(skipList);
    toastr.success(`已标记 ${addCount} 本世界书跳过全库对照~`);
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
          // 修复：直接向酒馆底层请求完整数据，完美保留原生高级参数（如扫描深度等）！
          let rootObj = {};
          try {
            rootObj = await $.ajax({
              url: "/api/worldinfo/get",
              type: "POST",
              contentType: "application/json",
              data: JSON.stringify({ name: wb }),
            });
          } catch (e) {
            rootObj = { name: wb, entries: {} }; // 兜底
          }

          let entriesRaw = rootObj.entries || rootObj.data?.entries || rootObj;
          let entriesArray = Array.isArray(entriesRaw)
            ? entriesRaw
            : Object.values(entriesRaw);

          const entriesDict = {};
          entriesArray.forEach((e) => {
            const safeEntry =
              e && typeof e === "object" ? JSON.parse(JSON.stringify(e)) : {};
            const sourcePos = safeEntry.position;
            const sourceRecursion =
              safeEntry.recursion && typeof safeEntry.recursion === "object"
                ? { ...safeEntry.recursion }
                : null;
            const sourceExt =
              safeEntry.extensions && typeof safeEntry.extensions === "object"
                ? { ...safeEntry.extensions }
                : {};

            let posObj = null;
            if (sourcePos && typeof sourcePos === "object") {
              posObj = { ...sourcePos };
              if (posObj.type === "outlet") posObj.type = "at_depth";
              if (posObj.role === 0) posObj.role = "system";
              else if (posObj.role === 1) posObj.role = "user";
              else if (posObj.role === 2) posObj.role = "assistant";
              if (posObj.depth === undefined && safeEntry.depth !== undefined)
                posObj.depth = parseInt(safeEntry.depth);
              if (posObj.order === undefined) {
                posObj.order =
                  safeEntry.order !== undefined
                    ? parseInt(safeEntry.order)
                    : safeEntry.insertion_order !== undefined
                      ? parseInt(safeEntry.insertion_order)
                      : 100;
              }
            } else {
              let pType = "at_depth";
              const posInt =
                typeof safeEntry.position === "number"
                  ? safeEntry.position
                  : parseInt(safeEntry.position);
              if (posInt === 0) pType = "before_character_definition";
              else if (posInt === 1) pType = "after_character_definition";
              else if (posInt === 2) pType = "before_example_messages";
              else if (posInt === 3) pType = "after_example_messages";
              else if (posInt === 4 || Number.isNaN(posInt)) pType = "at_depth";
              posObj = {
                type: pType,
                role: safeEntry.role || "system",
                depth:
                  safeEntry.depth !== undefined ? parseInt(safeEntry.depth) : 0,
                order:
                  safeEntry.order !== undefined
                    ? parseInt(safeEntry.order)
                    : safeEntry.insertion_order !== undefined
                      ? parseInt(safeEntry.insertion_order)
                      : 100,
              };
            }

            let keysArr = [];
            if (Array.isArray(safeEntry.key) && safeEntry.key.length > 0)
              keysArr = [...safeEntry.key];
            else if (Array.isArray(safeEntry.keys) && safeEntry.keys.length > 0)
              keysArr = [...safeEntry.keys];
            else if (Array.isArray(safeEntry.strategy?.keys))
              keysArr = [...safeEntry.strategy.keys];

            const preventIn =
              safeEntry.exclude_recursion ??
              safeEntry.excludeRecursion ??
              safeEntry.recursion?.prevent_incoming ??
              safeEntry.prevent_incoming ??
              safeEntry.preventIncoming ??
              false;
            const preventOut =
              safeEntry.prevent_recursion ??
              safeEntry.preventRecursion ??
              safeEntry.recursion?.prevent_outgoing ??
              safeEntry.prevent_outgoing ??
              safeEntry.preventOutgoing ??
              false;
            const delayUntil =
              safeEntry.delay_until ??
              sourceRecursion?.delay_until ??
              sourceRecursion?.delayUntil ??
              safeEntry.recursion?.delay_until ??
              null;
            const sticky =
              safeEntry.sticky ?? safeEntry.recursion?.sticky ?? false;
            const cooldown =
              safeEntry.cooldown ??
              safeEntry.recursion?.cooldown ??
              safeEntry.recursion?.delay ??
              null;

            const flatEntry = {
              ...safeEntry,
              comment: safeEntry.name || safeEntry.comment || "未命名条目",
              name: safeEntry.name || safeEntry.comment || "未命名条目",
              disable: safeEntry.enabled === false,
              enabled: safeEntry.enabled !== false,
              key: keysArr,
              keys: keysArr,
              constant:
                safeEntry.constant !== undefined
                  ? !!safeEntry.constant
                  : safeEntry.strategy?.type === "constant" ||
                    keysArr.length === 0,
              selective:
                safeEntry.selective !== undefined
                  ? !!safeEntry.selective
                  : safeEntry.strategy?.type !== "constant",
              position: posObj,
              depth: posObj?.depth,
              order: posObj?.order,
              insertion_order: posObj?.order,
              role: posObj?.role,
              recursion: sourceRecursion || {
                prevent_incoming: preventIn,
                prevent_outgoing: preventOut,
                delay_until: delayUntil,
                sticky: sticky,
                cooldown: cooldown,
              },
              exclude_recursion: preventIn,
              prevent_recursion: preventOut,
              sticky: sticky,
              cooldown: cooldown,
              delay_until: delayUntil,
            };

            if (!flatEntry.extensions) flatEntry.extensions = {};
            flatEntry.extensions = { ...sourceExt, ...flatEntry.extensions };
            flatEntry.extensions.lulu_data = {
              strategy: safeEntry.strategy || {
                type: flatEntry.constant ? "constant" : "selective",
                keys: keysArr,
              },
              position: posObj,
              recursion: flatEntry.recursion,
            };

            const uid =
              safeEntry.uid ??
              safeEntry.id ??
              safeEntry.entry_id ??
              safeEntry.uuid ??
              safeEntry._id ??
              safeEntry.index;
            flatEntry.uid =
              uid !== undefined && uid !== null
                ? uid
                : Date.now() + Math.floor(Math.random() * 1000000);
            entriesDict[flatEntry.uid] = flatEntry;
          });

          // 把重组好的条目塞回完整的原生对象里
          rootObj.entries = entriesDict;
          rootObj.name = wb;
          rootObj.lulu_categories = myCats;
          rootObj.lulu_entry_groups = getWbUiGroups()[wb] || {};

          const blob = new Blob([JSON.stringify(rootObj, null, 2)], {
            type: "application/json",
          });
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

    // 🔒 先把锁定的挑出来，只删没锁的
    const lockedInSelection = [];
    const deletableList = [];
    batchSelected.forEach((wb) => {
      if (isWbLocked(wb)) lockedInSelection.push(wb);
      else deletableList.push(wb);
    });

    if (deletableList.length === 0) {
      return toastr.warning(
        `选中的 ${batchSelected.size} 本全部处于锁定状态，没有可删除的书哦~ 想删请先解锁。`,
      );
    }

    if (
      (await SillyTavern.callGenericPopup(
        `确认永久销毁这 ${deletableList.length} 本世界书？${lockedInSelection.length > 0 ? `<br><span style="color:#fcc419;">（另有 ${lockedInSelection.length} 本已锁定，将自动跳过）</span>` : ""}`,
        SillyTavern.POPUP_TYPE.CONFIRM,
      )) === SillyTavern.POPUP_RESULT.AFFIRMATIVE
    ) {
      await withLoadingOverlay(async () => {
        const c = loadBindingCache() || {};
        for (let wb of deletableList) {
          await moveWbToRecycle(wb);
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

      // 删完后，如果有被跳过的锁定书，弹窗提醒
      if (lockedInSelection.length > 0) {
        await SillyTavern.callGenericPopup(
          `✅ 已删除 ${deletableList.length} 本世界书。<br><br>🔒 以下 ${lockedInSelection.length} 本因为处于<strong style="color:#fcc419;">锁定状态</strong>被自动跳过、安然无恙：<br><br>${lockedInSelection.map((n) => `<div style="padding:2px 0;"><i class="fa-solid fa-lock" style="color:#fcc419; margin-right:4px;"></i>${n}</div>`).join("")}`,
          SillyTavern.POPUP_TYPE.TEXT,
          "",
          { okButton: "知道啦" },
        );
      } else {
        toastr.success(`已删除 ${deletableList.length} 本世界书~`);
      }
    }
  });
  $ui.find("#wb-btn-batch-group").on("click", async () => {
    if (batchSelected.size === 0)
      return toastr.warning("请先勾选需要分组的世界书哦~");

    const cats = getCategories();
    const catNames = Object.keys(cats);

    // 构建下拉选项
    let optionsHtml = '<option value="">-- 请选择已有分类 --</option>';
    catNames.forEach((c) => {
      optionsHtml += `<option value="${c}">${c}</option>`;
    });

    // 构建弹窗内容
    const dialogHtml = `
      <div style="padding:6px; font-family:sans-serif; min-width:280px; text-align:left;">
        <div style="font-weight:bold; margin-bottom:10px; color:var(--SmartThemeQuoteColor); font-size:15px;">
          <i class="fa-solid fa-folder-tree"></i> 把选中的 ${batchSelected.size} 本书归入分类
        </div>

        <div style="margin-bottom:14px;">
          <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:4px;">① 选择已有分类：</label>
          <select id="lulu-batch-grp-select" style="width:100%; box-sizing:border-box; padding:8px; border-radius:6px; border:1px solid var(--SmartThemeBorderColor); background:var(--lulu-input-bg, var(--SmartThemeBotMesColor)); color:var(--SmartThemeBodyColor);">
            ${optionsHtml}
          </select>
        </div>

        <div style="text-align:center; color:gray; font-size:12px; margin:8px 0;">—— 或者 ——</div>

        <div>
          <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:4px;">② 新建一个分类：</label>
          <input type="text" id="lulu-batch-grp-input" placeholder="输入新分类名字..." style="width:100%; box-sizing:border-box; padding:8px; border-radius:6px; border:1px solid var(--SmartThemeBorderColor); background:var(--lulu-input-bg, var(--SmartThemeBotMesColor)); color:var(--SmartThemeBodyColor);">
        </div>

        <div style="font-size:11px; color:gray; margin-top:10px;">* 两个都填的话，会优先使用②新建的名字哦~</div>
      </div>
    `;

    const $dialog = $(dialogHtml);
    $dialog
      .attr("id", "lulu-batch-grp-dialog")
      .prepend(
        `<style>${buildPopupThemeCSS("dialog:has(#lulu-batch-grp-dialog)")}</style>`,
      );

    // 让下拉和输入框互斥：选了下拉就清空输入框，反之亦然
    $dialog.find("#lulu-batch-grp-select").on("change", function () {
      if ($(this).val()) $dialog.find("#lulu-batch-grp-input").val("");
    });
    $dialog.find("#lulu-batch-grp-input").on("input", function () {
      if ($(this).val().trim()) $dialog.find("#lulu-batch-grp-select").val("");
    });

    const result = await SillyTavern.callGenericPopup(
      $dialog,
      SillyTavern.POPUP_TYPE.CONFIRM,
      "",
      { okButton: "确认归类", cancelButton: "取消" },
    );

    if (result !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;

    // 优先取输入框（新建），没有再取下拉（已有）
    let catName = $dialog.find("#lulu-batch-grp-input").val().trim();
    if (!catName) catName = $dialog.find("#lulu-batch-grp-select").val();

    if (!catName) {
      return toastr.warning("你还没有选择或输入任何分类名字");
    }

    let data = getCategories();
    if (!data[catName]) data[catName] = [];
    let addCount = 0;
    batchSelected.forEach((wb) => {
      if (!data[catName].includes(wb)) {
        data[catName].push(wb);
        addCount++;
      }
    });
    saveCategories(data);
    toastr.success(
      `已将 ${addCount} 本世界书归入分类 [${catName}] 啦！(๑>؂<๑)`,
    );
    renderData();
  });
  // ✨ 批量移出分类/收藏夹
  $ui.find("#wb-btn-batch-ungroup").on("click", async () => {
    if (batchSelected.size === 0)
      return toastr.warning("请先勾选需要移出分类的世界书哦~");

    const cats = getCategories();
    // 统计：选中的这些书，都出现在哪些分类里
    const relatedCats = Object.keys(cats).filter((c) => {
      if (!Array.isArray(cats[c])) return false;
      return Array.from(batchSelected).some((wb) => cats[c].includes(wb));
    });

    if (relatedCats.length === 0) {
      return toastr.info("选中的世界书本来就不在任何分类里呢~");
    }

    // 构建下拉选项：所有相关分类 + 一个"全部移出"
    let optionsHtml = '<option value="__ALL__">🧹 从所有分类中移出</option>';
    relatedCats.forEach((c) => {
      optionsHtml += `<option value="${c}">${c}</option>`;
    });

    const dialogHtml = `
      <div style="padding:6px; font-family:sans-serif; min-width:280px; text-align:left;">
        <div style="font-weight:bold; margin-bottom:10px; color:var(--SmartThemeQuoteColor); font-size:15px;">
          <i class="fa-solid fa-folder-minus"></i> 把选中的 ${batchSelected.size} 本书移出分类
        </div>
        <div style="margin-bottom:8px;">
          <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:4px;">选择要移出的分类：</label>
          <select id="lulu-batch-ungrp-select" style="width:100%; box-sizing:border-box; padding:8px; border-radius:6px; border:1px solid var(--SmartThemeBorderColor); background:var(--lulu-input-bg, var(--SmartThemeBotMesColor)); color:var(--SmartThemeBodyColor);">
            ${optionsHtml}
          </select>
        </div>
        <div style="font-size:11px; color:gray; margin-top:8px;">* 只是把书从分类里拿出来，世界书本身安然无恙哦~</div>
      </div>
    `;

    const $dialog = $(dialogHtml);
    $dialog
      .attr("id", "lulu-batch-ungrp-dialog")
      .prepend(
        `<style>${buildPopupThemeCSS("dialog:has(#lulu-batch-ungrp-dialog)")}</style>`,
      );

    const result = await SillyTavern.callGenericPopup(
      $dialog,
      SillyTavern.POPUP_TYPE.CONFIRM,
      "",
      { okButton: "确认移出", cancelButton: "取消" },
    );

    if (result !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;

    const target = $dialog.find("#lulu-batch-ungrp-select").val();
    let data = getCategories();
    let removeCount = 0;

    if (target === "__ALL__") {
      // 从所有分类里移出
      Object.keys(data).forEach((c) => {
        if (!Array.isArray(data[c])) return;
        const before = data[c].length;
        data[c] = data[c].filter((wb) => !batchSelected.has(wb));
        removeCount += before - data[c].length;
      });
    } else {
      // 只从指定分类移出
      if (Array.isArray(data[target])) {
        const before = data[target].length;
        data[target] = data[target].filter((wb) => !batchSelected.has(wb));
        removeCount = before - data[target].length;
      }
    }

    saveCategories(data);
    toastr.success(
      target === "__ALL__"
        ? `已将选中的书从所有分类中移出（共 ${removeCount} 次移出操作）！`
        : `已将选中的书移出分类 [${target}]！`,
    );
    renderData();
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
      const sortedCharSnapNames = sortCharSnapshotNames(
        charName,
        Object.keys(mySnaps),
      );
      sortedCharSnapNames.forEach((snapName) => {
        const snapData = mySnaps[snapName];
        const totalEntries = Object.values(snapData).reduce(
          (a, arr) => a + arr.length,
          0,
        );
        const includedBooks = Object.keys(snapData).length;
        const $item = $(
          `<div class="lulu-char-snap-item" draggable="true" style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--SmartThemeBotMesColor); border-radius:6px; border:1px solid var(--SmartThemeBorderColor); flex-wrap:wrap; gap:8px; cursor:default;"></div>`,
        );
        // ---- 角色快照拖拽排序 ----
        $item.on("dragstart", function (e) {
          e.originalEvent.dataTransfer.setData("text/plain", snapName);
          $(this).addClass("lulu-drag-ghost");
        });
        $item.on("dragend", function () {
          $(this).removeClass("lulu-drag-ghost");
          $ui
            .find(".lulu-drag-over-top, .lulu-drag-over-bottom")
            .removeClass("lulu-drag-over-top lulu-drag-over-bottom");
        });
        $item.on("dragover", function (e) {
          e.preventDefault();
          const rect = this.getBoundingClientRect();
          const isBottom = e.originalEvent.clientY > rect.top + rect.height / 2;
          $(this)
            .removeClass("lulu-drag-over-top lulu-drag-over-bottom")
            .addClass(
              isBottom ? "lulu-drag-over-bottom" : "lulu-drag-over-top",
            );
        });
        $item.on("dragleave", function () {
          $(this).removeClass("lulu-drag-over-top lulu-drag-over-bottom");
        });
        $item.on("drop", function (e) {
          e.preventDefault();
          $(this).removeClass("lulu-drag-over-top lulu-drag-over-bottom");
          const dragged = e.originalEvent.dataTransfer.getData("text/plain");
          const target = snapName;
          if (!dragged || dragged === target) return;
          let order = sortCharSnapshotNames(charName, Object.keys(mySnaps));
          const fromIdx = order.indexOf(dragged);
          if (fromIdx === -1) return;
          const rect = this.getBoundingClientRect();
          const isBottom = e.originalEvent.clientY > rect.top + rect.height / 2;
          order.splice(fromIdx, 1);
          let toIdx = order.indexOf(target);
          if (isBottom) toIdx++;
          order.splice(toIdx, 0, dragged);
          setCharSnapshotOrder(charName, order);
          renderCharView();
        });
        // ---- 角色快照拖拽排序结束 ----

        $item.append(
          `<div style="flex:1; min-width: 150px;"><div style="font-weight:bold;font-size:14px;"><i class="fa-solid fa-grip-vertical lulu-char-snap-drag-handle" style="cursor:grab; color:gray; margin-right:6px;" title="按住拖拽排序"></i><i class="fa-solid fa-camera-retro" style="color:var(--SmartThemeQuoteColor);"></i> ${snapName}</div>
<div style="font-size:12px;color:gray;">牵涉 ${includedBooks} 本世界书，共开启 ${totalEntries} 项条目</div></div>`,
        );
        const $act = $(
          '<div style="display:flex; gap:6px; flex-wrap: wrap;"></div>',
        );
        // 角色快照 上移/下移
        const moveCharSnapshot = (dir) => {
          let order = sortCharSnapshotNames(charName, Object.keys(mySnaps));
          const idx = order.indexOf(snapName);
          const swapWith = idx + dir;
          if (swapWith < 0 || swapWith >= order.length) return;
          [order[idx], order[swapWith]] = [order[swapWith], order[idx]];
          setCharSnapshotOrder(charName, order);
          renderCharView();
        };
        $act.append(
          $(
            '<button class="menu_button interactable wb-nowrap-btn btn-primary" style="margin:0; padding:6px 8px;" title="上移"><i class="fa-solid fa-arrow-up"></i></button>',
          ).on("click", () => moveCharSnapshot(-1)),
        );
        $act.append(
          $(
            '<button class="menu_button interactable wb-nowrap-btn btn-primary" style="margin:0; padding:6px 8px;" title="下移"><i class="fa-solid fa-arrow-down"></i></button>',
          ).on("click", () => moveCharSnapshot(1)),
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
  // ========== 【卡内世界书体检/救援】 开始 ==========
  // 读取指定角色卡内嵌的世界书原始数据
  const luluReadEmbeddedBook = async (avatar) => {
    const raw = await $.ajax({
      url: "/api/characters/get",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({ avatar_url: avatar }),
    });
    const d = raw.data || raw;
    const book = d.character_book;
    if (!book || typeof book === "string") return null;
    const rawEntries = Array.isArray(book.entries)
      ? book.entries
      : Object.values(book.entries || {});
    if (rawEntries.length === 0) return null;
    return { name: book.name || "", entries: rawEntries };
  };

  // 把卡内嵌的 V2 条目，转换成你脚本内部用的条目格式
  const luluConvertEmbedded = (rawEntries) =>
    rawEntries.map((e, i) => {
      const ext = e.extensions || {};
      const keys = Array.isArray(e.keys)
        ? e.keys
        : Array.isArray(e.key)
          ? e.key
          : [];
      const enabled = e.enabled !== false && e.disable !== true;
      const isConstant = e.constant === true || keys.length === 0;
      const order = e.insertion_order ?? e.order ?? 100;
      let posNum = typeof ext.position === "number" ? ext.position : null;
      if (posNum === null) {
        posNum =
          e.position === "before_char"
            ? 0
            : e.position === "after_char"
              ? 1
              : 4;
      }
      const typeMap = {
        0: "before_character_definition",
        1: "after_character_definition",
        2: "before_example_messages",
        3: "after_example_messages",
        5: "before_author_note",
        6: "after_author_note",
      };
      const role =
        ext.role === 1 ? "user" : ext.role === 2 ? "assistant" : "system";
      const position = typeMap[posNum]
        ? { type: typeMap[posNum], order }
        : { type: "at_depth", role, depth: ext.depth ?? 4, order };
      const name = e.comment || e.name || `条目${i + 1}`;
      const uid = e.id ?? Date.now() + i;
      const preventIn = !!ext.exclude_recursion;
      const preventOut = !!ext.prevent_recursion;
      return {
        uid,
        id: uid,
        name,
        comment: name,
        title: name,
        enabled,
        disable: !enabled,
        disabled: !enabled,
        content: e.content || "",
        key: keys,
        keys,
        constant: isConstant,
        selective: !isConstant,
        strategy: { type: isConstant ? "constant" : "selective", keys },
        position,
        depth: position.depth,
        order,
        insertion_order: order,
        probability: ext.probability ?? 100,
        recursion: {
          prevent_incoming: preventIn,
          prevent_outgoing: preventOut,
          delay_until: ext.delay_until_recursion ?? null,
        },
        exclude_recursion: preventIn,
        prevent_recursion: preventOut,
        sticky: ext.sticky ?? null,
        cooldown: ext.cooldown ?? null,
        delay: ext.delay ?? null,
        extensions: ext,
      };
    });

  // 内容签名：把条目名+正文排序后拼起来，用来判断两本书内容一不一样
  const luluBookSig = (entries) =>
    entries
      .map(
        (e) => `${e.comment || e.name || ""}\u0001${(e.content || "").trim()}`,
      )
      .sort()
      .join("\u0002");

  // 给指定角色卡改绑世界书（把旧名换成新名）
  const luluRebindCharBook = async (oldName, newName) => {
    const cb =
      typeof getCharWorldbookNames === "function"
        ? getCharWorldbookNames("current") || {
            primary: null,
            additional: [],
          }
        : { primary: null, additional: [] };
    const swap = (v) => (v === oldName ? newName : v);
    if (typeof rebindCharWorldbooks === "function") {
      await rebindCharWorldbooks("current", {
        primary: swap(cb.primary),
        additional: (cb.additional || []).map(swap),
      });
      await initiateDeepScan(true, false);
    }
  };
  // ✨ 公用：HTML 转义 & 逐行差异高亮（单卡救援 + 全库对照共用）
  const luluEscHtml = (s) =>
    String(s).replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");

  const luluDiffText = (oldStr, newStr) => {
    const oldLines = String(oldStr || "").split("\n");
    const newLines = String(newStr || "").split("\n");
    const oldSet = new Set(oldLines.map((l) => l.trim()));
    const newSet = new Set(newLines.map((l) => l.trim()));
    let oldHtml = "";
    let newHtml = "";
    oldLines.forEach((l) => {
      const removed = !newSet.has(l.trim()) && l.trim() !== "";
      oldHtml += `<div style="padding:1px 4px; ${removed ? "background:rgba(255,107,107,0.25); border-radius:2px;" : ""}">${luluEscHtml(l) || " "}</div>`;
    });
    newLines.forEach((l) => {
      const added = !oldSet.has(l.trim()) && l.trim() !== "";
      newHtml += `<div style="padding:1px 4px; ${added ? "background:rgba(81,207,102,0.25); border-radius:2px;" : ""}">${luluEscHtml(l) || " "}</div>`;
    });
    return { oldHtml, newHtml };
  };

  // ✨ 公用：根据卡内原版和本地条目，生成差异对比的 HTML（返回字符串）
  const luluBuildDiffHtml = (
    convertedEntries,
    localEntriesArr,
    uniquePrefix,
  ) => {
    const embMap = new Map();
    convertedEntries.forEach((e) => {
      const key = (e.name || e.comment || "(无名)").trim();
      embMap.set(key, e);
    });
    const locMap = new Map();
    localEntriesArr.forEach((e) => {
      const key = (e.name || e.comment || "(无名)").trim();
      locMap.set(key, e);
    });

    const onlyInLocal = [];
    const onlyInEmb = [];
    const changed = [];
    const same = [];

    locMap.forEach((locE, name) => {
      if (embMap.has(name)) {
        const embE = embMap.get(name);
        if ((locE.content || "").trim() !== (embE.content || "").trim()) {
          changed.push({ name, locE, embE });
        } else {
          same.push(name);
        }
      } else {
        onlyInLocal.push({ name, locE });
      }
    });
    embMap.forEach((embE, name) => {
      if (!locMap.has(name)) {
        onlyInEmb.push({ name, embE });
      }
    });

    let html = `<div style="font-size:12px;">`;

    html += `<div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px; padding-bottom:8px; border-bottom:1px dashed var(--SmartThemeBorderColor);">`;
    html += `<span style="background:rgba(81,207,102,0.15); color:#51cf66; border:1px solid #51cf66; padding:2px 8px; border-radius:4px;">本地新增 ${onlyInLocal.length}</span>`;
    html += `<span style="background:rgba(255,107,107,0.15); color:#ff6b6b; border:1px solid #ff6b6b; padding:2px 8px; border-radius:4px;">本地缺失 ${onlyInEmb.length}</span>`;
    html += `<span style="background:rgba(252,196,25,0.15); color:#fcc419; border:1px solid #fcc419; padding:2px 8px; border-radius:4px;">内容改动 ${changed.length}</span>`;
    html += `<span style="background:rgba(150,150,150,0.15); color:gray; border:1px solid gray; padding:2px 8px; border-radius:4px;">未变 ${same.length}</span>`;
    html += `</div>`;

    if (changed.length > 0) {
      html += `<div style="font-weight:bold; color:#fcc419; margin-bottom:6px;"><i class="fa-solid fa-pen"></i> 内容被改动的条目：</div>`;
      changed.forEach((c, idx) => {
        const diff = luluDiffText(c.embE.content, c.locE.content);
        html += `
          <div style="margin-bottom:8px; border:1px solid var(--SmartThemeBorderColor); border-radius:6px; overflow:hidden;">
            <div class="lulu-diff-toggle" data-prefix="${uniquePrefix}" data-cidx="${idx}" style="padding:6px 10px; background:rgba(252,196,25,0.1); cursor:pointer; font-weight:bold; display:flex; justify-content:space-between; align-items:center;">
              <span style="word-break:break-all;">📝 ${luluEscHtml(c.name)}</span>
              <i class="fa-solid fa-chevron-down" style="font-size:11px;"></i>
            </div>
            <div class="lulu-diff-body" data-prefix="${uniquePrefix}" data-cidx="${idx}" style="display:none; padding:8px;">
              <div style="display:flex; gap:8px; font-size:11px; line-height:1.5;">
                <div style="flex:1; min-width:0;">
                  <div style="font-weight:bold; color:#51cf66; margin-bottom:4px;">📗 卡内原版</div>
                  <div style="max-height:200px; overflow:auto; background:rgba(0,0,0,0.15); border-radius:4px; padding:4px; white-space:pre-wrap; word-break:break-word;">${diff.oldHtml || "(空)"}</div>
                </div>
                <div style="flex:1; min-width:0;">
                  <div style="font-weight:bold; color:#ff6b6b; margin-bottom:4px;">📕 本地当前</div>
                  <div style="max-height:200px; overflow:auto; background:rgba(0,0,0,0.15); border-radius:4px; padding:4px; white-space:pre-wrap; word-break:break-word;">${diff.newHtml || "(空)"}</div>
                </div>
              </div>
              <div style="font-size:10px; color:gray; margin-top:4px;"><span style="background:rgba(255,107,107,0.25); padding:0 4px;">红底</span>=卡内有本地删了　<span style="background:rgba(81,207,102,0.25); padding:0 4px;">绿底</span>=本地新加的</div>
            </div>
          </div>`;
      });
    }

    if (onlyInLocal.length > 0) {
      html += `<div style="font-weight:bold; color:#51cf66; margin:8px 0 4px 0;"><i class="fa-solid fa-plus"></i> 本地多出来的条目（原本没有）：</div>`;
      html += `<div style="background:rgba(81,207,102,0.06); border:1px solid rgba(81,207,102,0.3); border-radius:4px; padding:6px; max-height:120px; overflow-y:auto;">`;
      onlyInLocal.forEach((o) => {
        html += `<div style="padding:1px 0;">• ${luluEscHtml(o.name)}</div>`;
      });
      html += `</div>`;
    }

    if (onlyInEmb.length > 0) {
      html += `<div style="font-weight:bold; color:#ff6b6b; margin:8px 0 4px 0;"><i class="fa-solid fa-minus"></i> 本地缺失的条目（原本有）：</div>`;
      html += `<div style="background:rgba(255,107,107,0.06); border:1px solid rgba(255,107,107,0.3); border-radius:4px; padding:6px; max-height:120px; overflow-y:auto;">`;
      onlyInEmb.forEach((o) => {
        html += `<div style="padding:1px 0;">• ${luluEscHtml(o.name)}</div>`;
      });
      html += `</div>`;
    }

    if (
      changed.length === 0 &&
      onlyInLocal.length === 0 &&
      onlyInEmb.length === 0
    ) {
      html += `<div style="text-align:center; color:gray; padding:10px;">条目名和正文都一致，差异可能在触发关键字/参数上~</div>`;
    }

    html += `</div>`;
    return html;
  };

  // ✨ 公用：给差异 HTML 里的展开/折叠按钮绑定事件
  const luluBindDiffToggle = ($scope) => {
    $scope
      .find(".lulu-diff-toggle")
      .off("click")
      .on("click", function () {
        const cidx = $(this).attr("data-cidx");
        const prefix = $(this).attr("data-prefix");
        const $body = $scope.find(
          `.lulu-diff-body[data-prefix="${prefix}"][data-cidx="${cidx}"]`,
        );
        const $icon = $(this).find("i.fa-chevron-down, i.fa-chevron-up");
        if ($body.is(":visible")) {
          $body.slideUp(120);
          $icon.removeClass("fa-chevron-up").addClass("fa-chevron-down");
        } else {
          $body.slideDown(120);
          $icon.removeClass("fa-chevron-down").addClass("fa-chevron-up");
        }
      });
  };
  // 主功能：体检当前角色卡的内嵌世界书
  const luluRescueEmbeddedLorebook = async () => {
    const ctx =
      typeof SillyTavern !== "undefined" ? SillyTavern.getContext() : {};
    const avatar =
      ctx.characters && ctx.characterId != null
        ? ctx.characters[ctx.characterId]?.avatar
        : null;
    const charName =
      typeof getCurrentCharacterName === "function"
        ? getCurrentCharacterName()
        : ctx.name2;
    if (!avatar) return toastr.warning("要先打开一个角色的聊天哦~");

    let embedded = null;
    await withLoadingOverlay(async () => {
      embedded = await luluReadEmbeddedBook(avatar);
    }, "正在拆开角色卡查看内嵌数据...");

    if (!embedded)
      return toastr.info("这张卡里没有内嵌世界书数据呢，无需救援~");

    const bookName = embedded.name;
    if (!bookName) return toastr.info("卡内世界书没有名字，无法处理~");

    const converted = luluConvertEmbedded(embedded.entries);

    // 本地没有同名书 → 直接提取
    if (!getWorldbookNames().includes(bookName)) {
      const res0 = await SillyTavern.callGenericPopup(
        `这张卡内嵌了世界书 <strong>[${bookName}]</strong>（${converted.length}条），但本地还没有它。<br>要提取出来并绑定给当前角色吗？`,
        SillyTavern.POPUP_TYPE.CONFIRM,
      );
      if (res0 !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
      await withLoadingOverlay(async () => {
        await createWorldbook(bookName, converted);
        await luluRebindCharBook(null, bookName);
      }, "正在提取卡内世界书...");
      return toastr.success(`✨ 已提取 [${bookName}] 并绑给当前角色！`);
    }

    // 本地有同名书 → 对比内容
    const localEntries = await getWorldbook(bookName);
    if (luluBookSig(localEntries) === luluBookSig(converted)) {
      return toastr.success(
        `✅ 本地的 [${bookName}] 和卡内版本内容一致，没有被污染，放心~`,
      );
    }

    // 生成差异对比 HTML
    // 生成差异对比 HTML
    const diffHtml = luluBuildDiffHtml(converted, localEntries, "single");

    const $rescueDlg =
      $(`<div id="lulu-rescue-dialog" style="text-align:left; line-height:1.6; padding:2px; max-width:520px;">
         <div style="font-size:15px; font-weight:bold; color:var(--SmartThemeQuoteColor); margin-bottom:12px;">
           <i class="fa-solid fa-clock-rotate-left"></i> 卡内原版 · 对照还原
         </div>
         <div style="background:var(--SmartThemeBotMesColor); border:1px solid var(--SmartThemeBorderColor); border-radius:8px; padding:12px; margin-bottom:12px;">
           <div style="font-size:13px; margin-bottom:8px;"><i class="fa-solid fa-robot" style="color:var(--SmartThemeQuoteColor); width:18px;"></i> 角色：<strong>${charName}</strong></div>
           <div style="font-size:13px;"><i class="fa-solid fa-book" style="color:var(--SmartThemeQuoteColor); width:18px;"></i> 世界书：<strong>${bookName}</strong></div>
         </div>
         <div style="font-size:12.5px; color:var(--SmartThemeBodyColor); line-height:1.7; margin-bottom:12px;">
           这张卡自带的世界书原版，和本地同名的这本<strong style="color:var(--SmartThemeQuoteColor);">内容不一样</strong>了。<br>
           <span style="color:gray;">可能是导入时被本地旧书接管，也可能是你改过本地这本、现在想还原成卡里的原版~</span>
         </div>
         <div id="lulu-single-diff-toggle" style="cursor:pointer; padding:8px 12px; background:rgba(125,125,125,0.12); border:1px solid var(--SmartThemeBorderColor); border-radius:6px; font-weight:bold; color:var(--SmartThemeQuoteColor); display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:13px;">
           <span><i class="fa-solid fa-magnifying-glass-chart"></i> 查看详细差异</span>
           <i class="fa-solid fa-chevron-down" style="font-size:11px;"></i>
         </div>
         <div id="lulu-single-diff-panel" style="display:none; max-height:45vh; overflow-y:auto; padding:4px;">${diffHtml}</div>
       </div>`);
    $rescueDlg.prepend(
      `<style>
        ${buildPopupThemeCSS("dialog:has(#lulu-rescue-dialog)")}
        /* 📱 手机端字号收敛，避免折叠条和按钮文字过大 */
        @media (max-width: 768px) {
          dialog:has(#lulu-rescue-dialog) #lulu-rescue-dialog { font-size: 12px !important; }
          dialog:has(#lulu-rescue-dialog) #lulu-single-diff-toggle { font-size: 12px !important; padding: 7px 10px !important; }
          dialog:has(#lulu-rescue-dialog) .popup-controls .menu_button,
          dialog:has(#lulu-rescue-dialog) .popup-button-ok {
            font-size: 12px !important;
            padding: 6px 10px !important;
            white-space: normal !important;
            line-height: 1.3 !important;
          }
        }
      </style>`,
    );

    // 绑定"查看详细差异"的展开/折叠
    $rescueDlg.find("#lulu-single-diff-toggle").on("click", function () {
      const $panel = $rescueDlg.find("#lulu-single-diff-panel");
      const $icon = $(this).find("i.fa-chevron-down, i.fa-chevron-up");
      if ($panel.is(":visible")) {
        $panel.slideUp(150);
        $icon.removeClass("fa-chevron-up").addClass("fa-chevron-down");
      } else {
        $panel.slideDown(150);
        $icon.removeClass("fa-chevron-down").addClass("fa-chevron-up");
      }
    });
    // 绑定内部每个改动条目的展开/折叠
    luluBindDiffToggle($rescueDlg);

    const btnRes = await SillyTavern.callGenericPopup(
      $rescueDlg,
      SillyTavern.POPUP_TYPE.TEXT,
      "",
      {
        okButton: "暂不处理",
        customButtons: [
          {
            text: "另建原版并绑定",
            result: 888,
            classes: ["btn-success"],
          },
          {
            text: "覆盖本地此书",
            result: 999,
            classes: ["btn-danger"],
          },
        ],
      },
    );

    if (btnRes === 888) {
      // ✨ 先查：这张卡的这本原版，之前是不是已经被批量提取过了？
      const alreadyExtracted = window.luluGetExtractedName(avatar, bookName);
      let reuseName = null;
      if (alreadyExtracted && getWorldbookNames().includes(alreadyExtracted)) {
        // 已有提取过的书，且还在 → 核对内容是否就是卡内原版
        try {
          const existEntries = await getWorldbook(alreadyExtracted);
          if (luluBookSig(existEntries) === luluBookSig(converted)) {
            reuseName = alreadyExtracted;
          }
        } catch (e) {}
      }

      if (reuseName) {
        // 复用已提取的书，不再重复建，只需要绑上去
        const useIt = await SillyTavern.callGenericPopup(
          `检测到之前已经把这张卡的原版提取成了 <strong>[${reuseName}]</strong> 啦！<br>直接把它绑给 [${charName}] 就好，无需重复创建~<br><br>要现在绑上去吗？`,
          SillyTavern.POPUP_TYPE.CONFIRM,
        );
        if (useIt === SillyTavern.POPUP_RESULT.AFFIRMATIVE) {
          await withLoadingOverlay(async () => {
            await luluRebindCharBook(bookName, reuseName);
          }, "正在把已提取的原版绑定给当前角色...");
          toastr.success(`已把 [${reuseName}] 绑给 [${charName}]`);
          renderCharView();
        }
      } else {
        // 没提取过（或提取的书已不在/内容对不上）→ 走正常新建流程
        let newName = `${bookName}_卡内原版`;
        let n = 2;
        while (getWorldbookNames().includes(newName))
          newName = `${bookName}_卡内原版${n++}`;
        await withLoadingOverlay(async () => {
          await createWorldbook(newName, converted);
          await luluRebindCharBook(bookName, newName);
        }, "正在提取原版并重新绑定...");
        // 也记个号，保持一致
        window.luluMarkExtracted(avatar, bookName, newName);
        toastr.success(
          `✨ 救援成功！已创建 [${newName}] 并绑给 [${charName}]，本地旧书原样保留~`,
        );
        renderCharView();
      }
    } else if (btnRes === 2) {
      if (isWbLocked(bookName))
        return toastr.warning(`🔒 [${bookName}] 已锁定，无法覆盖哦~`);
      const confirm2 = await SillyTavern.callGenericPopup(
        `再确认一次：覆盖 [${bookName}] 会影响<strong style="color:#ff6b6b;">所有</strong>绑定了这本书的其他角色卡！<br>（旧版会先进回收站，可还原）确定吗？`,
        SillyTavern.POPUP_TYPE.CONFIRM,
      );
      if (confirm2 !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
      await withLoadingOverlay(async () => {
        await moveWbToRecycle(bookName);
        await replaceWorldbook(bookName, converted);
      }, "正在用卡内原版覆盖...");
      toastr.success(`✅ [${bookName}] 已被卡内原版覆盖（旧版已进回收站）~`);
      renderCharView();
    }
  };
  // ========== 【卡内世界书体检/救援】 结束 ==========
  // 角色快照：批量删除
  $ui.find("#wb-btn-char-snap-batch-del").on("click", async () => {
    const charName =
      typeof getCurrentCharacterName === "function"
        ? getCurrentCharacterName()
        : typeof SillyTavern !== "undefined"
          ? SillyTavern.getContext().name2
          : null;
    if (!charName) return toastr.warning("需要先打开某个角色的聊天哦~");

    let vars = getVariables({ type: "global" });
    let charSnaps = vars.wb_char_snapshots;
    if (typeof charSnaps === "string") {
      try {
        charSnaps = JSON.parse(charSnaps);
      } catch (e) {
        charSnaps = {};
      }
    }
    if (!charSnaps || typeof charSnaps !== "object" || Array.isArray(charSnaps))
      charSnaps = {};
    const mySnaps = charSnaps[charName] || {};
    const names = sortCharSnapshotNames(charName, Object.keys(mySnaps));
    if (names.length === 0) return toastr.info("这个角色还没有快照可以删除呢~");

    let listHtml =
      '<div style="max-height:50vh; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">';
    names.forEach((name) => {
      const safeN = encodeURIComponent(name);
      listHtml += `<label style="display:flex; align-items:center; gap:8px; padding:8px 10px; background:var(--SmartThemeBotMesColor); border:1px solid var(--SmartThemeBorderColor); border-radius:6px; cursor:pointer;">
        <input type="checkbox" class="lulu-csnap-del-chk" data-name="${safeN}" style="accent-color:#ff6b6b; flex-shrink:0;">
        <span style="flex:1; min-width:0; word-break:break-all;"><i class="fa-solid fa-camera-retro" style="color:var(--SmartThemeQuoteColor); margin-right:4px;"></i>${name}</span>
      </label>`;
    });
    listHtml += "</div>";

    const dialogHtml = `<div style="padding:6px; min-width:300px; max-width:440px; text-align:left;">
      <h3 style="margin-top:0; color:#ff6b6b; border-bottom:2px solid var(--SmartThemeBorderColor); padding-bottom:10px;"><i class="fa-solid fa-trash-can"></i> 批量删除角色快照 <span style="font-size:12px; font-weight:normal; color:gray;">${charName}</span></h3>
      <div style="display:flex; gap:8px; margin-bottom:10px;">
        <button id="lulu-csnap-del-selall" class="menu_button interactable btn-success wb-nowrap-btn" style="margin:0; padding:6px 12px; font-size:12px; border:none;"><i class="fa-solid fa-check-double"></i> 全选</button>
        <button id="lulu-csnap-del-deselall" class="menu_button interactable btn-secondary wb-nowrap-btn" style="margin:0; padding:6px 12px; font-size:12px;"><i class="fa-regular fa-square"></i> 全不选</button>
      </div>
      ${listHtml}
    </div>`;

    const $dlg = $(dialogHtml);
    $dlg
      .attr("id", "lulu-csnap-del-dialog")
      .prepend(
        `<style>${buildPopupThemeCSS("dialog:has(#lulu-csnap-del-dialog)")}</style>`,
      );
    $dlg.find("#lulu-csnap-del-selall").on("click", () => {
      $dlg.find(".lulu-csnap-del-chk").prop("checked", true);
    });
    $dlg.find("#lulu-csnap-del-deselall").on("click", () => {
      $dlg.find(".lulu-csnap-del-chk").prop("checked", false);
    });

    const res = await SillyTavern.callGenericPopup(
      $dlg,
      SillyTavern.POPUP_TYPE.CONFIRM,
      "",
      { okButton: "删除选中", cancelButton: "取消" },
    );
    if (res !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;

    const toDelete = [];
    $dlg.find(".lulu-csnap-del-chk:checked").each(function () {
      toDelete.push(decodeURIComponent($(this).attr("data-name")));
    });
    if (toDelete.length === 0) return toastr.info("你没有勾选任何快照哦~");

    updateVariablesWith(
      (v) => {
        if (typeof v.wb_char_snapshots === "string") {
          try {
            v.wb_char_snapshots = JSON.parse(v.wb_char_snapshots);
          } catch (e) {
            v.wb_char_snapshots = {};
          }
        }
        if (v.wb_char_snapshots && v.wb_char_snapshots[charName]) {
          toDelete.forEach((n) => delete v.wb_char_snapshots[charName][n]);
        }
        return v;
      },
      { type: "global" },
    );
    toastr.success(`已删除 ${toDelete.length} 个角色快照~`);
    renderCharView();
  });
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
    // ===== LULU 新增：当前聊天世界书绑定逻辑 开始 =====
    const luluRenderChatBindSection = () => {
      // 构建/获取聊天世界书区块
      let chatSec = $ui.find("#lulu-assoc-chat-section");
      const assocScroll = $ui
        .find("#wb-assoc-view > .scrollableInnerFull")
        .first();
      if (!assocScroll.length) return;

      if (chatSec.length === 0) {
        chatSec =
          $(`<div id="lulu-assoc-chat-section" style="background: rgba(0,0,0,0.1); border: 1px solid var(--SmartThemeBorderColor); border-radius: 6px; padding: 12px;">
        <h3 style="margin-top:0; font-size:14px;"><i class="fa-solid fa-comment-dots" style="color:#4dabf7;"></i> 💬 当前聊天已绑定的世界书</h3>
        <div style="font-size:12px; color:gray; margin-bottom:10px;"><span id="wb-assoc-chat-name">正在检测当前聊天...</span> * 聊天世界书只会影响当前这个聊天，不会动到其它聊天哦。</div>
        <div id="wb-assoc-chat-list" style="display:flex; flex-wrap:wrap; gap:8px;"></div>
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--SmartThemeBorderColor);">
          <div style="font-size:12px; font-weight:bold; color:var(--SmartThemeQuoteColor); margin-bottom:6px;">🔍 搜索并绑定一本世界书：</div>
          <input type="text" id="wb-assoc-chat-add-search" class="text_pole" placeholder="🔍 搜索想绑定给当前聊天的世界书..." style="width:100%; box-sizing:border-box; padding: 8px; margin-bottom:6px;">
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <select id="wb-assoc-chat-add-sel" class="wb-input-dt" style="flex:1; min-width:200px; padding: 8px;"></select>
            <button id="wb-assoc-chat-add-btn" class="menu_button interactable btn-primary wb-nowrap-btn" style="margin:0; padding:8px 12px; border:none; font-size:13px; flex-shrink:0;"><i class="fa-solid fa-plus"></i> 绑定给当前聊天</button>
          </div>
        </div>
      </div>`);
        assocScroll.append(chatSec);
      }

      const ctx2 =
        typeof SillyTavern !== "undefined"
          ? SillyTavern.getContext()
          : typeof getContext === "function"
            ? getContext()
            : {};
      const meta2 =
        ctx2.chatMetadata ||
        (typeof chat_metadata !== "undefined" ? chat_metadata : null);

      if (!meta2) {
        $ui.find("#wb-assoc-chat-name").text("未打开聊天");
        $ui
          .find("#wb-assoc-chat-list")
          .html(
            '<div style="color:gray; font-size:13px; padding:4px;">当前没有打开任何聊天~</div>',
          );
        return;
      }

      const chatId =
        (typeof getCurrentChatId === "function"
          ? getCurrentChatId()
          : ctx2.currentChatId) || "当前会话";
      const allWbs =
        typeof getWorldbookNames === "function" ? getWorldbookNames() : [];
      const currentChatWb = meta2["world_info"] || "";
      $ui
        .find("#wb-assoc-chat-name")
        .text(`当前聊天：${chatId}（${currentChatWb || "未绑定"}）`);

      const $chatList = $ui.find("#wb-assoc-chat-list").empty();

      if (currentChatWb) {
        const $bindItem =
          $(`<div style="display:inline-flex; align-items:center; gap:8px; background:var(--SmartThemeBotMesColor); border:1px solid #4dabf7; padding:6px 12px; border-radius:4px; transition:0.2s;">
        <span style="font-weight:bold; font-size:14px; color:#4dabf7; cursor:pointer; display:flex; align-items:center;" class="wb-assoc-entry-edit" title="点击编辑内容"><i class="fa-solid fa-comment-dots" style="margin-right:5px;"></i> ${currentChatWb}</span>
        <div class="hover-red" style="cursor:pointer; color:gray; margin-left:4px;" title="解绑当前聊天的世界书"><i class="fa-solid fa-xmark"></i></div>
      </div>`);
        $bindItem
          .find(".wb-assoc-entry-edit")
          .on("click", () =>
            openEntryTuneView(currentChatWb, "#wb-assoc-view"),
          );
        $bindItem.find(".hover-red").hover(
          function () {
            $(this).css("color", "#ff6b6b");
          },
          function () {
            $(this).css("color", "gray");
          },
        );
        $bindItem.find(".hover-red").on("click", async () => {
          const confirm = await SillyTavern.callGenericPopup(
            `确认解除当前聊天的世界书 [${currentChatWb}] 绑定吗？`,
            SillyTavern.POPUP_TYPE.CONFIRM,
          );
          if (confirm !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
          try {
            delete meta2["world_info"];
            if (typeof ctx2.saveMetadata === "function")
              await ctx2.saveMetadata();
            else if (typeof saveMetadata === "function") await saveMetadata();
            $(".chat_lorebook_button").removeClass("world_set");
            toastr.success("已解除当前聊天的世界书绑定~");
            renderAssocView();
          } catch (e) {
            toastr.error("解绑失败：" + e.message);
          }
        });
        $chatList.append($bindItem);
      } else {
        $chatList.html(
          '<div style="color:gray; font-size:13px; padding:4px;">当前聊天还没有绑定世界书呢~</div>',
        );
      }

      // 更新可绑定下拉列表
      const chatUnbounds = allWbs.filter((w) => w !== currentChatWb);
      const updateChatSelectOptions = () => {
        const kw = $ui
          .find("#wb-assoc-chat-add-search")
          .val()
          .trim()
          .toLowerCase();
        const $sel = $ui.find("#wb-assoc-chat-add-sel").empty();
        const filtered = kw
          ? chatUnbounds.filter((w) => w.toLowerCase().includes(kw))
          : chatUnbounds;
        if (filtered.length > 0) {
          filtered.forEach((w) =>
            $sel.append(`<option value="${w}">${w}</option>`),
          );
          $sel.prop("disabled", false);
          $ui.find("#wb-assoc-chat-add-btn").prop("disabled", false);
        } else {
          $sel.append('<option value="">没有符合条件的可绑定项...</option>');
          $sel.prop("disabled", true);
          $ui.find("#wb-assoc-chat-add-btn").prop("disabled", true);
        }
      };
      $ui
        .find("#wb-assoc-chat-add-search")
        .off("input")
        .on("input", updateChatSelectOptions);
      updateChatSelectOptions();

      // 绑定按钮
      $ui
        .find("#wb-assoc-chat-add-btn")
        .off("click")
        .on("click", async () => {
          const wb = $ui.find("#wb-assoc-chat-add-sel").val();
          if (!wb) return;
          if (currentChatWb) {
            const overRes = await SillyTavern.callGenericPopup(
              `当前聊天已经绑定了 [${currentChatWb}]。要把它替换成 [${wb}] 吗？`,
              SillyTavern.POPUP_TYPE.CONFIRM,
            );
            if (overRes !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
          }
          try {
            meta2["world_info"] = wb;
            if (typeof ctx2.saveMetadata === "function")
              await ctx2.saveMetadata();
            else if (typeof saveMetadata === "function") await saveMetadata();
            $(".chat_lorebook_button").addClass("world_set");
            toastr.success(`✨ 当前聊天已绑定 [${wb}]！`);
            renderAssocView();
          } catch (e) {
            toastr.error("绑定失败：" + e.message);
          }
        });
    };
    luluRenderChatBindSection();
    // ===== LULU 新增：当前聊天世界书绑定逻辑 结束 =====
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
      const renderCharAddList = () => {
        const kw = $ui
          .find("#wb-assoc-char-add-search")
          .val()
          .trim()
          .toLowerCase();
        const $list = $ui.find("#wb-assoc-char-add-list").empty();
        const filteredWbs = kw
          ? unbounds.filter((w) => w.toLowerCase().includes(kw))
          : unbounds;
        if (filteredWbs.length === 0) {
          $list.html(
            '<div style="color:gray; font-size:12px; padding:8px; text-align:center;">没有符合条件的可绑定项...</div>',
          );
          $ui.find("#wb-assoc-char-add-btn").prop("disabled", true);
          return;
        }
        filteredWbs.forEach((w) => {
          const $label = $(
            `<label style="display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:4px; cursor:pointer; font-size:13px; word-break:break-all;">
              <input type="checkbox" class="wb-assoc-char-check" value="${w}" style="accent-color:var(--SmartThemeQuoteColor); flex-shrink:0; transform:scale(1.1);">
              <span style="flex:1; min-width:0;">${w}</span>
            </label>`,
          );
          $list.append($label);
        });
        $ui.find("#wb-assoc-char-add-btn").prop("disabled", false);
      };
      $ui
        .find("#wb-assoc-char-add-search")
        .off("input")
        .on("input", renderCharAddList);
      renderCharAddList();
    }
    // ===== LULU 新增：调整关联视图区块顺序 开始 =====
    try {
      const assocScroll = $ui
        .find("#wb-assoc-view > .scrollableInnerFull")
        .first();
      if (assocScroll.length) {
        const charSection = assocScroll.children().has("#wb-assoc-char-list");
        const personaSection = assocScroll
          .children()
          .has("#wb-assoc-user-list");
        const chatSection = assocScroll.children("#lulu-assoc-chat-section");
        if (charSection.length && personaSection.length && chatSection.length) {
          assocScroll
            .append(charSection)
            .append(chatSection)
            .append(personaSection);
        }
      }
    } catch (e) {
      console.error("Lulu 关联视图排序失败", e);
    }
    // ===== LULU 新增：调整关联视图区块顺序 结束 =====
  };
  $ui.find("#wb-btn-rescue-embedded").on("click", luluRescueEmbeddedLorebook);
  // ========== 【全库污染扫描】自选批量（不含跨角色改绑，安全版）开始 ==========
  // ===== 新增：自选角色弹窗 =====
  const luluSelectCharactersDialog = async () => {
    const ctx =
      typeof SillyTavern !== "undefined" ? SillyTavern.getContext() : {};
    const allChars =
      ctx.characters ||
      (typeof SillyTavern !== "undefined" ? SillyTavern.characters : []) ||
      [];
    if (allChars.length === 0) {
      await SillyTavern.callGenericPopup(
        "没有找到任何角色卡数据...",
        SillyTavern.POPUP_TYPE.TEXT,
      );
      return null;
    }

    const selectedAvatars = new Set();
    // 解析时间
    const parseTime = (val) => {
      if (val === undefined || val === null) return 0;
      const num = Number(val);
      if (!isNaN(num)) return num;
      const parsed = Date.parse(val);
      return isNaN(parsed) ? 0 : parsed;
    };

    // 排序+过滤
    const getSortedFiltered = (kw, sortMode) => {
      let list = allChars.filter((c) => c && c.avatar);
      if (kw) {
        const lowerKw = kw.toLowerCase();
        list = list.filter(
          (c) =>
            (c.name || "").toLowerCase().includes(lowerKw) ||
            (c.avatar || "").toLowerCase().includes(lowerKw),
        );
      }
      if (sortMode === "name_asc" || sortMode === "name_desc") {
        list.sort((a, b) => {
          const na = (a.name || "").toLowerCase();
          const nb = (b.name || "").toLowerCase();
          if (sortMode === "name_asc") return na.localeCompare(nb, "zh-CN");
          return nb.localeCompare(na, "zh-CN");
        });
      } else if (sortMode === "import_asc" || sortMode === "import_desc") {
        list.sort((a, b) => {
          const ta = parseTime(a.create_date || a.created);
          const tb = parseTime(b.create_date || b.created);
          if (sortMode === "import_asc") return ta - tb;
          return tb - ta;
        });
      }
      return list;
    };

    const dialogHtml = `
      <div style="padding:6px; font-family:sans-serif; min-width:320px; max-width:560px; text-align:left;">
        <h3 style="margin-top:0; color:var(--SmartThemeQuoteColor); border-bottom:2px solid var(--SmartThemeBorderColor); padding-bottom:10px;">
          <i class="fa-solid fa-user-astronaut"></i> 选择要扫描的角色卡
          <span style="font-size:12px; font-weight:normal; color:gray;">(全库对照)</span>
        </h3>
        <div style="display:flex; gap:6px; margin-bottom:8px; flex-wrap:wrap;">
          <input type="text" id="lulu-scan-char-search" class="text_pole" placeholder="🔍 搜索角色名或文件名..." style="flex:1; min-width:150px; box-sizing:border-box; padding:8px; font-size:13px; border-radius:4px;">
          <select id="lulu-scan-char-sort" class="wb-input-dt" style="width:auto; padding:8px; font-size:12.5px; border-radius:4px; flex-shrink:0;">
            <option value="import_asc">📅 导入时间 ↑</option>
            <option value="import_desc">📅 导入时间 ↓</option>
            <option value="name_asc">🔤 名称 A-Z</option>
            <option value="name_desc">🔡 名称 Z-A</option>
          </select>
        </div>
        <div style="display:flex; gap:6px; margin-bottom:10px;">
          <button id="lulu-scan-char-selall" class="menu_button interactable btn-success wb-nowrap-btn" style="margin:0; padding:6px 12px; font-size:12px; border:none;">全选当前</button>
          <button id="lulu-scan-char-deselall" class="menu_button interactable btn-secondary wb-nowrap-btn" style="margin:0; padding:6px 12px; font-size:12px;">清空当前</button>
        </div>
        <div id="lulu-scan-char-list" style="max-height:50vh; overflow-y:auto; display:flex; flex-direction:column; gap:6px; padding:4px;"></div>
        <div style="font-size:11px; color:gray; margin-top:8px;">* 勾选后点击"开始扫描"，只检查选中的角色卡</div>
      </div>`;

    const $dlg = $(dialogHtml);
    $dlg
      .attr("id", "lulu-scan-char-select-dialog")
      .prepend(
        `<style>${buildPopupThemeCSS("dialog:has(#lulu-scan-char-select-dialog)")}</style>`,
      );

    const renderList = (kw, sortMode) => {
      const list = getSortedFiltered(kw, sortMode);
      const $list = $dlg.find("#lulu-scan-char-list").empty();
      if (list.length === 0) {
        $list.html(
          '<div style="color:gray; text-align:center; padding:20px;">没有匹配的角色卡</div>',
        );
        return;
      }
      list.forEach((c) => {
        const avatar = c.avatar;
        const name = c.name || "未知角色";
        const isChecked = selectedAvatars.has(avatar);
        const $label = $(`
          <label style="display:flex; align-items:center; gap:8px; padding:8px 10px; background:var(--SmartThemeBotMesColor); border:1px solid var(--SmartThemeBorderColor); border-radius:6px; cursor:pointer;">
            <input type="checkbox" class="lulu-scan-char-chk" data-avatar="${avatar}" ${isChecked ? "checked" : ""} style="accent-color: var(--SmartThemeQuoteColor); flex-shrink:0;">
            <span style="flex:1; min-width:0; word-break:break-all;"><i class="fa-solid fa-robot" style="color:var(--SmartThemeQuoteColor); margin-right:4px;"></i>${name}</span>
            <span style="font-size:10px; color:gray; white-space:nowrap; max-width:80px; overflow:hidden; text-overflow:ellipsis;">${avatar}</span>
          </label>
        `);
        const $chk = $label.find(".lulu-scan-char-chk");
        $chk.on("change", function () {
          const a = $(this).attr("data-avatar");
          if ($(this).is(":checked")) selectedAvatars.add(a);
          else selectedAvatars.delete(a);
        });
        $list.append($label);
      });
    };

    // 初始化渲染
    renderList("", $dlg.find("#lulu-scan-char-sort").val());

    // 搜索事件
    $dlg.find("#lulu-scan-char-search").on("input", function () {
      renderList($(this).val(), $dlg.find("#lulu-scan-char-sort").val());
    });

    // 排序事件
    $dlg.find("#lulu-scan-char-sort").on("change", function () {
      renderList($dlg.find("#lulu-scan-char-search").val(), $(this).val());
    });

    // 全选当前（只勾选当前过滤列表中的角色）
    $dlg.find("#lulu-scan-char-selall").on("click", () => {
      const kw = $dlg.find("#lulu-scan-char-search").val();
      const sortMode = $dlg.find("#lulu-scan-char-sort").val();
      const list = getSortedFiltered(kw, sortMode);
      list.forEach((c) => selectedAvatars.add(c.avatar));
      renderList(kw, sortMode);
    });

    // 清空当前（只取消当前过滤列表中的角色）
    $dlg.find("#lulu-scan-char-deselall").on("click", () => {
      const kw = $dlg.find("#lulu-scan-char-search").val();
      const sortMode = $dlg.find("#lulu-scan-char-sort").val();
      const list = getSortedFiltered(kw, sortMode);
      list.forEach((c) => selectedAvatars.delete(c.avatar));
      renderList(kw, sortMode);
    });

    const result = await SillyTavern.callGenericPopup(
      $dlg,
      SillyTavern.POPUP_TYPE.CONFIRM,
      "",
      { okButton: "开始扫描", cancelButton: "取消" },
    );
    if (result !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return null;

    // 收集所有选中的角色
    let selected = allChars.filter(
      (c) => c && c.avatar && selectedAvatars.has(c.avatar),
    );
    if (selected.length === 0) {
      await SillyTavern.callGenericPopup(
        "你还没有勾选任何角色卡呢，已取消扫描~",
        SillyTavern.POPUP_TYPE.TEXT,
      );
      return null;
    }
    return selected;
  };
  // ===== 自选角色弹窗结束 =====

  // 全库对照扫描缓存（会话级 + localStorage 持久化指纹）
  // 强制从底层读取世界书，避免读到未加载/旧缓存
  const luluReadLocalWbRaw = async (name) => {
    try {
      const res = await $.ajax({
        url: "/api/worldinfo/get",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ name: name }),
      });
      let raw = [];
      if (Array.isArray(res)) raw = res;
      else if (res && res.entries)
        raw = Array.isArray(res.entries)
          ? res.entries
          : Object.values(res.entries);
      else raw = Object.values(res || {});
      // 统一成带 name/content 的数组，供 luluBookSig 用
      return raw.map((e) => ({
        name: e.comment || e.name || "",
        comment: e.comment || e.name || "",
        content: e.content || "",
      }));
    } catch (e) {
      return null;
    }
  };
  $ui.find("#wb-btn-batch-scan-pollution").on("click", async () => {
    let suspects = [];

    const now = Date.now();
    const cacheValid =
      window.luluScanCache && now - window.luluScanCacheTime < 30 * 60 * 1000;

    let useCache = false;
    if (cacheValid) {
      const cacheRes = await SillyTavern.callGenericPopup(
        `检测到约 <strong>${Math.round((now - window.luluScanCacheTime) / 60000)}</strong> 分钟前刚扫描过全库哦~<br><br>是否直接使用上次的扫描结果？（更快）<br><span style="font-size:12px;color:gray;">如果你刚改动过角色卡，建议选“重新扫描”。</span>`,
        SillyTavern.POPUP_TYPE.TEXT,
        "",
        {
          okButton: "重新扫描",
          customButtons: [
            { text: "使用缓存结果", result: 666, classes: ["btn-success"] },
          ],
        },
      );
      if (cacheRes === 666) useCache = true;
    }

    if (useCache) {
      suspects = window.luluScanCache;
    } else {
      // 🆕 自选角色（取消则返回，不扫描）
      const selectedChars = await luluSelectCharactersDialog();
      if (selectedChars === null) return;

      const scanOk = await withLoadingOverlay(async () => {
        const ctx =
          typeof SillyTavern !== "undefined" ? SillyTavern.getContext() : {};
        const allChars = selectedChars; // 只扫描用户选中的角色
        const localWbNames = getWorldbookNames();
        const $sub = $ui.find("#wb-loading-sub").show();
        for (let idx = 0; idx < allChars.length; idx++) {
          const c = allChars[idx];
          if (!c || !c.avatar) continue;
          $sub.text(`${idx + 1} / ${allChars.length}`);

          let embedded = null;
          try {
            embedded = await luluReadEmbeddedBook(c.avatar);
          } catch (e) {
            embedded = null;
          }
          if (!embedded || !embedded.name) continue;

          const bookName = embedded.name;
          if (!localWbNames.includes(bookName)) continue;

          // 🚫 已手动标记“跳过全库对照”的世界书，直接跳过
          if (isScanSkipped(bookName)) continue;

          const converted = luluConvertEmbedded(embedded.entries);
          let localEntries = await luluReadLocalWbRaw(bookName);
          if (localEntries === null) continue;

          if (luluBookSig(localEntries) === luluBookSig(converted)) continue;
          suspects.push({
            avatar: c.avatar,
            charName: c.name || "未知角色",
            bookName: bookName,
            embeddedCount: converted.length,
            localCount: localEntries.length,
            converted: converted,
            localEntries: localEntries,
          });
        }
      }, "正在扫描选中的角色卡的内嵌世界书...");

      if (scanOk === false) return;

      // 保存到缓存
      window.luluScanCache = suspects;
      window.luluScanCacheTime = Date.now();
    }

    // 🚫 过滤掉手动标记“跳过全库对照”的世界书
    suspects = suspects.filter((s) => !isScanSkipped(s.bookName));

    if (suspects.length === 0) {
      return SillyTavern.callGenericPopup(
        `<div style="text-align:center; padding:20px; line-height:1.7;">
          ✅ <strong style="color:#51cf66;">全库检查完毕，没有发现污染风险！</strong><br><br>
          所有带内嵌世界书的角色卡，其内容都和本地同名世界书一致，非常干净~ (๑>؂<๑)
        </div>`,
        SillyTavern.POPUP_TYPE.TEXT,
        "",
        { okButton: "太好啦" },
      );
    }

    const escHtml = (s) =>
      String(s).replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");

    let rowsHtml = "";
    suspects.forEach((s, i) => {
      rowsHtml += `
        <div class="lulu-scan-row" data-idx="${i}" style="border:1px solid var(--SmartThemeBorderColor); border-radius:6px; padding:10px; margin-bottom:8px; background:var(--SmartThemeBotMesColor);">
          <div style="display:flex; align-items:flex-start; gap:8px; flex-wrap:nowrap;">
            <input type="checkbox" class="lulu-scan-chk" data-idx="${i}" style="transform:scale(1.15); flex-shrink:0; margin-top:4px;">
            <div style="flex:1; min-width:0;">
              <div style="font-weight:bold; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><i class="fa-solid fa-robot" style="color:var(--SmartThemeQuoteColor);"></i> ${escHtml(s.charName)}</div>
              <div style="font-size:11.5px; color:gray; margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">📖 内嵌世界书：<strong>${escHtml(s.bookName)}</strong></div>
              <div style="font-size:11.5px; color:#ff6b6b; margin-top:2px;">卡内原版 ${s.embeddedCount} 条 <span style="color:gray;">vs</span> 本地当前 ${s.localCount} 条</div>
              
              <!-- 优化后的操作区 -->
              <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px; padding-top:8px; border-top:1px dashed rgba(125,125,125,0.2);">
                <select class="lulu-scan-action wb-input-dt" data-idx="${i}" style="min-height:44px; padding:8px 10px; font-size:14px; width:100%; box-sizing:border-box; pointer-events:auto; touch-action:manipulation; position:relative; z-index:5; background:var(--SmartThemeBotMesColor)!important; color:var(--SmartThemeBodyColor)!important; border:1px solid var(--SmartThemeBorderColor)!important; border-radius:6px;">
  <option value="extract">📥 另存卡内原版为新书</option>
  <option value="overwrite">⚠️ 危险：覆盖本地旧书</option>
  <option value="skip">🚫 标记跳过全库对照</option>
</select>
                <button class="menu_button interactable btn-primary wb-nowrap-btn lulu-scan-diff" data-idx="${i}" style="margin:0; padding:6px 8px; font-size:12px; border:none; width:100%; justify-content:center;"><i class="fa-solid fa-eye"></i> 查看具体差异</button>
              </div>
            </div>
          </div>
          <div class="lulu-scan-diff-panel" data-idx="${i}" style="display:none; margin-top:8px; padding-top:8px; border-top:1px dashed var(--SmartThemeBorderColor);"></div>
        </div>`;
    });

    const dialogHtml = `
      <div id="lulu-scan-dialog-inner" style="padding:6px; font-family:sans-serif; min-width:320px; max-width:560px; text-align:left;">
        <h3 style="margin-top:0; color:var(--SmartThemeQuoteColor); border-bottom:2px solid var(--SmartThemeBorderColor); padding-bottom:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
          <span><i class="fa-solid fa-clock-rotate-left"></i> 全库对照</span>
          <span style="font-size:12px; font-weight:normal; color:gray;">共 ${suspects.length} 处差异</span>
        </h3>
        
        <!-- 使用折叠面板隐藏大段文字 -->
        <details style="background:var(--SmartThemeBotMesColor); border:1px solid var(--SmartThemeBorderColor); border-radius:6px; padding:8px 10px; margin-bottom:10px; font-size:12px; line-height:1.6;">
          <summary style="cursor:pointer; color:var(--SmartThemeQuoteColor); font-weight:bold; outline:none; display:flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-circle-info"></i> 点击查看功能说明与安全提示
          </summary>
          <div style="margin-top:8px; padding-top:8px; border-top:1px dashed var(--SmartThemeBorderColor); color:var(--SmartThemeBodyColor);">
            发现这些卡原本自带的世界书，和本地目前绑定的同名书<strong style="color:var(--SmartThemeQuoteColor);">内容不一样</strong>。<br>
            <span style="color:gray;">你自己改过的书也会列出来，属正常现象，按需处理即可。</span><br>
            <span style="color:#51cf66; margin-top:4px; display:block;"><i class="fa-solid fa-shield-halved"></i> 本功能只操作世界书本身，不改动任何角色卡的绑定，安全放心~</span>
          </div>
        </details>

        <!-- 搜索栏与全选按钮整合在一行 -->
        <div style="display:flex; gap:6px; margin-bottom:10px; align-items:center;">
          <input type="text" id="lulu-scan-search" class="text_pole" placeholder="🔍 搜索角色或书名..." style="flex:1; min-width:0; box-sizing:border-box; padding:7px; font-size:12.5px; border-radius:4px;">
          <button id="lulu-scan-selall" class="menu_button interactable btn-success wb-nowrap-btn" style="margin:0; padding:7px 12px; font-size:12px; border:none; flex-shrink:0;">全选</button>
          <button id="lulu-scan-deselall" class="menu_button interactable btn-secondary wb-nowrap-btn" style="margin:0; padding:7px 12px; font-size:12px; flex-shrink:0;">清空</button>
        </div>
        
        <div id="lulu-scan-list-wrap" style="max-height:50vh; overflow-y:auto; -webkit-overflow-scrolling:touch; padding-right:4px;">${rowsHtml}</div>
      </div>`;

    const $dlg = $(dialogHtml);
    $dlg
      .attr("id", "lulu-scan-dialog")
      .prepend(
        `<style>${buildPopupThemeCSS("dialog:has(#lulu-scan-dialog)")}</style>`,
      );

    // 搜索功能绑定
    $dlg.find("#lulu-scan-search").on("input", function () {
      const kw = $(this).val().toLowerCase();
      $dlg.find(".lulu-scan-row").each(function () {
        const text = $(this).text().toLowerCase();
        $(this).toggle(text.includes(kw));
      });
    });

    $dlg.find("#lulu-scan-selall").on("click", () => {
      // 只有当前搜索可见的项才会被全选
      $dlg.find(".lulu-scan-row:visible .lulu-scan-chk").prop("checked", true);
    });
    $dlg.find("#lulu-scan-deselall").on("click", () => {
      $dlg.find(".lulu-scan-row:visible .lulu-scan-chk").prop("checked", false);
    });

    // 简单的逐行差异高亮（用于同名条目正文对比）
    const luluDiffText = (oldStr, newStr) => {
      const oldLines = String(oldStr || "").split("\n");
      const newLines = String(newStr || "").split("\n");
      const oldSet = new Set(oldLines.map((l) => l.trim()));
      const newSet = new Set(newLines.map((l) => l.trim()));
      let oldHtml = "";
      let newHtml = "";
      oldLines.forEach((l) => {
        const removed = !newSet.has(l.trim()) && l.trim() !== "";
        oldHtml += `<div style="padding:1px 4px; ${removed ? "background:rgba(255,107,107,0.25); border-radius:2px;" : ""}">${escHtml(l) || " "}</div>`;
      });
      newLines.forEach((l) => {
        const added = !oldSet.has(l.trim()) && l.trim() !== "";
        newHtml += `<div style="padding:1px 4px; ${added ? "background:rgba(81,207,102,0.25); border-radius:2px;" : ""}">${escHtml(l) || " "}</div>`;
      });
      return { oldHtml, newHtml };
    };

    $dlg.find(".lulu-scan-diff").on("click", function () {
      const i = parseInt($(this).attr("data-idx"));
      const s = suspects[i];
      const $panel = $dlg.find(`.lulu-scan-diff-panel[data-idx="${i}"]`);
      if ($panel.is(":visible")) {
        $panel.slideUp(120);
        return;
      }
      const html = luluBuildDiffHtml(s.converted, s.localEntries, "scan" + i);
      $panel.html(html);
      luluBindDiffToggle($panel);
      $panel.slideDown(120);
    });

    const result = await SillyTavern.callGenericPopup(
      $dlg,
      SillyTavern.POPUP_TYPE.CONFIRM,
      "",
      { okButton: "开始批量处理", cancelButton: "取消" },
    );
    if (result !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;

    const tasks = [];
    $dlg.find(".lulu-scan-chk:checked").each(function () {
      const i = parseInt($(this).attr("data-idx"));
      const action = $dlg.find(`.lulu-scan-action[data-idx="${i}"]`).val();
      tasks.push({ suspect: suspects[i], action });
    });

    if (tasks.length === 0) {
      return toastr.info("你没有勾选任何卡呢，没有进行任何操作~");
    }

    const hasOverwrite = tasks.some((t) => t.action === "overwrite");
    if (hasOverwrite) {
      const c2 = await SillyTavern.callGenericPopup(
        `你勾选的卡里有选择「覆盖本地旧书」的哦！<br>覆盖会影响<strong style="color:#ff6b6b;">所有</strong>绑定了这些书的角色卡。<br>（这属于修改世界书内容，不会改动角色卡的绑定关系）<br><br>确定继续吗？`,
        SillyTavern.POPUP_TYPE.CONFIRM,
      );
      if (c2 !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
    }

    let extractCount = 0;
    let overwriteCount = 0;
    let skipCount = 0;
    const resultLines = [];
    const extractedNames = [];

    await withLoadingOverlay(async () => {
      const $sub = $ui.find("#wb-loading-sub").show();
      let done = 0;
      for (const t of tasks) {
        done++;
        $sub.text(`${done} / ${tasks.length}`);
        const s = t.suspect;

        try {
          if (t.action === "extract") {
            let newName = `${s.bookName}_卡内原版`;
            let n = 2;
            while (getWorldbookNames().includes(newName))
              newName = `${s.bookName}_卡内原版${n++}`;
            await createWorldbook(newName, s.converted);
            // ✨ 记号：这张卡的这本原版，已经提取成了 newName
            window.luluMarkExtracted(s.avatar, s.bookName, newName);
            extractCount++;
            extractedNames.push({ char: s.charName, book: newName });
            resultLines.push(
              `📗 [${s.charName}] 的卡内原版已另存为新书 [${newName}]`,
            );
          } else if (t.action === "overwrite") {
            await replaceWorldbook(s.bookName, s.converted);
            overwriteCount++;
            resultLines.push(`✅ [${s.bookName}] 已用卡内原版覆盖`);
          } else if (t.action === "skip") {
            // 🚫 标记跳过全库对照（和主界面眼睛按钮效果一样）
            if (!isScanSkipped(s.bookName)) {
              const skipList = getScanSkipList();
              skipList.push(s.bookName);
              saveScanSkipList(skipList);
              skipCount++;
              resultLines.push(`🚫 [${s.bookName}] 已标记跳过全库对照`);
            } else {
              resultLines.push(
                `🔕 [${s.bookName}] 已在跳过列表中，无需重复标记`,
              );
            }
          }
        } catch (e) {
          resultLines.push(`❌ [${s.charName}] 处理失败：${e.message}`);
        }
      }
    }, "正在批量处理，请稍候...");

    // 结果汇报 + 温馨提示
    let tipHtml = "";
    if (extractCount > 0) {
      tipHtml = `
        <div style="margin-top:12px; padding:10px; background:rgba(252,196,25,0.1); border:1px dashed #fcc419; border-radius:6px; font-size:12px; line-height:1.6;">
          💡 <strong style="color:#fcc419;">提取的新书还没有绑到角色身上哦</strong>（跨角色改绑不安全，所以只帮你另存了）。<br>
          想让某张卡用回它的原版，请<strong>打开那张卡的聊天</strong>，然后：<br>
          方法一：用「卡内世界书体检/救援」按钮（针对当前卡，改绑安全）；<br>
          方法二：在「管理绑定世界书」里手动把新书绑上去。
        </div>`;
    }

    await SillyTavern.callGenericPopup(
      `<div style="text-align:left; line-height:1.7; max-height:55vh; overflow-y:auto;">
        <strong style="color:var(--SmartThemeQuoteColor);">🎉 批量处理完成！</strong><br><br>
        提取新书 ${extractCount} 本，覆盖本地 ${overwriteCount} 本，标记跳过 ${skipCount} 本。<br><br>
        <div style="font-size:12.5px;">${resultLines.map((l) => `<div style="padding:2px 0;">${escHtml(l)}</div>`).join("")}</div>
        ${tipHtml}
      </div>`,
      SillyTavern.POPUP_TYPE.TEXT,
      "",
      { okButton: "完成" },
    );

    renderData();
    renderCharView();
  });
  // ========== 【全库污染扫描】自选批量（不含跨角色改绑，安全版）结束 ==========
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
    const selectedWbs = [];
    $ui.find(".wb-assoc-char-check:checked").each(function () {
      selectedWbs.push($(this).val());
    });
    if (selectedWbs.length === 0)
      return toastr.warning("请先勾选要绑定的世界书哦~");
    let charBooksObj = { primary: null, additional: [] };
    try {
      if (typeof getCharWorldbookNames === "function")
        charBooksObj = getCharWorldbookNames("current") || charBooksObj;
    } catch (e) {}
    const cBooks = [];
    if (charBooksObj.primary) cBooks.push(charBooksObj.primary);
    if (charBooksObj.additional) cBooks.push(...charBooksObj.additional);
    cBooks.push(...selectedWbs);
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
    toastr.success(`成功把 [${selectedWbs.join(", ")}] 绑定给角色卡啦！`);
    $ui.find("#wb-assoc-char-add-search").val("");
    renderAssocView();
  });
  $ui.find("#wb-btn-assoc-cancel").on("click", () => {
    $ui.find("#wb-assoc-view").hide();
    $ui.find("#wb-tab-strip, #wb-char-view").fadeIn(200);
    renderCharView();
  });

  const renderData = async (highlightName = null) => {
    const keyword = $ui.find("#wb-search-input").val().toLowerCase();
    const showUnboundOnly = $ui.find("#wb-filter-unbound").is(":checked");
    const showLockedOnly = $ui.find("#wb-filter-locked").is(":checked");
    const stateFilter = $ui.find("#wb-filter-state").val();
    const sortMode = $ui.find("#wb-sort-select").val();
    const isDeepSearch = $ui.find("#wb-deep-search-toggle").is(":checked");
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

    let filteredWbs = [];
    if (isDeepSearch && keyword) {
      $ui
        .find("#wb-deep-search-toggle")
        .next()
        .html('<i class="fa-solid fa-spinner fa-spin"></i> 翻阅全文中...');
      for (let wb of allWbs) {
        const bindings = globalBindingMapCache[wb] || [];
        if (showUnboundOnly && bindings.length > 0) continue;
        if (stateFilter === "enabled" && !activeWbs.includes(wb)) continue;
        if (stateFilter === "disabled" && activeWbs.includes(wb)) continue;
        if (
          currentSelCat === "unassigned" &&
          Object.values(wCatSettings).some(
            (list) => Array.isArray(list) && list.includes(wb),
          )
        )
          continue;
        else if (
          currentSelCat !== "all" &&
          !(wCatSettings[currentSelCat] || []).includes(wb)
        )
          continue;

        let matchStr = (
          wb +
          " " +
          bindings.map((c) => c.name).join(" ")
        ).toLowerCase();
        let isMatch = matchStr.includes(keyword);

        if (!isMatch) {
          try {
            let entries = await getWorldbook(wb);
            for (let e of entries) {
              let eStr =
                `${e.name || ""} ${(e.strategy?.keys || []).join(" ")} ${e.content || ""}`.toLowerCase();
              if (eStr.includes(keyword)) {
                isMatch = true;
                break;
              }
            }
          } catch (err) {}
        }
        if (isMatch) filteredWbs.push(wb);
      }
      $ui.find("#wb-deep-search-toggle").next().html("🔎 深度搜索正文");
    } else {
      filteredWbs = [...allWbs].filter((wb) => {
        const bindings = globalBindingMapCache[wb] || [];
        if (
          keyword &&
          !(wb + " " + bindings.map((c) => c.name).join(" "))
            .toLowerCase()
            .includes(keyword)
        )
          return false;
        if (showUnboundOnly && bindings.length > 0) return false;
        if (showLockedOnly && !isWbLocked(wb)) return false;
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
      });
    }

    currentVisibleWbs = filteredWbs.sort((a, b) => {
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

      const isActiveWb = activeWbs.includes(wb);
      const wrapperClass = isActiveWb
        ? "wb-item-wrapper wb-global-active"
        : "wb-item-wrapper";

      const $wrapper = $(`<div class="${wrapperClass}"></div>`).attr(
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
          '<input type="checkbox" class="wb-batch-chk" style="margin-top:2px; flex-shrink:0;">',
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
        ).prop("checked", isActiveWb);
        $chk.on("change", async function () {
          const $this = $(this);
          const checked = $this.is(":checked");
          try {
            let current = getGlobalWorldbookNames();
            if (checked) {
              if (!current.includes(wb)) current.push(wb);
            } else {
              current = current.filter((n) => n !== wb);
            }
            await rebindGlobalWorldbooks(current);
            // 不再全量重绘，只更新当前卡片的样式
            const $wrapper = $this.closest(".wb-item-wrapper");
            if ($wrapper.length) {
              if (checked) {
                $wrapper.addClass("wb-global-active");
                $wrapper.find(".wb-name-text").css({
                  "font-weight": "bold",
                  color: "var(--SmartThemeQuoteColor)",
                });
              } else {
                $wrapper.removeClass("wb-global-active");
                $wrapper.find(".wb-name-text").css({
                  "font-weight": "normal",
                  color: "var(--SmartThemeBodyColor)",
                });
              }
            }
          } catch (e) {
            $this.prop("checked", !checked);
            if (typeof toastr !== "undefined")
              toastr.error("切换失败：" + e.message);
          }
        });
      }
      $titleArea.append($chk);

      const statusStyle = isActiveWb
        ? "color: var(--SmartThemeQuoteColor);"
        : "";
      const activeIcon = isActiveWb
        ? `<i class="fa-solid fa-circle-check" style="margin-right:4px;"></i>`
        : "";
      // 🔒 锁定标记：被锁的书在名字前显示一把金锁
      const lockedNow = isWbLocked(wb);
      const lockIcon = lockedNow
        ? `<i class="fa-solid fa-lock" style="margin-right:4px; color:#fcc419;" title="此世界书已锁定，防止误删"></i>`
        : "";

      $titleArea.append(
        `<span class="wb-name-text" style="${statusStyle}" title="${wb}">${lockIcon}${activeIcon}${wb}</span>`,
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
            '<div class="wb-icon-btn hover-blue" title="分类管理抽屉" style="display:none!important;"><i class="fa-solid fa-folder-open"></i></div>',
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
                let allCats = getCategories();
                let myCats = Object.keys(allCats).filter((k) =>
                  allCats[k].includes(wb),
                );

                let rootObj = {};
                try {
                  rootObj = await $.ajax({
                    url: "/api/worldinfo/get",
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify({ name: wb }),
                  });
                } catch (e) {
                  rootObj = { name: wb, entries: {} };
                }

                let entriesRaw =
                  rootObj.entries || rootObj.data?.entries || rootObj;
                let entriesArray = Array.isArray(entriesRaw)
                  ? entriesRaw
                  : Object.values(entriesRaw);

                const entriesDict = {};
                entriesArray.forEach((e) => {
                  // 1. 提取位置信息 (完美兼容原生数字格式与脚本特化格式)
                  let posInt = 4;
                  if (typeof e.position === "number") {
                    posInt = e.position;
                  } else if (e.position && typeof e.position === "object") {
                    let pType = e.position.type;
                    if (pType === "before_character_definition") posInt = 0;
                    else if (pType === "after_character_definition") posInt = 1;
                    else if (pType === "before_example_messages") posInt = 2;
                    else if (pType === "after_example_messages") posInt = 3;
                  }

                  // 2. 提取深度与顺序 (优先读原生属性，读不到再读脚本特化属性)
                  let depthVal =
                    e.depth !== undefined
                      ? e.depth
                      : e.position?.depth !== undefined
                        ? e.position.depth
                        : 4;
                  let orderVal =
                    e.order !== undefined
                      ? e.order
                      : e.insertion_order !== undefined
                        ? e.insertion_order
                        : e.position?.order !== undefined
                          ? e.position.order
                          : 100;

                  // 3. 提取角色深度 (0:系统, 1:用户, 2:助手)
                  let roleVal = 0;
                  if (typeof e.role === "number") {
                    roleVal = e.role;
                  } else if (e.position?.role) {
                    if (e.position.role === "user") roleVal = 1;
                    else if (e.position.role === "assistant") roleVal = 2;
                  }

                  // 4. 提取触发策略
                  let isConstant =
                    e.constant !== undefined
                      ? e.constant
                      : e.strategy?.type === "constant";
                  let isSelective =
                    e.selective !== undefined
                      ? e.selective
                      : e.strategy?.type !== "constant";

                  // 5. 提取关键字
                  let keysArr = [];
                  if (Array.isArray(e.key) && e.key.length > 0) keysArr = e.key;
                  else if (Array.isArray(e.keys) && e.keys.length > 0)
                    keysArr = e.keys;
                  else if (e.strategy?.keys) keysArr = e.strategy.keys;

                  // 6. 提取递归开关
                  let preventIn =
                    e.exclude_recursion ??
                    e.recursion?.prevent_incoming ??
                    false;
                  let preventOut =
                    e.prevent_recursion ??
                    e.recursion?.prevent_outgoing ??
                    false;

                  // 7. 组装为最纯净的原生条目
                  let flatEntry = {
                    ...e, // 保留原生高级参数（概率 probability, 自动化ID, 组权重 groupWeight 等统统无损继承！）
                    comment: e.name || e.comment || "未命名条目",
                    name: e.name || e.comment || "未命名条目",
                    disable: e.enabled === false,
                    enabled: e.enabled !== false,
                    key: keysArr,
                    keys: keysArr,
                    constant: isConstant,
                    selective: isSelective,
                    position: posInt,
                    depth: depthVal,
                    order: orderVal,
                    insertion_order: orderVal,
                    role: roleVal,
                    exclude_recursion: preventIn,
                    prevent_recursion: preventOut,
                  };

                  // 给脚本自用的缓存数据，防止下次读取面板时出错
                  if (!flatEntry.extensions) flatEntry.extensions = {};
                  flatEntry.extensions.lulu_data = {
                    strategy: e.strategy || {
                      type: isConstant ? "constant" : "selective",
                      keys: keysArr,
                    },
                    position: e.position || {
                      type:
                        posInt === 0
                          ? "before_character_definition"
                          : posInt === 1
                            ? "after_character_definition"
                            : posInt === 2
                              ? "before_example_messages"
                              : posInt === 3
                                ? "after_example_messages"
                                : "at_depth",
                      depth: depthVal,
                      order: orderVal,
                      role:
                        roleVal === 1
                          ? "user"
                          : roleVal === 2
                            ? "assistant"
                            : "system",
                    },
                    recursion: e.recursion || {
                      prevent_incoming: preventIn,
                      prevent_outgoing: preventOut,
                    },
                  };

                  let uid = e.uid !== undefined ? e.uid : e.id;
                  if (uid === undefined)
                    uid = Date.now() + Math.floor(Math.random() * 1000000);
                  flatEntry.uid = uid;
                  entriesDict[uid] = flatEntry;
                });

                rootObj.entries = entriesDict;
                rootObj.name = wb;
                rootObj.lulu_categories = myCats;
                rootObj.lulu_entry_groups = getWbUiGroups()[wb] || {};

                const blob = new Blob([JSON.stringify(rootObj, null, 2)], {
                  type: "application/json",
                });
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
                toastr.success(`[${wb}] 已经装进包裹，成功导出啦！`);
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
            // 🚫 全库对照跳过标记
            $(
              `<div class="wb-icon-btn hover-yellow" title="${isScanSkipped(wb) ? "已标记跳过全库对照，点击取消" : "标记为跳过全库对照（全库对照扫描时自动忽略）"}" style="display:none!important; color:${isScanSkipped(wb) ? "#fcc419" : "inherit"}"><i class="fa-solid ${isScanSkipped(wb) ? "fa-eye-slash" : "fa-eye"}"></i></div>`,
            ).on("click", (e) => {
              e.stopPropagation();
              const nowSkipped = toggleScanSkip(wb);
              toastr.success(
                nowSkipped
                  ? `🔕 [${wb}] 已标记跳过全库对照`
                  : `🔔 [${wb}] 已取消标记，重新参与全库对照`,
              );
              renderData(wb);
            }),
          )
          .append(
            // 🔒 锁定/解锁按钮
            $(
              `<div class="wb-icon-btn hover-yellow" title="${lockedNow ? "已锁定，点击解锁" : "锁定此书，防止误删"}" style="color:${lockedNow ? "#fcc419" : "inherit"}"><i class="fa-solid ${lockedNow ? "fa-lock" : "fa-lock-open"}"></i></div>`,
            ).on("click", (e) => {
              e.stopPropagation();
              const nowLocked = toggleWbLock(wb);
              toastr.success(
                nowLocked
                  ? `🔒 [${wb}] 已锁定，之后删除、覆盖导入、重命名都会被拦下哦~`
                  : `🔓 [${wb}] 已解锁。`,
              );
              renderData(wb);
            }),
          )
          .append(
            $(
              '<div class="wb-icon-btn hover-red" title="删除"><i class="fa-solid fa-trash"></i></div>',
            ).on("click", async () => {
              // 🔒 锁定拦截
              if (isWbLocked(wb)) {
                return toastr.warning(
                  `[${wb}] 已被锁定，无法删除哦~ 想删的话请先点旁边的🔒解锁。`,
                );
              }
              if (
                (await SillyTavern.callGenericPopup(
                  `删除 [${wb}] ？会暂时进入回收站，误删可恢复`,
                  SillyTavern.POPUP_TYPE.CONFIRM,
                )) === SillyTavern.POPUP_RESULT.AFFIRMATIVE
              ) {
                await withLoadingOverlay(async () => {
                  await moveWbToRecycle(wb);
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
    const sortedSnapNames = sortSnapshotNames(Object.keys(snapshots));
    sortedSnapNames.forEach((name) => {
      const snapData = snapshots[name];
      const isDetailed =
        !Array.isArray(snapData) && snapData.type === "detailed";
      const wbs = isDetailed
        ? Object.keys(snapData.data)
        : Array.isArray(snapData)
          ? snapData
          : snapData.wbs;
      const $item = $(
        `<div class="lulu-snap-item" data-snapname="${encodeURIComponent(name)}" draggable="true" style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--SmartThemeBotMesColor); border-radius:6px; border:1px solid var(--SmartThemeBorderColor); flex-wrap:wrap; gap:8px; cursor:default;"></div>`,
      );
      // ---- 快照拖拽排序 ----
      $item.on("dragstart", function (e) {
        e.originalEvent.dataTransfer.setData("text/plain", name);
        $(this).addClass("lulu-drag-ghost");
      });
      $item.on("dragend", function () {
        $(this).removeClass("lulu-drag-ghost");
        $ui
          .find(".lulu-drag-over-top, .lulu-drag-over-bottom")
          .removeClass("lulu-drag-over-top lulu-drag-over-bottom");
      });
      $item.on("dragover", function (e) {
        e.preventDefault();
        const rect = this.getBoundingClientRect();
        const isBottom = e.originalEvent.clientY > rect.top + rect.height / 2;
        $(this)
          .removeClass("lulu-drag-over-top lulu-drag-over-bottom")
          .addClass(isBottom ? "lulu-drag-over-bottom" : "lulu-drag-over-top");
      });
      $item.on("dragleave", function () {
        $(this).removeClass("lulu-drag-over-top lulu-drag-over-bottom");
      });
      $item.on("drop", function (e) {
        e.preventDefault();
        $(this).removeClass("lulu-drag-over-top lulu-drag-over-bottom");
        const dragged = e.originalEvent.dataTransfer.getData("text/plain");
        const target = name;
        if (!dragged || dragged === target) return;
        let order = sortSnapshotNames(Object.keys(snapshots));
        const fromIdx = order.indexOf(dragged);
        if (fromIdx === -1) return;
        const rect = this.getBoundingClientRect();
        const isBottom = e.originalEvent.clientY > rect.top + rect.height / 2;
        order.splice(fromIdx, 1);
        let toIdx = order.indexOf(target);
        if (isBottom) toIdx++;
        order.splice(toIdx, 0, dragged);
        setSnapshotOrder(order);
        renderData();
      });
      // ---- 拖拽排序结束 ----
      $item.append(
        `<div style="flex:1; min-width: 150px;"><div style="font-weight:bold;font-size:14px;"><i class="fa-solid fa-grip-vertical lulu-snap-drag-handle" style="cursor:grab; color:gray; margin-right:6px;" title="按住拖拽排序"></i><i class="fa-solid ${isDetailed ? "fa-puzzle-piece" : "fa-box-archive"}" style="color:var(--SmartThemeQuoteColor);"></i> ${name}</div>
<div style="font-size:12px;color:gray;">${isDetailed ? `含 ${Object.values(snapData.data).reduce((a, c) => a + c.length, 0)} 个内容微调` : `含 ${(wbs || []).length} 项设定`}</div></div>`,
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
      // 上移 / 下移按钮（功能8 手机友好）
      const moveSnapshot = (dir) => {
        let order = sortSnapshotNames(Object.keys(snapshots));
        const idx = order.indexOf(name);
        const swapWith = idx + dir;
        if (swapWith < 0 || swapWith >= order.length) return;
        [order[idx], order[swapWith]] = [order[swapWith], order[idx]];
        setSnapshotOrder(order);
        renderData();
      };
      $act.append(
        $(
          '<button class="menu_button interactable wb-nowrap-btn btn-primary" style="margin:0; padding:6px 8px;" title="上移"><i class="fa-solid fa-arrow-up"></i></button>',
        ).on("click", () => moveSnapshot(-1)),
      );
      $act.append(
        $(
          '<button class="menu_button interactable wb-nowrap-btn btn-primary" style="margin:0; padding:6px 8px;" title="下移"><i class="fa-solid fa-arrow-down"></i></button>',
        ).on("click", () => moveSnapshot(1)),
      );
      $act.append(
        $(
          '<button class="menu_button interactable wb-nowrap-btn btn-primary" style="margin:0; padding:6px 10px;" title="编辑项"><i class="fa fa-pen"></i></button>',
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
  // 全局快照批量删除
  $ui.find("#wb-btn-snap-batch-del").on("click", async () => {
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

    const names = sortSnapshotNames(Object.keys(snapshots));
    if (names.length === 0) return toastr.info("还没有任何快照可以删除呢~");

    let listHtml =
      '<div style="max-height:50vh; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">';
    names.forEach((name) => {
      const sData = snapshots[name];
      const isDetailed = !Array.isArray(sData) && sData.type === "detailed";
      const safeName = encodeURIComponent(name);
      listHtml += `<label style="display:flex; align-items:center; gap:8px; padding:8px 10px; background:var(--SmartThemeBotMesColor); border:1px solid var(--SmartThemeBorderColor); border-radius:6px; cursor:pointer;">
        <input type="checkbox" class="lulu-snap-del-chk" data-name="${safeName}" style="accent-color:#ff6b6b; flex-shrink:0;">
        <span style="flex:1; min-width:0; word-break:break-all;"><i class="fa-solid ${isDetailed ? "fa-puzzle-piece" : "fa-box-archive"}" style="color:var(--SmartThemeQuoteColor); margin-right:4px;"></i>${name}</span>
      </label>`;
    });
    listHtml += "</div>";

    const dialogHtml = `<div style="padding:6px; min-width:300px; max-width:440px; text-align:left;">
      <h3 style="margin-top:0; color:#ff6b6b; border-bottom:2px solid var(--SmartThemeBorderColor); padding-bottom:10px;"><i class="fa-solid fa-trash-can"></i> 批量删除快照</h3>
      <div style="display:flex; gap:8px; margin-bottom:10px;">
        <button id="lulu-snap-del-selall" class="menu_button interactable btn-success wb-nowrap-btn" style="margin:0; padding:6px 12px; font-size:12px; border:none;"><i class="fa-solid fa-check-double"></i> 全选</button>
        <button id="lulu-snap-del-deselall" class="menu_button interactable btn-secondary wb-nowrap-btn" style="margin:0; padding:6px 12px; font-size:12px;"><i class="fa-regular fa-square"></i> 全不选</button>
      </div>
      ${listHtml}
    </div>`;

    const $dlg = $(dialogHtml);
    $dlg
      .attr("id", "lulu-snap-del-dialog")
      .prepend(
        `<style>${buildPopupThemeCSS("dialog:has(#lulu-snap-del-dialog)")}</style>`,
      );
    $dlg.find("#lulu-snap-del-selall").on("click", () => {
      $dlg.find(".lulu-snap-del-chk").prop("checked", true);
    });
    $dlg.find("#lulu-snap-del-deselall").on("click", () => {
      $dlg.find(".lulu-snap-del-chk").prop("checked", false);
    });

    const res = await SillyTavern.callGenericPopup(
      $dlg,
      SillyTavern.POPUP_TYPE.CONFIRM,
      "",
      { okButton: "删除选中", cancelButton: "取消" },
    );
    if (res !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;

    const toDelete = [];
    $dlg.find(".lulu-snap-del-chk:checked").each(function () {
      toDelete.push(decodeURIComponent($(this).attr("data-name")));
    });
    if (toDelete.length === 0) return toastr.info("你没有勾选任何快照哦~");

    updateVariablesWith(
      (v) => {
        if (typeof v.wb_snapshots === "string") {
          try {
            v.wb_snapshots = JSON.parse(v.wb_snapshots);
          } catch (e) {
            v.wb_snapshots = {};
          }
        }
        if (v.wb_snapshots) {
          toDelete.forEach((n) => delete v.wb_snapshots[n]);
        }
        return v;
      },
      { type: "global" },
    );
    toastr.success(`已删除 ${toDelete.length} 个快照~`);
    renderData();
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
      if (sortMode === "enabled_first")
        displayEntries.sort((a, b) =>
          a.enabled === b.enabled ? 0 : a.enabled ? -1 : 1,
        );
      else if (sortMode === "order_asc")
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
    $ui
      .find("#wb-entry-sort")
      .val(localStorage.getItem("lulu_wb_entry_sort") || "default");
    await withLoadingOverlay(async () => {
      let fetched;
      try {
        fetched = await getWorldbook(wbName);
      } catch (err) {
        if (err.message && err.message.includes("map")) {
          if (typeof toastr !== "undefined")
            toastr.warning("检测到该世界书数据残缺，触发底层抢救机制...");

          const res = await $.ajax({
            url: "/api/worldinfo/get",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ name: wbName }),
          });

          let rawEntries = [];
          if (Array.isArray(res)) rawEntries = res;
          else if (res && res.entries)
            rawEntries = Array.isArray(res.entries)
              ? res.entries
              : Object.values(res.entries);
          else rawEntries = Object.values(res || {});

          rawEntries.forEach((e) => {
            if (!e.key) e.key = e.strategy?.keys || [];
            if (!e.keys) e.keys = e.strategy?.keys || [];
          });

          await $.ajax({
            url: "/api/worldinfo/edit",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ name: wbName, entries: rawEntries }),
          });

          fetched = rawEntries;
          if (typeof toastr !== "undefined")
            toastr.success("坏档抢救成功！残缺字段已自动修复。");
        } else {
          throw err;
        }
      }

      tuneEntries = JSON.parse(JSON.stringify(fetched));
      // ✨ 先读出这本书的"前缀→长分组名"对照表
      const luluPrefixMap = readGroupMapFromEntries(tuneEntries);
      // ✨ 把对照表里的"前缀↔长分组名"关系，同步进前缀记忆库
      //    这样别人的卡导入后，你也能接着编辑/使用这些自定义前缀
      if (luluPrefixMap && Object.keys(luluPrefixMap).length > 0) {
        const _prefixStore = getGroupPrefixStore();
        if (!_prefixStore[wbName]) _prefixStore[wbName] = {};
        for (const [prefix, longGroup] of Object.entries(luluPrefixMap)) {
          // 记忆结构是 { 长分组名: 前缀 }
          _prefixStore[wbName][longGroup] = prefix;
        }
        saveGroupPrefixStore(_prefixStore);
      }
      tuneEntries.forEach((e) => {
        // 0. 如果这是对照表条目本身，跳过，不给它分组
        if (isLuluMapEntry(e)) {
          e._lulu_ui_group = "";
          if (!e.key) e.key = e.strategy?.keys || [];
          if (!e.keys) e.keys = e.strategy?.keys || [];
          return;
        }

        // 1. 始终优先读取全局缓存的分组（不再因为有对照表而跳过缓存）
        let group = getEntryUiGroup(wbName, e.uid);

        // 2. 如果缓存没有，尝试读取条目自带的隐形扩展元数据 (兼容原生角色卡导入)
        if (!group && e.extensions && e.extensions.lulu_group) {
          group = e.extensions.lulu_group;
        }

        // 3. 如果还是没有，尝试根据名字前缀识别（例如【世界观】XXX）
        //    ✨ B折中规则：是不是分组，由对照表说了算，不由前缀长相说了算
        if (!group && e.name) {
          const prefixMatch = e.name.match(/^【(.*?)】/);
          if (prefixMatch && prefixMatch[1]) {
            const rawPrefix = prefixMatch[1].trim();
            if (luluPrefixMap && luluPrefixMap[rawPrefix]) {
              // 前缀登记在对照表里 → 还原成长分组名
              group = luluPrefixMap[rawPrefix];
            } else {
              // 前缀没登记（无论这本书有没有对照表）→ 一律不当分组
              // 想按前缀分组的话，请点顶部的「按前缀分组」按钮
              group = "";
            }
          }
        }
        e._lulu_ui_group = group || "";

        if (!e.key) e.key = e.strategy?.keys || [];
        if (!e.keys) e.keys = e.strategy?.keys || [];
      });
      originalTuneEntries = JSON.parse(JSON.stringify(tuneEntries));
    }, `提取内容...`);
    isEntryBatchMode = false;
    entryBatchSelected.clear();
    $ui
      .find("#wb-btn-entry-batch")
      .removeClass("btn-warning")
      .addClass("btn-danger")
      .html('<i class="fa-solid fa-layer-group"></i> 批量操作');
    $ui.find("#wb-entry-batch-actions").hide();

    if (window.innerWidth <= 768) {
      $ui.find("#wb-entry-detail-side").css("display", "flex");
      $ui.find("#wb-btn-det-close-mobile").hide();
      $ui.find("#wb-btn-det-cancel").show();
    } else {
      $ui.find("#wb-entry-detail-side").hide();
    }

    const isPreview = localStorage.getItem("lulu_wb_entry_preview") === "true";
    $ui.find("#wb-toggle-entry-preview").prop("checked", isPreview);
    const isGroup =
      localStorage.getItem("lulu_wb_entry_group_view") !== "false";
    $ui.find("#wb-toggle-entry-group").prop("checked", isGroup);
    // ✨ 每次进入条目页，让所有分组默认收起
    wbEntryGroupState = {};
    // 先临时读一遍分组名，全部标记为收起状态
    tuneEntries.forEach((e) => {
      if (isLuluMapEntry(e)) return;
      const grp =
        e._lulu_ui_group && e._lulu_ui_group.trim() !== ""
          ? e._lulu_ui_group.trim()
          : "";
      if (grp) wbEntryGroupState[grp] = true;
    });
    // ✨ 独占全屏编辑：手机端默认开启，电脑端默认关闭（各自独立记忆）
    const luluIsMobileNow = window.innerWidth <= 768;
    const luluFsKey = luluIsMobileNow
      ? "lulu_wb_entry_fullscreen_mobile"
      : "lulu_wb_entry_fullscreen_pc";
    const luluSavedFs = localStorage.getItem(luluFsKey);
    const isFullscreen =
      luluSavedFs === null ? luluIsMobileNow : luluSavedFs === "true";
    $ui.find("#wb-toggle-entry-fullscreen").prop("checked", isFullscreen);
    if (isFullscreen) {
      $ui.find("#wb-entry-split-wrapper").addClass("lulu-fullscreen-mode");
    } else {
      $ui.find("#wb-entry-split-wrapper").removeClass("lulu-fullscreen-mode");
    }
    $ui.find("#wb-entry-split-wrapper").removeClass("is-editing-entry"); // 刚打开书时确保在列表页

    // 绑定全屏开关的点击事件（按设备分别记忆）
    $ui
      .find("#wb-toggle-entry-fullscreen")
      .off("change")
      .on("change", function () {
        const isFS = $(this).is(":checked");
        localStorage.setItem(luluFsKey, isFS);
        if (isFS) {
          $ui.find("#wb-entry-split-wrapper").addClass("lulu-fullscreen-mode");
        } else {
          $ui
            .find("#wb-entry-split-wrapper")
            .removeClass("lulu-fullscreen-mode");
        }
      });

    renderEntryList();

    // ✨ 初始化条目页按钮组的折叠状态（电脑手机统一折叠）
    {
      const isCollapsed =
        localStorage.getItem("lulu_wb_entry_btngroup_collapsed") !== "false";
      if (isCollapsed) {
        $ui
          .find(
            "#wb-btn-entry-all, #wb-btn-entry-none, #wb-btn-entry-add, #wb-btn-entry-batch, #wb-btn-entry-replace, #wb-btn-entry-snapshot, #wb-btn-entry-apply-snap, #wb-btn-calc-tune-tk",
          )
          .hide();
        $ui
          .find("#wb-entry-btn-toggle")
          .html('<i class="fa-solid fa-chevron-down"></i> 展开操作按钮');
      } else {
        $ui
          .find(
            "#wb-btn-entry-all, #wb-btn-entry-none, #wb-btn-entry-add, #wb-btn-entry-batch, #wb-btn-entry-replace, #wb-btn-entry-snapshot, #wb-btn-entry-apply-snap, #wb-btn-calc-tune-tk",
          )
          .show();
        $ui
          .find("#wb-entry-btn-toggle")
          .html('<i class="fa-solid fa-chevron-up"></i> 收起操作按钮');
      }
    }
    $ui
      .find("#wb-main-view, #wb-assoc-view, #wb-tab-strip, #wb-char-view")
      .hide();
    $ui.find("#wb-manager-panel").addClass("wb-entry-focus");
    $ui.find("#wb-entry-view").fadeIn(200);
  };

  // ✨ 折叠/展开条目页按钮组的点击事件（电脑手机通用）
  $ui
    .find("#wb-entry-btn-toggle")
    .off("click")
    .on("click", function () {
      const $btns = $ui.find(
        "#wb-btn-entry-all, #wb-btn-entry-none, #wb-btn-entry-add, #wb-btn-entry-batch, #wb-btn-entry-replace, #wb-btn-entry-snapshot, #wb-btn-entry-apply-snap, #wb-btn-calc-tune-tk",
      );
      const isNowHidden = $btns.first().is(":hidden");
      if (isNowHidden) {
        // 展开：电脑端保持横排(flex)，手机端由网格CSS接管
        if (window.innerWidth > 768) {
          $btns.css("display", "flex");
        } else {
          $btns.css("display", "");
        }
        $ui
          .find("#wb-entry-btn-toggle")
          .html('<i class="fa-solid fa-chevron-up"></i> 收起操作按钮');
        localStorage.setItem("lulu_wb_entry_btngroup_collapsed", "false");
      } else {
        $btns.hide();
        $ui
          .find("#wb-entry-btn-toggle")
          .html('<i class="fa-solid fa-chevron-down"></i> 展开操作按钮');
        localStorage.setItem("lulu_wb_entry_btngroup_collapsed", "true");
      }
    });
  $ui.find("#wb-toggle-entry-preview").on("change", function () {
    localStorage.setItem("lulu_wb_entry_preview", $(this).is(":checked"));
    renderEntryList();
  });
  $ui.find("#wb-toggle-entry-group").on("change", function () {
    localStorage.setItem("lulu_wb_entry_group_view", $(this).is(":checked"));
    renderEntryList();
  });
  // ✨ 按前缀分组：把带【xxx】前缀的条目一键归入分组
  //    - 对照表优先：前缀能查到长分组名就用长名，查不到就用前缀本身
  //    - 只改内存 _lulu_ui_group，不碰对照表，交给保存逻辑善后（增强版会自动补对照表）
  //    - 默认全勾，装饰前缀可取消
  $ui
    .find("#wb-btn-prefix-group")
    .off("click")
    .on("click", async () => {
      if (!tuneEntries || tuneEntries.length === 0)
        return toastr.warning("这本书还没有条目可以分组哦~");

      // 先读这本书当前的对照表（前缀 → 长分组名）
      const prefixMap = readGroupMapFromEntries(tuneEntries);

      // 扫描所有带【】前缀、且当前还没分组的条目，按"真正的分组名"聚合
      // 结构：{ 真正分组名: { prefix: 显示的前缀, entries: [条目...], resolved: 是否来自对照表 } }
      const groupBuckets = {};
      tuneEntries.forEach((e) => {
        if (isLuluMapEntry(e)) return; // 跳过对照表条目
        if (e._lulu_ui_group && e._lulu_ui_group.trim() !== "") return; // 已经有分组的不动
        const m = (e.name || "").match(/^【(.*?)】/);
        if (!m || !m[1]) return;
        const rawPrefix = m[1].trim();
        if (!rawPrefix) return;
        // 对照表优先：查得到就用长名，查不到用前缀本身
        const realGroup = resolveGroupByPrefix(prefixMap, rawPrefix);
        if (!groupBuckets[realGroup]) {
          groupBuckets[realGroup] = {
            prefix: rawPrefix,
            entries: [],
            resolved: realGroup !== rawPrefix, // true 表示是从对照表还原出来的长名
          };
        }
        groupBuckets[realGroup].entries.push(e);
      });

      const groupNames = Object.keys(groupBuckets);
      if (groupNames.length === 0)
        return toastr.info(
          "没有扫描到可分组的前缀条目呢~（已经分过组的条目不会重复处理哦）",
        );

      // 构建弹窗：列出识别到的分组，默认全勾
      let listHtml = "";
      groupNames.forEach((grp, idx) => {
        const b = groupBuckets[grp];
        // 对照表还原的显示成【前缀】→ 长分组名，让你一眼看出被正确归位
        const labelHtml = b.resolved
          ? `【${b.prefix}】 <i class="fa-solid fa-arrow-right" style="font-size:10px; color:gray; margin:0 4px;"></i> <strong style="color:#51cf66;">${grp}</strong> <span style="font-size:10px; color:gray;">(来自对照表)</span>`
          : `【${b.prefix}】 <span style="font-size:11px; color:gray;">→ 分组「${grp}」</span>`;
        listHtml += `
          <label style="display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:6px; background:var(--SmartThemeBotMesColor); border:1px solid var(--SmartThemeBorderColor); margin-bottom:6px; cursor:pointer;">
            <input type="checkbox" class="lulu-prefix-grp-chk" data-grp="${encodeURIComponent(grp)}" checked style="accent-color:#51cf66; flex-shrink:0;">
            <span style="flex:1; min-width:0; font-size:13px; word-break:break-all;">${labelHtml}</span>
            <span style="font-size:11px; color:gray; white-space:nowrap;">${b.entries.length} 条</span>
          </label>`;
      });

      const dialogHtml = `
        <div style="padding:6px; font-family:sans-serif; min-width:300px; max-width:420px; text-align:left;">
          <h3 style="margin-top:0; color:var(--SmartThemeQuoteColor); border-bottom:2px solid var(--SmartThemeBorderColor); padding-bottom:10px;">
            <i class="fa-solid fa-wand-magic-sparkles"></i> 按前缀分组
            <span style="font-size:12px; font-weight:normal; color:gray;">${tuneWbName}</span>
          </h3>
          <div style="font-size:12px; color:gray; margin-bottom:12px; line-height:1.5;">
            扫描到以下带前缀的条目分组，默认全部勾选。<br>
            如果某个前缀其实只是装饰、不想分组，取消勾选即可~
          </div>
          <div style="max-height:45vh; overflow-y:auto; padding-right:4px;">${listHtml}</div>
          <div style="font-size:11px; color:gray; margin-top:10px;">* 确认后只是暂存分组，记得点左下角绿色「确认并覆盖源文件」才会真正生效哦~</div>
        </div>`;

      const $dlg = $(dialogHtml);
      $dlg
        .attr("id", "lulu-prefix-grp-dialog")
        .prepend(
          `<style>${buildPopupThemeCSS("dialog:has(#lulu-prefix-grp-dialog)")}</style>`,
        );

      const result = await SillyTavern.callGenericPopup(
        $dlg,
        SillyTavern.POPUP_TYPE.CONFIRM,
        "",
        { okButton: "确认分组", cancelButton: "取消" },
      );
      if (result !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;

      // 收集被勾选的分组
      const chosenGroups = new Set();
      $dlg.find(".lulu-prefix-grp-chk:checked").each(function () {
        chosenGroups.add(decodeURIComponent($(this).attr("data-grp")));
      });

      if (chosenGroups.size === 0)
        return toastr.info("一个都没勾，那就先不分组啦~");

      // 执行分组：给对应条目设 _lulu_ui_group
      let count = 0;
      chosenGroups.forEach((grp) => {
        const b = groupBuckets[grp];
        if (!b) return;
        b.entries.forEach((e) => {
          e._lulu_ui_group = grp;
          count++;
        });
      });

      renderEntryList();
      toastr.success(
        `✨ 已把 ${count} 个条目按前缀归入 ${chosenGroups.size} 个分组！记得点左下角绿色保存按钮才会写入哦~`,
      );
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

    // 🔒 把锁定的条目挑出来，只删没锁的
    const lockedSelected = [];
    const deletableIndices = [];
    entryBatchSelected.forEach((idx) => {
      const entry = tuneEntries[idx];
      if (entry && isEntryLocked(tuneWbName, entry.uid)) {
        lockedSelected.push(entry.name || "(未命名条目)");
      } else {
        deletableIndices.push(idx);
      }
    });

    if (deletableIndices.length === 0) {
      return toastr.warning(
        `选中的 ${entryBatchSelected.size} 项全部处于锁定状态，没有可删除的条目哦~ 想删请先解锁。`,
      );
    }

    if (
      (await SillyTavern.callGenericPopup(
        `确认要暂时移除这 ${deletableIndices.length} 项内容吗？${lockedSelected.length > 0 ? `\n(另有 ${lockedSelected.length} 项已锁定，将自动跳过)` : ""}`,
        SillyTavern.POPUP_TYPE.CONFIRM,
      )) === SillyTavern.POPUP_RESULT.AFFIRMATIVE
    ) {
      let sortedIndices = deletableIndices.sort((a, b) => b - a);
      sortedIndices.forEach((idx) => tuneEntries.splice(idx, 1));
      entryBatchSelected.clear();
      renderEntryList();
      toastr.success(
        "勾选的内容都暂存移除了，记得点确认保存把变更写入源文件哦！",
      );
    }
  });
  // ✨ 新增：批量防止递归开关
  $ui.find("#wb-btn-entry-batch-recursion").on("click", async () => {
    if (entryBatchSelected.size === 0)
      return toastr.warning("请先选中要修改的条目哦~");

    const btnRes = await SillyTavern.callGenericPopup(
      `<div style="margin-bottom:8px;">要对选中的 <strong>${entryBatchSelected.size}</strong> 项条目进行什么操作呢？</div><span style="font-size:12px; color:gray;">(开启后，条目的“不可递归”与“防止进一步递归”将同时生效)</span>`,
      SillyTavern.POPUP_TYPE.TEXT,
      "",
      {
        okButton: "取消操作",
        customButtons: [
          { text: "开启防递归", result: 888, classes: ["btn-success"] },
          { text: "关闭防递归", result: 999, classes: ["btn-danger"] },
        ],
      },
    );

    if (btnRes !== 888 && btnRes !== 999) return;

    const isPrevent = btnRes === 888;

    // 遍历所有选中的条目，修改它们的底层变量
    entryBatchSelected.forEach((idx) => {
      const e = tuneEntries[idx];
      if (!e.recursion) {
        e.recursion = {
          prevent_incoming: false,
          prevent_outgoing: false,
          delay_until: null,
        };
      }
      e.recursion.prevent_incoming = isPrevent;
      e.recursion.prevent_outgoing = isPrevent;
      e.exclude_recursion = isPrevent;
      e.prevent_recursion = isPrevent;
    });

    // 清空选择并刷新列表
    entryBatchSelected.clear();
    $ui.find("#wb-entry-batch-count").text("0");
    renderEntryList();

    toastr.success(
      isPrevent
        ? "批量开启防递归成功！记得点左下角绿色保存按钮才会生效哦~"
        : "批量关闭防递归成功！记得点左下角绿色保存按钮才会生效哦~",
    );
  });
  // ✨ 新增：批量修改位置/深度
  $ui.find("#wb-btn-entry-batch-position").on("click", async () => {
    if (entryBatchSelected.size === 0)
      return toastr.warning("请先选中要移动的条目哦~");

    const dialogHtml = `
      <div style="padding:6px; font-family:sans-serif; min-width:300px; text-align:left;">
        <div style="font-weight:bold; margin-bottom:10px; color:var(--SmartThemeQuoteColor); font-size:15px;">
          <i class="fa-solid fa-location-dot"></i> 将选中的 ${entryBatchSelected.size} 项条目移动至：
        </div>
        
        <div style="margin-bottom:12px;">
            <label style="font-size: 12px; font-weight: bold; margin-bottom: 4px; display:block;">📍 插入位置：</label>
            <select id="lulu-batch-pos-select" style="width:100%; box-sizing:border-box; padding:8px; border-radius:6px; border:1px solid var(--SmartThemeBorderColor); background:var(--lulu-input-bg, var(--SmartThemeBotMesColor)); color:var(--SmartThemeBodyColor);">
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
        
        <div id="lulu-batch-depth-container" style="display:none; margin-bottom:12px;">
            <label style="font-size: 12px; font-weight: bold; margin-bottom: 4px; display:block;">🌊 深度（仅当选择 @D深度 时有效）：</label>
            <input type="number" id="lulu-batch-depth-input" value="0" style="width:100%; box-sizing:border-box; padding:8px; border-radius:6px; border:1px solid var(--SmartThemeBorderColor); background:var(--lulu-input-bg, var(--SmartThemeBotMesColor)); color:var(--SmartThemeBodyColor);">
        </div>
        
        <div style="margin-bottom:12px;">
            <label style="font-size: 12px; font-weight: bold; margin-bottom: 4px; display:block;">🔢 顺序（Order参数）：</label>
            <input type="number" id="lulu-batch-order-input" value="100" style="width:100%; box-sizing:border-box; padding:8px; border-radius:6px; border:1px solid var(--SmartThemeBorderColor); background:var(--lulu-input-bg, var(--SmartThemeBotMesColor)); color:var(--SmartThemeBodyColor);">
        </div>
        
        <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 11px; color: gray;">
            <input type="checkbox" id="lulu-batch-keep-order" checked style="accent-color: var(--SmartThemeQuoteColor);">
            <span>不修改顺序 (保留条目原有的顺序，仅改变插入位置)</span>
        </label>
      </div>
    `;

    const $dialog = $(dialogHtml);
    // 注入护眼主题
    $dialog
      .attr("id", "lulu-entry-batch-pos-dialog")
      .prepend(
        `<style>${buildPopupThemeCSS("dialog:has(#lulu-entry-batch-pos-dialog)")}</style>`,
      );

    // 智能联动：选到深度时才展示深度的数字框
    $dialog.find("#lulu-batch-pos-select").on("change", function () {
      const isDepth = $(this).val().startsWith("at_depth_");
      $dialog
        .find("#lulu-batch-depth-container")
        .css("display", isDepth ? "block" : "none");
    });

    // 如果勾选了“保留顺序”，就把输入框禁用变灰
    $dialog.find("#lulu-batch-keep-order").on("change", function () {
      $dialog
        .find("#lulu-batch-order-input")
        .prop("disabled", $(this).is(":checked"));
    });
    $dialog.find("#lulu-batch-order-input").prop("disabled", true);

    const result = await SillyTavern.callGenericPopup(
      $dialog,
      SillyTavern.POPUP_TYPE.CONFIRM,
      "",
      { okButton: "确认转移", cancelButton: "取消" },
    );

    if (result !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;

    const rawPos = $dialog.find("#lulu-batch-pos-select").val();
    const newDepth =
      parseInt($dialog.find("#lulu-batch-depth-input").val()) || 0;
    const keepOrder = $dialog.find("#lulu-batch-keep-order").is(":checked");
    const newOrder =
      parseInt($dialog.find("#lulu-batch-order-input").val()) || 100;

    // 执行后台写入
    entryBatchSelected.forEach((idx) => {
      const e = tuneEntries[idx];
      const currentOrder = e.position?.order ?? 100;
      const finalOrder = keepOrder ? currentOrder : newOrder;

      if (rawPos.startsWith("at_depth_")) {
        e.position = {
          type: "at_depth",
          role: rawPos.replace("at_depth_", ""),
          depth: newDepth,
          order: finalOrder,
        };
      } else {
        e.position = {
          type: rawPos,
          order: finalOrder,
        };
      }
    });

    entryBatchSelected.clear();
    $ui.find("#wb-entry-batch-count").text("0");
    renderEntryList();
    toastr.success("批量位移成功！记得点左下角绿色保存按钮才会生效哦~");
  });
  // ✨ 新增：批量修改蓝灯/绿灯（触发策略）
  $ui.find("#wb-btn-entry-batch-strategy").on("click", async () => {
    if (entryBatchSelected.size === 0)
      return toastr.warning("请先选中要修改的条目哦~");

    const btnRes = await SillyTavern.callGenericPopup(
      `<div style="margin-bottom:8px;">要把选中的 <strong>${entryBatchSelected.size}</strong> 项条目的触发策略改成什么呢？</div>
       <span style="font-size:12px; color:gray;">🟦 蓝灯 = 常驻(无条件触发)<br>🟩 绿灯 = 匹配(需要关键字才触发)</span>`,
      SillyTavern.POPUP_TYPE.TEXT,
      "",
      {
        okButton: "取消操作",
        customButtons: [
          {
            text: "🟦 全部改为蓝灯(常驻)",
            result: 888,
            classes: ["btn-primary"],
          },
          {
            text: "🟩 全部改为绿灯(匹配)",
            result: 999,
            classes: ["btn-success"],
          },
        ],
      },
    );

    if (btnRes !== 888 && btnRes !== 999) return;

    const targetType = btnRes === 888 ? "constant" : "selective";

    entryBatchSelected.forEach((idx) => {
      const e = tuneEntries[idx];
      if (!e.strategy || typeof e.strategy !== "object") {
        e.strategy = { type: "constant", keys: [] };
      }
      e.strategy.type = targetType;
      // 同步底层的 constant / selective 字段，保证兼容性
      e.constant = targetType === "constant";
      e.selective = targetType === "selective";
    });

    entryBatchSelected.clear();
    $ui.find("#wb-entry-batch-count").text("0");
    renderEntryList();

    toastr.success(
      targetType === "constant"
        ? "已全部改为🟦蓝灯(常驻)！记得点左下角绿色保存按钮才会生效哦~"
        : "已全部改为🟩绿灯(匹配)！记得点左下角绿色保存按钮才会生效哦~",
    );
  });

  // ✨ 新增：批量开启条目
  $ui.find("#wb-btn-entry-batch-enable").on("click", () => {
    if (entryBatchSelected.size === 0)
      return toastr.warning("请先选中要操作的条目哦~");
    entryBatchSelected.forEach((idx) => {
      tuneEntries[idx].enabled = true;
    });
    entryBatchSelected.clear();
    renderEntryList();
    toastr.success("选中的条目已全部开启！记得点左下角保存哦~");
  });

  // ✨ 新增：批量关闭条目
  $ui.find("#wb-btn-entry-batch-disable").on("click", () => {
    if (entryBatchSelected.size === 0)
      return toastr.warning("请先选中要操作的条目哦~");
    entryBatchSelected.forEach((idx) => {
      tuneEntries[idx].enabled = false;
    });
    entryBatchSelected.clear();
    renderEntryList();
    toastr.success("选中的条目已全部关闭！记得点左下角保存哦~");
  });
  // ✨ 批量前缀功能（三选项版：加/去 + 分组名/自定义 + 是否作为分组）
  $ui.find("#wb-btn-entry-batch-prefix").on("click", async () => {
    if (entryBatchSelected.size === 0)
      return toastr.warning("请先选中要操作的条目哦~");

    const dialogHtml = `
      <div style="padding:6px; font-family:sans-serif; min-width:300px; max-width:400px; text-align:left;">
        <div style="font-weight:bold; margin-bottom:12px; color:var(--SmartThemeQuoteColor); font-size:15px;">
          <i class="fa-solid fa-tags"></i> 批量前缀操作（选中 ${entryBatchSelected.size} 项）
        </div>

        <div style="margin-bottom:12px; padding:10px; background:rgba(0,0,0,0.1); border-radius:6px;">
          <div style="font-size:12px; font-weight:bold; margin-bottom:8px; color:var(--SmartThemeQuoteColor);">① 操作类型：</div>
          <label style="display:flex; align-items:center; gap:6px; font-size:13px; margin-bottom:6px; cursor:pointer;">
            <input type="radio" name="lulu-pre-action" value="add" checked style="accent-color:var(--SmartThemeQuoteColor);"> <span>加前缀</span>
          </label>
          <label style="display:flex; align-items:center; gap:6px; font-size:13px; cursor:pointer;">
            <input type="radio" name="lulu-pre-action" value="remove" style="accent-color:var(--SmartThemeQuoteColor);"> <span>去前缀</span>
          </label>
        </div>

        <div id="lulu-pre-add-opts">
          <div style="margin-bottom:12px; padding:10px; background:rgba(0,0,0,0.1); border-radius:6px;">
            <div style="font-size:12px; font-weight:bold; margin-bottom:8px; color:var(--SmartThemeQuoteColor);">② 前缀来源：</div>
            <label style="display:flex; align-items:center; gap:6px; font-size:13px; margin-bottom:6px; cursor:pointer;">
              <input type="radio" name="lulu-pre-source" value="group" checked style="accent-color:var(--SmartThemeQuoteColor);"> <span>用分组名（默认）</span>
            </label>
            <label style="display:flex; align-items:center; gap:6px; font-size:13px; margin-bottom:6px; cursor:pointer;">
              <input type="radio" name="lulu-pre-source" value="custom" style="accent-color:var(--SmartThemeQuoteColor);"> <span>自定义前缀：</span>
            </label>
            <input type="text" id="lulu-pre-custom-input" class="text_pole" placeholder="输入自定义前缀..." disabled style="width:100%; box-sizing:border-box; padding:7px; margin-top:2px; opacity:0.5;">
          </div>

          <div style="margin-bottom:6px; padding:10px; background:rgba(0,0,0,0.1); border-radius:6px;">
            <label style="display:flex; align-items:center; gap:6px; font-size:13px; cursor:pointer;">
              <input type="checkbox" id="lulu-pre-asgroup" checked disabled style="accent-color:#51cf66;"> <span style="font-weight:bold;">作为分组标记（登记进对照表）</span>
            </label>
            <div style="font-size:11px; color:gray; margin-top:6px; line-height:1.5;">
              ☑ 勾选 = 是分组，导入后能还原分组<br>
              ☐ 不勾 = 纯装饰前缀，脚本不当分组
            </div>
          </div>
        </div>
      </div>
    `;

    const $dlg = $(dialogHtml);
    $dlg
      .attr("id", "lulu-batch-prefix-dialog")
      .prepend(
        `<style>${buildPopupThemeCSS("dialog:has(#lulu-batch-prefix-dialog)")}</style>`,
      );

    // —— 交互联动 ——
    // 切换 加/去前缀：去前缀时隐藏下面的选项
    $dlg.find('input[name="lulu-pre-action"]').on("change", function () {
      $dlg
        .find("#lulu-pre-add-opts")
        .css("display", $(this).val() === "add" ? "block" : "none");
    });
    // 切换 前缀来源：自定义时启用输入框；用分组名时锁死"作为分组"
    const refreshSourceState = () => {
      const src = $dlg.find('input[name="lulu-pre-source"]:checked').val();
      const $custom = $dlg.find("#lulu-pre-custom-input");
      const $asGroup = $dlg.find("#lulu-pre-asgroup");
      if (src === "custom") {
        $custom.prop("disabled", false).css("opacity", "1");
        $asGroup.prop("disabled", false); // 自定义时可自由勾选
      } else {
        $custom.prop("disabled", true).css("opacity", "0.5");
        $asGroup.prop("checked", true).prop("disabled", true); // 用分组名 → 强制勾死作为分组（防呆）
      }
    };
    $dlg.find('input[name="lulu-pre-source"]').on("change", refreshSourceState);
    refreshSourceState();

    const result = await SillyTavern.callGenericPopup(
      $dlg,
      SillyTavern.POPUP_TYPE.CONFIRM,
      "",
      { okButton: "确认执行", cancelButton: "取消" },
    );
    if (result !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;

    const action = $dlg.find('input[name="lulu-pre-action"]:checked').val();

    // ===== 去前缀 =====
    if (action === "remove") {
      let changedCount = 0;
      entryBatchSelected.forEach((idx) => {
        const entry = tuneEntries[idx];
        const currentName = entry.name || "";
        if (currentName.match(/^【.*?】/)) {
          entry.name = currentName.replace(/^【.*?】\s*/, "");
          changedCount++;
        }
      });
      entryBatchSelected.clear();
      $ui.find("#wb-entry-batch-count").text("0");
      renderEntryList();
      if (changedCount > 0)
        toastr.success(
          `已移除 ${changedCount} 个条目的前缀！记得点左下角保存~`,
        );
      else toastr.info("选中的条目都没有前缀呢~");
      return;
    }

    // ===== 加前缀 =====
    const source = $dlg.find('input[name="lulu-pre-source"]:checked').val();
    const asGroup = $dlg.find("#lulu-pre-asgroup").is(":checked");

    if (source === "group") {
      // —— 用分组名当前缀（自动读各自分组，未分类的跳过）——
      let changedCount = 0;
      entryBatchSelected.forEach((idx) => {
        const entry = tuneEntries[idx];
        const grp = entry._lulu_ui_group || "";
        if (!grp || grp === "📁 未分类条目" || grp.trim() === "") return;
        // 用分组名时，前缀就用该分组当前设置的前缀
        const prefix = getGroupPrefix(tuneWbName, grp.trim());
        const desiredPrefix = `【${prefix}】`;
        let currentName = entry.name || "";
        const hasAnyPrefix = currentName.match(/^【.*?】/);
        if (hasAnyPrefix) {
          if (hasAnyPrefix[0] !== desiredPrefix) {
            entry.name = currentName.replace(/^【.*?】\s*/, desiredPrefix);
            changedCount++;
          }
        } else {
          entry.name = desiredPrefix + currentName;
          changedCount++;
        }
      });
      entryBatchSelected.clear();
      $ui.find("#wb-entry-batch-count").text("0");
      renderEntryList();
      if (changedCount > 0)
        toastr.success(
          `已为 ${changedCount} 个条目加上分组前缀！记得点左下角保存~`,
        );
      else toastr.info("检查了一遍，选中的条目要么没分组、要么前缀已正确~");
      return;
    }

    // —— 自定义前缀 ——
    const customPrefix = $dlg.find("#lulu-pre-custom-input").val().trim();
    if (!customPrefix) return toastr.warning("自定义前缀不能为空哦~");

    // 检查选中条目跨了几个分组
    const selectedGroups = new Set();
    entryBatchSelected.forEach((idx) => {
      const g = tuneEntries[idx]._lulu_ui_group || "";
      if (g && g.trim() && g !== "📁 未分类条目") selectedGroups.add(g.trim());
    });

    if (asGroup) {
      // 作为分组：需要处理"跨组"和"确定归入哪个分组"
      let targetGroup = "";

      if (selectedGroups.size > 1) {
        // 跨了多个分组 → 询问是否合并成新分组
        const confirmMerge = await SillyTavern.callGenericPopup(
          `选中的条目来自 ${selectedGroups.size} 个不同分组，无法统一前缀。<br><br>是否把它们<strong style="color:var(--SmartThemeQuoteColor);">合并成一个新分组</strong>？`,
          SillyTavern.POPUP_TYPE.CONFIRM,
        );
        if (confirmMerge !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
        let newGrpName = await SillyTavern.callGenericPopup(
          "给这个新分组起个名字（真名，会随卡还原）：",
          SillyTavern.POPUP_TYPE.INPUT,
          customPrefix,
        );
        if (!newGrpName || !(newGrpName = newGrpName.trim())) return;
        targetGroup = newGrpName;
      } else if (selectedGroups.size === 1) {
        targetGroup = Array.from(selectedGroups)[0];
      } else {
        // 都没分组 → 用自定义前缀名当新分组真名
        targetGroup = customPrefix;
      }

      // 检查前缀撞车
      const store2 = getGroupPrefixStore();
      const bookStore2 = store2[tuneWbName] || {};
      for (const [otherGrp, otherPrefix] of Object.entries(bookStore2)) {
        if (otherGrp !== targetGroup && otherPrefix === customPrefix) {
          return toastr.error(
            `前缀【${customPrefix}】已被分组「${otherGrp}」占用啦~`,
          );
        }
      }

      // 登记前缀 + 给条目归组 + 加前缀
      setGroupPrefix(tuneWbName, targetGroup, customPrefix);
      entryBatchSelected.forEach((idx) => {
        const entry = tuneEntries[idx];
        entry._lulu_ui_group = targetGroup;
        let currentName = entry.name || "";
        const desiredPrefix = `【${customPrefix}】`;
        if (currentName.match(/^【.*?】/)) {
          entry.name = currentName.replace(/^【.*?】\s*/, desiredPrefix);
        } else {
          entry.name = desiredPrefix + currentName;
        }
      });
      entryBatchSelected.clear();
      $ui.find("#wb-entry-batch-count").text("0");
      renderEntryList();
      toastr.success(
        `✨ 已用前缀【${customPrefix}】标记为分组「${targetGroup}」！记得点左下角保存~`,
      );
    } else {
      // 纯装饰前缀：只加前缀，不动分组、不登记对照表
      entryBatchSelected.forEach((idx) => {
        const entry = tuneEntries[idx];
        let currentName = entry.name || "";
        const desiredPrefix = `【${customPrefix}】`;
        if (currentName.match(/^【.*?】/)) {
          entry.name = currentName.replace(/^【.*?】\s*/, desiredPrefix);
        } else {
          entry.name = desiredPrefix + currentName;
        }
      });
      entryBatchSelected.clear();
      $ui.find("#wb-entry-batch-count").text("0");
      renderEntryList();
      toastr.success(
        `✨ 已加上装饰前缀【${customPrefix}】（不作为分组）！记得点左下角保存~`,
      );
    }
  });
  $ui.find("#wb-btn-entry-batch-group").on("click", async () => {
    if (entryBatchSelected.size === 0)
      return toastr.warning("请先选中想要分类的条目哦~");

    // 1. 自动扫描当前世界书，提取出所有已经存在的分组名
    const existingGroups = new Set();
    tuneEntries.forEach((e) => {
      if (e._lulu_ui_group && e._lulu_ui_group.trim() !== "") {
        existingGroups.add(e._lulu_ui_group.trim());
      }
    });
    const groupList = Array.from(existingGroups).sort();

    // 2. 构建下拉选项
    let optionsHtml = '<option value="">-- 请选择已有分组 --</option>';
    groupList.forEach((g) => {
      optionsHtml += `<option value="${g}">${g}</option>`;
    });

    // 3. 构建自定义弹窗的 UI 面板
    const dialogHtml = `
      <div style="padding:6px; font-family:sans-serif; min-width:280px; text-align:left;">
        <div style="font-weight:bold; margin-bottom:10px; color:var(--SmartThemeQuoteColor); font-size:15px;">
          <i class="fa-solid fa-folder-tree"></i> 把选中的 ${entryBatchSelected.size} 项条目归入分组
        </div>

        <div style="margin-bottom:14px;">
          <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:4px;">① 选择已有分组：</label>
          <select id="lulu-entry-batch-grp-select" style="width:100%; box-sizing:border-box; padding:8px; border-radius:6px; border:1px solid var(--SmartThemeBorderColor); background:var(--lulu-input-bg, var(--SmartThemeBotMesColor)); color:var(--SmartThemeBodyColor);">
            ${optionsHtml}
          </select>
        </div>

        <div style="text-align:center; color:gray; font-size:12px; margin:8px 0;">—— 或者 ——</div>

        <div>
          <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:4px;">② 新建一个分组：</label>
          <input type="text" id="lulu-entry-batch-grp-input" placeholder="输入新分组名字 (留空则为未分类)..." style="width:100%; box-sizing:border-box; padding:8px; border-radius:6px; border:1px solid var(--SmartThemeBorderColor); background:var(--lulu-input-bg, var(--SmartThemeBotMesColor)); color:var(--SmartThemeBodyColor);">
        </div>
        
        <div style="font-size:11px; color:gray; margin-top:10px;">* 两个都填的话，会优先使用②新建的名字哦~ 两个都留空则解除分组。</div>
      </div>
    `;

    const $dialog = $(dialogHtml);
    // 复用脚本里的主题函数，确保弹窗和你的护眼主题保持一致
    $dialog
      .attr("id", "lulu-entry-batch-grp-dialog")
      .prepend(
        `<style>${buildPopupThemeCSS("dialog:has(#lulu-entry-batch-grp-dialog)")}</style>`,
      );

    // 交互小细节：选了下拉就清空输入框，输入了文字就清空下拉框
    $dialog.find("#lulu-entry-batch-grp-select").on("change", function () {
      if ($(this).val()) $dialog.find("#lulu-entry-batch-grp-input").val("");
    });
    $dialog.find("#lulu-entry-batch-grp-input").on("input", function () {
      if ($(this).val().trim())
        $dialog.find("#lulu-entry-batch-grp-select").val("");
    });

    // 4. 呼出确认弹窗
    const result = await SillyTavern.callGenericPopup(
      $dialog,
      SillyTavern.POPUP_TYPE.CONFIRM,
      "",
      { okButton: "确认改组", cancelButton: "取消" },
    );

    // 如果用户点了取消，直接返回
    if (result !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;

    // 5. 决定最终的分组名称（优先使用输入框里的新名字）
    let finalGroup = $dialog.find("#lulu-entry-batch-grp-input").val().trim();
    if (!finalGroup) {
      finalGroup = $dialog.find("#lulu-entry-batch-grp-select").val() || "";
    }

    // 6. 执行批量改组（附带自动更新前缀功能）
    entryBatchSelected.forEach((idx) => {
      let entry = tuneEntries[idx];
      entry._lulu_ui_group = finalGroup;

      // 如果条目原本就有【XXX】前缀，换组时自动帮它改前缀
      let currentName = entry.name || "";
      const hasAnyPrefix = currentName.match(/^【.*?】/);

      if (hasAnyPrefix) {
        if (finalGroup && finalGroup !== "📁 未分类条目") {
          // 如果移动到了新分组，前缀换成新分组名
          entry.name = currentName.replace(/^【.*?】\s*/, `【${finalGroup}】`);
        } else {
          // 如果是移出分组（变成了未分类），就自动把前缀摘掉
          entry.name = currentName.replace(/^【.*?】\s*/, "");
        }
      }
    });

    entryBatchSelected.clear();
    $ui.find("#wb-entry-batch-count").text("0");
    renderEntryList();

    if (finalGroup) {
      toastr.success(
        `批量改组完成！已归入【${finalGroup}】。记得点绿色保存按钮才会生效哦~`,
      );
    } else {
      toastr.success(
        `批量解散分组完成！条目已变回未分类。记得点绿色保存按钮才会生效哦~`,
      );
    }
  });
  // ✨ 打开"设置分组前缀"的弹窗
  const openSetPrefixDialog = async (groupName) => {
    const curPrefix = getGroupPrefix(tuneWbName, groupName);
    const isDefault = curPrefix === groupName;

    const dialogHtml = `
    <div style="padding:6px; font-family:sans-serif; min-width:280px; text-align:left;">
      <div style="font-weight:bold; margin-bottom:10px; color:var(--SmartThemeQuoteColor); font-size:15px;">
        <i class="fa-solid fa-tag"></i> 设置分组前缀
      </div>
      <div style="font-size:12px; color:gray; margin-bottom:12px; line-height:1.5;">
        分组真名：<strong style="color:var(--SmartThemeBodyColor);">${groupName}</strong><br>
        你可以给它设一个更短的前缀，条目名前面会显示这个短前缀，<br>但别人导入后依然能还原成上面的真名哦~
      </div>
      <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:4px;">✏️ 前缀文字（留空则用分组真名）：</label>
      <input type="text" id="lulu-set-prefix-input" class="text_pole" placeholder="例如：设定" value="${isDefault ? "" : curPrefix}" style="width:100%; box-sizing:border-box; padding:8px;">
      <div style="font-size:11px; color:gray; margin-top:8px;">* 前缀不要和其他分组重复哦~ 显示效果会是【前缀】条目名</div>
    </div>
  `;

    const $dlg = $(dialogHtml);
    $dlg
      .attr("id", "lulu-set-prefix-dialog")
      .prepend(
        `<style>${buildPopupThemeCSS("dialog:has(#lulu-set-prefix-dialog)")}</style>`,
      );

    const result = await SillyTavern.callGenericPopup(
      $dlg,
      SillyTavern.POPUP_TYPE.CONFIRM,
      "",
      { okButton: "确认", cancelButton: "取消" },
    );
    if (result !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;

    let newPrefix = $dlg.find("#lulu-set-prefix-input").val().trim();
    // 留空 = 用分组真名
    if (!newPrefix) newPrefix = groupName;

    // 检查前缀是否和"别的分组"撞车
    const store = getGroupPrefixStore();
    const bookStore = store[tuneWbName] || {};
    for (const [otherGrp, otherPrefix] of Object.entries(bookStore)) {
      if (otherGrp !== groupName && otherPrefix === newPrefix) {
        return toastr.error(
          `前缀【${newPrefix}】已经被分组「${otherGrp}」占用啦，换一个吧~`,
        );
      }
    }
    // 也要检查是否和别的分组"真名"撞车（避免歧义）
    const allGroups = new Set();
    tuneEntries.forEach((e) => {
      if (
        e._lulu_ui_group &&
        e._lulu_ui_group.trim() &&
        e._lulu_ui_group !== groupName
      ) {
        allGroups.add(e._lulu_ui_group.trim());
      }
    });
    if (allGroups.has(newPrefix)) {
      return toastr.error(
        `前缀【${newPrefix}】和另一个分组的真名撞车了，换一个吧~`,
      );
    }

    setGroupPrefix(tuneWbName, groupName, newPrefix);

    // 立即更新这个组内所有条目的显示前缀（全组统一，无论原来有没有前缀）
    tuneEntries.forEach((e) => {
      if (e._lulu_ui_group === groupName) {
        const curName = e.name || "";
        if (curName.match(/^【.*?】/)) {
          // 本来有前缀 → 替换成新前缀
          e.name = curName.replace(/^【.*?】\s*/, `【${newPrefix}】`);
        } else {
          // 本来没前缀 → 直接加上新前缀
          e.name = `【${newPrefix}】` + curName;
        }
      }
    });

    renderEntryList();
    if (newPrefix === groupName) {
      toastr.success(`分组「${groupName}」已改回使用真名做前缀~`);
    } else {
      toastr.success(
        `✨ 分组「${groupName}」的前缀已设为【${newPrefix}】！记得左下角点保存哦~`,
      );
    }
  };
  let wbEntryGroupState = {};

  const renderEntryList = () => {
    const keyword = $ui.find("#wb-entry-search").val().toLowerCase();
    const sortMode = $ui.find("#wb-entry-sort").val() || "default";
    const $container = $ui.find("#wb-entry-container").empty();
    $ui.find("#wb-entry-batch-count").text(entryBatchSelected.size);
    const showPreview = $ui.find("#wb-toggle-entry-preview").is(":checked");

    const filteredEntries = tuneEntries.filter((entry) => {
      // ✨ 对照表条目是脚本内部数据，不显示在列表里
      if (isLuluMapEntry(entry)) return false;
      const searchStr =
        `${entry.name || ""} ${(entry.strategy?.keys || []).join(",")} ${showPreview ? entry.content || "" : ""}`.toLowerCase();
      return !keyword || searchStr.includes(keyword);
    });

    let sortedEntries = [...filteredEntries];
    if (sortMode === "enabled_first")
      sortedEntries.sort((a, b) =>
        a.enabled === b.enabled ? 0 : a.enabled ? -1 : 1,
      );
    else if (sortMode === "order_asc")
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

    const isGroupView = $ui.find("#wb-toggle-entry-group").is(":checked");
    const groupedEntries = {};
    sortedEntries.forEach((entry) => {
      let g = "📁 所有条目 (平铺模式)";
      if (isGroupView) {
        g =
          entry._lulu_ui_group && entry._lulu_ui_group.trim() !== ""
            ? entry._lulu_ui_group.trim()
            : "📁 未分类条目";
      }
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
      // 瘦身计划：批量模式只留【选全组/撤全组】，普通模式什么都不留
      const groupBtnsHtml = isEntryBatchMode
        ? `
             <button class="menu_button interactable wb-nowrap-btn btn-info wb-group-select-all" style="margin:0; padding:4px 10px; font-size:12px;" title="勾选本组"><i class="fa-solid fa-check-double"></i></button>
             <button class="menu_button interactable wb-nowrap-btn btn-secondary wb-group-deselect-all" style="margin:0; padding:4px 10px; font-size:12px;" title="撤销本组"><i class="fa-regular fa-square"></i></button>
          `
        : ``;

      // 一键开关整组条目的图标按钮：根据当前组状态显示不同外观
      const _grpTotal = gEntries.length;
      const _grpOnCount = gEntries.filter((en) => en.enabled).length;
      let _grpToggleIcon, _grpToggleColor, _grpToggleTitle;
      if (_grpTotal > 0 && _grpOnCount === _grpTotal) {
        // 全开 → 绿色实心开
        _grpToggleIcon = "fa-toggle-on";
        _grpToggleColor = "#51cf66";
        _grpToggleTitle = "本组已全开，点击一键全关";
      } else if (_grpOnCount === 0) {
        // 全关 → 灰色关
        _grpToggleIcon = "fa-toggle-off";
        _grpToggleColor = "gray";
        _grpToggleTitle = "本组已全关，点击一键全开";
      } else {
        // 混合 → 黄色关（提示部分开启）
        _grpToggleIcon = "fa-toggle-off";
        _grpToggleColor = "#fcc419";
        _grpToggleTitle = "本组部分开启，点击一键全开";
      }
      const groupToggleBtn = `<button class="menu_button interactable wb-nowrap-btn wb-group-toggle-all" style="margin:0; padding:4px 10px; font-size:15px; color:${_grpToggleColor}; background:transparent; border:none;" title="${_grpToggleTitle}"><i class="fa-solid ${_grpToggleIcon}"></i></button>`;
      // 改名、设前缀、删除只使用纯图标，节省空间
      const editBtnsHtml = isDraggable
        ? `
             <button class="menu_button interactable wb-nowrap-btn btn-info wb-group-rename" style="margin:0; padding:4px 8px; font-size:11px;" title="重命名该分组"><i class="fa-solid fa-pen"></i></button>
             <button class="menu_button interactable wb-nowrap-btn btn-warning wb-group-prefix" style="margin:0; padding:4px 8px; font-size:11px;" title="设置该分组的显示前缀"><i class="fa-solid fa-tag"></i></button>
             <button class="menu_button interactable wb-nowrap-btn btn-danger wb-group-delete" style="margin:0; padding:4px 8px; font-size:11px;" title="删除分组或解散"><i class="fa-solid fa-trash"></i></button>
          `
        : "";

      const $gHeader =
        $(`<div class="lulu-ui-group-header" data-groupname="${groupName}" draggable="${isDraggable ? "true" : "false"}" style="background: rgba(0,0,0,0.15); padding:8px 12px; margin-top:8px; border-radius:6px; cursor:pointer; font-weight:bold; color:var(--SmartThemeBodyColor); border:1px solid var(--SmartThemeBorderColor); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <span style="display:flex; align-items:center;">${dragIcon}<i class="fa-solid ${isCollapsed ? "fa-chevron-right" : "fa-chevron-down"}" style="margin-right:6px; color:var(--SmartThemeQuoteColor);"></i>${groupName}<span style="font-size:12px; color:gray; font-weight:normal; margin-left:4px;">( ${gEntries.length} )</span></span>
                <div style="display:flex; gap:4px;" class="lulu-group-ctrls">${isDraggable ? `<i class="fa-solid fa-arrow-up lulu-btn-up" title="上移" draggable="false" style="padding:6px; font-size:12px; color:gray; cursor:pointer; background:rgba(125,125,125,0.15); border-radius:4px; transition:0.2s;"></i><i class="fa-solid fa-arrow-down lulu-btn-down" title="下移" draggable="false" style="padding:6px; font-size:12px; color:gray; cursor:pointer; background:rgba(125,125,125,0.15); border-radius:4px; margin-right:6px; transition:0.2s;"></i>` : ""}
                    ${groupToggleBtn}
                    ${groupBtnsHtml}
                    ${editBtnsHtml}
                </div></div>`);
      const $gContainer = $(
        `<div style="display:${isCollapsed ? "none" : "flex"}; flex-direction:column; padding-left:10px; margin-top:6px; border-left: 2px solid var(--SmartThemeBorderColor); gap: 4px;"></div>`,
      );
      if (!isGroupView) {
        $gHeader.hide();
        $gContainer.css({
          display: "flex",
          "border-left": "none",
          "padding-left": "0",
          "margin-top": "0",
        });
      }

      $gHeader.on("click", (e) => {
        if (
          $(e.target).closest(".lulu-group-ctrls").length ||
          $(e.target).hasClass("lulu-panel-drag-handle")
        )
          return;
        wbEntryGroupState[groupName] = !isCollapsed;
        renderEntryList();
      });

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
        $gHeader
          .find(".lulu-btn-up, .lulu-btn-down")
          .on("dragstart", function (e) {
            e.preventDefault();
            e.stopPropagation();
          });
        $gHeader.find(".lulu-btn-up").on("pointerdown", function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (e.pointerType === "mouse" && e.button !== 0) return;
          let order = getSharedGroupOrder();
          const idx = order.indexOf(groupName);
          if (idx > 0) {
            [order[idx - 1], order[idx]] = [order[idx], order[idx - 1]];
            setSharedGroupOrder(order);
            renderEntryList();
          }
        });
        $gHeader.find(".lulu-btn-down").on("pointerdown", function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (e.pointerType === "mouse" && e.button !== 0) return;
          let order = getSharedGroupOrder();
          const idx = order.indexOf(groupName);
          if (idx !== -1 && idx < order.length - 1) {
            [order[idx + 1], order[idx]] = [order[idx], order[idx + 1]];
            setSharedGroupOrder(order);
            renderEntryList();
          }
        });
      }

      // ✨ 新增：一键开启/关闭本组所有条目
      $gHeader.find(".wb-group-toggle-all").on("click", (e) => {
        e.stopPropagation();
        // 判断当前组的状态：全开、全关还是混合
        const total = gEntries.length;
        const onCount = gEntries.filter((en) => en.enabled).length;
        // 全开就全关，否则全开
        const targetEnable = !(onCount === total && total > 0);
        gEntries.forEach((entry) => {
          entry.enabled = targetEnable;
        });
        renderEntryList();
        toastr.success(
          targetEnable
            ? `已开启分组「${groupName}」内全部 ${total} 个条目~`
            : `已关闭分组「${groupName}」内全部 ${total} 个条目~`,
        );
      });
      $gHeader.find(".wb-group-select-all").on("click", (e) => {
        e.stopPropagation();
        gEntries.forEach((entry) => {
          const index = tuneEntries.indexOf(entry);
          if (index !== -1) entryBatchSelected.add(index);
        });
        $ui.find("#wb-entry-batch-count").text(entryBatchSelected.size);
        renderEntryList();
      });
      $gHeader.find(".wb-group-deselect-all").on("click", (e) => {
        e.stopPropagation();
        gEntries.forEach((entry) => {
          const index = tuneEntries.indexOf(entry);
          if (index !== -1) entryBatchSelected.delete(index);
        });
        $ui.find("#wb-entry-batch-count").text(entryBatchSelected.size);
        renderEntryList();
      });
      $gHeader.find(".wb-group-rename").on("click", async (e) => {
        e.stopPropagation();
        const newName = await SillyTavern.callGenericPopup(
          `请为【${groupName}】输入一个新的名字：`,
          SillyTavern.POPUP_TYPE.INPUT,
          groupName,
        );
        if (newName && newName.trim() && newName.trim() !== groupName) {
          const finalName = newName.trim();
          if (finalName === "📁 未分类条目")
            return toastr.warning("这个名字是系统预留的哦，换一个吧~");

          // ✨ 先读出旧分组的前缀，并把前缀记忆迁移到新分组名下
          const oldPrefix = getGroupPrefix(tuneWbName, groupName);
          const wasCustomPrefix = oldPrefix !== groupName; // 之前是否用了自定义前缀
          const prefixStore = getGroupPrefixStore();
          if (prefixStore[tuneWbName]) {
            if (wasCustomPrefix) {
              // 自定义前缀：把记忆搬到新组名下，前缀值保持不变
              prefixStore[tuneWbName][finalName] = oldPrefix;
            }
            // 删掉旧组名的记忆
            delete prefixStore[tuneWbName][groupName];
            saveGroupPrefixStore(prefixStore);
          }
          // 决定条目名前缀该用什么：有自定义就沿用旧前缀，没有就用新分组名
          const displayPrefix = wasCustomPrefix ? oldPrefix : finalName;

          // 给组内每个条目更新分组名，如果原本带有前缀，也一并更新前缀
          gEntries.forEach((entry) => {
            entry._lulu_ui_group = finalName;

            let currentName = entry.name || "";
            if (currentName.match(/^【.*?】/)) {
              entry.name = currentName.replace(
                /^【.*?】\s*/,
                `【${displayPrefix}】`,
              );
            }
          });

          if (wbEntryGroupState[groupName] !== undefined) {
            wbEntryGroupState[finalName] = wbEntryGroupState[groupName];
            delete wbEntryGroupState[groupName];
          }
          let order = getSharedGroupOrder();
          let idx = order.indexOf(groupName);
          if (idx > -1) {
            order[idx] = finalName;
            setSharedGroupOrder(order);
          }

          renderEntryList();
          toastr.success(
            `分组名字已经改成【${finalName}】啦！记得左下角点保存哦~`,
          );
        }
      });

      $gHeader.find(".wb-group-prefix").on("click", async (e) => {
        e.stopPropagation();
        await openSetPrefixDialog(groupName);
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
          // 🔒 锁定的条目不会被清空
          const lockedInGroup = gEntries.filter((entry) =>
            isEntryLocked(tuneWbName, entry.uid),
          );
          const uidsToRemove = gEntries
            .filter((entry) => !isEntryLocked(tuneWbName, entry.uid))
            .map((entry) => entry.uid);
          tuneEntries = tuneEntries.filter(
            (entry) => !uidsToRemove.includes(entry.uid),
          );
          if (lockedInGroup.length > 0) {
            toastr.warning(
              `🔒 组内有 ${lockedInGroup.length} 个条目已锁定，已自动保留~`,
            );
          }
          delete wbEntryGroupState[groupName];
          // ✨ 清理该分组的前缀记忆
          const _ps888 = getGroupPrefixStore();
          if (_ps888[tuneWbName]) {
            delete _ps888[tuneWbName][groupName];
            saveGroupPrefixStore(_ps888);
          }
          renderEntryList();
          toastr.success(
            `【${groupName}】内容已被彻底扫除干净啦！记得按绿色保存按钮哦~`,
          );
        } else if (btnRes === 999) {
          gEntries.forEach((entry) => (entry._lulu_ui_group = ""));
          delete wbEntryGroupState[groupName];
          // ✨ 清理该分组的前缀记忆
          const _ps999 = getGroupPrefixStore();
          if (_ps999[tuneWbName]) {
            delete _ps999[tuneWbName][groupName];
            saveGroupPrefixStore(_ps999);
          }
          renderEntryList();
          toastr.success(
            `【${groupName}】已解散，里面的内容已经安全返回未分类区啦。`,
          );
        }
      });

      gEntries.forEach((entry) => {
        const index = tuneEntries.indexOf(entry);
        const isLockedEntry = isEntryLocked(tuneWbName, entry.uid);
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
            `<input type="checkbox" class="wb-batch-chk" style="flex-shrink:0; margin-top:2px;">`,
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
              // ✨ 只更新当前这一条的外观，不整个列表重画（更顺滑）
              const _isEn = entry.enabled;
              $item.css({
                "border-left-color": _isEn ? "var(--okGreen)" : "gray",
                background: _isEn
                  ? "var(--SmartThemeBotMesColor)"
                  : "rgba(125,125,125,0.08)",
                opacity: _isEn ? "1" : "0.55",
              });
            });
        }
        let previewHtml = "";
        if (showPreview && entry.content) {
          previewHtml = `<div class="content-preview">${entry.content.replace(/</g, "<").replace(/>/g, ">")}</div>`;
        }

        let groupTagHtml = "";
        if (
          !isGroupView &&
          entry._lulu_ui_group &&
          entry._lulu_ui_group.trim() !== ""
        ) {
          groupTagHtml = `<span style="font-size:10px; background:rgba(252,196,25,0.15); border:1px solid #fcc419; color:#fcc419; padding:2px 5px; border-radius:4px; margin-right:6px; vertical-align:middle; line-height:1;"><i class="fa-solid fa-folder"></i> ${entry._lulu_ui_group}</span>`;
        }

        const $info = $(
          `<div style="flex:1; min-width:0; cursor:${isEntryBatchMode ? "pointer" : "default"};"><div style="font-weight:bold; margin-bottom: 5px; font-size:14px; word-break:break-all; display:flex; align-items:center;">${groupTagHtml}${isLockedEntry ? '<i class="fa-solid fa-lock" style="color:#fcc419; margin-right:4px; font-size:12px;" title="已锁定"></i>' : ""}${entry.name || "未定义模块"}</div>
<div style="font-size:11px;color:gray;display:flex;align-items:center;flex-wrap:wrap;gap:4px;">${strategy.type !== "selective" ? '<span class="badge-blue">常驻</span>' : '<span class="badge-green">匹配</span>'}${posBadgeHtml} <span style="margin-left:5px;">${keysInfo}</span></div>${previewHtml}</div>`,
        );

        if (isEntryBatchMode)
          $info.on("click", () => {
            $chk.prop("checked", !$chk.is(":checked")).trigger("change");
          });

        const $right = $(
          '<div style="display:flex; gap:6px; margin-left:auto; flex-shrink:0;"></div>',
        );
        // 🔒 条目锁定按钮
        $right.append(
          $(
            `<button class="menu_button interactable wb-nowrap-btn" style="margin:0; color:${isLockedEntry ? "#fcc419" : "gray"}; border:1px solid ${isLockedEntry ? "#fcc419" : "var(--SmartThemeBorderColor)"};" title="${isLockedEntry ? "已锁定，点击解锁（锁定的条目不会被批量删除）" : "锁定此条目，防止误删"}"><i class="fa-solid ${isLockedEntry ? "fa-lock" : "fa-lock-open"}"></i></button>`,
          ).on("click", (e) => {
            e.stopPropagation();
            const nowLocked = toggleEntryLock(tuneWbName, entry.uid);
            toastr.success(
              nowLocked
                ? `🔒 条目已锁定，批量删除时会自动跳过~`
                : `🔓 条目已解锁~`,
            );
            renderEntryList();
          }),
        );
        $right.append(
          $(
            '<button class="menu_button interactable wb-nowrap-btn btn-primary" style="margin:0;" title="修改内容"><i class="fa fa-pen-nib"></i></button>',
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
  // ========== 【功能6：查找替换】 开始 ==========
  $ui
    .find("#wb-btn-entry-replace")
    .off("click")
    .on("click", async () => {
      if (!tuneEntries || tuneEntries.length === 0)
        return toastr.warning("这本书还没有条目可以替换哦~");

      const dialogHtml = `
      <div style="padding:6px; font-family:sans-serif; min-width:300px; max-width:460px; text-align:left; max-height:70vh; overflow-y:auto;">
        <h3 style="margin-top:0; color:var(--SmartThemeQuoteColor); border-bottom:2px solid var(--SmartThemeBorderColor); padding-bottom:10px;">
          <i class="fa-solid fa-magnifying-glass-arrow-right"></i> 查找替换
          <span style="font-size:12px; font-weight:normal; color:gray;">当前书：${tuneWbName}</span>
        </h3>

        <div style="margin-bottom:12px;">
          <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:4px;">🔍 查找内容：</label>
          <input type="text" id="lulu-rep-find" class="text_pole" placeholder="要被替换掉的文字..." style="width:100%; box-sizing:border-box; padding:8px;">
        </div>

        <div style="margin-bottom:12px;">
          <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:4px;">✏️ 替换为：</label>
          <input type="text" id="lulu-rep-to" class="text_pole" placeholder="新的文字（留空=删除查找内容）..." style="width:100%; box-sizing:border-box; padding:8px;">
        </div>

        <div style="margin-bottom:10px; padding:10px; background:rgba(0,0,0,0.1); border-radius:6px;">
          <div style="font-size:12px; font-weight:bold; margin-bottom:8px; color:var(--SmartThemeQuoteColor);">📍 替换范围（至少勾一个）：</div>
          <label style="display:flex; align-items:center; gap:6px; font-size:13px; margin-bottom:6px; cursor:pointer;">
            <input type="checkbox" id="lulu-rep-content" checked style="accent-color:var(--SmartThemeQuoteColor);"> <span>条目正文内容</span>
          </label>
          <label style="display:flex; align-items:center; gap:6px; font-size:13px; margin-bottom:6px; cursor:pointer;">
            <input type="checkbox" id="lulu-rep-keys" style="accent-color:var(--SmartThemeQuoteColor);"> <span>触发关键字</span>
          </label>
          <label style="display:flex; align-items:center; gap:6px; font-size:13px; cursor:pointer;">
            <input type="checkbox" id="lulu-rep-name" style="accent-color:var(--SmartThemeQuoteColor);"> <span>条目名称</span>
          </label>
        </div>

        <label style="display:flex; align-items:center; gap:6px; font-size:13px; margin-bottom:12px; cursor:pointer;">
          <input type="checkbox" id="lulu-rep-case" style="accent-color:var(--SmartThemeQuoteColor);"> <span>区分大小写</span>
        </label>

        <div id="lulu-rep-nav" style="display:none; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px; padding:8px 10px; background:rgba(81,207,102,0.08); border:1px solid rgba(81,207,102,0.4); border-radius:6px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <button id="lulu-rep-nav-prev" class="menu_button interactable wb-nowrap-btn" style="margin:0; padding:4px 10px; font-size:12px;" title="上一处"><i class="fa-solid fa-chevron-up"></i></button>
            <button id="lulu-rep-nav-next" class="menu_button interactable wb-nowrap-btn" style="margin:0; padding:4px 10px; font-size:12px;" title="下一处"><i class="fa-solid fa-chevron-down"></i></button>
            <span id="lulu-rep-nav-info" style="font-size:12px; font-weight:bold; color:var(--SmartThemeQuoteColor); white-space:nowrap;">第 0 / 0 处</span>
          </div>
          <button id="lulu-rep-nav-do" class="menu_button interactable btn-success wb-nowrap-btn" style="margin:0; padding:4px 12px; font-size:12px; border:none;"><i class="fa-solid fa-check"></i> 替换这一处</button>
        </div>

        <div id="lulu-rep-preview" style="font-size:13px; padding:10px; border-radius:6px; background:var(--SmartThemeBotMesColor); border:1px dashed var(--SmartThemeBorderColor); text-align:center; color:gray; margin-bottom:12px; max-height:260px; overflow-y:auto;">
          点击下方「预览匹配」看看会替换多少处~
        </div>

        <div style="display:flex; gap:8px;">
          <button id="lulu-rep-preview-btn" class="menu_button interactable btn-primary wb-nowrap-btn" style="flex:1; margin:0; padding:8px; border:none;"><i class="fa-solid fa-eye"></i> 预览匹配</button>
          <button id="lulu-rep-do-btn" class="menu_button interactable btn-success wb-nowrap-btn" style="flex:1; margin:0; padding:8px; border:none;" disabled><i class="fa-solid fa-wand-magic-sparkles"></i> 全部替换</button>
        </div>
      </div>`;

      const $dlg = $(dialogHtml);
      $dlg
        .attr("id", "lulu-rep-dialog")
        .prepend(
          `<style>${buildPopupThemeCSS("dialog:has(#lulu-rep-dialog)")}</style>`,
        );

      const escapeReg = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const escapeHtml = (s) => String(s).replace(/</g, "<").replace(/>/g, ">");

      let matchList = [];
      let curMatchIdx = -1;

      const collectField = (
        entryIdx,
        field,
        keyIndex,
        text,
        reg,
        fieldLabel,
        out,
      ) => {
        if (!text) return;
        let m;
        reg.lastIndex = 0;
        while ((m = reg.exec(text)) !== null) {
          out.push({
            entryIdx,
            field,
            keyIndex,
            start: m.index,
            length: m[0].length,
            matchText: m[0],
            fieldLabel,
          });
          if (m[0].length === 0) reg.lastIndex++;
        }
      };

      const buildMatchList = () => {
        matchList = [];
        const find = $dlg.find("#lulu-rep-find").val();
        if (!find) return;
        const caseSensitive = $dlg.find("#lulu-rep-case").is(":checked");
        const doContent = $dlg.find("#lulu-rep-content").is(":checked");
        const doKeys = $dlg.find("#lulu-rep-keys").is(":checked");
        const doName = $dlg.find("#lulu-rep-name").is(":checked");
        const flags = caseSensitive ? "g" : "gi";

        tuneEntries.forEach((e, entryIdx) => {
          if (doName && e.name) {
            collectField(
              entryIdx,
              "name",
              -1,
              e.name,
              new RegExp(escapeReg(find), flags),
              "名称",
              matchList,
            );
          }
          if (doKeys && e.strategy?.keys) {
            e.strategy.keys.forEach((k, ki) => {
              collectField(
                entryIdx,
                "keys",
                ki,
                String(k),
                new RegExp(escapeReg(find), flags),
                "关键字",
                matchList,
              );
            });
          }
          if (doContent && e.content) {
            collectField(
              entryIdx,
              "content",
              -1,
              e.content,
              new RegExp(escapeReg(find), flags),
              "正文",
              matchList,
            );
          }
        });
      };

      const getFieldText = (mt) => {
        const e = tuneEntries[mt.entryIdx];
        if (!e) return "";
        if (mt.field === "name") return e.name || "";
        if (mt.field === "content") return e.content || "";
        if (mt.field === "keys")
          return String(e.strategy?.keys?.[mt.keyIndex] ?? "");
        return "";
      };

      const renderPreviewList = () => {
        if (matchList.length === 0) {
          $dlg
            .find("#lulu-rep-preview")
            .html(
              '<span style="color:gray;">没有找到任何匹配的内容呢 (´･ω･`)</span>',
            );
          $dlg.find("#lulu-rep-nav").css("display", "none");
          $dlg.find("#lulu-rep-do-btn").prop("disabled", true);
          return;
        }

        const find = $dlg.find("#lulu-rep-find").val();
        const to = $dlg.find("#lulu-rep-to").val();
        const CTX = 18;

        const byEntry = {};
        matchList.forEach((mt, globalIdx) => {
          if (!byEntry[mt.entryIdx]) byEntry[mt.entryIdx] = [];
          byEntry[mt.entryIdx].push({ ...mt, globalIdx });
        });

        let html = `<div style="text-align:center; margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid rgba(125,125,125,0.2);">共找到 <strong style="color:var(--SmartThemeQuoteColor); font-size:15px;">${matchList.length}</strong> 处匹配<br><span style="font-size:12px; color:gray;">[${escapeHtml(find)}] → [${escapeHtml(to) || "（空，即删除）"}]</span></div>`;
        html += '<div style="text-align:left;">';

        Object.keys(byEntry).forEach((eIdx) => {
          const e = tuneEntries[eIdx];
          const items = byEntry[eIdx];
          html += `<div style="margin-bottom:8px;"><div style="font-weight:bold; font-size:12.5px; color:var(--SmartThemeBodyColor); margin-bottom:2px;"><i class="fa-solid fa-file-lines" style="color:var(--SmartThemeQuoteColor); margin-right:4px;"></i>${escapeHtml(e.name || "(未命名条目)")} <span style="color:gray; font-weight:normal;">(${items.length}处)</span></div>`;
          items.forEach((mt) => {
            const text = getFieldText(mt);
            const start = mt.start;
            const end = mt.start + mt.length;
            const before = text.slice(Math.max(0, start - CTX), start);
            const after = text.slice(end, end + CTX);
            const prefix = start - CTX > 0 ? "…" : "";
            const suffix = end + CTX < text.length ? "…" : "";
            const isActive = mt.globalIdx === curMatchIdx;
            const markColor = isActive ? "#ff922b" : "#fcc419";
            html += `<div class="lulu-rep-snippet" data-gidx="${mt.globalIdx}" style="padding:4px 6px; line-height:1.5; border-radius:4px; cursor:pointer; margin-bottom:2px; ${isActive ? "background:rgba(255,146,43,0.15); border:1px solid #ff922b;" : "border:1px solid transparent;"}"><span style="font-size:10px; color:var(--SmartThemeQuoteColor); background:rgba(125,125,125,0.15); padding:1px 4px; border-radius:3px; margin-right:4px;">${mt.fieldLabel}</span>${prefix}${escapeHtml(before)}<mark style="background:${markColor}; color:#000; padding:0 2px; border-radius:2px; font-weight:bold;">${escapeHtml(mt.matchText)}</mark>${escapeHtml(after)}${suffix} <i class="fa-solid fa-pen-to-square lulu-rep-one" data-gidx="${mt.globalIdx}" style="color:#51cf66; margin-left:4px;" title="替换这一处"></i></div>`;
          });
          html += "</div>";
        });
        html += "</div>";
        $dlg.find("#lulu-rep-preview").html(html);

        $dlg.find("#lulu-rep-nav").css("display", "flex");
        $dlg
          .find("#lulu-rep-nav-info")
          .text(`第 ${curMatchIdx + 1} / ${matchList.length} 处`);
        $dlg.find("#lulu-rep-do-btn").prop("disabled", false);

        $dlg
          .find(".lulu-rep-snippet")
          .off("click")
          .on("click", function (ev) {
            if ($(ev.target).hasClass("lulu-rep-one")) return;
            curMatchIdx = parseInt($(this).attr("data-gidx"));
            renderPreviewList();
            scrollToActive();
          });
        $dlg
          .find(".lulu-rep-one")
          .off("click")
          .on("click", function (ev) {
            ev.stopPropagation();
            const gidx = parseInt($(this).attr("data-gidx"));
            doReplaceOne(gidx);
          });
      };

      const scrollToActive = () => {
        const $active = $dlg.find(
          `.lulu-rep-snippet[data-gidx="${curMatchIdx}"]`,
        );
        if ($active.length) {
          $active[0].scrollIntoView({ behavior: "smooth", block: "center" });
        }
      };

      const doReplaceOne = (gidx) => {
        const mt = matchList[gidx];
        if (!mt) return;
        const to = $dlg.find("#lulu-rep-to").val();
        const e = tuneEntries[mt.entryIdx];
        if (!e) return;

        const replaceAt = (str) =>
          str.slice(0, mt.start) + to + str.slice(mt.start + mt.length);

        if (mt.field === "name") {
          e.name = replaceAt(e.name || "");
        } else if (mt.field === "content") {
          e.content = replaceAt(e.content || "");
        } else if (mt.field === "keys") {
          const arr = e.strategy.keys.slice();
          arr[mt.keyIndex] = replaceAt(String(arr[mt.keyIndex] ?? ""));
          e.strategy.keys = arr;
          e.key = arr;
          e.keys = arr;
        }

        if (typeof luluTokenCache !== "undefined")
          delete luluTokenCache[tuneWbName];
        renderEntryList();

        const prevIdx = gidx;
        buildMatchList();
        if (matchList.length === 0) {
          curMatchIdx = -1;
        } else {
          curMatchIdx = Math.min(prevIdx, matchList.length - 1);
        }
        renderPreviewList();
        if (curMatchIdx >= 0) scrollToActive();

        toastr.success(
          "✨ 已替换这一处！记得最后点左下角绿色「确认并覆盖源文件」哦~",
        );
      };

      $dlg.find("#lulu-rep-preview-btn").on("click", () => {
        const find = $dlg.find("#lulu-rep-find").val();
        if (!find) {
          $dlg
            .find("#lulu-rep-preview")
            .html(
              '<span style="color:#ff6b6b;">请先输入要查找的内容哦~</span>',
            );
          $dlg.find("#lulu-rep-nav").css("display", "none");
          return;
        }
        if (
          !$dlg.find("#lulu-rep-content").is(":checked") &&
          !$dlg.find("#lulu-rep-keys").is(":checked") &&
          !$dlg.find("#lulu-rep-name").is(":checked")
        ) {
          $dlg
            .find("#lulu-rep-preview")
            .html(
              '<span style="color:#ff6b6b;">至少要勾选一个替换范围呀~</span>',
            );
          $dlg.find("#lulu-rep-nav").css("display", "none");
          return;
        }
        buildMatchList();
        curMatchIdx = matchList.length > 0 ? 0 : -1;
        renderPreviewList();
        if (curMatchIdx >= 0) scrollToActive();
      });

      $dlg.find("#lulu-rep-nav-prev").on("click", () => {
        if (matchList.length === 0) return;
        curMatchIdx = (curMatchIdx - 1 + matchList.length) % matchList.length;
        renderPreviewList();
        scrollToActive();
      });
      $dlg.find("#lulu-rep-nav-next").on("click", () => {
        if (matchList.length === 0) return;
        curMatchIdx = (curMatchIdx + 1) % matchList.length;
        renderPreviewList();
        scrollToActive();
      });
      $dlg.find("#lulu-rep-nav-do").on("click", () => {
        if (curMatchIdx < 0) return;
        doReplaceOne(curMatchIdx);
      });

      $dlg
        .find(
          "#lulu-rep-find, #lulu-rep-to, #lulu-rep-content, #lulu-rep-keys, #lulu-rep-name, #lulu-rep-case",
        )
        .on("input change", () => {
          $dlg.find("#lulu-rep-do-btn").prop("disabled", true);
          $dlg.find("#lulu-rep-nav").css("display", "none");
          matchList = [];
          curMatchIdx = -1;
        });

      $dlg.find("#lulu-rep-do-btn").on("click", () => {
        if (typeof doEntryReplace === "function") {
          doEntryReplace($dlg, escapeReg);
        }
      });

      await SillyTavern.callGenericPopup(
        $dlg,
        SillyTavern.POPUP_TYPE.TEXT,
        "",
        {
          okButton: "关闭",
        },
      );
    });
  // ========== 【功能6：查找替换】Part1 结束 ==========
  // ---- Part 2：执行替换逻辑 ----
  const doEntryReplace = ($dlg, escapeReg) => {
    const find = $dlg.find("#lulu-rep-find").val();
    if (!find) return;
    const to = $dlg.find("#lulu-rep-to").val();
    const caseSensitive = $dlg.find("#lulu-rep-case").is(":checked");
    const doContent = $dlg.find("#lulu-rep-content").is(":checked");
    const doKeys = $dlg.find("#lulu-rep-keys").is(":checked");
    const doName = $dlg.find("#lulu-rep-name").is(":checked");
    const flags = caseSensitive ? "g" : "gi";

    let replacedCount = 0;
    let affectedEntries = 0;

    tuneEntries.forEach((e) => {
      let entryTouched = false;
      // 每个字段用新的正则实例，避免 lastIndex 干扰
      if (doName && e.name) {
        const reg = new RegExp(escapeReg(find), flags);
        const m = e.name.match(reg);
        if (m) {
          e.name = e.name.replace(reg, to);
          replacedCount += m.length;
          entryTouched = true;
        }
      }
      if (doKeys && e.strategy?.keys && e.strategy.keys.length > 0) {
        e.strategy.keys = e.strategy.keys.map((k) => {
          const reg = new RegExp(escapeReg(find), flags);
          const str = String(k);
          const m = str.match(reg);
          if (m) {
            replacedCount += m.length;
            entryTouched = true;
            return str.replace(reg, to);
          }
          return k;
        });
        // 同步一下 key/keys 字段（你的脚本里两个都用）
        e.key = e.strategy.keys;
        e.keys = e.strategy.keys;
      }
      if (doContent && e.content) {
        const reg = new RegExp(escapeReg(find), flags);
        const m = e.content.match(reg);
        if (m) {
          e.content = e.content.replace(reg, to);
          replacedCount += m.length;
          entryTouched = true;
        }
      }
      if (entryTouched) affectedEntries++;
    });

    if (replacedCount === 0) {
      toastr.info("咦，没有替换任何内容呢~");
      return;
    }

    // 刷新列表 + 让 Token 缓存失效
    if (typeof luluTokenCache !== "undefined")
      delete luluTokenCache[tuneWbName];
    renderEntryList();

    toastr.success(
      `✨ 已替换 ${replacedCount} 处（涉及 ${affectedEntries} 个条目）！内容已暂存，记得点左下角绿色「确认并覆盖源文件」才会真正生效哦~`,
    );

    // 关掉替换弹窗
    $dlg.closest("dialog").find(".popup-button-ok").trigger("click");
  };
  // ---- 功能6 Part2 结束 ----
  let entrySearchDebounce;
  $ui
    .find("#wb-entry-search")
    .off("input")
    .on("input", () => {
      clearTimeout(entrySearchDebounce);
      entrySearchDebounce = setTimeout(() => renderEntryList(), 250);
    });
  $ui
    .find("#wb-entry-sort")
    .off("change")
    .on("change", function () {
      localStorage.setItem("lulu_wb_entry_sort", $(this).val());
      renderEntryList();
    });
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
  // ✨ 新增：在条目编辑页直接把当前书存为复合快照
  $ui
    .find("#wb-btn-entry-snapshot")
    .off("click")
    .on("click", async () => {
      if (!tuneWbName) return toastr.warning("当前没有正在编辑的世界书哦~");

      // 必须在角色聊天里，才能存角色快照
      const charName =
        typeof getCurrentCharacterName === "function"
          ? getCurrentCharacterName()
          : typeof SillyTavern !== "undefined"
            ? SillyTavern.getContext().name2
            : null;
      if (!charName)
        return toastr.warning("角色快照需要在打开某个角色的聊天时才能保存哦~");

      // 收集当前这本书里所有"已启用"的条目UID（对照表条目自动排除）
      const enabledUIDs = tuneEntries
        .filter((e) => e.enabled && !isLuluMapEntry(e))
        .map((e) => e.uid);

      if (enabledUIDs.length === 0) {
        return toastr.warning(
          "当前这本书没有任何启用的条目呢，无法创建空气快照哦~",
        );
      }

      // 读取角色快照
      let vars = getVariables({ type: "global" });
      let charSnaps = vars.wb_char_snapshots;
      if (typeof charSnaps === "string") {
        try {
          charSnaps = JSON.parse(charSnaps);
        } catch (e) {
          charSnaps = {};
        }
      }
      if (
        !charSnaps ||
        typeof charSnaps !== "object" ||
        Array.isArray(charSnaps)
      )
        charSnaps = {};
      const mySnaps = charSnaps[charName] || {};

      // ✨ 检测是否已有和当前配置一样的角色快照（只针对这一本书的）
      let duplicateSnapName = null;
      const sortedEnabled = [...enabledUIDs].sort();
      for (const [sName, sData] of Object.entries(mySnaps)) {
        if (!sData || typeof sData !== "object") continue;
        const dataKeys = Object.keys(sData);
        // 只对比"只包含当前这本书"的快照
        if (dataKeys.length !== 1 || dataKeys[0] !== tuneWbName) continue;
        const savedUIDs = [...(sData[tuneWbName] || [])].sort();
        if (
          savedUIDs.length === sortedEnabled.length &&
          savedUIDs.every((v, i) => v === sortedEnabled[i])
        ) {
          duplicateSnapName = sName;
          break;
        }
      }

      let snapName = "";
      let renameOldTo = null; // 记录"给旧快照改名"的目标
      if (duplicateSnapName) {
        const btnRes = await SillyTavern.callGenericPopup(
          `哎呀，[${tuneWbName}] 当前的启用配置，和角色 [${charName}] 已存的快照【${duplicateSnapName}】一模一样呢！<br>想要怎么处理呀？`,
          SillyTavern.POPUP_TYPE.TEXT,
          "",
          {
            okButton: "不用存了",
            customButtons: [
              {
                text: "还是存个新名字",
                result: 888,
                classes: ["btn-primary"],
              },
              {
                text: "给旧快照改个名",
                result: 999,
                classes: ["btn-warning"],
              },
            ],
          },
        );
        if (btnRes !== 888 && btnRes !== 999) return;
        snapName = await SillyTavern.callGenericPopup(
          `请给这个角色快照起个名字吧：`,
          SillyTavern.POPUP_TYPE.INPUT,
          btnRes === 999 ? duplicateSnapName : tuneWbName + " - 快照",
        );
        if (
          !snapName ||
          typeof snapName !== "string" ||
          !(snapName = snapName.trim())
        )
          return;
        if (btnRes === 999) renameOldTo = duplicateSnapName;
      } else {
        snapName = await SillyTavern.callGenericPopup(
          `将 [${tuneWbName}] 当前启用的 ${enabledUIDs.length} 个条目存为 [${charName}] 的角色快照。<br>请输入快照名称：`,
          SillyTavern.POPUP_TYPE.INPUT,
          tuneWbName + " - 快照",
        );
        if (
          !snapName ||
          typeof snapName !== "string" ||
          !(snapName = snapName.trim())
        )
          return;
      }

      // 重名检查（排除"给旧的改名"这种情况）
      if (mySnaps[snapName] && !(renameOldTo && snapName === renameOldTo)) {
        const overRes = await SillyTavern.callGenericPopup(
          `角色 [${charName}] 下已有名为【${snapName}】的快照，要覆盖它吗？`,
          SillyTavern.POPUP_TYPE.CONFIRM,
        );
        if (overRes !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
      }

      // 写入角色快照
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
          if (!v.wb_char_snapshots[charName])
            v.wb_char_snapshots[charName] = {};
          // 如果是"给旧快照改名"，先删掉旧的
          if (renameOldTo && renameOldTo !== snapName) {
            delete v.wb_char_snapshots[charName][renameOldTo];
          }
          v.wb_char_snapshots[charName][snapName] = {
            [tuneWbName]: enabledUIDs,
          };
          return v;
        },
        { type: "global" },
      );

      toastr.success(`✨ 角色快照 [${snapName}] 已保存到 [${charName}] 名下！`);
    });

  // ✨ 新增：在条目编辑页直接应用/切换快照
  $ui
    .find("#wb-btn-entry-apply-snap")
    .off("click")
    .on("click", async () => {
      if (!tuneWbName) return toastr.warning("当前没有正在编辑的世界书哦~");

      // 读取所有快照
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

      // 筛选出"和当前这本书相关"的全局/复合快照
      const relatedSnaps = {};
      Object.keys(snapshots).forEach((name) => {
        const sData = snapshots[name];
        const isDetailed = !Array.isArray(sData) && sData.type === "detailed";
        if (isDetailed && sData.data && sData.data[tuneWbName]) {
          relatedSnaps[name] = sData;
        } else if (!isDetailed) {
          const wbs = Array.isArray(sData) ? sData : sData.wbs;
          if (wbs && wbs.includes(tuneWbName)) {
            relatedSnaps[name] = sData;
          }
        }
      });

      // ✨ 额外读取"角色快照"，把和当前这本书相关的也加进来
      let charSnaps = vars.wb_char_snapshots;
      if (typeof charSnaps === "string") {
        try {
          charSnaps = JSON.parse(charSnaps);
        } catch (e) {
          charSnaps = {};
        }
      }
      if (
        !charSnaps ||
        typeof charSnaps !== "object" ||
        Array.isArray(charSnaps)
      )
        charSnaps = {};

      // 记录哪些是角色快照，应用时要用不同逻辑
      const charSnapFlag = {};
      const curCharName =
        typeof getCurrentCharacterName === "function"
          ? getCurrentCharacterName()
          : typeof SillyTavern !== "undefined"
            ? SillyTavern.getContext().name2
            : null;
      if (curCharName && charSnaps[curCharName]) {
        const mySnaps = charSnaps[curCharName];
        Object.keys(mySnaps).forEach((snapName) => {
          const snapData = mySnaps[snapName]; // { 世界书名: [UID...] }
          if (snapData && snapData[tuneWbName]) {
            // 用带前缀的显示名，避免和全局快照重名冲突
            const displayName = `👤 ${snapName}`;
            relatedSnaps[displayName] = {
              type: "detailed",
              data: { [tuneWbName]: snapData[tuneWbName] },
            };
            charSnapFlag[displayName] = true;
          }
        });
      }

      const relatedNames = sortSnapshotNames(Object.keys(relatedSnaps));
      // 构建弹窗列表
      let listHtml = "";
      if (relatedNames.length === 0) {
        listHtml = `<div style="color:gray; text-align:center; padding:24px; line-height:1.6;">还没有和 [${tuneWbName}] 相关的快照呢~<br>先用旁边的「存为快照」保存一个吧！(๑>؂<๑)</div>`;
      } else {
        listHtml =
          '<div style="display:flex; flex-direction:column; gap:8px;">';
        relatedNames.forEach((name) => {
          const sData = relatedSnaps[name];
          const isDetailed = !Array.isArray(sData) && sData.type === "detailed";
          let infoTxt = "";
          if (isDetailed) {
            const uids = sData.data[tuneWbName] || [];
            infoTxt = `复合快照 · 本书开启 ${uids.length} 项`;
          } else {
            infoTxt = "简单快照 · 含本书";
          }
          const safeName = encodeURIComponent(name);
          listHtml += `
            <div class="lulu-entry-snap-item" data-snapname="${safeName}" style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:10px 12px; background:var(--SmartThemeBotMesColor); border:1px solid var(--SmartThemeBorderColor); border-radius:6px; flex-wrap:wrap;">
              <div style="flex:1; min-width:120px;">
                <div style="font-weight:bold; font-size:14px; word-break:break-all;"><i class="fa-solid ${isDetailed ? "fa-puzzle-piece" : "fa-box-archive"}" style="color:var(--SmartThemeQuoteColor); margin-right:4px;"></i>${name}</div>
                <div style="font-size:11px; color:gray; margin-top:4px;">${infoTxt}</div>
              </div>
              <button class="menu_button interactable btn-success wb-nowrap-btn lulu-entry-snap-apply" data-snapname="${safeName}" style="margin:0; padding:6px 14px; font-size:12px; border:none; flex-shrink:0;">应用 <i class="fa-solid fa-play"></i></button>
            </div>`;
        });
        listHtml += "</div>";
      }

      const dialogHtml = `
        <div style="padding:6px; font-family:sans-serif; min-width:300px; max-width:460px; text-align:left;">
          <h3 style="margin-top:0; color:var(--SmartThemeQuoteColor); border-bottom:2px solid var(--SmartThemeBorderColor); padding-bottom:10px;">
            <i class="fa-solid fa-clapperboard"></i> 应用快照
            <span style="font-size:12px; font-weight:normal; color:gray; word-break:break-all;">${tuneWbName}</span>
          </h3>
          <div style="font-size:12px; color:gray; margin-bottom:10px; line-height:1.5;">
            下面是和当前这本书相关的快照，点「应用」即可切换本书的条目开关状态~
          </div>
          <div style="display:flex; gap:8px; margin-bottom:10px;">
            <input type="text" id="lulu-entry-snap-search" class="text_pole" placeholder="🔍 搜索快照名称..." style="flex:1; min-width:0; box-sizing:border-box; padding:8px; font-size:13px;">
            <button id="lulu-entry-snap-delmode" class="menu_button interactable btn-warning wb-nowrap-btn" style="margin:0; padding:6px 12px; font-size:12px; border:none; flex-shrink:0;"><i class="fa-solid fa-trash-can"></i> 删除模式</button>
          </div>
          <div id="lulu-entry-snap-delbar" style="display:none; align-items:center; gap:8px; margin-bottom:10px; padding:8px; background:rgba(255,107,107,0.08); border:1px dashed #ff6b6b; border-radius:6px;">
            <span style="font-size:12px; color:#ff6b6b; font-weight:bold; flex:1;">勾选要删的快照</span>
            <button id="lulu-entry-snap-doconfirm" class="menu_button interactable btn-danger wb-nowrap-btn" style="margin:0; padding:5px 12px; font-size:12px; border:none;"><i class="fa-solid fa-burst"></i> 确认删除</button>
          </div>
          <div id="lulu-entry-snap-list" style="max-height:50vh; overflow-y:auto; padding-right:4px;">${listHtml}</div>
        </div>`;

      const $dlg = $(dialogHtml);
      $dlg
        .attr("id", "lulu-entry-apply-snap-dialog")
        .prepend(
          `<style>${buildPopupThemeCSS("dialog:has(#lulu-entry-apply-snap-dialog)")}</style>`,
        );

      // 绑定应用按钮
      // ✨ 搜索栏：实时筛选快照卡片
      $dlg
        .find("#lulu-entry-snap-search")
        .off("input")
        .on("input", function () {
          const kw = $(this).val().toLowerCase();
          $dlg.find(".lulu-entry-snap-item").each(function () {
            const rawName = decodeURIComponent(
              $(this).attr("data-snapname") || "",
            ).toLowerCase();
            $(this).toggle(!kw || rawName.includes(kw));
          });
        });
      // 删除模式切换
      let entrySnapDelMode = false;
      $dlg
        .find("#lulu-entry-snap-delmode")
        .off("click")
        .on("click", function () {
          entrySnapDelMode = !entrySnapDelMode;
          if (entrySnapDelMode) {
            $(this)
              .removeClass("btn-warning")
              .addClass("btn-secondary")
              .html('<i class="fa-solid fa-xmark"></i> 退出删除');
            $dlg.find("#lulu-entry-snap-delbar").css("display", "flex");
            // 给每个卡片前面加复选框
            $dlg.find(".lulu-entry-snap-item").each(function () {
              if ($(this).find(".lulu-entry-snap-delchk").length === 0) {
                const sn = $(this).attr("data-snapname");
                $(this).prepend(
                  `<input type="checkbox" class="lulu-entry-snap-delchk" data-name="${sn}" style="accent-color:#ff6b6b; margin-right:8px; flex-shrink:0;">`,
                );
              }
              $(this).find(".lulu-entry-snap-apply").hide();
            });
          } else {
            $(this)
              .removeClass("btn-secondary")
              .addClass("btn-warning")
              .html('<i class="fa-solid fa-trash-can"></i> 删除模式');
            $dlg.find("#lulu-entry-snap-delbar").hide();
            $dlg.find(".lulu-entry-snap-delchk").remove();
            $dlg.find(".lulu-entry-snap-apply").show();
          }
        });

      // 确认删除
      $dlg
        .find("#lulu-entry-snap-doconfirm")
        .off("click")
        .on("click", async () => {
          const checkedNames = [];
          $dlg.find(".lulu-entry-snap-delchk:checked").each(function () {
            checkedNames.push(decodeURIComponent($(this).attr("data-name")));
          });
          if (checkedNames.length === 0)
            return toastr.info("没勾选任何快照哦~");
          const confirm = await SillyTavern.callGenericPopup(
            `确认删除选中的 ${checkedNames.length} 个快照吗？`,
            SillyTavern.POPUP_TYPE.CONFIRM,
          );
          if (confirm !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;

          // 分类：带 👤 的是角色快照，其余是全局快照
          const globalDel = [];
          const charDel = [];
          checkedNames.forEach((n) => {
            if (charSnapFlag[n]) {
              // 去掉 "👤 " 前缀，得到真实角色快照名
              charDel.push(n.replace(/^👤\s*/, ""));
            } else {
              globalDel.push(n);
            }
          });

          updateVariablesWith(
            (v) => {
              // 删全局快照
              if (typeof v.wb_snapshots === "string") {
                try {
                  v.wb_snapshots = JSON.parse(v.wb_snapshots);
                } catch (e) {
                  v.wb_snapshots = {};
                }
              }
              if (v.wb_snapshots)
                globalDel.forEach((n) => delete v.wb_snapshots[n]);
              // 删角色快照
              if (typeof v.wb_char_snapshots === "string") {
                try {
                  v.wb_char_snapshots = JSON.parse(v.wb_char_snapshots);
                } catch (e) {
                  v.wb_char_snapshots = {};
                }
              }
              if (
                v.wb_char_snapshots &&
                curCharName &&
                v.wb_char_snapshots[curCharName]
              ) {
                charDel.forEach(
                  (n) => delete v.wb_char_snapshots[curCharName][n],
                );
              }
              return v;
            },
            { type: "global" },
          );

          // 从列表移除对应卡片
          checkedNames.forEach((n) => {
            const safe = encodeURIComponent(n);
            $dlg
              .find(`.lulu-entry-snap-item[data-snapname="${safe}"]`)
              .remove();
          });
          toastr.success(`已删除 ${checkedNames.length} 个快照~`);
        });

      // 绑定应用按钮
      const bindApplyBtns = () => {
        $dlg
          .find(".lulu-entry-snap-apply")
          .off("click")
          .on("click", async function () {
            const snapName = decodeURIComponent($(this).attr("data-snapname"));
            const sData = relatedSnaps[snapName];
            if (!sData) return;

            const isDetailed =
              !Array.isArray(sData) && sData.type === "detailed";

            // 拿到该快照里"这本书"应该启用哪些UID
            let targetUIDs = [];
            if (isDetailed) {
              targetUIDs = sData.data[tuneWbName] || [];
            } else {
              // 简单快照没记录具体条目，无法精准还原本书条目
              toastr.warning(
                "这是简单快照（只记录了启用哪些书），无法精准还原本书的条目开关哦~ 建议用复合快照~",
              );
              return;
            }

            // 应用到当前内存里的 tuneEntries（不动源文件，等你点绿色保存）
            tuneEntries.forEach((e) => {
              if (isLuluMapEntry(e)) return;
              e.enabled = targetUIDs.includes(e.uid);
            });
            renderEntryList();

            toastr.success(
              `✨ 已套用快照 [${snapName}]！记得点左下角绿色「确认并覆盖源文件」才会真正写入哦~`,
            );

            // 关闭弹窗
            $dlg.closest("dialog").find(".popup-button-ok").trigger("click");
          });
      };
      setTimeout(bindApplyBtns, 50);

      await SillyTavern.callGenericPopup(
        $dlg,
        SillyTavern.POPUP_TYPE.TEXT,
        "",
        { okButton: "关闭" },
      );
    });
  // ---- 里面：单本书启用总 Token 按钮 ----
  $ui.find("#wb-btn-entry-replace").before(
    $(
      '<div class="wb-action-btn wb-nowrap-btn" id="wb-btn-calc-tune-tk" style="padding: 6px; color: #339af0; border-color: #339af0; background: rgba(51, 154, 240, 0.1);"><i class="fa-solid fa-coins"></i> 计算本书启用 Token</div>',
    ).on("click", async function () {
      const $btn = $(this);
      $btn.html('<i class="fa-solid fa-spinner fa-spin"></i> 算盘敲击中...');
      try {
        // 直接读取当前面板里(未保存或已保存)的条目状态
        const text = tuneEntries
          .filter((e) => e.enabled)
          .map((e) => e.content || "")
          .join("\n");
        if (!text) {
          $btn.html('<i class="fa-solid fa-check"></i> 本书总计: 0 Tk');
        } else {
          const tk =
            typeof getTokenCount === "function"
              ? await getTokenCount(text)
              : Math.ceil(text.length / 2.5);
          $btn.html(`<i class="fa-solid fa-check"></i> 本书总计: ${tk} Tk`);
        }
      } catch (e) {
        $btn.html('<i class="fa-solid fa-xmark"></i> 计算失败');
      }
      setTimeout(
        () => $btn.html('<i class="fa-solid fa-coins"></i> 计算本书启用 Token'),
        4000,
      );
    }),
  );
  // ---- 结束 ----
  $ui
    .find("#wb-btn-entry-add")
    .off("click")
    .on("click", () => {
      tuneEntries.unshift({
        uid: luluGetFreeEntryUid(tuneEntries),
        name: "新增编辑条目",
        enabled: true,
        content: "",
        group: "",
        key: [],
        keys: [],
        _lulu_ui_group: "",
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
    let isSuccess = await withLoadingOverlay(async () => {
      const uiGroupsMap = getWbUiGroups();
      if (!uiGroupsMap[tuneWbName]) uiGroupsMap[tuneWbName] = {};
      const pureEntries = JSON.parse(JSON.stringify(tuneEntries));

      pureEntries.forEach((e) => {
        if (e._lulu_ui_group && e._lulu_ui_group.trim() !== "") {
          const grpName = e._lulu_ui_group.trim();
          uiGroupsMap[tuneWbName][e.uid] = grpName;

          // ✨ 新增：将分组信息写入原生扩展字段，让原生导出和角色卡也能带走它！
          if (!e.extensions || typeof e.extensions !== "object")
            e.extensions = {};
          e.extensions.lulu_group = grpName;
        } else {
          delete uiGroupsMap[tuneWbName][e.uid];
          // 清理无用的扩展字段
          if (e.extensions && e.extensions.lulu_group) {
            delete e.extensions.lulu_group;
          }
        }
        delete e._lulu_ui_group;
      });
      saveWbUiGroups(uiGroupsMap);
      // ✨ 增强版：收集当前用到的"前缀→长分组名"映射
      //    只要一个分组存在，就登记进对照表（哪怕前缀=分组名，记成 {"世界观":"世界观"}）
      //    这样"前缀=分组名"的书导出后也带对照表，别人导入能自动还原
      const prefixMapUsed = {};
      const seenGroups = new Set();
      pureEntries.forEach((e) => {
        const grp =
          e.extensions && e.extensions.lulu_group
            ? e.extensions.lulu_group
            : "";
        if (grp && !seenGroups.has(grp)) {
          seenGroups.add(grp);
          const prefix = getGroupPrefix(tuneWbName, grp);
          // 修复：无论前缀是否等于分组名，都要记录进对照表
          // 这样即使没设自定义前缀，分组信息也不会丢失
          if (prefix) {
            prefixMapUsed[prefix] = grp;
          } else {
            // 如果没取到前缀（理论上不会），用分组名自身作为前缀
            prefixMapUsed[grp] = grp;
          }
        }
      });

      // 根据映射，生成/更新/清理对照表条目
      syncMapEntryIntoEntries(pureEntries, prefixMapUsed);
      await replaceWorldbook(tuneWbName, pureEntries);
    }, `写入中...`);
    if (isSuccess === false) return; // 补丁：如果没成功，立刻停下，不要往下弹绿条了！

    originalTuneEntries = JSON.parse(JSON.stringify(tuneEntries));
    // 修复补丁：先判断存不存在，防止代码在这里卡死崩溃
    if (typeof luluTokenCache !== "undefined") {
      delete luluTokenCache[tuneWbName]; // Token缓存失效（功能7）
    }
    // 修复补丁结束
    toastr.success(`[${tuneWbName}] 的修改已经成功保存啦！`);
    if (tuneReturnView === "#wb-main-view") renderData();
    else if (tuneReturnView === "#wb-char-view") renderCharView();
  });
  $ui.find("#wb-btn-entry-cancel").on("click", async () => {
    let isDirty =
      JSON.stringify(tuneEntries) !== JSON.stringify(originalTuneEntries);

    if (!isDirty && tuneDetailIndex !== -1) {
      const e = tuneEntries[tuneDetailIndex];
      if (e) {
        const currentName = $ui.find("#wb-det-name").val() || "";
        const currentContent = $ui.find("#wb-det-content").val() || "";
        const currentKeys = $ui
          .find("#wb-det-keys")
          .val()
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .join(",");

        const originalName = e.name || "";
        const originalContent = e.content || "";
        const originalKeys = (e.strategy?.keys || []).join(",");

        if (
          currentName !== originalName ||
          currentContent !== originalContent ||
          currentKeys !== originalKeys
        ) {
          isDirty = true;
        }
      }
    }

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

  let wbTokenCalcTimer;
  const updateWbTokenCount = async () => {
    const text = $ui.find("#wb-det-content").val() || "";
    if (!text) {
      $ui.find("#wb-det-token-count").text("0 Tokens");
      return;
    }
    try {
      let tokens = 0;
      if (typeof getTokenCount === "function") {
        tokens = await getTokenCount(text);
      } else {
        tokens = Math.ceil(text.length / 2.5);
      }
      $ui.find("#wb-det-token-count").text(`${tokens} Tokens`);
    } catch (e) {
      $ui.find("#wb-det-token-count").text("计算失败");
    }
  };

  $ui.find("#wb-det-content").on("input", () => {
    clearTimeout(wbTokenCalcTimer);
    $ui.find("#wb-det-token-count").text("...");
    wbTokenCalcTimer = setTimeout(updateWbTokenCount, 400);
  });
  // ✨ 新增：字体大小调节逻辑
  let currentWbFontSize =
    parseInt(localStorage.getItem("lulu_wb_font_size")) || 13;
  const applyWbFontSize = () => {
    // 强制使用 important 覆盖原有的样式优先级
    $ui
      .find("#wb-det-content")[0]
      .style.setProperty("font-size", `${currentWbFontSize}px`, "important");
  };
  applyWbFontSize(); // 面板打开时初始化应用

  $ui.find("#wb-font-inc").on("click", (e) => {
    e.preventDefault();
    currentWbFontSize = Math.min(32, currentWbFontSize + 1); // 最大限制放大到 32px
    localStorage.setItem("lulu_wb_font_size", currentWbFontSize);
    applyWbFontSize();
  });

  $ui.find("#wb-font-dec").on("click", (e) => {
    e.preventDefault();
    currentWbFontSize = Math.max(9, currentWbFontSize - 1); // 最小限制缩小到 9px
    localStorage.setItem("lulu_wb_font_size", currentWbFontSize);
    applyWbFontSize();
  });
  let tuneDetailIndex = -1;
  $ui.find("#wb-det-position").on("change", function () {
    const isDepth = $(this).val().startsWith("at_depth_");
    $ui.find("#wb-det-depth-container").toggle(isDepth);
    if (isDepth) {
      $ui.find("#wb-det-ui-compress").addClass("has-depth");
    } else {
      $ui.find("#wb-det-ui-compress").removeClass("has-depth");
    }
  });

  const getEntryNumberParam = (entry, keys, fallback = "") => {
    for (const key of keys) {
      const parts = key.split(".");
      let value = entry;
      for (const part of parts) value = value?.[part];
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return fallback;
  };
  const applyAdvancedParamVisibility = () => {
    const isDetailed = $ui.find("#wb-det-advanced-toggle").is(":checked");
    $ui
      .find("#wb-det-advanced-panel")
      .css("display", isDetailed ? "flex" : "none");
  };
  $ui.find("#wb-det-advanced-toggle").on("change", () => {
    localStorage.setItem(
      "lulu_wb_detail_params_enabled",
      $ui.find("#wb-det-advanced-toggle").is(":checked") ? "true" : "false",
    );
    applyAdvancedParamVisibility();
  });

  // ✨ 一键复制 UID
  $ui.find("#wb-det-uid-copy").on("click", async (e) => {
    e.preventDefault();
    const uidVal = $ui.find("#wb-det-uid").val();
    if (uidVal === "" || uidVal === null || uidVal === undefined) {
      return toastr.warning("这个条目还没有 UID 呢~");
    }
    let copied = false;
    // 优先用现代剪贴板 API
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(String(uidVal));
        copied = true;
      }
    } catch (err) {
      copied = false;
    }
    // 兜底方案（某些手机/旧环境不支持上面的 API）
    if (!copied) {
      try {
        const $temp = $("<textarea>")
          .val(String(uidVal))
          .css({ position: "fixed", left: "-9999px", top: "0" })
          .appendTo("body");
        $temp[0].select();
        document.execCommand("copy");
        $temp.remove();
        copied = true;
      } catch (err2) {
        copied = false;
      }
    }
    if (copied) {
      toastr.success(`✨ UID [${uidVal}] 已复制到剪贴板~`);
      // 按钮变个勾勾反馈一下
      const $btn = $ui.find("#wb-det-uid-copy");
      const oldHtml = $btn.html();
      $btn.html('<i class="fa-solid fa-check"></i>');
      setTimeout(() => $btn.html(oldHtml), 1200);
    } else {
      toastr.error("复制失败了，可以手动长按选中框里的 UID 复制哦~");
    }
  });

  const openDetailEditView = (index) => {
    $ui.find("#wb-entry-split-wrapper").addClass("is-editing-entry"); // ✨新增：标记进入编辑状态
    tuneDetailIndex = index;
    const e = tuneEntries[index];
    $ui.find("#wb-detail-title").text(e.name || "空参数");
    $ui.find("#wb-det-name").val(e.name || "");
    $ui.find("#wb-det-content").val(e.content || "");
    updateWbTokenCount();
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
    // 填充 UID（只读）
    $ui
      .find("#wb-det-uid")
      .val(e.uid !== undefined && e.uid !== null ? e.uid : "");
    $ui
      .find("#wb-det-probability")
      .val(
        getEntryNumberParam(e, ["probability", "extensions.probability"], 100),
      );
    $ui
      .find("#wb-det-sticky")
      .val(
        getEntryNumberParam(
          e,
          ["sticky", "effect.sticky", "extensions.sticky"],
          "",
        ),
      );
    $ui
      .find("#wb-det-cooldown")
      .val(
        getEntryNumberParam(
          e,
          ["cooldown", "effect.cooldown", "extensions.cooldown"],
          "",
        ),
      );
    $ui
      .find("#wb-det-delay")
      .val(
        getEntryNumberParam(
          e,
          ["delay", "effect.delay", "extensions.delay"],
          "",
        ),
      );
    $ui
      .find("#wb-det-advanced-toggle")
      .prop(
        "checked",
        localStorage.getItem("lulu_wb_detail_params_enabled") === "true",
      );
    applyAdvancedParamVisibility();

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
      rawPos = $ui.find("#wb-det-position").val(),
      pos = rawPos || "at_depth_system", // 补丁1：防止有些条目位置为空导致代码直接报错卡死
      order = parseInt($ui.find("#wb-det-order").val()) || 100;
    e.name = $ui.find("#wb-det-name").val();
    e.content = $ui.find("#wb-det-content").val();

    const parsedKeys = $ui
      .find("#wb-det-keys")
      .val()
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    e.strategy = {
      type: $ui.find("#wb-det-strategy").val(),
      keys: parsedKeys,
    };
    e.key = parsedKeys;
    e.keys = parsedKeys;

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

    const parseOptionalNumber = (value) => {
      if (value === undefined || value === null || `${value}`.trim() === "")
        return null;
      const num = Number(value);
      return Number.isNaN(num) ? null : num;
    };
    const probabilityVal = parseOptionalNumber(
      $ui.find("#wb-det-probability").val(),
    );
    const stickyVal = parseOptionalNumber($ui.find("#wb-det-sticky").val());
    const cooldownVal = parseOptionalNumber($ui.find("#wb-det-cooldown").val());
    const delayVal = parseOptionalNumber($ui.find("#wb-det-delay").val());
    if (probabilityVal !== null) {
      e.probability = Math.min(100, Math.max(0, probabilityVal));
      if (!e.extensions || typeof e.extensions !== "object") e.extensions = {};
      e.extensions.probability = e.probability;
    }
    if (!e.effect || typeof e.effect !== "object") e.effect = {};
    if (stickyVal !== null) {
      e.sticky = stickyVal;
      e.effect.sticky = stickyVal;
      if (!e.extensions || typeof e.extensions !== "object") e.extensions = {};
      e.extensions.sticky = stickyVal;
    }
    if (cooldownVal !== null) {
      e.cooldown = cooldownVal;
      e.effect.cooldown = cooldownVal;
      if (!e.extensions || typeof e.extensions !== "object") e.extensions = {};
      e.extensions.cooldown = cooldownVal;
    }
    if (delayVal !== null) {
      e.delay = delayVal;
      e.effect.delay = delayVal;
      if (!e.extensions || typeof e.extensions !== "object") e.extensions = {};
      e.extensions.delay = delayVal;
    }
    localStorage.setItem(
      "lulu_wb_detail_params_enabled",
      $ui.find("#wb-det-advanced-toggle").is(":checked") ? "true" : "false",
    );

    // 补丁2：给暂存按钮也加上 Token 缓存失效，防患于未然
    if (typeof luluTokenCache !== "undefined") {
      delete luluTokenCache[tuneWbName];
    }

    if (typeof toastr !== "undefined") {
      toastr.info("当前内容已暂存，彻底保存还要另外点绿色的【确认】哦！");
    }

    if (window.innerWidth > 768) {
      $ui.find("#wb-entry-detail-side").hide();
      tuneDetailIndex = -1;
    }
    $ui.find("#wb-entry-split-wrapper").removeClass("is-editing-entry"); // ✨新增：退出编辑状态
    renderEntryList();
  });

  $ui
    .find("#wb-btn-det-cancel, #wb-btn-det-close-mobile")
    .off("click")
    .on("click", async () => {
      try {
        if (tuneDetailIndex !== -1) {
          const e = tuneEntries[tuneDetailIndex];
          if (e) {
            const currentName = $ui.find("#wb-det-name").val() || "";
            const currentContent = (
              $ui.find("#wb-det-content").val() || ""
            ).replace(/\r\n/g, "\n");
            const originalContent = (e.content || "").replace(/\r\n/g, "\n");

            const rawKeys = $ui.find("#wb-det-keys").val() || "";
            const currentKeys = rawKeys
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .join(",");
            const originalKeys = (e.strategy?.keys || []).join(",");

            if (
              currentName !== (e.name || "") ||
              currentContent !== originalContent ||
              currentKeys !== originalKeys
            ) {
              const confirm = await SillyTavern.callGenericPopup(
                `参数面板里还有没点击“暂存修改”的内容哦！<br>直接撤销将丢失当前修改，确定吗？`,
                SillyTavern.POPUP_TYPE.CONFIRM,
              );
              if (confirm !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
            }

            $ui.find("#wb-det-name").val(e.name || "");
            $ui.find("#wb-det-content").val(e.content || "");
            $ui.find("#wb-det-keys").val((e.strategy?.keys || []).join(", "));
            $ui.find("#wb-detail-title").text(e.name || "未命名条目");

            if (typeof updateWbTokenCount === "function") {
              updateWbTokenCount();
            }
          }
        }
        $ui.find("#wb-entry-split-wrapper").removeClass("is-editing-entry"); // ✨新增：退出编辑状态
        if (window.innerWidth > 768) {
          $ui.find("#wb-entry-detail-side").hide();
          tuneDetailIndex = -1;
        } else {
          $ui.find("#wb-entry-detail-side").css("display", "flex");
        }
      } catch (err) {
        console.error("Lulu WB Editor: 撤销按钮发生错误", err);

        if (window.innerWidth > 768) $ui.find("#wb-entry-detail-side").hide();
      }
    });
  await popup.show();

  (function initLuLuNativeWbSyncV7() {
    if (window.lulu_native_sync_interval)
      clearInterval(window.lulu_native_sync_interval);

    // ✨ 判断某个分组当前是"全开""全关"还是"混合"状态
    const luluGetGroupState = (grpName) => {
      const $switches = $(`.world_entry[data-lulu-grp="${grpName}"]`).find(
        ".killSwitch",
      );
      if ($switches.length === 0) return "empty";
      let onCount = 0;
      $switches.each(function () {
        if ($(this).hasClass("fa-toggle-on")) onCount++;
      });
      if (onCount === 0) return "off"; // 全关
      if (onCount === $switches.length) return "on"; // 全开
      return "mixed"; // 混合
    };

    // ✨ 一键开关某个原生分组内所有条目
    const luluToggleGroupEntries = (grpName, enable) => {
      const $switches = $(`.world_entry[data-lulu-grp="${grpName}"]`).find(
        ".killSwitch",
      );
      if ($switches.length === 0) {
        if (typeof toastr !== "undefined")
          toastr.info("这个分组里好像没有可操作的条目呢~");
        return;
      }
      let count = 0;
      $switches.each(function () {
        const isOn = $(this).hasClass("fa-toggle-on");
        // 只有当前状态和目标状态不一致时，才点击切换
        if (isOn !== enable) {
          this.click();
          count++;
        }
      });
      if (typeof toastr !== "undefined") {
        toastr.success(
          enable
            ? `已开启分组「${grpName}」内 ${count} 个条目！`
            : `已关闭分组「${grpName}」内 ${count} 个条目！`,
        );
      }
      // 点完后刷新一下按钮图标显示
      luluUpdateGroupSwitchIcon(grpName);
    };

    // ✨ 根据分组状态，更新表头那个一键开关图标的样子
    const luluUpdateGroupSwitchIcon = (grpName) => {
      const $btn = $(
        `.lulu-native-group-header[data-groupname="${grpName}"] .lulu-grp-toggle`,
      );
      if (!$btn.length) return;
      const state = luluGetGroupState(grpName);
      if (state === "on") {
        // 全开 → 显示"开"图标，绿色，点击会全关
        $btn
          .removeClass("fa-toggle-off")
          .addClass("fa-toggle-on")
          .css("color", "#51cf66")
          .attr("data-next", "off")
          .attr("title", "本组已全开，点击一键全关");
      } else {
        // 全关或混合 → 显示"关"图标，灰色，点击会全开
        $btn
          .removeClass("fa-toggle-on")
          .addClass("fa-toggle-off")
          .css("color", "gray")
          .attr("data-next", "on")
          .attr(
            "title",
            state === "mixed"
              ? "本组部分开启，点击一键全开"
              : "本组已全关，点击一键全开",
          );
      }
    };
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
    let isRendering = false;
    let luluLastSyncFingerprint = "";
    window.lulu_native_sync_interval = setInterval(async () => {
      if (isRendering) return;
      if (document.hidden) return;
      const isNativeMagicEnabled =
        localStorage.getItem("lulu_wb_native_magic_enabled") !== "false";

      // 【性能优化】原生分类已关闭且已清理完时，直接休息，连选择器都不跑
      //    这样在聊天消息很多的大DOM页面上，可以减少后台空转开销
      if (!isNativeMagicEnabled && window.lulu_native_cleaned) return;

      const $entries = $(".world_entry");
      if ($entries.length === 0) return;
      const $container = $entries.first().parent();
      if (!$container.length) return;
      if (!$container.is(":visible")) return;
      // ✨ 内容指纹：状态没变就直接跳过（注意：指纹要等画完了才记录，不能在这里就记）
      let luluCurrentFp = null;
      if (isNativeMagicEnabled) {
        const _wbName =
          $(".move_entry_button").first().attr("data-current-world") || "";
        const _order = localStorage.getItem("lulu_wb_native_group_order") || "";
        const _fold = localStorage.getItem("lulu_wb_native_fold_state") || "";
        const _headerCount = $container.children(
          ".lulu-native-group-header",
        ).length;
        luluCurrentFp = `${_wbName}|${$entries.length}|${_order}|${_fold}|${_headerCount}`;
        if (luluCurrentFp === luluLastSyncFingerprint) return;
      }
      if (!isNativeMagicEnabled) {
        // ✨【性能优化】只清理一次，不再每轮反复检查样式
        if ($container.css("display") === "flex") {
          $container.css({ display: "", "flex-direction": "" });
          $(".lulu-native-group-header").remove();
          $entries.css({ order: "", display: "", margin: "" });
        }
        window.lulu_native_cleaned = true;
        return;
      }

      // ✨ 原生分组开启时，重置清理标记（这样以后关闭时还能再清理一次）
      window.lulu_native_cleaned = false;
      if (isFetching) return;
      if (
        $container.css("display") !== "flex" ||
        $container.css("flex-direction") !== "column"
      ) {
        $container.css({ display: "flex", "flex-direction": "column" });
      }
      const $moveBtn = $(".move_entry_button").first();
      let visibleWbName = $moveBtn.attr("data-current-world");
      if (!visibleWbName) {
        visibleWbName =
          $("#world_info_select").val() ||
          $(".world_info_select").first().val() ||
          "";
      }
      if (!visibleWbName) return;

      if (currentActiveWbName !== visibleWbName) {
        isFetching = true;
        try {
          const rawData = await getWorldbook(visibleWbName);
          if (Array.isArray(rawData)) {
            cachedWbEntries = rawData;
            currentActiveWbName = visibleWbName;
          } else if (rawData && typeof rawData === "object") {
            // 兼容某些版本返回 { entries: [...] } 或 { entries: { ... } }
            const maybeEntries = rawData.entries || rawData.data?.entries;
            const arr = Array.isArray(maybeEntries)
              ? maybeEntries
              : maybeEntries
                ? Object.values(maybeEntries)
                : [];
            if (arr.length > 0) {
              cachedWbEntries = arr;
              currentActiveWbName = visibleWbName;
            }
          }
        } catch (err) {
          console.warn("Lulu 原生同步：读取世界书失败", err);
        } finally {
          isFetching = false;
        }
      }
      if (!cachedWbEntries || cachedWbEntries.length === 0) return;
      if (currentActiveWbName !== visibleWbName) return;

      const entryByName = new Map();
      const entryByUid = new Map();
      for (const e of cachedWbEntries) {
        const title = e.name || e.comment || "";
        if (title && !entryByName.has(title)) entryByName.set(title, e);
        const uid = e.uid !== undefined && e.uid !== null ? e.uid : e.id;
        if (uid !== undefined && uid !== null) {
          entryByUid.set(String(uid), e);
          const uidNum = Number(uid);
          if (!Number.isNaN(uidNum)) entryByUid.set(String(uidNum), e);
        }
      }

      const luluPrefixMap = readGroupMapFromEntries(cachedWbEntries);

      const groupCounts = {};
      $entries.each(function (index) {
        const $entry = $(this);

        let entryTitle =
          $entry.find('textarea[name="comment"]').val()?.trim() || "";
        if (!entryTitle) {
          entryTitle = $entry.find('input[name="comment"]').val()?.trim() || "";
        }
        if (!entryTitle) {
          entryTitle =
            $entry.find('textarea, input[type="text"]').first().val()?.trim() ||
            "";
        }
        if (!entryTitle) {
          entryTitle = (
            $entry.attr("data-comment") ||
            $entry.attr("title") ||
            ""
          ).trim();
        }

        // 对照表条目直接隐藏
        if (entryTitle.indexOf(LULU_MAP_ENTRY_TAG) === 0) {
          $entry.css("display", "none");
          $entry.attr("data-lulu-grp", "__LULU_MAP__");
          return true;
        }

        let myGroup = "📁 未分类条目";

        let domUid = null;
        const rawUidAttr =
          $entry.attr("uid") ||
          $entry.attr("data-uid") ||
          $entry.attr("data-entry-uid") ||
          $entry.data("uid") ||
          $entry.data("id");
        if (
          rawUidAttr !== undefined &&
          rawUidAttr !== null &&
          rawUidAttr !== ""
        ) {
          const parsed = parseInt(rawUidAttr, 10);
          if (!isNaN(parsed)) domUid = parsed;
        }
        if (domUid === null) {
          const attrs = $entry[0].attributes;
          for (const attr of attrs) {
            if (/uid/i.test(attr.name)) {
              const parsed = parseInt(attr.value, 10);
              if (!isNaN(parsed)) {
                domUid = parsed;
                break;
              }
            }
          }
        }

        let foundEntry = null;
        if (domUid !== null) {
          foundEntry = entryByUid.get(String(domUid)) || entryByUid.get(domUid);
        }
        if (!foundEntry && entryTitle) {
          foundEntry = entryByName.get(entryTitle);
        }

        if (foundEntry) {
          // 1) 先读全局分组缓存 / extensions.lulu_group
          let uiGrpName = getEntryUiGroup(
            currentActiveWbName,
            foundEntry.uid,
            foundEntry,
          );

          // 2) 如果没有，再像脚本面板一样，用【前缀】+ 世界书对照表解析
          if ((!uiGrpName || uiGrpName.trim() === "") && foundEntry.name) {
            const prefixMatch = (foundEntry.name || "").match(/^【(.*?)】/);
            if (prefixMatch && prefixMatch[1]) {
              const rawPrefix = prefixMatch[1].trim();
              if (luluPrefixMap && luluPrefixMap[rawPrefix]) {
                uiGrpName = luluPrefixMap[rawPrefix];
              }
            }
          }

          if (uiGrpName && uiGrpName.trim() !== "") myGroup = uiGrpName.trim();
        }

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
            `<div class="lulu-native-group-header" data-groupname="${gName}" draggable="${isDraggable ? "true" : "false"}" style="background: var(--SmartThemeBlurTintColor, rgba(0,0,0,0.15)); padding:10px 14px; margin: 10px 0 6px 0; border-radius:6px; font-weight:bold; color:var(--SmartThemeQuoteColor, #70a1ff); border:1px solid var(--SmartThemeBorderColor, gray); display:flex; justify-content:space-between; align-items:center; user-select:none; transition: 0.2s; flex-shrink: 0; align-content: center; gap: 6px; flex-wrap: wrap;"><span style="display:flex; align-items:center; min-width:0;">${dragIconHtml}<span class="lulu-click-fold" style="display:flex; align-items:center; cursor:pointer; min-width:0;"><i class="fa-solid ${isFolded ? "fa-chevron-right" : "fa-chevron-down"} lulu-fold-icon" style="margin-right:8px; width: 16px; text-align:center; flex-shrink:0;"></i><span style="font-size: 14.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" class="lulu-g-title">${gName}</span><span style="font-size: 11px; font-weight: normal; color: gray; margin-left: 6px; flex-shrink:0;" class="lulu-g-count">(${groupCounts[gName]}项)</span></span></span><span style="display:flex; align-items:center; gap:6px; flex-shrink:0;">${sortButtonsHtml}<i class="fa-solid fa-toggle-off lulu-grp-toggle" title="一键开关本组所有条目" data-next="on" style="padding:5px; font-size:15px; color:gray; cursor:pointer; transition:0.2s;"></i></span></div>`,
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
          $header
            .find(".lulu-click-fold")
            .off("click.luluFold")
            .on("click.luluFold", function (e) {
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
                $icon
                  .removeClass("fa-chevron-down")
                  .addClass("fa-chevron-right");
              else
                $icon
                  .removeClass("fa-chevron-right")
                  .addClass("fa-chevron-down");
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
            $header.off("dragstart").on("dragstart", function (e) {
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
          $header
            .find(".lulu-move-up")
            .off("click")
            .on("click", function (e) {
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
          $header
            .find(".lulu-move-down")
            .off("click")
            .on("click", function (e) {
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

          // ✨ 单个一键开关：根据当前状态智能全开/全关
          $header
            .find(".lulu-grp-toggle")
            .off("click")
            .on("click", function (e) {
              e.stopPropagation();
              const grp = $header.attr("data-groupname");
              const next = $(this).attr("data-next"); // "on" 或 "off"
              luluToggleGroupEntries(grp, next === "on");
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
        // ✨ 每轮同步都更新一下这个分组的一键开关图标
        luluUpdateGroupSwitchIcon(gName);
        $header.css("order", baseOrder);
        // ✨ 关键修复：每次循环都实时读取最新折叠状态，而不是用创建表头时的旧变量
        const isFoldedNow = groupFoldState[gName] === true;
        // 顺便同步一下图标，保证图标和实际状态一致
        const $iconSync = $header.find(".lulu-fold-icon");
        if (isFoldedNow)
          $iconSync.removeClass("fa-chevron-down").addClass("fa-chevron-right");
        else
          $iconSync.removeClass("fa-chevron-right").addClass("fa-chevron-down");
        $container
          .children(`.world_entry[data-lulu-grp="${gName}"]`)
          .each(function () {
            const nativeIdx = parseInt(
              $(this).attr("data-lulu-native-index") || 0,
            );
            const targetOrder = baseOrder + 1 + nativeIdx;
            const $this = $(this);
            // ✨【性能优化】用 data 属性缓存 order，避免每次读取样式强制重排
            if (parseInt($this.attr("data-lulu-order") || "") !== targetOrder) {
              $this.attr("data-lulu-order", targetOrder);
              $this.css("order", targetOrder);
            }
            if (isFoldedNow) {
              if (!$this.hasClass("lulu-folded-hide"))
                $this.addClass("lulu-folded-hide");
            } else {
              if ($this.hasClass("lulu-folded-hide")) {
                $this.removeClass("lulu-folded-hide");
                $this.css({ display: "", margin: "" });
              }
            }
          });
      });

      $container.children(".lulu-native-group-header").each(function () {
        const gName = $(this).attr("data-groupname");
        if (!groupCounts[gName]) $(this).remove();
      });
      // ✨ 走到这里说明这一轮真的把分组画完了，现在才记录指纹
      if (luluCurrentFp !== null) luluLastSyncFingerprint = luluCurrentFp;
      isRendering = true;
      setTimeout(() => {
        isRendering = false;
      }, 150);
    }, 2000);
  })();
});
// ========== 【自动拦截】导入/点进角色卡时，检测内嵌世界书污染 开始 ==========
(function luluAutoDetectEmbeddedPollution() {
  if (window.lulu_auto_detect_inited) return;
  window.lulu_auto_detect_inited = true;

  // ✨ 永久记忆：处理过（或选了忽略）的角色，永远不再打扰
  // 存在浏览器本地，重启酒馆也记得
  const LULU_DONE_KEY = "lulu_wb_pollution_handled_chars";
  const getHandledChars = () => {
    try {
      return JSON.parse(localStorage.getItem(LULU_DONE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  };
  const markCharHandled = (avatar) => {
    if (!avatar) return;
    const list = getHandledChars();
    if (!list.includes(avatar)) {
      list.push(avatar);
      localStorage.setItem(LULU_DONE_KEY, JSON.stringify(list));
    }
  };
  const isCharHandled = (avatar) => getHandledChars().includes(avatar);

  // 读取指定角色卡内嵌的世界书原始数据
  const luluAutoReadEmbeddedBook = async (avatar) => {
    try {
      const raw = await $.ajax({
        url: "/api/characters/get",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ avatar_url: avatar }),
      });
      const d = raw.data || raw;
      const book = d.character_book;
      if (!book || typeof book === "string") return null;
      const rawEntries = Array.isArray(book.entries)
        ? book.entries
        : Object.values(book.entries || {});
      if (rawEntries.length === 0) return null;
      return { name: book.name || "", entries: rawEntries };
    } catch (e) {
      console.error("Lulu 自动检测：读取内嵌世界书失败", e);
      return null;
    }
  };

  // 把卡内嵌的条目，转换成脚本内部用的条目格式
  const luluAutoConvertEmbedded = (rawEntries) =>
    rawEntries.map((e, i) => {
      const ext = e.extensions || {};
      const keys = Array.isArray(e.keys)
        ? e.keys
        : Array.isArray(e.key)
          ? e.key
          : [];
      const enabled = e.enabled !== false && e.disable !== true;
      const isConstant = e.constant === true || keys.length === 0;
      const order = e.insertion_order ?? e.order ?? 100;
      let posNum = typeof ext.position === "number" ? ext.position : null;
      if (posNum === null) {
        posNum =
          e.position === "before_char"
            ? 0
            : e.position === "after_char"
              ? 1
              : 4;
      }
      const typeMap = {
        0: "before_character_definition",
        1: "after_character_definition",
        2: "before_example_messages",
        3: "after_example_messages",
        5: "before_author_note",
        6: "after_author_note",
      };
      const role =
        ext.role === 1 ? "user" : ext.role === 2 ? "assistant" : "system";
      const position = typeMap[posNum]
        ? { type: typeMap[posNum], order }
        : { type: "at_depth", role, depth: ext.depth ?? 4, order };
      const name = e.comment || e.name || `条目${i + 1}`;
      const uid = e.id ?? Date.now() + i;
      const preventIn = !!ext.exclude_recursion;
      const preventOut = !!ext.prevent_recursion;
      return {
        uid,
        id: uid,
        name,
        comment: name,
        title: name,
        enabled,
        disable: !enabled,
        disabled: !enabled,
        content: e.content || "",
        key: keys,
        keys,
        constant: isConstant,
        selective: !isConstant,
        strategy: { type: isConstant ? "constant" : "selective", keys },
        position,
        depth: position.depth,
        order,
        insertion_order: order,
        probability: ext.probability ?? 100,
        recursion: {
          prevent_incoming: preventIn,
          prevent_outgoing: preventOut,
          delay_until: ext.delay_until_recursion ?? null,
        },
        exclude_recursion: preventIn,
        prevent_recursion: preventOut,
        sticky: ext.sticky ?? null,
        cooldown: ext.cooldown ?? null,
        delay: ext.delay ?? null,
        extensions: ext,
      };
    });

  // 内容签名：判断两本书内容一不一样
  const luluAutoBookSig = (entries) =>
    entries
      .map(
        (e) => `${e.comment || e.name || ""}\u0001${(e.content || "").trim()}`,
      )
      .sort()
      .join("\u0002");

  // 给当前角色卡改绑世界书（把旧名换成新名）
  const luluAutoRebindCharBook = async (oldName, newName) => {
    try {
      const cb =
        typeof getCharWorldbookNames === "function"
          ? getCharWorldbookNames("current") || {
              primary: null,
              additional: [],
            }
          : { primary: null, additional: [] };
      const swap = (v) => (v === oldName ? newName : v);
      if (typeof rebindCharWorldbooks === "function") {
        await rebindCharWorldbooks("current", {
          primary: swap(cb.primary),
          additional: (cb.additional || []).map(swap),
        });
      }
    } catch (e) {
      console.error("Lulu 自动检测：改绑失败", e);
    }
  };

  const luluWithToast = async (fn, msg) => {
    let t = null;
    if (typeof toastr !== "undefined") {
      t = toastr.info(msg, "", { timeOut: 0, extendedTimeOut: 0 });
    }
    try {
      await fn();
    } finally {
      if (t && typeof toastr !== "undefined") toastr.clear(t);
    }
  };

  // —— 核心：检测当前打开的这张角色卡 ——
  const luluAutoCheckCurrentChar = async () => {
    try {
      // 默认关闭，只有用户在面板里勾选开启才生效
      if (localStorage.getItem("lulu_wb_auto_detect_enabled") !== "true")
        return;
      const ctx =
        typeof SillyTavern !== "undefined" ? SillyTavern.getContext() : {};
      const avatar =
        ctx.characters && ctx.characterId != null
          ? ctx.characters[ctx.characterId]?.avatar
          : null;
      const charName =
        typeof getCurrentCharacterName === "function"
          ? getCurrentCharacterName()
          : ctx.name2;

      if (!avatar) return;

      // ✨ 这张卡已经处理/忽略过 → 永久跳过，不再打扰
      if (isCharHandled(avatar)) return;

      const embedded = await luluAutoReadEmbeddedBook(avatar);
      if (!embedded) return;

      const bookName = embedded.name;
      if (!bookName) return;

      // 🚫 如果这本书被标记了“跳过全库对照”，自动检测也不再打扰
      try {
        const luluAutoScanSkipList = JSON.parse(
          localStorage.getItem("lulu_wb_scan_skip_list") || "[]",
        );
        if (
          Array.isArray(luluAutoScanSkipList) &&
          luluAutoScanSkipList.includes(bookName)
        ) {
          return;
        }
      } catch (e) {}

      // 本地没有同名书 → 不算污染，跳过（但不永久标记，万一以后创建了同名书还能提醒）
      if (
        typeof getWorldbookNames !== "function" ||
        !getWorldbookNames().includes(bookName)
      ) {
        return;
      }

      const converted = luluAutoConvertEmbedded(embedded.entries);

      let localEntries;
      try {
        localEntries = await getWorldbook(bookName);
      } catch (e) {
        return;
      }

      // 内容一致 → 没被污染 → ✨ 永久标记，以后你自己改也不会再来烦你
      if (luluAutoBookSig(localEntries) === luluAutoBookSig(converted)) {
        markCharHandled(avatar);
        return;
      }

      // ✨ 内容不一致 → 疑似污染，弹窗提醒
      // 关键修复：不管用户选什么（包括忽略），都先永久标记这张卡为“已处理”，绝不再打扰
      markCharHandled(avatar);

      // ========== 自包含差异面板（与主动“体检/救援”同款） ==========
      const luluAutoEscHtml = (s) =>
        String(s).replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");

      const luluAutoDiffText = (oldStr, newStr) => {
        const oldLines = String(oldStr || "").split("\n");
        const newLines = String(newStr || "").split("\n");
        const oldSet = new Set(oldLines.map((l) => l.trim()));
        const newSet = new Set(newLines.map((l) => l.trim()));
        let oldHtml = "";
        let newHtml = "";
        oldLines.forEach((l) => {
          const removed = !newSet.has(l.trim()) && l.trim() !== "";
          oldHtml += `<div style="padding:1px 4px; ${removed ? "background:rgba(255,107,107,0.25); border-radius:2px;" : ""}">${luluAutoEscHtml(l) || " "}</div>`;
        });
        newLines.forEach((l) => {
          const added = !oldSet.has(l.trim()) && l.trim() !== "";
          newHtml += `<div style="padding:1px 4px; ${added ? "background:rgba(81,207,102,0.25); border-radius:2px;" : ""}">${luluAutoEscHtml(l) || " "}</div>`;
        });
        return { oldHtml, newHtml };
      };

      const luluAutoBuildDiffHtml = (
        convertedEntries,
        localEntriesArr,
        uniquePrefix,
      ) => {
        const embMap = new Map();
        convertedEntries.forEach((e) => {
          embMap.set((e.name || e.comment || "(无名)").trim(), e);
        });
        const locMap = new Map();
        localEntriesArr.forEach((e) => {
          locMap.set((e.name || e.comment || "(无名)").trim(), e);
        });
        const onlyInLocal = [],
          onlyInEmb = [],
          changed = [],
          same = [];
        locMap.forEach((locE, name) => {
          if (embMap.has(name)) {
            const embE = embMap.get(name);
            if ((locE.content || "").trim() !== (embE.content || "").trim())
              changed.push({ name, locE, embE });
            else same.push(name);
          } else onlyInLocal.push({ name, locE });
        });
        embMap.forEach((embE, name) => {
          if (!locMap.has(name)) onlyInEmb.push({ name, embE });
        });

        let html = `<div style="font-size:12px;">`;
        html += `<div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px; padding-bottom:8px; border-bottom:1px dashed var(--SmartThemeBorderColor);">`;
        html += `<span style="background:rgba(81,207,102,0.15); color:#51cf66; border:1px solid #51cf66; padding:2px 8px; border-radius:4px;">本地新增 ${onlyInLocal.length}</span>`;
        html += `<span style="background:rgba(255,107,107,0.15); color:#ff6b6b; border:1px solid #ff6b6b; padding:2px 8px; border-radius:4px;">本地缺失 ${onlyInEmb.length}</span>`;
        html += `<span style="background:rgba(252,196,25,0.15); color:#fcc419; border:1px solid #fcc419; padding:2px 8px; border-radius:4px;">内容改动 ${changed.length}</span>`;
        html += `<span style="background:rgba(150,150,150,0.15); color:gray; border:1px solid gray; padding:2px 8px; border-radius:4px;">未变 ${same.length}</span>`;
        html += `</div>`;

        if (changed.length > 0) {
          html += `<div style="font-weight:bold; color:#fcc419; margin-bottom:6px;"><i class="fa-solid fa-pen"></i> 内容被改动的条目：</div>`;
          changed.forEach((c, idx) => {
            const diff = luluAutoDiffText(c.embE.content, c.locE.content);
            html += `
              <div style="margin-bottom:8px; border:1px solid var(--SmartThemeBorderColor); border-radius:6px; overflow:hidden;">
                <div class="lulu-diff-toggle" data-prefix="${uniquePrefix}" data-cidx="${idx}" style="padding:6px 10px; background:rgba(252,196,25,0.1); cursor:pointer; font-weight:bold; display:flex; justify-content:space-between; align-items:center;">
                  <span style="word-break:break-all;">📝 ${luluAutoEscHtml(c.name)}</span>
                  <i class="fa-solid fa-chevron-down" style="font-size:11px;"></i>
                </div>
                <div class="lulu-diff-body" data-prefix="${uniquePrefix}" data-cidx="${idx}" style="display:none; padding:8px;">
                  <div style="display:flex; gap:8px; font-size:11px; line-height:1.5;">
                    <div style="flex:1; min-width:0;">
                      <div style="font-weight:bold; color:#51cf66; margin-bottom:4px;">📗 卡内原版</div>
                      <div style="max-height:200px; overflow:auto; background:rgba(0,0,0,0.15); border-radius:4px; padding:4px; white-space:pre-wrap; word-break:break-word;">${diff.oldHtml || "(空)"}</div>
                    </div>
                    <div style="flex:1; min-width:0;">
                      <div style="font-weight:bold; color:#ff6b6b; margin-bottom:4px;">📕 本地当前</div>
                      <div style="max-height:200px; overflow:auto; background:rgba(0,0,0,0.15); border-radius:4px; padding:4px; white-space:pre-wrap; word-break:break-word;">${diff.newHtml || "(空)"}</div>
                    </div>
                  </div>
                  <div style="font-size:10px; color:gray; margin-top:4px;"><span style="background:rgba(255,107,107,0.25); padding:0 4px;">红底</span>=卡内有本地删了　<span style="background:rgba(81,207,102,0.25); padding:0 4px;">绿底</span>=本地新加的</div>
                </div>
              </div>`;
          });
        }

        if (onlyInLocal.length > 0) {
          html += `<div style="font-weight:bold; color:#51cf66; margin:8px 0 4px 0;"><i class="fa-solid fa-plus"></i> 本地多出来的条目（原本没有）：</div>`;
          html += `<div style="background:rgba(81,207,102,0.06); border:1px solid rgba(81,207,102,0.3); border-radius:4px; padding:6px; max-height:120px; overflow-y:auto;">`;
          onlyInLocal.forEach((o) => {
            html += `<div style="padding:1px 0;">• ${luluAutoEscHtml(o.name)}</div>`;
          });
          html += `</div>`;
        }

        if (onlyInEmb.length > 0) {
          html += `<div style="font-weight:bold; color:#ff6b6b; margin:8px 0 4px 0;"><i class="fa-solid fa-minus"></i> 本地缺失的条目（原本有）：</div>`;
          html += `<div style="background:rgba(255,107,107,0.06); border:1px solid rgba(255,107,107,0.3); border-radius:4px; padding:6px; max-height:120px; overflow-y:auto;">`;
          onlyInEmb.forEach((o) => {
            html += `<div style="padding:1px 0;">• ${luluAutoEscHtml(o.name)}</div>`;
          });
          html += `</div>`;
        }

        if (
          changed.length === 0 &&
          onlyInLocal.length === 0 &&
          onlyInEmb.length === 0
        ) {
          html += `<div style="text-align:center; color:gray; padding:10px;">条目名和正文都一致，差异可能在触发关键字/参数上~</div>`;
        }
        html += `</div>`;
        return html;
      };

      const luluAutoBindDiffToggle = ($scope) => {
        $scope
          .find(".lulu-diff-toggle")
          .off("click")
          .on("click", function () {
            const cidx = $(this).attr("data-cidx");
            const prefix = $(this).attr("data-prefix");
            const $body = $scope.find(
              `.lulu-diff-body[data-prefix="${prefix}"][data-cidx="${cidx}"]`,
            );
            const $icon = $(this).find("i.fa-chevron-down, i.fa-chevron-up");
            if ($body.is(":visible")) {
              $body.slideUp(120);
              $icon.removeClass("fa-chevron-up").addClass("fa-chevron-down");
            } else {
              $body.slideDown(120);
              $icon.removeClass("fa-chevron-down").addClass("fa-chevron-up");
            }
          });
      };

      const diffHtml = luluAutoBuildDiffHtml(converted, localEntries, "auto");

      const $rescueDlg =
        $(`<div id="lulu-rescue-dialog" style="text-align:left; line-height:1.6; padding:2px; max-width:520px;">
         <div style="font-size:15px; font-weight:bold; color:var(--SmartThemeQuoteColor); margin-bottom:12px;">
           <i class="fa-solid fa-clock-rotate-left"></i> 卡内原版 · 对照还原
         </div>
         <div style="background:var(--SmartThemeBotMesColor); border:1px solid var(--SmartThemeBorderColor); border-radius:8px; padding:12px; margin-bottom:12px;">
           <div style="font-size:13px; margin-bottom:8px;"><i class="fa-solid fa-robot" style="color:var(--SmartThemeQuoteColor); width:18px;"></i> 角色：<strong>${charName || "当前角色"}</strong></div>
           <div style="font-size:13px;"><i class="fa-solid fa-book" style="color:var(--SmartThemeQuoteColor); width:18px;"></i> 世界书：<strong>${bookName}</strong></div>
         </div>
         <div style="font-size:12.5px; color:var(--SmartThemeBodyColor); line-height:1.7; margin-bottom:12px;">
           这张卡自带的世界书原版，和本地同名的这本<strong style="color:var(--SmartThemeQuoteColor);">内容不一样</strong>了。<br>
           <span style="color:gray;">可能是导入时被本地旧书接管，也可能是你改过本地这本、现在想还原成卡里的原版~</span>
         </div>
         <div id="lulu-single-diff-toggle" style="cursor:pointer; padding:8px 12px; background:rgba(125,125,125,0.12); border:1px solid var(--SmartThemeBorderColor); border-radius:6px; font-weight:bold; color:var(--SmartThemeQuoteColor); display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:13px;">
           <span><i class="fa-solid fa-magnifying-glass-chart"></i> 查看详细差异</span>
           <i class="fa-solid fa-chevron-down" style="font-size:11px;"></i>
         </div>
         <div id="lulu-single-diff-panel" style="display:none; max-height:45vh; overflow-y:auto; padding:4px;">${diffHtml}</div>
       </div>`);

      $rescueDlg.prepend(
        `<style>
          ${buildPopupThemeCSS("dialog:has(#lulu-rescue-dialog)")}
          @media (max-width: 768px) {
            dialog:has(#lulu-rescue-dialog) #lulu-rescue-dialog { font-size: 12px !important; }
            dialog:has(#lulu-rescue-dialog) #lulu-single-diff-toggle { font-size: 12px !important; padding: 7px 10px !important; }
          }
        </style>`,
      );

      $rescueDlg.find("#lulu-single-diff-toggle").on("click", function () {
        const $panel = $rescueDlg.find("#lulu-single-diff-panel");
        const $icon = $(this).find("i.fa-chevron-down, i.fa-chevron-up");
        if ($panel.is(":visible")) {
          $panel.slideUp(150);
          $icon.removeClass("fa-chevron-up").addClass("fa-chevron-down");
        } else {
          $panel.slideDown(150);
          $icon.removeClass("fa-chevron-down").addClass("fa-chevron-up");
        }
      });

      luluAutoBindDiffToggle($rescueDlg);

      const btnRes = await SillyTavern.callGenericPopup(
        $rescueDlg,
        SillyTavern.POPUP_TYPE.TEXT,
        "",
        {
          okButton: "暂不处理",
          customButtons: [
            { text: "另建原版并绑定", result: 888, classes: ["btn-success"] },
            { text: "覆盖本地此书", result: 999, classes: ["btn-danger"] },
          ],
        },
      );
      // ========== 自包含差异面板结束 ==========
      // ✨ 严格判断：只有明确等于 888 或 999 才动手，其它一律什么都不做
      if (btnRes === 888) {
        let newName = `${bookName}_卡内原版`;
        let n = 2;
        while (getWorldbookNames().includes(newName))
          newName = `${bookName}_卡内原版${n++}`;
        await luluWithToast(async () => {
          await createWorldbook(newName, converted);
          await luluAutoRebindCharBook(bookName, newName);
        }, "正在提取卡内原版并重新绑定...");
        if (typeof toastr !== "undefined")
          toastr.success(
            `✨ 已创建 [${newName}] 并绑给 [${charName || "当前角色"}]，本地旧书原样保留~`,
          );
      } else if (btnRes === 999) {
        const confirm2 = await SillyTavern.callGenericPopup(
          `再确认一次哦：覆盖 [${bookName}] 会影响<strong style="color:#ff6b6b;">所有</strong>绑定了这本书的其他角色卡！<br>确定要用卡内原版覆盖本地旧书吗？`,
          SillyTavern.POPUP_TYPE.CONFIRM,
        );
        if (confirm2 === SillyTavern.POPUP_RESULT.AFFIRMATIVE) {
          await luluWithToast(async () => {
            await replaceWorldbook(bookName, converted);
          }, "正在用卡内原版覆盖本地旧书...");
          if (typeof toastr !== "undefined")
            toastr.success(`✅ [${bookName}] 已被卡内原版覆盖~`);
        }
      }
      // 其它情况（点了“先不管”/关闭弹窗）→ 什么都不做，已经标记过了
    } catch (e) {
      console.error("Lulu 自动检测：整体流程出错", e);
    }
  };

  const luluBindAutoDetectEvents = () => {
    try {
      const ctx =
        typeof SillyTavern !== "undefined" ? SillyTavern.getContext() : null;
      if (!ctx || !ctx.eventSource || !ctx.eventTypes) {
        setTimeout(luluBindAutoDetectEvents, 1000);
        return;
      }
      const es = ctx.eventSource;
      const et = ctx.eventTypes;
      const delayedCheck = () => setTimeout(luluAutoCheckCurrentChar, 800);

      if (et.CHAT_CHANGED) es.on(et.CHAT_CHANGED, delayedCheck);
      if (et.CHARACTER_PAGE_LOADED)
        es.on(et.CHARACTER_PAGE_LOADED, delayedCheck);
      if (et.CHARACTER_EDITED) es.on(et.CHARACTER_EDITED, delayedCheck);

      console.log("Lù-chan: 世界书污染自动检测已挂载~（永久记忆版）");
    } catch (e) {
      console.error("Lulu 自动检测：挂载事件失败", e);
    }
  };

  luluBindAutoDetectEvents();
  $("head").append(`
<style>
    /* 修复手机端弹窗内容被右侧边框遮挡的问题 */
    dialog.wb-manager-dialog *,
    dialog:has(#lulu-quick-snap-modal) *,
    dialog:has(#lulu-scan-dialog) *,
    dialog:has(#lulu-rescue-dialog) *,
    dialog:has(#lulu-scan-char-select-dialog) * {
        box-sizing: border-box !important;
        max-width: 100% !important;
    }

    /* 极速快照控制台：加一点右侧安全间距 */
    #lulu-quick-snap-modal {
        overflow-x: hidden !important;
        padding-right: 6px !important;
    }
    #lulu-quick-snap-modal .lulu-qs-item {
        overflow: hidden !important;
    }

    /* 全库对照面板：同样防止右侧溢出 */
    #lulu-scan-dialog-inner {
        overflow-x: hidden !important;
        padding-right: 6px !important;
    }

    /* 弹窗里的下拉框和按钮：只保留触摸优化，不再强制统一高度（避免按钮被拉得很长） */
    dialog select,
    dialog button {
        touch-action: manipulation;
    }
</style>
`);
})();
