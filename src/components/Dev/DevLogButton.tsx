import React, { useState } from 'react';
import styled from 'styled-components';

const Floating = styled.div`
  position: fixed;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
`;

const DragHandle = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  z-index: 100001;
  background: rgba(255,255,255,0.7);
  border-bottom-left-radius: 8px;
`;

const ResizeHandle = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  z-index: 100001;
  background: rgba(255,255,255,0.7);
  border-top-left-radius: 6px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
`;

const Btn = styled.button`
  background: #0b5fff;
  color: white;
  border: none;
  padding: 10px 12px;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(11,95,255,0.18);
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
`;

const Small = styled.button`
  background: #ffffffcc;
  color: #0b5fff;
  border: 1px solid #c6dbff;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
`;

const ModalBg = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
`;

const Modal = styled.div`
  width: 840px;
  max-width: calc(100% - 40px);
  max-height: calc(100% - 80px);
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 12px 40px rgba(2,6,23,0.25);
  display: flex;
  flex-direction: column;
`;

const LogArea = styled.pre`
  flex: 1;
  overflow: auto;
  background: #0f1724;
  color: #e6eef8;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
`;

const ActionsRow = styled.div`
  display:flex;
  gap:8px;
  margin-top:8px;
`;

const isDev = process.env.NODE_ENV !== 'production';

const DevLogButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [activated, setActivated] = useState<boolean>(() => {
    try { return !!(window as any).__DEV_OVERLAY_ACTIVATED; } catch (e) { return false; }
  });
  const [pos, setPos] = useState({ x: window.innerWidth - 320, y: window.innerHeight - 180 });
  const [size, setSize] = useState({ width: 320, height: 180 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const dragOffset = React.useRef({ x: 0, y: 0 });
  const resizeOffset = React.useRef({ x: 0, y: 0 });

  // Drag logic
  // Drag handle logic
  const onDragHandleDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    document.body.style.userSelect = 'none';
    e.stopPropagation();
  };

  // Resize handle logic
  const onResizeHandleDown = (e: React.MouseEvent) => {
    setResizing(true);
    resizeOffset.current = {
      x: e.clientX,
      y: e.clientY,
    };
    document.body.style.userSelect = 'none';
    e.stopPropagation();
  };

  React.useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragging) {
        setPos({
          x: Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - size.width)),
          y: Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - size.height)),
        });
      }
      if (resizing) {
        setSize({
          width: Math.max(200, Math.min(size.width + (e.clientX - resizeOffset.current.x), window.innerWidth - pos.x)),
          height: Math.max(100, Math.min(size.height + (e.clientY - resizeOffset.current.y), window.innerHeight - pos.y)),
        });
        resizeOffset.current = { x: e.clientX, y: e.clientY };
      }
    };
    const onMouseUp = () => {
      setDragging(false);
      setResizing(false);
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, resizing, size, pos]);

  const refresh = () => {
    try {
      const l = (window as any).__DEV_LOGGER__?.getLogs?.() ?? [];
      setLogs(Array.isArray(l) ? l.slice().reverse() : []);
    } catch (e) {
      setLogs([]);
    }
  };

  const exportLogs = () => {
    try { (window as any).__DEV_LOGGER__?.exportLogs?.(); } catch (e) { /* ignore */ }
  };

  const clear = () => {
    try { (window as any).__DEV_LOGGER__?.clearLogs?.(); setLogs([]); } catch (e) { /* ignore */ }
  };

  React.useEffect(() => {
    const handler = () => setActivated(true);
    document.addEventListener('dev-overlay-activated', handler as EventListener);
    return () => document.removeEventListener('dev-overlay-activated', handler as EventListener);
  }, []);

  if (!isDev) return null;
  if (!activated) return null;

  return (
    <Floating style={{ left: pos.x, top: pos.y, width: size.width, height: size.height, boxSizing: 'border-box', background: '#222', color: '#0f0', borderRadius: 8, padding: 8 }}>
      <DragHandle onMouseDown={onDragHandleDown} title="Arraste para mover">
        <span role="img" aria-label="drag">🖱️</span>
      </DragHandle>
      <ResizeHandle onMouseDown={onResizeHandleDown} title="Arraste para redimensionar">
        <span style={{fontSize:12}}>↔️</span>
      </ResizeHandle>
      <Btn
        onClick={() => { refresh(); setOpen(true); }}
        style={{ cursor: 'pointer', marginBottom: 4 }}
      >
        Logs
      </Btn>
      {open && (
        <ModalBg onClick={() => setOpen(false)}>
          <Modal onClick={(e)=>e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <strong>Dev Logs (ultimo)</strong>
              <div style={{display:'flex', gap:8}}>
                <Small onClick={refresh}>Atualizar</Small>
                <Small onClick={exportLogs}>Exportar</Small>
                <Small onClick={clear}>Limpar</Small>
                <Small onClick={() => setOpen(false)}>Fechar</Small>
              </div>
            </div>
            <LogArea>{logs.map((l,i)=>`[${l.ts}] ${l.level.toUpperCase()} - ${l.args.map((a:any)=>{ try { return typeof a==='string'?a:JSON.stringify(a); } catch(e){ return String(a);} }).join(' | ')}${l.stack?"\n"+l.stack:""}`).join('\n\n')}</LogArea>
            <ActionsRow/>
          </Modal>
        </ModalBg>
      )}
    </Floating>
  );
};

export default DevLogButton;













