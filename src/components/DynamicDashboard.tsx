import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
// ===================================================
// Imports dos Widgets (devem ficar no topo do módulo)
// ===================================================
// Se seus widgets ficam em src/components/Widget/*, ajuste estes imports:
// Widget implementations are rendered by DashboardRenderEngine; imports removed to avoid unused warnings
// Renderizador centralizado (nova arquitetura - Fase 5)
import { DashboardRenderEngine } from './DashboardRenderEngine';
// Context para dados dos widgets
import { WidgetDataProvider } from '../contexts/WidgetDataContext';
// Dev-only floating logger (caminho relativo dentro de src/components)
// DevLogButton intentionally not imported in production build

// =========================
// Tipos (mínimos e seguros)
// =========================
type JsonValue = any;

export interface DashboardTheme {
  primaryColor?: string;
  backgroundColor?: string;
  borderRadius?: string;
  fontFamily?: string;
}

export interface CanvasConfig {
  width?: number;
  height?: number;
  backgroundColor?: string;
  gridSize?: number;
  snapToGrid?: boolean;
  showGrid?: boolean;
  padding?: string;
}

// Adicionei 'container' aqui para suportar o ContainerWidgetRenderer
export type WidgetType =
  | 'kpi'
  | 'chart'
  | 'list'
  | 'aggrid'
  | 'text'
  | 'image'
  | 'chat'
  | 'container';

export interface DashboardWidget {
  id: number;
  widget_type: WidgetType;
  widget_id: string;
  title: string;

  position_x: number;
  position_y: number;
  width: number;
  height: number;
  z_index: number;

  data_config?: Record<string, JsonValue> | null;
  visual_config?: Record<string, JsonValue> | null;
  behavior_config?: Record<string, JsonValue> | null;

  is_visible?: boolean;
  is_locked?: boolean;
}

export interface DashboardResponse {
  id: number;
  user_id: number;
  name: string;
  description?: string | null;
  is_active?: boolean;
  is_default?: boolean;
  theme_config?: DashboardTheme | null;
  canvas_config?: CanvasConfig | null;
  widgets: DashboardWidget[];
}

export interface DynamicDashboardProps {
  dashboardId?: number | string;       // aceita string para evitar TS2345 vindo de query param
  userId?: number | string;            // idem
  defaultDashboardId?: number | string;// idem
  dashboardName?: string;              // Nome do dashboard para exibição
  onDashboardChange?: (dashboardId: number) => void; // Callback quando dashboard muda
  // Quando fornecido, ignora o fetch e renderiza diretamente (Preview do Builder)
  dashboardConfig?: DashboardResponse | any;
}

// ====================================
// Styled-components (fallbacks mínimos)
// ====================================
const DashboardRoot = styled.div<{ $themeCfg: DashboardTheme }>`
  /* Container principal do dashboard - 100% responsivo */
  width: 100%;
  height: 100%;
  background-color: ${(p) => p.$themeCfg.backgroundColor || '#ffffff'};
  font-family: ${(p) => p.$themeCfg.fontFamily || 'sans-serif'};
  
  /* Sem padding/margin - canvas gerencia próprio espaço */
  padding: 0;
  margin: 0;
  
  /* Flex para alocar espaço ao Canvas */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  
  /* Responsividade ao sidebar */
  flex: 1;
  min-width: 0;
  min-height: 0;
`;

const Canvas = styled.div<{ $canvas: CanvasConfig }>`
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;
  /* reservar espaço inferior para o footer fixo do app */
  padding: ${(p) => (p.$canvas.padding || '0px')};
  padding-bottom: calc(var(--app-footer-height, 56px) + 12px);
  flex: 1;
  min-height: 0;
  min-width: 0;
  background-color: ${(p) => p.$canvas.backgroundColor || 'transparent'};
  overflow-x: auto;
  overflow-y: auto;
  box-sizing: border-box;
`;

// WidgetLayer removed; rendering delegated to DashboardRenderEngine

// (imports de widgets movidos para o topo para cumprir eslint import/first)

// =======================================
// Funções utilitárias e normalizações
// =======================================
const defaultTheme: DashboardTheme = {
  backgroundColor: '#ffffff',
  fontFamily: 'sans-serif',
};

const defaultCanvas: CanvasConfig = {
  backgroundColor: 'transparent',
  gridSize: 10,
  snapToGrid: true,
  showGrid: false,
};

function normalizeTheme(theme?: DashboardTheme | null): DashboardTheme {
  return {
    primaryColor: theme?.primaryColor || '',
    backgroundColor: theme?.backgroundColor || defaultTheme.backgroundColor,
    borderRadius: theme?.borderRadius || '',
    fontFamily: theme?.fontFamily || defaultTheme.fontFamily,
  };
}

function normalizeCanvas(canvas?: CanvasConfig | null): CanvasConfig {
  return {
    width: canvas?.width,
    height: canvas?.height,
    backgroundColor: canvas?.backgroundColor || defaultCanvas.backgroundColor,
    gridSize: canvas?.gridSize ?? defaultCanvas.gridSize,
    snapToGrid: canvas?.snapToGrid ?? defaultCanvas.snapToGrid,
    showGrid: canvas?.showGrid ?? defaultCanvas.showGrid,
  };
}

// Coerção segura para números (evita TS2345 quando props vêm como string)
function toNum(v?: number | string): number | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * 🔧 CRÍTICO: Normalizar widgets vindos do backend (IGUAL ao DashboardBuilder)
 * 
 * GARANTE que DynamicDashboard renderiza IDÊNTICO a DashboardBuilder
 * Ambos usam MESMO pipeline de normalização (single source of truth)
 * 
 * @param widget Widget cru do backend
 * @returns Widget normalizado com tipos corretos e JSON parseado
 */
function normalizeBackendWidget(widget: any): DashboardWidget {
  const parseJsonIfString = (val: any): Record<string, any> => {
    if (!val) return {};
    if (typeof val === 'string' && val) {
      try {
        return JSON.parse(val);
      } catch (e) {
        console.error(`[normalizeBackendWidget] Falha ao parsear JSON:`, val, e);
        return {}; // ✅ Fallback: objeto vazio (NÃO undefined!)
      }
    }
    return (typeof val === 'object' ? val : {});
  };

  console.log(`[normalizeBackendWidget] Normalizando widget id=${widget.id}, title="${widget.title}"`);
  
  const normalized: DashboardWidget = {
    id: Number(widget.id) || 0,
    widget_type: widget.widget_type || 'text',
    widget_id: String(widget.widget_id || widget.id),
    title: widget.title || '',
    
    // 🔧 Posições sempre como números (nunca string)
    position_x: Number(widget.position_x) || 0,
    position_y: Number(widget.position_y) || 0,
    width: Number(widget.width) || 300,
    height: Number(widget.height) || 200,
    z_index: Number(widget.z_index) || 1,
    
    // Propriedades booleanas
    is_visible: widget.is_visible !== false,
    is_locked: widget.is_locked === true,
    
    // 🔧 JSON SEMPRE parseado (nunca string!)
    data_config: parseJsonIfString(widget.data_config),
    visual_config: parseJsonIfString(widget.visual_config),
    behavior_config: parseJsonIfString(widget.behavior_config),
  };

  console.log(`   ➜ Normalizado: pos=[${normalized.position_x}, ${normalized.position_y}], size=[${normalized.width}x${normalized.height}]`);
  console.log(`   ➜ dataConfig keys:`, Object.keys(normalized.data_config || {}));
  console.log(`   ➜ visualConfig keys:`, Object.keys(normalized.visual_config || {}));
  
  return normalized;
}

// Normaliza payloads de dados vindos dos endpoints para uma forma consistente esperada pelo frontend
function normalizeWidgetPayload(payload: any): any {
  if (!payload) return {};

  // Se já contém rows/columns/value/data, retorna com pequenas normalizações
  if (payload.rows || payload.columns || payload.value !== undefined || payload.data) {
    const out: any = {};
    if (payload.rows) out.rows = payload.rows;
    if (payload.columns) out.columns = payload.columns;
    if (payload.value !== undefined) out.value = payload.value;
    if (payload.data) out.data = payload.data;
    // Algumas APIs retornam { data: { value } }
    if (!out.value && payload.data && payload.data.value !== undefined) out.value = payload.data.value;
    return out;
  }

  // Se payload for um array, considera como rows
  if (Array.isArray(payload)) return { rows: payload };

  // Algumas respostas vêm como { result: [...] } ou { payload: { rows: [...] } }
  if (payload.result && Array.isArray(payload.result)) return { rows: payload.result };
  if (payload.payload && payload.payload.rows) return { rows: payload.payload.rows, columns: payload.payload.columns };

  // Se for um objeto simples com propriedades numéricas, pode ser um KPI com value
  const keys = Object.keys(payload || {});
  if (keys.length === 1 && typeof payload[keys[0]] === 'number') {
    return { value: payload[keys[0]] };
  }

  // Fallback: embrulha no campo data
  return { data: payload };
}

// extractContainerChildIds removed — DashboardRenderEngine centraliza containers

// ===================================================================================
// DynamicDashboard - carrega dashboard e renderiza widgets 100% via JSON do backend
// ===================================================================================
const DynamicDashboard: React.FC<DynamicDashboardProps> = ({
  dashboardId,
  userId,
  defaultDashboardId,
  dashboardName,
  onDashboardChange,
  dashboardConfig,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [theme, setTheme] = useState<DashboardTheme>(defaultTheme);
  const [canvas, setCanvas] = useState<CanvasConfig>(defaultCanvas);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);

  // Carrega a configuração do dashboard: usa a prop `dashboardConfig` quando fornecida
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        let dash: DashboardResponse | undefined = undefined;
        if (dashboardConfig) {
          dash = dashboardConfig as DashboardResponse;
        } else {
          // tenta carregar via props (dashboardId / userId / defaultDashboardId)
          dash = await loadDashboard({ dashboardId, userId, defaultDashboardId });
        }

        if (!cancelled && dash) {
          // normaliza tema e canvas
          setTheme(normalizeTheme(dash.theme_config));
          setCanvas(normalizeCanvas(dash.canvas_config));

          // 🔧 CRÍTICO: Normalizar CADA widget (JSON parseado, posições como números)
          // Isso garante que DynamicDashboard renderiza IDÊNTICO a DashboardBuilder
          const normalizedWidgets = (Array.isArray(dash.widgets) ? dash.widgets : [])
            .map(w => normalizeBackendWidget(w));
          
          console.log(`[DynamicDashboard] ✅ Carregado dashboard com ${normalizedWidgets.length} widgets normalizados`);
          setWidgets(normalizedWidgets);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || String(err));
          setLoading(false);
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, [dashboardConfig, dashboardId, userId, defaultDashboardId]);

  // Map simples para dados de widget (pré-carregamento opcional)
  // usa chave string|number porque guardamos tanto por id numérico quanto por widget_id string
  const widgetDataRef = useRef<Record<string, any>>({});

  // State para forçar re-render quando dados chegam
  // Em vez de usar key, vamos usar um estado que passa os dados como prop
  const [widgetDataState, setWidgetDataState] = useState<Record<string, any>>({});

  // containerChildWidgetIds logic removed — DashboardRenderEngine trata containers/filhos

  // Pré-carregamento dinâmico dos dados dos widgets (KPIs, Chart, AG Grid etc.)
  useEffect(() => {
    let cancelled = false;

    async function preload() {
      console.log('[DynamicDashboard] preload() iniciando com', widgets.length, 'widgets');
      for (const w of widgets) {
        const dataCfg = w.data_config || {};
        console.log(`[DynamicDashboard] Widget ${w.widget_id ?? w.id} data_config keys:`, Object.keys(dataCfg), 'data_config:', JSON.stringify(dataCfg));
        // Busca por query_id: top-level do widget (coluna direta no BD) ou dentro de data_config
        const queryId = (w as any).query_id ?? dataCfg.query_id ?? dataCfg.queryId;
        console.log(`[DynamicDashboard] Widget ${w.widget_id ?? w.id} resolved queryId:`, queryId);
        // Pula preloading para widgets não data-driven quando não há query explícito
        const nonDataTypes = new Set(['container', 'text', 'image', 'chat']);
        if (nonDataTypes.has(w.widget_type) && !queryId) {
          continue;
        }
        if (queryId) {
          // Tenta primeiro endpoint v1, se falhar tenta compat v2
          // URLs relativas - proxy dev server redireciona para http://localhost:8080
          // eslint-disable-next-line no-console
          console.log('[DynamicDashboard] PRELOAD: widget', w.widget_id ?? w.id, 'queryId', queryId, 'widgetType', w.widget_type);
          const candidates = [
            `/api/v1/dashboard-queries/${queryId}/execute`,
            `/api/v2/dashboard-builder/queries/${queryId}/execute`,
            `/api/v2/dashboard-queries/${queryId}/execute`,
            // fallback por chave textual (ex: kpiCaixa) - novo endpoint no backend
            `/api/v1/dashboard-queries/key/${queryId}/execute`,
            `/api/v2/dashboard-queries/key/${queryId}/execute`,
          ];
          let got = false;
          for (const url of candidates) {
            try {
              // eslint-disable-next-line no-console
              console.log('[DynamicDashboard] tentando fetch:', url);
              
              // Criar AbortController com timeout de 10s
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000);
              
              const filialLocal = localStorage.getItem('filialId') || '001';
              const bodyParams = {
                filial: filialLocal,
                ...(dataCfg.parameters || {})
              };
              const r = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ parameters: bodyParams }),
                signal: controller.signal,
              });
              clearTimeout(timeoutId);
              
              // eslint-disable-next-line no-console
              console.log('[DynamicDashboard] fetch resposta status:', r.status, 'url:', url);
              if (r.ok) {
                const payload = await r.json();
                if (!cancelled) {
                  // normalize payload shape
                  const normalized = normalizeWidgetPayload(payload);
                  // debug: log widget data load
                  // eslint-disable-next-line no-console
                  console.log('[DynamicDashboard] preload: widget', w.widget_id ?? w.id, 'loaded via', url, '->', normalized);
                  // guarda tanto pelo id numérico quanto pelo widget_id (string)
                  if (w.id !== undefined && w.id !== null) widgetDataRef.current[w.id] = normalized;
                  if (w.widget_id !== undefined && w.widget_id !== null) widgetDataRef.current[String(w.widget_id)] = normalized;
                }
                got = true;
                break;
              }
            } catch (e) {
              // ignore and try next
              // eslint-disable-next-line no-console
              console.log('[DynamicDashboard] fetch error em', url, ':', String(e), 'Exception:', e);
            }
          }
          if (got) {
            // eslint-disable-next-line no-console
            console.log('[DynamicDashboard] ✅ Dados carregados com sucesso para widget', w.widget_id ?? w.id);
            continue;
          } else {
            // eslint-disable-next-line no-console
            console.warn('[DynamicDashboard] ❌ FALHA: Nenhum endpoint funcionou para queryId', queryId, 'widget', w.widget_id ?? w.id);
          }
        }

        // Se não há queryId, tentar buscar por widget_id textual (key) — útil quando
        // widgets são identificados por chaves como 'kpiCaixa' ou 'graficoFluxo'
        const widKey = w.widget_id !== undefined && w.widget_id !== null ? String(w.widget_id) : undefined;
        if (widKey) {
          console.debug('[DynamicDashboard] tentando buscar por widget_id:', widKey);
          // URLs relativas - proxy dev server redireciona para http://localhost:8080
          const keyCandidates = [
            `/api/v1/dashboard-queries/key/${encodeURIComponent(widKey)}/execute`,
            `/api/v2/dashboard-queries/key/${encodeURIComponent(widKey)}/execute`,
          ];
          let gotKey = false;
          for (const url of keyCandidates) {
            try {
              console.debug('[DynamicDashboard] tentando fetch por key:', url);
              
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000);
              
              const filialLocal = localStorage.getItem('filialId') || '001';
              const bodyParams = {
                filial: filialLocal,
                ...(dataCfg.parameters || {})
              };
              const r = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ parameters: bodyParams }),
                signal: controller.signal,
              });
              clearTimeout(timeoutId);
              
              console.debug('[DynamicDashboard] fetch key resposta status:', r.status);
              if (r.ok) {
                const payload = await r.json();
                if (!cancelled) {
                  const normalized = normalizeWidgetPayload(payload);
                  // eslint-disable-next-line no-console
                  console.debug('[DynamicDashboard] preload (by widget_id): widget', widKey, 'loaded via', url, '->', normalized);
                  if (w.id !== undefined && w.id !== null) widgetDataRef.current[w.id] = normalized;
                  if (w.widget_id !== undefined && w.widget_id !== null) widgetDataRef.current[String(w.widget_id)] = normalized;
                }
                gotKey = true;
                break;
              }
            } catch (e) {
              // ignore
              console.debug('[DynamicDashboard] fetch key error em', url, ':', String(e).substring(0, 100));
            }
          }
          if (gotKey) continue;
        }

        // Fallback: tentar endpoint por widget (id numérico)
        try {
          console.debug('[DynamicDashboard] tentando fallback:', `/api/v2/widget/${w.id}/data`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const rr = await fetch(`/api/v2/widget/${w.id}/data`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          
          console.debug('[DynamicDashboard] fallback resposta status:', rr.status);
          if (rr.ok) {
            const payload = await rr.json();
            if (!cancelled) {
                // Normalizar payload para forma esperada pelo frontend
                // Backend devolve { data: ... } no endpoint /api/v2/widget/{id}/data
                const normalized = normalizeWidgetPayload(payload);
                // eslint-disable-next-line no-console
                console.debug('[DynamicDashboard] fallback preload: widget', w.widget_id ?? w.id, 'loaded via /api/v2/widget/{id}/data ->', normalized);
                if (w.id !== undefined && w.id !== null) widgetDataRef.current[w.id] = normalized;
                if (w.widget_id !== undefined && w.widget_id !== null) widgetDataRef.current[String(w.widget_id)] = normalized;
            }
          }
        } catch (ee) {
          // ignore
          console.debug('[DynamicDashboard] fallback error:', String(ee).substring(0, 100));
        }
        // Outras fontes futuras: endpoint, dataSource, etc.
      }
      if (!cancelled) {
        // Forçar re-render após carregamento dos dados
        // Copia os dados do useRef para o state para disparar re-render
        // eslint-disable-next-line no-console
        console.log('[DynamicDashboard] Preload finalizado. Dados carregados para chaves:', Object.keys(widgetDataRef.current), 'Data:', widgetDataRef.current);
        setWidgetDataState({ ...widgetDataRef.current });
        // eslint-disable-next-line no-console
        console.log('[DynamicDashboard] setWidgetDataState foi chamado com os dados!');
        // Expor dados no window para inspeção rápida no console (debug runtime)
        try {
          // @ts-ignore
          (window as any).__dashboardWidgetData = { ...widgetDataRef.current };
          // eslint-disable-next-line no-console
          console.log('[DynamicDashboard] window.__dashboardWidgetData exposto com chaves:', Object.keys((window as any).__dashboardWidgetData || {}));
        } catch (e) {
          // Não bloquear se window não estiver disponível
          // eslint-disable-next-line no-console
          console.warn('[DynamicDashboard] falha ao expor window.__dashboardWidgetData:', e);
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn('[DynamicDashboard] preload() foi CANCELADO antes de terminar!');
      }
    }

    console.log('[DynamicDashboard] useEffect dependency widgets.length=', widgets.length);
    if (widgets.length) {
      console.log('[DynamicDashboard] iniciando preload()...');
      preload().catch(err => console.error('[DynamicDashboard] preload error:', err));
    } else {
      console.warn('[DynamicDashboard] widgets.length === 0, preload() não será executado!');
    }
    return () => { cancelled = true; };
  }, [widgets]);

  // ⚠️ RENDERIZAÇÃO CENTRALIZADA
  // DashboardRenderEngine agora é responsável por TODA renderização de widgets
  // Isso garante sincronização correta de dados, containers e filhos
  
  // Funções antigas removidas (renderWidgetContent e renderWidgetPositioned)
  // Veja DashboardRenderEngine.tsx para o novo padrão centralizado

  if (loading) {
    return <div>Carregando dashboard...</div>;
  }

  if (error) {
    // Se não há dashboard disponível, não renderiza nada (silencioso conforme pedido do usuário)
    if (error.includes('Nenhum dashboard disponível')) {
      return null;
    }
    return <div>Erro: {error}</div>;
  }

  return (
    <DashboardRoot $themeCfg={theme}>
      <WidgetDataProvider data={widgetDataState}>
        <Canvas $canvas={canvas}>
          <DashboardRenderEngine
            config={{
              id: toNum(dashboardId) || 1,
              name: 'Dashboard',
              isActive: true,
              canvasConfig: canvas,
              themeConfig: theme,
              // 🔧 CRÍTICO: Widgets JÁ foram normalizados em setWidgets()
              // NÃO fazer normalização NOVAMENTE aqui!
              // Usar DIRETAMENTE os widgets normalizados
              widgets: widgets.map((w) => ({
                id: Number(w.id) || 0,
                widgetId: String(w.widget_id || w.id),
                title: w.title || '',
                widgetType: w.widget_type,
                positionX: w.position_x || 0,
                positionY: w.position_y || 0,
                width: w.width || 300,
                height: w.height || 200,
                zIndex: w.z_index || 1,
                isVisible: w.is_visible !== false,
                isLocked: w.is_locked === true,
                // ✅ JSON já parseado pela normalizeBackendWidget()
                visualConfig: w.visual_config || undefined,
                dataConfig: w.data_config || undefined,
                behaviorConfig: w.behavior_config || undefined,
              })),
            }}
            mode="view"
          />
        </Canvas>
      </WidgetDataProvider>
      {/* <DevLogButton /> Removido para evitar overlay duplicado */}
    </DashboardRoot>
  );
};

export default DynamicDashboard;

// ============================
// Funções de carregamento HTTP
// ============================
async function loadDashboard(args: {
  dashboardId?: number | string;
  userId?: number | string;
  defaultDashboardId?: number | string;
}): Promise<DashboardResponse> {
  const { dashboardId, userId, defaultDashboardId } = args;

  const dashId = toNum(dashboardId);
  const usrId = toNum(userId);
  const defId = toNum(defaultDashboardId);

  console.log('[loadDashboard] Args recebidos:', { dashboardId, userId, defaultDashboardId });
  console.log('[loadDashboard] IDs normalizados:', { dashId, usrId, defId });

  // URLs relativas - proxy dev server redireciona para http://localhost:8080
  // Em produção, construir a URL completa baseada no window.location.origin se necessário
  
  // Cache-buster para evitar 404 cacheado pelo navegador
  const cacheKey = `?_=${Date.now()}`;

  // 1) Tenta por dashboardId explícito
  if (dashId !== undefined) {
    const url = `/api/v2/dashboards/${dashId}?_=${Date.now()}`;
    console.log('[loadDashboard] Tentativa 1 - dashboardId:', url);
    const r = await fetch(url);
    console.log('[loadDashboard] Resposta 1:', { status: r.status, ok: r.ok });
    if (!r.ok) {
      const errorText = await r.text();
      console.log('[loadDashboard] Erro 1:', errorText);
      throw new Error(`Não foi possível carregar o dashboard ${dashId}. Status: ${r.status}`);
    }
    return await r.json();
  }

  // 2) Tenta padrão do usuário
  if (usrId !== undefined) {
    const url = `/api/v2/dashboards/default?userId=${usrId}&_=${Date.now()}`;
    console.log('[loadDashboard] Tentativa 2 - userId default:', url);
    const r = await fetch(url);
    console.log('[loadDashboard] Resposta 2:', { status: r.status, ok: r.ok });
    if (r.ok) {
      const json: DashboardResponse = await r.json();
      if (json && json.id) return json;
    }
  }

  // 3) Fallback: tenta defaultDashboardId se fornecido
  if (defId !== undefined) {
    const url = `/api/v2/dashboards/${defId}?_=${Date.now()}`;
    console.log('[loadDashboard] Tentativa 3 - defaultDashboardId:', url);
    const r = await fetch(url);
    console.log('[loadDashboard] Resposta 3:', { status: r.status, ok: r.ok });
    if (!r.ok) {
      const errorText = await r.text();
      console.log('[loadDashboard] Erro 3:', errorText);
      throw new Error(`Não foi possível carregar o dashboard padrão ${defId}. Status: ${r.status}`);
    }
    return await r.json();
  }

  // 4) Se nada funcionou, falha de forma controlada
  console.log('[loadDashboard] ❌ Nenhum ID de dashboard foi encontrado para o usuário.');
  throw new Error('Nenhum dashboard disponível para renderização.');
}













