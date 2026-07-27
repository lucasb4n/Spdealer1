UPDATE form_templates 
SET template_code = '/* ============================================================================
 * SPDealer - Estilos Globais (Padrao v3.0)
 * Gerado automaticamente pelo FORMBUILD em {{generatedDate}}
 * Documentacao: docs/PADRAO_ESQUELETO_FORMULARIO.md
 * ============================================================================ */

/* ---------- TOKENS DE DESIGN ---------- */
:root {
  --sp-primary: #2563EB;
  --sp-primary-hover: #1D4ED8;
  --sp-success: #16A34A;
  --sp-success-hover: #22C55E;
  --sp-danger: #EF4444;
  --sp-danger-hover: #DC2626;
  --sp-secondary: #6B7280;
  --sp-secondary-hover: #4B5563;
  --sp-dark: #0F172A;
  --sp-dark-border: #1E293B;
  --sp-text-primary: #1F2937;
  --sp-text-secondary: #6B7280;
  --sp-text-muted: #64748B;
  --sp-bg-page: #F1F5F9;
  --sp-bg-card: #FFFFFF;
  --sp-bg-content: #F9FAFB;
  --sp-border: #E5E7EB;
  --sp-input-border: #CBD5E1;
  --sp-input-bg: #FFFFFF;
  --sp-input-readonly: #F1F5F9;
  --sp-focus-ring: #3B82F6;
  --sp-highlight-bg: #FFF7ED;
  --sp-highlight-border: #FCD34D;
}

/* ---------- BOTOES ---------- */
.sp-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  font-family: "Segoe UI", system-ui, sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, transform 0.15s;
}
.sp-btn:hover:not(:disabled) { transform: translateY(-1px); }
.sp-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.sp-btn--primary { background: var(--sp-primary); color: #fff; }
.sp-btn--primary:hover { background: var(--sp-primary-hover); }
.sp-btn--success { background: var(--sp-success); color: #fff; }
.sp-btn--success:hover { background: var(--sp-success-hover); }
.sp-btn--danger { background: var(--sp-danger); color: #fff; }
.sp-btn--danger:hover { background: var(--sp-danger-hover); }
.sp-btn--secondary { background: var(--sp-secondary); color: #fff; }
.sp-btn--secondary:hover { background: var(--sp-secondary-hover); }
.sp-btn--ghost {
  background: transparent;
  color: #94a3b8;
  border: 1px solid #334155;
}
.sp-btn--ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
}

/* ---------- HEADER DE PAGINA (PADRAO CLARO) ---------- */
.sp-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--sp-border);
}
.sp-page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--sp-text-primary);
  font-family: "Segoe UI", system-ui, sans-serif;
}

/* ---------- HEADER ESCURO (MODULO COMPLEXO) ---------- */
.sp-dark-header {
  flex-shrink: 0;
  background: var(--sp-dark);
  border-bottom: 1px solid var(--sp-dark-border);
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 52px;
}
.sp-dark-header h1 {
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  margin: 0;
}

/* ---------- TABS ---------- */
.sp-tabs {
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 24px;
  gap: 0.25rem;
  flex-shrink: 0;
}
.sp-tab {
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  font-family: "Segoe UI", system-ui, sans-serif;
}
.sp-tab:hover {
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.5);
}
.sp-tab--active {
  color: var(--sp-primary);
  border-bottom-color: var(--sp-primary);
  background: rgba(59, 130, 246, 0.05);
}

/* ---------- TABS ESCURO (ORCAMENTO) ---------- */
.sp-tabs--dark {
  background: var(--sp-dark);
  border-bottom: 1px solid var(--sp-dark-border);
}
.sp-tabs--dark .sp-tab {
  flex: 1;
  padding: 0.5rem 0.25rem;
  font-size: 0.625rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  color: #64748b;
}
.sp-tabs--dark .sp-tab:hover {
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.03);
}
.sp-tabs--dark .sp-tab--active {
  color: #fff;
  border-bottom-color: var(--sp-focus-ring);
  background: rgba(59, 130, 246, 0.08);
}

/* ---------- CARD / PAINEL ---------- */
.sp-card {
  background: var(--sp-bg-card);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}
.sp-card__header {
  background: #f8fafc;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sp-card__header h3 {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #334155;
  margin: 0;
}
.sp-card__body {
  padding: 24px;
}

/* ---------- GRID DE CAMPOS ---------- */
.sp-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}
.sp-form-grid--12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 0.5rem;
}
.sp-form-grid--12 .sp-col-1  { grid-column: span 1; }
.sp-form-grid--12 .sp-col-2  { grid-column: span 2; }
.sp-form-grid--12 .sp-col-3  { grid-column: span 3; }
.sp-form-grid--12 .sp-col-4  { grid-column: span 4; }
.sp-form-grid--12 .sp-col-5  { grid-column: span 5; }
.sp-form-grid--12 .sp-col-6  { grid-column: span 6; }
.sp-form-grid--12 .sp-col-7  { grid-column: span 7; }
.sp-form-grid--12 .sp-col-8  { grid-column: span 8; }
.sp-form-grid--12 .sp-col-9  { grid-column: span 9; }
.sp-form-grid--12 .sp-col-10 { grid-column: span 10; }
.sp-form-grid--12 .sp-col-11 { grid-column: span 11; }
.sp-form-grid--12 .sp-col-12 { grid-column: span 12; }

/* ---------- CAMPO ---------- */
.sp-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sp-field__label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  font-family: "Segoe UI", system-ui, sans-serif;
}
.sp-field__input {
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  font-family: "Segoe UI", system-ui, sans-serif;
  color: #1e293b;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}
.sp-field__input:focus {
  outline: none;
  border-color: var(--sp-focus-ring);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.sp-field__input:disabled,
.sp-field__input[readonly] {
  background: var(--sp-input-readonly);
  color: #475569;
  cursor: not-allowed;
}
.sp-field__input.is-invalid {
  border-color: var(--sp-danger);
  background-color: #fff5f5;
}

/* ---------- CAMPO COMPACTO (ORCAMENTO) ---------- */
.sp-field--compact .sp-field__label {
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #64748b;
}
.sp-field--compact .sp-field__input {
  height: 1.75rem;
  padding: 0 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

/* ---------- VALIDACAO ---------- */
.sp-field__error {
  font-size: 12px;
  color: var(--sp-danger);
  margin-top: 2px;
}
.sp-required {
  color: var(--sp-danger);
  margin-left: 4px;
}

/* ---------- ALERTAS ---------- */
.sp-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
}
.sp-alert--danger {
  background: #fff5f5;
  border: 1px solid #fecaca;
  color: #dc2626;
}
.sp-alert--success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
}

/* ---------- LISTAGEM / AG-GRID ---------- */
.sp-list-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  width: 100%;
  padding: 24px;
  background: #fff;
}
.sp-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}
.sp-list-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}
.sp-list-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #f9fafb;
  border-radius: 8px;
  overflow: hidden;
}

/* ---------- RESPONSIVIDADE ---------- */
@media (max-width: 768px) {
  .sp-form-grid { grid-template-columns: 1fr; }
  .sp-form-grid--12 { grid-template-columns: 1fr; }
  .sp-page-header { flex-direction: column; align-items: stretch; }
  .sp-tabs { padding: 0 16px; overflow-x: auto; }
  .sp-tab { padding: 8px 14px; font-size: 12px; }
  .sp-card__body { padding: 16px; }
}
',
version = '3.0',
updated_at = NOW()
WHERE id = 'TMPL_CSS_SPDEALER_V1';