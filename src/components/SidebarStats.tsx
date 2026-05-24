/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { OrgNode, DepartmentGroup } from '../types';
import { Shield, Award, Users, Layers, Cloud, Sparkles, Download, Upload, Copy, Check } from 'lucide-react';
import { useSaveWholeTreeMutation } from '../store/api';

interface SidebarStatsProps {
  tree: OrgNode[];
  onSelectNodeByName: (name: string) => void;
}

export default function SidebarStats({ tree, onSelectNodeByName }: SidebarStatsProps) {
  const [saveWholeTree] = useSaveWholeTreeMutation();
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonEditor, setShowJsonEditor] = useState(false);

  // Calculation states
  const [stats, setStats] = useState({
    totalUnits: 0,
    totalEmployees: 0,
    groupCount: 0,
    groupsList: [] as { id: string; name: string; count: number }[],
    byType: {
      general_office: 0,
      office: 0,
      department: 0,
      committee: 0,
      staff: 0,
    }
  });

  useEffect(() => {
    let units = 0;
    let employees = 0;
    const groupsMap = new Map<string, { name: string; count: number }>();
    const typesCount = {
      general_office: 0,
      office: 0,
      department: 0,
      committee: 0,
      staff: 0,
    };

    const traverse = (elements: OrgNode[]) => {
      elements.forEach((item) => {
        units++;
        employees += item.employeeCount || 0;
        
        // Count Tiers
        if (item.type && typesCount[item.type] !== undefined) {
          typesCount[item.type]++;
        } else {
          typesCount.staff++;
        }

        // Count Groups
        if (item.department_group && item.department_group.id) {
          const g = item.department_group;
          const existing = groupsMap.get(g.id);
          if (existing) {
            existing.count++;
          } else {
            groupsMap.set(g.id, { name: g.name, count: 1 });
          }
        }

        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      });
    };

    traverse(tree);

    const groupsList: { id: string; name: string; count: number }[] = [];
    groupsMap.forEach((val, key) => {
      groupsList.push({ id: key, name: val.name, count: val.count });
    });

    setStats({
      totalUnits: units,
      totalEmployees: employees,
      groupCount: groupsList.length,
      groupsList,
      byType: typesCount,
    });
  }, [tree]);

  // Export dataset as downloadable file
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tree, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "org_chart_data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(tree, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportJSON = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0].name) {
        alert('ساختار فایل معتبر نیست. ریشه آرایه فرعی باید حداقل یک فیلد نام داشته باشد.');
        return;
      }
      await saveWholeTree(parsed).unwrap();
      alert('چارت سازمانی شما با موفقیت به روز گردید!');
      setShowJsonEditor(false);
    } catch (e) {
      alert('خطا در پارس کردن فایل JSON. لطفاً خطاهای سینتکس را بررسی کنید.');
    }
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden custom-org-tree select-none shrink-0 hidden lg:flex">
      
      {/* Upper Logo / Banner */}
      <div className="p-5 border-b border-slate-100 bg-linear-to-b from-slate-50 to-white">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2 bg-indigo-650 text-white rounded-xl shadow-md shadow-indigo-500/10">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-slate-900">سامانه مدیریت ساختار</h1>
            <p className="text-[10px] text-slate-400 font-bold">سازمان‌نگار دیجیتال و تراز شده</p>
          </div>
        </div>
      </div>

      {/* Main Stats / Panels panel body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        
        {/* Metric score blocks */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 mb-2 border-b border-slate-50 pb-1">آمار کلی چارت فعلی</h3>
          <div className="grid grid-cols-1 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-right">
              <span className="text-[10px] text-slate-400 block font-bold mb-1">تعداد کل واحدها</span>
              <span className="text-xl font-black text-slate-800">{stats.totalUnits} واحد فعال</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">زیراداره ممیز شده در سازمان</span>
            </div>
            <div className="p-4 bg-indigo-900 rounded-xl text-white shadow-md shadow-indigo-950/20 text-right">
              <p className="text-xs opacity-70 mb-1 font-bold">کل پرسنل شاغل</p>
              <p className="text-2xl font-black">{stats.totalEmployees.toLocaleString('fa-IR')} نفر</p>
              <span className="text-[9px] opacity-60 block mt-0.5">وضعیت: بارگذاری آنلاین (RTK Query Active)</span>
            </div>
          </div>
        </div>

        {/* Legend describing node boxes */}
        <div>
          <h3 className="text-xs font-black text-slate-400 mb-2 border-b border-slate-50 pb-1">راهنمای سطوح چارت</h3>
          <div className="space-y-1.5">
            {[
              { label: 'ریاست کل / اداره کل', count: stats.byType.general_office, bg: 'border-2 border-indigo-650 bg-white' },
              { label: 'معاونت‌ها / شعب ارشد', count: stats.byType.office, bg: 'border-r-4 border-emerald-500 border-y border-l border-slate-200 bg-white' },
              { label: 'ادارات تابعه عمومی', count: stats.byType.department, bg: 'border-r-4 border-blue-500 border-y border-l border-slate-200 bg-white' },
              { label: 'کارگروه / کمیته آزمایشگاه', count: stats.byType.committee, bg: 'border-r-4 border-amber-500 border-y border-l border-slate-200 bg-white' },
              { label: 'دایره / بخشهای فرعی و ستاد', count: stats.byType.staff, bg: 'border-r-4 border-slate-300 border-y border-l border-slate-200 bg-white' }
            ].map((leg, i) => (
              <div key={i} className="flex items-center justify-between text-xs p-2 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all">
                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-sm ${leg.bg} shrink-0`} />
                  <span className="text-slate-600 font-medium">{leg.label}</span>
                </div>
                <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded-full">
                  {leg.count} واحد
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Group Clouds index directory */}
        <div>
          <div className="flex items-center justify-between mb-2 border-b border-slate-50 pb-1">
            <h3 className="text-xs font-black text-slate-400">گروه‌های ابری فعال ({stats.groupCount})</h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-100">
              <Cloud className="w-2.5 h-2.5 text-blue-500 fill-blue-100" />
              ابر همکاران
            </span>
          </div>

          {stats.groupsList.length > 0 ? (
            <div className="space-y-1.5">
              {stats.groupsList.map((g) => (
                <button
                  key={g.id}
                  onClick={() => onSelectNodeByName(g.name)}
                  className="w-full text-right p-2 text-xs rounded-xl border border-blue-100/50 bg-blue-50/20 hover:bg-blue-50/70 hover:border-blue-300 transition-all text-slate-700 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-semibold truncate">{g.name}</span>
                  <span className="text-[10px] bg-blue-50 text-blue-800 font-black px-2 py-0.5 rounded-full border border-blue-100/40">
                    {g.count} اداره تابعه
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-[10px] text-slate-400">
              هیچ گروه ابری تعریف نشده است.
            </div>
          )}
        </div>

        {/* JSON Import/Export backup panel */}
        <div className="pt-2">
          <h3 className="text-xs font-black text-slate-400 mb-2 border-b border-slate-50 pb-1">مدیریت فایل پشتیبان ساختار</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportJSON}
              className="py-2 text-xs border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-50 cursor-pointer transition-all font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>دانلود فایل JSON</span>
            </button>
            <button
              onClick={handleCopyJSON}
              className="py-2 text-xs border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-50 cursor-pointer transition-all font-semibold"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی کد JSON</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={() => {
              setShowJsonEditor(!showJsonEditor);
              setJsonInput(JSON.stringify(tree, null, 2));
            }}
            className="w-full mt-2 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer text-center"
          >
            {showJsonEditor ? 'پنهان کردن جعبه آپلود' : 'آپلود کدهای درختی جدید'}
          </button>

          {showJsonEditor && (
            <div className="mt-2 space-y-2 animate-fade-in">
              <textarea
                rows={6}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full p-2 font-mono text-[9px] bg-slate-50 border border-slate-200 rounded-lg text-left direction-ltr focus:outline-hidden"
                placeholder="آرایه ساختار درختی را در اینجا برای درج قرار دهید..."
              />
              <button
                type="button"
                onClick={handleImportJSON}
                className="w-full py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold cursor-pointer"
              >
                اعمال سریع آپلود جدید
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Aesthetic Footer Credit */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
        <span className="text-[10px] text-slate-400 font-bold block">قدرت گرفته از فناوری ReactJS & RTK Query</span>
      </div>

    </div>
  );
}
