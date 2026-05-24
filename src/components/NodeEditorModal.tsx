/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { OrgNode, DepartmentGroup } from '../types';
import { useAddNodeMutation, useUpdateNodeMutation, useGetOrgChartQuery, useDeleteNodeMutation } from '../store/api';
import { X, Plus, Trash2, Edit2, ShieldAlert } from 'lucide-react';

interface NodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeToEdit?: OrgNode | null; // If provided, we are editing. Otherwise, we are adding.
  defaultParentId?: number | string | null;
}

export default function NodeEditorModal({ isOpen, onClose, nodeToEdit, defaultParentId }: NodeEditorModalProps) {
  const { data: orgTree } = useGetOrgChartQuery(undefined, {
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  const [addNode, { isLoading: isAdding }] = useAddNodeMutation();
  const [updateNode, { isLoading: isUpdating }] = useUpdateNodeMutation();
  const [deleteNode, { isLoading: isDeleting }] = useDeleteNodeMutation();

  // Form Fields
  const [name, setName] = useState('');
  const [departmentNumber, setDepartmentNumber] = useState('');
  const [role, setRole] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerAvatar, setManagerAvatar] = useState('');
  const [employeeCount, setEmployeeCount] = useState<number>(5);
  const [type, setType] = useState<OrgNode['type']>('department');
  
  // Grouping fields
  const [hasGroup, setHasGroup] = useState(false);
  const [groupId, setGroupId] = useState('');
  const [groupName, setGroupName] = useState('');

  // Parent selection (only for adding new nodes)
  const [parentId, setParentId] = useState<number | string>('');

  // Collect all nodes to populate parent selector or existing group selector
  const [allNodesList, setAllNodesList] = useState<{ id: number | string; name: string }[]>([]);
  const [existingGroups, setExistingGroups] = useState<DepartmentGroup[]>([]);

  useEffect(() => {
    if (!orgTree) return;

    // Flatten tree to get a clean list of all nodes
    const list: { id: number | string; name: string }[] = [];
    const groupsMap = new Map<string, string>();

    const traverse = (nodes: OrgNode[]) => {
      nodes.forEach(node => {
        list.push({ id: node.id, name: node.name });
        if (node.department_group && node.department_group.id) {
          groupsMap.set(node.department_group.id, node.department_group.name);
        }
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    traverse(orgTree);
    setAllNodesList(list);

    const groups: DepartmentGroup[] = [];
    groupsMap.forEach((name, id) => {
      groups.push({ id, name });
    });
    setExistingGroups(groups);
  }, [orgTree]);

  // Set fields based on edit vs add mode
  useEffect(() => {
    if (nodeToEdit) {
      setName(nodeToEdit.name);
      setDepartmentNumber(nodeToEdit.department_number || '');
      setRole(nodeToEdit.role || '');
      setManagerName(nodeToEdit.managerName || '');
      setManagerAvatar(nodeToEdit.managerAvatar || '');
      setEmployeeCount(nodeToEdit.employeeCount || 0);
      setType(nodeToEdit.type || 'department');
      if (nodeToEdit.department_group) {
        setHasGroup(true);
        setGroupId(nodeToEdit.department_group.id);
        setGroupName(nodeToEdit.department_group.name);
      } else {
        setHasGroup(false);
        setGroupId('');
        setGroupName('');
      }
    } else {
      setName('');
      setDepartmentNumber('');
      setRole('');
      setManagerName('');
      setManagerAvatar('');
      setEmployeeCount(5);
      setType('department');
      setHasGroup(false);
      setGroupId('');
      setGroupName('');
      setParentId(defaultParentId ? String(defaultParentId) : '1');
    }
  }, [nodeToEdit, defaultParentId, isOpen]);

  if (!isOpen) return null;

  // Handle group preset selection
  const handleGroupPresetChange = (selectedId: string) => {
    if (selectedId === 'new') {
      setGroupId('');
      setGroupName('');
    } else {
      const g = existingGroups.find(x => x.id === selectedId);
      if (g) {
        setGroupId(g.id);
        setGroupName(g.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('لطفاً نام واحد یا اداره را وارد کنید.');
      return;
    }

    const deptGroup = hasGroup && groupId && groupName 
      ? { id: groupId, name: groupName } 
      : null;

    const nodeData = {
      name: name.trim(),
      department_number: departmentNumber.trim(),
      role: role.trim(),
      managerName: managerName.trim(),
      managerAvatar: managerAvatar.trim(),
      employeeCount: Number(employeeCount),
      type,
      department_group: deptGroup,
    };

    try {
      if (nodeToEdit) {
        // Edit mode
        await updateNode({
          ...nodeToEdit,
          ...nodeData
        }).unwrap();
      } else {
        // Add mode
        const chosenParentId = isNaN(Number(parentId)) ? parentId : Number(parentId);
        await addNode({
          parentId: chosenParentId,
          node: nodeData
        }).unwrap();
      }
      onClose();
    } catch (err: any) {
      alert(`خطا در ثبت اطلاعات: ${err.message || JSON.stringify(err)}`);
    }
  };

  const handleDelete = async () => {
    if (!nodeToEdit) return;
    if (confirm(`آیا از حذف "${nodeToEdit.name}" اطمینان دارید؟ در صورت حذف، زیرشاخه‌های آن به نود بالاتر متصل می‌شوند.`)) {
      try {
        await deleteNode(nodeToEdit.id).unwrap();
        onClose();
      } catch (err: any) {
        alert(`خطا در حذف نود: ${err.message || 'خطای غیرمنتظره'}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs custom-org-tree">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {nodeToEdit ? (
              <>
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <span>ویرایش واحد سازمانی</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>افزودن واحد جدید</span>
              </>
            )}
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Node Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              نام واحد سازمانی <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: اداره نظارت بر مواد بیولوژیک"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Dept Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">کد واحد / شماره دپارتمان</label>
              <input
                type="text"
                placeholder="مثال: 1234"
                value={departmentNumber}
                onChange={(e) => setDepartmentNumber(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
              />
            </div>

            {/* Employee Count */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">تعداد پرسنل واحد</label>
              <input
                type="number"
                min="0"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Manager Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">نام مسئول / مدیر واحد</label>
              <input
                type="text"
                placeholder="مثال: دکتر سعیدی"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
              />
            </div>

            {/* Role Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">عنوان پست سازمانی</label>
              <input
                type="text"
                placeholder="مثال: رئیس اداره"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
              />
            </div>
          </div>

          {/* Manager Avatar URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">آدرس عکس / آواتار مدیر (دلخواه)</label>
            <input
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={managerAvatar}
              onChange={(e) => setManagerAvatar(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs text-left transition-all placeholder:text-right"
              dir="ltr"
            />
            <p className="text-[10px] text-slate-400 mt-1 text-right">در صورت خالی رها ساختن، آواتار مناسب با نام شخص به صورت هوشمند تخصیص می‌یابد.</p>
          </div>

          {/* Type Styling Option */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">سطح و نوع واحد (جهت استایل‌دهی)</label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { value: 'general_office', label: 'اداره کل', bg: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
                { value: 'office', label: 'معاونت', bg: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                { value: 'department', label: 'اداره', bg: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
                { value: 'committee', label: 'آزمایشگاه/کمیته', bg: 'bg-amber-50 border-amber-200 text-amber-700' },
                { value: 'staff', label: 'دایره / دفتر', bg: 'bg-rose-50 border-rose-200 text-rose-700' }
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setType(item.value as any)}
                  className={`py-2 px-1 text-center border rounded-xl text-xs transition-all flex flex-col items-center justify-center cursor-pointer ${
                    type === item.value 
                      ? `${item.bg} ring-2 ring-indigo-500 font-bold border-transparent` 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parent selection (only for adding) */}
          {!nodeToEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">انتخاب والد (تحت نظارت واحد)</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
              >
                {allNodesList.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Department Group Area */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasGroup}
                  onChange={(e) => setHasGroup(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded-sm focus:ring-emerald-500"
                />
                <span className="text-sm font-bold text-slate-700">عضویت در یک «گروه دپارتمانی» / ابر حاکمیتی</span>
              </label>
              {hasGroup && (
                <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
                  قابلیت گروه‌بندی نودها
                </span>
              )}
            </div>

            {hasGroup && (
              <div className="space-y-3 pt-2 border-t border-slate-200/60 animate-fade-in">
                {existingGroups.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">انتخاب از گروه‌های موجود</label>
                    <select
                      onChange={(e) => handleGroupPresetChange(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      defaultValue=""
                    >
                      <option value="new">-- ایجاد یک گروه جدید --</option>
                      {existingGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} (شناسه: {g.id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">نام گروه بالای سر (مثال: گروه پشتیبانی)</label>
                    <input
                      type="text"
                      placeholder="امور پشتیبانی و اداری"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">شناسه گروه (انگلیسی، مانند: g1)</label>
                    <input
                      type="text"
                      placeholder="g1"
                      value={groupId}
                      onChange={(e) => setGroupId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden text-xs"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed text-justify">
                  نودهایی که متعلق به گروه دپارتمانی با شناسه یکسان باشند، در چارت کنار هم جمع شده و در ابری به نام گروه قرار می‌گیرند. این گروه دارای قابلیت جمع شدن/باز شدن اختصاصی است.
                </p>
              </div>
            )}
          </div>

          {/* Delete Danger Zone */}
          {nodeToEdit && nodeToEdit.id !== 1 && (
            <div className="mt-6 pt-4 border-t border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <ShieldAlert className="w-5 h-5" />
                <span className="text-xs text-slate-500">حذف نود و اتصال فرزندان به رده بالاتر</span>
              </div>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-xl transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف این اداره</span>
              </button>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isAdding || isUpdating}
              className="px-6 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50"
            >
              {isAdding || isUpdating ? 'در حال ثبت...' : 'ثبت نهایی'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
