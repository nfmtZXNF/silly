try { replaceScriptButtons([]); } catch (e) {}
$("#option_lulu_wb_manager").remove();

const $targetHr = $(".options-content").find("hr").last();
const $menuBtn = $("<a>", { id: "option_lulu_wb_manager", class: "interactable", tabindex: 0 })
    .append($("<i>", { class: "fa-lg fa-solid fa-book-atlas", css: { paddingRight: '12px' } }))
    .append($("<span>").text("全局世界书管理"));

$menuBtn.insertBefore($targetHr);

let globalBindingMapCache = {};

let isEntryBatchMode = false;
let entryBatchSelected = new Set();

const formatPositionBadge = (pos) => {
    if (!pos) return '📍未知位置 | 🔢100';
    const posMap = {
        'before_character_definition': '前:角色定义', 'after_character_definition': '后:角色定义',
        'before_example_messages': '前:示例消息', 'after_example_messages': '后:示例消息',
        'before_author_note': '前:作者注释', 'after_author_note': '后:作者注释',
    };
    let typeStr = pos.type || 'at_depth';
    if (typeStr === 'at_depth' || typeStr === 'outlet') {
        const roleIcon = pos.role === 'user' ? '👤用户' : (pos.role === 'assistant' ? '🤖助手' : '⚙️系统');
        return `🌊深度[${roleIcon}]: ${pos.depth || 0} | 🔢${pos.order || 100}`;
    }
    return `📍${posMap[typeStr] || typeStr} | 🔢${pos.order || 100}`;
};

const getCurrentPersonaId = (ctx, pus) => {
    if (!pus) return null;
    if (ctx.chatMetadata && ctx.chatMetadata.persona) return ctx.chatMetadata.persona; 
    if (pus.default_persona) return pus.default_persona; 
    if (pus.personas && ctx.name1) { 
        for (let [id, name] of Object.entries(pus.personas)) {
            if (name === ctx.name1) return id;
        }
    }
    return null;
};

const getPersonaWbs = () => {
    const books =[];
    try {
        const ctx = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : (typeof getContext === 'function' ? getContext() : {});
        const pus = ctx.powerUserSettings || {};
        
        if (pus.persona_description_lorebook) books.push(pus.persona_description_lorebook);

        const activeId = getCurrentPersonaId(ctx, pus);
        if (activeId && pus.persona_descriptions && pus.persona_descriptions[activeId]) {
            if (pus.persona_descriptions[activeId].lorebook) books.push(pus.persona_descriptions[activeId].lorebook);
        }
    } catch (e) {
        console.error("Lù-chan: 读取 Persona 世界书出现了一点小意外呢", e);
    }
    return [...new Set(books)].filter(b => typeof b === 'string' && b.trim() !== '');
};

const rebindPersonaWorldbook = async (newWbName, oldWbToUnbind = null) => {
    const ctx = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : (typeof getContext === 'function' ? getContext() : {});
    const pus = ctx.powerUserSettings;
    if (!pus) return;

    if (newWbName !== null) pus.persona_description_lorebook = newWbName || '';
    else if (oldWbToUnbind && pus.persona_description_lorebook === oldWbToUnbind) pus.persona_description_lorebook = '';

    const activeId = getCurrentPersonaId(ctx, pus);
    if (activeId && pus.persona_descriptions && pus.persona_descriptions[activeId]) {
        if (newWbName !== null) {
            pus.persona_descriptions[activeId].lorebook = newWbName || '';
        } else if (oldWbToUnbind && pus.persona_descriptions[activeId].lorebook === oldWbToUnbind) {
            pus.persona_descriptions[activeId].lorebook = '';
        }
    } else if (oldWbToUnbind) {
        if (pus.persona_descriptions && pus.personas) {
            for (let [id, desc] of Object.entries(pus.persona_descriptions)) {
                if (pus.personas[id] === ctx.name1 && desc.lorebook === oldWbToUnbind) desc.lorebook = '';
            }
        }
    }

    if (typeof ctx.saveSettingsDebounced === 'function') await ctx.saveSettingsDebounced();
    if (typeof $('#persona_lore_button').toggleClass === 'function') $('#persona_lore_button').toggleClass('world_set', !!newWbName);
};

// ================== ✨ 鹿酱特调加强版：贴心的主界面悬浮球控制逻辑 ==================
const toggleFloatingButton = (show) => {
    if (!show) {
        $("#lulu-wb-floating-btn").remove();
        $("#lulu-wb-floating-style").remove(); // 清理专属样式
        return;
    }
    if ($("#lulu-wb-floating-btn").length > 0) return; 

    const styleHtml = `
        <style id="lulu-wb-floating-style">
            #lulu-wb-floating-btn {
                position: fixed !important;
                /* 避开手机底部的输入框和顶部的导航，直接降生在屏幕右侧的中间！ */
                top: 45vh !important;
                right: 15px !important;
                /* 抹除干扰属性 */
                bottom: auto !important;
                left: auto !important;
                width: 48px !important;
                height: 48px !important;
                background: var(--SmartThemeBotMesColor, #2a2e33) !important;
                color: var(--SmartThemeQuoteColor, #70a1ff) !important;
                border: 2px solid var(--SmartThemeQuoteColor, #70a1ff) !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 22px !important;
                cursor: pointer !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.6) !important;
                z-index: 2147483647 !important; /* 最高维度的层级！ */
                user-select: none !important;
                touch-action: none !important; /* 彻底切断底层滑动阻击 */
                -webkit-tap-highlight-color: transparent !important;
                transition: transform 0.2s !important;
            }
            #lulu-wb-floating-btn:active {
                transform: scale(0.9) !important;
            }
        </style>
    `;
    $("head").append(styleHtml);

    const $floatBtn = $("<div>", { id: "lulu-wb-floating-btn", title: "点击打开世界书管理面板\n(可以自由拖拽哦~)" })
        .append($("<i>", { class: "fa-solid fa-book-atlas" }))
        // 在酒馆中，app_container 是最稳固的实体容器
        .appendTo("#app_container, body");

    // ✨ 终极拖拽魔法：深度治愈手机端的奇怪触控
    const btnNode = $floatBtn[0];
    let isDragging = false;
    let startX, startY, initX, initY;

    btnNode.addEventListener('pointerdown', (e) => {
        // 排除掉不该响应的右键
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        try { btnNode.setPointerCapture(e.pointerId); } catch(err) {}
        isDragging = false;

        // 兼容一些极端浏览器的坐标丢失问题
        startX = e.clientX || 0;
        startY = e.clientY || 0;
        const rect = btnNode.getBoundingClientRect();
        initX = rect.left;
        initY = rect.top;

        const onPointerMove = (ev) => {
            const currentX = ev.clientX || 0;
            const currentY = ev.clientY || 0;
            const dx = currentX - startX;
            const dy = currentY - startY;

            // 手机端手指接触面大，滑动阈值放大至 5 像素
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                isDragging = true;
                // 拖动时也必须使用 !important 覆写，确保雷打不动
                btnNode.style.setProperty('left', (initX + dx) + 'px', 'important');
                btnNode.style.setProperty('top', (initY + dy) + 'px', 'important');
                btnNode.style.setProperty('right', 'auto', 'important');
                btnNode.style.setProperty('bottom', 'auto', 'important');
                btnNode.style.setProperty('transition', 'none', 'important');
            }
        };

        const onPointerUp = (ev) => {
            btnNode.removeEventListener('pointermove', onPointerMove);
            btnNode.removeEventListener('pointerup', onPointerUp);
            btnNode.removeEventListener('pointercancel', onPointerUp);
            try { btnNode.releasePointerCapture(ev.pointerId); } catch(err) {}
            btnNode.style.setProperty('transition', 'transform 0.2s', 'important');
        };

        btnNode.addEventListener('pointermove', onPointerMove);
        btnNode.addEventListener('pointerup', onPointerUp);
        btnNode.addEventListener('pointercancel', onPointerUp);
    });

    // ✨ 点击防误触鉴定
    btnNode.addEventListener('click', (e) => {
        if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
        } else {
            $("#option_lulu_wb_manager").click();
        }
    });
};

if (localStorage.getItem('lulu_wb_floating_enabled') === 'true') {
    toggleFloatingButton(true);
}


$menuBtn.on('click', async () => {
    $("#options").hide();

    const customCSS = `
        <style>
            dialog.wb-manager-dialog { width: 92vw !important; max-width: 1600px !important; transition: zoom 0.2s ease-out; overflow: hidden; font-family: sans-serif; }
            #wb-manager-panel h3 { font-size: 15px; margin: 10px 0 8px 0; border-bottom: 2px solid var(--SmartThemeBorderColor); padding-bottom: 5px; color: var(--SmartThemeQuoteColor); }

            .wb-list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 10px; align-content: start; max-height: 55vh; overflow-y: auto; background: var(--SmartThemeBlurTintColor); border-radius: 8px; border: 1px solid var(--SmartThemeBorderColor); padding: 10px; position: relative; }
            .wb-snapshot-list { display: flex; flex-direction: column; gap: 8px; max-height: 35vh; overflow-y: auto; background: var(--SmartThemeBlurTintColor); border-radius: 8px; border: 1px solid var(--SmartThemeBorderColor); padding: 10px; }

            .wb-item-wrapper { display: flex; flex-direction: column; background: var(--SmartThemeBotMesColor); border-radius: 6px; border: 1px solid var(--SmartThemeBorderColor); transition: 0.2s; overflow: hidden; padding: 10px; gap: 4px; }
            .wb-item-wrapper:hover { border-color: var(--SmartThemeQuoteColor); box-shadow: 0 4px 8px rgba(0,0,0,0.1); transform: translateY(-1px); z-index: 10; }

            .wb-item-header { display: flex; justify-content: flex-start; align-items: flex-start; gap: 8px; width: 100%; overflow: hidden; }
            .wb-item-title-area { display: flex; align-items: flex-start; gap: 8px; flex: 1; min-width: 0; padding-bottom: 2px; }
            .wb-name-text { font-size: 15px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; color: var(--SmartThemeBodyColor); }

            .wb-item-bottom { display: flex; justify-content: space-between; align-items: flex-end; gap: 8px; margin-top: 4px; border-top: 1px dashed rgba(125,125,125, 0.2); padding-top: 8px; }
            .wb-tag-area { display: flex; flex-wrap: wrap; gap: 5px; flex: 1; align-items: center; }
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

            .dsnap-entry-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px; border-radius: 4px; transition:0.1s; border-bottom: 1px solid rgba(125,125,125,0.1);}
            .dsnap-entry-item:hover { background: var(--SmartThemeBlurTintColor); }
            .dsnap-entry-body { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
            .dsnap-entry-title { font-weight: bold; font-size: 13px; line-height: 1.3;}
            .dsnap-entry-meta { display: flex; gap: 6px; flex-wrap: wrap; font-size: 11px; }

            .wb-input-dt { width: 100%; box-sizing: border-box; padding: 8px; border-radius: 4px; border: 1px solid var(--SmartThemeBorderColor); background: var(--SmartThemeBlurTintColor); color: var(--SmartThemeBodyColor); transition: 0.2s; font-family: inherit;}
            .wb-input-dt:focus { border-color: var(--SmartThemeQuoteColor); outline: none; }
            .wb-form-group { display: flex; flex-direction: column; margin-bottom: 10px;}

            .badge-blue { background: rgba(51, 154, 240, 0.15); color: #339af0; border: 1px solid #339af0; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-right: 4px; white-space: nowrap; }
            .badge-green { background: rgba(81, 207, 102, 0.15); color: #51cf66; border: 1px solid #51cf66; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-right: 4px; white-space: nowrap; }
            .badge-grey { background: rgba(150, 150, 150, 0.15); color: #999; border: 1px solid #999; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-right: 4px; white-space: nowrap; }

            @media (max-width: 768px) {
                .wb-btn-group { flex-direction: column; }
                .wb-action-btn { width: 100%; flex: 1 1 100%; justify-content: center; }
                .wb-list-grid { grid-template-columns: 1fr; }
                .wb-toolbar { flex-direction: column; align-items: stretch; }
                .wb-controls-group { justify-content: flex-start; }
                #wb-detail-view .scrollableInnerFull > div:first-child { flex-direction: column; align-items: stretch; }
                #wb-detail-view .scrollableInnerFull > div:first-child > .wb-form-group { width: 100% !important; }

                #dsnap-container { flex-direction: column; height: 75vh; max-height: unset;}
                #dsnap-wb-list-wrapper { max-width: 100%; border-right: none; border-bottom: 2px solid var(--SmartThemeBorderColor); padding-right: 0; padding-bottom: 10px; margin-bottom: 10px; flex: 0 0 45%; min-height: 180px; }
                #dsnap-entry-list-wrapper { padding-left: 0; flex: 1; min-height: 200px; }
                .wb-name-text { white-space: normal; overflow: visible; text-overflow: initial; word-break: break-word; line-height: 1.4; }

                #wb-detailed-snap-view .wb-btn-group { order: -1; margin-bottom: 10px; }
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

            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--SmartThemeBorderColor); margin-bottom: 12px; padding-bottom: 8px; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <h2 style="margin: 0; font-size: 18px; color: var(--SmartThemeQuoteColor); font-weight: bold; white-space: nowrap;"><i class="fa-solid fa-book-journal-whills"></i> 世界书管理面板</h2>

                    <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; margin: 0; white-space: nowrap; background: rgba(125,125,125,0.1); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--SmartThemeBorderColor);">
                        <input type="checkbox" id="wb-toggle-floating" style="accent-color: var(--SmartThemeQuoteColor); transform: scale(1.1);">
                        <span style="font-weight: bold; color: var(--SmartThemeQuoteColor);">🔮 开启呼唤悬浮球</span>
                    </label>
                </div>

                <div style="display: flex; gap: 5px; align-items: center; background: var(--SmartThemeBlurTintColor); padding: 3px; border-radius: 6px; border: 1px solid var(--SmartThemeBorderColor); flex-shrink: 0;">
                    <button id="wb-zoom-out" class="menu_button interactable" style="margin:0; padding: 4px 10px; min-width: unset;" title="缩小"><i class="fa-solid fa-minus"></i></button>
                    <span id="wb-zoom-val" style="font-size: 13.5px; font-weight: bold; min-width: 50px; text-align: center;">100%</span>
                    <button id="wb-zoom-in" class="menu_button interactable" style="margin:0; padding: 4px 10px; min-width: unset;" title="放大"><i class="fa-solid fa-plus"></i></button>
                </div>
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
                        <button id="wb-btn-select-all" class="menu_button interactable wb-nowrap-btn" style="margin: 0; padding: 6px 12px; font-size: 12px;"><i class="fa-solid fa-check-double"></i> 全选当前项</button>
                        <button id="wb-btn-deselect-all" class="menu_button interactable wb-nowrap-btn" style="margin: 0; padding: 6px 12px; font-size: 12px;"><i class="fa-regular fa-square"></i> 撤销当前全选</button>
                        <button id="wb-btn-create-wb" class="menu_button interactable btn-success wb-nowrap-btn" style="margin: 0; padding: 6px 12px; font-size: 12px; border:none;"><i class="fa-solid fa-plus"></i> 新建</button>
                    </div>
                </div>

                <div class="wb-btn-group">
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-clear" style="color: #888;"><i class="fa-solid fa-power-off"></i> 关闭当前所有全局启用</div>
                    <div class="wb-action-btn wb-nowrap-btn btn-primary" id="wb-btn-save-snap"><i class="fa-solid fa-box-archive"></i> 将当前勾选存为快照</div>
                    <div class="wb-action-btn wb-nowrap-btn btn-primary" id="wb-btn-create-detail-snap"><i class="fa-solid fa-puzzle-piece"></i> 创建复合快照</div>
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-open-assoc" style="color: #c92a2a; border-color: #c92a2a; background: rgba(201,42,42,0.05);"><i class="fa-solid fa-id-card-clip"></i> 关联角色与用户</div>
                    <div class="wb-action-btn wb-nowrap-btn btn-danger" id="wb-btn-batch-toggle"><i class="fa-solid fa-trash-can"></i> 批量删除模式</div>
                </div>

                <div id="wb-batch-actions" style="display: none; background: rgba(255, 107, 107, 0.1); border: 1px dashed #ff6b6b; border-radius: 6px; padding: 10px; margin-bottom: 10px; flex-direction: column; gap: 10px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap: wrap; gap: 10px;">
                        <span style="color: #ff6b6b; font-weight: bold; font-size: 14px; margin-top: 4px;"><i class="fa-solid fa-triangle-exclamation"></i> 待删除的世界书：</span>
                        <button class="menu_button interactable btn-danger wb-nowrap-btn" id="wb-btn-confirm-delete" style="margin: 0; border: none; font-size: 13px; padding: 6px 14px;"><i class="fa-solid fa-burst"></i> 确认永久删除 (<span id="wb-batch-count">0</span>)</button>
                    </div>
                    <div id="wb-batch-selected-list" style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 80px; overflow-y: auto;"></div>
                </div>

                <div class="wb-list-grid scrollableInnerFull" id="wb-container"></div>

                <h3>📸 预设组合快照列表</h3>
                <div class="wb-snapshot-list scrollableInnerFull" id="wb-snapshot-container"></div>
            </div>

            <div id="wb-assoc-view" style="display: none; height: 100%; flex-direction: column;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: var(--SmartThemeQuoteColor);">
                    <i class="fa-solid fa-id-card-clip"></i> 管理当前角色卡与用户 (Persona) 的世界书
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
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-assoc-cancel" style="color:#888;"><i class="fa-solid fa-arrow-left"></i> 返回上一页</div>
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
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-shrink: 0; padding-bottom: 4px; border-bottom: 1px solid rgba(125,125,125,0.2);">
                            <span style="font-size: 12px; font-weight: bold; color: gray;">🔍 查看条目 (仅供阅览排序)</span>
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

            <div id="wb-entry-view" style="display: none; height: 100%; flex-direction: column;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: var(--SmartThemeQuoteColor);">
                    <i class="fa-solid fa-sliders"></i> 编辑内容条目：<span id="wb-entry-title"></span>
                </div>
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
                <div class="wb-btn-group" style="margin: 0 0 10px 0;">
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-entry-all" style="padding: 6px;"><i class="fa-solid fa-check-double"></i> 启用全部</div>
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-entry-none" style="padding: 6px;"><i class="fa-regular fa-square"></i> 关闭全部</div>
                    <div class="wb-action-btn wb-nowrap-btn btn-success" id="wb-btn-entry-add" style="padding: 6px; border:none;"><i class="fa-solid fa-plus"></i> 新建条目</div>
                    <div class="wb-action-btn wb-nowrap-btn btn-danger" id="wb-btn-entry-batch" style="padding: 6px; border:none;"><i class="fa-solid fa-trash-can"></i> 批量删除</div>
                </div>

                <div id="wb-entry-batch-actions" style="display: none; background: rgba(255, 107, 107, 0.1); border: 1px dashed #ff6b6b; border-radius: 6px; padding: 10px; margin-bottom: 10px; flex-direction: column; gap: 10px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap: wrap; gap: 10px;">
                        <span style="color: #ff6b6b; font-weight: bold; font-size: 14px; margin-top: 4px;"><i class="fa-solid fa-triangle-exclamation"></i> 待删除的条目：</span>
                        <button class="menu_button interactable btn-danger wb-nowrap-btn" id="wb-btn-entry-confirm-delete" style="margin: 0; border: none; font-size: 13px; padding: 6px 14px;"><i class="fa-solid fa-burst"></i> 暂存移除所选项 (<span id="wb-entry-batch-count">0</span>)</button>
                    </div>
                </div>

                <div class="wb-snapshot-list scrollableInnerFull" id="wb-entry-container" style="display: flex; flex-direction: column; max-height: 38vh;"></div>
                <div class="wb-btn-group" style="margin-top: 15px;">
                    <div class="wb-action-btn wb-nowrap-btn btn-success" id="wb-btn-entry-save" style="border:none;"><i class="fa-solid fa-floppy-disk"></i> 确认并覆盖源文件</div>
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-entry-cancel" style="color:#888;"><i class="fa-solid fa-arrow-left"></i> 放弃更改并返回</div>
                </div>
            </div>

             <div id="wb-detail-view" style="display: none; height: 100%; flex-direction: column;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: var(--SmartThemeQuoteColor); flex-shrink: 0;">
                    <i class="fa-solid fa-pen-nib"></i> 编辑参数细节：<span id="wb-detail-title"></span>
                </div>
                <div class="scrollableInnerFull" style="display: flex; flex-direction: column; flex: 1; min-height: 0; padding-right: 15px;">
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; background: rgba(0,0,0,0.1); border-radius: 6px; padding: 10px; border: 1px solid var(--SmartThemeBorderColor); margin-bottom: 10px; flex-shrink: 0; align-items: flex-end;">
                        <div class="wb-form-group" style="flex: 1; min-width: 130px; margin-bottom: 0;">
                            <label style="font-size: 13px; font-weight: bold; margin-bottom: 4px; color: var(--SmartThemeQuoteColor);">📖 标签名称</label>
                            <input type="text" id="wb-det-name" class="wb-input-dt">
                        </div>
                        <div class="wb-form-group" style="flex: 1; min-width: 120px; margin-bottom: 0;">
                            <label style="font-size: 13px; font-weight: bold; margin-bottom: 4px; color: var(--SmartThemeQuoteColor);">🚦 触发策略</label>
                            <select id="wb-det-strategy" class="wb-input-dt">
                                <option value="constant">🟦 常驻 (无条件)</option>
                                <option value="selective">🟩 匹配 (关键字)</option>
                            </select>
                        </div>
                        <div class="wb-form-group" style="flex: 2; min-width: 180px; margin-bottom: 0;">
                            <label style="font-size: 13px; font-weight: bold; margin-bottom: 4px; color: var(--SmartThemeQuoteColor);">🔑 触发关键字 <small>(逗号分隔)</small></label>
                            <input type="text" id="wb-det-keys" class="wb-input-dt">
                        </div>

                        <div class="wb-form-group" style="flex: 1; min-width: 160px; margin-bottom: 0;">
                            <label style="font-size: 13px; font-weight: bold; margin-bottom: 4px; color: var(--SmartThemeQuoteColor);">📍 插入位置</label>
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
                        <div class="wb-form-group" id="wb-det-depth-container" style="display: none; width: 65px; margin-bottom: 0;">
                            <label style="font-size: 13px; font-weight: bold; margin-bottom: 4px; color: var(--SmartThemeQuoteColor);">🌊 深度</label>
                            <input type="number" id="wb-det-depth" class="wb-input-dt" value="0">
                        </div>
                        <div class="wb-form-group" style="width: 65px; margin-bottom: 0;">
                            <label style="font-size: 13px; font-weight: bold; margin-bottom: 4px; color: var(--SmartThemeQuoteColor);">🔢 顺序</label>
                            <input type="number" id="wb-det-order" class="wb-input-dt" value="100">
                        </div>

                        <div style="display: flex; flex-direction: column; justify-content: center; gap: 6px; margin-bottom: 4px; min-width: 160px;">
                            <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 12px; margin: 0; white-space: nowrap;">
                                <input type="checkbox" id="wb-det-exclude-recursion" style="accent-color: var(--SmartThemeQuoteColor); transform: scale(1.1);">
                                <span><strong style="color: var(--SmartThemeBodyColor);">不可递归</strong> <span style="color:gray;">(不被激活)</span></span>
                            </label>
                            <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 12px; margin: 0; white-space: nowrap;">
                                <input type="checkbox" id="wb-det-prevent-recursion" style="accent-color: var(--SmartThemeQuoteColor); transform: scale(1.1);">
                                <span><strong style="color: var(--SmartThemeBodyColor);">防止进一步递归</strong></span>
                            </label>
                        </div>
                    </div>
                    <div class="wb-form-group" style="flex: 1; display: flex; flex-direction: column; margin-bottom: 0;">
                        <label style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: var(--SmartThemeQuoteColor);">📜 正文内容</label>
                        <textarea id="wb-det-content" class="wb-input-dt" style="flex: 1; min-height: 200px; font-size: 14px; padding: 12px; resize: vertical;"></textarea>
                    </div>
                </div>
                <div class="wb-btn-group" style="margin-top: 15px; flex-shrink: 0;">
                    <div class="wb-action-btn wb-nowrap-btn btn-success" id="wb-btn-det-save" style="border:none;"><i class="fa-solid fa-check"></i> 暂存修改内容</div>
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-det-cancel" style="color: #888;"><i class="fa-solid fa-xmark"></i> 撤销当前编辑</div>
                </div>
            </div>
        </div>
    `);

    const isFloatingEnabledNow = localStorage.getItem('lulu_wb_floating_enabled') === 'true';
    $ui.find('#wb-toggle-floating').prop('checked', isFloatingEnabledNow); 

    $ui.find('#wb-toggle-floating').on('change', function() {
        const isEnable = $(this).is(':checked');
        localStorage.setItem('lulu_wb_floating_enabled', isEnable);
        toggleFloatingButton(isEnable);
        if (typeof toastr !== 'undefined') {
            toastr.success(isEnable ? "✨ 悬浮魔法球已经召唤出来了！您可以点击或者按住鼠标/手指拖动它哦。" : "🪄 悬浮魔法球已经安静地收回去了~");
        }
    });

    let currentScale = 1.0;
    const updateZoom = (scale) => {
        currentScale = Math.max(0.5, Math.min(2.0, scale));
        $(popup.dlg).css('zoom', currentScale);
        $ui.find('#wb-zoom-val').text(Math.round(currentScale * 100) + '%');
    };
    $ui.find('#wb-zoom-in').on('click', () => updateZoom(currentScale + 0.1));
    $ui.find('#wb-zoom-out').on('click', () => updateZoom(currentScale - 0.1));

    const withLoadingOverlay = async (asyncFunction, message = "正在处理中，请稍候...") => {
        const $overlay = $ui.find('#wb-loading-overlay');
        const $text = $ui.find('#wb-loading-text');
        const $sub = $ui.find('#wb-loading-sub');
        const $sec = $ui.find('#wb-loading-secondary-text');

        $text.text(message);
        $sub.hide(); $sec.hide();
        $overlay.fadeIn('fast');

        try { await asyncFunction(); }
        catch (error) { toastr.error(`操作失败: ${error.message}`); }
        finally { $overlay.fadeOut('slow'); }
    };

    const getCategories = () => {
        let vars = getVariables({ type: 'global' });
        if (!vars.wb_categories) {
            vars.wb_categories = { "🌟默认收藏夹":[] };
            updateVariablesWith(v => { v.wb_categories = vars.wb_categories; return v; }, { type: 'global' });
        }
        return vars.wb_categories;
    };
    const saveCategories = (catObj) => {
        updateVariablesWith(v => { v.wb_categories = catObj; return v; }, { type: 'global' });
    };

    const initiateDeepScan = async (isFastSync = false) => {
        const $overlay = $ui.find('#wb-loading-overlay');
        const $sub = $ui.find('#wb-loading-sub');
        const $sec = $ui.find('#wb-loading-secondary-text');

        if (isFastSync) {
            $ui.find('#wb-loading-text').html('✨ <span style="color: var(--SmartThemeQuoteColor);">正在同步配置状态...</span>');
            $sub.hide(); $sec.hide();
        } else {
            $ui.find('#wb-loading-text').html('正在深入检索读取...');
            $sub.show(); $sec.show();
        }
        $overlay.show();

        try {
            const wb2Chars = {};
            (typeof getWorldbookNames === 'function' ? getWorldbookNames() : []).forEach(wb => wb2Chars[wb] =[]);

            const ctx = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : (typeof getContext === 'function' ? getContext() : {});
            if (ctx.powerUserSettings && ctx.powerUserSettings.persona_descriptions) {
                const pDescs = ctx.powerUserSettings.persona_descriptions;
                const pNames = ctx.powerUserSettings.personas || {};
                Object.keys(pDescs).forEach(avatarId => {
                    if (pDescs[avatarId] && pDescs[avatarId].lorebook) {
                        const wbName = pDescs[avatarId].lorebook;
                        const niceName = pNames[avatarId] || avatarId;
                        if (!wb2Chars[wbName]) wb2Chars[wbName] = [];
                        if (!wb2Chars[wbName].some(c => c.avatar === avatarId)) {
                             wb2Chars[wbName].push({ name: `👤用户: ${niceName}`, avatar: avatarId });
                        }
                    }
                });
            }

            const allCharsData = window.characters || (typeof SillyTavern !== 'undefined' ? SillyTavern.characters : []) || [];
            let combinedData = [...allCharsData];

            const totalChars = combinedData.length;
            $sub.text(`0 / ${totalChars}`);

            const charMap = new Map();
            const batchSize = 10;
            for (let i = 0; i < totalChars; i += batchSize) {
                const chunk = combinedData.slice(i, i + batchSize);
                await Promise.all(chunk.map(async (charItem) => {
                    if(!charItem) return;
                    try {
                        const avatar = charItem.avatar;
                        if (!avatar) return;

                        let charData = charItem;
                        if (charItem.shallow) {
                            try { charData = await $.ajax({ url: '/api/characters/get', type: 'POST', contentType: 'application/json', data: JSON.stringify({ avatar_url: avatar }) }); } catch (e) {}
                        }

                        const charName = charData.name || charItem.name || '未知名称';
                        const checkList = new Set();

                        try {
                            if (typeof getCharWorldbookNames === 'function') {
                                const cb = getCharWorldbookNames(charName);
                                if (cb) {
                                    if (cb.primary) checkList.add(cb.primary);
                                    if (Array.isArray(cb.additional)) cb.additional.forEach(w => checkList.add(w));
                                }
                                const curCharAct = typeof getCurrentCharacterName === 'function' ? getCurrentCharacterName() : null;
                                if (curCharAct === charName || curCharAct === avatar) {
                                     const cbCur = getCharWorldbookNames('current');
                                     if (cbCur) {
                                          if (cbCur.primary) checkList.add(cbCur.primary);
                                          if (Array.isArray(cbCur.additional)) cbCur.additional.forEach(w => checkList.add(w));
                                     }
                                }
                            }
                        } catch (e) {}

                        const dataFields = charData.data || charData;

                        if (dataFields.extensions?.world) checkList.add(dataFields.extensions.world);
                        if (dataFields.world) checkList.add(dataFields.world);
                        if (dataFields.world_info) checkList.add(dataFields.world_info);
                        if (dataFields.lorebook) checkList.add(dataFields.lorebook);

                        if (dataFields.character_book && typeof dataFields.character_book.name === 'string') {
                            checkList.add(dataFields.character_book.name);
                        } else if (typeof dataFields.character_book === 'string') {
                            checkList.add(dataFields.character_book);
                        }

                        if (dataFields.worldbook) checkList.add(dataFields.worldbook);
                        if (Array.isArray(dataFields.extensions?.worldbooks)) dataFields.extensions.worldbooks.forEach(w => checkList.add(w));
                        if (Array.isArray(charData.extensions?.worldbooks)) charData.extensions.worldbooks.forEach(w => checkList.add(w));

                        checkList.forEach(wbRaw => {
                            let wbArr =[];
                            if (typeof wbRaw === 'string') {
                                if (wbRaw.startsWith('[') && wbRaw.endsWith(']')) { try{ wbArr = JSON.parse(wbRaw); } catch(e){ wbArr=[wbRaw]; } }
                                else wbArr = [wbRaw];
                            } else wbArr = [wbRaw];

                            wbArr.forEach(wbName => {
                                if (wbName && typeof wbName === 'string') {
                                    if (!wb2Chars[wbName]) wb2Chars[wbName] =[];
                                    if (!wb2Chars[wbName].some(c => c.avatar === avatar)) wb2Chars[wbName].push({ name: charName, avatar: avatar });
                                }
                            });
                        });

                        const safeCharObj = { name: charName, avatar: avatar };
                        charMap.set(avatar, safeCharObj);
                        const avatarBase = avatar.replace(/\.(png|webp|jpeg)$/i, '');
                        if (avatar !== avatarBase) charMap.set(avatarBase, safeCharObj);
                    } catch (e) {}
                }));
                $sub.text(`${Math.min(i + batchSize, totalChars)} / ${totalChars}`);
            }

            try {
                let charLoreArray =[];
                if (ctx.chatWorldInfoSettings && Array.isArray(ctx.chatWorldInfoSettings.charLore)) charLoreArray = ctx.chatWorldInfoSettings.charLore;
                else if (window.chatWorldInfoSettings && Array.isArray(window.chatWorldInfoSettings.charLore)) charLoreArray = window.chatWorldInfoSettings.charLore;

                if (charLoreArray.length > 0) {
                    charLoreArray.forEach(charLoreEntry => {
                        const charFilename = charLoreEntry.name;
                        if (!charFilename) return;
                        const filenameBase = charFilename.replace(/\.(png|webp|jpeg)$/i, '');
                        const mappedChar = charMap.get(charFilename) || charMap.get(filenameBase);
                        if (mappedChar && Array.isArray(charLoreEntry.extraBooks)) {
                            charLoreEntry.extraBooks.forEach(wbName => {
                                if (wbName && typeof wbName === 'string') {
                                    if (!wb2Chars[wbName]) wb2Chars[wbName] =[];
                                    if (!wb2Chars[wbName].some(c => c.avatar === mappedChar.avatar)) wb2Chars[wbName].push({ name: mappedChar.name, avatar: mappedChar.avatar });
                                }
                            });
                        }
                    });
                }
            } catch (e) {}

            globalBindingMapCache = wb2Chars;
        } catch (error) {
            console.error(error); if (typeof toastr !== 'undefined') toastr.error("读取中断");
        } finally {
            $overlay.fadeOut('slow');
            if (typeof renderData === 'function') renderData();
        }
    };

    const popup = new SillyTavern.Popup($ui, SillyTavern.POPUP_TYPE.TEXT, '', { allowVerticalScrolling: true, okButton: "关闭面板", onOpen: async () => { await initiateDeepScan(); } });
    $(popup.dlg).addClass('wb-manager-dialog');

    const attemptCreateWb = async (defaultName = "") => {
        let name = await SillyTavern.callGenericPopup("为新建的世界书设定一个名称：", SillyTavern.POPUP_TYPE.INPUT, defaultName);
        if (!name || typeof name !== 'string' || name.trim() === '') return;
        name = name.trim();

        if (getWorldbookNames().includes(name)) {
            const btnRes = await SillyTavern.callGenericPopup(`世界书 [${name}] 已存在，您希望作何处理？`, SillyTavern.POPUP_TYPE.TEXT, "", { customButtons:[ {text: "取代原文件", result: 1, classes: ["btn-danger"]}, {text: "重命名新建", result: 2, classes:["btn-primary"]}, {text: "取消操作", result: 0} ] });
            if (btnRes !== 1) return (btnRes === 2) ? attemptCreateWb(name + "_新") : null;
        }
        await withLoadingOverlay(async () => {
             await createWorldbook(name, []);
             globalBindingMapCache[name] =[];
             toastr.success(`已创建：${name}`);
             renderData(name);
        }, "正在创建世界书...");
    };
    $ui.find('#wb-btn-create-wb').on('click', () => attemptCreateWb());

    const attemptRenameWb = async (oldName, isBound, bindings, defaultNewName = "") => {
        if (isBound) return SillyTavern.callGenericPopup(`❌ 无法重命名：\n[${oldName}] 已绑定其他角色或用户，无法直接修改哦。可以先解绑再重命名最后再绑定。`, SillyTavern.POPUP_TYPE.TEXT);
        let newName = await SillyTavern.callGenericPopup(`请输入新名称：`, SillyTavern.POPUP_TYPE.INPUT, defaultNewName || oldName);
        if (!newName || typeof newName !== 'string' || newName.trim() === '' || newName.trim() === oldName) return;
        newName = newName.trim();

        if (getWorldbookNames().includes(newName)) {
            const btnRes = await SillyTavern.callGenericPopup(`世界书 [${newName}] 已经存在，您希望作何处理？`, SillyTavern.POPUP_TYPE.TEXT, "", { customButtons: [ {text: "覆盖", result: 1, classes: ["btn-danger"]}, {text: "重试", result: 2, classes: ["btn-primary"]}, {text: "取消", result: 0} ] });
            if (btnRes !== 1) return (btnRes === 2) ? attemptRenameWb(oldName, isBound, bindings, newName + "_1") : null;
        }
        await withLoadingOverlay(async () => {
            const entries = await getWorldbook(oldName); await createWorldbook(newName, entries); await deleteWorldbook(oldName);
            delete globalBindingMapCache[oldName]; globalBindingMapCache[newName] =[];

            let cData = getCategories();
            Object.keys(cData).forEach(k => { if(cData[k].includes(oldName)) { cData[k] = cData[k].filter(n=>n!==oldName); cData[k].push(newName); } });
            saveCategories(cData);

            const globals = getGlobalWorldbookNames();
            if (globals.includes(oldName)) await rebindGlobalWorldbooks(globals.map(w => w === oldName ? newName : w));
            toastr.success(`名称已更新`); renderData(newName);
        }, "正在重命名迁移...");
    };

    let isBatchMode = false;
    let batchSelected = new Set();
    let currentVisibleWbs =[];

    $ui.find('#wb-search-input, #wb-filter-unbound, #wb-filter-state, #wb-sort-select, #wb-category-filter').on('change input', () => renderData());

    $ui.find('#wb-btn-batch-toggle').on('click', function() {
        isBatchMode = !isBatchMode;
        if(isBatchMode) {
            batchSelected.clear();
            $(this).removeClass('btn-danger').addClass('btn-warning').html('<i class="fa-solid fa-check"></i> 退出批量模式');
            $ui.find('#wb-batch-actions').css('display', 'flex');
        } else {
            $(this).removeClass('btn-warning').addClass('btn-danger').html('<i class="fa-solid fa-trash-can"></i> 批量删除模式');
            $ui.find('#wb-batch-actions').hide();
        }
        renderData();
    });

    $ui.find('#wb-btn-select-all').on('click', async () => {
        if (currentVisibleWbs.length === 0) return;
        if (isBatchMode) { currentVisibleWbs.forEach(wb => batchSelected.add(wb)); renderData(); }
        else {
            let currentActive = getGlobalWorldbookNames();
            currentVisibleWbs.forEach(wb => { if(!currentActive.includes(wb)) currentActive.push(wb); });
            await withLoadingOverlay(async () => await rebindGlobalWorldbooks(currentActive), "应用中..."); renderData();
        }
    });

    $ui.find('#wb-btn-deselect-all').on('click', async () => {
        if (currentVisibleWbs.length === 0) return;
        if (isBatchMode) { currentVisibleWbs.forEach(wb => batchSelected.delete(wb)); renderData(); }
        else {
            let currentActive = getGlobalWorldbookNames().filter(wb => !currentVisibleWbs.includes(wb));
            await withLoadingOverlay(async () => await rebindGlobalWorldbooks(currentActive), "应用中..."); renderData();
        }
    });

    $ui.find('#wb-btn-clear').on('click', async () => {
       await withLoadingOverlay(async () => { await rebindGlobalWorldbooks([]); renderData(); }, "清空设定...");
       toastr.success("所有的全局世界书都已经为您全部卸载啦~");
    });

    $ui.find('#wb-btn-del-category').on('click', async () => {
        let selCat = $ui.find('#wb-category-filter').val();
        if (selCat === 'all' || selCat === 'unassigned') return;
        if (await SillyTavern.callGenericPopup(`真的要删掉分类 [${selCat}] 吗？里面的世界书依然安全，只是会变回未分类哦~`, SillyTavern.POPUP_TYPE.CONFIRM) === SillyTavern.POPUP_RESULT.AFFIRMATIVE) {
            let cats = getCategories();
            delete cats[selCat];
            saveCategories(cats);
            $ui.find('#wb-category-filter').val('all');
            renderData();
            toastr.success(`分类 [${selCat}] 已经从列表清理掉啦。`);
        }
    });

    $ui.find('#wb-btn-confirm-delete').on('click', async () => {
        if(batchSelected.size === 0) return toastr.warning("请先勾选");
        if (await SillyTavern.callGenericPopup(`确认永久销毁这 ${batchSelected.size} 本世界书？`, SillyTavern.POPUP_TYPE.CONFIRM) === SillyTavern.POPUP_RESULT.AFFIRMATIVE) {
             await withLoadingOverlay(async () => {
                for (let wb of batchSelected) {
                    await deleteWorldbook(wb);
                    delete globalBindingMapCache[wb];
                    let cData = getCategories();
                    Object.keys(cData).forEach(k => { cData[k] = cData[k].filter(n=>n!==wb); });
                    saveCategories(cData);
                }
                batchSelected.clear(); renderData();
             }, `删除中...`);
        }
    });

    const renderAssocView = () => {
        const userBooks = getPersonaWbs();
        const $uCont = $ui.find('#wb-assoc-user-list').empty();
        if (userBooks.length === 0) {
            $uCont.append('<div style="color:gray; font-size:13px; padding:4px;">当前使用的 Persona 还没有绑定任何世界书呢~</div>');
        } else {
            userBooks.forEach(wb => {
                const $item = $(`<div style="display:inline-flex; align-items:center; gap:8px; background:var(--SmartThemeBotMesColor); border:1px solid #339af0; padding:6px 12px; border-radius:4px; transition:0.2s;">
                    <span style="font-weight:bold; font-size:14px; color:#339af0; cursor:pointer;" title="点击编辑内容" class="wb-assoc-entry-edit"><i class="fa-solid fa-book"></i> ${wb}</span>
                    <div class="hover-red" style="cursor:pointer; color:gray; margin-left: 4px;" title="为您解绑 Persona 世界书哦"><i class="fa-solid fa-xmark"></i></div>
                </div>`);

                $item.find('.wb-assoc-entry-edit').on('click', () => openEntryTuneView(wb, '#wb-assoc-view'));
                $item.find('.hover-red').hover(function(){$(this).css('color','#ff6b6b')}, function(){$(this).css('color','gray')});
                $item.find('.hover-red').on('click', async () => {
                    await withLoadingOverlay(async () => {
                        await rebindPersonaWorldbook(null, wb);
                        await initiateDeepScan(true);
                    }, "正在为你解除 Persona 的绑定...");
                    renderAssocView();
                    toastr.success(`已经帮您解解除旧世界书的束缚啦。`);
               });
                $item.hover(function(){ $(this).css('box-shadow', '0 2px 5px rgba(0,0,0,0.2)') }, function(){ $(this).css('box-shadow', 'none') });
                $uCont.append($item);
            });
        }

        const allAllWbs = typeof getWorldbookNames === 'function' ? getWorldbookNames() :[];
        const userUnbounds = allAllWbs.filter(w => !userBooks.includes(w));

        const updateUserSelectOptions = () => {
            const kw = $ui.find('#wb-assoc-user-add-search').val().trim().toLowerCase();
            const $sel = $ui.find('#wb-assoc-user-add-sel').empty();
            const filteredWbs = kw ? userUnbounds.filter(w => w.toLowerCase().includes(kw)) : userUnbounds;

            if (filteredWbs.length > 0) {
                filteredWbs.forEach(w => $sel.append(`<option value="${w}">${w}</option>`));
                $sel.prop('disabled', false);
                $ui.find('#wb-assoc-user-add-btn').prop('disabled', false);
            } else {
                $sel.append('<option value="">没有符合条件的可绑定项...</option>');
                $sel.prop('disabled', true);
                $ui.find('#wb-assoc-user-add-btn').prop('disabled', true);
            }
        };

        $ui.find('#wb-assoc-user-add-search').off('input').on('input', updateUserSelectOptions);
        updateUserSelectOptions();

        const charName = typeof getCurrentCharacterName === 'function' ? getCurrentCharacterName() : (typeof SillyTavern !== 'undefined' ? SillyTavern.getContext().name2 : null);
        const $cCont = $ui.find('#wb-assoc-char-list').empty();

        if (!charName) {
            $cCont.append('<div style="color:#ff6b6b; font-size:13px; font-weight:bold; padding:4px;">当前好像没有打开任何角色卡的对话呢，一定要进到聊天界面里咱们才能为角色操作哦~</div>');
            $ui.find('#wb-assoc-char-add-area').hide();
        } else {
            $ui.find('#wb-assoc-char-add-area').show();

            let charBooksObj = {primary: null, additional:[]};
            try { if (typeof getCharWorldbookNames === 'function') charBooksObj = getCharWorldbookNames('current') || charBooksObj; } catch(e){}

            const cBooks =[];
            if(charBooksObj.primary) cBooks.push(charBooksObj.primary);
            if(charBooksObj.additional) cBooks.push(...charBooksObj.additional);

            if (cBooks.length === 0) {
                $cCont.append('<div style="color:gray; font-size:13px; padding:4px;">当前角色卡非常干净，一本世界书都没绑定呢。</div>');
            } else {
                cBooks.forEach(wb => {
                     const $item = $(`<div style="display:inline-flex; align-items:center; gap:8px; background:var(--SmartThemeBotMesColor); border:1px solid var(--SmartThemeQuoteColor); padding:6px 12px; border-radius:4px; transition:0.2s;">
                        <span style="font-weight:bold; font-size:14px; color:var(--SmartThemeQuoteColor); cursor:pointer;" title="点击编辑内容" class="wb-assoc-entry-edit"><i class="fa-solid fa-robot"></i> ${wb}</span>
                        <div class="hover-red" style="cursor:pointer; color:gray; margin-left: 4px;" title="解除绑定"><i class="fa-solid fa-xmark"></i></div>
                     </div>`);
                     $item.find('.wb-assoc-entry-edit').on('click', () => openEntryTuneView(wb, '#wb-assoc-view'));
                     $item.find('.hover-red').hover(function(){$(this).css('color','#ff6b6b')}, function(){$(this).css('color','gray')});
                     $item.find('.hover-red').on('click', async () => {
                         let newAdd = cBooks.filter(b => b !== wb);
                         let primary = newAdd.length > 0 ? newAdd.shift() : null;
                         await withLoadingOverlay(async () => {
                             if (typeof rebindCharWorldbooks === 'function') {
                                 await rebindCharWorldbooks('current', { primary: primary, additional: newAdd });
                                 await initiateDeepScan(true);
                             }
                         }, "正在为角色卡解除绑定...");
                         renderAssocView();
                     });
                     $item.hover(function(){ $(this).css('box-shadow', '0 2px 5px rgba(0,0,0,0.2)') }, function(){ $(this).css('box-shadow', 'none') });
                     $cCont.append($item);
                });
            }

            const unbounds = allAllWbs.filter(w => !cBooks.includes(w));

            const updateSelectOptions = () => {
                const kw = $ui.find('#wb-assoc-char-add-search').val().trim().toLowerCase();
                const $sel = $ui.find('#wb-assoc-char-add-sel').empty();
                const filteredWbs = kw ? unbounds.filter(w => w.toLowerCase().includes(kw)) : unbounds;

                if (filteredWbs.length > 0) {
                    filteredWbs.forEach(w => $sel.append(`<option value="${w}">${w}</option>`));
                    $sel.prop('disabled', false);
                    $ui.find('#wb-assoc-char-add-btn').prop('disabled', false);
                } else {
                    $sel.append('<option value="">没有符合条件的可绑定项...</option>');
                    $sel.prop('disabled', true);
                    $ui.find('#wb-assoc-char-add-btn').prop('disabled', true);
                }
            };
            $ui.find('#wb-assoc-char-add-search').off('input').on('input', updateSelectOptions);
            updateSelectOptions();
        }
    };

    $ui.find('#wb-btn-open-assoc').on('click', () => {
        renderAssocView();
        $ui.find('#wb-main-view').hide();
        $ui.find('#wb-assoc-view').fadeIn(200);
    });

    $ui.find('#wb-assoc-user-add-btn').on('click', async () => {
        const wb = $ui.find('#wb-assoc-user-add-sel').val();
        if(!wb) return;

        if (getPersonaWbs().length > 0) {
             if(await SillyTavern.callGenericPopup(`通常情况下 Persona 只能绑定一本世界书哦。如果继续操作，会替换掉原本绑定的，可以吗？`, SillyTavern.POPUP_TYPE.CONFIRM) !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
        }

        await withLoadingOverlay(async () => {
            await rebindPersonaWorldbook(wb);
            await initiateDeepScan(true);
        }, "正在努力为你的 Persona 建立羁绊...");

        toastr.success(`成功把[${wb}] 绑定给当前的 Persona 啦！`);
        $ui.find('#wb-assoc-user-add-search').val('');
        renderAssocView();
    });

    $ui.find('#wb-assoc-char-add-btn').on('click', async () => {
        const wb = $ui.find('#wb-assoc-char-add-sel').val();
        if(!wb) return;

        let charBooksObj = {primary: null, additional:[]};
        try { if (typeof getCharWorldbookNames === 'function') charBooksObj = getCharWorldbookNames('current') || charBooksObj; } catch(e){}
        const cBooks =[];
        if(charBooksObj.primary) cBooks.push(charBooksObj.primary);
        if(charBooksObj.additional) cBooks.push(...charBooksObj.additional);

        cBooks.push(wb);
        const newPrimary = cBooks.shift();
        const newAdd = cBooks;

        await withLoadingOverlay(async () => {
            if (typeof rebindCharWorldbooks === 'function') {
                await rebindCharWorldbooks('current', { primary: newPrimary, additional: newAdd });
                await initiateDeepScan(true);
            }
        }, "正在努力为你当前的角色卡绑定世界书...");

        toastr.success(`成功把[${wb}] 绑定给角色卡啦！`);
        $ui.find('#wb-assoc-char-add-search').val('');
        renderAssocView();
    });

    $ui.find('#wb-btn-assoc-cancel').on('click', () => {
        $ui.find('#wb-assoc-view').hide();
        $ui.find('#wb-main-view').fadeIn(200);
    });

    const renderData = (highlightName = null) => {
        const keyword = $ui.find('#wb-search-input').val().toLowerCase();
        const showUnboundOnly = $ui.find('#wb-filter-unbound').is(':checked');
        const stateFilter = $ui.find('#wb-filter-state').val();
        const sortMode = $ui.find('#wb-sort-select').val();

        const wCatSettings = getCategories();
        let currentSelCat = $ui.find('#wb-category-filter').val() || 'all';
        let $catDrop = $ui.find('#wb-category-filter').empty();
        $catDrop.append(`<option value="all">📁 所有类别</option><option value="unassigned">📂 未分类</option>`);
        Object.keys(wCatSettings).forEach(cName => $catDrop.append(`<option value="${cName}">${cName}</option>`));
        if (!Object.keys(wCatSettings).includes(currentSelCat) && currentSelCat !== 'unassigned') currentSelCat = 'all';
        $catDrop.val(currentSelCat);
        $ui.find('#wb-btn-del-category').toggle(currentSelCat !== 'all' && currentSelCat !== 'unassigned');

        const allWbs = getWorldbookNames();
        const activeWbs = getGlobalWorldbookNames();
        const snapshots = getVariables({ type: 'global' }).wb_snapshots || {};

        currentVisibleWbs = [...allWbs].filter(wb => {
            const bindings = globalBindingMapCache[wb] ||[];
            if (keyword && !((wb + " " + bindings.map(c => c.name).join(" ")).toLowerCase().includes(keyword))) return false;
            if (showUnboundOnly && bindings.length > 0) return false;
            if (stateFilter === 'enabled' && !activeWbs.includes(wb)) return false;
            if (stateFilter === 'disabled' && activeWbs.includes(wb)) return false;

            if (currentSelCat === 'unassigned') {
                const isAssigned = Object.values(wCatSettings).some(list => Array.isArray(list) && list.includes(wb));
                if (isAssigned) return false;
            } else if (currentSelCat !== 'all') {
                const tList = wCatSettings[currentSelCat] ||[];
                if (!tList.includes(wb)) return false;
            }
            return true;
        }).sort((a, b) => {
            if (sortMode === 'az') return a.localeCompare(b, 'zh-CN');
            if (sortMode === 'za') return b.localeCompare(a, 'zh-CN');
            const aA = activeWbs.includes(a), bA = activeWbs.includes(b);
            if (aA === bA) return a.localeCompare(b, 'zh-CN');
            return aA ? -1 : 1;
        });

        const $wbContainer = $ui.find('#wb-container').empty();
        $ui.find('#wb-batch-count').text(batchSelected.size);
        const $batchList = $ui.find('#wb-batch-selected-list').empty();
        if (batchSelected.size > 0) batchSelected.forEach(wb => $batchList.append(`<span style="background:rgba(255,107,107,0.2);color:#ff6b6b;padding:3px 6px;border-radius:4px;font-size:12px;white-space:nowrap;border:1px solid #ff6b6b;"><i class="fa-solid fa-xmark"></i> ${wb}</span>`));
        else $batchList.html('<span style="color:gray; font-size:12px;">暂未选中</span>');

        currentVisibleWbs.forEach(wb => {
            const bindings = globalBindingMapCache[wb] ||[];
            const myCats = Object.keys(wCatSettings).filter(k => Array.isArray(wCatSettings[k]) && wCatSettings[k].includes(wb));

            const $wrapper = $('<div class="wb-item-wrapper"></div>').attr('data-wb-name', wb);

            const $header = $('<div class="wb-item-header"></div>');
            const $titleArea = $('<label class="wb-item-title-area" style="cursor:pointer;"></label>');
            let $chk;

            if(isBatchMode) {
                $chk = $('<input type="checkbox" style="transform: scale(1.2); margin-top:2px; flex-shrink:0; accent-color:#ff6b6b;">').prop('checked', batchSelected.has(wb));
                $titleArea.on('click', (e) => { e.preventDefault(); batchSelected.has(wb) ? batchSelected.delete(wb) : batchSelected.add(wb); renderData(); });
            } else {
                $chk = $('<input type="checkbox" style="transform: scale(1.2); margin-top:2px; flex-shrink:0;">').prop('checked', activeWbs.includes(wb));
                $chk.on('change', async function() {
                    await withLoadingOverlay(async () => {
                        let current = getGlobalWorldbookNames();
                        $(this).is(':checked') ? current.push(wb) : current = current.filter(n => n !== wb);
                        await rebindGlobalWorldbooks(current); renderData();
                    }, "应用中...");
                });
            }
            $titleArea.append($chk);
            const statusStyle = activeWbs.includes(wb) && !isBatchMode ? 'color: var(--SmartThemeQuoteColor);' : '';
            $titleArea.append(`<span class="wb-name-text" style="${statusStyle}" title="${wb}">${wb}</span>`);
            $header.append($titleArea);

            const $bottomBar = $('<div class="wb-item-bottom"></div>');
            const $tagRow = $('<div class="wb-tag-area"></div>');

            const isBound = bindings.length > 0;
            const $bindTag = $(`<div class="wb-bind-tag" style="background: ${isBound?'var(--SmartThemeQuoteColor)':'#888'}1A; border: 1px solid ${isBound?'var(--SmartThemeQuoteColor)':'#888'}; color: ${isBound?'var(--SmartThemeQuoteColor)':'#888'};">${isBound ? `📌 已关联 ${bindings.length} 名角色/用户` : `⚪ 暂无关联`}</div>`);
            if (isBound) $bindTag.on('click', () => openBindView(wb));
            $tagRow.append($bindTag);

            if (myCats && myCats.length > 0) {
                myCats.forEach(c => $tagRow.append(`<div class="wb-bind-tag wb-cat-tag" style="background: rgba(252, 196, 25, 0.15); border: 1px solid #fcc419; color: #fcc419;" title="当前所在分类"><i class="fa-solid fa-folder"></i> ${c}</div>`));
            }
            $bottomBar.append($tagRow);

            const $catDrawer = $('<div class="wb-cat-drawer" style="display:none; padding-top:6px; border-top:1px dashed var(--SmartThemeBorderColor); margin-top:6px; flex-direction:column; gap:6px;"></div>');

            if (!isBatchMode) {
                const $actions = $('<div class="wb-item-actions"></div>');
                const isDefFav = myCats.includes("🌟默认收藏夹");

                $actions.append($(`<div class="wb-icon-btn hover-yellow" title="一键收纳入 🌟默认收藏夹" style="color:${isDefFav?'#fcc419':'inherit'}"><i class="fa-${isDefFav?'solid':'regular'} fa-star"></i></div>`).on('click', (e) => {
                    e.stopPropagation(); let d = getCategories(); if(!d["🌟默认收藏夹"]) d["🌟默认收藏夹"] = [];
                    isDefFav ? d["🌟默认收藏夹"] = d["🌟默认收藏夹"].filter(x=>x!==wb) : d["🌟默认收藏夹"].push(wb);
                    saveCategories(d); renderData(wb);
                }));

                $actions.append($(`<div class="wb-icon-btn hover-blue" title="分类管理抽屉"><i class="fa-solid fa-folder-open"></i></div>`).on('click', (e) => {
                    e.stopPropagation();
                    const renderDrawer = () => {
                         $catDrawer.empty();
                         let d = getCategories();
                         let cKeys = Object.keys(d);
                         let _mCats = cKeys.filter(k => d[k].includes(wb));

                         const $btnGrp = $('<div style="display:flex; flex-wrap:wrap; gap:6px;"></div>');
                         cKeys.forEach(cName => {
                              let isInside = _mCats.includes(cName);
                              let $cBtn = $(`<div class="wb-bind-tag" style="background:${isInside?'var(--SmartThemeQuoteColor)':'var(--SmartThemeBlurTintColor)'}; color:${isInside?'#fff':'var(--SmartThemeBodyColor)'}; border-color:${isInside?'var(--SmartThemeQuoteColor)':'var(--SmartThemeBorderColor)'}; cursor:pointer;"><i class="fa-solid ${isInside?'fa-check':'fa-folder'}"></i> ${cName}</div>`);
                              $cBtn.on('click', (ev) => {
                                   ev.stopPropagation();
                                   let curD = getCategories();
                                   if (!curD[cName]) curD[cName] = [];
                                   isInside ? curD[cName] = curD[cName].filter(x => x!==wb) : curD[cName].push(wb);
                                   saveCategories(curD);
                                   renderDrawer();
                                   let allCatsSpan = Object.keys(curD).filter(k => curD[k].includes(wb));
                                   $tagRow.find('.wb-cat-tag').remove();
                                   allCatsSpan.forEach(c => $tagRow.append(`<div class="wb-bind-tag wb-cat-tag" style="background: rgba(252, 196, 25, 0.15); border: 1px solid #fcc419; color: #fcc419;" title="当前所在分类"><i class="fa-solid fa-folder"></i> ${c}</div>`));
                              });
                              $btnGrp.append($cBtn);
                         });

                         let $newBtn = $(`<div class="wb-bind-tag" style="background:#51cf66; border-color:#51cf66; color:#fff; cursor:pointer;"><i class="fa-solid fa-plus"></i> 新增分类</div>`);
                         $newBtn.on('click', async (ev) => {
                              ev.stopPropagation();
                              let newCName = await SillyTavern.callGenericPopup("请告诉我新分类的名字：", SillyTavern.POPUP_TYPE.INPUT);
                              if(newCName && (newCName=newCName.trim())) {
                                   let curD = getCategories();
                                   if(curD[newCName]) return toastr.warning("名字已经存在咯！");
                                   curD[newCName] = [wb]; saveCategories(curD);
                                   renderDrawer();
                                   $tagRow.append(`<div class="wb-bind-tag wb-cat-tag" style="background: rgba(252, 196, 25, 0.15); border: 1px solid #fcc419; color: #fcc419;" title="当前所在分类"><i class="fa-solid fa-folder"></i> ${newCName}</div>`);
                              }
                         });
                         $btnGrp.append($newBtn);
                         $catDrawer.append('<div style="font-size:12px; color:var(--SmartThemeQuoteColor); margin-bottom:4px; font-weight:bold;">✨ 点选即可收入对应分类中，可以多选哦：</div>').append($btnGrp);
                    };

                    if ($catDrawer.is(':visible')) { $catDrawer.slideUp(150); } else { renderDrawer(); $catDrawer.slideDown(150); }
                }));

                $actions.append($('<div class="wb-icon-btn" title="整理条目"><i class="fa-solid fa-list"></i></div>').on('click', () => openEntryTuneView(wb, '#wb-main-view')))
                        .append($('<div class="wb-icon-btn" title="重命名名称"><i class="fa-solid fa-pen"></i></div>').on('click', () => attemptRenameWb(wb, bindings.length > 0, bindings)))
                        .append($('<div class="wb-icon-btn hover-red" title="彻底删除"><i class="fa-solid fa-trash"></i></div>').on('click', async () => {
                             if (await SillyTavern.callGenericPopup(`删除确认：丢失 [${wb}] ？`, SillyTavern.POPUP_TYPE.CONFIRM) === SillyTavern.POPUP_RESULT.AFFIRMATIVE) {
                                  await withLoadingOverlay(async () => { await deleteWorldbook(wb); delete globalBindingMapCache[wb];
                                      let d = getCategories(); Object.keys(d).forEach(k => d[k] = d[k].filter(n=>n!==wb)); saveCategories(d);
                                      renderData();
                                  }, `删除中...`);
                             }
                        }));
                $bottomBar.append($actions);
            }

            $wrapper.append($header).append($bottomBar).append($catDrawer);
            $wbContainer.append($wrapper);
        });

        if (highlightName) {
            setTimeout(() => {
                const $highlightItem = $wbContainer.find(`[data-wb-name="${highlightName}"]`);
                if ($highlightItem.length) { $highlightItem[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); $highlightItem.addClass('wb-highlight'); setTimeout(() => $highlightItem.removeClass('wb-highlight'), 1000); }
            }, 100);
        }

        const $snapContainer = $ui.find('#wb-snapshot-container').empty();
        Object.entries(snapshots).forEach(([name, snapData]) => {
            const isDetailed = !Array.isArray(snapData) && snapData.type === 'detailed';
            const wbs = isDetailed ? Object.keys(snapData.data) : (Array.isArray(snapData) ? snapData : snapData.wbs);
            const $item = $(`<div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--SmartThemeBotMesColor); border-radius:6px; border:1px solid var(--SmartThemeBorderColor); flex-wrap:wrap; gap:8px;"></div>`);
            $item.append(`<div style="flex:1; min-width: 150px;"><div style="font-weight:bold;font-size:14px;"><i class="fa-solid ${isDetailed?'fa-puzzle-piece':'fa-box-archive'}" style="color:var(--SmartThemeQuoteColor);"></i> ${name}</div><div style="font-size:12px;color:gray;">${isDetailed?`含 ${Object.values(snapData.data).reduce((a,c)=>a+c.length,0)} 个内容微调`:`含 ${(wbs||[]).length} 项设定`}</div></div>`);
            const $act = $('<div style="display:flex; gap:6px; flex-wrap: wrap;"></div>');
            $act.append($('<button class="menu_button interactable btn-success wb-nowrap-btn" style="margin:0; padding:6px 12px; font-size:12px; border:none;">应用该组合</button>').on('click', async () => {
                if(isDetailed) await applyDetailedSnapshot(snapData.data); else await withLoadingOverlay(async() => await rebindGlobalWorldbooks(wbs), `应用中...`);
                toastr.success("组合已应用。"); renderData();
            }));
            $act.append($('<button class="menu_button interactable wb-nowrap-btn" style="margin:0; padding:6px 10px;" title="编辑项"><i class="fa fa-pen"></i></button>').on('click', () => isDetailed ? openDetailedSnapView(name, snapData.data) : openEditSnapView(name, wbs)));
            $act.append($('<button class="menu_button interactable btn-danger wb-nowrap-btn" style="margin:0; padding:6px 10px; border:none;" title="删除快照"><i class="fa fa-trash"></i></button>').on('click', async () => {
                if (await SillyTavern.callGenericPopup(`确认删除快照？`, SillyTavern.POPUP_TYPE.CONFIRM) === SillyTavern.POPUP_RESULT.AFFIRMATIVE) { updateVariablesWith(v => { delete v.wb_snapshots[name]; return v; }, { type: 'global' }); renderData(); }
            }));
            $item.append($act); $snapContainer.append($item);
        });
    };

    let activeBindWb = "";
    const openBindView = (wbName) => {
        activeBindWb = wbName; $ui.find('#wb-bind-title').text(wbName);
        $ui.find('#wb-main-view').hide(); $ui.find('#wb-bind-view').fadeIn(); renderBindList();
    };

    const renderBindList = () => {
        const kw = $ui.find('#wb-bind-search').val().toLowerCase();
        const $cont = $ui.find('#wb-bind-container').empty();
        const bChars = globalBindingMapCache[activeBindWb] ||[];
        (kw ? bChars.filter(c => c.name.toLowerCase().includes(kw)) : bChars).forEach(char => {
            $cont.append(`<div style="display:flex; justify-content:space-between; align-items:center; background: var(--SmartThemeBotMesColor); border: 1px solid var(--SmartThemeBorderColor); border-radius:6px; padding: 10px;">
                               <div style="display:flex; align-items:center; gap:12px;">
                                 <img src="${(SillyTavern && typeof SillyTavern.getThumbnailUrl === 'function') ? SillyTavern.getThumbnailUrl(char.name.includes('用户') ? 'persona' : 'avatar', char.avatar) : ''}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:2px solid var(--SmartThemeQuoteColor); background:#333;">
                                 <div style="display:flex; flex-direction:column;"><span style="font-weight:bold; font-size:14px; margin-bottom:2px;">${char.name}</span><div style="font-size:11px;color:gray;">(${char.avatar})</div></div>
                               </div>
                             </div>`);
        });
        if (bChars.length === 0) $cont.html('<div style="padding:15px; color:gray; text-align:center;">这本书目前可以说是非常地清闲，没有任何绑定呢~</div>');
    };
    $ui.find('#wb-bind-search').on('input', renderBindList);
    $ui.find('#wb-btn-bind-cancel').on('click', () => { $ui.find('#wb-bind-view').hide(); $ui.find('#wb-main-view').fadeIn(); });

    $ui.find('#wb-btn-save-snap').on('click', async () => {
         let name = await SillyTavern.callGenericPopup("创建新快照组合名称：", SillyTavern.POPUP_TYPE.INPUT, "新备份组合");
         if (!name || !(name=name.trim())) return;
         updateVariablesWith(v => { if (!v.wb_snapshots) v.wb_snapshots = {}; v.wb_snapshots[name] = { type: 'simple', wbs: getGlobalWorldbookNames() }; return v; }, { type: 'global' });
         toastr.success("组合保存完毕。"); renderData();
    });

    let snapOldName = "", snapTempList =[];
    const openEditSnapView = (name, list) => {
        snapOldName = name; snapTempList = [...list]; $ui.find('#wb-edit-snap-name').val(name);
        const buildList = () => {
            const kw = $ui.find('#wb-edit-snap-search').val().toLowerCase();
            const $c = $ui.find('#wb-edit-snap-container').empty();
            [...getWorldbookNames()].sort((a,b) => { const ac = snapTempList.includes(a), bc = snapTempList.includes(b); return ac===bc ? a.localeCompare(b,'zh-CN') : (ac?-1:1); }).forEach(w => {
                if (kw && !w.toLowerCase().includes(kw)) return;
                const isChk = snapTempList.includes(w);
                const $wHolder = $(`<div class="wb-item-wrapper" style="flex-direction:row; align-items:center; cursor:pointer;"></div>`);
                const $chkBox = $(`<input type="checkbox" style="transform:scale(1.2); flex-shrink:0;">`).prop('checked', isChk);
                $wHolder.append($chkBox, `<span class="wb-name-text" style="${isChk?'font-weight:bold;color:var(--SmartThemeQuoteColor)':''}">${w}</span>`).on('click', () => $chkBox.prop('checked', !$chkBox.is(':checked')).trigger('change'));
                $chkBox.on('change', function() { $(this).is(':checked') ? (snapTempList.includes(w)||snapTempList.push(w)) : (snapTempList=snapTempList.filter(n=>n!==w)); buildList(); });
                $c.append($wHolder);
            });
        };
        $ui.find('#wb-edit-snap-search').off('input').on('input', buildList).val(''); buildList();
        $ui.find('#wb-main-view').hide(); $ui.find('#wb-edit-snap-view').fadeIn(200);
    };

    $ui.find('#wb-btn-edit-save').on('click', async () => {
        const nName = $ui.find('#wb-edit-snap-name').val().trim();
        if(!nName) return toastr.warning("名称不能为空哦。");
        updateVariablesWith(v => {
            if (!v.wb_snapshots) v.wb_snapshots = {};
            if (nName !== snapOldName) delete v.wb_snapshots[snapOldName];
            v.wb_snapshots[nName] = { type: 'simple', wbs: snapTempList }; return v;
        }, { type: 'global' });
        toastr.success("快照已成功更新！"); $ui.find('#wb-edit-snap-view').hide(); $ui.find('#wb-main-view').fadeIn(); renderData();
    });
    $ui.find('#wb-btn-edit-cancel').on('click', () => { $ui.find('#wb-edit-snap-view').hide(); $ui.find('#wb-main-view').fadeIn(); });

    let detailedSnapData = {}; let detailedSnapOldName = ""; let currentOpenedDsWb = "";

    const openDetailedSnapView = (name = "", existingData = {}) => {
        detailedSnapOldName = name; detailedSnapData = JSON.parse(JSON.stringify(existingData)); $ui.find('#dsnap-name').val(name);
        const $wbList = $ui.find('#dsnap-wb-list').empty(), $entryList = $ui.find('#dsnap-entry-list').empty(), allWbs = getWorldbookNames();

        const renderWbList = () => {
            const keyword = $ui.find('#dsnap-wb-search').val().toLowerCase(), hideBound = $ui.find('#dsnap-filter-unbound').is(':checked'); $wbList.empty();
            const filteredWbs = allWbs.filter(wb => (wb.toLowerCase().includes(keyword) && (!hideBound || (globalBindingMapCache[wb] ||[]).length === 0)));
            filteredWbs.forEach(wbName => {
                const selectedCount = (detailedSnapData[wbName] ||[]).length;
                const $item = $(`<div class="dsnap-wb-item" data-wbname="${wbName}">${wbName} <b style="color:var(--okGreen); display:${selectedCount>0?'inline':'none'};">(${selectedCount})</b></div>`);
                $item.on('click', async () => {
                    if ($item.hasClass('active')) return;
                    $wbList.find('.active').removeClass('active'); $item.addClass('active'); currentOpenedDsWb = wbName; await renderEntryListFor(wbName);
                });
                $wbList.append($item);
            });
            if ($wbList.find('.active').length === 0 && filteredWbs.length > 0) $wbList.children().first().trigger('click');
            else if (filteredWbs.length === 0) $entryList.html('<div style="color:gray;text-align:center;padding:20px;">未找到匹配的世界书</div>');
        };

        $ui.find('#dsnap-wb-search, #dsnap-filter-unbound').off('input change').on('input change', renderWbList); $ui.find('#dsnap-wb-search').val('');

        const renderEntryListFor = async (wbName) => {
            $entryList.html('<div style="padding:20px;text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> 正在加载条目...</div>');
            try {
                const entries = await getWorldbook(wbName);
                if (entries.length === 0) { $entryList.html('<div style="color:gray; text-align:center; padding:15px;">这本书是空的...</div>'); return; }
                renderDsEntryItems(entries, wbName);
            } catch (e) { $entryList.html('<div style="color:red; text-align:center;">加载条目失败！</div>'); }
        };

        const renderDsEntryItems = (entries, wbName) => {
            $entryList.empty(); let displayEntries = [...entries]; const sortMode = $ui.find('#dsnap-entry-sort').val() || 'default';
            if (sortMode === 'order_asc') displayEntries.sort((a, b) => (a.position?.order ?? 100) - (b.position?.order ?? 100));
            else if (sortMode === 'order_desc') displayEntries.sort((a, b) => (b.position?.order ?? 100) - (a.position?.order ?? 100));
            else if (sortMode === 'depth_asc') displayEntries.sort((a, b) => (a.position?.depth ?? 0) - (b.position?.depth ?? 0));
            else if (sortMode === 'depth_desc') displayEntries.sort((a, b) => (b.position?.depth ?? 0) - (a.position?.depth ?? 0));
            else if (sortMode === 'az') displayEntries.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN'));
            else if (sortMode === 'za') displayEntries.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'zh-CN'));

            displayEntries.forEach(entry => {
                const isChecked = (detailedSnapData[wbName] ||[]).includes(entry.uid);
                const rawStateColor = entry.enabled ? 'var(--okGreen)' : 'gray', sType = entry.strategy?.type, StrategyTxt = sType === 'selective' ? '🟩 匹配' : '🟦 常驻', posBadge = formatPositionBadge(entry.position);
                const $item = $(`<div class="dsnap-entry-item" style="border-left: 3px solid ${rawStateColor};"><input type="checkbox" style="transform:scale(1.2); margin-top:3px; flex-shrink:0;"><div class="dsnap-entry-body"><div class="dsnap-entry-title">${entry.name || `(未命名条目)`}</div><div class="dsnap-entry-meta"><span class="${entry.enabled?'badge-green':'badge-grey'}">${entry.enabled?'原始已启':'原始关闭'}</span><span class="badge-blue">${StrategyTxt}</span><span class="badge-grey" style="color:var(--SmartThemeQuoteColor); border-color:var(--SmartThemeBorderColor); background:none;">${posBadge}</span></div></div></div>`);

                $item.find('input').prop('checked', isChecked).on('change', function() {
                    const checked = $(this).is(':checked'); if (!detailedSnapData[wbName]) detailedSnapData[wbName] =[];
                    if (checked) { if (!detailedSnapData[wbName].includes(entry.uid)) detailedSnapData[wbName].push(entry.uid); } else { detailedSnapData[wbName] = detailedSnapData[wbName].filter(uid => uid !== entry.uid); }
                    if (detailedSnapData[wbName].length === 0) delete detailedSnapData[wbName];
                    const newCount = (detailedSnapData[wbName] ||[]).length, $counter = $wbList.find(`.dsnap-wb-item.active[data-wbname="${wbName}"] b`);
                    $counter.text(`(${newCount})`); newCount > 0 ? $counter.show() : $counter.hide();
                });
                $entryList.append($item);
            });
        };

        $ui.find('#dsnap-entry-sort').off('change').on('change', async () => { if (currentOpenedDsWb) { const entries = await getWorldbook(currentOpenedDsWb); renderDsEntryItems(entries, currentOpenedDsWb); } });
        renderWbList(); $ui.find('#wb-main-view, #wb-edit-snap-view, #wb-assoc-view').hide(); $ui.find('#wb-detailed-snap-view').fadeIn(200);
    };

    const applyDetailedSnapshot = async (data) => {
        await withLoadingOverlay(async () => {
            const allWbNames = getWorldbookNames(), targetWbNames = Object.keys(data);
            for (const wbName of allWbNames) {
                let wbEntries = await getWorldbook(wbName), changed = false;
                if (targetWbNames.includes(wbName)) {
                    const enabledUIDs = data[wbName];
                    wbEntries.forEach(entry => { const shouldBeEnabled = enabledUIDs.includes(entry.uid); if(entry.enabled !== shouldBeEnabled) { entry.enabled = shouldBeEnabled; changed = true; } });
                } else {
                    wbEntries.forEach(entry => { if(entry.enabled) { entry.enabled = false; changed = true; } });
                }
                if (changed) await replaceWorldbook(wbName, wbEntries);
            }
            await rebindGlobalWorldbooks(targetWbNames);
        }, "正在应用复合场景...");
    };

    $ui.find('#wb-btn-create-detail-snap').on('click', () => openDetailedSnapView());

    $ui.find('#dsnap-save').on('click', () => {
        const name = $ui.find('#dsnap-name').val().trim(); if (!name) return toastr.warning("也要留下好听的名字啊！");
        updateVariablesWith(v => {
            if (!v.wb_snapshots) v.wb_snapshots = {};
            if(name !== detailedSnapOldName) delete v.wb_snapshots[detailedSnapOldName];
            v.wb_snapshots[name] = { type: 'detailed', data: detailedSnapData }; return v;
        }, { type: 'global' });
        toastr.success(`快照保存好啦。`); $ui.find('#wb-detailed-snap-view').hide(); $ui.find('#wb-main-view').fadeIn(200); renderData();
    });
    $ui.find('#dsnap-cancel').on('click', () => { $ui.find('#wb-detailed-snap-view').hide(); $ui.find('#wb-main-view').fadeIn(200); });

    let tuneWbName = ""; let tuneEntries =[];
    let tuneReturnView = '#wb-main-view';

    const openEntryTuneView = async (wbName, fromView = '#wb-main-view') => {
        tuneReturnView = fromView;
        tuneWbName = wbName; $ui.find('#wb-entry-title').text(wbName); $ui.find('#wb-entry-search').val(''); $ui.find('#wb-entry-sort').val('default');
        await withLoadingOverlay(async () => { tuneEntries = JSON.parse(JSON.stringify(await getWorldbook(wbName))); }, `提取内容...`);
        isEntryBatchMode = false; entryBatchSelected.clear();
        $ui.find('#wb-btn-entry-batch').removeClass('btn-warning').addClass('btn-danger').html('<i class="fa-solid fa-trash-can"></i> 批量删除');
        $ui.find('#wb-entry-batch-actions').hide();
        renderEntryList();
        $ui.find('#wb-main-view, #wb-detail-view, #wb-assoc-view').hide();
        $ui.find('#wb-entry-view').fadeIn(200);
    };

    $ui.find('#wb-btn-entry-batch').on('click', function() {
        isEntryBatchMode = !isEntryBatchMode;
        if(isEntryBatchMode) {
            entryBatchSelected.clear(); $(this).removeClass('btn-danger').addClass('btn-warning').html('<i class="fa-solid fa-xmark"></i> 退出批量'); $ui.find('#wb-entry-batch-actions').css('display', 'flex');
        } else {
            $(this).removeClass('btn-warning').addClass('btn-danger').html('<i class="fa-solid fa-trash-can"></i> 批量删除'); $ui.find('#wb-entry-batch-actions').hide();
        }
        renderEntryList();
    });

    $ui.find('#wb-btn-entry-confirm-delete').on('click', async () => {
        if(entryBatchSelected.size === 0) return toastr.warning("请先选中要删除的条目哦~");
        if(await SillyTavern.callGenericPopup(`确认要暂时移除这 ${entryBatchSelected.size} 项内容吗？\n(移除后还需要点击最下方绿色保存按钮才会生效哦)`, SillyTavern.POPUP_TYPE.CONFIRM) === SillyTavern.POPUP_RESULT.AFFIRMATIVE) {
             let sortedIndices = Array.from(entryBatchSelected).sort((a,b)=>b-a);
             sortedIndices.forEach(idx => tuneEntries.splice(idx, 1)); entryBatchSelected.clear(); renderEntryList();
             toastr.success("勾选的内容都暂存移除了，记得点确认保存把变更写入源文件哦！");
        }
    });

    const renderEntryList = () => {
        const keyword = $ui.find('#wb-entry-search').val().toLowerCase(), sortMode = $ui.find('#wb-entry-sort').val() || 'default', $container = $ui.find('#wb-entry-container').empty();
        $ui.find('#wb-entry-batch-count').text(entryBatchSelected.size);

        const filteredEntries = tuneEntries.filter(entry => { const searchStr = `${entry.name||''} ${(entry.strategy?.keys||[]).join(',')}`.toLowerCase(); return !keyword || searchStr.includes(keyword); });

        let sortedEntries = [...filteredEntries];
        if (sortMode === 'order_asc') sortedEntries.sort((a, b) => (a.position?.order ?? 100) - (b.position?.order ?? 100));
        else if (sortMode === 'order_desc') sortedEntries.sort((a, b) => (b.position?.order ?? 100) - (a.position?.order ?? 100));
        else if (sortMode === 'depth_asc') sortedEntries.sort((a, b) => (a.position?.depth ?? 0) - (b.position?.depth ?? 0));
        else if (sortMode === 'depth_desc') sortedEntries.sort((a, b) => (b.position?.depth ?? 0) - (a.position?.depth ?? 0));
        else if (sortMode === 'az') sortedEntries.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN'));
        else if (sortMode === 'za') sortedEntries.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'zh-CN'));

        sortedEntries.forEach((entry) => {
            const index = tuneEntries.indexOf(entry), strategy = entry.strategy || { type: 'constant', keys:[] };
            const keysInfo = strategy.type !== 'selective' ? `<span style="color:gray;">[常驻无触发词]</span>` : `🔑 ${(strategy.keys||[]).join(', ')||'<span style="color:#d63384">未设置词汇</span>'}`;
            const posBadgeHtml = `<span class="badge-grey" style="color:var(--SmartThemeBodyColor); background:none; border-color:var(--SmartThemeBorderColor);">${formatPositionBadge(entry.position)}</span>`;

            const $item = $(`<div style="display:flex; align-items:flex-start; gap:12px; padding:10px; border-left: 4px solid ${entry.enabled ? 'var(--okGreen)' : 'gray'};"></div>`);

            let $chk;
            if (isEntryBatchMode) {
                $chk = $(`<input type="checkbox" style="transform: scale(1.2); flex-shrink:0; margin-top:2px; accent-color:#ff6b6b;">`).prop('checked', entryBatchSelected.has(index)).on('change', function() {
                    $(this).is(':checked') ? entryBatchSelected.add(index) : entryBatchSelected.delete(index); $ui.find('#wb-entry-batch-count').text(entryBatchSelected.size);
                });
            } else {
                $chk = $(`<input type="checkbox" style="transform: scale(1.2); flex-shrink:0; margin-top:2px;">`).prop('checked', entry.enabled).on('change', function() { entry.enabled = $(this).is(':checked'); renderEntryList(); });
            }

            const $info = $(`<div style="flex:1; min-width:0; cursor:${isEntryBatchMode?'pointer':'default'};"><div style="font-weight:bold; margin-bottom: 5px; font-size:14px; word-break:break-all;">${entry.name || '未定义模块'}</div><div style="font-size:11px;color:gray;display:flex;align-items:center;flex-wrap:wrap;gap:4px;">${strategy.type !== 'selective' ? '<span class="badge-blue">常驻</span>' : '<span class="badge-green">匹配</span>'}${posBadgeHtml} <span style="margin-left:5px;">${keysInfo}</span></div></div>`);
            if (isEntryBatchMode) $info.on('click', () => { $chk.prop('checked', !$chk.is(':checked')).trigger('change'); });

            const $right = $('<div style="display:flex; gap:8px; margin-left:auto; flex-shrink:0;"></div>');
            $right.append($('<button class="menu_button interactable wb-nowrap-btn" style="color:var(--SmartThemeQuoteColor); margin:0;" title="修改内容"><i class="fa fa-pen-nib"></i></button>').on('click', () => openDetailEditView(index)));
            $right.append($('<button class="menu_button interactable wb-nowrap-btn" style="color:#ff6b6b; margin:0;" title="删除条目"><i class="fa fa-trash"></i></button>').on('click', async () => {
                if(await SillyTavern.callGenericPopup(`确认删除 [${entry.name || '未命名'}]？`, SillyTavern.POPUP_TYPE.CONFIRM) === SillyTavern.POPUP_RESULT.AFFIRMATIVE) { tuneEntries.splice(index, 1); renderEntryList(); }
            }));

            if(isEntryBatchMode) $right.hide();

            $item.append($chk, $info, $right); $container.append($item);
        });
        if (sortedEntries.length === 0) $container.html(`<div style="color: gray; padding: 10px; text-align: center;">${tuneEntries.length > 0 ? '搜查不到匹配内容呢。': '完全是一本空壳书呀。'}</div>`);
    };

    $ui.find('#wb-entry-search').off('input').on('input', renderEntryList); $ui.find('#wb-entry-sort').off('change').on('change', renderEntryList);
    $ui.find('#wb-btn-entry-all').off('click').on('click', () => { tuneEntries.forEach(e => e.enabled = true); renderEntryList(); });
    $ui.find('#wb-btn-entry-none').off('click').on('click', () => { tuneEntries.forEach(e => e.enabled = false); renderEntryList(); });
    $ui.find('#wb-btn-entry-add').off('click').on('click', () => {
        tuneEntries.unshift({ uid: Date.now() + Math.random(), name: "新增编辑条目", enabled: true, content: "", strategy: { type: 'constant', keys:[] }, position: { type: 'at_depth', role: 'system', depth: 0, order: 100 }, recursion: { prevent_incoming: false, prevent_outgoing: false, delay_until: null }, exclude_recursion: false, prevent_recursion: false });
        renderEntryList(); openDetailEditView(0);
    });

    $ui.find('#wb-btn-entry-save').on('click', async () => {
        await withLoadingOverlay(async () => { await replaceWorldbook(tuneWbName, tuneEntries); }, `写入中...`);
        $ui.find('#wb-entry-view').hide();
        $ui.find(tuneReturnView).fadeIn(200);
        if(tuneReturnView === '#wb-main-view') renderData();
    });
    $ui.find('#wb-btn-entry-cancel').on('click', () => {
        $ui.find('#wb-entry-view').hide();
        $ui.find(tuneReturnView).fadeIn(200);
    });

    let tuneDetailIndex = -1;
    $ui.find('#wb-det-position').on('change', function() { $ui.find('#wb-det-depth-container').toggle($(this).val().startsWith('at_depth_')); });

    const openDetailEditView = (index) => {
        tuneDetailIndex = index; const e = tuneEntries[index]; $ui.find('#wb-detail-title').text(e.name || '空参数');
        $ui.find('#wb-det-name').val(e.name || ''); $ui.find('#wb-det-content').val(e.content || ''); $ui.find('#wb-det-keys').val((e.strategy?.keys||[]).join(', ')); $ui.find('#wb-det-strategy').val(e.strategy?.type || 'constant');
        let p = e.position?.type || 'at_depth'; if (p === 'at_depth' || p === 'outlet') p = `at_depth_${e.position?.role || 'system'}`;
        $ui.find('#wb-det-position').val(p).trigger('change'); $ui.find('#wb-det-depth').val(e.position?.depth ?? 0); $ui.find('#wb-det-order').val(e.position?.order ?? 100);

        const isExclude = e.recursion?.prevent_incoming ?? e.exclude_recursion ?? e.excludeRecursion ?? false, isPrevent = e.recursion?.prevent_outgoing ?? e.prevent_recursion ?? e.preventRecursion ?? false;
        $ui.find('#wb-det-exclude-recursion').prop('checked', !!isExclude); $ui.find('#wb-det-prevent-recursion').prop('checked', !!isPrevent);
        $ui.find('#wb-entry-view').hide(); $ui.find('#wb-detail-view').fadeIn(200);
    };

    $ui.find('#wb-btn-det-save').on('click', () => {
        if(tuneDetailIndex === -1) return;
        const e = tuneEntries[tuneDetailIndex], pos = $ui.find('#wb-det-position').val(), order = parseInt($ui.find('#wb-det-order').val()) || 100;
        e.name = $ui.find('#wb-det-name').val(); e.content = $ui.find('#wb-det-content').val(); e.strategy = { type: $ui.find('#wb-det-strategy').val(), keys: $ui.find('#wb-det-keys').val().split(',').map(s=>s.trim()).filter(Boolean) };
        if (pos.startsWith('at_depth_')) e.position = { type: 'at_depth', role: pos.replace('at_depth_',''), depth: parseInt($ui.find('#wb-det-depth').val())||0, order: order }; else e.position = { type: pos, order: order };

        const checkExclude = $ui.find('#wb-det-exclude-recursion').is(':checked'), checkPrevent = $ui.find('#wb-det-prevent-recursion').is(':checked');
        if (!e.recursion) e.recursion = { prevent_incoming: false, prevent_outgoing: false, delay_until: null };
        e.recursion.prevent_incoming = checkExclude; e.recursion.prevent_outgoing = checkPrevent; e.exclude_recursion = checkExclude; e.prevent_recursion = checkPrevent;
        $ui.find('#wb-detail-view').hide(); $ui.find('#wb-entry-view').fadeIn(200); renderEntryList();
    });

    $ui.find('#wb-btn-det-cancel').on('click', () => {
        $ui.find('#wb-detail-view').hide();
        $ui.find('#wb-entry-view').fadeIn(200);
    });

    await popup.show();
});
