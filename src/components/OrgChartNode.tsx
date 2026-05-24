/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OrgNode, DepartmentGroup, LayoutOrientation } from '../types';
import { Check, ChevronDown, ChevronLeft, ChevronUp, Users, Shield, Award, ClipboardList, Briefcase, Plus, Edit2, Columns3, Cloud, CloudOff, ZoomIn } from 'lucide-react';

interface OrgChartNodeProps {
  key?: React.Key;
  node: OrgNode;
  orientation: LayoutOrientation;
  
  // Collapse dictionaries
  collapsedNodes: { [key: string]: boolean };
  collapsedGroups: { [key: string]: boolean };
  
  // Handlers
  onToggleNode: (id: number | string) => void;
  onToggleGroup: (id: string) => void;
  onEditNode: (node: OrgNode) => void;
  onAddChild: (parentId: number | string) => void;
  
  // Highlight
  searchQuery: string;

  // Drag and Drop props
  draggedNodeId: string | number | null;
  dragOverNodeId: string | number | null;
  onDragStartNode: (e: React.DragEvent, nodeId: number | string) => void;
  onDragOverNode: (e: React.DragEvent, nodeId: number | string) => void;
  onDragLeaveNode: (e: React.DragEvent, nodeId: number | string) => void;
  onDropNode: (e: React.DragEvent, targetParentId: number | string) => void;
  onDragEndNode: (e: React.DragEvent) => void;
}

// Group partition structure
interface GroupItem {
  isGroup: true;
  group: DepartmentGroup;
  nodes: OrgNode[];
}

interface SingleItem {
  isGroup: false;
  node: OrgNode;
}

type PartitionedChild = GroupItem | SingleItem;

const DEFAULT_PORTRAITS = [
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80"
];

const getManagerAvatar = (node: OrgNode): string => {
  if (node.managerAvatar && node.managerAvatar.trim()) {
    return node.managerAvatar;
  }
  const seedString = String(node.managerName || node.name || 'avatar');
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DEFAULT_PORTRAITS.length;
  return DEFAULT_PORTRAITS[index];
};

export default function OrgChartNode({
  node,
  orientation,
  collapsedNodes,
  collapsedGroups,
  onToggleNode,
  onToggleGroup,
  onEditNode,
  onAddChild,
  searchQuery,
  draggedNodeId,
  dragOverNodeId,
  onDragStartNode,
  onDragOverNode,
  onDragLeaveNode,
  onDropNode,
  onDragEndNode
}: OrgChartNodeProps) {
  
  const isNodeCollapsed = !!collapsedNodes[node.id];
  const hasChildren = node.children && node.children.length > 0;
  
  // Partition children into grouped or un-grouped units
  const getPartitionedChildren = (childrenList: OrgNode[]): PartitionedChild[] => {
    const parted: PartitionedChild[] = [];
    const groupMap: { [groupId: string]: OrgNode[] } = {};
    const groupMetadata: { [groupId: string]: DepartmentGroup } = {};
    const orderedGroupIds: string[] = [];

    childrenList.forEach((child) => {
      if (child.department_group && child.department_group.id) {
        const gId = child.department_group.id;
        if (!groupMap[gId]) {
          groupMap[gId] = [];
          orderedGroupIds.push(gId);
          groupMetadata[gId] = child.department_group;
        }
        groupMap[gId].push(child);
      } else {
        parted.push({ isGroup: false, node: child });
      }
    });

    orderedGroupIds.forEach((gId) => {
      parted.push({
        isGroup: true,
        group: groupMetadata[gId],
        nodes: groupMap[gId],
      });
    });

    return parted;
  };

  const partitionedChildren = hasChildren ? getPartitionedChildren(node.children || []) : [];

  // Match node hierarchy design colors
  const getTypeStyling = (type: OrgNode['type']) => {
    switch (type) {
      case 'general_office': // ریاست کل
        return {
          cardBg: 'bg-white text-slate-800',
          border: 'border-2 border-indigo-650',
          badgeBg: 'bg-indigo-100 text-indigo-800',
          label: 'ریاست کل',
          shadow: 'shadow-xl shadow-indigo-100/40',
          icon: <Award className="w-5 h-5 text-indigo-600" />
        };
      case 'office': // معاونت
        return {
          cardBg: 'bg-white text-slate-800',
          border: 'border-r-4 border-emerald-500 border-y border-l border-slate-200',
          badgeBg: 'bg-emerald-50 text-emerald-700',
          label: 'معاونت کل',
          shadow: 'shadow-md shadow-slate-200/40',
          icon: <Shield className="w-5 h-5 text-emerald-600" />
        };
      case 'department': // اداره
        return {
          cardBg: 'bg-white text-slate-800',
          border: 'border-r-4 border-blue-500 border-y border-l border-slate-200',
          badgeBg: 'bg-blue-50 text-blue-700',
          label: 'اداره کل عمومی',
          shadow: 'shadow-md shadow-slate-200/40',
          icon: <Briefcase className="w-4 h-4 text-blue-500" />
        };
      case 'committee': // آزمایشگاه یا کارگروه خاص
        return {
          cardBg: 'bg-white text-slate-800',
          border: 'border-r-4 border-amber-500 border-y border-l border-slate-200',
          badgeBg: 'bg-amber-50 text-amber-700',
          label: 'آزمایشگاه / کمیته تخصصی',
          shadow: 'shadow-md shadow-slate-200/40',
          icon: <ClipboardList className="w-4 h-4 text-amber-600" />
        };
      case 'staff': // دایره یا دفتر ستاد
      default:
        return {
          cardBg: 'bg-white text-slate-700',
          border: 'border-r-4 border-slate-300 border-y border-l border-slate-200',
          badgeBg: 'bg-slate-50 text-slate-600',
          label: 'دایره / بخش فرعی',
          shadow: 'shadow-xs',
          icon: <Users className="w-4 h-4 text-slate-400" />
        };
    }
  };

  const styling = getTypeStyling(node.type);

  // Check if this node matches research keywords
  const isMatch = searchQuery 
    ? node.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      node.managerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.department_number?.includes(searchQuery) ||
      node.role?.toLowerCase().includes(searchQuery.toLowerCase())
    : false;

  // Visual layout configurations (Vertical layout is traditional, Horizontal layout is RTL cascade)
  const isTopDown = orientation !== 'horizontal';
  const isVertical = orientation !== 'horizontal';

  return (
    <div className={`flex ${isTopDown ? 'flex-col items-center' : 'flex-row items-center'} relative`}>
      
      {/* Node Box container block */}
      <motion.div 
        layout="position"
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        draggable={node.id !== 1 && String(node.id) !== '1'}
        onDragStart={(e) => onDragStartNode(e, node.id)}
        onDragOver={(e) => onDragOverNode(e, node.id)}
        onDragLeave={(e) => onDragLeaveNode(e, node.id)}
        onDrop={(e) => onDropNode(e, node.id)}
        onDragEnd={onDragEndNode}
        className={`relative z-10 flex flex-col p-4 w-66 rounded-2xl group transition-all duration-300 ${styling.cardBg} ${styling.border} ${styling.shadow} ${
          isMatch ? 'ring-4 ring-offset-2 ring-emerald-500' : ''
        } ${
          node.id !== 1 && String(node.id) !== '1' ? 'cursor-grab active:cursor-grabbing' : ''
        } ${
          (draggedNodeId === node.id || String(draggedNodeId) === String(node.id)) ? 'opacity-40 border-dashed border-indigo-400' : 'hover:scale-[1.03]'
        } ${
          (dragOverNodeId === node.id || String(dragOverNodeId) === String(node.id)) ? 'ring-4 ring-indigo-500 ring-offset-2 scale-[1.05]' : ''
        }`}
      >
        {/* Upper Accent Bar / Type Indicator */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styling.badgeBg}`}>
            {node.department_number ? `کد: ${node.department_number}` : styling.label}
          </span>
          <div className="flex gap-1">
            {styling.icon}
          </div>
        </div>

        {/* Name */}
        <h4 className="text-sm font-black leading-snug tracking-tight mb-1 text-right">
          {node.name}
        </h4>

        {/* Manager Name */}
        {node.managerName && (
          <div className="text-xs text-slate-600 mt-2.5 flex items-center gap-2.5 justify-start text-right">
            <img 
              src={getManagerAvatar(node)} 
              alt={node.managerName} 
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover border border-slate-150 shadow-xs shrink-0"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(node.managerName || 'avatar')}`;
              }}
            />
            <div className="flex flex-col text-right">
              <span className="font-bold text-slate-800 text-xs">{node.managerName}</span>
              {node.role && <span className="text-[9px] text-slate-500 font-medium mt-0.5">{node.role}</span>}
            </div>
          </div>
        )}

        {/* Employee Count Footer Section */}
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <Users className="w-3" style={{ height: '12px' }} />
            <span>{node.employeeCount || 0} نفر پرسنل</span>
          </div>
          {node.department_group && (
            <span className="bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded-md text-[9px] border border-indigo-100 truncate max-w-28">
              {node.department_group.name}
            </span>
          )}
        </div>

        {/* Hover Action Overlay Toolbar */}
        <div className="absolute top-2 left-2 flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Edit Button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEditNode(node); }}
            title="ویرایش این واحد"
            className="p-1 text-slate-800 bg-white/90 hover:bg-white rounded-md shadow-xs border border-slate-200 transition-all cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
          </button>
          {/* Add Child Button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
            title="افزودن زیرواحد جدید"
            className="p-1 text-slate-800 bg-white/90 hover:bg-white rounded-md shadow-xs border border-slate-200 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
          </button>
        </div>

        {/* Expand / Collapse trigger badge (At node bottom/left) */}
        {hasChildren && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleNode(node.id); }}
            className={`absolute ${
              isVertical ? '-bottom-3 left-1/2 -translate-x-1/2' : 'top-1/2 -left-3 -translate-y-1/2'
            } w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-md border border-slate-200 transition-transform duration-200 hover:scale-110 text-slate-600 cursor-pointer hover:text-indigo-600 z-20`}
          >
            {isVertical ? (
              isNodeCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
            ) : (
              isNodeCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}
      </motion.div>

      {/* Render connections and child elements recursively */}
      <AnimatePresence initial={false}>
        {hasChildren && !isNodeCollapsed && (() => {
          // Style config for children and sibling structures
          let childrenContainerClass = '';
          let siblingWrapperClass = '';
          let parentConnectorEl = null;

          if (orientation === 'horizontal') {
            childrenContainerClass = 'flex-row items-center pr-6 relative';
            siblingWrapperClass = 'flex flex-col justify-center relative';
            parentConnectorEl = <div className="absolute right-0 top-1/2 h-px bg-slate-300 w-6 -translate-y-1/2" />;
          } else if (orientation === 'left-cascade') {
            childrenContainerClass = 'flex-col items-start w-full pt-6 relative pl-14 pr-4';
            siblingWrapperClass = 'flex flex-col items-start relative w-full';
            parentConnectorEl = (
              <>
                {/* Vertical line down from center of parent card to top-24px level */}
                <div className="absolute top-0 left-1/2 w-px bg-slate-300 h-6 -translate-x-1/2" />
                {/* Horizontal segment connecting center-line to the left vertical spine at 40px from left */}
                <div className="absolute top-[24px] left-[40px] right-1/2 h-px bg-slate-300" />
              </>
            );
          } else if (orientation === 'right-cascade') {
            childrenContainerClass = 'flex-col items-end w-full pt-6 relative pr-14 pl-4';
            siblingWrapperClass = 'flex flex-col items-end relative w-full';
            parentConnectorEl = (
              <>
                {/* Vertical line down from center of parent card to top-24px level */}
                <div className="absolute top-0 left-1/2 w-px bg-slate-300 h-6 -translate-x-1/2" />
                {/* Horizontal segment connecting center-line to the right vertical spine at 40px from right */}
                <div className="absolute top-[24px] right-[40px] left-1/2 h-px bg-slate-300" />
              </>
            );
          } else if (orientation === 'centered-column') {
            childrenContainerClass = 'flex-col items-center w-full pt-6 relative';
            siblingWrapperClass = 'flex flex-col items-center relative w-full';
            parentConnectorEl = <div className="absolute top-0 left-1/2 w-px bg-slate-300 h-6 -translate-x-1/2" />;
          } else if (orientation === 'split-columns') {
            childrenContainerClass = 'flex-col items-center w-full pt-6 relative';
            siblingWrapperClass = 'flex flex-col items-center relative w-full max-w-4xl';
            parentConnectorEl = <div className="absolute top-0 left-1/2 w-px bg-slate-300 h-6 -translate-x-1/2" />;
          } else {
            // Default 'vertical' (Classic branching)
            childrenContainerClass = 'flex-col items-center w-full pt-6 relative';
            siblingWrapperClass = 'flex flex-row items-start justify-center relative';
            parentConnectorEl = <div className="absolute top-0 left-1/2 w-px bg-slate-300 h-6 -translate-x-1/2" />;
          }

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className={`flex ${childrenContainerClass}`}
            >
              {parentConnectorEl}

              {/* Sibling rows/columns wrapper */}
              <div className={`flex ${siblingWrapperClass}`}>
                
                {partitionedChildren.map((childItem, idx) => {
                  const totalChildrenCount = partitionedChildren.length;
                  const isFirst = idx === 0;
                  const isLast = idx === totalChildrenCount - 1;
                  const isSingle = totalChildrenCount === 1;

                  // Determine child card position layout class
                  let childItemClass = '';
                  let connectorLinesEl: React.ReactNode = null;

                  if (orientation === 'horizontal') {
                    childItemClass = 'relative flex flex-row items-center pr-6 py-3 w-full';
                    connectorLinesEl = (
                      <>
                        <div className="absolute right-0 top-1/2 h-px bg-slate-300 w-6 -translate-y-1/2" />
                        {!isSingle && (
                          <div className={`absolute right-0 w-px bg-slate-300 ${
                            isFirst ? 'top-1/2 bottom-0' : isLast ? 'bottom-1/2 top-0' : 'top-0 bottom-0'
                          }`} />
                        )}
                      </>
                    );
                  } else if (orientation === 'left-cascade') {
                    childItemClass = 'relative flex flex-col items-start w-full pt-2 pb-2';
                    connectorLinesEl = (
                      <>
                        {/* Vertical spine down on the left side */}
                        {!isLast && (
                          <div className="absolute top-0 bottom-0 left-[-16px] w-px bg-slate-300" />
                        )}
                        {isLast && (
                          <div className="absolute top-0 bottom-1/2 left-[-16px] w-px bg-slate-300" />
                        )}
                        {/* Horizontal connector from left spine to left of the child node card */}
                        <div className="absolute top-1/2 left-[-16px] w-[16px] h-px bg-slate-300 -translate-y-1/2" />
                      </>
                    );
                  } else if (orientation === 'right-cascade') {
                    childItemClass = 'relative flex flex-col items-end w-full pt-2 pb-2';
                    connectorLinesEl = (
                      <>
                        {/* Vertical spine down on the right side */}
                        {!isLast && (
                          <div className="absolute top-0 bottom-0 right-[-16px] w-px bg-slate-300" />
                        )}
                        {isLast && (
                          <div className="absolute top-0 bottom-1/2 right-[-16px] w-px bg-slate-300" />
                        )}
                        {/* Horizontal connector from right spine to right of the child node card */}
                        <div className="absolute top-1/2 right-[-16px] w-[16px] h-px bg-slate-300 -translate-y-1/2" />
                      </>
                    );
                  } else if (orientation === 'centered-column') {
                    childItemClass = 'relative flex flex-col items-center pt-6 pb-6 w-full';
                    connectorLinesEl = (
                      <>
                        {/* Direct vertical spine right behind the child cards */}
                        {!isLast && (
                          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-300 -translate-x-1/2" />
                        )}
                        {isLast && (
                          <div className="absolute top-0 bottom-1/2 left-1/2 w-px bg-slate-300 -translate-x-1/2" />
                        )}
                      </>
                    );
                  } else if (orientation === 'split-columns') {
                    const isLeftColumn = idx % 2 === 0;
                    childItemClass = isLeftColumn 
                      ? 'relative w-full flex justify-end py-4 pr-[calc(50%+32px)]' 
                      : 'relative w-full flex justify-start py-4 pl-[calc(50%+32px)]';
                    
                    connectorLinesEl = (
                      <>
                        {/* Central spine going down */}
                        {!isLast && (
                          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-300 -translate-x-1/2" />
                        )}
                        {isLast && (
                          <div className="absolute top-0 bottom-1/2 left-1/2 w-px bg-slate-300 -translate-x-1/2" />
                        )}
                        
                        {/* Horizontal branch line from central spine at 50% to card edge */}
                        {isLeftColumn ? (
                          <div className="absolute top-1/2 left-1/2 w-8 h-px bg-slate-300 -translate-y-1/2 -translate-x-full" />
                        ) : (
                          <div className="absolute top-1/2 left-1/2 w-8 h-px bg-slate-300 -translate-y-1/2" />
                        )}
                      </>
                    );
                  } else {
                    // Default 'vertical' (Classic branching layout)
                    childItemClass = 'relative flex flex-col items-center pt-6 px-3';
                    connectorLinesEl = (
                      <>
                        <div className="absolute top-0 left-1/2 w-px bg-slate-300 h-6 -translate-x-1/2" />
                        {!isSingle && (
                          <div className={`absolute top-0 h-px bg-slate-300 ${
                            isFirst ? 'left-0 right-1/2' : isLast ? 'right-0 left-1/2' : 'left-0 right-0'
                          }`} />
                        )}
                      </>
                    );
                  }

                  if (childItem.isGroup) {
                    // This is a dynamic Department Group cloud container!
                    const gId = childItem.group.id;
                    const isGroupCollapsed = !!collapsedGroups[gId];
                    
                    return (
                      <div
                        key={`group-${gId}`}
                        className={childItemClass}
                      >
                        {connectorLinesEl}

                        {/* Group boundary frame (The Group Cloud) */}
                        <div className="bg-blue-50/40 border-2 border-dashed border-blue-200 rounded-[2rem] p-6 shadow-xs hover:border-blue-300 transition-all text-center flex flex-col items-center relative gap-4">
                          
                          {/* Cloud shape background indicator */}
                          <div className="absolute -top-3 right-4 flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200 shadow-xs">
                            <Cloud className="w-3.5 h-3.5 text-blue-500 fill-blue-100" />
                            <span>{childItem.group.name}</span>
                            <button
                              type="button"
                              onClick={() => onToggleGroup(gId)}
                              className="mr-1.5 p-0.5 rounded hover:bg-blue-100 cursor-pointer text-blue-900"
                              title={isGroupCollapsed ? "نمایش همکاران گروه" : "جمع کردن گروه دپارتمانی"}
                            >
                              {isGroupCollapsed ? (
                                <Plus className="w-3.5 h-3.5 font-bold" />
                              ) : (
                                <ChevronUp className="w-3.5 h-3.5 font-bold" />
                              )}
                            </button>
                          </div>

                          {/* If Group is expanded, draw sub-nodes side by side */}
                          {!isGroupCollapsed ? (
                            <div className={`flex ${isTopDown ? 'flex-row gap-4 pt-2' : 'flex-col gap-4 pt-2'}`}>
                              {childItem.nodes.map((subNode) => (
                                <OrgChartNode
                                  key={subNode.id}
                                  node={subNode}
                                  orientation={orientation}
                                  collapsedNodes={collapsedNodes}
                                  collapsedGroups={collapsedGroups}
                                  onToggleNode={onToggleNode}
                                  onToggleGroup={onToggleGroup}
                                  onEditNode={onEditNode}
                                  onAddChild={onAddChild}
                                  searchQuery={searchQuery}
                                  draggedNodeId={draggedNodeId}
                                  dragOverNodeId={dragOverNodeId}
                                  onDragStartNode={onDragStartNode}
                                  onDragOverNode={onDragOverNode}
                                  onDragLeaveNode={onDragLeaveNode}
                                  onDropNode={onDropNode}
                                  onDragEndNode={onDragEndNode}
                                />
                              ))}
                            </div>
                          ) : (
                            /* Group collapsed placeholder */
                            <div 
                              className="pt-2 px-6 flex flex-col items-center cursor-pointer text-slate-500 hover:text-blue-600 self-center"
                              onClick={() => onToggleGroup(gId)}
                            >
                              <CloudOff className="w-8 h-8 opacity-40 text-blue-500" />
                              <div className="text-[10px] font-bold mt-1 text-blue-700 bg-blue-100/50 px-2 py-0.5 rounded-full border border-blue-200/50">
                                ({childItem.nodes.length} واحد پنهان شده)
                              </div>
                              <span className="text-[10px] text-slate-400 mt-1">جهت بسط کلیک کنید</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    // Direct Un-grouped Node
                    const singleNode = (childItem as SingleItem).node;
                    
                    return (
                      <div
                        key={singleNode.id}
                        className={childItemClass}
                      >
                        {connectorLinesEl}

                        {/* Recurse OrgChartNode */}
                        <OrgChartNode
                          node={singleNode}
                          orientation={orientation}
                          collapsedNodes={collapsedNodes}
                          collapsedGroups={collapsedGroups}
                          onToggleNode={onToggleNode}
                          onToggleGroup={onToggleGroup}
                          onEditNode={onEditNode}
                          onAddChild={onAddChild}
                          searchQuery={searchQuery}
                          draggedNodeId={draggedNodeId}
                          dragOverNodeId={dragOverNodeId}
                          onDragStartNode={onDragStartNode}
                          onDragOverNode={onDragOverNode}
                          onDragLeaveNode={onDragLeaveNode}
                          onDropNode={onDropNode}
                          onDragEndNode={onDragEndNode}
                        />
                      </div>
                    );
                  }
                })}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
