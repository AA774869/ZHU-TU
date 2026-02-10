
import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Trash2, 
  Download, 
  Plus, 
  Image as ImageIcon,
  Type as TypeIcon,
  LayoutGrid,
  Scaling,
  MousePointer2,
  Move,
  Palette,
  Bold,
  Edit2,
  Columns,
  Grid2X2,
  Settings,
  ArrowUp,
  RotateCcw
} from 'lucide-react';
import { ProductImage, GridSlot, SKUData, LayoutType, LayoutStyle } from './types';
import html2canvas from 'html2canvas';

const STORAGE_KEY = 'sku_visualizer_state';

const FONT_FAMILIES = [
  { name: '自定义 (需系统安装)', value: "custom" },
  { name: '汉仪乐喵体简', value: "'HYLeMiaoTiJ', 'cursive'" },
  { name: '默认无衬线', value: "'Inter', sans-serif" },
  { name: '衬线体 (宋体)', value: "'Songti SC', 'STSong', 'SimSun', serif" },
  { name: '楷体', value: "'Kaiti SC', 'STKaiti', 'KaiTi', serif" },
  { name: '黑体', value: "'Heiti SC', 'STHeiti', 'SimHei', sans-serif" },
];

const FONT_WEIGHTS = [
  { name: '极细 (100)', value: '100' },
  { name: '细 (300)', value: '300' },
  { name: '常规 (400)', value: '400' },
  { name: '中等 (500)', value: '500' },
  { name: '半粗 (600)', value: '600' },
  { name: '粗体 (700)', value: '700' },
  { name: '极粗 (900)', value: '900' },
];

const initialStyle = (type: LayoutType): LayoutStyle => ({
  title: type === '2' ? '内裤两条装' : type === '3' ? '内裤三条装' : '内裤四条装',
  details: ['', '', '', ''],
  textSlotIndex: type === '2' ? 2 : (type === '3' ? 3 : 0),
  titleFontSize: type === '2' ? 48 : 42,
  detailsFontSize: type === '2' ? 32 : 28,
  titleX: 50,
  titleY: 35,
  detailsX: 50,
  detailsY: 65,
  titleColor: '#000000',
  detailsColor: '#000000',
  titleFontWeight: '700',
  detailsFontWeight: '500',
  topPadding: 0 // Default starting offset
});

export default function App() {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [slots, setSlots] = useState<GridSlot[]>([null, null, null, null]);
  const [skuData, setSkuData] = useState<SKUData>({
    layoutType: '2',
    fontFamily: "'HYLeMiaoTiJ', 'cursive'",
    customFont: 'HYLeMiaoTiJ',
    styles: {
      '2': initialStyle('2'),
      '3': initialStyle('3'),
      '4': initialStyle('4'),
    }
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  const [draggingSlotIndex, setDraggingSlotIndex] = useState<number | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  // Load from Local Storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setImages(parsed.images || []);
        setSlots(parsed.slots || [null, null, null, null]);
        setSkuData(parsed.skuData || skuData);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to Local Storage whenever state changes
  useEffect(() => {
    if (!isLoaded) return;
    const state = { images, slots, skuData };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [images, slots, skuData, isLoaded]);

  const currentStyle = skuData.styles[skuData.layoutType];

  const updateCurrentStyle = (updates: Partial<LayoutStyle>) => {
    setSkuData(prev => ({
      ...prev,
      styles: {
        ...prev.styles,
        [prev.layoutType]: { ...prev.styles[prev.layoutType], ...updates }
      }
    }));
  };

  // Sync details text automatically based on layout and selected images
  useEffect(() => {
    if (!isLoaded) return;
    const newDetails = [...currentStyle.details];
    if (skuData.layoutType === '2') {
      const imageSlotIndices = (currentStyle.textSlotIndex < 2) ? [2, 3] : [0, 1];
      const names = imageSlotIndices
        .map(idx => images.find(img => img.id === slots[idx])?.name || '')
        .filter(n => n !== '');
      newDetails[0] = names.join(' + ');
    } else if (skuData.layoutType === '3') {
      const imageIndices = [0, 1, 2, 3].filter(idx => idx !== currentStyle.textSlotIndex);
      imageIndices.forEach((slotIdx, detailIdx) => {
        const img = images.find(i => i.id === slots[slotIdx]);
        newDetails[detailIdx] = img ? `${img.name} ×1` : '';
      });
    }
    
    // Only update if text has actually changed to avoid infinite loop
    if (JSON.stringify(newDetails) !== JSON.stringify(currentStyle.details)) {
        updateCurrentStyle({ details: newDetails });
    }
  }, [slots, images, skuData.layoutType, currentStyle.textSlotIndex]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage: ProductImage = {
          id: Math.random().toString(36).substr(2, 9),
          url: event.target?.result as string,
          name: file.name.split('.')[0]
        };
        setImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setSlots(prev => prev.map(slotId => slotId === id ? null : slotId));
  };

  const renameImage = (id: string, newName: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, name: newName } : img));
  };

  const handleDragStartImage = (id: string) => {
    setDraggingImageId(id);
    setDraggingSlotIndex(null);
  };

  const handleDragStartSlot = (index: number) => {
    if (slots[index]) {
      setDraggingSlotIndex(index);
      setDraggingImageId(null);
    }
  };

  const handleDropOnSlot = (index: number) => {
    const newSlots = [...slots];
    if (draggingImageId) {
      newSlots[index] = draggingImageId;
    } else if (draggingSlotIndex !== null) {
      const temp = newSlots[index];
      newSlots[index] = newSlots[draggingSlotIndex];
      newSlots[draggingSlotIndex] = temp;
    }
    setSlots(newSlots);
    setDraggingImageId(null);
    setDraggingSlotIndex(null);
  };

  const clearSlot = (index: number) => {
    const newSlots = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);
  };

  const resetAll = () => {
    if (confirm('确定要清空所有数据并恢复默认吗？')) {
        setImages([]);
        setSlots([null, null, null, null]);
        setSkuData({
          layoutType: '2',
          fontFamily: "'HYLeMiaoTiJ', 'cursive'",
          customFont: 'HYLeMiaoTiJ',
          styles: {
            '2': initialStyle('2'),
            '3': initialStyle('3'),
            '4': initialStyle('4'),
          }
        });
        localStorage.removeItem(STORAGE_KEY);
    }
  };

  const exportAsImage = async () => {
    if (gridRef.current) {
      const originalWidth = gridRef.current.style.width;
      const originalHeight = gridRef.current.style.height;
      gridRef.current.style.width = '800px';
      gridRef.current.style.height = '800px';
      try {
        const canvas = await html2canvas(gridRef.current, {
          width: 800,
          height: 800,
          scale: 1,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        const link = document.createElement('a');
        link.download = `SKU_EXPORT_${skuData.layoutType}pack_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } finally {
        gridRef.current.style.width = originalWidth;
        gridRef.current.style.height = originalHeight;
      }
    }
  };

  const finalFontFamily = skuData.fontFamily === 'custom' ? skuData.customFont : skuData.fontFamily;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100 font-sans">
      {/* Sidebar Controls */}
      <div className="w-full md:w-[400px] bg-white border-r border-slate-200 overflow-y-auto p-6 flex flex-col gap-6 shadow-xl z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-1">
              <LayoutGrid className="w-6 h-6 text-indigo-600" />
              SKU 智能排版系统
            </h1>
            <p className="text-xs text-slate-500 font-medium">样式自动保存，支持多布局切换</p>
          </div>
          <button 
            onClick={resetAll}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-lg"
            title="重置应用"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Layout Selector */}
        <section>
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Grid2X2 className="w-3.5 h-3.5" /> 组合模式切换
          </h2>
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
            {(['2', '3', '4'] as LayoutType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSkuData(p => ({ ...p, layoutType: type }))}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  skuData.layoutType === type 
                  ? 'bg-white text-indigo-600 shadow-md scale-[1.02]' 
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {type === '2' && <Columns className="w-3.5 h-3.5" />}
                {type === '3' && <LayoutGrid className="w-3.5 h-3.5" />}
                {type === '4' && <Grid2X2 className="w-3.5 h-3.5" />}
                {type}条装
              </button>
            ))}
          </div>
        </section>

        {/* Text Position & Pack Specific Padding */}
        {skuData.layoutType !== '4' && (
          <section className="space-y-4">
            <div>
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" /> 文案位置选择
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {skuData.layoutType === '2' ? (
                  <>
                    <button 
                      onClick={() => updateCurrentStyle({ textSlotIndex: 2 })}
                      className={`py-2 rounded-xl text-[10px] font-bold border ${currentStyle.textSlotIndex >= 2 ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-100 text-slate-500'}`}
                    >
                      文案在下方
                    </button>
                    <button 
                      onClick={() => updateCurrentStyle({ textSlotIndex: 0 })}
                      className={`py-2 rounded-xl text-[10px] font-bold border ${currentStyle.textSlotIndex < 2 ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-100 text-slate-500'}`}
                    >
                      文案在上方
                    </button>
                  </>
                ) : (
                  [0, 1, 2, 3].map(i => (
                    <button 
                      key={i}
                      onClick={() => updateCurrentStyle({ textSlotIndex: i })}
                      className={`py-2 rounded-xl text-[10px] font-bold border ${currentStyle.textSlotIndex === i ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-100 text-slate-500'}`}
                    >
                      位置 {i + 1} 为文案
                    </button>
                  ))
                )}
              </div>
            </div>

            {skuData.layoutType === '2' && (
              <div>
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <ArrowUp className="w-3.5 h-3.5" /> 图片垂直偏移 (不遮挡)
                </h2>
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <input 
                    type="range" min="-100" max="400" 
                    value={currentStyle.topPadding} 
                    onChange={(e) => updateCurrentStyle({ topPadding: parseInt(e.target.value) })}
                    className="flex-1 h-1 accent-indigo-600" 
                  />
                  <span className="text-[10px] font-black text-slate-600 w-8">{currentStyle.topPadding}</span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Image Assets */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5" /> 素材库
            </h2>
            <label className="cursor-pointer bg-slate-900 hover:bg-black text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1">
              <Plus className="w-3 h-3" /> 上传
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {images.length === 0 && (
              <div className="col-span-2 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-slate-300">
                <Upload className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase tracking-widest">请上传素材</span>
              </div>
            )}
            {images.map((img) => (
              <div 
                key={img.id} draggable onDragStart={() => handleDragStartImage(img.id)} 
                className="group relative aspect-square bg-slate-50 rounded-xl overflow-hidden border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all"
              >
                <img src={img.url} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 backdrop-blur-sm">
                  <div className="flex items-center gap-1 w-full bg-white/90 rounded-lg px-1 mb-2">
                    <Edit2 className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                    <input 
                      className="w-full bg-transparent border-none text-[10px] focus:ring-0 font-bold p-1 text-slate-700" 
                      value={img.name} onChange={(e) => renameImage(img.id, e.target.value)} onClick={(e) => e.stopPropagation()} 
                    />
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeImage(img.id); }} className="p-2 bg-red-500 text-white rounded-full"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Text Area Config */}
        {skuData.layoutType !== '4' && (
          <section className="space-y-4">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TypeIcon className="w-3.5 h-3.5" /> 文案编辑 ({skuData.layoutType}条装)
            </h2>
            <div className="space-y-3">
              <input 
                type="text" value={currentStyle.title} 
                onChange={(e) => updateCurrentStyle({ title: e.target.value })} 
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold bg-slate-50" 
                placeholder="组合标题" 
              />
              {skuData.layoutType === '3' ? (
                <div className="space-y-2">
                  {currentStyle.details.slice(0, 3).map((detail, idx) => (
                    <input key={idx} type="text" value={detail} onChange={(e) => {
                      const d = [...currentStyle.details]; d[idx] = e.target.value; updateCurrentStyle({ details: d });
                    }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[11px]" />
                  ))}
                </div>
              ) : (
                <textarea rows={2} value={currentStyle.details[0]} onChange={(e) => {
                  const d = [...currentStyle.details]; d[0] = e.target.value; updateCurrentStyle({ details: d });
                }} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[11px] resize-none" />
              )}
            </div>
          </section>
        )}

        {/* Style Fine-tuning - HIDDEN FOR 4-PACK */}
        {skuData.layoutType !== '4' && (
          <section className="space-y-5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Scaling className="w-3.5 h-3.5" /> 样式调节 ({skuData.layoutType}条装)</h2>
            <div className="space-y-4">
              <select value={skuData.fontFamily} onChange={(e) => setSkuData(prev => ({ ...prev, fontFamily: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium bg-white">
                {FONT_FAMILIES.map(font => <option key={font.value} value={font.value}>{font.name}</option>)}
              </select>
              
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between"><span className="text-[9px] font-black text-indigo-600 uppercase">标题属性</span> <input type="color" value={currentStyle.titleColor} onChange={(e) => updateCurrentStyle({ titleColor: e.target.value })} className="w-5 h-5 p-0 border-none bg-transparent cursor-pointer rounded" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-400">粗细</label>
                      <select value={currentStyle.titleFontWeight} onChange={(e) => updateCurrentStyle({ titleFontWeight: e.target.value })} className="w-full text-[9px] border-slate-100 rounded px-1 py-1">
                         {FONT_WEIGHTS.map(w => <option key={w.value} value={w.value}>{w.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-400">字号 {currentStyle.titleFontSize}px</label>
                      <input type="range" min="10" max="150" value={currentStyle.titleFontSize} onChange={(e) => updateCurrentStyle({ titleFontSize: parseInt(e.target.value) })} className="w-full h-1 accent-indigo-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between"><span className="text-[9px] font-black text-indigo-600 uppercase">描述属性</span> <input type="color" value={currentStyle.detailsColor} onChange={(e) => updateCurrentStyle({ detailsColor: e.target.value })} className="w-5 h-5 p-0 border-none bg-transparent cursor-pointer rounded" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-400">粗细</label>
                      <select value={currentStyle.detailsFontWeight} onChange={(e) => updateCurrentStyle({ detailsFontWeight: e.target.value })} className="w-full text-[9px] border-slate-100 rounded px-1 py-1">
                         {FONT_WEIGHTS.map(w => <option key={w.value} value={w.value}>{w.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-400">字号 {currentStyle.detailsFontSize}px</label>
                      <input type="range" min="10" max="120" value={currentStyle.detailsFontSize} onChange={(e) => updateCurrentStyle({ detailsFontSize: parseInt(e.target.value) })} className="w-full h-1 accent-indigo-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                   <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1"><Move className="w-3 h-3" /> 文案坐标 (Y)</span>
                   <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-[8px] text-slate-400 uppercase">标题: {currentStyle.titleY}%</label><input type="range" min="0" max="100" value={currentStyle.titleY} onChange={(e) => updateCurrentStyle({ titleY: parseInt(e.target.value) })} className="w-full h-1" /></div>
                      <div><label className="text-[8px] text-slate-400 uppercase">描述: {currentStyle.detailsY}%</label><input type="range" min="0" max="100" value={currentStyle.detailsY} onChange={(e) => updateCurrentStyle({ detailsY: parseInt(e.target.value) })} className="w-full h-1" /></div>
                   </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <button onClick={exportAsImage} className="mt-auto bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl active:scale-95 group">
          <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" /> 导出 800×800 封面图
        </button>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 overflow-auto bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:25px_25px]">
        <div className="relative">
          <div className="absolute -top-10 left-0 right-0 flex justify-between px-2">
             <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-indigo-600 shadow-sm border border-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
               <MousePointer2 className="w-3 h-3" /> 实时无缝预览
             </div>
             <div className="bg-slate-900 px-3 py-1 rounded-full text-[10px] font-black text-white shadow-lg uppercase tracking-wider">
               {skuData.layoutType}条装组合
             </div>
          </div>

          <div 
            ref={gridRef} 
            className="grid-container w-[400px] sm:w-[500px] lg:w-[600px] bg-white shadow-[0_60px_120px_-20px_rgba(0,0,0,0.3)] overflow-hidden relative"
          >
            {skuData.layoutType === '2' ? (
              <div className="w-full h-full relative">
                {/* 2-Pack rendering using relative/absolute for elements to avoid clipping inside grid rows */}
                {/* Text Block */}
                <div 
                  className="absolute left-0 w-full h-1/2 overflow-hidden flex flex-col justify-center items-center"
                  style={{ 
                    fontFamily: finalFontFamily, 
                    top: currentStyle.textSlotIndex < 2 ? '0' : '50%'
                  }}
                >
                   <div className="absolute transform -translate-x-1/2 -translate-y-1/2 text-center w-full px-4" style={{ left: `${currentStyle.titleX}%`, top: `${currentStyle.titleY}%`, fontSize: `${currentStyle.titleFontSize}px`, color: currentStyle.titleColor, fontWeight: currentStyle.titleFontWeight }}>{currentStyle.title}</div>
                   <div className="absolute transform -translate-x-1/2 -translate-y-1/2 text-center w-full px-4" style={{ left: `${currentStyle.detailsX}%`, top: `${currentStyle.detailsY}%`, fontSize: `${currentStyle.detailsFontSize}px`, color: currentStyle.detailsColor, fontWeight: currentStyle.detailsFontWeight, lineHeight: '1.4' }}>{currentStyle.details[0]}</div>
                </div>

                {/* Images Block */}
                <div 
                   className="absolute left-0 w-full h-1/2 grid grid-cols-2"
                   style={{ 
                     top: currentStyle.textSlotIndex < 2 ? '50%' : '0',
                     marginTop: `${currentStyle.topPadding}px` // User adjustable offset
                   }}
                >
                   {(currentStyle.textSlotIndex < 2 ? [2, 3] : [0, 1]).map(idx => (
                    <div key={idx} onDragOver={e => e.preventDefault()} onDrop={() => handleDropOnSlot(idx)} draggable={!!slots[idx]} onDragStart={() => handleDragStartSlot(idx)} className="relative group bg-slate-50 border-none m-0 p-0 aspect-square">
                      {slots[idx] ? (
                        <>
                          <img src={images.find(img => img.id === slots[idx])?.url} className="w-full h-full object-cover select-none pointer-events-none block" />
                          <button onClick={() => clearSlot(idx)} className="absolute top-3 right-3 p-2 bg-white/90 shadow-xl rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white backdrop-blur z-20"><Trash2 className="w-4 h-4" /></button>
                        </>
                      ) : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-200"><Plus className="w-8 h-8 opacity-40" /><span className="text-[10px] font-black uppercase tracking-[0.2em]">图 {idx + 1}</span></div>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Grid layouts for 3 and 4 pack remain grid-based as clipping isn't an issue there */
              <div className="w-full h-full grid grid-cols-2 grid-rows-2">
                {skuData.layoutType === '3' ? (
                  <>
                    {[0, 1, 2, 3].map(idx => (
                      <div key={idx} className="relative overflow-hidden border-none m-0 p-0 aspect-square">
                        {currentStyle.textSlotIndex === idx ? (
                          <div className="bg-white w-full h-full relative" style={{ fontFamily: finalFontFamily }}>
                             <div className="absolute transform -translate-x-1/2 -translate-y-1/2 text-center w-full px-4" style={{ left: `${currentStyle.titleX}%`, top: `${currentStyle.titleY}%`, fontSize: `${currentStyle.titleFontSize}px`, color: currentStyle.titleColor, fontWeight: currentStyle.titleFontWeight }}>{currentStyle.title}</div>
                             <div className="absolute transform -translate-x-1/2 -translate-y-1/2 text-center w-full space-y-2 px-4" style={{ left: `${currentStyle.detailsX}%`, top: `${currentStyle.detailsY}%`, fontSize: `${currentStyle.detailsFontSize}px`, color: currentStyle.detailsColor, fontWeight: currentStyle.detailsFontWeight, lineHeight: '1.2' }}>
                               {currentStyle.details.slice(0, 3).map((d, i) => d && <div key={i}>{d}</div>)}
                             </div>
                          </div>
                        ) : (
                          <div onDragOver={e => e.preventDefault()} onDrop={() => handleDropOnSlot(idx)} draggable={!!slots[idx]} onDragStart={() => handleDragStartSlot(idx)} className="relative group bg-slate-50 w-full h-full">
                            {slots[idx] ? (
                              <>
                                <img src={images.find(img => img.id === slots[idx])?.url} className="w-full h-full object-cover select-none pointer-events-none block" />
                                <button onClick={() => clearSlot(idx)} className="absolute top-3 right-3 p-2 bg-white/90 shadow-xl rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white backdrop-blur z-20"><Trash2 className="w-4 h-4" /></button>
                              </>
                            ) : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-200"><Plus className="w-8 h-8 opacity-40" /><span className="text-[10px] font-black uppercase tracking-[0.2em]">图 {idx + 1}</span></div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {[0, 1, 2, 3].map(idx => (
                      <div key={idx} onDragOver={e => e.preventDefault()} onDrop={() => handleDropOnSlot(idx)} draggable={!!slots[idx]} onDragStart={() => handleDragStartSlot(idx)} className="relative group bg-slate-50 overflow-hidden border-none m-0 p-0 aspect-square">
                        {slots[idx] ? (
                          <>
                            <img src={images.find(img => img.id === slots[idx])?.url} className="w-full h-full object-cover select-none pointer-events-none block" />
                            <button onClick={() => clearSlot(idx)} className="absolute top-3 right-3 p-2 bg-white/90 shadow-xl rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white backdrop-blur z-20"><Trash2 className="w-4 h-4" /></button>
                          </>
                        ) : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-200"><Plus className="w-8 h-8 opacity-40" /><span className="text-[10px] font-black uppercase tracking-[0.2em]">图 {idx + 1}</span></div>}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
