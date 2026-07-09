import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  Check, 
  AlertTriangle, 
  Database, 
  Info,
  ShieldCheck
} from 'lucide-react';
import { GymState } from '../types';
import { exportStateAsJSON, validateAndParseImport } from '../utils';
import { INITIAL_GYM_STATE } from '../initialData';

interface DataBackupScreenProps {
  state: GymState;
  onUpdateState: (newState: GymState) => void;
}

export default function DataBackupScreen({ state, onUpdateState }: DataBackupScreenProps) {
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleExport = () => {
    exportStateAsJSON(state);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess(false);
    
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsedState = validateAndParseImport(text);
      
      if (parsedState) {
        onUpdateState(parsedState);
        setImportSuccess(true);
        // Clear input value so same file can be imported again
        e.target.value = '';
      } else {
        setImportError('备份文件解析失败：文件格式不正确，或已被损坏。请确保它是您在此系统中导出的 JSON 备份。');
      }
    };
    reader.onerror = () => {
      setImportError('文件读取出错，请稍后重试。');
    };
    reader.readAsText(file);
  };

  const handleResetToDemo = () => {
    onUpdateState(INITIAL_GYM_STATE);
    setShowResetConfirm(false);
    alert('已成功重置为演示初始数据！');
  };

  return (
    <div className="space-y-6" id="backup-container">
      {/* Top Heading */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <Database className="h-5 w-5 text-indigo-600" />
          数据安全与备份中心 (MVP 10)
        </h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
          为了确保您的私教工作室数据永不丢失，Fever Plus 工作台采用了完全保存在本地的加密存储策略。
          我们建议您每周或在记录了重大缴费后，在此模块下载一份备份文件保存到个人电脑或网盘中，以防浏览器缓存被恶意清理。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Export and Import Actions */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">备份与恢复管理</h3>
          
          <div className="space-y-4">
            {/* Export Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="font-bold text-slate-800 text-xs block">1. 备份并下载当前数据</span>
                <span className="text-[10px] text-slate-400 mt-1 block font-semibold">
                  导出一份包含学员档案、训练方案、上课扣减及收款账单的 JSON 备份。
                </span>
              </div>
              
              <button
                onClick={handleExport}
                className="w-full sm:w-auto py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs shrink-0 shadow-sm"
              >
                <Download className="h-4 w-4" />
                下载备份文件
              </button>
            </div>

            {/* Import Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="font-bold text-slate-800 text-xs block">2. 上传备份进行还原</span>
                  <span className="text-[10px] text-slate-400 mt-1 block font-semibold">
                    从此前下载的备份文件中导入并完全覆盖当前的全部数据状态。
                  </span>
                </div>

                <div className="relative w-full sm:w-auto shrink-0">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    id="import-upload"
                  />
                  <label
                    htmlFor="import-upload"
                    className="w-full py-2 px-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-all text-xs cursor-pointer shadow-sm"
                  >
                    <Upload className="h-4 w-4 text-indigo-600" />
                    导入备份数据
                  </label>
                </div>
              </div>

              {/* Status messages */}
              {importSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-xs flex items-center gap-2 font-semibold">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>数据恢复导入成功！工作台状态已刷新。</span>
                </div>
              )}

              {importError && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-xs flex items-start gap-1.5 font-semibold">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System safety and Reset block */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4.5 w-4.5 text-indigo-600" />
              本地保密机制
            </h3>
            
            <div className="space-y-3 text-xs text-slate-500">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-indigo-900 block mb-1">🔒 客户隐私第一</span>
                <span className="text-slate-600 font-medium">数据不经过第三方服务器，也不包含任何公开 API，绝对保护学员的电话、姓名以及训练隐私，满足工作室极致的安全。</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-indigo-900 block mb-1">📱 跨平台建议</span>
                <span className="text-slate-600 font-medium">如果您想将当前记录迁移至新买的平板电脑或微信内置浏览器，只需导出备份并发送至该设备导入，1秒无缝迁移！</span>
              </div>
            </div>
          </div>

          {/* Reset button */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold rounded-xl text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                重置系统并覆盖为演示数据
              </button>
            ) : (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                <p className="text-[11px] text-rose-700 leading-normal flex items-start gap-1.5 font-medium">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-650" />
                  <span>此操作是不可逆的！重置后，您当前记录的真实学员信息和缴费账单都将被彻底覆盖！是否确认重置？</span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs cursor-pointer font-bold transition-all"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToDemo}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs cursor-pointer transition-all"
                  >
                    确认覆盖重置
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
