// 1. 清理旧脚本按钮和入口
try { replaceScriptButtons([]); } catch (e) {}
$("#option_lulu_wb_manager").remove();

// 2. 锚定原生选项菜单底部
const $targetHr = $(".options-content").find("hr").last();
const $menuBtn = $("<a>", { id: "option_lulu_wb_manager", class: "interactable", tabindex: 0 })
    .append($("<i>", { class: "fa-lg fa-solid fa-book-atlas", css: { paddingRight: '12px' } }))
    .append($("<span>").text("全局世界书管理"));

$menuBtn.insertBefore($targetHr);

// 全局缓存的绑定状态数据
let globalBindingMapCache = {};

// 4. 面板核心控制逻辑
$menuBtn.on('click', async () => {
    $("#options").hide();

    const customCSS = `
        <style>
            dialog.wb-manager-dialog { width: 90vw !important; max-width: 1600px !important; transition: zoom 0.2s ease-out; overflow: hidden; }
            #wb-manager-panel h3 { font-size: 15px; margin: 15px 0 10px 0; border-bottom: 2px solid var(--SmartThemeBorderColor); padding-bottom: 5px; color: var(--SmartThemeQuoteColor); }

            .wb-list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; align-content: start; max-height: 35vh; overflow-y: auto; background: var(--SmartThemeBlurTintColor); border-radius: 8px; border: 1px solid var(--SmartThemeBorderColor); padding: 10px; position: relative; }
            .wb-snapshot-list { display: flex; flex-direction: column; gap: 8px; max-height: 25vh; overflow-y: auto; background: var(--SmartThemeBlurTintColor); border-radius: 8px; border: 1px solid var(--SmartThemeBorderColor); padding: 10px; }

            .wb-item-wrapper { display: flex; align-items: stretch; background: var(--SmartThemeBlurTintColor); border-radius: 4px; border: 1px solid var(--SmartThemeBorderColor); transition: 0.2s; overflow: hidden; }
            .wb-item-wrapper:hover { border-color: var(--SmartThemeQuoteColor); box-shadow: 0 0 5px var(--SmartThemeQuoteColor); z-index: 10; transform: translateY(-1px); }

            .wb-item-content { flex: 1; display: flex; flex-direction: column; justify-content: center; cursor: pointer; user-select: none; padding: 6px 8px; margin: 0; overflow: hidden; }
            .wb-name-text { font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; }
            .wb-bind-tag { font-size: 11px; margin-top: 4px; border-radius: 3px; padding: 3px 5px; display: inline-block; width: fit-content; font-weight: bold; }

            .wb-btn-icon { display: flex; align-items: center; justify-content: center; padding: 0 12px; cursor: pointer; border-left: 1px solid var(--SmartThemeBorderColor); background: rgba(128,128,128,0.05); color: var(--SmartThemeQuoteColor); transition: 0.2s; flex-shrink: 0;}
            .wb-btn-icon:hover { background: var(--SmartThemeQuoteColor); color: #fff; }
            .wb-btn-icon.del:hover { background: var(--crimson); color: #fff; }

            .wb-btn-group { display: flex; gap: 10px; margin: 12px 0; flex-wrap: wrap; }
            .wb-action-btn { flex: 1; min-width: 120px; text-align: center; cursor: pointer; padding: 8px; border-radius: 5px; background: var(--SmartThemeBotMesColor); border: 1px solid var(--SmartThemeBorderColor); transition: 0.2s; font-weight: bold; font-size: 13.5px; box-sizing: border-box; }
            .wb-action-btn:hover { filter: brightness(1.2); }

            .wb-snapshot-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--SmartThemeBlurTintColor); border-radius: 5px; border: 1px solid var(--SmartThemeBorderColor); transition: 0.2s; flex-wrap: wrap; gap: 8px; }
            .wb-snapshot-item:hover { background: rgba(163, 201, 241, 0.1); }

            .wb-form-group label { display: block; font-size: 13px; font-weight: bold; margin-bottom: 6px; color: var(--SmartThemeQuoteColor); }
            .wb-input-dt { width: 100%; box-sizing: border-box; padding: 8px; border-radius: 4px; border: 1px solid var(--SmartThemeBorderColor); background: var(--SmartThemeBlurTintColor); color: var(--SmartThemeBodyColor); font-family: inherit; transition: 0.2s; }
            .wb-input-dt:focus { border-color: var(--SmartThemeQuoteColor); outline: none; box-shadow: 0 0 5px var(--SmartThemeQuoteColor); }
            textarea.wb-input-dt { resize: none; font-family: monospace; }

            /* 徽章样式 */
            .badge-blue { background: rgba(51, 154, 240, 0.15); color: #339af0; border: 1px solid #339af0; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 6px; }
            .badge-green { background: rgba(81, 207, 102, 0.15); color: #51cf66; border: 1px solid #51cf66; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 6px; }
            .badge-crimson { background: rgba(220,53,69, 0.15); color: #dc3545; border: 1px solid #dc3545; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold; display: inline-block; white-space: nowrap;}

            /* 强制不换行按钮样式 (解决极窄自适应下的变型问题) */
            .wb-nowrap-btn { white-space: nowrap !important; flex-shrink: 0 !important; word-break: keep-all !important; display: flex; align-items: center; justify-content: center; gap: 5px; }
        </style>
    `;

    const $ui = $(`
        <div id="wb-manager-panel" style="text-align: left; color: var(--SmartThemeBodyColor); padding: 5px; position: relative; min-height: 400px;">
            ${customCSS}

            <!-- 后台扫描加载层 -->
            <div id="wb-loading-overlay" style="position: absolute; top:0; left:0; width:100%; height:100%; background: var(--SmartThemeBlurTintColor); z-index: 999; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 8px; text-align: center;">
                <i class="fa-solid fa-spinner fa-spin fa-3x" style="color: var(--SmartThemeQuoteColor); margin-bottom: 20px;"></i>
                <h3 style="color: var(--SmartThemeQuoteColor); margin:0;">正在读取数据...</h3>
                <div id="wb-scan-progress" style="font-weight: bold; margin-top: 15px; font-size: 16px;">0 / 0</div>
                <div style="font-size: 13px; color: gray; margin-top: 10px;">正在检索全局角色卡关联设定，请稍候</div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--SmartThemeBorderColor); margin-bottom: 12px; padding-bottom: 8px; flex-wrap: wrap; gap: 10px;">
                <h2 style="margin: 0; font-size: 18px; color: var(--SmartThemeQuoteColor); font-weight: bold; white-space: nowrap;">📚 全局世界书管理终端 </h2>
                <div style="display: flex; gap: 5px; align-items: center; background: var(--SmartThemeBlurTintColor); padding: 3px; border-radius: 6px; border: 1px solid var(--SmartThemeBorderColor); flex-shrink: 0;">
                    <button id="wb-zoom-out" class="menu_button interactable" style="margin:0; padding: 4px 10px; min-width: unset;" title="缩小窗口"><i class="fa-solid fa-minus"></i></button>
                    <span id="wb-zoom-val" style="font-size: 13.5px; font-weight: bold; min-width: 50px; text-align: center;">100%</span>
                    <button id="wb-zoom-in" class="menu_button interactable" style="margin:0; padding: 4px 10px; min-width: unset;" title="放大窗口"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>

            <!-- ================= 第一层：主视图 ================= -->
            <div id="wb-main-view">
                <input type="text" id="wb-search-input" class="text_pole" placeholder="🔍 检索世界书列表..." style="width: 100%; box-sizing: border-box; margin-bottom: 8px; padding: 8px; font-size: 14px;">

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                    <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13.5px; margin: 0; min-width: max-content;">
                        <input type="checkbox" id="wb-filter-unbound" style="accent-color: var(--SmartThemeQuoteColor); transform: scale(1.1);">
                        <span style="font-weight: bold; color: var(--SmartThemeQuoteColor);">🛡 仅显示【未绑定角色】的世界书</span>
                    </label>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; flex: 1; justify-content: flex-end;">
                        <button id="wb-btn-select-all" class="menu_button interactable wb-nowrap-btn" style="margin: 0; padding: 6px 12px; font-size: 12.5px;" title="基于当前列表全选"><i class="fa-solid fa-list-check"></i> 全选当前显示项</button>
                        <button id="wb-btn-deselect-all" class="menu_button interactable wb-nowrap-btn" style="margin: 0; padding: 6px 12px; font-size: 12.5px;"><i class="fa-regular fa-square-minus"></i> 撤销当前全选</button>
                    </div>
                </div>

                <div class="wb-btn-group">
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-clear" style="color: gray;"><i class="fa-solid fa-power-off"></i> 关闭当前所有全局启用</div>
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-save-snap" style="color: var(--SmartThemeQuoteColor);"><i class="fa-solid fa-floppy-disk"></i> 将当前勾选保存为快照</div>
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-batch-toggle" style="color: var(--crimson);"><i class="fa-solid fa-trash-can"></i> 批量删除模式</div>
                </div>

                <div id="wb-batch-actions" style="display: none; background: rgba(220,53,69,0.1); border: 1px dashed var(--crimson); border-radius: 6px; padding: 10px; margin-bottom: 10px; flex-direction: column; gap: 10px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap: wrap; gap: 10px;">
                        <span style="color: var(--crimson); font-weight: bold; font-size: 14px; margin-top: 4px;"><i class="fa-solid fa-triangle-exclamation"></i> 待删除的选中项目：</span>
                        <button class="menu_button interactable wb-nowrap-btn" id="wb-btn-confirm-delete" style="margin: 0; background: var(--crimson); color: white; border: none; font-size: 13px; padding: 6px 14px;"><i class="fa-solid fa-burst"></i> 确认永久删除 (<span id="wb-batch-count">0</span>)</button>
                    </div>
                    <div id="wb-batch-selected-list" style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 80px; padding-right: 5px; overflow-y: auto;">
                        <!-- 动态填充红色小标签 -->
                    </div>
                </div>

                <div class="wb-list-grid scrollableInnerFull" id="wb-container"></div>

                <h3>📸 预设组合快照列表</h3>
                <div class="wb-snapshot-list scrollableInnerFull" id="wb-snapshot-container"></div>
            </div>

            <!-- ================= 第二层：快照编辑视图 ================= -->
            <div id="wb-edit-snap-view" style="display: none; height: 100%; flex-direction: column;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: var(--SmartThemeQuoteColor);">
                    <i class="fa-solid fa-pen-to-square"></i> 编辑预设快照组合
                </div>
                <div class="wb-form-group" style="margin-bottom: 10px;">
                    <label>📝 快照名称</label>
                    <input type="text" id="wb-edit-snap-name" class="wb-input-dt" placeholder="输入快照名称...">
                </div>
                <input type="text" id="wb-edit-snap-search" class="text_pole" placeholder="🔍 检索并勾选需要加入组合的世界书..." style="width: 100%; box-sizing: border-box; margin-bottom: 10px; padding: 8px;">
                <div class="wb-list-grid scrollableInnerFull" id="wb-edit-snap-container" style="max-height: 35vh;"></div>
                <div class="wb-btn-group" style="margin-top: 15px;">
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-edit-save" style="color: var(--okGreen);"><i class="fa-solid fa-check"></i> 保存快照更新</div>
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-edit-cancel" style="color: var(--crimson);"><i class="fa-solid fa-arrow-left"></i> 取消并返回</div>
                </div>
            </div>

            <!-- ================= 第三层：深层微调词条视图 ================= -->
            <div id="wb-entry-view" style="display: none; height: 100%; flex-direction: column;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: var(--SmartThemeQuoteColor);">
                    <i class="fa-solid fa-sliders"></i> 正在编辑书本：<span id="wb-entry-title"></span>
                </div>
                <input type="text" id="wb-entry-search" class="text_pole" placeholder="🔍 检索条目名称或关键字..." style="width: 100%; box-sizing: border-box; margin-bottom: 10px; padding: 8px;">
                <div class="wb-btn-group" style="margin: 0 0 10px 0;">
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-entry-all" style="padding: 6px;"><i class="fa-solid fa-check-double"></i> 启用全部条目</div>
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-entry-none" style="padding: 6px;"><i class="fa-regular fa-square"></i> 关闭全部条目</div>
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-entry-add" style="padding: 6px; color: var(--okGreen);"><i class="fa-solid fa-plus"></i> 新增内容设定</div>
                </div>
                <div class="wb-snapshot-list scrollableInnerFull" id="wb-entry-container" style="display: flex; flex-direction: column; max-height: 38vh;"></div>
                <div class="wb-btn-group" style="margin-top: 15px;">
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-entry-save" style="color: var(--okGreen);"><i class="fa-solid fa-floppy-disk"></i> 确认并覆盖源文件</div>
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-entry-cancel" style="color: gray;"><i class="fa-solid fa-arrow-left"></i> 取消并返回</div>
                </div>
            </div>

            <!-- ================= 第四层：核心词条编辑视图 ================= -->
            <div id="wb-detail-view" style="display: none; height: 100%; flex-direction: column;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: var(--SmartThemeQuoteColor); flex-shrink: 0;">
                    <i class="fa-solid fa-pen-nib"></i> 编辑参数细节：<span id="wb-detail-title"></span>
                </div>
                <div class="scrollableInnerFull" style="display: flex; flex-direction: column; flex: 1; min-height: 55vh; padding-right: 15px;">
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; background: rgba(0,0,0,0.1); border-radius: 6px; padding: 10px; border: 1px solid var(--SmartThemeBorderColor); margin-bottom: 10px; flex-shrink: 0; align-items: flex-end;">
                        <div class="wb-form-group" style="flex: 1; min-width: 130px; margin-bottom: 0;">
                            <label style="margin-bottom: 4px;">📖 标签名称</label>
                            <input type="text" id="wb-det-name" class="wb-input-dt">
                        </div>
                        <div class="wb-form-group" style="flex: 1; min-width: 120px; margin-bottom: 0;">
                            <label style="margin-bottom: 4px;">🚦 触发策略</label>
                            <select id="wb-det-strategy" class="wb-input-dt">
                                <option value="constant">🟦 常驻 (无条件)</option>
                                <option value="selective">🟩 匹配 (关键字)</option>
                            </select>
                        </div>
                        <div class="wb-form-group" style="flex: 2; min-width: 180px; margin-bottom: 0;">
                            <label style="margin-bottom: 4px;">🔑 触发关键字 <small>(逗号分隔)</small></label>
                            <input type="text" id="wb-det-keys" class="wb-input-dt">
                        </div>

                        <div class="wb-form-group" style="flex: 1; min-width: 160px; margin-bottom: 0;">
                            <label style="margin-bottom: 4px;">📍 插入位置</label>
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
                            <label style="margin-bottom: 4px;">🌊 深度</label>
                            <input type="number" id="wb-det-depth" class="wb-input-dt" value="0">
                        </div>
                        <div class="wb-form-group" style="width: 65px; margin-bottom: 0;">
                            <label style="margin-bottom: 4px;">🔢 顺序</label>
                            <input type="number" id="wb-det-order" class="wb-input-dt" value="100">
                        </div>
                    </div>

                    <div class="wb-form-group" style="flex: 1; display: flex; flex-direction: column; margin-bottom: 0;">
                        <label style="font-size: 14px; margin-bottom: 8px;">📜 正文内容</label>
                        <textarea id="wb-det-content" class="wb-input-dt" style="flex: 1; min-height: 250px; font-size: 14px; padding: 12px;"></textarea>
                    </div>
                </div>
                <div class="wb-btn-group" style="margin-top: 15px; flex-shrink: 0;">
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-det-save" style="color: var(--okGreen); font-size: 14px;"><i class="fa-solid fa-check"></i> 暂存修改内容</div>
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-det-cancel" style="color: var(--crimson); font-size: 14px;"><i class="fa-solid fa-xmark"></i> 撤销当前编辑</div>
                </div>
            </div>
        </div>
    `);

    // --- 状态与缓存控制 ---
    let isBatchMode = false;
    let batchSelected = new Set();
    let currentScale = 1.0;
    let currentVisibleWbs = [];

    // UI缩放
    $ui.find('#wb-zoom-in').on('click', function() {
        currentScale = Math.min(2.0, currentScale + 0.1);
        $(this).closest('dialog').css('zoom', currentScale);
        $ui.find('#wb-zoom-val').text(Math.round(currentScale * 100) + '%');
    });
    $ui.find('#wb-zoom-out').on('click', function() {
        currentScale = Math.max(0.5, currentScale - 0.1);
        $(this).closest('dialog').css('zoom', currentScale);
        $ui.find('#wb-zoom-val').text(Math.round(currentScale * 100) + '%');
    });

    // 创建弹窗对象
    const popup = new SillyTavern.Popup($ui, SillyTavern.POPUP_TYPE.TEXT, '', { allowVerticalScrolling: true, okButton: "关闭面板" });
    $(popup.dlg).addClass('wb-manager-dialog');

    // **异步请求与绑定数据扫描**
    const initiateDeepScan = async () => {
        try {
            const wb2Chars = {};
            getWorldbookNames().forEach(wb => wb2Chars[wb] = []);

            const allChars = getCharacterNames() || [];
            const batchSize = 10;
            $('#wb-scan-progress').text(`0 / ${allChars.length}`);

            for (let i = 0; i < allChars.length; i += batchSize) {
                const chunk = allChars.slice(i, i + batchSize);
                await Promise.all(chunk.map(async cName => {
                    try {
                         const charData = await getCharacter(cName);
                         const checkList = new Set();
                         if (charData.worldbook) checkList.add(charData.worldbook);
                         if (charData.extensions && Array.isArray(charData.extensions.worldbooks)) {
                             charData.extensions.worldbooks.forEach(w => checkList.add(w));
                         }
                         checkList.forEach(w => {
                             if (wb2Chars[w] !== undefined && !wb2Chars[w].includes(cName)) wb2Chars[w].push(cName);
                         });
                    } catch(e) {}
                }));
                $('#wb-scan-progress').text(`${Math.min(i + batchSize, allChars.length)} / ${allChars.length}`);
            }
            globalBindingMapCache = wb2Chars;
        } catch (error) {
            console.error("后台扫描数据时发生意外错误：", error);
        } finally {
            $('#wb-loading-overlay').fadeOut();
            renderData();
        }
    };

    // 交互事件流
    $ui.find('#wb-search-input').on('input', function() { renderData(); });
    $ui.find('#wb-filter-unbound').on('change', function() { renderData(); });

    // 全选与取消全选核心逻辑
    $ui.find('#wb-btn-select-all').on('click', async () => {
        if (currentVisibleWbs.length === 0) return;
        if (isBatchMode) {
            currentVisibleWbs.forEach(wb => batchSelected.add(wb));
            renderData();
        } else {
            let currentActive = getGlobalWorldbookNames();
            currentVisibleWbs.forEach(wb => { if(!currentActive.includes(wb)) currentActive.push(wb); });
            await rebindGlobalWorldbooks(currentActive);
            renderData();
        }
    });

    $ui.find('#wb-btn-deselect-all').on('click', async () => {
        if (currentVisibleWbs.length === 0) return;
        if (isBatchMode) {
            currentVisibleWbs.forEach(wb => batchSelected.delete(wb));
            renderData();
        } else {
            let currentActive = getGlobalWorldbookNames();
            currentActive = currentActive.filter(wb => !currentVisibleWbs.includes(wb));
            await rebindGlobalWorldbooks(currentActive);
            renderData();
        }
    });

    // 批量删除模式切换
    $ui.find('#wb-btn-batch-toggle').on('click', function() {
        isBatchMode = !isBatchMode;
        if(isBatchMode) {
            batchSelected.clear();
            $(this).css({background: 'var(--crimson)', color: '#fff'}).html('<i class="fa-solid fa-check"></i> 关闭批量删除模式');
            $ui.find('#wb-batch-actions').css('display', 'flex');
        } else {
            $(this).css({background: '', color: 'var(--crimson)'}).html('<i class="fa-solid fa-trash-can"></i> 批量删除模式');
            $ui.find('#wb-batch-actions').hide();
        }
        renderData();
    });

    // 提交批量删除
    $ui.find('#wb-btn-confirm-delete').on('click', async () => {
        if(batchSelected.size === 0) return toastr.warning("还未勾选任何世界书。");
        const confirm = await SillyTavern.callGenericPopup(`🚨 删除确认 🚨\n确认将这 ${batchSelected.size} 本组世界书完全删除吗？该操作无法恢复。`, SillyTavern.POPUP_TYPE.CONFIRM);
        if (confirm === SillyTavern.POPUP_RESULT.AFFIRMATIVE) {
            toastr.info("正在执行删除操作...");
            for (let wb of batchSelected) {
                await deleteWorldbook(wb);
                delete globalBindingMapCache[wb];
            }
            toastr.success(`已成功删除 ${batchSelected.size} 本世界书。`);
            batchSelected.clear();
            renderData();
        }
    });

    // ===================================
    // 主界面与大列表渲染流
    // ===================================
    const renderData = () => {
        const keyword = $ui.find('#wb-search-input').val().toLowerCase();
        const showUnboundOnly = $ui.find('#wb-filter-unbound').is(':checked');

        const allWbs = getWorldbookNames();
        const activeWbs = getGlobalWorldbookNames();
        const vars = getVariables({ type: 'global' });
        const snapshots = vars.wb_snapshots || {};
        const bindingMap = globalBindingMapCache;

        currentVisibleWbs = [...allWbs].filter(wb => {
            if (keyword && !wb.toLowerCase().includes(keyword)) return false;
            if (showUnboundOnly && bindingMap[wb] && bindingMap[wb].length > 0) return false;
            return true;
        }).sort((a, b) => {
            const aActive = activeWbs.includes(a);
            const bActive = activeWbs.includes(b);
            if (aActive === bActive) return a.localeCompare(b);
            return aActive ? -1 : 1;
        });

        const $wbContainer = $ui.find('#wb-container').empty();

        if (currentVisibleWbs.length === 0) {
            $wbContainer.html('<div style="color: gray; padding: 10px;">没有匹配的搜索结果。</div>');
        } else {
            $ui.find('#wb-batch-count').text(batchSelected.size);
            const $batchList = $ui.find('#wb-batch-selected-list').empty();
            if (batchSelected.size > 0) {
                batchSelected.forEach(wb => {
                    $batchList.append(`<span class="badge-crimson"><i class="fa-solid fa-xmark"></i> ${wb}</span>`);
                });
            } else {
                $batchList.html('<span style="color:gray; font-size:12px;">暂未选中项...</span>');
            }

            currentVisibleWbs.forEach(wb => {
                const bindings = bindingMap[wb] || [];
                const isBound = bindings.length > 0;
                const bindInfo = isBound ? `📌 关联 ${bindings.length} 张卡` : `🔌 游离 (无关联)`;
                const bindColor = isBound ? 'var(--SmartThemeQuoteColor)' : 'gray';

                const $wrapper = $('<div class="wb-item-wrapper"></div>');
                const truncateBind = bindings.slice(0, 10).join('\\n') + (bindings.length > 10 ? '\\n...等' : '');
                const $infoDiv = $(`<div class="wb-item-content" title="所关联的角色卡：\n${isBound ? truncateBind : '无历史绑定'}"></div>`);
                const $headRow = $('<div style="display:flex; align-items:center; gap:6px;"></div>');
                const $nameSpan = $('<span class="wb-name-text"></span>').text(wb);
                const $tagDiv = $(`<span class="wb-bind-tag" style="background: ${bindColor}15; border: 1px solid ${bindColor}; color: ${bindColor};"></span>`).text(bindInfo);

                let $mainCheckbox;
                if(isBatchMode) {
                    $mainCheckbox = $('<input type="checkbox" style="transform: scale(1.2);">').prop('checked', batchSelected.has(wb));
                } else {
                    $mainCheckbox = $('<input type="checkbox" style="transform: scale(1.2);">').prop('checked', activeWbs.includes(wb));
                    if(activeWbs.includes(wb)) $nameSpan.css({'color': 'var(--SmartThemeQuoteColor)', 'font-weight': 'bold'});
                }

                $headRow.append($mainCheckbox).append($nameSpan);
                $infoDiv.append($headRow).append($tagDiv);
                $wrapper.append($infoDiv);

                if(isBatchMode) {
                    $wrapper.css('cursor', 'pointer');
                    $wrapper.on('click', function(e) {
                        e.preventDefault();
                        if(batchSelected.has(wb)) batchSelected.delete(wb);
                        else batchSelected.add(wb);
                        renderData();
                    });
                } else {
                    const $actDiv = $('<div style="display:flex;"></div>');
                    const $delBtn = $('<div class="wb-btn-icon del" title="移除资源"><i class="fa-solid fa-trash"></i></div>');
                    const $renameBtn = $('<div class="wb-btn-icon" title="重命名名称"><i class="fa-solid fa-pen"></i></div>');
                    const $tuneBtn = $('<div class="wb-btn-icon" title="打开词条设置"><i class="fa-solid fa-gears"></i></div>');

                    $mainCheckbox.on('change', async function() {
                        let current = getGlobalWorldbookNames();
                        if ($(this).is(':checked')) current.push(wb); else current = current.filter(n => n !== wb);
                        await rebindGlobalWorldbooks(current);
                        renderData();
                    });

                    $tuneBtn.on('click', () => openEntryTuneView(wb, 'main'));
                    $delBtn.on('click', async () => {
                        const confirm = await SillyTavern.callGenericPopup(`确认删除该项 [${wb}] 吗？`, SillyTavern.POPUP_TYPE.CONFIRM);
                        if (confirm === SillyTavern.POPUP_RESULT.AFFIRMATIVE) {
                            await deleteWorldbook(wb);
                            delete globalBindingMapCache[wb];
                            toastr.success(`已删除。`);
                            renderData();
                        }
                    });

                    $renameBtn.on('click', async () => {
                        if (isBound) {
                            SillyTavern.callGenericPopup(`❌ 无法重命名：\n[${wb}] 已关联至角色卡（如：${bindings.slice(0,3).join(', ')}）。\n\n为防设定失联，存在关联项的世界书不允许直接在此处重命名。`, SillyTavern.POPUP_TYPE.TEXT);
                            return;
                        }
                        const finalNewName = await SillyTavern.callGenericPopup(`设置世界书 [${wb}] 的新名称：`, SillyTavern.POPUP_TYPE.INPUT, wb);
                        if (!finalNewName || typeof finalNewName !== 'string' || finalNewName.trim() === '' || finalNewName.trim() === wb) return;
                        const newNameStr = finalNewName.trim();
                        if (getWorldbookNames().includes(newNameStr)) return toastr.warning("该名称已被占用。");

                        const entries = await getWorldbook(wb);
                        await createWorldbook(newNameStr, entries);
                        await deleteWorldbook(wb);
                        globalBindingMapCache[newNameStr] = []; delete globalBindingMapCache[wb];

                        const globals = getGlobalWorldbookNames();
                        if (globals.includes(wb)) await rebindGlobalWorldbooks(globals.map(w => w === wb ? newNameStr : w));
                        toastr.success(`世界书已重命名为 [${newNameStr}]。`);
                        renderData();
                    });

                    $wrapper.append($actDiv.append($delBtn).append($renameBtn).append($tuneBtn));
                }
                $wbContainer.append($wrapper);
            });
        }

        // 快照框渲染
        const $snapContainer = $ui.find('#wb-snapshot-container').empty();
        Object.keys(snapshots).forEach((name) => {
            const snapWbs = snapshots[name] || [];
            const $item = $('<div class="wb-snapshot-item"></div>');
            const $info = $(`<div style="flex:1;"><div style="font-weight:bold;font-size:14.5px;"><i class="fa-solid fa-bookmark" style="color:var(--SmartThemeQuoteColor);"></i> ${name}</div><div style="font-size:12px;color:gray;">预存了 ${snapWbs.length} 项设定</div></div>`);
            const $act = $('<div style="display:flex; gap:8px;"></div>');

            const $btnApply = $('<button class="menu_button interactable wb-nowrap-btn" style="background:var(--okGreen); margin:0;" title="覆盖激活全局项">应用该组合</button>').on('click', async () => {
                await rebindGlobalWorldbooks(snapWbs);
                toastr.success("组合应用成功。");
                renderData();
            });
            const $btnEdit = $('<button class="menu_button interactable wb-nowrap-btn" style="color:var(--SmartThemeQuoteColor); margin:0;" title="调整包含项"><i class="fa fa-pen-to-square"></i></button>').on('click', () => {
                openEditSnapView(name, snapWbs);
            });
            const $btnDel = $('<button class="menu_button interactable wb-nowrap-btn" style="color:var(--crimson); margin:0;" title="删除组合"><i class="fa fa-trash"></i></button>').on('click', async () => {
                const cd = await SillyTavern.callGenericPopup(`确认删除备份组合 [${name}] 吗？`, SillyTavern.POPUP_TYPE.CONFIRM);
                if (cd === SillyTavern.POPUP_RESULT.AFFIRMATIVE) {
                    updateVariablesWith(v => { delete v.wb_snapshots[name]; return v; }, { type: 'global' });
                    renderData();
                }
            });
            $item.append($info).append($act.append($btnApply).append($btnEdit).append($btnDel));
            $snapContainer.append($item);
        });
    };

    // 一键关闭全局启用
    $ui.find('#wb-btn-clear').on('click', async () => { await rebindGlobalWorldbooks([]); toastr.success('已清空全部挂载。'); renderData(); });

    // 【修改】带有同名检测的快照保存功能
    $ui.find('#wb-btn-save-snap').on('click', async () => {
        let name = await SillyTavern.callGenericPopup("创建新预设组合名称：", SillyTavern.POPUP_TYPE.INPUT, "新备份组合");
        if (!name || typeof name !== 'string' || name.trim() === '') return;
        name = name.trim();

        let vars = getVariables({ type: 'global' });
        let snapshots = vars.wb_snapshots || {};

        if (snapshots[name]) {
            const confirm = await SillyTavern.callGenericPopup(`⚠️ 注意 ⚠️\n组合快照 [${name}] 已存在，是否强制覆盖？`, SillyTavern.POPUP_TYPE.CONFIRM);
            if (confirm !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
        }

        updateVariablesWith(v => {
            if (!v.wb_snapshots) v.wb_snapshots = {};
            v.wb_snapshots[name] = getGlobalWorldbookNames();
            return v;
        }, { type: 'global' });

        toastr.success("创建/覆盖完毕。");
        renderData();
    });

    // ===================================
    // 快照全功能编辑逻辑
    // ===================================
    let snapOldName = "";
    let snapTempList = [];
    const openEditSnapView = (name, list) => {
        snapOldName = name;
        snapTempList = [...list];
        $ui.find('#wb-edit-title').text(name);
        $ui.find('#wb-edit-snap-name').val(name);

        const internalRender = () => {
            const kw = $ui.find('#wb-edit-snap-search').val().toLowerCase();
            const $c = $ui.find('#wb-edit-snap-container').empty();
            const sorted = [...getWorldbookNames()].sort((a,b) => {
                const ac = snapTempList.includes(a); const bc = snapTempList.includes(b);
                if(ac === bc) return a.localeCompare(b); return ac ? -1 : 1;
            });
            sorted.forEach(w => {
                if (kw && !w.toLowerCase().includes(kw)) return;
                const isChk = snapTempList.includes(w);
                const $w = $(`<div class="wb-item-wrapper"><label class="wb-item-content"><div style="display:flex;align-items:center;gap:6px;"><input type="checkbox" style="transform:scale(1.2);" ${isChk?'checked':''}><span class="wb-name-text" style="font-weight:${isChk?'bold':'normal'}; color:${isChk?'var(--SmartThemeQuoteColor)':'inherit'}">${w}</span></div></label></div>`);
                $w.find('input').on('change', function() {
                    const chked = $(this).is(':checked');
                    if(chked && !snapTempList.includes(w)) snapTempList.push(w);
                    if(!chked) snapTempList = snapTempList.filter(n => n!==w);
                    $w.find('.wb-name-text').css({'font-weight': chked?'bold':'normal', 'color': chked?'var(--SmartThemeQuoteColor)':'inherit'});
                });
                $c.append($w);
            });
        };
        $ui.find('#wb-edit-snap-search').off('input').on('input', internalRender);
        internalRender();

        $ui.find('#wb-main-view').hide(); $ui.find('#wb-edit-snap-view').fadeIn(200);
    };

    // 【修改】带有同名检测的快照更新保存功能
    $ui.find('#wb-btn-edit-save').on('click', async () => {
        const nName = $ui.find('#wb-edit-snap-name').val().trim();
        if(!nName) return toastr.warning("名称不得为空。");

        let vars = getVariables({ type: 'global' });
        let snapshots = vars.wb_snapshots || {};

        if (nName !== snapOldName && snapshots[nName]) {
            const confirm = await SillyTavern.callGenericPopup(`⚠️ 注意 ⚠️\n组合快照 [${nName}] 已经存在了！如果继续保存，将替换掉原有的 [${nName}]，并且删除 [${snapOldName}]。确定要覆盖吗？`, SillyTavern.POPUP_TYPE.CONFIRM);
            if (confirm !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
        }

        updateVariablesWith(v => {
            if (!v.wb_snapshots) v.wb_snapshots = {};
            if (nName !== snapOldName) delete v.wb_snapshots[snapOldName];
            v.wb_snapshots[nName] = snapTempList;
            return v;
        }, { type: 'global' });

        toastr.success("修改已保存。");
        $ui.find('#wb-edit-snap-view').hide(); $ui.find('#wb-main-view').fadeIn(200); renderData();
    });

    $ui.find('#wb-btn-edit-cancel').on('click', () => { $ui.find('#wb-edit-snap-view').hide(); $ui.find('#wb-main-view').fadeIn(200); });

    // ===================================
    // 法典核心（词条）微调逻辑
    // ===================================
    let tuneWbName = "";
    let tuneEntries = [];

    const openEntryTuneView = async (wbName) => {
        tuneWbName = wbName;
        $ui.find('#wb-entry-title').text(wbName);
        tuneEntries = JSON.parse(JSON.stringify(await getWorldbook(wbName)));

        const renderEntryList = () => {
            const keyword = $ui.find('#wb-entry-search').val().toLowerCase();
            const $container = $ui.find('#wb-entry-container').empty();

            tuneEntries.forEach((entry, index) => {
                const searchStr = `${entry.name||''} ${(entry.strategy?.keys||[]).join(',')}`.toLowerCase();
                if (keyword && !searchStr.includes(keyword)) return;

                const strategy = entry.strategy || { type: 'constant', keys: [] };
                const isBlue = strategy.type !== 'selective';
                const strategyBadge = isBlue ? '<span class="badge-blue">常驻灯 (蓝)</span>' : '<span class="badge-green">匹配灯 (绿)</span>';
                const keysInfo = isBlue ? `<span style="color:gray;">[无前置触发条件]</span>` : `🔑 ${(strategy.keys||[]).join(', ')||'<span style="color:var(--crimson)">未设置关键字</span>'}`;

                const $item = $(`<div class="wb-snapshot-item" style="border-left: 4px solid ${entry.enabled ? 'var(--okGreen)' : 'gray'};"></div>`);
                const $left = $('<div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;"></div>');
                const $chk = $(`<input type="checkbox" style="transform: scale(1.2);">`).prop('checked', entry.enabled).on('change', function() {
                    entry.enabled = $(this).is(':checked'); renderEntryList();
                });

                const $info = $(`<div><div style="font-weight:bold; margin-bottom: 4px;">${entry.name || '未定义模块'}</div><div style="font-size:12px;color:gray;display:flex;align-items:center;">${strategyBadge} ${keysInfo}</div></div>`);

                const $right = $('<div style="display:flex; gap:8px;"></div>');
                const $editBtn = $('<button class="menu_button interactable wb-nowrap-btn" style="color:var(--SmartThemeQuoteColor); margin:0;" title="修改"><i class="fa fa-pen-nib"></i></button>').on('click', () => openDetailEditView(index));
                const $delBtn = $('<button class="menu_button interactable wb-nowrap-btn" style="color:var(--crimson); margin:0;" title="删除"><i class="fa fa-trash"></i></button>').on('click', async () => {
                    const confirmDel = await SillyTavern.callGenericPopup(`确认删除该条目？`, SillyTavern.POPUP_TYPE.CONFIRM);
                    if (confirmDel === SillyTavern.POPUP_RESULT.AFFIRMATIVE) { tuneEntries.splice(index, 1); renderEntryList(); }
                });

                $item.append($left.append($chk).append($info)).append($right.append($editBtn).append($delBtn));
                $container.append($item);
            });

            if (tuneEntries.length === 0) $container.html('<div style="color: gray; padding: 10px;">暂无相关配置。</div>');
        };

        $ui.find('#wb-entry-search').off('input').on('input', renderEntryList);
        $ui.find('#wb-btn-entry-all').off('click').on('click', () => { tuneEntries.forEach(e => e.enabled = true); renderEntryList(); });
        $ui.find('#wb-btn-entry-none').off('click').on('click', () => { tuneEntries.forEach(e => e.enabled = false); renderEntryList(); });
        $ui.find('#wb-btn-entry-add').off('click').on('click', () => {
            tuneEntries.push({
                uid: Date.now(), name: "新增默认条目", enabled: true, content: "",
                strategy: { type: 'constant', keys: [] },
                position: { type: 'at_depth', role: 'system', depth: 0, order: 100 }
            });
            renderEntryList(); openDetailEditView(tuneEntries.length - 1);
        });

        $ui.find('#wb-main-view, #wb-detail-view').hide();
        $ui.find('#wb-entry-search').val(''); renderEntryList();
        $ui.find('#wb-entry-view').fadeIn(200);
    };

    $ui.find('#wb-btn-entry-save').on('click', async () => {
        await replaceWorldbook(tuneWbName, tuneEntries);
        toastr.success(`数据写入完成。`);
        $ui.find('#wb-entry-view').hide(); $ui.find('#wb-main-view').fadeIn(200); renderData();
    });
    $ui.find('#wb-btn-entry-cancel').on('click', () => { $ui.find('#wb-entry-view').hide(); $ui.find('#wb-main-view').fadeIn(200); });

    // ===================================
    // 最底层详细编辑 UI
    // ===================================
    let tuneDetailIndex = -1;
    $ui.find('#wb-det-position').on('change', function() { $ui.find('#wb-det-depth-container').toggle($(this).val().startsWith('at_depth_')); });

    const openDetailEditView = (index) => {
        tuneDetailIndex = index;
        const e = tuneEntries[index];
        $ui.find('#wb-detail-title').text(e.name || '空参数');
        $ui.find('#wb-det-name').val(e.name || '');
        $ui.find('#wb-det-content').val(e.content || '');
        $ui.find('#wb-det-keys').val((e.strategy?.keys||[]).join(', '));
        $ui.find('#wb-det-strategy').val(e.strategy?.type || 'constant');

        let p = e.position?.type || 'at_depth';
        if (p === 'at_depth' || p === 'outlet') p = `at_depth_${e.position?.role || 'system'}`;
        $ui.find('#wb-det-position').val(p).trigger('change');
        $ui.find('#wb-det-depth').val(e.position?.depth || 0); $ui.find('#wb-det-order').val(e.position?.order || 100);

        $ui.find('#wb-entry-view').hide(); $ui.find('#wb-detail-view').fadeIn(200);
    };

    $ui.find('#wb-btn-det-save').on('click', () => {
        const e = tuneEntries[tuneDetailIndex];
        e.name = $ui.find('#wb-det-name').val(); e.content = $ui.find('#wb-det-content').val();
        e.strategy = { type: $ui.find('#wb-det-strategy').val(), keys: $ui.find('#wb-det-keys').val().split(',').map(s=>s.trim()).filter(Boolean) };
        const pos = $ui.find('#wb-det-position').val();
        if (pos.startsWith('at_depth_')) e.position = { type: 'at_depth', role: pos.replace('at_depth_',''), depth: parseInt($ui.find('#wb-det-depth').val())||0, order: parseInt($ui.find('#wb-det-order').val())||100 };
        else e.position = { type: pos, order: parseInt($ui.find('#wb-det-order').val())||100 };

        $ui.find('#wb-detail-view').hide(); $ui.find('#wb-entry-view').fadeIn(200);
        $ui.find('#wb-entry-search').trigger('input');
    });
    $ui.find('#wb-btn-det-cancel').on('click', () => { $ui.find('#wb-detail-view').hide(); $ui.find('#wb-entry-view').fadeIn(200); });

    // 让后台扫描起飞！并立即展示终端
    initiateDeepScan();
    await popup.show();
});
