#!/usr/bin/env node

/**
 * Script para debugar a resposta da API e verificar canvas_config
 */

async function testAPI() {
  try {
    console.log('[API Test] Testando http://localhost:8080/api/v1/dashboards/1');
    
    const response = await fetch('http://localhost:8080/api/v1/dashboards/1', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      console.error('[API Test] Erro:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    
    console.log('\n=== RESPOSTA COMPLETA ===');
    console.log('ID:', data.id);
    console.log('Nome:', data.name);
    console.log('Canvas Config Type:', typeof data.canvas_config);
    console.log('Canvas Config Value:', data.canvas_config);
    
    if (typeof data.canvas_config === 'string') {
      console.log('\n❌ PROBLEMA: canvas_config é string, precisa fazer JSON.parse()');
      try {
        const parsed = JSON.parse(data.canvas_config);
        console.log('Parseado:', parsed);
        console.log('Height after parse:', parsed.height);
      } catch (e) {
        console.log('Erro ao fazer parse:', e.message);
      }
    } else if (typeof data.canvas_config === 'object') {
      console.log('\n✅ OK: canvas_config é objeto');
      console.log('Height:', data.canvas_config.height);
    }

    console.log('\n=== WIDGETS ===');
    console.log('Total widgets:', data.widgets?.length || 0);
    if (data.widgets && data.widgets.length > 0) {
      data.widgets.slice(0, 3).forEach((w, i) => {
        console.log(`  Widget ${i}: id=${w.id}, widget_id=${w.widget_id}, type=${w.widget_type}, pos=(${w.position_x},${w.position_y})`);
      });
    }

  } catch (err) {
    console.error('[API Test] Erro crítico:', err.message);
  }
}

testAPI();
