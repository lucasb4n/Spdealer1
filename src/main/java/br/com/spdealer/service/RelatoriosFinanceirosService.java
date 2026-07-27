package br.com.spdealer.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.*;
import java.time.LocalDate;
import java.time.YearMonth;

/**
 * RelatoriosFinanceirosService - Serviço de Relatórios Financeiros
 * 
 * Responsável por:
 * - Buscar dados para relatórios de Contas a Receber
 * - Buscar dados para relatórios de Contas a Pagar
 * - Calcular Fluxo de Caixa (combinação de Receber + Pagar)
 * - Aplicar filtros (data, cliente, status, atraso, etc)
 */
@Service
public class RelatoriosFinanceirosService {

    private static final Logger logger = LoggerFactory.getLogger(RelatoriosFinanceirosService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Buscar relatório de Contas a Receber
     * 
     * Filtros suportados:
     * - tipoDataFiltro: cadastro, vencimento, pagamento, emissao
     * - dataFiltroInicial/Final: range de datas
     * - pessoaTipo: F (física) ou J (jurídica)
     * - tipoCobranca: código da cobrança
     * - faixaAtraso: número de dias (ex: 30)
     * - soEmAberto: apenas com vlrsal > 0
     * - soPagos: apenas com status = 'Pago'
     */
    public List<Map<String, Object>> buscarRelatorioReceber(Map<String, Object> filtros) {
        logger.info("[Relatorio] Buscando dados para Contas a Receber");

        StringBuilder sql = new StringBuilder("""
            SELECT 
              r.receber_id,
              r.codigo_rec,
              r.numdup_rec,
              r.parcela_rec,
              r.filial_rec,
              r.vlrdup_rec,
              r.vlrsal_rec,
              r.dtvenci_rec,
              r.dtemissi_rec,
              r.dtmovi_rec,
              r.dtpagi_rec,
              r.status_rec,
              r.tpcob_rec,
              r.tipodoc_rec,
              CASE 
                WHEN r.tipopessoa_rec = 'J' THEN 
                  CONCAT(
                    SUBSTRING(LPAD(r.cgccpf_rec, 14, '0'), 1, 2), '.',
                    SUBSTRING(LPAD(r.cgccpf_rec, 14, '0'), 3, 3), '.',
                    SUBSTRING(LPAD(r.cgccpf_rec, 14, '0'), 6, 3), '/',
                    SUBSTRING(LPAD(r.cgccpf_rec, 14, '0'), 9, 4), '-',
                    SUBSTRING(LPAD(r.cgccpf_rec, 14, '0'), 13, 2)
                  )
                WHEN r.tipopessoa_rec = 'F' THEN 
                  CONCAT(
                    SUBSTRING(LPAD(r.cgccpf_rec, 11, '0'), 1, 3), '.',
                    SUBSTRING(LPAD(r.cgccpf_rec, 11, '0'), 4, 3), '.',
                    SUBSTRING(LPAD(r.cgccpf_rec, 11, '0'), 7, 3), '-',
                    SUBSTRING(LPAD(r.cgccpf_rec, 11, '0'), 10, 2)
                  )
                ELSE r.cgccpf_rec
              END AS cgccpf_rec_formatted,
              r.dpto_rec,
              r.tpcob_rec,
              r.condic_rec,
              r.banco_rec,
              c.nome_cli,
              c.cliforn_cli,
              d.descr_dep,
              b.nomefan_bco,
              r.vlracre_rec,
              b.txjuro_bco
            FROM receber r
            LEFT JOIN clientes c ON r.codigo_rec = c.codigo_cli AND c.cliforn_cli = 'C'
            LEFT JOIN masdep d ON r.dpto_rec = d.codigo_dep
            LEFT JOIN bancos b ON r.banco_rec = b.codigo_bco
            WHERE (r.status_rec IS NULL OR r.status_rec = '')
            """);

        List<Object> params = new ArrayList<>();

        // Filtro: Tipo de Data
        String tipoData = (String) filtros.getOrDefault("tipoDataFiltro", "vencimento");
        String campoData = switch(tipoData) {
            case "cadastro" -> "r.dtmovi_rec";       // Data de Cadastro = Data de Movimento
            case "pagamento" -> "r.dtpagi_rec";      // Data de Pagamento
            case "emissao" -> "r.dtemissi_rec";      // Data de Emissão
            case "fluxo" -> "r.dtfluxo_rec";         // Data de Fluxo de Caixa
        default -> "r.dtvenci_rec";              // vencimento (padrão)
        };

        // Filtro: Filial - Removido por ser restritivo demais neste relatório


        // Filtro: Data Inicial/Final
        String dataInicial = (String) filtros.getOrDefault("dataFiltroInicial", "");
        String dataFinal = (String) filtros.getOrDefault("dataFiltroFinal", "");

        // Special case: when filtering by vencimento and a single date is provided,
        // respect dtfluxo_rec if present, otherwise dtvenci_rec (same logic as buscarFluxoCaixaDia)
        if ("vencimento".equals(tipoData) && !dataInicial.isEmpty() && dataInicial.equals(dataFinal)) {
            sql.append(" AND ((r.dtfluxo_rec = ? AND r.dtfluxo_rec IS NOT NULL) OR (r.dtfluxo_rec IS NULL AND r.dtvenci_rec = ?))");
            params.add(dataInicial.replace("-", ""));
            params.add(dataFinal.replace("-", ""));
        } else {
            if (!dataInicial.isEmpty()) {
                sql.append(" AND ").append(campoData).append(" >= ?");
                params.add(dataInicial.replace("-", ""));
            }
            if (!dataFinal.isEmpty()) {
                sql.append(" AND ").append(campoData).append(" <= ?");
                params.add(dataFinal.replace("-", ""));
            }
        }

        // Filtro: Tipo Pessoa (F/J)
        String pessoaTipo = (String) filtros.getOrDefault("pessoaTipo", "");
        if (!pessoaTipo.isEmpty() && !"Todos".equalsIgnoreCase(pessoaTipo)) {
            sql.append(" AND c.tipopessoa_cli = ?");
            params.add(pessoaTipo);
        }

        // Filtro: Tipo Cobrança
        String tipoCobrancaRec = (String) filtros.getOrDefault("tipoCobranca", "");
        if (!tipoCobrancaRec.isEmpty()) {
            sql.append(" AND TRIM(r.tpcob_rec) = ?");
            params.add(tipoCobrancaRec.trim());
        }

        // Filtro: Tipos de Documento (múltipla seleção)
        @SuppressWarnings("unchecked")
        List<String> tiposDocumento = (List<String>) filtros.get("tiposDocumento");
        if (tiposDocumento != null && !tiposDocumento.isEmpty()) {
            // Filtrar apenas se não estiver vazio ou não contiver string vazia
            List<String> tiposValidos = tiposDocumento.stream()
                .filter(t -> t != null && !t.isEmpty())
                .toList();
            
            if (!tiposValidos.isEmpty()) {
                sql.append(" AND TRIM(r.tipodoc_rec) IN (");
                sql.append(String.join(",", tiposValidos.stream().map(t -> "?").toList()));
                sql.append(")");
                params.addAll(tiposValidos.stream().map(String::trim).toList());
                logger.debug("Filtro tipos documento aplicado: {}", tiposValidos);
            }
        }

        // Filtro: Faixa de Atraso (em dias)
        String faixaAtraso = (String) filtros.getOrDefault("faixaAtraso", "");
        if (!faixaAtraso.isEmpty()) {
            int dias = Integer.parseInt(faixaAtraso);
            sql.append(" AND r.dtvenci_rec < DATE_SUB(CURDATE(), INTERVAL ").append(dias).append(" DAY)");
            sql.append(" AND (r.status_rec IS NULL OR r.status_rec = '')");
        }

        // Filtro: Departamento
        String depto = (String) filtros.getOrDefault("departamento", "");
        if (!depto.isEmpty()) {
            sql.append(" AND r.dpto_rec = ?");
            params.add(depto);
        }

        // Filtro: Centro de Custo
        String centroCusto = (String) filtros.getOrDefault("centroCusto", "");
        if (!centroCusto.isEmpty()) {
            sql.append(" AND r.centroc_rec = ?");
            params.add(centroCusto);
        }


        // Filtro: Apenas em Aberto
        Boolean soEmAberto = (Boolean) filtros.getOrDefault("soEmAberto", false);
        Boolean soPagos = (Boolean) filtros.getOrDefault("soPagos", false);
        
        // Se nenhum filtro de status estiver marcado, mostrar TODOS os registros
        if (!soEmAberto && !soPagos) {
            // Não aplicar nenhum filtro de status - mostrar tudo
        } else {
            // Aplicar filtros específicos
            if (soEmAberto && !soPagos) {
                sql.append(" AND r.vlrsal_rec > 0");
                sql.append(" AND (r.status_rec IS NULL OR r.status_rec = '')");
            }
            if (soPagos && !soEmAberto) {
                sql.append(" AND r.dtpagi_rec IS NOT NULL");
                // Documentos pagos (conforme SQL de teste)
            }
            // Se ambos forem true, não aplicar filtro (mostrar tudo)
        }

        // Ordenação (respeitar dtfluxo_rec se disponível)
        sql.append(" ORDER BY COALESCE(r.dtfluxo_rec, r.dtvenci_rec) DESC, r.codigo_rec ASC");
        
        String finalSql = sql.toString();
        logger.info("[DEBUG] Executando busca Contas a Receber");
        logger.info("[DEBUG] SQL: {}", finalSql);
        logger.info("[DEBUG] Parâmetros: {}", params);

        List<Map<String, Object>> resultado = jdbcTemplate.queryForList(finalSql, params.toArray());
        logger.info("[DEBUG] {} registros encontrados", resultado.size());
        return resultado;
    }

    /**
     * Buscar relatório de Contas a Pagar
     * Mesmos filtros que Receber, aplicado a tabela pagar
     */
    public List<Map<String, Object>> buscarRelatorioPagar(Map<String, Object> filtros) {
        logger.info("[Relatorio] Buscando dados para Contas a Pagar");

        StringBuilder sql = new StringBuilder("""
            SELECT 
              p.pagar_id,
              p.codigo_pag,
              p.tipodoc_pag,
              p.numdup_pag,
              p.parcela_pag,
              p.filial_pag,
              p.vlrdup_pag,
              p.vlrsal_pag,
              p.dtvenci_pag,
              p.dtfluxo_pag,
              p.dtemissi_pag,
              p.dtmovi_pag,
              p.dtpagi_pag,
              p.vlrpag_pag,
              p.vlracre_pag,
              p.status_pag,
              CASE 
                WHEN p.tipopessoa_pag = 'J' THEN 
                  CONCAT(
                    SUBSTRING(LPAD(p.cgccpf_pag, 14, '0'), 1, 2), '.',
                    SUBSTRING(LPAD(p.cgccpf_pag, 14, '0'), 3, 3), '.',
                    SUBSTRING(LPAD(p.cgccpf_pag, 14, '0'), 6, 3), '/',
                    SUBSTRING(LPAD(p.cgccpf_pag, 14, '0'), 9, 4), '-',
                    SUBSTRING(LPAD(p.cgccpf_pag, 14, '0'), 13, 2)
                  )
                WHEN p.tipopessoa_pag = 'F' THEN 
                  CONCAT(
                    SUBSTRING(LPAD(p.cgccpf_pag, 11, '0'), 1, 3), '.',
                    SUBSTRING(LPAD(p.cgccpf_pag, 11, '0'), 4, 3), '.',
                    SUBSTRING(LPAD(p.cgccpf_pag, 11, '0'), 7, 3), '-',
                    SUBSTRING(LPAD(p.cgccpf_pag, 11, '0'), 10, 2)
                  )
                ELSE p.cgccpf_pag
              END AS cgccpf_pag_formatted,
              p.dpto_pag,
              p.tpcob_pag,
              p.tipodoc_pag,
              p.banco_pag,
              c.nome_cli AS nome_for,
              c.celular_cli,
              c.cliforn_cli,
              d.descr_dep,
              b.nomefan_bco,
              b.txjuro_bco
            FROM pagar p
            LEFT JOIN clientes c ON p.codigo_pag = c.codigo_cli AND c.cliforn_cli = 'F'
            LEFT JOIN masdep d ON p.dpto_pag = d.codigo_dep
            LEFT JOIN bancos b ON p.banco_pag = b.codigo_bco
            WHERE (p.status_pag IS NULL OR p.status_pag = '')
            """);

        List<Object> params = new ArrayList<>();

        // Filtro: Tipo de Data
        String tipoData = (String) filtros.getOrDefault("tipoDataFiltro", "vencimento");
        String campoData = switch(tipoData) {
            case "cadastro" -> "p.dtmovi_pag";       // Data de Cadastro = Data de Movimento
            case "pagamento" -> "p.dtpagi_pag";      // Data de Pagamento
            case "emissao" -> "p.dtemissi_pag";      // Data de Emissão
            case "fluxo" -> "p.dtfluxo_pag";         // Data de Fluxo de Caixa
            default -> "p.dtvenci_pag";              // vencimento (padrão)
        };

        // Filtro: Filial - Removido por ser restritivo demais neste relatório


        // Filtro: Data Inicial/Final
        String dataInicial = (String) filtros.getOrDefault("dataFiltroInicial", "");
        String dataFinal = (String) filtros.getOrDefault("dataFiltroFinal", "");

        // Special case: when filtering by vencimento and a single date is provided,
        // respect dtfluxo_pag if present, otherwise dtvenci_pag (same logic as buscarFluxoCaixaDia)
        if ("vencimento".equals(tipoData) && !dataInicial.isEmpty() && dataInicial.equals(dataFinal)) {
            sql.append(" AND ((p.dtfluxo_pag = ? AND p.dtfluxo_pag IS NOT NULL) OR (p.dtfluxo_pag IS NULL AND p.dtvenci_pag = ?))");
            params.add(dataInicial.replace("-", ""));
            params.add(dataFinal.replace("-", ""));
        } else {
            if (!dataInicial.isEmpty()) {
                sql.append(" AND ").append(campoData).append(" >= ?");
                params.add(dataInicial.replace("-", ""));
            }
            if (!dataFinal.isEmpty()) {
                sql.append(" AND ").append(campoData).append(" <= ?");
                params.add(dataFinal.replace("-", ""));
            }
        }

        // Filtro: Tipo Pessoa (F/J)
        String pessoaTipo = (String) filtros.getOrDefault("pessoaTipo", "");
        if (!pessoaTipo.isEmpty() && !"Todos".equalsIgnoreCase(pessoaTipo)) {
            sql.append(" AND c.tipopessoa_cli = ?");
            params.add(pessoaTipo);
        }

        // Filtro: Tipo Cobrança
        String tipoCobrancaPagar = (String) filtros.getOrDefault("tipoCobranca", "");
        if (!tipoCobrancaPagar.isEmpty()) {
            sql.append(" AND TRIM(p.tpcob_pag) = ?");
            params.add(tipoCobrancaPagar.trim());
        }

        // Filtro: Tipos de Documento (múltipla seleção)
        @SuppressWarnings("unchecked")
        List<String> tiposDocumento = (List<String>) filtros.get("tiposDocumento");
        if (tiposDocumento != null && !tiposDocumento.isEmpty()) {
            // Filtrar apenas se não estiver vazio ou não contiver string vazia
            List<String> tiposValidos = tiposDocumento.stream()
                .filter(t -> t != null && !t.isEmpty())
                .toList();
            
            if (!tiposValidos.isEmpty()) {
                sql.append(" AND TRIM(p.tipodoc_pag) IN (");
                sql.append(String.join(",", tiposValidos.stream().map(t -> "?").toList()));
                sql.append(")");
                params.addAll(tiposValidos.stream().map(String::trim).toList());
                logger.debug("Filtro tipos documento aplicado: {}", tiposValidos);
            }
        }

        // Filtro: Faixa de Atraso (em dias)
        String faixaAtraso = (String) filtros.getOrDefault("faixaAtraso", "");
        if (!faixaAtraso.isEmpty()) {
            int dias = Integer.parseInt(faixaAtraso);
            sql.append(" AND p.dtvenci_pag < DATE_SUB(CURDATE(), INTERVAL ").append(dias).append(" DAY)");
            sql.append(" AND (p.status_pag IS NULL OR p.status_pag = '')");
        }

        // Filtro: Departamento
        String deptoPagar = (String) filtros.getOrDefault("departamento", "");
        if (!deptoPagar.isEmpty()) {
            sql.append(" AND p.dpto_pag = ?");
            params.add(deptoPagar);
        }

        // Filtro: Centro de Custo
        String centroCustoPagar = (String) filtros.getOrDefault("centroCusto", "");
        if (!centroCustoPagar.isEmpty()) {
            sql.append(" AND p.centroc_pag = ?");
            params.add(centroCustoPagar);
        }


        // Filtro: Apenas em Aberto
        Boolean soEmAberto = (Boolean) filtros.getOrDefault("soEmAberto", false);
        Boolean soPagos = (Boolean) filtros.getOrDefault("soPagos", false);
        
        // Se nenhum filtro de status estiver marcado, mostrar TODOS os registros
        if (!soEmAberto && !soPagos) {
            // Não aplicar nenhum filtro de status - mostrar tudo
        } else {
            // Aplicar filtros específicos
            if (soEmAberto && !soPagos) {
                sql.append(" AND p.vlrsal_pag > 0");
                sql.append(" AND (p.status_pag IS NULL OR p.status_pag = '')");
            }
            if (soPagos && !soEmAberto) {
                sql.append(" AND p.dtpagi_pag IS NOT NULL");
                // Documentos pagos (conforme SQL de teste)
            }
            // Se ambos forem true, não aplicar filtro (mostrar tudo)
        }

        // Ordenação (usar COALESCE para respeitar dtfluxo_pag se preenchido)
        sql.append(" ORDER BY COALESCE(p.dtfluxo_pag, p.dtvenci_pag) DESC, p.codigo_pag ASC");
        
        String finalSql = sql.toString();
        logger.info("[DEBUG] Executando busca Contas a Pagar");
        logger.info("[DEBUG] SQL: {}", finalSql);
        logger.info("[DEBUG] Parâmetros: {}", params);

        List<Map<String, Object>> resultado = jdbcTemplate.queryForList(finalSql, params.toArray());
        logger.info("[DEBUG] {} registros encontrados", resultado.size());
        return resultado;
    }

    /**
     * Buscar relatório de Inventário (invent)
     * Filtros esperados:
     * - date: yyyy-MM-dd (opcional)
     */
    public List<Map<String, Object>> buscarRelatorioInventario(Map<String, Object> filtros) {
        logger.info("[Relatorio] Buscando dados para Inventario");

        String date = (String) filtros.getOrDefault("date", "");

        StringBuilder sql = new StringBuilder("SELECT data_inv AS date_inv, categoria, produto, descricao, unid_med, qtde, custo_uni, (qtde * custo_uni) as custo_total FROM invent WHERE 1=1 ");
        List<Object> params = new ArrayList<>();

        if (date != null && !date.isEmpty()) {
            sql.append(" AND DATE(data_inv) = ?");
            params.add(date);
        }

        sql.append(" ORDER BY categoria, produto");

        List<Map<String, Object>> resultado = jdbcTemplate.queryForList(sql.toString(), params.toArray());
        logger.info("[Relatorio] {} registros de Inventario encontrados", resultado.size());
        return resultado;
    }

    /**
     * Buscar Fluxo de Caixa (combinação de Receber + Pagar)
     * 
     * Agrupa movimentos por data e calcula saldos diários
     */
    public List<Map<String, Object>> buscarFluxoCaixa(Map<String, Object> filtros) {
        logger.info("[Relatorio] Buscando dados para Fluxo de Caixa");

        // Calcular período baseado em faixaAtraso (30, 60, 90, 120 dias)
        LocalDate dataInicio = LocalDate.now();
        LocalDate dataFim = dataInicio;
        
        String faixaAtraso = (String) filtros.getOrDefault("faixaAtraso", "30");
        if (faixaAtraso != null && !faixaAtraso.isEmpty()) {
            int dias = Integer.parseInt(faixaAtraso);
            dataFim = dataInicio.plusDays(dias);
        }
        
        // Atualizar filtros com datas calculadas
        filtros.put("dataFiltroInicial", dataInicio.toString());
        filtros.put("dataFiltroFinal", dataFim.toString());
        
        // IMPORTANTE: Não usar faixaAtraso como filtro de atraso (dias passados)
        // Para Fluxo de Caixa, limpar faixaAtraso para evitar interpretação errada
        filtros.put("faixaAtraso", "");
        
        logger.info("[Relatorio] Fluxo de Caixa: de {} até {} ({} dias)", dataInicio, dataFim, faixaAtraso);

        // Buscar receber com filtro de período (vai usar dataFiltroInicial/dataFiltroFinal)
        List<Map<String, Object>> dadosReceber = buscarRelatorioReceber(filtros);
        
        // Buscar pagar com filtro de período (vai usar dataFiltroInicial/dataFiltroFinal)
        List<Map<String, Object>> dadosPagar = buscarRelatorioPagar(filtros);

        // Combinar em estrutura de Fluxo por DATA
        Map<String, Map<String, Object>> fluxoPorData = new LinkedHashMap<>();

        // Processar Receber
        for (Map<String, Object> row : dadosReceber) {
            Object dtVencObj = row.get("dtvenci_rec");
            if (dtVencObj == null) continue;
            
            String data = dtVencObj.toString();
            
            fluxoPorData.computeIfAbsent(data, k -> new LinkedHashMap<>()).put("data", data);
            
            Double vlrEntrada = ((Number) fluxoPorData.get(data).getOrDefault("entradas", 0.0)).doubleValue();
            vlrEntrada += ((Number) row.getOrDefault("vlrsal_rec", 0)).doubleValue();
            fluxoPorData.get(data).put("entradas", vlrEntrada);
        }

        // Processar Pagar (usar COALESCE dtfluxo_pag ou dtvenci_pag)
        for (Map<String, Object> row : dadosPagar) {
            Object dtFluxo = row.get("dtfluxo_pag");
            Object dtVencObj = row.get("dtvenci_pag");
            
            if (dtVencObj == null) continue;
            
            String data = (dtFluxo != null && !dtFluxo.toString().isEmpty()) 
                ? dtFluxo.toString() 
                : dtVencObj.toString();
            
            fluxoPorData.computeIfAbsent(data, k -> new LinkedHashMap<>()).put("data", data);
            
            Double vlrSaida = ((Number) fluxoPorData.get(data).getOrDefault("saidas", 0.0)).doubleValue();
            vlrSaida += ((Number) row.getOrDefault("vlrsal_pag", 0)).doubleValue();
            fluxoPorData.get(data).put("saidas", vlrSaida);
        }

        // Converter para lista e AGRUPAR POR MÊS COM SUBTOTAIS
        List<Map<String, Object>> resultado = new ArrayList<>();
        
        // Treemap para ordenar por data
        Map<LocalDate, Map<String, Object>> fluxoOrdenado = new TreeMap<>();
        
        for (Map.Entry<String, Map<String, Object>> entry : fluxoPorData.entrySet()) {
            try {
                LocalDate date = LocalDate.parse(entry.getKey());
                fluxoOrdenado.put(date, entry.getValue());
            } catch (Exception e) {
                logger.warn("Data inválida: {}", entry.getKey());
            }
        }

        // Agrupar por mês e adicionar subtotais
        Map<YearMonth, List<LocalDate>> mesesComDatas = new LinkedHashMap<>();
        
        // Primeiro passo: agrupar datas por mês
        for (LocalDate date : fluxoOrdenado.keySet()) {
            YearMonth yearMonth = YearMonth.from(date);
            mesesComDatas.computeIfAbsent(yearMonth, k -> new ArrayList<>()).add(date);
        }
        
        // Segundo passo: processar dados por mês
        double saldoAcumulado = 0;
        for (YearMonth yearMonth : mesesComDatas.keySet()) {
            List<LocalDate> datasDoMes = mesesComDatas.get(yearMonth);
            double totalMesEntradas = 0;
            double totalMesSaidas = 0;
            
            // Adicionar linhas de dias do mês
            for (LocalDate date : datasDoMes) {
                Map<String, Object> dia = fluxoOrdenado.get(date);
                double entradas = ((Number) dia.getOrDefault("entradas", 0.0)).doubleValue();
                double saidas = ((Number) dia.getOrDefault("saidas", 0.0)).doubleValue();
                double saldo = entradas - saidas;
                
                saldoAcumulado += saldo;
                totalMesEntradas += entradas;
                totalMesSaidas += saidas;
                
                // Linha normal do dia
                Map<String, Object> linhasDia = new LinkedHashMap<>(dia);
                linhasDia.put("data", date.toString());
                linhasDia.put("saldo", saldo);
                linhasDia.put("saldoAcumulado", saldoAcumulado);
                linhasDia.put("entradas", entradas);
                linhasDia.put("saidas", saidas);
                linhasDia.put("isTipoLinha", "normal"); // Tipo de linha
                
                resultado.add(linhasDia);
            }
            
            // Adicionar LINHA DE SUBTOTAL DO MÊS ao final
            LocalDate ultimoDiaDoMes = yearMonth.atEndOfMonth();
            double saldoMes = totalMesEntradas - totalMesSaidas;
            
            Map<String, Object> subtotalLinha = new LinkedHashMap<>();
            subtotalLinha.put("data", ultimoDiaDoMes.toString());
            subtotalLinha.put("entradas", totalMesEntradas);
            subtotalLinha.put("saidas", totalMesSaidas);
            subtotalLinha.put("saldo", saldoMes);
            subtotalLinha.put("saldoAcumulado", saldoAcumulado);
            subtotalLinha.put("isTipoLinha", "subtotal_mes"); // Flag para UI
            subtotalLinha.put("mes", yearMonth.toString()); // YYYY-MM
            
            resultado.add(subtotalLinha);
        }

        logger.info("[Relatorio] {} dias com movimento encontrados no Fluxo, {} meses com subtotais", fluxoOrdenado.size(), mesesComDatas.size());
        return resultado;
    }

    /**
     * Buscar registros analíticos de Fluxo de Caixa para um dia específico
     * 
     * Retorna TODOS os registros (receber + pagar) com vencimento naquele dia.
     * Respeita a lógica: dtfluxo prevaleça sobre dtvenci para filtragem
     * 
     * Campos retornados:
     * - tipo: 'ENTRADA' (receber) ou 'SAIDA' (pagar)
     * - codigo: código do registro
     * - documento: numdup_rec ou numdup_pag
     * - parcela: parcela_rec ou parcela_pag
     * - cliente_fornecedor: nome do cliente ou fornecedor
     * - dtvenci: data de vencimento (dtvenci_rec ou dtvenci_pag)
     * - dtfluxo: data de fluxo (dtfluxoi_rec or dtfluxo_pag) - EDITÁVEL
     * - vlrsal: valor em aberto (vlrsal_rec ou vlrsal_pag)
     * - status: status do documento
     */
    public List<Map<String, Object>> buscarFluxoCaixaDia(String data) {
        logger.info("[Relatorio] Buscando detalhes analíticos para dia: {}", data);
        long inicio = System.currentTimeMillis();

        List<Map<String, Object>> resultado = new ArrayList<>();
        
        // RECEBER - Filtrar por dtfluxo_rec (se informado) OU dtvenci_rec
        String sqlReceber = """
            SELECT 
              r.receber_id,
              r.codigo_rec as codigo,
              r.dtemissi_rec as dtemissi,
              r.numdup_rec as documento,
              r.parcela_rec as parcela,
              'ENTRADA' as tipo,
              c.nome_cli as cliente_fornecedor,
              r.dtvenci_rec as dtvenci,
              COALESCE(r.dtfluxo_rec, r.dtvenci_rec) as dtfluxo,
              r.vlrsal_rec as vlrsal,
              r.status_rec as status,
              'receber' as tabela_origem,
              r.filial_rec
            FROM receber r
            LEFT JOIN clientes c ON r.codigo_rec = c.codigo_cli AND c.cliforn_cli = 'C'
            WHERE (
              (r.dtfluxo_rec = ? AND r.dtfluxo_rec IS NOT NULL)
              OR (r.dtfluxo_rec IS NULL AND r.dtvenci_rec = ?)
            )
            AND r.vlrsal_rec > 0
            AND (r.status_rec IS NULL OR r.status_rec = '')
            ORDER BY r.codigo_rec ASC
            """;

        try {
            logger.debug("[Relatorio] Executando query RECEBER com data: {}", data);
            resultado.addAll(jdbcTemplate.queryForList(sqlReceber, data, data));
            logger.debug("[Relatorio] ✓ RECEBER: {} registros em {} ms", resultado.size(), System.currentTimeMillis() - inicio);
        } catch (Exception e) {
            logger.error("[Relatorio] ❌ Erro ao buscar receber para dia {}: {}", data, e.getMessage(), e);
        }

        // PAGAR - Filtrar por dtfluxo_pag (se informado) OU dtvenci_pag
        String sqlPagar = """
            SELECT 
              p.pagar_id,
              p.codigo_pag as codigo,
              p.dtemissi_pag as dtemissi,
              p.numdup_pag as documento,
              p.parcela_pag as parcela,
              'SAIDA' as tipo,
              f.nome_cli as cliente_fornecedor,
              p.dtvenci_pag as dtvenci,
              COALESCE(p.dtfluxo_pag, p.dtvenci_pag) as dtfluxo,
              p.vlrsal_pag as vlrsal,
              p.status_pag as status,
              'pagar' as tabela_origem,
              p.filial_pag
            FROM pagar p
            LEFT JOIN clientes f ON p.codigo_pag = f.codigo_cli AND f.cliforn_cli = 'F'
            WHERE (
              (p.dtfluxo_pag = ? AND p.dtfluxo_pag IS NOT NULL)
              OR (p.dtfluxo_pag IS NULL AND p.dtvenci_pag = ?)
            )
            AND p.vlrsal_pag > 0
            AND (p.status_pag IS NULL OR p.status_pag = '')
            ORDER BY p.codigo_pag ASC
            """;

        try {
            logger.debug("[Relatorio] Executando query PAGAR com data: {}", data);
            resultado.addAll(jdbcTemplate.queryForList(sqlPagar, data, data));
            logger.debug("[Relatorio] ✓ PAGAR: {} registros em {} ms", resultado.size(), System.currentTimeMillis() - inicio);
        } catch (Exception e) {
            logger.error("[Relatorio] ❌ Erro ao buscar pagar para dia {}: {}", data, e.getMessage(), e);
        }

        long duracao = System.currentTimeMillis() - inicio;
        logger.info("[Relatorio] ✅ {} registros encontrados para dia {} (duração: {} ms)", resultado.size(), data, duracao);
        return resultado;
    }

    /**
     * Atualizar data de fluxo (dtfluxo_rec ou dtfluxo_pag) de um documento
     */
    public boolean atualizarDtFluxo(String tipo, Long id, String novaData) {
        logger.info("[Relatorio] Atualizando dtfluxo {} id={} para {}", tipo, id, novaData);

        try {
            if ("receber".equalsIgnoreCase(tipo)) {
                String sql = "UPDATE receber SET dtfluxo_rec = ? WHERE receber_id = ?";
                int linhasAfetadas = jdbcTemplate.update(sql, novaData, id);
                return linhasAfetadas > 0;
            } else if ("pagar".equalsIgnoreCase(tipo)) {
                String sql = "UPDATE pagar SET dtfluxo_pag = ? WHERE pagar_id = ?";
                int linhasAfetadas = jdbcTemplate.update(sql, novaData, id);
                return linhasAfetadas > 0;
            }
        } catch (Exception e) {
            logger.error("[Relatorio] Erro ao atualizar dtfluxo: {}", e.getMessage());
            return false;
        }

        return false;
    }

    /**
     * Atualiza o banco (banco_rec ou banco_pag) de um documento
     */
    public boolean atualizarBanco(String tipo, Long id, String novoCodigoBco) {
        logger.info("[Relatorio] Atualizando banco {} id={} para banco={}", tipo, id, novoCodigoBco);
        try {
            if ("receber".equalsIgnoreCase(tipo)) {
                String sql = "UPDATE receber SET banco_rec = ? WHERE receber_id = ?";
                int linhas = jdbcTemplate.update(sql, novoCodigoBco, id);
                return linhas > 0;
            } else if ("pagar".equalsIgnoreCase(tipo)) {
                String sql = "UPDATE pagar SET banco_pag = ? WHERE pagar_id = ?";
                int linhas = jdbcTemplate.update(sql, novoCodigoBco, id);
                return linhas > 0;
            }
        } catch (Exception e) {
            logger.error("[Relatorio] Erro ao atualizar banco: {}", e.getMessage(), e);
            return false;
        }
        return false;
    }

    /**
     * Obtém conexão JDBC do DataSource para relatórios Jasper
     */
    public java.sql.Connection getConnection() throws Exception {
        logger.debug("Obtendo conexão JDBC para JasperReports...");
        javax.sql.DataSource dataSource = jdbcTemplate.getDataSource();
        if (dataSource == null) {
            throw new IllegalStateException("DataSource não configurado no JdbcTemplate");
        }
        java.sql.Connection connection = dataSource.getConnection();
        logger.debug("Conexão JDBC obtida com sucesso");
        return connection;
    }

    private String getFilialDaSessao() {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attr = (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.currentRequestAttributes();
            jakarta.servlet.http.HttpSession session = attr.getRequest().getSession(false);
            if (session != null) {
                Object filial = session.getAttribute("id_fil");
                if (filial == null) filial = session.getAttribute("filialId");
                if (filial != null) return filial.toString();
            }
        } catch (Exception e) {
            logger.warn("Erro ao obter filial da sessão: {}", e.getMessage());
        }
        return null; // Não filtrar se não encontrar para evitar ocultar dados
    }
}
