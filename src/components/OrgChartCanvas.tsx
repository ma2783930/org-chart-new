/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { OrgNode, LayoutOrientation } from '../types';
import OrgChartNode from './OrgChartNode';
import { ZoomIn, ZoomOut, Maximize2, Move, HelpCircle, Search, RefreshCw, Layers, PlusCircle, Check, Sparkles } from 'lucide-react';

interface OrgChartCanvasProps {
  tree: OrgNode[];
  orientation: LayoutOrientation;
  setOrientation: (val: LayoutOrientation) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onEditNode: (node: OrgNode) => void;
  onAddChild: (parentId: number | string) => void;
  onResetChart: () => void;
  onMoveNode: (nodeId: string | number, targetParentId: string | number) => void;
}

export default function OrgChartCanvas({
  tree,
  orientation,
  setOrientation,
  searchQuery,
  setSearchQuery,
  onEditNode,
  onAddChild,
  onResetChart,
  onMoveNode
}: OrgChartCanvasProps) {
  // Navigation & Zoom States
  const [zoom, setZoom] = useState<number>(0.9);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Drag & Drop local states for high precision node highlights
  const [draggedNodeId, setDraggedNodeId] = useState<string | number | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | number | null>(null);

  const handleDragStartNode = (e: React.DragEvent, nodeId: number | string) => {
    e.stopPropagation();
    setDraggedNodeId(nodeId);
    e.dataTransfer.setData('text/plain', String(nodeId));
  };

  const handleDragOverNode = (e: React.DragEvent, nodeId: number | string) => {
    e.preventDefault();
    e.stopPropagation();
    // Do not allow dropping on itself or when ID matches
    if (draggedNodeId !== nodeId && String(draggedNodeId) !== String(nodeId)) {
      setDragOverNodeId(nodeId);
    }
  };

  const handleDragLeaveNode = (e: React.DragEvent, nodeId: number | string) => {
    e.stopPropagation();
    if (dragOverNodeId === nodeId || String(dragOverNodeId) === String(nodeId)) {
      setDragOverNodeId(null);
    }
  };

  const handleDropNode = (e: React.DragEvent, targetParentId: number | string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverNodeId(null);

    const dataId = e.dataTransfer.getData('text/plain');
    const sourceNodeId = draggedNodeId || dataId;

    if (sourceNodeId && sourceNodeId !== targetParentId && String(sourceNodeId) !== String(targetParentId)) {
      onMoveNode(sourceNodeId, targetParentId);
    }
    setDraggedNodeId(null);
  };

  const handleDragEndNode = (e: React.DragEvent) => {
    setDraggedNodeId(null);
    setDragOverNodeId(null);
  };

  // Collapse lists
  const [collapsedNodes, setCollapsedNodes] = useState<{ [key: string]: boolean }>({});
  const [collapsedGroups, setCollapsedGroups] = useState<{ [key: string]: boolean }>({});

  // Help tooltip indicator
  const [showHelp, setShowHelp] = useState(false);

  // Auto zoom fit on initial load
  useEffect(() => {
    // Reset pan center
    if (orientation === 'vertical') {
      setPan({ x: 0, y: 40 });
    } else {
      setPan({ x: 100, y: 40 });
    }
  }, [orientation]);

  // Expand / Collapse Toggles
  const handleToggleNode = (id: number | string) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleToggleGroup = (id: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Expand all nodes/groups
  const handleExpandAll = () => {
    setCollapsedNodes({});
    setCollapsedGroups({});
  };

  // Collapse all sub-nodes (excluding root)
  const handleCollapseAll = () => {
    const nodesToCollapse: { [key: string]: boolean } = {};
    const traverse = (elements: OrgNode[]) => {
      elements.forEach((el) => {
        if (el.id !== 1 && String(el.id) !== '1' && el.children && el.children.length > 0) {
          nodesToCollapse[el.id] = true;
        }
        if (el.children) {
          traverse(el.children);
        }
      });
    };
    traverse(tree);
    setCollapsedNodes(nodesToCollapse);
  };

  // Drag-to-pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click drag
    
    // Avoid dragging if the click is on/within a node card box, button, input, select, or textarea
    const target = e.target as HTMLElement;
    if (
      target.closest('.group') || 
      target.closest('button') || 
      target.closest('input') || 
      target.closest('select') || 
      target.closest('textarea')
    ) {
      return;
    }

    e.preventDefault(); // Prevent text selection & default browser drag behaviors
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom helpers
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.4));
  const handleZoomReset = () => {
    setZoom(0.9);
    setPan({ x: 0, y: 30 });
  };

  // Auto Zoom & Fit all expanded layout elements safely inside view limits
  const handleAutoFit = () => {
    if (!canvasRef.current || !contentRef.current) return;

    const viewportWidth = canvasRef.current.clientWidth;
    const viewportHeight = canvasRef.current.clientHeight;

    // Retrieve actual scale-independent dimensions of the active subtree
    const rect = contentRef.current.getBoundingClientRect();
    const contentWidth = rect.width / zoom;
    const contentHeight = rect.height / zoom;

    if (contentWidth <= 0 || contentHeight <= 0) return;

    const padding = 80; // Safe breathing room padding
    const fitZoomX = (viewportWidth - padding) / contentWidth;
    const fitZoomY = (viewportHeight - padding) / contentHeight;

    // Select conservative zoom scaling to fit the entire flow gracefully
    let idealZoom = Math.min(fitZoomX, fitZoomY);
    idealZoom = Math.max(0.3, Math.min(idealZoom, 1.2)); // Safe boundaries

    // Align exactly horizontally centered (with flex horizontal centering, this is x=0)
    const panX = 0;

    // Gracefully position vertical offset (centered if fits, otherwise pinned with top margin padding)
    const panY = Math.max(40, (viewportHeight - contentHeight * idealZoom) / 2);

    setZoom(idealZoom);
    setPan({ x: panX, y: panY });
  };

  // Flat compact rendering view for "compact" list mode
  const renderCompactList = (nodes: OrgNode[], depth = 0) => {
    return (
      <div className="space-y-2 w-full max-w-4xl mx-auto py-4">
        {nodes.map((node) => {
          const isCollapsed = !!collapsedNodes[node.id];
          const hasChildren = node.children && node.children.length > 0;
          const matched = searchQuery && node.name.toLowerCase().includes(searchQuery.toLowerCase());

          return (
            <div key={node.id} className="relative select-none" style={{ marginRight: `${depth * 32}px` }}>
              <div 
                className={`p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4 transition-all hover:border-indigo-400 ${
                  matched ? 'ring-2 ring-emerald-500' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    node.type === 'general_office' ? 'bg-slate-900 text-amber-400' :
                    node.type === 'office' ? 'bg-emerald-50 text-emerald-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {node.department_number || '---'}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-800">{node.name}</h5>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span>مدیر: {node.managerName || 'ثبت نشده'}</span>
                      {node.role && <span className="text-slate-400">({node.role})</span>}
                      {node.employeeCount && <span className="bg-slate-100 px-1.5 py-0.5 rounded">🧑‍💼 {node.employeeCount} نفر</span>}
                      {node.department_group && (
                        <span className="bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded text-[10px]">
                          ابر: {node.department_group.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEditNode(node)}
                    className="p-1 px-3.5 text-xs text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded-lg cursor-pointer transition-all"
                  >
                    ویرایش
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddChild(node.id)}
                    className="p-1 px-3 text-xs text-emerald-600 hover:bg-emerald-50 border border-emerald-100 rounded-lg cursor-pointer transition-all"
                  >
                    زیرمجموعه +
                  </button>
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => handleToggleNode(node.id)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                    >
                      {isCollapsed ? '➕ باز کردن' : '➖ بستن'}
                    </button>
                  )}
                </div>
              </div>

              {/* Recursive render container */}
              {hasChildren && !isCollapsed && (
                <div className="mt-2 pr-4 border-r-2 border-slate-200 border-dashed">
                  {renderCompactList(node.children || [], depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // flat layout view grouped by department roles or staff levels
  const renderGridView = (nodes: OrgNode[]) => {
    // Collect all units in flat structure
    const flatList: OrgNode[] = [];
    const traverse = (elements: OrgNode[]) => {
      elements.forEach((item) => {
        flatList.push(item);
        if (item.children) {
          traverse(item.children);
        }
      });
    };
    traverse(nodes);

    // Filter list
    const filtered = flatList.filter((item) => 
      !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.managerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="max-w-6xl mx-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                    کد واحد: {item.department_number || '---'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                    item.type === 'general_office' ? 'bg-indigo-50 text-indigo-700' :
                    item.type === 'office' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.type === 'general_office' ? 'اداره کل' :
                     item.type === 'office' ? 'معاونت' :
                     item.type === 'department' ? 'اداره' : 'سایر'}
                  </span>
                </div>
                <h5 className="font-bold text-slate-800 text-sm mb-1">{item.name}</h5>
                <p className="text-xs text-slate-500">مسئول: {item.managerName || 'تعیین نشده'} ({item.role || 'کارشناس مسئول'})</p>
                {item.department_group && (
                  <div className="mt-2 text-[10px] bg-sky-50 text-sky-800 font-bold py-1 px-2.5 rounded-lg w-max shrink-0">
                    گروه ابری: {item.department_group.name}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">👤 {item.employeeCount || 0} پرسنل</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEditNode(item)}
                    className="text-xs text-indigo-600 hover:underline cursor-pointer"
                  >
                    ویرایش
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddChild(item.id)}
                    className="text-xs text-emerald-600 hover:underline cursor-pointer"
                  >
                    افزودن زیرمجموعه
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">موردی یافت نشد.</div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative custom-org-tree select-none">
      
      {/* Floating Canvas Top controls */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 p-3 flex flex-wrap gap-3 items-center justify-between z-30 shadow-xs">
        
        {/* Layout Style Switcher & Tree Collapsers */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex flex-wrap items-center gap-1">
            {[
              { value: 'vertical', label: '🔲 کلاسیک (شاخه افقی)' },
              { value: 'left-cascade', label: '📐 چپ‌چین آبشاری' },
              { value: 'right-cascade', label: '📐 راست‌چین آبشاری' },
              { value: 'centered-column', label: '⛓️ تک‌ستونی متمرکز' },
              { value: 'split-columns', label: '⚖️ دوسطونه متقارن' },
              { value: 'horizontal', label: '⬅️ افقی RTL' },
              { value: 'compact', label: '📋 نمای درختی لیست' },
              { value: 'grid', label: '🔍 نمای کارت‌ها / جستجو' }
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setOrientation(btn.value as LayoutOrientation)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  orientation === btn.value 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {(orientation !== 'compact' && orientation !== 'grid') && (
            <div className="flex items-center gap-1.5 border-r border-slate-200 pr-2">
              <button
                onClick={handleExpandAll}
                className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                title="نمایش داربست کامل تمامی نودها"
              >
                بسط همه
              </button>
              <button
                onClick={handleCollapseAll}
                className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                title="بستن شاخه‌ها به غیر از مدیریت ریشه"
              >
                جمع‌کردن همه
              </button>
            </div>
          )}
        </div>

        {/* Live Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="جستجوی واحد، نام مدیر، کد دپارتمان..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 md:w-72 pl-4 pr-10 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs transition-all text-right"
              dir="rtl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px]"
              >
                پاک کردن
              </button>
            )}
          </div>

          <button
            onClick={onResetChart}
            className="p-1 px-3 text-xs border border-indigo-100 text-indigo-700 hover:bg-indigo-100 bg-indigo-50 rounded-xl flex items-center gap-1 cursor-pointer transition-all"
            title="بازگرداندن اطلاعات به دیتای اولیه"
          >
            <RefreshCw className="w-3" style={{ height: '12px' }} />
            <span>بازنشانی پیش‌فرض</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport container */}
      <div className="flex-1 relative overflow-hidden bg-slate-50 scrollable-whiteboard">
        
        {/* Whiteboard with Zoom & Pan overlay */}
        {orientation !== 'compact' && orientation !== 'grid' ? (
          <div
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`w-full h-full cursor-grab active:cursor-grabbing overflow-hidden p-12 select-none scrollable-whiteboard ${
              isDragging ? 'grabbing' : ''
            }`}
          >
            {/* Interactive transform board wrapper */}
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'top center',
                transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.1, 0.8, 0.25, 1)'
              }}
              className="absolute left-0 right-0 top-0 flex justify-center pb-24"
            >
              <div ref={contentRef} className="flex flex-col items-center">
                {tree.map((rootNode) => (
                  <OrgChartNode
                    key={rootNode.id}
                    node={rootNode}
                    orientation={orientation}
                    collapsedNodes={collapsedNodes}
                    collapsedGroups={collapsedGroups}
                    onToggleNode={handleToggleNode}
                    onToggleGroup={handleToggleGroup}
                    onEditNode={onEditNode}
                    onAddChild={onAddChild}
                    searchQuery={searchQuery}
                    
                    // Drag and Drop props
                    draggedNodeId={draggedNodeId}
                    dragOverNodeId={dragOverNodeId}
                    onDragStartNode={handleDragStartNode}
                    onDragOverNode={handleDragOverNode}
                    onDragLeaveNode={handleDragLeaveNode}
                    onDropNode={handleDropNode}
                    onDragEndNode={handleDragEndNode}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : orientation === 'compact' ? (
          /* Compact Viewport */
          <div className="w-full h-full overflow-y-auto p-6 md:p-12">
            <h4 className="text-sm font-bold text-slate-500 mb-4 text-right">لیست الفبایی درختی دپارتمان‌ها:</h4>
            {renderCompactList(tree)}
          </div>
        ) : (
          /* Card Grid Viewport */
          <div className="w-full h-full overflow-y-auto p-6 md:p-12">
            <h4 className="text-sm font-bold text-slate-500 mb-4 text-right">جستجوی خطی و تفکیکی واحدها:</h4>
            {renderGridView(tree)}
          </div>
        )}

        {/* Floating Zoom & Canvas Navigator Bar (Only shown on whiteboard layouts) */}
        {orientation !== 'compact' && orientation !== 'grid' && (
          <div className="absolute bottom-6 right-6 z-40 bg-white/90 backdrop-blur-md border border-slate-200 p-2 rounded-2xl shadow-lg flex items-center gap-1">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
              title="بزرگنمایی"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <div className="text-xs text-slate-400 px-1 pt-1 border-r border-slate-200">
              {Math.round(zoom * 100)}%
            </div>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
              title="کوچکنمایی"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomReset}
              className="p-1.5 rounded-lg hover:bg-sky-50 text-indigo-600 border-r border-slate-100 cursor-pointer"
              title="هم‌راستاسازی وسط"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleAutoFit}
              className="p-1.5 px-2.5 rounded-lg bg-indigo-50/50 hover:bg-indigo-100/80 text-purple-700 border-r border-slate-150 cursor-pointer flex items-center gap-1.5 transition-all shadow-xs border border-purple-200/40"
              title="زوم هوشمند (جا دادن کل ساختار در صفحه)"
            >
              <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
              <span className="text-[10px] font-black hidden lg:inline-block text-purple-950">زوم هوشمند</span>
            </button>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className={`p-1.5 rounded-lg cursor-pointer ${
                showHelp ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-400'
              }`}
              title="راهنمای کار با چارت حرکتی"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Canvas Navigation Quick Guide Tooltip card */}
        {showHelp && (
          <div className="absolute bottom-20 right-6 z-40 bg-slate-900 text-white p-4 rounded-xl shadow-xl border border-slate-800 w-72 text-xs leading-relaxed space-y-2 text-right">
            <h5 className="font-bold text-amber-400 border-b border-white/10 pb-1 mb-2">راهنمای سازمان‌نگار حرکتی</h5>
            <div className="flex gap-2 items-start">
              <span className="bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded text-[10px] shrink-0 mt-0.5 font-bold">زوم هوشمند</span>
              <p>تنظیم خودکار بزرگنمایی و موقعیت چارت به نحوی که تمامی واحدهای باز شده به طور کامل در یک نگاه جا شوند.</p>
            </div>
            <div className="flex gap-2 items-start mt-2">
              <span className="bg-amber-400/20 text-amber-400 px-1 py-0.5 rounded text-[10px] shrink-0 mt-0.5">درگ حرکتی</span>
              <p>کلیک چپ را نگه دارید و ماوس را حرکت دهید تا در روی بوم پیمایش کنید.</p>
            </div>
            <div className="flex gap-2 items-start mt-2">
              <span className="bg-amber-400/20 text-amber-400 px-1 py-0.5 rounded text-[10px] shrink-0 mt-0.5">زوم چرخنده</span>
              <p>زوم کردن را با دکمه‌های شناور یا چرخ ماوس هماهنگ کنید.</p>
            </div>
            <div className="flex gap-2 items-start mt-2">
              <span className="bg-amber-400/20 text-amber-400 px-1 py-0.5 rounded text-[10px] shrink-0 mt-0.5">ابر دپارتمان</span>
              <p>نودهای عضو گروه بالا به شکل یک پوشش یکپارچه ابری جمع شده و چارت را ساده می‌کنند.</p>
            </div>
            <div className="flex gap-2 items-start mt-2">
              <span className="bg-amber-400/20 text-amber-400 px-1 py-0.5 rounded text-[10px] shrink-0 mt-0.5">ویرایش و درج</span>
              <p>با بردن ماوس روی کارت‌ها، کلید ویرایش و افزودن زیرمجموعه در دسترس قرار می‌گیرد.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
