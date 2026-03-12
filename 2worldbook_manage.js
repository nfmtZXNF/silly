// 1. 清理旧脚本按钮和入口
try { replaceScriptButtons([]); } catch (e) {}
$("#option_lulu_wb_manager").remove();

// 2. 锚定原生选项菜单底部
const $targetHr = $(".options-content").find("hr").last();
const $menuBtn = $("<a>", { id: "option_lulu_wb_manager", class: "interactable", tabindex: 0 })
    .append($("<i>", { class: "fa-lg fa-solid fa-book-atlas", css: { paddingRight: '12px' } }))
    .append($("<span>").text("全局世界书管理"));

$menuBtn.insertBefore($targetHr);

// 全局缓存的绑定状态数据：已升级为存储包含 name 和 avatar 的对象架构，支持同名角色
let globalBindingMapCache = {};

// 4. 面板核心控制逻辑
$menuBtn.on('click', async () => {
    $("#options").hide();

    const customCSS = `
        <style>
            /* 核心：优化PC端宽度，使其更宽敞 */
            dialog.wb-manager-dialog { width: 92vw !important; max-width: 1600px !important; transition: zoom 0.2s ease-out; overflow: hidden; font-family: sans-serif; }
            #wb-manager-panel h3 { font-size: 15px; margin: 10px 0 8px 0; border-bottom: 2px solid var(--SmartThemeBorderColor); padding-bottom: 5px; color: var(--SmartThemeQuoteColor); }

            .wb-list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; align-content: start; max-height: 55vh; overflow-y: auto; background: var(--SmartThemeBlurTintColor); border-radius: 8px; border: 1px solid var(--SmartThemeBorderColor); padding: 10px; position: relative; }
            .wb-snapshot-list { display: flex; flex-direction: column; gap: 8px; max-height: 35vh; overflow-y: auto; background: var(--SmartThemeBlurTintColor); border-radius: 8px; border: 1px solid var(--SmartThemeBorderColor); padding: 10px; }

            /* 卡片布局优化 */
            .wb-item-wrapper { display: flex; flex-direction: column; background: var(--SmartThemeBotMesColor); border-radius: 6px; border: 1px solid var(--SmartThemeBorderColor); transition: 0.2s; overflow: hidden; padding: 8px 10px; gap: 6px; }
            .wb-item-wrapper:hover { border-color: var(--SmartThemeQuoteColor); box-shadow: 0 4px 8px rgba(0,0,0,0.1); transform: translateY(-1px); z-index: 10; }
            .wb-item-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
            .wb-item-title-area { display: flex; align-items: flex-start; gap: 8px; flex: 1; min-width: 0; }
            .wb-name-text { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; color: var(--SmartThemeBodyColor); }

            /* 新增：创建后高亮动效 */
            @keyframes wb-highlight-flash { 0%, 100% { background-color: var(--SmartThemeBotMesColor); } 50% { background-color: var(--SmartThemeQuoteColor); } }
            .wb-highlight { animation: wb-highlight-flash 1s ease-in-out; }

            /* 小图标按钮 */
            .wb-item-actions { display: flex; gap: 5px; flex-shrink: 0; }
            .wb-icon-btn { width: 26px; height: 26px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid var(--SmartThemeBorderColor); background: var(--SmartThemeBlurTintColor); color: var(--SmartThemeBodyColor); transition: 0.2s; font-size: 12px; }
            .wb-icon-btn:hover { background: var(--SmartThemeQuoteColor); color: #fff; border-color: var(--SmartThemeQuoteColor); }
            .wb-icon-btn.hover-red:hover { background: #ff6b6b; color: #fff; border-color: #ff6b6b; }

            /* 标签交互 */
            .wb-bind-tag { font-size: 11px; border-radius: 4px; padding: 3px 6px; display: inline-block; width: fit-content; font-weight: bold; cursor: pointer; transition: 0.2s; }
            .wb-bind-tag:hover { filter: brightness(1.2); text-decoration: underline; }

            /* 操作按钮组 */
            .wb-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
            .wb-controls-group { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; flex-shrink: 0; justify-content: flex-end;}

            .wb-btn-group { display: flex; gap: 10px; margin: 10px 0; flex-wrap: wrap; }
            /* 优化后的按钮基础样式：Outline 风格，去油腻 */
            .wb-action-btn {
                flex: 1; min-width: 140px; display: flex; align-items: center; justify-content: center; gap: 6px;
                cursor: pointer; padding: 10px; border-radius: 6px;
                background: transparent; color: var(--SmartThemeBodyColor);
                border: 1px solid var(--SmartThemeBorderColor);
                transition: 0.2s; font-weight: bold; font-size: 13px;
                box-sizing: border-box; text-align: center; white-space: nowrap; word-break: keep-all;
            }
            .wb-action-btn:hover { background: var(--SmartThemeBlurTintColor); box-shadow: 0 2px 5px rgba(0,0,0,0.1); }

            /* 强制文字不换行保护 */
            .wb-nowrap-btn { white-space: nowrap !important; flex-shrink: 0 !important; word-break: keep-all !important; display: inline-flex; align-items: center; justify-content: center; gap: 5px; }

            /* UI细节点：更优雅的颜色类，适配各种深浅色主题 */
            .btn-primary {
                color: var(--SmartThemeQuoteColor) !important;
                border-color: var(--SmartThemeQuoteColor) !important;
                background: rgba(125, 125, 125, 0.05) !important;
            }
            .btn-primary:hover {
                background: var(--SmartThemeQuoteColor) !important;
                color: #fff !important;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }

            .btn-success {
                color: #51cf66 !important;
                border-color: #51cf66 !important;
                background: rgba(81, 207, 102, 0.05) !important;
            }
            .btn-success:hover {
                background: #51cf66 !important;
                color: #fff !important;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }

            .btn-danger {
                color: #ff6b6b !important;
                border-color: #ff6b6b !important;
                background: rgba(255, 107, 107, 0.05) !important;
            }
            .btn-danger:hover {
                background: #ff6b6b !important;
                color: #fff !important;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }

            .btn-warning {
                color: #fcc419 !important;
                border-color: #fcc419 !important;
                background: rgba(252, 196, 25, 0.05) !important;
            }
             .btn-warning:hover {
                background: #fcc419 !important;
                color: #212529 !important;
            }

            /* 复合快照UI专用 */
            #dsnap-wb-list { flex: 0 0 250px; overflow-y: auto; border-right: 2px solid var(--SmartThemeBorderColor); padding-right: 10px; }
            #dsnap-entry-list { flex: 1; overflow-y: auto; padding-left: 10px; }
            .dsnap-wb-item { padding: 8px; border-radius: 4px; cursor: pointer; border: 1px solid transparent; transition: 0.1s; }
            .dsnap-wb-item.active {
                background: var(--SmartThemeQuoteColor);
                color: #fff;
                font-weight: bold;
                border-color: var(--SmartThemeQuoteColor);
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            /* 激活项里的数字计数反色显示 */
            .dsnap-wb-item.active b { color: #fff !important; }

            .dsnap-wb-item:not(.active):hover { background: var(--SmartThemeBlurTintColor); }
            .dsnap-entry-item { display: flex; align-items: center; gap: 10px; padding: 6px; border-radius: 4px; transition:0.1s;}
            .dsnap-entry-item:hover { background: var(--SmartThemeBotMesColor); }

            /* 输入框样式 */
            .wb-input-dt { width: 100%; box-sizing: border-box; padding: 8px; border-radius: 4px; border: 1px solid var(--SmartThemeBorderColor); background: var(--SmartThemeBlurTintColor); color: var(--SmartThemeBodyColor); transition: 0.2s; font-family: inherit;}
            .wb-input-dt:focus { border-color: var(--SmartThemeQuoteColor); outline: none; }
            .wb-form-group { display: flex; flex-direction: column; margin-bottom: 10px;}

            /* 徽章样式 */
            .badge-blue { background: rgba(51, 154, 240, 0.15); color: #339af0; border: 1px solid #339af0; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 6px; }
            .badge-green { background: rgba(81, 207, 102, 0.15); color: #51cf66; border: 1px solid #51cf66; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 6px; }

            /* 响应式媒体查询 */
            @media (max-width: 768px) {
                .wb-btn-group { flex-direction: column; }
                .wb-action-btn { width: 100%; flex: 1 1 100%; justify-content: center; }
                .wb-list-grid { grid-template-columns: 1fr; }
                .wb-toolbar { flex-direction: column; align-items: stretch; }
                .wb-controls-group { justify-content: flex-start; }
                #wb-detail-view .scrollableInnerFull > div:first-child { flex-direction: column; align-items: stretch; }
                #wb-detail-view .scrollableInnerFull > div:first-child > .wb-form-group { width: 100% !important; }
                #dsnap-container { flex-direction: column; }
                #dsnap-wb-list-wrapper { border-right: none; border-bottom: 2px solid var(--SmartThemeBorderColor); padding-right: 0; padding-bottom: 10px; margin-bottom: 10px; flex: 0 0 auto; max-height: 25vh;}
                #dsnap-entry-list { padding-left: 0; }
                .wb-name-text { white-space: normal; overflow: visible; text-overflow: initial; word-break: break-word; line-height: 1.4; }

                /* 移动端把复合快照顶部的按钮组调整好顺序 */
                #wb-detailed-snap-view .wb-btn-group { order: -1; margin-bottom: 10px; }
            }
        </style>
    `;

    const $ui = $(`
        <div id="wb-manager-panel" style="text-align: left; padding: 5px; position: relative; min-height: 450px;">
            ${customCSS}

            <!-- 全局遮罩 -->
            <div id="wb-loading-overlay" style="position: absolute; top:0; left:0; width:100%; height:100%; background: var(--SmartThemeBlurTintColor); z-index: 1000; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 8px; text-align: center; font-family: sans-serif;">
                <i class="fa-solid fa-spinner fa-spin fa-3x" style="color: var(--SmartThemeQuoteColor); margin-bottom: 20px;"></i>
                <h3 id="wb-loading-text" style="color: var(--SmartThemeQuoteColor); margin:0;">正在深入检索读取...</h3>
                <div id="wb-loading-sub" style="font-weight: bold; font-size: 16px; margin-top: 15px;"></div>
                <div id="wb-loading-secondary-text" style="font-size: 13px; color: gray; margin-top: 10px;">检索耗时取决于懒加载卡片数量，请稍候</div>
            </div>

            <!-- 顶部标题与缩放 -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--SmartThemeBorderColor); margin-bottom: 12px; padding-bottom: 8px; flex-wrap: wrap; gap: 10px;">
                <h2 style="margin: 0; font-size: 18px; color: var(--SmartThemeQuoteColor); font-weight: bold; white-space: nowrap;"><i class="fa-solid fa-book-journal-whills"></i> 世界书管理面板</h2>
                <div style="display: flex; gap: 5px; align-items: center; background: var(--SmartThemeBlurTintColor); padding: 3px; border-radius: 6px; border: 1px solid var(--SmartThemeBorderColor); flex-shrink: 0;">
                    <button id="wb-zoom-out" class="menu_button interactable" style="margin:0; padding: 4px 10px; min-width: unset;" title="缩小"><i class="fa-solid fa-minus"></i></button>
                    <span id="wb-zoom-val" style="font-size: 13.5px; font-weight: bold; min-width: 50px; text-align: center;">100%</span>
                    <button id="wb-zoom-in" class="menu_button interactable" style="margin:0; padding: 4px 10px; min-width: unset;" title="放大"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>

            <!-- ================= 主视图 ================= -->
            <div id="wb-main-view">
                <input type="text" id="wb-search-input" class="text_pole" placeholder="🔍 输入想要查找的世界书名称，或者已经绑定的角色卡名称..." style="width: 100%; box-sizing: border-box; margin-bottom: 10px; padding: 8px; font-size: 14px;">

                <div class="wb-toolbar">
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
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
                        <button id="wb-btn-create-wb" class="menu_button interactable btn-success wb-nowrap-btn" style="margin: 0; padding: 6px 12px; font-size: 12px; border:none;"><i class="fa-solid fa-plus"></i> 新建世界书</button>
                    </div>
                </div>

                <div class="wb-btn-group">
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-clear" style="color: #888;"><i class="fa-solid fa-power-off"></i> 关闭当前所有全局启用</div>
                    <div class="wb-action-btn wb-nowrap-btn btn-primary" id="wb-btn-save-snap"><i class="fa-solid fa-box-archive"></i> 将当前勾选存为快照</div>
                    <div class="wb-action-btn wb-nowrap-btn btn-primary" id="wb-btn-create-detail-snap"><i class="fa-solid fa-puzzle-piece"></i> 创建复合快照</div>
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

            <!-- ================= 快照编辑视图 ================= -->
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

            <!-- ================= 复合快照编辑视图 ================= -->
            <div id="wb-detailed-snap-view" style="display: none; height: 100%; flex-direction: column;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: var(--SmartThemeQuoteColor);">
                    <i class="fa-solid fa-puzzle-piece"></i> 编辑复合快照
                </div>
                <div class="wb-form-group">
                    <label style="font-size: 13px; font-weight: bold; display:block; margin-bottom:4px;">🧩 快照名称</label>
                    <input type="text" id="dsnap-name" class="wb-input-dt" placeholder="例如：战斗场景A，日常场景B...">
                </div>
                <!-- 已将按钮组移动到顶部，方便操作 -->
                <div class="wb-btn-group" style="margin: 0 0 10px 0;">
                    <div class="wb-action-btn wb-nowrap-btn btn-success" id="dsnap-save" style="border:none; flex:unset; min-width: 180px;"><i class="fa-solid fa-check"></i> 保存该复合场景</div>
                    <div class="wb-action-btn wb-nowrap-btn" id="dsnap-cancel" style="color:#888; flex:unset; min-width: 100px;"><i class="fa-solid fa-arrow-left"></i> 返回</div>
                </div>

                <div id="dsnap-container" style="display: flex; flex: 1; min-height: 0; border: 1px solid var(--SmartThemeBorderColor); border-radius: 6px; padding: 10px; background: var(--SmartThemeBotMesColor);">
                    <div id="dsnap-wb-list-wrapper" style="flex: 0 0 250px; display: flex; flex-direction: column; border-right: 2px solid var(--SmartThemeBorderColor); padding-right: 10px;">
                        <input type="text" id="dsnap-wb-search" class="text_pole" placeholder="🔍 搜索世界书..." style="width: 100%; box-sizing: border-box; margin-bottom: 6px; padding: 6px; flex-shrink: 0;">
                        <!-- 新增：仅显示未绑定筛选 -->
                        <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 12px; margin-bottom: 8px; flex-shrink:0;">
                            <input type="checkbox" id="dsnap-filter-unbound" style="accent-color: var(--SmartThemeQuoteColor);">
                            <span style="font-weight: bold; color: gray;">仅显示未绑定卡片的世界书</span>
                        </label>
                        <div id="dsnap-wb-list" class="scrollableInnerFull" style="flex: 1; min-height: 0;"></div>
                    </div>
                    <div id="dsnap-entry-list" class="scrollableInnerFull" style="padding-left: 10px;"></div>
                </div>
            </div>

            <!-- ================= 只读模式：角色卡绑定单视图 ================= -->
            <div id="wb-bind-view" style="display: none; height: 100%; flex-direction: column;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: var(--SmartThemeQuoteColor);">
                    <i class="fa-solid fa-list-ol"></i> 查看 [<span id="wb-bind-title"></span>] 已绑定的角色卡 (只读名单)
                </div>
                <input type="text" id="wb-bind-search" class="text_pole" placeholder="🔍 搜索已绑定的角色卡名称..." style="width: 100%; box-sizing: border-box; margin-bottom: 10px; padding: 8px;">
                <div class="wb-snapshot-list scrollableInnerFull" id="wb-bind-container" style="max-height: 45vh; padding: 5px;"></div>
                <div class="wb-btn-group" style="margin-top: auto;">
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-bind-cancel" style="color:#888;"><i class="fa-solid fa-arrow-left"></i> 返回上一页</div>
                </div>
            </div>

            <!-- ================= V1.0 原版词条列表视图 ================== -->
            <div id="wb-entry-view" style="display: none; height: 100%; flex-direction: column;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: var(--SmartThemeQuoteColor);">
                    <i class="fa-solid fa-sliders"></i> 编辑内容条目：<span id="wb-entry-title"></span>
                </div>
                <input type="text" id="wb-entry-search" class="text_pole" placeholder="🔍 检索条目标题或触发关键字..." style="width: 100%; box-sizing: border-box; margin-bottom: 10px; padding: 8px;">
                <div class="wb-btn-group" style="margin: 0 0 10px 0;">
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-entry-all" style="padding: 6px;"><i class="fa-solid fa-check-double"></i> 启用全部</div>
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-entry-none" style="padding: 6px;"><i class="fa-regular fa-square"></i> 关闭全部</div>
                    <div class="wb-action-btn wb-nowrap-btn btn-success" id="wb-btn-entry-add" style="padding: 6px; border:none;"><i class="fa-solid fa-plus"></i> 新建条目</div>
                </div>
                <div class="wb-snapshot-list scrollableInnerFull" id="wb-entry-container" style="display: flex; flex-direction: column; max-height: 38vh;"></div>
                <div class="wb-btn-group" style="margin-top: 15px;">
                    <div class="wb-action-btn wb-nowrap-btn btn-success" id="wb-btn-entry-save" style="border:none;"><i class="fa-solid fa-floppy-disk"></i> 确认并覆盖源文件</div>
                    <div class="wb-action-btn wb-nowrap-btn" id="wb-btn-entry-cancel" style="color:#888;"><i class="fa-solid fa-arrow-left"></i> 放弃更改并返回</div>
                </div>
            </div>

             <!-- ================= V1.0 原版参数细节视图 ================= -->
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

        try {
            await asyncFunction();
        } catch (error) {
            console.error(`处理 [${message}] 时发生错误:`, error);
            toastr.error(`操作失败: ${error.message}`);
        } finally {
            $overlay.fadeOut('slow');
        }
    };

    const initiateDeepScan = async () => {
        const $overlay = $ui.find('#wb-loading-overlay');
        const $sub = $ui.find('#wb-loading-sub');
        $ui.find('#wb-loading-text').text("正在深入检索读取...");
        $sub.show(); $ui.find('#wb-loading-secondary-text').show();
        $overlay.show();

        try {
            const wb2Chars = {};
            // 安全获取所有世界书名称
            (typeof getWorldbookNames === 'function' ? getWorldbookNames() : []).forEach(wb => wb2Chars[wb] = []);

            // 取出酒馆当前挂载的所有角色
            const allCharsData = window.characters || (typeof SillyTavern !== 'undefined' ? SillyTavern.characters : []) || [];
            const totalChars = allCharsData.length;
            $sub.text(`0 / ${totalChars}`);

            const charMap = new Map();

            const batchSize = 10;
            for (let i = 0; i < totalChars; i += batchSize) {
                const chunk = allCharsData.slice(i, i + batchSize);
                await Promise.all(chunk.map(async (charItem) => {
                    try {
                        const avatar = charItem.avatar;
                        if (!avatar) return;

                        let charData = charItem;

                        if (charItem.shallow) {
                            try {
                                charData = await $.ajax({
                                    url: '/api/characters/get',
                                    type: 'POST',
                                    contentType: 'application/json',
                                    data: JSON.stringify({ avatar_url: avatar })
                                });
                            } catch (apiErr) {
                                console.warn(`无法深层拉取角色 [${avatar}]，将使用浅层数据继续...`, apiErr);
                            }
                        }

                        const charName = charData.name || charItem.name || '未知名称';
                        const checkList = new Set();
                        const dataFields = charData.data || charData;

                        // 精准捞取该卡片上的【主世界书】
                        if (dataFields.extensions?.world) checkList.add(dataFields.extensions.world);
                        if (dataFields.world) checkList.add(dataFields.world);
                        if (dataFields.world_info) checkList.add(dataFields.world_info);
                        if (dataFields.lorebook) checkList.add(dataFields.lorebook);
                        if (typeof dataFields.character_book === 'string') checkList.add(dataFields.character_book);
                        if (dataFields.worldbook) checkList.add(dataFields.worldbook);
                        if (Array.isArray(dataFields.extensions?.worldbooks)) {
                            dataFields.extensions.worldbooks.forEach(w => checkList.add(w));
                        }

                        // 将找出来的主世界书与它真正的主人（精确到 avatar）登记造册
                        checkList.forEach(wbName => {
                            if (wbName && typeof wbName === 'string') {
                                if (!wb2Chars[wbName]) wb2Chars[wbName] = [];
                                if (!wb2Chars[wbName].some(c => c.avatar === avatar)) {
                                    wb2Chars[wbName].push({ name: charName, avatar: avatar });
                                }
                            }
                        });

                        // 登记给下一步查找【附加世界书】作对照
                        const safeCharObj = { name: charName, avatar: avatar };
                        charMap.set(avatar, safeCharObj);
                        // 兼容各种图包后缀的模糊匹配
                        const avatarBase = avatar.replace(/\.(png|webp|jpeg)$/i, '');
                        if (avatar !== avatarBase) charMap.set(avatarBase, safeCharObj);

                    } catch (e) {
                        console.error(`处理角色 [${charItem.name}] 发生小错误:`, e);
                    }
                }));
                $sub.text(`${Math.min(i + batchSize, totalChars)} / ${totalChars}`);
            }

            try {
                let charLoreArray = [];
                const ctx = typeof getContext === 'function' ? getContext() : {};
                if (ctx.chatWorldInfoSettings && Array.isArray(ctx.chatWorldInfoSettings.charLore)) {
                    charLoreArray = ctx.chatWorldInfoSettings.charLore;
                } else if (window.chatWorldInfoSettings && Array.isArray(window.chatWorldInfoSettings.charLore)) {
                    charLoreArray = window.chatWorldInfoSettings.charLore;
                }

                if (charLoreArray.length > 0) {
                    charLoreArray.forEach(charLoreEntry => {
                        const charFilename = charLoreEntry.name;
                        if (!charFilename) return;

                        const filenameBase = charFilename.replace(/\.(png|webp|jpeg)$/i, '');
                        const mappedChar = charMap.get(charFilename) || charMap.get(filenameBase);

                        if (mappedChar && Array.isArray(charLoreEntry.extraBooks)) {
                            charLoreEntry.extraBooks.forEach(wbName => {
                                if (wbName && typeof wbName === 'string') {
                                    if (!wb2Chars[wbName]) wb2Chars[wbName] = [];
                                    if (!wb2Chars[wbName].some(c => c.avatar === mappedChar.avatar)) {
                                        wb2Chars[wbName].push({ name: mappedChar.name, avatar: mappedChar.avatar });
                                    }
                                }
                            });
                        }
                    });
                }
            } catch (e) {
                console.error("安全提取附加世界书失败，略过此步骤：", e);
            }

            globalBindingMapCache = wb2Chars;
            console.log("【全局世界书管理】映射大成功！对应完整！", globalBindingMapCache);

        } catch (error) {
            console.error("遇到了出乎意料的状况呢：", error);
            if (typeof toastr !== 'undefined') toastr.error("读取操作中断了，请查看控制台的提示。");
        } finally {
            $overlay.fadeOut('slow');
            if (typeof renderData === 'function') renderData();
        }
    };


    const popup = new SillyTavern.Popup($ui, SillyTavern.POPUP_TYPE.TEXT, '', {
        allowVerticalScrolling: true,
        okButton: "关闭面板",
        onOpen: async () => {
            await initiateDeepScan();
        }
    });
    $(popup.dlg).addClass('wb-manager-dialog');

    const attemptCreateWb = async (defaultName = "") => {
        let name = await SillyTavern.callGenericPopup("为新建的世界书设定一个名称：", SillyTavern.POPUP_TYPE.INPUT, defaultName);
        if (!name || typeof name !== 'string' || name.trim() === '') return;
        name = name.trim();

        if (getWorldbookNames().includes(name)) {
            const btnRes = await SillyTavern.callGenericPopup(`世界书 [${name}] 已存在，您希望作何处理？`, SillyTavern.POPUP_TYPE.TEXT, "", {
                customButtons: [ {text: "取代原文件", result: 1, classes: ["btn-danger"]}, {text: "重命名新建", result: 2, classes: ["btn-primary"]}, {text: "取消操作", result: 0} ]
            });
            if (btnRes !== 1) return (btnRes === 2) ? attemptCreateWb(name + "_新") : null;
        }
        await withLoadingOverlay(async () => {
             await createWorldbook(name, []);
             globalBindingMapCache[name] = [];
             toastr.success(`已创建：${name}`);
             renderData(name);
        }, "正在创建世界书...");
    };
    $ui.find('#wb-btn-create-wb').on('click', () => attemptCreateWb());

    const attemptRenameWb = async (oldName, isBound, bindings, defaultNewName = "") => {
        if (isBound) {
            const bNames = bindings.map(c => c.name);
            SillyTavern.callGenericPopup(`❌ 无法重命名：\n[${oldName}] 已牢牢绑定在 ${bindings.length} 张角色卡上（如 ${bNames.slice(0,3).join(', ')}）。\n暴力重命名会导致它们失去世界书连接，请先分别进卡片取消关联再试。`, SillyTavern.POPUP_TYPE.TEXT);
            return;
        }
        let newName = await SillyTavern.callGenericPopup(`正在重命名 [${oldName}]：\n请输入新名称：`, SillyTavern.POPUP_TYPE.INPUT, defaultNewName || oldName);
        if (!newName || typeof newName !== 'string' || newName.trim() === '' || newName.trim() === oldName) return;
        newName = newName.trim();

        if (getWorldbookNames().includes(newName)) {
            const btnRes = await SillyTavern.callGenericPopup(`世界书 [${newName}] 已经存在，您希望作何处理？`, SillyTavern.POPUP_TYPE.TEXT, "", {
                customButtons: [ {text: "暴力合并覆盖", result: 1, classes: ["btn-danger"]}, {text: "重新输入名称", result: 2, classes: ["btn-primary"]}, {text: "取消操作", result: 0} ]
            });
            if (btnRes !== 1) return (btnRes === 2) ? attemptRenameWb(oldName, isBound, bindings, newName + "_1") : null;
        }
        await withLoadingOverlay(async () => {
            const entries = await getWorldbook(oldName);
            await createWorldbook(newName, entries);
            await deleteWorldbook(oldName);
            delete globalBindingMapCache[oldName];
            globalBindingMapCache[newName] = [];

            const globals = getGlobalWorldbookNames();
            if (globals.includes(oldName)) await rebindGlobalWorldbooks(globals.map(w => w === oldName ? newName : w));

            toastr.success(`名称已更新为：${newName}`);
            renderData(newName);
        }, "正在重命名并迁移数据...");
    };

    let isBatchMode = false;
    let batchSelected = new Set();
    let currentVisibleWbs = [];

    $ui.find('#wb-search-input, #wb-filter-unbound, #wb-filter-state, #wb-sort-select').on('change input', () => renderData());

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
        if (isBatchMode) {
            currentVisibleWbs.forEach(wb => batchSelected.add(wb));
            renderData();
        } else {
            let currentActive = getGlobalWorldbookNames();
            currentVisibleWbs.forEach(wb => { if(!currentActive.includes(wb)) currentActive.push(wb); });
            await withLoadingOverlay(async () => await rebindGlobalWorldbooks(currentActive), "正在应用全局设置...");
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
             await withLoadingOverlay(async () => await rebindGlobalWorldbooks(currentActive), "正在应用全局设置...");
            renderData();
        }
    });

    $ui.find('#wb-btn-clear').on('click', async () => {
       await withLoadingOverlay(async () => {
            await rebindGlobalWorldbooks([]);
            toastr.success('已清空所有当前已启用的全局世界书。');
            renderData();
       }, "正在清空设置...");
    });

    $ui.find('#wb-btn-confirm-delete').on('click', async () => {
        if(batchSelected.size === 0) return toastr.warning("请先勾选需要删除项。");
        const confirm = await SillyTavern.callGenericPopup(`🚨 永久删除确认 🚨\n真的要销毁这 ${batchSelected.size} 本世界书吗？此操作无法还原。`, SillyTavern.POPUP_TYPE.CONFIRM);
        if (confirm === SillyTavern.POPUP_RESULT.AFFIRMATIVE) {
             await withLoadingOverlay(async () => {
                for (let wb of batchSelected) {
                    await deleteWorldbook(wb);
                    delete globalBindingMapCache[wb];
                }
                toastr.success(`成功移除了 ${batchSelected.size} 项。`);
                batchSelected.clear();
                renderData();
             }, `正在删除 ${batchSelected.size} 项...`);
        }
    });

    const renderData = (highlightName = null) => {
        const keyword = $ui.find('#wb-search-input').val().toLowerCase();
        const showUnboundOnly = $ui.find('#wb-filter-unbound').is(':checked');
        const stateFilter = $ui.find('#wb-filter-state').val();
        const sortMode = $ui.find('#wb-sort-select').val();

        const allWbs = getWorldbookNames();
        const activeWbs = getGlobalWorldbookNames();
        const vars = getVariables({ type: 'global' });
        const snapshots = vars.wb_snapshots || {};

        currentVisibleWbs = [...allWbs].filter(wb => {
            const bindings = globalBindingMapCache[wb] || [];
            if (keyword) {
                const boundNamesMatch = bindings.map(c => c.name).join(" ");
                const searchScope = (wb + " " + boundNamesMatch).toLowerCase();
                if (!searchScope.includes(keyword)) return false;
            }
            if (showUnboundOnly && bindings.length > 0) return false;
            if (stateFilter === 'enabled' && !activeWbs.includes(wb)) return false;
            if (stateFilter === 'disabled' && activeWbs.includes(wb)) return false;
            return true;
        }).sort((a, b) => {
            if (sortMode === 'az') return a.localeCompare(b, 'zh-CN');
            if (sortMode === 'za') return b.localeCompare(a, 'zh-CN');
            const aActive = activeWbs.includes(a);
            const bActive = activeWbs.includes(b);
            if (aActive === bActive) return a.localeCompare(b, 'zh-CN');
            return aActive ? -1 : 1;
        });

        const $wbContainer = $ui.find('#wb-container').empty();
        if (currentVisibleWbs.length === 0) $wbContainer.html('<div style="color: gray; padding: 10px;">列表空空如也~ 换个词搜搜看？</div>');

        $ui.find('#wb-batch-count').text(batchSelected.size);
        const $batchList = $ui.find('#wb-batch-selected-list').empty();
        if (batchSelected.size > 0) {
            batchSelected.forEach(wb => $batchList.append(`<span style="background:rgba(255, 107, 107,0.2);color:#ff6b6b;padding:3px 6px;border-radius:4px;font-size:12px;white-space:nowrap;border:1px solid #ff6b6b;"><i class="fa-solid fa-xmark"></i> ${wb}</span>`));
        } else {
             $batchList.html('<span style="color:gray; font-size:12px;">暂未选中任何项目</span>');
        }

        currentVisibleWbs.forEach(wb => {
            const bindings = globalBindingMapCache[wb] || [];
            const isBound = bindings.length > 0;
            const $wrapper = $('<div class="wb-item-wrapper"></div>').attr('data-wb-name', wb);
            const $header = $('<div class="wb-item-header"></div>');
            const $titleArea = $('<label class="wb-item-title-area" style="cursor:pointer;"></label>');
            let $chk;

            if(isBatchMode) {
                $chk = $('<input type="checkbox" style="transform: scale(1.2); margin-top:2px;">').prop('checked', batchSelected.has(wb));
                $titleArea.on('click', (e) => { e.preventDefault(); if(batchSelected.has(wb)) batchSelected.delete(wb); else batchSelected.add(wb); renderData(); });
            } else {
                $chk = $('<input type="checkbox" style="transform: scale(1.2); margin-top:2px;">').prop('checked', activeWbs.includes(wb));
                $chk.on('change', async function() {
                    await withLoadingOverlay(async () => {
                        let current = getGlobalWorldbookNames();
                        if ($(this).is(':checked')) current.push(wb); else current = current.filter(n => n !== wb);
                        await rebindGlobalWorldbooks(current);
                        renderData();
                    }, "正在应用设定...");
                });
            }
            $titleArea.append($chk);
            const statusStyle = activeWbs.includes(wb) && !isBatchMode ? 'color: var(--SmartThemeQuoteColor); font-weight:bold;' : '';
            $titleArea.append(`<span class="wb-name-text" style="${statusStyle}" title="${wb}">${wb}</span>`);
            $header.append($titleArea);

            if (!isBatchMode) {
                const $actions = $('<div class="wb-item-actions"></div>');
                const $delBtn = $('<div class="wb-icon-btn hover-red" title="彻底删除"><i class="fa-solid fa-trash"></i></div>').on('click', async () => {
                    const confirm = await SillyTavern.callGenericPopup(`删除确认：您要丢弃 [${wb}] 吗？`, SillyTavern.POPUP_TYPE.CONFIRM);
                    if (confirm === SillyTavern.POPUP_RESULT.AFFIRMATIVE) {
                        await withLoadingOverlay(async () => {
                            await deleteWorldbook(wb); delete globalBindingMapCache[wb];
                            toastr.success(`已删除。`); renderData();
                        }, `正在删除 ${wb}...`);
                    }
                });
                $actions.append($('<div class="wb-icon-btn" title="整理条目"><i class="fa-solid fa-list"></i></div>').on('click', () => openEntryTuneView(wb)))
                        .append($('<div class="wb-icon-btn" title="重命名名称"><i class="fa-solid fa-pen"></i></div>').on('click', () => attemptRenameWb(wb, isBound, bindings)))
                        .append($delBtn);
                $header.append($actions);
            }
            $wrapper.append($header);

            const $tagRow = $('<div style="padding: 0 4px;"></div>');
            const boundNames = bindings.map(c => c.name);
            const bindText = isBound ? `📌 已关联 ${bindings.length} 名角色` : `⚪ 暂未被任何卡片关联`;
            const $tag = $(`<div class="wb-bind-tag" style="background: ${isBound ? 'var(--SmartThemeQuoteColor)' : '#888'}1A; border: 1px solid ${isBound ? 'var(--SmartThemeQuoteColor)' : '#888'}; color: ${isBound ? 'var(--SmartThemeQuoteColor)' : '#888'};" title="${isBound ? boundNames.slice(0, 10).join(', ') + (boundNames.length > 10 ? ' ...等' : '') : '未检测到记录'}">${bindText}</div>`);
            if (isBound) $tag.on('click', () => openBindView(wb));
            $wrapper.append($tagRow.append($tag));
            $wbContainer.append($wrapper);
        });

        if (highlightName) {
            setTimeout(() => {
                const $highlightItem = $wbContainer.find(`[data-wb-name="${highlightName}"]`);
                if ($highlightItem.length) {
                    $highlightItem[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    $highlightItem.addClass('wb-highlight');
                    setTimeout(() => $highlightItem.removeClass('wb-highlight'), 1000);
                }
            }, 100);
        }

        const $snapContainer = $ui.find('#wb-snapshot-container').empty();
        Object.entries(snapshots).forEach(([name, snapData]) => {
            const isLegacy = Array.isArray(snapData);
            const isDetailed = !isLegacy && snapData.type === 'detailed';
            const wbs = isLegacy ? snapData : (isDetailed ? Object.keys(snapData.data) : snapData.wbs);
            const icon = isDetailed ? 'fa-puzzle-piece' : 'fa-box-archive';

            const safeWbs = wbs || [];
            const countText = isDetailed ? `含 ${Object.values(snapData.data).reduce((acc, uids) => acc + uids.length, 0)} 条目` : `含 ${safeWbs.length} 项设定`;

            const $item = $(`<div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--SmartThemeBotMesColor); border-radius:6px; border:1px solid var(--SmartThemeBorderColor); flex-wrap:wrap; gap:8px;"></div>`);
            $item.append(`<div style="flex:1; min-width: 150px;"><div style="font-weight:bold;font-size:14px;"><i class="fa-solid ${icon}" style="color:var(--SmartThemeQuoteColor);"></i> ${name}</div><div style="font-size:12px;color:gray;">${countText}</div></div>`);
            const $act = $('<div style="display:flex; gap:6px; flex-wrap: wrap;"></div>');
            $act.append($('<button class="menu_button interactable btn-success wb-nowrap-btn" style="margin:0; padding:6px 12px; font-size:12px; border:none;">应用该组合</button>').on('click', async () => {
                if(isDetailed) await applyDetailedSnapshot(snapData.data);
                else {
                    await withLoadingOverlay(async() => await rebindGlobalWorldbooks(wbs), `正在应用快照 ${name}...`);
                }
                toastr.success("组合已应用。"); renderData();
            }));

            if(isDetailed) $act.append($('<button class="menu_button interactable wb-nowrap-btn" style="margin:0; padding:6px 10px;" title="编辑项"><i class="fa fa-pen"></i></button>').on('click', () => openDetailedSnapView(name, snapData.data)));
            else $act.append($('<button class="menu_button interactable wb-nowrap-btn" style="margin:0; padding:6px 10px;" title="编辑项"><i class="fa fa-pen"></i></button>').on('click', () => openEditSnapView(name, wbs)));

            $act.append($('<button class="menu_button interactable btn-danger wb-nowrap-btn" style="margin:0; padding:6px 10px; border:none;" title="删除快照"><i class="fa fa-trash"></i></button>').on('click', async () => {
                if (await SillyTavern.callGenericPopup(`确认删除快照 [${name}]？`, SillyTavern.POPUP_TYPE.CONFIRM) === SillyTavern.POPUP_RESULT.AFFIRMATIVE) {
                    updateVariablesWith(v => { delete v.wb_snapshots[name]; return v; }, { type: 'global' }); renderData();
                }
            }));
            $item.append($act);
            $snapContainer.append($item);
        });
    };

    let activeBindWb = "";
    const openBindView = (wbName) => {
        activeBindWb = wbName;
        $ui.find('#wb-bind-title').text(wbName);
        $ui.find('#wb-main-view').hide();
        $ui.find('#wb-bind-view').fadeIn();
        renderBindList();
    };

    const renderBindList = () => {
        const kw = $ui.find('#wb-bind-search').val().toLowerCase();
        const $cont = $ui.find('#wb-bind-container').empty();
        const boundChars = globalBindingMapCache[activeBindWb] || [];
        let targetChars = kw ? boundChars.filter(c => c.name.toLowerCase().includes(kw)) : boundChars;

        targetChars.forEach(char => {
            const avaUrl = SillyTavern.getThumbnailUrl('avatar', char.avatar) || '';
            const $card = $(`<div style="display:flex; justify-content:space-between; align-items:center; background: var(--SmartThemeBotMesColor); border: 1px solid var(--SmartThemeBorderColor); border-radius:6px; padding: 10px;">
                               <div style="display:flex; align-items:center; gap:12px;">
                                 <img src="${avaUrl}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:2px solid var(--SmartThemeQuoteColor);">
                                 <div style="display:flex; flex-direction:column;">
                                   <span style="font-weight:bold; font-size:14px; margin-bottom:2px;">${char.name}</span>
                                   <div style="font-size:11px;color:gray;" title="底层唯一ID文件名">(${char.avatar})</div>
                                 </div>
                               </div>
                             </div>`);
            $cont.append($card);
        });

        if (boundChars.length === 0) $cont.html('<div style="padding:15px; color:gray; text-align:center;">这本书目前可以说是非常地清闲，没有任何绑定呢~</div>');
        else if (targetChars.length === 0) $cont.html('<div style="padding:15px; color:gray; text-align:center;">没有搜到名字对得上的角色哦。</div>');
    };
    $ui.find('#wb-bind-search').on('input', renderBindList);

    $ui.find('#wb-btn-bind-cancel').on('click', () => { $ui.find('#wb-bind-view').hide(); $ui.find('#wb-main-view').fadeIn(); });

    $ui.find('#wb-btn-save-snap').on('click', async () => {
         let name = await SillyTavern.callGenericPopup("创建新快照组合名称：", SillyTavern.POPUP_TYPE.INPUT, "新备份组合");
         if (!name || typeof name !== 'string' || name.trim() === '') return;
         name = name.trim();

         let vars = getVariables({ type: 'global' });
         if (vars.wb_snapshots && vars.wb_snapshots[name]) {
             if(await SillyTavern.callGenericPopup(`快照 [${name}] 已存在，是否强制覆盖？`, SillyTavern.POPUP_TYPE.CONFIRM) !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
         }
         updateVariablesWith(v => {
             if (!v.wb_snapshots) v.wb_snapshots = {};
             v.wb_snapshots[name] = { type: 'simple', wbs: getGlobalWorldbookNames() };
             return v;
         }, { type: 'global' });
         toastr.success("组合保存完毕。"); renderData();
    });

    let snapOldName = "", snapTempList = [];
    const openEditSnapView = (name, list) => {
        snapOldName = name; snapTempList = [...list];
        $ui.find('#wb-edit-snap-name').val(name);

        const buildList = () => {
            const kw = $ui.find('#wb-edit-snap-search').val().toLowerCase();
            const $c = $ui.find('#wb-edit-snap-container').empty();
            [...getWorldbookNames()].sort((a,b) => { const ac = snapTempList.includes(a); const bc = snapTempList.includes(b); if(ac === bc) return a.localeCompare(b, 'zh-CN'); return ac ? -1 : 1; }).forEach(w => {
                if (kw && !w.toLowerCase().includes(kw)) return;
                const isChk = snapTempList.includes(w);
                const $wHolder = $(`<div class="wb-item-wrapper" style="flex-direction:row; align-items:center; cursor:pointer;"></div>`);
                const $chkBox = $(`<input type="checkbox" style="transform:scale(1.2); flex-shrink:0;">`).prop('checked', isChk);
                const $title = $(`<span class="wb-name-text" style="${isChk?'font-weight:bold;color:var(--SmartThemeQuoteColor)':''}">${w}</span>`);
                $wHolder.append($chkBox, $title).on('click', () => $chkBox.prop('checked', !$chkBox.is(':checked')).trigger('change'));
                $chkBox.on('change', function() {
                    const c = $(this).is(':checked');
                    if(c && !snapTempList.includes(w)) snapTempList.push(w);
                    if(!c) snapTempList = snapTempList.filter(n=>n!==w);
                    buildList();
                });
                $c.append($wHolder);
            });
        };
        $ui.find('#wb-edit-snap-search').off('input').on('input', buildList).val('');
        buildList();
        $ui.find('#wb-main-view').hide(); $ui.find('#wb-edit-snap-view').fadeIn(200);
    };

    $ui.find('#wb-btn-edit-save').on('click', async () => {
        const nName = $ui.find('#wb-edit-snap-name').val().trim();
        if(!nName) return toastr.warning("名称不能为空哦。");

        let vars = getVariables({ type: 'global' });
        if (nName !== snapOldName && vars.wb_snapshots && vars.wb_snapshots[nName]) {
            if (await SillyTavern.callGenericPopup(`快照 [${nName}] 名称冲突，确定覆盖？`, SillyTavern.POPUP_TYPE.CONFIRM) !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
        }

        updateVariablesWith(v => {
            if (!v.wb_snapshots) v.wb_snapshots = {};
            if (nName !== snapOldName) delete v.wb_snapshots[snapOldName];
            v.wb_snapshots[nName] = { type: 'simple', wbs: snapTempList }; return v;
        }, { type: 'global' });
        toastr.success("快照已成功更新！");
        $ui.find('#wb-edit-snap-view').hide(); $ui.find('#wb-main-view').fadeIn(); renderData();
    });
    $ui.find('#wb-btn-edit-cancel').on('click', () => { $ui.find('#wb-edit-snap-view').hide(); $ui.find('#wb-main-view').fadeIn(); });

    let detailedSnapData = {};
    let detailedSnapOldName = "";

    const openDetailedSnapView = (name = "", existingData = {}) => {
        detailedSnapOldName = name;
        detailedSnapData = JSON.parse(JSON.stringify(existingData));
        $ui.find('#dsnap-name').val(name);

        const $wbList = $ui.find('#dsnap-wb-list').empty();
        const $entryList = $ui.find('#dsnap-entry-list').empty();
        const allWbs = getWorldbookNames();

        const renderWbList = () => {
            const keyword = $ui.find('#dsnap-wb-search').val().toLowerCase();
            const hideBound = $ui.find('#dsnap-filter-unbound').is(':checked');
            $wbList.empty();

            const filteredWbs = allWbs.filter(wb => {
                const visible = wb.toLowerCase().includes(keyword);
                // 核心逻辑：过滤已绑定的世界书
                if (hideBound && (globalBindingMapCache[wb] || []).length > 0) return false;
                return visible;
            });

            filteredWbs.forEach(wbName => {
                const selectedCount = (detailedSnapData[wbName] || []).length;
                const $item = $(`<div class="dsnap-wb-item" data-wbname="${wbName}">${wbName} <b style="color:var(--okGreen); display:${selectedCount>0?'inline':'none'};">(${selectedCount})</b></div>`);
                $item.on('click', async () => {
                    if ($item.hasClass('active')) return;
                    $wbList.find('.active').removeClass('active');
                    $item.addClass('active');
                    await renderEntryListFor(wbName);
                });
                $wbList.append($item);
            });

            if ($wbList.find('.active').length === 0 && filteredWbs.length > 0) {
                 $wbList.children().first().trigger('click');
            } else if (filteredWbs.length === 0) {
                 $entryList.html('<div style="color:gray;text-align:center;padding:20px;">未找到匹配的世界书</div>');
            }
        };

        $ui.find('#dsnap-wb-search, #dsnap-filter-unbound').off('input change').on('input change', renderWbList);
        // 初始化重置搜索框和筛选
        $ui.find('#dsnap-wb-search').val('');
        // $ui.find('#dsnap-filter-unbound').prop('checked', false);

        const renderEntryListFor = async (wbName) => {
            $entryList.html('<i class="fa-solid fa-spinner fa-spin"></i> 正在加载条目...');
            try {
                const entries = await getWorldbook(wbName);
                $entryList.empty();
                if (entries.length === 0) {
                    $entryList.html('<div style="color:gray; text-align:center;">这本书是空的...</div>');
                    return;
                }
                entries.forEach(entry => {
                    const isChecked = (detailedSnapData[wbName] || []).includes(entry.uid);
                    const $item = $(`<div class="dsnap-entry-item"><input type="checkbox" style="transform:scale(1.2); flex-shrink:0;"><span></span></div>`);
                    const $label = $item.find('span');
                    $label.text(entry.name || `(未命名条目 UID: ${entry.uid})`);

                    // 核心优化：点击勾选不再刷新左侧列表，而是平滑更新计数
                    $item.find('input').prop('checked', isChecked).on('change', function() {
                        const checked = $(this).is(':checked');
                        if (!detailedSnapData[wbName]) detailedSnapData[wbName] = [];

                        if (checked) {
                            if (!detailedSnapData[wbName].includes(entry.uid)) detailedSnapData[wbName].push(entry.uid);
                        } else {
                            detailedSnapData[wbName] = detailedSnapData[wbName].filter(uid => uid !== entry.uid);
                        }

                        if (detailedSnapData[wbName].length === 0) delete detailedSnapData[wbName];

                        // 平滑更新左侧计数，不触发重绘
                        const newCount = (detailedSnapData[wbName] || []).length;
                        const $wbItem = $wbList.find(`.dsnap-wb-item.active[data-wbname="${wbName}"]`);
                        const $counter = $wbItem.find('b');

                        $counter.text(`(${newCount})`);
                        if(newCount > 0) $counter.show(); else $counter.hide();
                    });

                    $entryList.append($item);
                });
            } catch (e) {
                $entryList.html('<div style="color:red; text-align:center;">加载条目失败！</div>');
                console.error(e);
            }
        };

        renderWbList();
        $ui.find('#wb-main-view, #wb-edit-snap-view').hide();
        $ui.find('#wb-detailed-snap-view').fadeIn(200);
    };

    const applyDetailedSnapshot = async (data) => {
        await withLoadingOverlay(async () => {
            const allWbNames = getWorldbookNames();
            const targetWbNames = Object.keys(data);

            for (const wbName of allWbNames) {
                let wbEntries = await getWorldbook(wbName);
                let changed = false;

                if (targetWbNames.includes(wbName)) {
                    const enabledUIDs = data[wbName];
                    wbEntries.forEach(entry => {
                        const shouldBeEnabled = enabledUIDs.includes(entry.uid);
                        if(entry.enabled !== shouldBeEnabled) {
                            entry.enabled = shouldBeEnabled;
                            changed = true;
                        }
                    });
                } else {
                    wbEntries.forEach(entry => {
                        if(entry.enabled) {
                            entry.enabled = false;
                            changed = true;
                        }
                    });
                }
                if (changed) {
                    await replaceWorldbook(wbName, wbEntries);
                }
            }
            await rebindGlobalWorldbooks(targetWbNames);
        }, "正在应用复合场景...");
    };

    $ui.find('#wb-btn-create-detail-snap').on('click', () => openDetailedSnapView());

    $ui.find('#dsnap-save').on('click', () => {
        const name = $ui.find('#dsnap-name').val().trim();
        if (!name) return toastr.warning("复合快照也需要一个名字哦！");

        updateVariablesWith(v => {
            if (!v.wb_snapshots) v.wb_snapshots = {};
            if(name !== detailedSnapOldName) delete v.wb_snapshots[detailedSnapOldName];
            v.wb_snapshots[name] = { type: 'detailed', data: detailedSnapData };
            return v;
        }, { type: 'global' });

        toastr.success(`复合快照 [${name}] 已保存！`);
        $ui.find('#wb-detailed-snap-view').hide();
        $ui.find('#wb-main-view').fadeIn(200);
        renderData();
    });
     $ui.find('#dsnap-cancel').on('click', () => {
         $ui.find('#wb-detailed-snap-view').hide();
         $ui.find('#wb-main-view').fadeIn(200);
    });

    let tuneWbName = "";
    let tuneEntries = [];

    const openEntryTuneView = async (wbName) => {
        tuneWbName = wbName;
        $ui.find('#wb-entry-title').text(wbName);
        $ui.find('#wb-entry-search').val('');
        await withLoadingOverlay(async () => {
            tuneEntries = JSON.parse(JSON.stringify(await getWorldbook(wbName)));
        }, `正在读取 ${wbName} 的条目...`);
        renderEntryList();
        $ui.find('#wb-main-view, #wb-detail-view').hide();
        $ui.find('#wb-entry-view').fadeIn(200);
    };

    const renderEntryList = () => {
        const keyword = $ui.find('#wb-entry-search').val().toLowerCase();
        const $container = $ui.find('#wb-entry-container').empty();
        const filteredEntries = tuneEntries.filter(entry => {
            const searchStr = `${entry.name||''} ${(entry.strategy?.keys||[]).join(',')}`.toLowerCase();
            return !keyword || searchStr.includes(keyword);
        });

        filteredEntries.forEach((entry) => {
            const index = tuneEntries.indexOf(entry);
            const strategy = entry.strategy || { type: 'constant', keys: [] };
            const keysInfo = strategy.type !== 'selective' ? `<span style="color:gray;">[常驻无触发词]</span>` : `🔑 ${(strategy.keys||[]).join(', ')||'<span style="color:#d63384">未设置触发词汇</span>'}`;
            const $item = $(`<div style="display:flex; align-items:center; gap:12px; padding:10px; border-left: 4px solid ${entry.enabled ? 'var(--okGreen)' : 'gray'};"></div>`);
            const $chk = $(`<input type="checkbox" style="transform: scale(1.2); flex-shrink:0;">`).prop('checked', entry.enabled).on('change', function() { entry.enabled = $(this).is(':checked'); renderEntryList(); });
            const $info = $(`<div><div style="font-weight:bold; margin-bottom: 4px; font-size:14px;">${entry.name || '未定义模块'}</div><div style="font-size:12px;color:gray;display:flex;align-items:center;">${strategy.type !== 'selective' ? '<span class="badge-blue">常驻</span>' : '<span class="badge-green">匹配</span>'} ${keysInfo}</div></div>`);
            const $right = $('<div style="display:flex; gap:8px; margin-left:auto;"></div>');
            $right.append($('<button class="menu_button interactable wb-nowrap-btn" style="color:var(--SmartThemeQuoteColor); margin:0;" title="修改内容"><i class="fa fa-pen-nib"></i></button>').on('click', () => openDetailEditView(index)));
            $right.append($('<button class="menu_button interactable wb-nowrap-btn" style="color:#ff6b6b; margin:0;" title="删除条目"><i class="fa fa-trash"></i></button>').on('click', async () => {
                if(await SillyTavern.callGenericPopup(`确认删除条目 [${entry.name || '未命名'}]？`, SillyTavern.POPUP_TYPE.CONFIRM) === SillyTavern.POPUP_RESULT.AFFIRMATIVE) { tuneEntries.splice(index, 1); renderEntryList(); }
            }));
            $item.append($chk, $info, $right);
            $container.append($item);
        });
        if (filteredEntries.length === 0) $container.html(`<div style="color: gray; padding: 10px; text-align: center;">${tuneEntries.length > 0 ? '没有匹配的条目。': '目前书里还没有内容哦。'}</div>`);
    };

    $ui.find('#wb-entry-search').off('input').on('input', renderEntryList);
    $ui.find('#wb-btn-entry-all').off('click').on('click', () => { tuneEntries.forEach(e => e.enabled = true); renderEntryList(); });
    $ui.find('#wb-btn-entry-none').off('click').on('click', () => { tuneEntries.forEach(e => e.enabled = false); renderEntryList(); });
    $ui.find('#wb-btn-entry-add').off('click').on('click', () => {
        const newEntry = {
            uid: Date.now() + Math.random(), name: "新增编辑条目", enabled: true, content: "",
            strategy: { type: 'constant', keys: [] },
            position: { type: 'at_depth', role: 'system', depth: 0, order: 100 }
        };
        tuneEntries.unshift(newEntry);
        renderEntryList(); openDetailEditView(0);
    });

    $ui.find('#wb-btn-entry-save').on('click', async () => {
        await withLoadingOverlay(async () => {
            await replaceWorldbook(tuneWbName, tuneEntries);
            toastr.success(`数据写入完成。`);
        }, `正在保存 ${tuneWbName}...`);
        $ui.find('#wb-entry-view').hide(); $ui.find('#wb-main-view').fadeIn(200); renderData();
    });
    $ui.find('#wb-btn-entry-cancel').on('click', () => { $ui.find('#wb-entry-view').hide(); $ui.find('#wb-main-view').fadeIn(200); });

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
        $ui.find('#wb-det-depth').val(e.position?.depth ?? 0); $ui.find('#wb-det-order').val(e.position?.order ?? 100);

        $ui.find('#wb-entry-view').hide(); $ui.find('#wb-detail-view').fadeIn(200);
    };

    $ui.find('#wb-btn-det-save').on('click', () => {
        if(tuneDetailIndex === -1) return;
        const e = tuneEntries[tuneDetailIndex];
        e.name = $ui.find('#wb-det-name').val(); e.content = $ui.find('#wb-det-content').val();
        e.strategy = { type: $ui.find('#wb-det-strategy').val(), keys: $ui.find('#wb-det-keys').val().split(',').map(s=>s.trim()).filter(Boolean) };
        const pos = $ui.find('#wb-det-position').val();
        const order = parseInt($ui.find('#wb-det-order').val()) || 100;
        if (pos.startsWith('at_depth_')) e.position = { type: 'at_depth', role: pos.replace('at_depth_',''), depth: parseInt($ui.find('#wb-det-depth').val())||0, order: order };
        else e.position = { type: pos, order: order };

        $ui.find('#wb-detail-view').hide(); $ui.find('#wb-entry-view').fadeIn(200);
        renderEntryList();
    });
    $ui.find('#wb-btn-det-cancel').on('click', () => {
        $ui.find('#wb-detail-view').hide(); $ui.find('#wb-entry-view').fadeIn(200);
    });

    await popup.show();
});