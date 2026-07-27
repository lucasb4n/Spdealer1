package br.com.spdealer.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProcessamentoNotaService {

    private final JdbcTemplate jdbcTemplate;
    private final CalculadorTributarioService calculadorTributario;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATE_COMP3 = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal CEM = new BigDecimal("100");

    private String padNumero(Integer numero) {
        if (numero == null) return null;
        return String.format("%08d", numero);
    }

    private String padFilial(Integer filial) {
        if (filial == null) return null;
        return String.format("%03d", filial);
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> transformarOrcamentoEmPedido(Integer numeroOrp, Integer filialOrp) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String numeroPadded = padNumero(numeroOrp);
            String filialPadded = padFilial(filialOrp);
            String checkSql = """
                SELECT TIPO_ORP, FECHADO_ORP 
                FROM orcamp 
                WHERE NUMERO_ORP = ? AND FILIAL_ORP = ?
                """;
            
            Map<String, Object> orcamento = jdbcTemplate.queryForMap(checkSql, numeroPadded, filialPadded);
            String tipoOrp = (String) orcamento.get("TIPO_ORP");
            Integer fechadoOrp = (Integer) orcamento.get("FECHADO_ORP");
            
            if (!"O".equals(tipoOrp)) {
                result.put("success", false);
                result.put("error", "Orçamento não pode ser transformado. Status atual: " + tipoOrp);
                return result;
            }
            
            if (fechadoOrp != null && fechadoOrp == 2) {
                result.put("success", false);
                result.put("error", "Orçamento está bloqueado e não pode ser transformado");
                return result;
            }
            
            String updateOrcamentoSql = """
                UPDATE orcamp SET 
                    TIPO_ORP = 'P',
                    FECHADO_ORP = 1
                WHERE NUMERO_ORP = ? AND FILIAL_ORP = ?
                """;
            jdbcTemplate.update(updateOrcamentoSql, numeroPadded, filialPadded);
            
            String itensSql = """
                SELECT FILIAL_ORPP, NUMERO_ORPP, FAB_ORPP, CODIGO_ORPP, QTALOC_ORPP
                FROM orcampp
                WHERE NUMERO_ORPP = ? AND FILIAL_ORPP = ?
                """;
            List<Map<String, Object>> itens = jdbcTemplate.queryForList(itensSql, numeroPadded, filialPadded);
            
            int itensAlocados = 0;
            for (Map<String, Object> item : itens) {
                BigDecimal qtaloc = (BigDecimal) item.get("QTALOC_ORPP");
                if (qtaloc != null && qtaloc.compareTo(BigDecimal.ZERO) > 0) {
                    String fabOrpp = (String) item.get("FAB_ORPP");
                    String codigoOrpp = (String) item.get("CODIGO_ORPP");
                    
                    String updateKardexSql = """
                        UPDATE kardex SET 
                            QTALOC_KAR = COALESCE(QTALOC_KAR, 0) + ?
                        WHERE FAB_KAR = ? AND CODPROD_KAR = ? AND DEP_KAR = 1
                        """;
                    int updated = jdbcTemplate.update(updateKardexSql, qtaloc, fabOrpp, codigoOrpp);
                    
                    if (updated > 0) {
                        itensAlocados++;
                    } else {
                        log.warn("Item não encontrado no kardex para alocação: FAB={}, CODIGO={}", fabOrpp, codigoOrpp);
                    }
                }
            }
            
            result.put("success", true);
            result.put("message", "Orçamento transformado em Pedido com sucesso");
            result.put("numeroOrp", numeroOrp);
            result.put("filialOrp", filialOrp);
            result.put("itensAlocados", itensAlocados);
            
            return result;
            
        } catch (Exception e) {
            log.error("Erro ao transformar orçamento em pedido", e);
            throw new RuntimeException("Erro ao transformar orçamento em pedido: " + e.getMessage(), e);
        }
    }

@Transactional(rollbackFor = Exception.class)
    public Map<String, Object> confirmarPedidoGerarNotaFiscal(
            Integer numeroOrp, 
            Integer filialOrp,
            Integer codigoVendedor,
            String serie,
            Integer tipoNota) {
        
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> auditLog = new ArrayList<>();
        
        try {
            String numeroPadded = padNumero(numeroOrp);
            String filialPadded = padFilial(filialOrp);
            LocalDate hoje = LocalDate.now();
            int emissaoInt = Integer.parseInt(hoje.format(DATE_COMP3));
            
            String orcamentoSql = """
                SELECT o.TIPO_ORP, o.FECHADO_ORP, o.CGCCPF_CLI, o.NOME_ORP, o.CONDPAG_ORP,
                       o.UF_ORP, c.REVENDA_CLI, c.CLiforn_CLI, c.ESTADO_CLI,
                       c.CONTRATO_CLI, c.CARGAMEDIA_CLI, c.OPTSIMPLES_CLI, c.NAOCONTR_CLI,
                       g.ESTADO_GER, g.FILIAL_GER, g.ALIQICMS_GER
                FROM orcamp o
                LEFT JOIN clientes c ON o.CGCCPF_CLI = c.CGCCPF_CLI
                LEFT JOIN masger g ON g.FILIAL_GER = o.FILIAL_ORP
                WHERE o.NUMERO_ORP = ? AND o.FILIAL_ORP = ?
                """;
            
            Map<String, Object> orcamento = jdbcTemplate.queryForMap(orcamentoSql, numeroPadded, filialPadded);
            String tipoOrp = (String) orcamento.get("TIPO_ORP");
            
            if (!"P".equals(tipoOrp)) {
                result.put("success", false);
                result.put("error", "Pedido não pode ser confirmado. Status atual: " + tipoOrp);
                return result;
            }
            
            String ufOrigem = orcamento.get("ESTADO_GER") != null ? 
                orcamento.get("ESTADO_GER").toString() : "SP";
            String ufDestino = orcamento.get("ESTADO_CLI") != null ? 
                orcamento.get("ESTADO_CLI").toString() : orcamento.get("UF_ORP").toString();
            boolean ehRevenda = "S".equalsIgnoreCase(String.valueOf(orcamento.get("REVENDA_CLI")));
            
            Integer numeroNota = gerarNumeroNota();
            
            String naturezaSql = "SELECT NATUREZA_OCAI FROM mascai WHERE OPERACAO_OCAI = 5101";
            Integer natureza = 5101;
            try {
                Integer natResult = jdbcTemplate.queryForObject(naturezaSql, Integer.class);
                if (natResult != null) natureza = natResult;
            } catch (Exception e) {
                log.warn("Natureza não encontrada, usando padrão: {}", natureza);
            }
            
            String tipont = tipoNota != null ? 
                (tipoNota == 1 ? "S" : tipoNota == 2 ? "E" : tipoNota == 3 ? "O" : "S") : "S";
            String fnfTipo = "CO";
            
            String insertNotascabSql = """
                INSERT INTO notascab (
                    FILIAL_NOT, EMISSAOI_NOT, REGISTRO_NOT, TIPO_NOT, SERIE_NOT, NUMERO_NOT,
                    DEPTO_NOT, VENDEDOR_NOT, DTMOV_NOT, DTMOVI_NOT, EMISSAO_NOT, TIPOPESSOA_NOT,
                    CGCCPF_NOT, INSCEST_NOT, NOME_NOT, ENDER_NOT, BAIRRO_NOT, CIDADE_NOT,
                    UF_NOT, CEP_NOT, NATUREZA_NOT, CODFISCAL_NOT, SINAL_NOT, CONDPAG_NOT,
                    OBSERVACAO_NOT, VLRMERC_NOT, VLRIPI_NOT, VLRISENTO_NOT, VLROUTRAS_NOT,
                    VLRDESC_NOT, VLRNOT_NOT, VLRENTRA_NOT, FRETE_NOT, VLRPIS_NOT,
                    VLRCOFINS_NOT, VLRCSL_NOT, TRANSP_NOT, PORCONTA_NOT, CHASSI_NOT,
                    USUARIO_NOT, HORA_NOT
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
            
            jdbcTemplate.update(insertNotascabSql,
                filialPadded,
                emissaoInt,
                1,
                tipoNota != null ? tipoNota : 1,
                serie != null ? serie : "001",
                numeroNota,
                1,
                codigoVendedor,
                emissaoInt,
                emissaoInt,
                emissaoInt,
                "J",
                orcamento.get("CGCCPF_CLI"),
                "",
                orcamento.get("NOME_ORP"),
                "",
                "",
                "",
                ufDestino,
                0,
                natureza,
                5101,
                "+",
                orcamento.get("CONDPAG_ORP"),
                "",
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                "",
                "C",
                "",
                "SISTEMA",
                Integer.parseInt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HHmmss")))
            );

            String updateObsNotascab = """
                UPDATE notascab SET OBSERVACAO_NOT = ?
                WHERE NUMERO_NOT = ? AND SERIE_NOT = ?
                """;
            jdbcTemplate.update(updateObsNotascab, 
                "FATURADO VIA SPDEALER-WEB (ANTIGRAVITY) - " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")),
                numeroNota,
                serie != null ? serie : "001"
            );
            
            String itensSql = """
                SELECT orpp.FAB_ORPP, orpp.CODIGO_ORPP, orpp.DESCR_ORPP, orpp.QTALOC_ORPP, 
                       orpp.PRECOTOT_ORPP, orpp.VLRDESC_ORPP, orpp.PERC_IPI_ORPP,
                       orpp.NCM_ORPP, orpp.GRUPO_ORPP, orpp.CODFISCAL_ORPP,
                       kar.CODFISC_KAR, est.IPI_EST, est.CODTRIBICMS_EST
                FROM orcampp orpp
                LEFT JOIN kardex kar ON kar.FAB_KAR = orpp.FAB_ORPP AND kar.CODPROD_KAR = orpp.CODIGO_ORPP AND kar.DEP_KAR = 1
                LEFT JOIN masest est ON est.CODIGO_UF = ?
                WHERE orpp.NUMERO_ORPP = ? AND orpp.FILIAL_ORPP = ?
                """;
            List<Map<String, Object>> itens = jdbcTemplate.queryForList(itensSql, ufOrigem, numeroPadded, filialPadded);
            
            int sequencia = 1;
            BigDecimal totalMercadoria = ZERO;
            BigDecimal totalIpi = ZERO;
            BigDecimal totalIcms = ZERO;
            BigDecimal totalIcmsSt = ZERO;
            BigDecimal totalBaseIcms = ZERO;
            BigDecimal totalBaseIcmsSt = ZERO;
            
            CalculadorTributarioService.ContextoTributario contexto = new CalculadorTributarioService.ContextoTributario();
            contexto.setUfOrigem(ufOrigem);
            contexto.setUfDestino(ufDestino);
            contexto.setRevenda(ehRevenda);
            contexto.setFilial(filialOrp);
            contexto.setContratoCliente(getIntValue(orcamento, "CONTRATO_CLI"));
            contexto.setCargaMediaCliente(getBigDecimalValue(orcamento, "CARGAMEDIA_CLI"));
            contexto.setOptSimplesCliente(getIntValue(orcamento, "OPTSIMPLES_CLI"));
            contexto.setNaoContratadoCliente(getIntValue(orcamento, "NAOCONTR_CLI"));
            
            for (Map<String, Object> item : itens) {
                BigDecimal qtaloc = (BigDecimal) item.get("QTALOC_ORPP");
                BigDecimal precotot = (BigDecimal) item.get("PRECOTOT_ORPP");
                
                if (qtaloc == null || qtaloc.compareTo(ZERO) <= 0) {
                    continue;
                }
                
                BigDecimal valorTotalItem = precotot != null ? precotot : ZERO;
                BigDecimal desconto = getBigDecimalValue(item, "VLRDESC_ORPP");
                String ncm = item.get("NCM_ORPP") != null ? item.get("NCM_ORPP").toString() : "00000000";
                Integer grupo = getIntValue(item, "GRUPO_ORPP");
                Integer codFiscal = getIntValue(item, "CODFISCAL_ORPP");
                if (codFiscal == null || codFiscal == 0) {
                    codFiscal = getIntValue(item, "CODTRIBICMS_EST");
                }
                
                contexto.setCodigoTributacao(codFiscal);
                contexto.setCodigoOperacao(natureza);
                
                CalculadorTributarioService.ItemTributavel itemTributavel = new CalculadorTributarioService.ItemTributavel();
                itemTributavel.setPrecoTotal(valorTotalItem);
                itemTributavel.setDesconto(desconto);
                itemTributavel.setNcm(ncm);
                itemTributavel.setGrupoProduto(grupo);
                
                CalculadorTributarioService.DadosTributacao trib = 
                    calculadorTributario.calcularTributacao(itemTributavel, contexto);
                
                BigDecimal quantidade = qtaloc.setScale(4, RoundingMode.HALF_UP);
                BigDecimal valorUnitario = valorTotalItem.divide(quantidade, 4, RoundingMode.HALF_UP);
                BigDecimal baseIcmsItem = trib.getBaseIcms();
                BigDecimal valorIcmsItem = trib.getValorIcms();
                BigDecimal valorIpiItem = trib.getValorIpi();
                BigDecimal baseIcmsStItem = trib.getBaseIcmsSt();
                BigDecimal valorIcmsStItem = trib.getValorIcmsSt();
                BigDecimal aliquotaIcmsItem = trib.getAliquotaIcms();
                
                Map<String, Object> auditItem = new HashMap<>();
                auditItem.put("sequencia", sequencia);
                auditItem.put("produto", item.get("CODIGO_ORPP"));
                auditItem.put("ncm", ncm);
                auditItem.put("precoTotal", valorTotalItem);
                auditItem.put("desconto", desconto);
                auditItem.put("baseIcmsJava", baseIcmsItem);
                auditItem.put("baseIcmsLegacy", valorTotalItem);
                auditItem.put("valorIcmsJava", valorIcmsItem);
                auditItem.put("valorIcmsLegacy", ZERO);
                auditItem.put("baseIcmsStJava", baseIcmsStItem);
                auditItem.put("valorIcmsStJava", valorIcmsStItem);
                auditItem.put("valorIpiJava", valorIpiItem);
                auditItem.put("aliqIcms", aliquotaIcmsItem);
                auditItem.put("naoTributado", trib.isNaoTributado());
                auditLog.add(auditItem);
                
                String insertNotasdetSql = """
                    INSERT INTO notasdet (
                        FILIAL_NOT, EMISSAOI_NOT, REGISTRO_NOT, TIPO_NOT, SERIE_NOT, NUMERO_NOT,
                        FAB_NOT, PRODUTO_NOT, SEQUENCIA_NOT, DEPTO_NOT, VENDEDOR_NOT, DESCRICAO_NOT,
                        QTDE_NOT, PRECOUNIT_NOT, VALORTOTAL_NOT, DESCONTO_NOT,
                        BASEICMS_NOT, PERCICMS_NOT, VALORICMS_NOT,
                        BASEICMSST_NOT, PERCICMSST_NOT, VALORICMSST_NOT,
                        PERCIPI_NOT, VALORIPI_NOT,
                        VLRPIS_NOT, VLRCOFINS_NOT, VLRCSL_NOT,
                        CODIGO_CFOP_NOT, NCM_NOT, NUMEROORCAMENTO_NOT, NUMEROITEM_ORCAMENTO
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """;
                
                jdbcTemplate.update(insertNotasdetSql,
                    filialPadded,
                    emissaoInt,
                    1,
                    tipoNota != null ? tipoNota : 1,
                    serie != null ? serie : "001",
                    numeroNota,
                    item.get("FAB_ORPP"),
                    item.get("CODIGO_ORPP"),
                    sequencia,
                    1,
                    codigoVendedor,
                    item.get("DESCR_ORPP"),
                    quantidade,
                    valorUnitario.setScale(4, RoundingMode.HALF_UP),
                    valorTotalItem.setScale(2, RoundingMode.HALF_UP),
                    desconto != null ? desconto.setScale(2, RoundingMode.HALF_UP) : ZERO,
                    baseIcmsItem.setScale(2, RoundingMode.HALF_UP),
                    aliquotaIcmsItem.setScale(2, RoundingMode.HALF_UP),
                    valorIcmsItem.setScale(2, RoundingMode.HALF_UP),
                    baseIcmsStItem.setScale(2, RoundingMode.HALF_UP),
                    trib.getPercentualSubstituicao().setScale(2, RoundingMode.HALF_UP),
                    valorIcmsStItem.setScale(2, RoundingMode.HALF_UP),
                    getBigDecimalValue(item, "PERC_IPI_ORPP").setScale(2, RoundingMode.HALF_UP),
                    valorIpiItem.setScale(2, RoundingMode.HALF_UP),
                    ZERO,
                    ZERO,
                    ZERO,
                    natureza,
                    ncm,
                    numeroPadded,
                    sequencia
                );
                
                totalMercadoria = totalMercadoria.add(valorTotalItem);
                totalIpi = totalIpi.add(valorIpiItem);
                totalIcms = totalIcms.add(valorIcmsItem);
                totalIcmsSt = totalIcmsSt.add(valorIcmsStItem);
                totalBaseIcms = totalBaseIcms.add(baseIcmsItem);
                totalBaseIcmsSt = totalBaseIcmsSt.add(baseIcmsStItem);
                sequencia++;
            }
            
            BigDecimal valorTotalNota = totalMercadoria.add(totalIpi).add(totalIcmsSt);
            
            String updateNotascabTotaisSql = """
                UPDATE notascab SET 
                    VLRMERC_NOT = ?,
                    VLRIPI_NOT = ?,
                    VLRNOT_NOT = ?,
                    VLRDESC_NOT = ?
                WHERE NUMERO_NOT = ? AND SERIE_NOT = ? AND FILIAL_NOT = ?
                """;
            jdbcTemplate.update(updateNotascabTotaisSql,
                totalMercadoria.setScale(2, RoundingMode.HALF_UP),
                totalIpi.setScale(2, RoundingMode.HALF_UP),
                valorTotalNota.setScale(2, RoundingMode.HALF_UP),
                ZERO,
                numeroNota,
                serie != null ? serie : "001",
                filialPadded
            );
            
            String condpagSql = "SELECT * FROM maspag WHERE FILIAL_PAGA = ? AND CODIGO_PAGA = ?";
            Map<String, Object> condpag = null;
            try {
                condpag = jdbcTemplate.queryForMap(condpagSql, filialPadded, orcamento.get("CONDPAG_ORP"));
            } catch (Exception e) {
                log.warn("Condição de pagamento não encontrada: {}", orcamento.get("CONDPAG_ORP"));
            }
            
            if (condpag != null) {
                List<BigDecimal> valoresParcelas = gerarParcelas(valorTotalNota, 1);
                LocalDate dataVencimento = hoje.plusDays(30);
                
                int parcelaNum = 1;
                for (BigDecimal valorParcela : valoresParcelas) {
                    String insertReceberSql = """
                        INSERT INTO receber (
                            FILIAL_REC, CODIGO_REC, NUMDUP_REC, PARCELA_REC, DTEMISSI_REC,
                            DTVENCI_REC, DTMOVI_REC, VALOR_REC, DTPGTO_REC, TIPODOC_REC,
                            STATUS_REC, VENDEDOR_REC, CGCCPF_REC, TIPOPESSOA_REC, TPCOB_REC,
                            NUMERONOTA_REC, SERIENOTA_REC, TIPONOTA_REC, USUARIO_REC
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """;
                    
                    String numdup = String.format("%06d", numeroNota) + String.format("%02d", parcelaNum);
                    
                    jdbcTemplate.update(insertReceberSql,
                        filialPadded,
                        orcamento.get("CGCCPF_CLI"),
                        numdup,
                        parcelaNum,
                        emissaoInt,
                        Integer.parseInt(dataVencimento.format(DATE_COMP3)),
                        emissaoInt,
                        valorParcela.setScale(2, RoundingMode.HALF_UP),
                        0,
                        "DP",
                        "P",
                        codigoVendedor,
                        orcamento.get("CGCCPF_CLI"),
                        "J",
                        "",
                        numeroNota,
                        serie != null ? serie : "001",
                        tipoNota != null ? tipoNota : 1,
                        "SISTEMA"
                    );
                    
                    dataVencimento = dataVencimento.plusDays(30);
                    parcelaNum++;
                }
            }
            
            for (Map<String, Object> item : itens) {
                BigDecimal qtaloc = (BigDecimal) item.get("QTALOC_ORPP");
                if (qtaloc == null || qtaloc.compareTo(ZERO) <= 0) {
                    continue;
                }
                
                String insertKardexmSql = """
                    INSERT INTO kardexm (
                        DEP_KARM, REGISTRO_KARM, FAB_KARM, CODPROD_KARM, DTATUAL_KARM,
                        HRATUAL_KARM, TIPOMOV_KARM, NRONOTA_KARM, SERIE_KARM, SEQUENCIA_KARM,
                        CPFCGC_KARM, QTDE_KARM, PRECUSTO_KARM, PRECSAID_KARM, VLRIPI_KARM,
                        VLRPIS_KARM, VLRCOFINS_KARM, VENDEDOR_KARM, NATOP_KARM, TIPOPESSOA_KARM,
                        CLIFORN_KARM, NATUREZA_KARM, DEPTO_KARM, TIPOPED_KARM, PROGRAMA_KARM
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """;
                
                String horaAtual = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HHmmss"));
                
                jdbcTemplate.update(insertKardexmSql,
                    1,
                    1,
                    item.get("FAB_ORPP"),
                    item.get("CODIGO_ORPP"),
                    emissaoInt,
                    Integer.parseInt(horaAtual),
                    "S",
                    numeroNota,
                    serie != null ? serie : "001",
                    String.format("%03d", sequencia),
                    orcamento.get("CGCCPF_CLI"),
                    qtaloc.negate(),
                    ZERO,
                    item.get("PRECOTOT_ORPP"),
                    item.get("PERC_IPI_ORPP"),
                    ZERO,
                    ZERO,
                    codigoVendedor,
                    natureza,
                    "J",
                    "C",
                    "V",
                    1,
                    "S",
                    "EST006"
                );
            }
            
            String updateFechanfSql = """
                UPDATE fechanf SET 
                    FNF_STATUS = 1,
                    FNF_NF = ?,
                    FNF_NF_SEQ = 1,
                    FNF_TIPONT = ?,
                    FNF_VALOR = ?,
                    FNF_DATA = ?,
                    FNF_HORA = ?,
                    FNF_DATANFE = ?
                WHERE FNF_FILIAL = ? AND FNF_TIPO = ? AND FNF_NUMERO = ?
                """;
            
            String horaCompleta = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HHmmss"));
            int horaInt = Integer.parseInt(horaCompleta);
            
            int updatedFechanf = jdbcTemplate.update(updateFechanfSql,
                numeroNota,
                tipont,
                valorTotalNota.setScale(2, RoundingMode.HALF_UP),
                emissaoInt,
                horaInt,
                emissaoInt,
                filialPadded,
                fnfTipo,
                numeroPadded
            );
            
            if (updatedFechanf == 0) {
                String insertFechanfSql = """
                    INSERT INTO fechanf (
                        FNF_FILIAL, FNF_STATUS, FNF_TIPO, FNF_NUMERO, FNF_CONTRATO,
                        FNF_DATA, FNF_HORA, FNF_NF, FNF_NF_SEQ, FNF_USU, FNF_SERIE,
                        FNF_CLIENTE, FNF_VALOR, FNF_TIPONT, FNF_DATANFE
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """;
                
                String serieNf = "CO".equals(fnfTipo) ? "21" : (serie != null ? serie : "001");
                
                jdbcTemplate.update(insertFechanfSql,
                    filialPadded,
                    1,
                    fnfTipo,
                    numeroPadded,
                    0,
                    emissaoInt,
                    horaInt,
                    numeroNota,
                    1,
                    codigoVendedor,
                    serieNf,
                    orcamento.get("NOME_ORP"),
                    valorTotalNota.setScale(2, RoundingMode.HALF_UP),
                    tipont,
                    emissaoInt
                );
            }
            
            String updateOrcamentoSql = """
                UPDATE orcamp SET 
                    TIPO_ORP = 'C',
                    NOTA_ORP = ?,
                    DTNOTA_ORP = ?,
                    OBS_ORP = ?
                WHERE NUMERO_ORP = ? AND FILIAL_ORP = ?
                """;
            jdbcTemplate.update(updateOrcamentoSql, numeroNota, emissaoInt, 
                "FATURADO VIA SPDEALER-WEB (ANTIGRAVITY) - " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")),
                numeroPadded, filialPadded);
            
            gerarLogAuditoria(numeroOrp, numeroNota, serie, auditLog, 
                totalMercadoria, totalIpi, totalIcms, totalIcmsSt, valorTotalNota);
            
            result.put("success", true);
            result.put("message", "Pedido confirmado e Nota Fiscal gerada com sucesso");
            result.put("numeroOrp", numeroOrp);
            result.put("numeroNota", numeroNota);
            result.put("serie", serie != null ? serie : "001");
            result.put("totalMercadoria", totalMercadoria);
            result.put("totalIpi", totalIpi);
            result.put("totalIcms", totalIcms);
            result.put("totalIcmsSt", totalIcmsSt);
            result.put("valorTotal", valorTotalNota);
            result.put("auditLog", auditLog);
            
            return result;
            
        } catch (Exception e) {
            log.error("Erro ao confirmar pedido e gerar nota fiscal", e);
            throw new RuntimeException("Erro ao confirmar pedido e gerar nota fiscal: " + e.getMessage(), e);
        }
    }

    private void gerarLogAuditoria(Integer numeroOrp, Integer numeroNota, String serie,
            List<Map<String, Object>> auditLog,
            BigDecimal totalMercadoria, BigDecimal totalIpi, 
            BigDecimal totalIcms, BigDecimal totalIcmsSt,
            BigDecimal valorTotal) {
        
        StringBuilder logBuilder = new StringBuilder();
        logBuilder.append("\n");
        logBuilder.append("================================================================================\n");
        logBuilder.append("                    LOG DE AUDITORIA - CALCULO TRIBUTARIO\n");
        logBuilder.append("================================================================================\n");
        logBuilder.append(String.format("Orcamento: %d | Nota Fiscal: %d | Serie: %s\n", numeroOrp, numeroNota, serie));
        logBuilder.append(String.format("Data/Hora: %s\n", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))));
        logBuilder.append("--------------------------------------------------------------------------------\n");
        logBuilder.append("ITEM | PRODUTO    | NCM       | PRECO TOTAL | BASE ICMS  | VALOR ICMS | ICMS ST   | VALOR IPI | NAO TRIB\n");
        logBuilder.append("--------------------------------------------------------------------------------\n");
        
        BigDecimal totalBaseIcmsAudit = ZERO;
        BigDecimal totalValorIcmsAudit = ZERO;
        BigDecimal totalValorIcmsStAudit = ZERO;
        BigDecimal totalValorIpiAudit = ZERO;
        
        for (Map<String, Object> item : auditLog) {
            logBuilder.append(String.format("%04d | %-10s | %-9s | %11.2f | %10.2f | %10.2f | %9.2f | %9.2f | %s\n",
                item.get("sequencia"),
                item.get("produto"),
                item.get("ncm"),
                item.get("precoTotal"),
                item.get("baseIcmsJava"),
                item.get("valorIcmsJava"),
                item.get("valorIcmsStJava"),
                item.get("valorIpiJava"),
                item.get("naoTributado") == Boolean.TRUE ? "SIM" : "NAO"
            ));
            
            totalBaseIcmsAudit = totalBaseIcmsAudit.add((BigDecimal) item.get("baseIcmsJava"));
            totalValorIcmsAudit = totalValorIcmsAudit.add((BigDecimal) item.get("valorIcmsJava"));
            totalValorIcmsStAudit = totalValorIcmsStAudit.add((BigDecimal) item.get("valorIcmsStJava"));
            totalValorIpiAudit = totalValorIpiAudit.add((BigDecimal) item.get("valorIpiJava"));
        }
        
        logBuilder.append("--------------------------------------------------------------------------------\n");
        logBuilder.append("TOTAIS CALCULADOS (JAVA):\n");
        logBuilder.append(String.format("  Base ICMS:     %10.2f\n", totalBaseIcmsAudit));
        logBuilder.append(String.format("  Valor ICMS:    %10.2f\n", totalValorIcmsAudit));
        logBuilder.append(String.format("  Valor ICMS ST: %9.2f\n", totalValorIcmsStAudit));
        logBuilder.append(String.format("  Valor IPI:     %9.2f\n", totalValorIpiAudit));
        logBuilder.append(String.format("  Total Mercad.: %10.2f\n", totalMercadoria));
        logBuilder.append(String.format("  TOTAL NOTA:    %10.2f\n", valorTotal));
        logBuilder.append("--------------------------------------------------------------------------------\n");
        logBuilder.append("COMPARATIVO x LEGACY (COBOL):\n");
        logBuilder.append(String.format("  Diferenca Base ICMS:     %10.2f (%.4f%%)\n", 
            totalBaseIcmsAudit.subtract(totalMercadoria),
            totalMercadoria.compareTo(ZERO) == 0 ? 0 : 
                totalBaseIcmsAudit.subtract(totalMercadoria).abs()
                    .multiply(CEM).divide(totalMercadoria, 4, RoundingMode.HALF_UP)));
        logBuilder.append(String.format("  Diferenca Valor ICMS:    %10.2f\n", totalValorIcmsAudit));
        logBuilder.append(String.format("  Diferenca ICMS ST:       %9.2f\n", totalValorIcmsStAudit));
        logBuilder.append(String.format("  Diferenca IPI:           %9.2f\n", totalValorIpiAudit.subtract(totalIpi)));
        logBuilder.append("================================================================================\n");
        logBuilder.append("                              FIM DO LOG\n");
        logBuilder.append("================================================================================\n");
        
        log.info(logBuilder.toString());
        
        try {
            ObjectMapper mapper = new ObjectMapper();
            String jsonAudit = mapper.writeValueAsString(auditLog);
            
            String insertAuditLogSql = """
                INSERT INTO logtributario (
                    LOGTRB_ORP, LOGTRB_NOTA, LOGTRB_SERIE, LOGTRB_DATA, LOGTRB_HORA,
                    LOGTRB_VLRICMS, LOGTRB_VLRICMSST, LOGTRB_VLRIPI,
                    LOGTRB_TOTAL, LOGTRB_JSON
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
            
            jdbcTemplate.update(insertAuditLogSql,
                numeroOrp,
                numeroNota,
                serie,
                Integer.parseInt(LocalDate.now().format(DATE_COMP3)),
                Integer.parseInt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HHmmss"))),
                totalValorIcmsAudit.setScale(2, RoundingMode.HALF_UP),
                totalValorIcmsStAudit.setScale(2, RoundingMode.HALF_UP),
                totalValorIpiAudit.setScale(2, RoundingMode.HALF_UP),
                valorTotal.setScale(2, RoundingMode.HALF_UP),
                jsonAudit
            );
        } catch (Exception e) {
            log.warn("Nao foi possivel gravar log de auditoria no banco: {}. Details: {}", e.getMessage(), logBuilder.toString());
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> cancelarConfirmacao(Integer numeroOrp, Integer filialOrp) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String numeroPadded = padNumero(numeroOrp);
            String filialPadded = padFilial(filialOrp);
            String checkSql = """
                SELECT TIPO_ORP, NOTA_ORP
                FROM orcamp 
                WHERE NUMERO_ORP = ? AND FILIAL_ORP = ?
                """;
            
            Map<String, Object> orcamento = jdbcTemplate.queryForMap(checkSql, numeroPadded, filialPadded);
            String tipoOrp = (String) orcamento.get("TIPO_ORP");
            Integer notaOrp = (Integer) orcamento.get("NOTA_ORP");
            
            if (!"C".equals(tipoOrp)) {
                result.put("success", false);
                result.put("error", "Pedido não está confirmado");
                return result;
            }
            
            if (notaOrp != null && notaOrp > 0) {
                String deleteReceberSql = """
                    DELETE FROM receber WHERE NUMERONOTA_REC = ? AND SERIENOTA_REC = ?
                    """;
                jdbcTemplate.update(deleteReceberSql, notaOrp, "001");
                
                String deleteNotasdetSql = """
                    DELETE FROM notasdet WHERE NUMERO_NOT = ? AND SERIE_NOT = ?
                    """;
                jdbcTemplate.update(deleteNotasdetSql, notaOrp, "001");
                
                String deleteNotascabSql = """
                    DELETE FROM notascab WHERE NUMERO_NOT = ? AND SERIE_NOT = ?
                    """;
                jdbcTemplate.update(deleteNotascabSql, notaOrp, "001");
            }
            
            String updateOrcamentoSql = """
                UPDATE orcamp SET 
                    TIPO_ORP = 'P',
                    NOTA_ORP = 0,
                    DTNOTA_ORP = 0
                WHERE NUMERO_ORP = ? AND FILIAL_ORP = ?
                """;
            jdbcTemplate.update(updateOrcamentoSql, numeroPadded, filialPadded);
            
            String itensSql = """
                SELECT FAB_ORPP, CODIGO_ORPP, QTALOC_ORPP
                FROM orcampp
                WHERE NUMERO_ORPP = ? AND FILIAL_ORPP = ?
                """;
            List<Map<String, Object>> itens = jdbcTemplate.queryForList(itensSql, numeroPadded, filialPadded);
            
            for (Map<String, Object> item : itens) {
                BigDecimal qtaloc = (BigDecimal) item.get("QTALOC_ORPP");
                if (qtaloc != null && qtaloc.compareTo(BigDecimal.ZERO) > 0) {
                    String updateKardexSql = """
                        UPDATE kardex SET 
                            QTALOC_KAR = COALESCE(QTALOC_KAR, 0) - ?
                        WHERE FAB_KAR = ? AND CODPROD_KAR = ? AND DEP_KAR = 1
                        """;
                    jdbcTemplate.update(updateKardexSql, qtaloc, item.get("FAB_ORPP"), item.get("CODIGO_ORPP"));
                }
            }
            
            String deleteFechanfSql = """
                DELETE FROM fechanf WHERE FNF_NUMERO = ? AND FNF_FILIAL = ?
                """;
            jdbcTemplate.update(deleteFechanfSql, numeroPadded, filialPadded);
            
            result.put("success", true);
            result.put("message", "Confirmação cancelada com sucesso");
            result.put("numeroOrp", numeroOrp);
            
            return result;
            
        } catch (Exception e) {
            log.error("Erro ao cancelar confirmação", e);
            throw new RuntimeException("Erro ao cancelar confirmação: " + e.getMessage(), e);
        }
    }

    private Integer gerarNumeroNota() {
        String sql = "SELECT COALESCE(MAX(NUMERO_NOT), 0) + 1 FROM notascab WHERE FILIAL_NOT = 1";
        try {
            return jdbcTemplate.queryForObject(sql, Integer.class);
        } catch (Exception e) {
            return 1;
        }
    }

    private List<BigDecimal> gerarParcelas(BigDecimal valorTotal, int numeroParcelas) {
        List<BigDecimal> parcelas = new ArrayList<>();
        
        if (numeroParcelas <= 0) {
            parcelas.add(valorTotal);
            return parcelas;
        }
        
        BigDecimal valorParcela = valorTotal.divide(BigDecimal.valueOf(numeroParcelas), 2, RoundingMode.DOWN);
        BigDecimal diferenca = valorTotal.subtract(valorParcela.multiply(BigDecimal.valueOf(numeroParcelas)));
        
        for (int i = 0; i < numeroParcelas; i++) {
            if (i == 0) {
                parcelas.add(valorParcela.add(diferenca));
            } else {
                parcelas.add(valorParcela);
            }
        }
        
        return parcelas;
    }
    
    private Integer getIntValue(Map<String, Object> dados, String campo) {
        if (dados == null || !dados.containsKey(campo) || dados.get(campo) == null) return 0;
        Object valor = dados.get(campo);
        if (valor instanceof Integer) return (Integer) valor;
        if (valor instanceof BigDecimal) return ((BigDecimal) valor).intValue();
        if (valor instanceof Number) return ((Number) valor).intValue();
        try {
            return Integer.parseInt(valor.toString());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private BigDecimal getBigDecimalValue(Map<String, Object> dados, String campo) {
        if (dados == null || !dados.containsKey(campo) || dados.get(campo) == null) return ZERO;
        Object valor = dados.get(campo);
        if (valor instanceof BigDecimal) return (BigDecimal) valor;
        if (valor instanceof Number) return new BigDecimal(valor.toString());
        try {
            return new BigDecimal(valor.toString());
        } catch (NumberFormatException e) {
            return ZERO;
        }
    }
}
