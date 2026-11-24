// frontend/src/components/workspace/InteractiveDocumentEditor.tsx
// Architecture: Fabric.js + pdfjs-dist unified canvas pipeline (Stirling-PDF inspired)
// - Single canvas coordinate space: 0px shift between preview and export
// - High-resolution PDF/image base rendered directly into fabric.Canvas
// - Hitbox detection: Transparent interactive hitboxes on hover, instant seamless edit on click
// - Sampling: Authentic paper color sampled 2px outside origBbox, strictly 0px vertical bleed
// - Tools: 20+ Google Fonts + Custom Upload, Whiteout, Eyedropper, Alignment, 8-point handles, Fine-nudge

'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import * as fabric from 'fabric';
import { ScanEditorBlock, ScanEditorResponse, apiScanEditor } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { PDFDocument } from 'pdf-lib';
import { getPdfJs } from '@/lib/clientPdfOps';
import {
  ArrowLeft,
  Download,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Image as ImageIcon,
  Loader2,
  Upload,
  Check,
  Search,
  ChevronDown,
  Square,
  Pipette,
  MousePointer
} from 'lucide-react';

interface InteractiveDocumentEditorProps {
  file: File;
  initialScan: ScanEditorResponse;
  language: 'id' | 'en';
  onClose: () => void;
  onDownload: (blob: Blob, filename: string) => void;
}

export interface FontOption {
  label: string;
  value: string;
  category: 'formal_serif' | 'modern_sans' | 'condensed' | 'monospace' | 'slab_serif' | 'script' | 'custom';
  categoryLabel: string;
  isCustom?: boolean;
}

// 20+ Versatile Google Fonts covering Formal Serif, Modern Sans, Condensed, Monospace, Slab Serif, and Script
export const GOOGLE_FONT_CATALOG: FontOption[] = [
  // 1. Formal Serif (Standard for formal letters, legal documents, contracts)
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif", category: 'formal_serif', categoryLabel: 'Formal Serif' },
  { label: 'Merriweather', value: "'Merriweather', serif", category: 'formal_serif', categoryLabel: 'Formal Serif' },
  { label: 'Playfair Display', value: "'Playfair Display', serif", category: 'formal_serif', categoryLabel: 'Formal Serif' },
  { label: 'Lora', value: "'Lora', serif", category: 'formal_serif', categoryLabel: 'Formal Serif' },
  { label: 'Georgia', value: "Georgia, serif", category: 'formal_serif', categoryLabel: 'Formal Serif' },
  { label: 'EB Garamond', value: "'EB Garamond', Garamond, serif", category: 'formal_serif', categoryLabel: 'Formal Serif' },

  // 2. Modern & Geometric Sans-Serif (Standard for headers, logos, clean text)
  { label: 'Inter', value: "'Inter', sans-serif", category: 'modern_sans', categoryLabel: 'Modern Sans' },
  { label: 'Arial', value: "Arial, sans-serif", category: 'modern_sans', categoryLabel: 'Modern Sans' },
  { label: 'Roboto', value: "'Roboto', sans-serif", category: 'modern_sans', categoryLabel: 'Modern Sans' },
  { label: 'Montserrat', value: "'Montserrat', sans-serif", category: 'modern_sans', categoryLabel: 'Modern Sans' },
  { label: 'Open Sans', value: "'Open Sans', sans-serif", category: 'modern_sans', categoryLabel: 'Modern Sans' },
  { label: 'Poppins', value: "'Poppins', sans-serif", category: 'modern_sans', categoryLabel: 'Modern Sans' },
  { label: 'Lato', value: "'Lato', sans-serif", category: 'modern_sans', categoryLabel: 'Modern Sans' },

  // 3. Condensed / Narrow (for dense tables, receipts, invoices)
  { label: 'Oswald', value: "'Oswald', sans-serif", category: 'condensed', categoryLabel: 'Condensed / Narrow' },
  { label: 'Roboto Condensed', value: "'Roboto Condensed', sans-serif", category: 'condensed', categoryLabel: 'Condensed / Narrow' },
  { label: 'Barlow Semi Condensed', value: "'Barlow Semi Condensed', sans-serif", category: 'condensed', categoryLabel: 'Condensed / Narrow' },

  // 4. Monospace / Typewriter (for numbers, codes, old typed documents)
  { label: 'Courier New', value: "'Courier New', Courier, monospace", category: 'monospace', categoryLabel: 'Monospace / Typewriter' },
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace", category: 'monospace', categoryLabel: 'Monospace / Typewriter' },
  { label: 'Space Mono', value: "'Space Mono', monospace", category: 'monospace', categoryLabel: 'Monospace / Typewriter' },

  // 5. Slab Serif (for bold letterheads, headers)
  { label: 'Roboto Slab', value: "'Roboto Slab', serif", category: 'slab_serif', categoryLabel: 'Slab Serif' },
  { label: 'Arvo', value: "'Arvo', serif", category: 'slab_serif', categoryLabel: 'Slab Serif' },
  { label: 'Rokkitt', value: "'Rokkitt', serif", category: 'slab_serif', categoryLabel: 'Slab Serif' },

  // 6. Script / Handwriting (for certificates, signatures, cursive)
  { label: 'Caveat', value: "'Caveat', cursive", category: 'script', categoryLabel: 'Script / Handwriting' },
  { label: 'Dancing Script', value: "'Dancing Script', cursive", category: 'script', categoryLabel: 'Script / Handwriting' },
  { label: 'Pacifico', value: "'Pacifico', cursive", category: 'script', categoryLabel: 'Script / Handwriting' },
];

type EditorTool = 'select' | 'text' | 'whiteout' | 'eyedropper';

export const InteractiveDocumentEditor: React.FC<InteractiveDocumentEditorProps> = ({
  file,
  initialScan,
  language,
  onClose,
  onDownload,
}) => {
  const isId = language === 'id';

  const [scanData, setScanData] = useState<ScanEditorResponse>(initialScan);
  const [currentPage, setCurrentPage] = useState<number>(initialScan.pageIndex);
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [zoom, setZoom] = useState<number>(1.0);

  // Active object typography state
  const [activeObject, setActiveObject] = useState<fabric.FabricObject | null>(null);
  const [activeFontFamily, setActiveFontFamily] = useState<string>("'Times New Roman', Times, serif");
  const [activeFontSize, setActiveFontSize] = useState<number>(18);
  const [activeTextColor, setActiveTextColor] = useState<string>('#111827');
  const [currentPaperColor, setCurrentPaperColor] = useState<string>('#ffffff');
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');

  // Custom fonts & dropdown state
  const [customFonts, setCustomFonts] = useState<FontOption[]>([]);
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState<boolean>(false);
  const [fontSearchQuery, setFontSearchQuery] = useState<string>('');

  // Process & Loading states
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgressText, setExportProgressText] = useState<string>('');

  // DOM & Fabric refs
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const viewportContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fontFileInputRef = useRef<HTMLInputElement>(null);
  const fontDropdownRef = useRef<HTMLDivElement>(null);

  // Whiteout drawing ref
  const whiteoutDrawingRef = useRef<{
    isDrawing: boolean;
    startPointer: { x: number; y: number } | null;
    activeRect: fabric.Rect | null;
  }>({
    isDrawing: false,
    startPointer: null,
    activeRect: null,
  });

  // Base display scale so canvas fits viewport naturally
  const baseDisplayScale = useMemo(() => {
    if (!scanData.pixelWidth || !scanData.pageWidth) return 1.0;
    // Scale standard 72pt page size with comfortable 1.35x display factor
    return (scanData.pageWidth * 1.35) / scanData.pixelWidth;
  }, [scanData.pageWidth, scanData.pixelWidth]);

  // Combined font list
  const allFonts = useMemo(() => {
    return [...customFonts, ...GOOGLE_FONT_CATALOG];
  }, [customFonts]);

  // Filtered fonts based on search
  const filteredFonts = useMemo(() => {
    if (!fontSearchQuery.trim()) return allFonts;
    const q = fontSearchQuery.toLowerCase();
    return allFonts.filter(
      (f) => f.label.toLowerCase().includes(q) || f.categoryLabel.toLowerCase().includes(q)
    );
  }, [allFonts, fontSearchQuery]);

  // Preload 20+ Google Fonts dynamically into document head
  useEffect(() => {
    const linkId = 'purepdf-editor-google-fonts';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Arvo:wght@400;700&family=Barlow+Semi+Condensed:wght@400;600&family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=EB+Garamond:wght@400;600&family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;600;700&family=Lato:wght@400;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;600;700&family=Oswald:wght@400;600&family=Pacifico&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Poppins:wght@400;600;700&family=Roboto+Condensed:wght@400;700&family=Roboto+Slab:wght@400;700&family=Roboto:wght@400;500;700&family=Rokkitt:wght@400;700&family=Space+Mono:wght@400;700&display=swap';
      document.head.appendChild(link);
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target as Node)) {
        setIsFontDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // FABRIC CANVAS INITIALIZATION & HITBOX SETUP
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvasEl = canvasElementRef.current;
    if (!canvasEl) return;

    // Dispose old canvas if any
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
    }

    const totalScale = baseDisplayScale * zoom;
    const canvasWidth = scanData.pixelWidth * totalScale;
    const canvasHeight = scanData.pixelHeight * totalScale;

    const fCanvas = new fabric.Canvas(canvasEl, {
      width: canvasWidth,
      height: canvasHeight,
      selection: true,
      preserveObjectStacking: true,
      defaultCursor: 'default',
    });
    fCanvas.setZoom(totalScale);
    fabricCanvasRef.current = fCanvas;

    // Load high-resolution background scan image into Fabric.js (via scanData.image or pdfjs-dist)
    let isCancelled = false;
    const loadBackground = async () => {
      let bgDataUrl = scanData.image;
      if (!bgDataUrl && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
        try {
          const pdfjs = await getPdfJs();
          if (pdfjs) {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            const page = await pdfDoc.getPage(currentPage + 1);
            const viewport = page.getViewport({ scale: 2.0 });
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = viewport.width;
            offscreenCanvas.height = viewport.height;
            const ctx = offscreenCanvas.getContext('2d');
            if (ctx) {
              await page.render({ canvasContext: ctx, viewport }).promise;
              bgDataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.95);
            }
          }
        } catch (e) {
          console.warn('[pdfjs-dist background render]:', e);
        }
      }

      if (isCancelled || !fCanvas || !bgDataUrl) return;
      try {
        const bgImg = await fabric.FabricImage.fromURL(bgDataUrl, { crossOrigin: 'anonymous' });
        if (isCancelled || !fCanvas) return;
        bgImg.set({
          left: 0,
          top: 0,
          scaleX: scanData.pixelWidth / (bgImg.width || 1),
          scaleY: scanData.pixelHeight / (bgImg.height || 1),
          selectable: false,
          evented: false,
        });
        fCanvas.backgroundImage = bgImg;
        fCanvas.requestRenderAll();
      } catch (err) {
        console.error('[Fabric bg load error]:', err);
      }
    };
    loadBackground();

    // Sample dominant initial paper color from blocks
    if (scanData.blocks && scanData.blocks.length > 0) {
      const firstValidBg = scanData.blocks.find((b) => b.bgColor && b.bgColor !== '#ffffff')?.bgColor;
      if (firstValidBg) setCurrentPaperColor(firstValidBg);
    }

    // Populate detected text blocks as transparent interactive hitboxes
    scanData.blocks.forEach((block) => {
      const bx = (block.bbox.x / 100.0) * scanData.pixelWidth;
      const by = (block.bbox.y / 100.0) * scanData.pixelHeight;
      const bw = (block.bbox.width / 100.0) * scanData.pixelWidth;
      const bh = (block.bbox.height / 100.0) * scanData.pixelHeight;

      const hitbox = new fabric.Rect({
        left: bx,
        top: by,
        width: bw,
        height: bh,
        fill: 'transparent',
        stroke: 'transparent',
        strokeWidth: 1.5,
        selectable: false,
        hasControls: false,
        hasBorders: false,
        hoverCursor: 'text',
      });

      // Attach custom block metadata
      (hitbox as any).__isHitbox = true;
      (hitbox as any).__block = block;
      (hitbox as any).__coords = { bx, by, bw, bh };

      fCanvas.add(hitbox);
    });

    // ── HITBOX HOVER & CLICK-TO-EDIT HANDLERS ──
    fCanvas.on('mouse:over', (opt) => {
      const target = opt.target;
      if (target && (target as any).__isHitbox && activeTool === 'select') {
        target.set({
          stroke: '#ff3700',
          strokeDashArray: [4, 4],
          fill: 'rgba(255, 55, 0, 0.08)',
        });
        fCanvas.requestRenderAll();
      }
    });

    fCanvas.on('mouse:out', (opt) => {
      const target = opt.target;
      if (target && (target as any).__isHitbox) {
        target.set({
          stroke: 'transparent',
          strokeDashArray: undefined,
          fill: 'transparent',
        });
        fCanvas.requestRenderAll();
      }
    });

    // Selection sync
    fCanvas.on('selection:created', (e) => {
      const sel = e.selected?.[0] || null;
      updateToolbarFromSelection(sel);
    });

    fCanvas.on('selection:updated', (e) => {
      const sel = e.selected?.[0] || null;
      updateToolbarFromSelection(sel);
    });

    fCanvas.on('selection:cleared', () => {
      setActiveObject(null);
    });

    fCanvas.requestRenderAll();

    return () => {
      isCancelled = true;
      fCanvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [scanData, baseDisplayScale]);

  // Update zoom without recreating canvas
  useEffect(() => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas) return;

    const totalScale = baseDisplayScale * zoom;
    const canvasWidth = scanData.pixelWidth * totalScale;
    const canvasHeight = scanData.pixelHeight * totalScale;

    fCanvas.setDimensions({ width: canvasWidth, height: canvasHeight });
    fCanvas.setZoom(totalScale);
    fCanvas.requestRenderAll();
  }, [zoom, baseDisplayScale, scanData.pixelWidth, scanData.pixelHeight]);

  // Sync toolbar controls from selected object
  const updateToolbarFromSelection = (obj: fabric.FabricObject | null) => {
    setActiveObject(obj);
    if (!obj) return;

    if (obj instanceof fabric.Textbox || (obj as any).text !== undefined) {
      const tb = obj as fabric.Textbox;
      if (tb.fontFamily) setActiveFontFamily(tb.fontFamily);
      if (tb.fontSize) setActiveFontSize(Math.round(tb.fontSize));
      if (tb.fill) setActiveTextColor(String(tb.fill));
      setIsBold(tb.fontWeight === 'bold' || tb.fontWeight === 700);
      setIsItalic(tb.fontStyle === 'italic');
      setIsUnderline(Boolean(tb.underline));
      if (tb.textAlign) setTextAlign(tb.textAlign as any);
    } else if (obj instanceof fabric.Rect && (obj as any).__isWhiteout) {
      if (obj.fill) setCurrentPaperColor(String(obj.fill));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MOUSE INTERACTION (HITBOX CLICK, WHITEOUT DRAWING, EYEDROPPER)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas) return;

    const handleMouseDown = (opt: any) => {
      const pointer = fCanvas.getPointer(opt.e);

      // 1. EYEDROPPER TOOL: Sample exact color under mouse cursor
      if (activeTool === 'eyedropper') {
        const sampledColor = sampleCanvasPixel(pointer.x, pointer.y);
        if (sampledColor) {
          setCurrentPaperColor(sampledColor);
          if (activeObject && activeObject instanceof fabric.Rect) {
            activeObject.set('fill', sampledColor);
            fCanvas.requestRenderAll();
          }
        }
        setActiveTool('select');
        return;
      }

      // 2. WHITEOUT TOOL: Start drawing manual whiteout patch
      if (activeTool === 'whiteout') {
        whiteoutDrawingRef.current.isDrawing = true;
        whiteoutDrawingRef.current.startPointer = { x: pointer.x, y: pointer.y };

        const newRect = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: currentPaperColor,
          stroke: '#ff3700',
          strokeWidth: 1,
          strokeDashArray: [3, 3],
          selectable: true,
          cornerColor: '#ff3700',
          cornerStrokeColor: '#ffffff',
          borderColor: '#ff3700',
          cornerSize: 8,
          transparentCorners: false,
        });
        (newRect as any).__isWhiteout = true;
        fCanvas.add(newRect);
        whiteoutDrawingRef.current.activeRect = newRect;
        return;
      }

      // 3. SELECT TOOL: If clicking an untouched hitbox, convert to editable text!
      const target = opt.target;
      if (activeTool === 'select' && target && (target as any).__isHitbox) {
        const block = (target as any).__block as ScanEditorBlock;
        const { bx, by, bw, bh } = (target as any).__coords;

        // Remove the hitbox element
        fCanvas.remove(target);

        // A. Natural paper background patch (STRICT 0px vertical bleed)
        const patchFill = block.bgColor || currentPaperColor || '#fbfaf8';
        const patch = new fabric.Rect({
          left: bx,
          top: by,
          width: bw,
          height: bh,
          fill: patchFill,
          selectable: false,
          evented: false,
        });
        (patch as any).__isPatchFor = block.id;
        fCanvas.add(patch);

        // B. Calibrate font size (0.78 * tight ink height)
        const calibratedFontPx = Math.max(10, Math.round(0.78 * bh));

        // C. Create editable Textbox with 8-point handles
        const textbox = new fabric.Textbox(block.text, {
          left: bx,
          top: by,
          width: Math.max(bw, 60),
          fontSize: calibratedFontPx,
          fontFamily: block.fontFamily || "'Times New Roman', Times, serif",
          fill: block.textColor || '#111827',
          fontWeight: block.fontWeight || (block.isBold ? 700 : 400),
          fontStyle: block.fontStyle || 'normal',
          underline: Boolean(block.isUnderline),
          textAlign: 'left',
          lineHeight: 1.15,
          splitByGrapheme: false,
          editable: true,
          hasControls: true,
          cornerColor: '#ff3700',
          cornerStrokeColor: '#ffffff',
          borderColor: '#ff3700',
          cornerSize: 8,
          transparentCorners: false,
        });
        (textbox as any).__isEditedText = true;
        (textbox as any).__blockId = block.id;
        (textbox as any).__patch = patch;

        fCanvas.add(textbox);
        fCanvas.setActiveObject(textbox);
        textbox.enterEditing();
        textbox.selectAll();
        fCanvas.requestRenderAll();

        updateToolbarFromSelection(textbox);
      }
    };

    const handleMouseMove = (opt: any) => {
      if (activeTool === 'whiteout' && whiteoutDrawingRef.current.isDrawing) {
        const pointer = fCanvas.getPointer(opt.e);
        const start = whiteoutDrawingRef.current.startPointer;
        const rect = whiteoutDrawingRef.current.activeRect;
        if (!start || !rect) return;

        const left = Math.min(start.x, pointer.x);
        const top = Math.min(start.y, pointer.y);
        const width = Math.abs(pointer.x - start.x);
        const height = Math.abs(pointer.y - start.y);

        rect.set({ left, top, width, height });
        fCanvas.requestRenderAll();
      }
    };

    const handleMouseUp = () => {
      if (activeTool === 'whiteout' && whiteoutDrawingRef.current.isDrawing) {
        whiteoutDrawingRef.current.isDrawing = false;
        const rect = whiteoutDrawingRef.current.activeRect;
        if (rect) {
          if (rect.width && rect.width > 3 && rect.height && rect.height > 3) {
            rect.set({ stroke: 'transparent', strokeDashArray: undefined });
            fCanvas.setActiveObject(rect);
          } else {
            fCanvas.remove(rect);
          }
        }
        whiteoutDrawingRef.current.startPointer = null;
        whiteoutDrawingRef.current.activeRect = null;
        setActiveTool('select');
        fCanvas.requestRenderAll();
      }
    };

    fCanvas.on('mouse:down', handleMouseDown);
    fCanvas.on('mouse:move', handleMouseMove);
    fCanvas.on('mouse:up', handleMouseUp);

    return () => {
      fCanvas.off('mouse:down', handleMouseDown);
      fCanvas.off('mouse:move', handleMouseMove);
      fCanvas.off('mouse:up', handleMouseUp);
    };
  }, [activeTool, currentPaperColor, activeObject]);

  // Sample pixel color from background image / canvas
  const sampleCanvasPixel = (x: number, y: number): string | null => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas) return null;
    const ctx = fCanvas.getContext();
    if (!ctx) return null;

    try {
      const zoomLevel = fCanvas.getZoom();
      const px = Math.round(x * zoomLevel);
      const py = Math.round(y * zoomLevel);
      const pixel = ctx.getImageData(px, py, 1, 1).data;
      const r = pixel[0].toString(16).padStart(2, '0');
      const g = pixel[1].toString(16).padStart(2, '0');
      const b = pixel[2].toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    } catch {
      return null;
    }
  };

  // Trigger EyeDropper API if supported or activate canvas sampler
  const handleOpenEyeDropper = async () => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          setCurrentPaperColor(result.sRGBHex);
          if (activeObject && activeObject instanceof fabric.Rect) {
            activeObject.set('fill', result.sRGBHex);
            fabricCanvasRef.current?.requestRenderAll();
          }
          return;
        }
      } catch (err: any) {
        // User cancelled eye dropper, no action needed
        if (err.name === 'AbortError') return;
      }
    }
    // Fallback: activate canvas click eyedropper mode
    setActiveTool('eyedropper');
  };

  // Add new standalone text box
  const handleAddNewTextBox = () => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas) return;

    const centerX = scanData.pixelWidth * 0.35;
    const centerY = scanData.pixelHeight * 0.35;

    const tb = new fabric.Textbox(isId ? 'Teks Baru' : 'New Text', {
      left: centerX,
      top: centerY,
      width: 250,
      fontSize: 22,
      fontFamily: activeFontFamily,
      fill: activeTextColor,
      fontWeight: isBold ? 700 : 400,
      fontStyle: isItalic ? 'italic' : 'normal',
      underline: isUnderline,
      textAlign: textAlign,
      lineHeight: 1.15,
      splitByGrapheme: false,
      editable: true,
      cornerColor: '#ff3700',
      cornerStrokeColor: '#ffffff',
      borderColor: '#ff3700',
      cornerSize: 8,
      transparentCorners: false,
    });

    fCanvas.add(tb);
    fCanvas.setActiveObject(tb);
    tb.enterEditing();
    tb.selectAll();
    fCanvas.requestRenderAll();
    updateToolbarFromSelection(tb);
  };

  // Delete / Erase active object
  const handleDeleteActiveObject = () => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas || !activeObject) return;

    // If it's an edited text, we remove the text, BUT KEEP the patch underneath so old text is erased!
    fCanvas.remove(activeObject);
    fCanvas.discardActiveObject();
    setActiveObject(null);
    fCanvas.requestRenderAll();
  };

  // Insert signature or picture
  const handleInsertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const fCanvas = fabricCanvasRef.current;
      if (!fCanvas) return;

      const img = await fabric.FabricImage.fromURL(dataUrl);
      img.set({
        left: scanData.pixelWidth * 0.4,
        top: scanData.pixelHeight * 0.4,
        scaleX: Math.min(1.0, 300 / (img.width || 1)),
        scaleY: Math.min(1.0, 300 / (img.width || 1)),
        cornerColor: '#ff3700',
        cornerStrokeColor: '#ffffff',
        borderColor: '#ff3700',
        cornerSize: 8,
        transparentCorners: false,
      });

      fCanvas.add(img);
      fCanvas.setActiveObject(img);
      fCanvas.requestRenderAll();
      updateToolbarFromSelection(img);
    };
    reader.readAsDataURL(uploadedFile);

    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // Handle Custom Font Upload (.ttf / .otf / .woff / .woff2)
  const handleCustomFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    try {
      const cleanName = uploadedFile.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .trim() || 'CustomFont';

      const buffer = await uploadedFile.arrayBuffer();
      const fontFace = new FontFace(cleanName, buffer);
      await fontFace.load();
      document.fonts.add(fontFace);

      const newOption: FontOption = {
        label: `${cleanName} (Uploaded)`,
        value: `'${cleanName}', sans-serif`,
        category: 'custom',
        categoryLabel: isId ? 'Font Khusus (Upload)' : 'Custom Uploaded Fonts',
        isCustom: true,
      };

      setCustomFonts((prev) => [newOption, ...prev]);
      handleApplyFont(newOption.value);
      setIsFontDropdownOpen(false);

      if (fontFileInputRef.current) fontFileInputRef.current.value = '';
    } catch (err: any) {
      alert(isId ? `Gagal memuat font: ${err.message}` : `Failed to load font: ${err.message}`);
    }
  };

  // Apply typography updates to active text
  const handleApplyFont = (fontVal: string) => {
    setActiveFontFamily(fontVal);
    if (activeObject && (activeObject instanceof fabric.Textbox || (activeObject as any).text !== undefined)) {
      activeObject.set('fontFamily', fontVal);
      fabricCanvasRef.current?.requestRenderAll();
    }
  };

  const handleApplyFontSize = (newSize: number) => {
    const clamped = Math.max(6, Math.min(140, newSize));
    setActiveFontSize(clamped);
    if (activeObject && (activeObject instanceof fabric.Textbox || (activeObject as any).text !== undefined)) {
      activeObject.set('fontSize', clamped);
      fabricCanvasRef.current?.requestRenderAll();
    }
  };

  const handleToggleBold = () => {
    const nextBold = !isBold;
    setIsBold(nextBold);
    if (activeObject && (activeObject instanceof fabric.Textbox || (activeObject as any).text !== undefined)) {
      activeObject.set('fontWeight', nextBold ? 700 : 400);
      fabricCanvasRef.current?.requestRenderAll();
    }
  };

  const handleToggleItalic = () => {
    const nextItalic = !isItalic;
    setIsItalic(nextItalic);
    if (activeObject && (activeObject instanceof fabric.Textbox || (activeObject as any).text !== undefined)) {
      activeObject.set('fontStyle', nextItalic ? 'italic' : 'normal');
      fabricCanvasRef.current?.requestRenderAll();
    }
  };

  const handleToggleUnderline = () => {
    const nextUnderline = !isUnderline;
    setIsUnderline(nextUnderline);
    if (activeObject && (activeObject instanceof fabric.Textbox || (activeObject as any).text !== undefined)) {
      activeObject.set('underline', nextUnderline);
      fabricCanvasRef.current?.requestRenderAll();
    }
  };

  const handleApplyTextAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
    setTextAlign(align);
    if (activeObject && (activeObject instanceof fabric.Textbox || (activeObject as any).text !== undefined)) {
      activeObject.set('textAlign', align);
      fabricCanvasRef.current?.requestRenderAll();
    }
  };

  const handleApplyTextColor = (hex: string) => {
    setActiveTextColor(hex);
    if (activeObject && (activeObject instanceof fabric.Textbox || (activeObject as any).text !== undefined)) {
      activeObject.set('fill', hex);
      fabricCanvasRef.current?.requestRenderAll();
    }
  };

  const handleApplyPaperColor = (hex: string) => {
    setCurrentPaperColor(hex);
    if (activeObject && activeObject instanceof fabric.Rect) {
      activeObject.set('fill', hex);
      fabricCanvasRef.current?.requestRenderAll();
    }
  };

  // Fine-nudge active object (1px precision)
  const handleNudgeObject = useCallback((dx: number, dy: number) => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas || !activeObject) return;

    activeObject.set({
      left: (activeObject.left || 0) + dx,
      top: (activeObject.top || 0) + dy,
    });
    activeObject.setCoords();
    fCanvas.requestRenderAll();
  }, [activeObject]);

  // Keyboard navigation & fine-nudge
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeObject) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // If typing inside an editing textbox without Alt/Shift, let cursor move
        if (activeObject instanceof fabric.Textbox && (activeObject as any).isEditing && !e.altKey) {
          return;
        }

        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;

        handleNudgeObject(dx, dy);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeObject, handleNudgeObject]);

  // Handle changing document page (multi-page documents)
  const handleChangePage = async (newPageIndex: number) => {
    if (newPageIndex < 0 || newPageIndex >= scanData.totalPages || isPageLoading) return;

    setIsPageLoading(true);
    setActiveObject(null);

    try {
      const freshScan = await apiScanEditor(file, newPageIndex);
      setScanData(freshScan);
      setCurrentPage(newPageIndex);
    } catch (err: any) {
      alert(isId ? `Gagal memuat halaman: ${err.message}` : `Failed to load page: ${err.message}`);
    } finally {
      setIsPageLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SAVE & DOWNLOAD PDF PIPELINE (Export direct from Fabric.js canvas)
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSaveAndDownload = async () => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas) return;

    setIsExporting(true);
    setExportProgressText(isId ? 'Mempersiapkan perenderan dokumen...' : 'Preparing document rendering...');

    try {
      // 1. Unselect all objects so selection outlines are hidden during export
      fCanvas.discardActiveObject();

      // 2. Temporarily hide all untouched transparent hitboxes
      const hitboxes: fabric.FabricObject[] = [];
      fCanvas.getObjects().forEach((obj) => {
        if ((obj as any).__isHitbox) {
          obj.set('visible', false);
          hitboxes.push(obj);
        }
      });
      fCanvas.requestRenderAll();

      setExportProgressText(isId ? 'Mengekspor kanvas resolusi penuh...' : 'Exporting full-resolution canvas...');

      // 3. Export at 1:1 native resolution (multiplier = 1 / currentZoom)
      const currentZoom = fCanvas.getZoom();
      const exportMultiplier = 1 / (currentZoom || 1);

      const highResDataUrl = fCanvas.toDataURL({
        format: 'jpeg',
        quality: 0.96,
        multiplier: exportMultiplier,
      });

      // 4. Restore hitboxes
      hitboxes.forEach((h) => h.set('visible', true));
      fCanvas.requestRenderAll();

      // Convert DataURL to binary
      const res = await fetch(highResDataUrl);
      const pageJpegBytes = await res.arrayBuffer();

      setExportProgressText(isId ? 'Mengemas dokumen ke PDF...' : 'Packaging document to PDF...');

      let finalPdfDoc: PDFDocument;
      const fileBytes = await file.arrayBuffer();
      const isOriginalPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      if (isOriginalPdf) {
        finalPdfDoc = await PDFDocument.load(fileBytes);
        const embeddedJpeg = await finalPdfDoc.embedJpg(pageJpegBytes);
        const targetPage = finalPdfDoc.getPage(currentPage);
        const { width, height } = targetPage.getSize();

        // Draw image directly onto page at exact dimensions
        targetPage.drawImage(embeddedJpeg, {
          x: 0,
          y: 0,
          width,
          height,
        });
      } else {
        finalPdfDoc = await PDFDocument.create();
        const embeddedJpeg = await finalPdfDoc.embedJpg(pageJpegBytes);
        const newPage = finalPdfDoc.addPage([scanData.pageWidth, scanData.pageHeight]);
        newPage.drawImage(embeddedJpeg, {
          x: 0,
          y: 0,
          width: scanData.pageWidth,
          height: scanData.pageHeight,
        });
      }

      const pdfBytes = await finalPdfDoc.save();
      const outputBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const outFileName = `${baseName}_edited.pdf`;

      onDownload(outputBlob, outFileName);
    } catch (err: any) {
      console.error('[Save & Download PDF Error]:', err);
      alert(isId ? `Gagal mengekspor PDF: ${err.message}` : `Failed to export PDF: ${err.message}`);
    } finally {
      setIsExporting(false);
      setExportProgressText('');
    }
  };

  const isTextSelected = activeObject instanceof fabric.Textbox || (activeObject && (activeObject as any).text !== undefined);

  return (
    <div className="w-full flex flex-col bg-neutral-950 text-white rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden transition-all my-4">
      
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleInsertImage}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={fontFileInputRef}
        onChange={handleCustomFontUpload}
        accept=".ttf,.otf,.woff,.woff2"
        className="hidden"
      />

      {/* 1. TOP HEADER TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-neutral-900 border-b border-neutral-800">
        
        {/* Left: Back & Metadata */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-neutral-400 hover:text-white hover:bg-neutral-800 px-2.5 h-8 gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-medium">{isId ? 'Kembali' : 'Back'}</span>
          </Button>

          <div className="h-4 w-px bg-neutral-700 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs tracking-wide text-white truncate max-w-[180px] sm:max-w-[260px]">
              {file.name}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ff3700]/15 text-[#ff3700] border border-[#ff3700]/30 font-bold">
              AI Canvas
            </span>
          </div>
        </div>

        {/* Center: Page Controls & Zoom */}
        <div className="flex items-center gap-2">
          {scanData.totalPages > 1 && (
            <div className="flex items-center bg-neutral-800 border border-neutral-700 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => handleChangePage(currentPage - 1)}
                disabled={currentPage === 0 || isPageLoading}
                className="p-1 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
                title={isId ? 'Halaman Sebelumnya' : 'Previous Page'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-[11px] text-neutral-300">
                {currentPage + 1} / {scanData.totalPages}
              </span>
              <button
                onClick={() => handleChangePage(currentPage + 1)}
                disabled={currentPage >= scanData.totalPages - 1 || isPageLoading}
                className="p-1 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
                title={isId ? 'Halaman Berikutnya' : 'Next Page'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Zoom controls */}
          <div className="flex items-center bg-neutral-800 border border-neutral-700 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.15) * 100) / 100))}
              className="p-1 hover:text-white text-neutral-400"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-1.5 font-mono text-[11px] text-neutral-300 min-w-[38px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.15) * 100) / 100))}
              className="p-1 hover:text-white text-neutral-400"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="accent"
            onClick={handleSaveAndDownload}
            disabled={isExporting}
            className="!h-8 px-4 rounded-full font-bold shadow-[0px_2px_12px_rgba(255,55,0,0.4)]"
          >
            {isExporting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{exportProgressText || (isId ? 'Merender PDF...' : 'Rendering PDF...')}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                <span>{isId ? 'Simpan & Unduh' : 'Save & Download'}</span>
              </span>
            )}
          </Button>
        </div>

      </div>

      {/* 2. MAIN TOOLBAR (Tools, Typography, Whiteout, Eyedropper) */}
      <div className="flex flex-wrap items-center gap-2.5 px-4 py-2 bg-neutral-900/95 border-b border-neutral-800 text-xs relative z-40">
        
        {/* Tool selector buttons */}
        <div className="flex items-center gap-1 bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-700">
          <button
            onClick={() => setActiveTool('select')}
            className={`flex items-center gap-1 px-2.5 h-7 rounded-md text-xs font-medium transition-colors ${
              activeTool === 'select'
                ? 'bg-[#ff3700] text-white shadow-xs'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-700'
            }`}
            title="Kursor Seleksi / Klik Teks Asli untuk Mengedit"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pilih</span>
          </button>

          <button
            onClick={handleAddNewTextBox}
            className="flex items-center gap-1 px-2.5 h-7 rounded-md text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
            title="Tambah Kotak Teks Baru"
          >
            <Plus className="w-3.5 h-3.5 text-[#ff3700]" />
            <span className="hidden sm:inline">{isId ? 'Teks' : 'Text'}</span>
          </button>

          <button
            onClick={() => setActiveTool(activeTool === 'whiteout' ? 'select' : 'whiteout')}
            className={`flex items-center gap-1 px-2.5 h-7 rounded-md text-xs font-medium transition-colors ${
              activeTool === 'whiteout'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-700'
            }`}
            title="Kotak Penutup / Whiteout Kertas Manual (Tarik kotak di atas tulisan lama)"
          >
            <Square className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Whiteout</span>
          </button>

          <button
            onClick={handleOpenEyeDropper}
            className={`flex items-center gap-1 px-2.5 h-7 rounded-md text-xs font-medium transition-colors ${
              activeTool === 'eyedropper'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-700'
            }`}
            title="Pipet Warna Kertas / Teks (Ambil sampel warna dari kanvas)"
          >
            <Pipette className="w-3.5 h-3.5 text-blue-300" />
            <span className="hidden sm:inline">{isId ? 'Pipet' : 'Eyedropper'}</span>
          </button>

          <button
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 h-7 rounded-md text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
            title="Sisipkan Gambar atau Tanda Tangan"
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden md:inline">{isId ? 'Gambar' : 'Image'}</span>
          </button>
        </div>

        <div className="h-5 w-px bg-neutral-700 hidden sm:block" />

        {/* FONT FAMILY DROPDOWN WITH LIVE PREVIEW & 20+ GOOGLE FONTS */}
        <div className="relative" ref={fontDropdownRef}>
          <button
            onClick={() => setIsFontDropdownOpen((prev) => !prev)}
            className="h-8 px-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs text-white hover:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#ff3700] flex items-center gap-2 min-w-[150px] justify-between"
            title="Pilih Jenis Huruf (Font)"
          >
            <span
              className="truncate max-w-[120px] text-left"
              style={{ fontFamily: activeFontFamily }}
            >
              {allFonts.find((f) => f.value === activeFontFamily)?.label ||
                activeFontFamily.split(',')[0].replace(/['"]/g, '')}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          </button>

          {isFontDropdownOpen && (
            <div className="absolute left-0 top-9 w-64 max-h-80 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col">
              <div className="p-2 border-b border-neutral-800 flex items-center gap-1.5 bg-neutral-950/70">
                <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-1" />
                <input
                  type="text"
                  value={fontSearchQuery}
                  onChange={(e) => setFontSearchQuery(e.target.value)}
                  placeholder={isId ? 'Cari font...' : 'Search fonts...'}
                  className="w-full bg-transparent text-xs text-white placeholder-neutral-500 outline-none"
                  autoFocus
                />
              </div>

              <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                {filteredFonts.map((f) => {
                  const isSelected = activeFontFamily === f.value;
                  return (
                    <button
                      key={f.value}
                      onClick={() => {
                        handleApplyFont(f.value);
                        setIsFontDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-colors ${
                        isSelected
                          ? 'bg-[#ff3700]/20 text-[#ff3700] border border-[#ff3700]/40'
                          : 'hover:bg-neutral-800 text-neutral-200'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm" style={{ fontFamily: f.value }}>
                          {f.label}
                        </span>
                        <span className="text-[9px] font-mono text-neutral-500">
                          {f.categoryLabel}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#ff3700]" />}
                    </button>
                  );
                })}
              </div>

              <div className="p-2 border-t border-neutral-800 bg-neutral-950/90">
                <button
                  onClick={() => fontFileInputRef.current?.click()}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white flex items-center justify-center gap-2 text-xs font-semibold border border-neutral-700 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#ff3700]" />
                  <span>{isId ? 'Upload Font (.ttf / .otf)' : 'Upload Font (.ttf / .otf)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-1 bg-neutral-800 border border-neutral-700 rounded-lg px-2 h-8">
          <span className="text-[10px] text-neutral-400 font-mono mr-0.5">{isId ? 'Ukuran:' : 'Size:'}</span>
          <button
            onClick={() => handleApplyFontSize(activeFontSize - 1)}
            className="px-1 text-neutral-300 hover:text-white font-bold"
          >
            -
          </button>
          <span className="font-mono font-bold w-6 text-center text-white">
            {activeFontSize}
          </span>
          <button
            onClick={() => handleApplyFontSize(activeFontSize + 1)}
            className="px-1 text-neutral-300 hover:text-white font-bold"
          >
            +
          </button>
        </div>

        {/* Bold, Italic, Underline */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleBold}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
              isBold
                ? 'bg-[#ff3700] text-white border-[#ff3700]'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
            }`}
            title="Tebalkan Huruf (Bold)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleToggleItalic}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
              isItalic
                ? 'bg-[#ff3700] text-white border-[#ff3700]'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
            }`}
            title="Miringkan Huruf (Italic)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleToggleUnderline}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
              isUnderline
                ? 'bg-[#ff3700] text-white border-[#ff3700]'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
            }`}
            title="Garis Bawah (Underline)"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alignment */}
        <div className="hidden lg:flex items-center gap-0.5 bg-neutral-800 border border-neutral-700 rounded-lg p-0.5 h-8">
          <button
            onClick={() => handleApplyTextAlign('left')}
            className={`p-1 rounded ${textAlign === 'left' ? 'bg-[#ff3700] text-white' : 'text-neutral-300 hover:text-white'}`}
            title="Rata Kiri"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleApplyTextAlign('center')}
            className={`p-1 rounded ${textAlign === 'center' ? 'bg-[#ff3700] text-white' : 'text-neutral-300 hover:text-white'}`}
            title="Rata Tengah"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleApplyTextAlign('right')}
            className={`p-1 rounded ${textAlign === 'right' ? 'bg-[#ff3700] text-white' : 'text-neutral-300 hover:text-white'}`}
            title="Rata Kanan"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleApplyTextAlign('justify')}
            className={`p-1 rounded ${textAlign === 'justify' ? 'bg-[#ff3700] text-white' : 'text-neutral-300 hover:text-white'}`}
            title="Rata Kanan-Kiri"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Color */}
        <div className="flex items-center gap-1.5 bg-neutral-800 border border-neutral-700 rounded-lg px-2 h-8">
          <span className="text-[10px] text-neutral-400 font-mono">{isId ? 'Teks:' : 'Text:'}</span>
          <input
            type="color"
            value={activeTextColor}
            onChange={(e) => handleApplyTextColor(e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
            title="Warna Font"
          />
        </div>

        {/* Paper / Whiteout Background Color */}
        <div className="flex items-center gap-1.5 bg-neutral-800 border border-neutral-700 rounded-lg px-2 h-8">
          <span className="text-[10px] text-neutral-400 font-mono">{isId ? 'Kertas:' : 'Paper:'}</span>
          <input
            type="color"
            value={currentPaperColor}
            onChange={(e) => handleApplyPaperColor(e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
            title="Warna Kertas Penutup / Tambalan Scan"
          />
          <span className="text-[10px] font-mono text-neutral-400 hidden xl:inline">
            {currentPaperColor}
          </span>
        </div>

        {/* Fine-nudge arrow buttons */}
        <div className="hidden xl:flex items-center gap-0.5 bg-neutral-800 border border-neutral-700 rounded-lg px-1.5 h-8">
          <span className="text-[10px] text-neutral-400 font-mono mr-1">Geser:</span>
          <button
            onClick={() => handleNudgeObject(-1, 0)}
            className="w-5 h-6 rounded flex items-center justify-center hover:bg-neutral-700 text-neutral-300 hover:text-white"
            title="Geser Kiri 1px"
          >
            ◀
          </button>
          <button
            onClick={() => handleNudgeObject(0, -1)}
            className="w-5 h-6 rounded flex items-center justify-center hover:bg-neutral-700 text-neutral-300 hover:text-white"
            title="Geser Atas 1px"
          >
            ▲
          </button>
          <button
            onClick={() => handleNudgeObject(0, 1)}
            className="w-5 h-6 rounded flex items-center justify-center hover:bg-neutral-700 text-neutral-300 hover:text-white"
            title="Geser Bawah 1px"
          >
            ▼
          </button>
          <button
            onClick={() => handleNudgeObject(1, 0)}
            className="w-5 h-6 rounded flex items-center justify-center hover:bg-neutral-700 text-neutral-300 hover:text-white"
            title="Geser Kanan 1px"
          >
            ▶
          </button>
        </div>

        {/* Delete / Erase active object */}
        {activeObject && (
          <button
            onClick={handleDeleteActiveObject}
            className="flex items-center gap-1 ml-auto px-2.5 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors cursor-pointer"
            title="Hapus objek ini (Teks lama tetap tertutup rapi oleh tambalan kertas)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="font-semibold text-xs">{isId ? 'Hapus' : 'Delete'}</span>
          </button>
        )}

      </div>

      {/* 3. INTERACTIVE FABRIC.JS CANVAS VIEWPORT */}
      <div
        ref={viewportContainerRef}
        className="w-full min-h-[620px] max-h-[80vh] overflow-auto p-6 sm:p-10 bg-neutral-950/70 flex justify-center items-start relative select-none"
      >
        {isPageLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3 text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#ff3700]" />
            <span className="text-sm font-mono">
              {isId ? 'Memindai area teks & warna dokumen...' : 'Scanning document text & colors...'}
            </span>
          </div>
        ) : (
          <div className="relative shadow-2xl border border-black/15 rounded-sm bg-white overflow-hidden">
            <canvas ref={canvasElementRef} />
          </div>
        )}
      </div>

    </div>
  );
};
