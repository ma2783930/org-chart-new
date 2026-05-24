/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { useGetOrgChartQuery, useResetChartMutation, useMoveNodeMutation, useMergeNodesMutation } from './store/api';
import { LayoutOrientation, OrgNode } from './types';
import OrgChartCanvas from './components/OrgChartCanvas';
import SidebarStats from './components/SidebarStats';
import NodeEditorModal from './components/NodeEditorModal';
import DragDropConfirmModal from './components/DragDropConfirmModal';
import { Layers, Plus, RotateCcw, AlertCircle, Info, FileSpreadsheet, Loader2, RefreshCw } from 'lucide-react';

function OrgChartApp() {
  const { data: tree, isLoading, isError, error } = useGetOrgChartQuery(undefined, {
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  const [resetChart, { isLoading: isResetting }] = useResetChartMutation();
  const [moveNode] = useMoveNodeMutation();
  const [mergeNodes] = useMergeNodesMutation();

  // Layout selection state
  const [orientation, setOrientation] = useState<LayoutOrientation>('vertical');
  
  // Search query state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal editor states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [nodeToEdit, setNodeToEdit] = useState<OrgNode | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<number | string | null>(null);

  // Drag & Drop confirmation states
  const [isDragDropConfirmOpen, setIsDragDropConfirmOpen] = useState(false);
  const [ddSourceNode, setDdSourceNode] = useState<OrgNode | null>(null);
  const [ddTargetNode, setDdTargetNode] = useState<OrgNode | null>(null);

  // Drag and drop monitoring logs (Telemetry callback visualization)
  const [dragDropLog, setDragDropLog] = useState<{
    nodeName: string;
    sourceParentName: string;
    targetParentName: string;
    timestamp: string;
    allowed: boolean;
    type: 'transfer' | 'merge';
  } | null>(null);

  // Helper to find a node by ID inside the tree structure
  const findNodeById = (nodes: OrgNode[], id: string | number): OrgNode | null => {
    for (const node of nodes) {
      if (node.id === id || String(node.id) === String(id)) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const result = findNodeById(node.children, id);
        if (result) return result;
      }
    }
    return null;
  };

  // Helper to find parent ID of a node in the tree structure
  const findParentIdOfNode = (nodes: OrgNode[], targetId: string | number): string | number | null => {
    const traverse = (currentNodes: OrgNode[], parentId: string | number | null): string | number | null => {
      for (const node of currentNodes) {
        if (node.id === targetId || String(node.id) === String(targetId)) {
          return parentId;
        }
        if (node.children && node.children.length > 0) {
          const result = traverse(node.children, node.id);
          if (result !== null) return result;
        }
      }
      return null;
    };
    return traverse(nodes, null);
  };

  // Dedicated Drag and Drop Hook/Callback (with veto prevention capability!)
  const handleBeforeMoveNode = (
    nodeId: string | number,
    sourceParentId: string | number | null,
    targetParentId: string | number,
    actionType: 'transfer' | 'merge'
  ): boolean => {
    // Obtain name of nodes involved
    const findNodeName = (nodes: OrgNode[], id: string | number): string => {
      let foundName = String(id);
      const traverse = (currentNodes: OrgNode[]) => {
        for (const n of currentNodes) {
          if (n.id === id || String(n.id) === String(id)) {
            foundName = n.name;
            return;
          }
          if (n.children) traverse(n.children);
        }
      };
      traverse(tree || []);
      return foundName;
    };

    const nodeName = findNodeName(tree || [], nodeId);
    const sourceParentName = sourceParentId ? findNodeName(tree || [], sourceParentId) : 'ریشه اصلی';
    const targetParentName = findNodeName(tree || [], targetParentId);

    // Execute customizable validation logic
    console.log(`[DragDrop Veto callback] Node "${nodeName}" is being checked for "${actionType}" from "${sourceParentName}" to "${targetParentName}".`);
    
    // Developer customization rule example: 
    // Return false here to block designated operations dynamically.
    const blockMovement = false; // Set to true to test blocking
    if (blockMovement) {
      return false;
    }

    setDragDropLog({
      nodeName,
      sourceParentName,
      targetParentName,
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      allowed: true,
      type: actionType
    });

    return true; // Return false to completely halt the drag and drop action
  };

  // Triggered when OrgChartCanvas drops nodeId onto targetParentId
  const handleMoveNode = (nodeId: string | number, targetParentId: string | number) => {
    if (nodeId === targetParentId || String(nodeId) === String(targetParentId)) {
      alert("یک واحد فنی را نمی‌توان به خودش منتقل یا ادغام کرد.");
      return;
    }

    if (nodeId === 1 || String(nodeId) === '1') {
      alert("ریاست کل (نود اصلی چارت) را نمی‌توان جابجا یا ادغام کرد.");
      return;
    }

    const source = findNodeById(tree || [], nodeId);
    const target = findNodeById(tree || [], targetParentId);

    if (!source || !target) {
      alert("اطلاعات بخش‌های منتقل شده یافت نشد.");
      return;
    }

    // Capture nodes involved and prompt user for Transfer or Merge choice via Modal
    setDdSourceNode(source);
    setDdTargetNode(target);
    setIsDragDropConfirmOpen(true);
  };

  // Perform standard Transfer (Reparenting children)
  const handleConfirmTransfer = async () => {
    if (!ddSourceNode || !ddTargetNode) return;
    setIsDragDropConfirmOpen(false);

    const nodeId = ddSourceNode.id;
    const targetParentId = ddTargetNode.id;
    const sourceParentId = findParentIdOfNode(tree || [], nodeId);

    // Prompt developer callback
    const isAllowed = handleBeforeMoveNode(nodeId, sourceParentId, targetParentId, 'transfer');
    if (!isAllowed) {
      alert('کالبک ناظر جابجایی (Before-Move Veto) اجرای این جابجایی را منع کرد.');
      setDdSourceNode(null);
      setDdTargetNode(null);
      return;
    }

    try {
      await moveNode({ nodeId, targetParentId }).unwrap();
    } catch (err: any) {
      alert(err?.data?.error || err?.message || 'خطا در انتقال دپارتمان سازمانی.');
    } finally {
      setDdSourceNode(null);
      setDdTargetNode(null);
    }
  };

  // Perform fushion Merge (Sum employeeCount, combine active children trees)
  const handleConfirmMerge = async (newName: string) => {
    if (!ddSourceNode || !ddTargetNode) return;
    setIsDragDropConfirmOpen(false);

    const sourceNodeId = ddSourceNode.id;
    const targetNodeId = ddTargetNode.id;
    const sourceParentId = findParentIdOfNode(tree || [], sourceNodeId);

    // Prompt developer callback
    const isAllowed = handleBeforeMoveNode(sourceNodeId, sourceParentId, targetNodeId, 'merge');
    if (!isAllowed) {
      alert('کالبک ناظر جابجایی (Before-Move Veto) اجرای این ادغام را منع کرد.');
      setDdSourceNode(null);
      setDdTargetNode(null);
      return;
    }

    try {
      await mergeNodes({ sourceNodeId, targetNodeId, newName }).unwrap();
    } catch (err: any) {
      alert(err?.data?.error || err?.message || 'خطا در ادغام فیزیکی ساختارهای سازمانی.');
    } finally {
      setDdSourceNode(null);
      setDdTargetNode(null);
    }
  };

  // Triggered when a unit is edited
  const handleEditNode = (node: OrgNode) => {
    setNodeToEdit(node);
    setDefaultParentId(null);
    setIsEditorOpen(true);
  };

  // Triggered to add a sub-child to a parent node
  const handleAddChild = (parentId: number | string) => {
    setNodeToEdit(null);
    setDefaultParentId(parentId);
    setIsEditorOpen(true);
  };

  // Add an independent top-level sibling or general child
  const handleAddNewUnit = () => {
    setNodeToEdit(null);
    setDefaultParentId(1); // Defaults to attaching to the main General Office root
    setIsEditorOpen(true);
  };

  const handleReset = async () => {
    if (confirm('آیا مایل به بازنشانی اطلاعات چارت به ساختار پیش‌فرض هستید؟ تمامی تغیرات دستی شما حذف خواهد شد.')) {
      try {
        await resetChart().unwrap();
      } catch (err) {
        alert('خطا در بازنشانی داده‌ها.');
      }
    }
  };

  const handleSelectGroupFilter = (groupName: string) => {
    setSearchQuery(groupName);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden text-right select-none custom-org-tree" style={{ direction: 'rtl' }}>
      
      {/* Top Main Application Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 shadow-xs shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-650 rounded-lg flex items-center justify-center text-white shadow-xs">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-800">سامانه مدیریت ساختار سازمانی غذا و دارو</h1>
              <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full border border-indigo-100/55">داده‌های بومی</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">قابلیت گروه‌بندی نودها به صورت ابری • ترسیم خطوط هوشمند اتصال | وضعیت: متصل به سرور مرکزی (RTK Query Active)</p>
          </div>
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Info status label */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-600">
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            <span>بارگذاری آنی ساختار دپارتمانی</span>
          </div>

          <button
            onClick={handleAddNewUnit}
            className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-xs font-semibold border border-indigo-100 hover:bg-indigo-100 cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن واحد جدید +</span>
          </button>
        </div>
      </header>

      {/* Main layout divided into stats sidebar and Whiteboard Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {isLoading && !tree ? (
          /* Loading indicator template */
          <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-slate-50">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            <h5 className="text-sm font-bold text-slate-600">در حال بارگزاری ساختار درختی از دیتابیس RTK Query...</h5>
            <p className="text-xs text-slate-400">لطفاً شکیبا باشید</p>
          </div>
        ) : isError ? (
          /* Error Fallback layout */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-50 p-6">
            <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 flex items-center gap-3 max-w-md">
              <AlertCircle className="w-8 h-8 text-rose-600 shrink-0" />
              <div>
                <h6 className="font-bold text-sm">خطا در دریافت اطلاعات چارت</h6>
                <p className="text-xs mt-1 text-slate-600">
                  {error ? ((error as any).error || (error as any).message || 'خطا در بارگذاری داده‌های چارت') : 'خطای غیرمنتظره در بارگزاری بستر سرویس بازنشانی داده.'}
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="px-5 py-2 text-xs font-bold bg-slate-800 text-white rounded-xl hover:bg-slate-900 cursor-pointer"
            >
              اجبار به بازنشانی دیتای اولیه
            </button>
          </div>
        ) : tree && tree.length > 0 ? (
          /* Operational structure dashboard success layout */
          <>
            {/* Interactive chart visualizer canvas right (or center) */}
            <OrgChartCanvas
              tree={tree}
              orientation={orientation}
              setOrientation={setOrientation}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onEditNode={handleEditNode}
              onAddChild={handleAddChild}
              onResetChart={handleReset}
              onMoveNode={handleMoveNode}
            />

            {/* Flat telemetry and stats summary sidebar sitting left */}
            <SidebarStats 
              tree={tree} 
              onSelectNodeByName={handleSelectGroupFilter}
            />
          </>
        ) : (
          /* Empty/No records placeholder */
          <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-slate-50">
            <AlertCircle className="w-10 h-10 text-yellow-500" />
            <h5 className="text-sm font-semibold text-slate-600">درخت سازمانی خالی است.</h5>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              ایجاد ساختار نمونه پیش‌فرض
            </button>
          </div>
        )}
      </div>

      {/* Floating Node form editor modal drawer */}
      <NodeEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        nodeToEdit={nodeToEdit}
        defaultParentId={defaultParentId}
      />

      {/* Drag & Drop Decision dialog picker */}
      <DragDropConfirmModal
        isOpen={isDragDropConfirmOpen}
        onClose={() => {
          setIsDragDropConfirmOpen(false);
          setDdSourceNode(null);
          setDdTargetNode(null);
        }}
        sourceNodeId={ddSourceNode?.id ?? null}
        sourceNodeName={ddSourceNode?.name ?? ''}
        targetNodeId={ddTargetNode?.id ?? null}
        targetNodeName={ddTargetNode?.name ?? ''}
        onConfirmTransfer={handleConfirmTransfer}
        onConfirmMerge={handleConfirmMerge}
      />

      {/* Visual active callback logging toast */}
      {dragDropLog && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 border border-slate-700 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 max-w-sm transition-all animate-in fade-in slide-in-from-bottom duration-300">
          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 animate-pulse ${dragDropLog.type === 'merge' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <div className="flex-1 text-right">
            <h6 className={`font-extrabold text-xs ${dragDropLog.type === 'merge' ? 'text-amber-300' : 'text-indigo-300'}`}>
              {dragDropLog.type === 'merge' ? 'گزارش کالبک ادغام و یکپارچه‌سازی' : 'گزارش کالبک جابجایی دپارتمانی'}
            </h6>
            <p className="text-[11px] leading-relaxed mt-1 text-slate-300">
              {dragDropLog.type === 'merge' ? (
                <span>
                  بخش <strong className="text-white">«{dragDropLog.nodeName}»</strong> با موفقیت ذوب و با واحد منتخب <strong className="text-white">«{dragDropLog.targetParentName}»</strong> ادغام فیزیکی گردید.
                </span>
              ) : (
                <span>
                  واحد <strong className="text-white">«{dragDropLog.nodeName}»</strong> از بخش <strong className="text-white">«{dragDropLog.sourceParentName}»</strong> به عنوان فرزند دپارتمان <strong className="text-white">«{dragDropLog.targetParentName}»</strong> پیوست.
                </span>
              )}
            </p>
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800">
              <span className="text-[9px] text-slate-500 font-mono">{dragDropLog.timestamp}</span>
              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${dragDropLog.type === 'merge' ? 'bg-amber-550/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                {dragDropLog.type === 'merge' ? 'Merged Successfully' : 'Transfer Approved'}
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setDragDropLog(null)} 
            className="text-slate-400 hover:text-white font-black text-sm cursor-pointer"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <OrgChartApp />
    </Provider>
  );
}
