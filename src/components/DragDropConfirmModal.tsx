/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, FolderTree, GitMerge, Check, AlertCircle } from 'lucide-react';

interface DragDropConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceNodeId: string | number | null;
  sourceNodeName: string;
  targetNodeId: string | number | null;
  targetNodeName: string;
  onConfirmTransfer: () => void;
  onConfirmMerge: (newName: string) => void;
}

export default function DragDropConfirmModal({
  isOpen,
  onClose,
  sourceNodeId,
  sourceNodeName,
  targetNodeId,
  targetNodeName,
  onConfirmTransfer,
  onConfirmMerge
}: DragDropConfirmModalProps) {
  // Mode selection: 'transfer' or 'merge'
  const [mode, setMode] = useState<'transfer' | 'merge'>('transfer');
  
  // Custom name state for merge operation
  const [mergedName, setMergedName] = useState('');

  // Auto pre-fill merged name when source/target names change
  useEffect(() => {
    if (sourceNodeName && targetNodeName) {
      setMergedName(`اداره کل ${sourceNodeName.replace(/^(اداره کل|معاونت|واحد|دایره|بخش|دفتر|اداره)\s*/, '')} و ${targetNodeName.replace(/^(اداره کل|معاونت|واحد|دایره|بخش|دفتر|اداره)\s*/, '')}`);
    }
  }, [sourceNodeName, targetNodeName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'transfer') {
      onConfirmTransfer();
    } else {
      if (!mergedName.trim()) {
        alert('لطفاً نام نهایی نود ادغام شده را وارد نمایید.');
        return;
      }
      onConfirmMerge(mergedName.trim());
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 p-6 relative overflow-hidden text-right animate-in zoom-in-95 duration-200">
        
        {/* Header decoration */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">فرآیند جابجایی سازمانی نودها</h3>
              <p className="text-[10px] text-slate-400">تایین نوع انتقال یا ادغام در پایگاه ساختار</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Description */}
        <div className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-150/40 mb-5 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-indigo-950 font-medium">
            شما واحد <strong className="font-bold underline text-indigo-600">«{sourceNodeName}»</strong> را بر روی دپارتمان <strong className="font-bold underline text-indigo-600">«{targetNodeName}»</strong> رها ساختید. هدف نهایی شما از این اقدام چیست؟
          </p>
        </div>

        {/* Choice Radio Cards */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-35 gap-3">
            
            {/* Card Option A: TRANSFER */}
            <div 
              onClick={() => setMode('transfer')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between h-36 ${
                mode === 'transfer' 
                  ? 'border-indigo-600 bg-indigo-50/20 shadow-sm' 
                  : 'border-slate-150 bg-white hover:border-slate-200 hover:bg-slate-50/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className={`p-1.5 rounded-lg ${mode === 'transfer' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <FolderTree className="w-4 h-4" />
                </div>
                {mode === 'transfer' && (
                  <div className="w-5 h-5 bg-indigo-650 text-white rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
              <div className="mt-3">
                <h4 className={`font-bold text-xs ${mode === 'transfer' ? 'text-indigo-650' : 'text-slate-800'}`}>انتقال به زیرمجموعه (Transfer)</h4>
                <p className="text-[10px] text-slate-400 mt-1 lines-clamp-2 leading-relaxed">
                  قرار دادن واحد مبدأ به عنوان فرزندِ زیرمجموعه ساختار جدید {targetNodeName}.
                </p>
              </div>
            </div>

            {/* Card Option B: MERGE */}
            <div 
              onClick={() => setMode('merge')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between h-36 ${
                mode === 'merge' 
                  ? 'border-indigo-650 bg-indigo-50/20 shadow-sm' 
                  : 'border-slate-150 bg-white hover:border-slate-200 hover:bg-slate-50/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className={`p-1.5 rounded-lg ${mode === 'merge' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <GitMerge className="w-4 h-4" />
                </div>
                {mode === 'merge' && (
                  <div className="w-5 h-5 bg-indigo-650 text-white rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
              <div className="mt-3">
                <h4 className={`font-bold text-xs ${mode === 'merge' ? 'text-indigo-650' : 'text-slate-800'}`}>ادغام فیزیکی ساختاری (Merge)</h4>
                <p className="text-[10px] text-slate-400 mt-1 lines-clamp-2 leading-relaxed">
                  یکی‌کردن فیزیکی مابقی بخش‌ها، افزایش ظرفیت پرسنل و تجمیع پرونده با دپارتمان {targetNodeName}.
                </p>
              </div>
            </div>

          </div>

          {/* Conditional Input field for Custom name if MERGE */}
          {mode === 'merge' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 mt-4 space-y-2.5 animate-in slide-in-from-top-3 duration-200">
              <label className="block text-xs font-bold text-slate-500">نام نهایی و جایگزین برای نهاد ادغام شده:</label>
              <input 
                type="text" 
                value={mergedName}
                onChange={(e) => setMergedName(e.target.value)}
                placeholder="مثال: مدیریت یکپارچه امور ادغام شده..."
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-right"
                dir="rtl"
              />
              <p className="text-[9px] text-slate-400">
                با تایید این مرحله، پرسنل هر دو بخش بصورت خودکار با هم تجمیع شده ({sourceNodeName} منحل شده و زیرشاخه های آن نیز جابجا خواهند شد).
              </p>
            </div>
          )}

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-black bg-indigo-650 text-white hover:bg-indigo-700 rounded-xl transition-colors shadow-md shadow-indigo-600/10 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>تایید نهایی و اعمال در پایگاه</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
