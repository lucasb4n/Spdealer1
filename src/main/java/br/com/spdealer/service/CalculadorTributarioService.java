package br.com.spdealer.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CalculadorTributarioService {

    private final JdbcTemplate jdbcTemplate;

    private static final BigDecimal CEM = new BigDecimal("100");
    private static final BigDecimal ZERO = BigDecimal.ZERO;

    public DadosTributacao calcularTributacao(ItemTributavel item, ContextoTributario contexto) {
        DadosTributacao result = new DadosTributacao();
        
        BigDecimal precoTotal = item.getPrecoTotal();
        String ncm = item.getNcm();
        String ufDestino = contexto.getUfDestino();
        String ufOrigem = contexto.getUfOrigem();
        boolean ehRevenda = contexto.isRevenda();
        Integer codigoTributacao = contexto.getCodigoTributacao();

        Map<String, Object> dadosNbm = buscarDadosNbm(ncm, contexto.getFilial());
        Map<String, Object> dadosTributacao = buscarDadosTributacao(codigoTributacao);
        Map<String, Object> dadosMunicipio = buscarDadosMunicipio(ufDestino);
        Map<String, Object> dadosEstado = buscarDadosEstado(ufOrigem);
        Map<String, Object> dadosEmpresa = buscarDadosEmpresa(contexto.getFilial());
        Map<String, Object> dadosGrupo = buscarDadosGrupo(item.getGrupoProduto());
        Map<String, Object> dadosOperacao = buscarDadosOperacao(contexto.getCodigoOperacao());

        boolean ipiGravadoNaGrupo = verificarIpiGravadoNaGrupo(dadosGrupo);
        BigDecimal aliquotaIpiEstado = getBigDecimalValue(dadosEstado, "IPI_EST");
        BigDecimal aliquotaIcms = obterAliquotaIcms(dadosMunicipio, dadosEstado, dadosEmpresa, dadosOperacao, ufOrigem, ufDestino);
        boolean naoTributado = verificarNaoTributado(dadosOperacao);

        if (naoTributado) {
            aliquotaIcms = ZERO;
        }

        boolean stCalculada = deveCalcularSt(dadosNbm, dadosMunicipio, contexto);

        BigDecimal valorIpi = ZERO;
        if (ipiGravadoNaGrupo) {
            valorIpi = calcularIpi(precoTotal, item.getDesconto(), aliquotaIpiEstado);
        }
        result.setValorIpi(valorIpi);
        result.setAliquotaIpi(aliquotaIpiEstado);

        BigDecimal baseIcms = precoTotal;
        BigDecimal valorIcmsSt = ZERO;
        BigDecimal baseIcmsSt = ZERO;

        if (stCalculada) {
            DadosSt dadosSt = calcularSubstituicaoTributaria(
                precoTotal, dadosNbm, dadosMunicipio, dadosTributacao, contexto
            );
            baseIcmsSt = dadosSt.getBaseSt();
            valorIcmsSt = dadosSt.getIcmsSt();
            
            result.setBaseIcmsSt(baseIcmsSt);
            result.setValorIcmsSt(valorIcmsSt);
            result.setPercentualSubstituicao(dadosSt.getPercentualSt());

            baseIcms = precoTotal.subtract(valorIcmsSt);
        }

        result.setBaseIcms(baseIcms);

        BigDecimal baseTributavel = getBigDecimalValue(dadosTributacao, "BASE_TRIB");
        if (baseTributavel.compareTo(ZERO) > 0) {
            BigDecimal reducao = baseIcms.multiply(baseTributavel)
                .divide(CEM, 10, RoundingMode.HALF_UP);
            baseIcms = baseIcms.subtract(reducao);
            result.setBaseIcms(baseIcms.setScale(2, RoundingMode.HALF_UP));
        }

        if (!naoTributado) {
            BigDecimal valorIcms = baseIcms.multiply(aliquotaIcms)
                .divide(CEM, 2, RoundingMode.HALF_UP);
            result.setValorIcms(valorIcms);
        } else {
            result.setValorIcms(ZERO);
        }
        result.setAliquotaIcms(aliquotaIcms);

        result.setPrecoTotalComImpostos(precoTotal.add(valorIpi).add(valorIcmsSt));

        log.debug("Tributação calculada - NCM: {}, ICMS: {}, IPI: {}, ICMSST: {}, Não Tributado: {}", 
            ncm, result.getValorIcms(), valorIpi, valorIcmsSt, naoTributado);

        return result;
    }

    private BigDecimal calcularIpi(BigDecimal precoTotal, BigDecimal desconto, BigDecimal aliquotaIpiEstado) {
        if (aliquotaIpiEstado == null || aliquotaIpiEstado.compareTo(ZERO) == 0) {
            return ZERO;
        }
        BigDecimal baseCalculo = precoTotal.add(desconto);
        return baseCalculo.multiply(aliquotaIpiEstado)
            .divide(CEM, 2, RoundingMode.HALF_UP);
    }

    private boolean verificarIpiGravadoNaGrupo(Map<String, Object> dadosGrupo) {
        if (dadosGrupo == null || dadosGrupo.isEmpty()) {
            return false;
        }
        Object ipiGru = dadosGrupo.get("IPI_GRU");
        if (ipiGru == null) {
            return false;
        }
        String ipiGruStr = ipiGru.toString().trim().toUpperCase();
        return "S".equals(ipiGruStr);
    }

    private boolean verificarNaoTributado(Map<String, Object> dadosOperacao) {
        if (dadosOperacao == null || dadosOperacao.isEmpty()) {
            return false;
        }
        Integer naoTrib = getIntValue(dadosOperacao, "NAOTRIB_OPE");
        return naoTrib != null && naoTrib == 1;
    }

    private DadosSt calcularSubstituicaoTributaria(BigDecimal precoTotal,
            Map<String, Object> dadosNbm, Map<String, Object> dadosMunicipio,
            Map<String, Object> dadosTributacao, ContextoTributario contexto) {
        
        DadosSt resultado = new DadosSt();
        
        Integer itemSubf = getIntValue(dadosNbm, "ITEMSUBF_NBM");
        Integer calculaStMun = getIntValue(dadosMunicipio, "CALCULAST_MUN");
        
        if (itemSubf == null) itemSubf = 0;
        if (calculaStMun == null) calculaStMun = 0;

        boolean temContrato = contexto.getContratoCliente() != null && contexto.getContratoCliente() == 1;
        BigDecimal cargaMedia = contexto.getCargaMediaCliente() != null ? 
            contexto.getCargaMediaCliente() : ZERO;
        
        if (temContrato && cargaMedia.compareTo(ZERO) != 0) {
            BigDecimal baseSt = precoTotal;
            BigDecimal percSub = cargaMedia;
            BigDecimal icmsSt = baseSt.multiply(percSub)
                .divide(CEM, 2, RoundingMode.HALF_UP);
            
            resultado.setBaseSt(baseSt);
            resultado.setIcmsSt(icmsSt);
            resultado.setPercentualSt(percSub);
            return resultado;
        }

        if (itemSubf == 1 && calculaStMun == 1) {
            BigDecimal baseTrib = getBigDecimalValue(dadosTributacao, "BASE_TRIB");
            if (baseTrib == null) baseTrib = ZERO;
            
            boolean optSimples = contexto.getOptSimplesCliente() != null && 
                contexto.getOptSimplesCliente() == 0;
            if (optSimples) {
                baseTrib = ZERO;
            }

            BigDecimal aliqIva = getBigDecimalValue(dadosMunicipio, "ALIQIVA_MUN");
            BigDecimal aliqIcm = getBigDecimalValue(dadosMunicipio, "ALIQICM_MUN");
            BigDecimal aliqInt = getBigDecimalValue(dadosMunicipio, "ALIQINT_MUN");
            
            if (aliqIva == null) aliqIva = ZERO;
            if (aliqIcm == null) aliqIcm = ZERO;
            if (aliqInt == null) aliqInt = ZERO;

            BigDecimal wkBase1 = precoTotal.multiply(aliqIva)
                .divide(CEM, 10, RoundingMode.HALF_UP);
            
            BigDecimal baseSt = precoTotal.add(wkBase1)
                .subtract(precoTotal.add(wkBase1).multiply(baseTrib).divide(CEM, 10, RoundingMode.HALF_UP));
            baseSt = baseSt.setScale(2, RoundingMode.HALF_UP);

            BigDecimal parte1 = baseSt.multiply(aliqIcm).divide(CEM, 10, RoundingMode.HALF_UP);
            BigDecimal parte2 = precoTotal.subtract(
                precoTotal.multiply(baseTrib).divide(CEM, 10, RoundingMode.HALF_UP)
            ).multiply(aliqInt).divide(CEM, 10, RoundingMode.HALF_UP);
            
            BigDecimal icmsSt = parte1.subtract(parte2)
                .setScale(2, RoundingMode.HALF_UP);

            String ufOrigem = contexto.getUfOrigem();
            if ("RO".equals(ufOrigem) || "AC".equals(ufOrigem)) {
                icmsSt = baseSt.multiply(aliqIcm)
                    .divide(CEM, 2, RoundingMode.HALF_UP);
            }

            resultado.setBaseSt(baseSt);
            resultado.setIcmsSt(icmsSt);
            resultado.setPercentualSt(aliqIcm);
            resultado.setBaseIva(aliqIva);
            return resultado;
        }

        Integer prot21 = getIntValue(dadosMunicipio, "PROT21_MUN");
        BigDecimal partOri = getBigDecimalValue(dadosMunicipio, "PARTORI_MUN");
        BigDecimal partDes = getBigDecimalValue(dadosMunicipio, "PARTDES_MUN");
        boolean naoContratado = contexto.getNaoContratadoCliente() != null && 
            contexto.getNaoContratadoCliente() == 1;
        
        if (prot21 == null) prot21 = 0;
        if (partOri == null) partOri = ZERO;
        if (partDes == null) partDes = ZERO;

        boolean calculaStPorProtocolo = prot21 == 1 && 
            (partOri.compareTo(ZERO) == 0 || partDes.compareTo(ZERO) == 0 || naoContratado);

        if (calculaStPorProtocolo) {
            BigDecimal aliqIcm = getBigDecimalValue(dadosMunicipio, "ALIQICM_MUN");
            BigDecimal aliqInt = getBigDecimalValue(dadosMunicipio, "ALIQINT_MUN");
            
            if (aliqIcm == null) aliqIcm = ZERO;
            if (aliqInt == null) aliqInt = ZERO;

            BigDecimal percSub = aliqIcm.subtract(aliqInt);
            BigDecimal icmsSt = precoTotal.multiply(percSub)
                .divide(CEM, 2, RoundingMode.HALF_UP);
            
            resultado.setBaseSt(precoTotal);
            resultado.setIcmsSt(icmsSt);
            resultado.setPercentualSt(percSub);
            return resultado;
        }

        resultado.setBaseSt(ZERO);
        resultado.setIcmsSt(ZERO);
        return resultado;
    }

    private boolean deveCalcularSt(Map<String, Object> dadosNbm, 
            Map<String, Object> dadosMunicipio, ContextoTributario contexto) {
        
        String ufOrigem = contexto.getUfOrigem();
        String ufDestino = contexto.getUfDestino();
        boolean ehRevenda = contexto.isRevenda();

        if (ufOrigem == null || ufDestino == null) {
            return false;
        }

        if (ufOrigem.equals(ufDestino)) {
            return false;
        }

        if ("GO".equals(ufOrigem)) {
            BigDecimal baseTrib = getBigDecimalValue(dadosNbm, "BASE_TRIB");
            if (baseTrib != null && baseTrib.compareTo(new BigDecimal("100")) == 0) {
                return false;
            }
        }

        Integer calculaSt = getIntValue(dadosMunicipio, "CALCULAST_MUN");
        if (calculaSt == null || calculaSt != 1) {
            return false;
        }

        return ehRevenda;
    }

    private BigDecimal obterAliquotaIcms(Map<String, Object> dadosMunicipio,
            Map<String, Object> dadosEstado, Map<String, Object> dadosEmpresa,
            Map<String, Object> dadosOperacao,
            String ufOrigem, String ufDestino) {
        
        BigDecimal aliquotaIcm = getBigDecimalValue(dadosMunicipio, "ALIQICM_MUN");
        BigDecimal aliquotaIcmGer = getBigDecimalValue(dadosEmpresa, "ALIQICMS_GER");
        BigDecimal aliquotaInt = getBigDecimalValue(dadosMunicipio, "ALIQINT_MUN");
        BigDecimal aliquotaIcmOpe = getBigDecimalValue(dadosOperacao, "ICMS_OPE");
        
        if (aliquotaIcm == null) aliquotaIcm = ZERO;
        if (aliquotaIcmGer == null) aliquotaIcmGer = ZERO;
        if (aliquotaInt == null) aliquotaInt = ZERO;
        if (aliquotaIcmOpe == null) aliquotaIcmOpe = ZERO;

        if (ufOrigem.equals(ufDestino)) {
            return aliquotaIcmGer;
        }

        if (aliquotaIcmOpe.compareTo(ZERO) > 0) {
            return aliquotaIcmOpe;
        }

        Integer prot21 = getIntValue(dadosMunicipio, "PROT21_MUN");
        boolean naoContratado = getIntValue(dadosMunicipio, "NAOCONTR_MUN") == 1;

        if (prot21 == null || prot21 == 0 || naoContratado) {
            return aliquotaInt;
        }

        return aliquotaIcm;
    }

    private Map<String, Object> buscarDadosNbm(String ncm, Integer filial) {
        if (ncm == null || ncm.isEmpty()) return Map.of();
        try {
            String sql = """
                SELECT * FROM masnbm 
                WHERE filial_nbm = ? AND codigo_nbm = ?
                LIMIT 1
                """;
            return jdbcTemplate.queryForMap(sql, filial, ncm);
        } catch (Exception e) {
            log.warn("NBM não encontrado: NCM={}, Filial={}", ncm, filial);
            return Map.of();
        }
    }

    private Map<String, Object> buscarDadosTributacao(Integer codigoTributacao) {
        if (codigoTributacao == null) return Map.of();
        try {
            String sql = """
                SELECT * FROM mastrib 
                WHERE CODIGO_TRIB = ?
                LIMIT 1
                """;
            return jdbcTemplate.queryForMap(sql, codigoTributacao);
        } catch (Exception e) {
            log.warn("Tributação não encontrada: CODIGO_TRIB={}", codigoTributacao);
            return Map.of();
        }
    }

    private Map<String, Object> buscarDadosMunicipio(String uf) {
        if (uf == null || uf.isEmpty()) return Map.of();
        try {
            String sql = """
                SELECT * FROM munic 
                WHERE UPPER(sigla_mun) = UPPER(?)
                LIMIT 1
                """;
            return jdbcTemplate.queryForMap(sql, uf);
        } catch (Exception e) {
            log.warn("Município não encontrado: UF={}", uf);
            return Map.of();
        }
    }

    private Map<String, Object> buscarDadosEstado(String uf) {
        if (uf == null || uf.isEmpty()) return Map.of();
        try {
            String sql = """
                SELECT * FROM masest 
                WHERE UPPER(codigo_uf) = UPPER(?)
                LIMIT 1
                """;
            return jdbcTemplate.queryForMap(sql, uf);
        } catch (Exception e) {
            log.warn("Estado não encontrado: UF={}", uf);
            return Map.of();
        }
    }

    private Map<String, Object> buscarDadosEmpresa(Integer filial) {
        if (filial == null) filial = 1;
        try {
            String sql = """
                SELECT ALIQICMS_GER, FREDIVST_GER, EQUIPARADA_GER, ESTADO_GER
                FROM masger WHERE FILIAL_GER = ?
                """;
            return jdbcTemplate.queryForMap(sql, filial);
        } catch (Exception e) {
            log.warn("Empresa não encontrada para filial {}: {}", filial, e.getMessage());
            return Map.of();
        }
    }

    private Map<String, Object> buscarDadosGrupo(Integer grupoProduto) {
        if (grupoProduto == null) return Map.of();
        try {
            String sql = """
                SELECT * FROM masgru 
                WHERE codigo_gru = ?
                LIMIT 1
                """;
            return jdbcTemplate.queryForMap(sql, grupoProduto);
        } catch (Exception e) {
            log.warn("Grupo não encontrado: GRUPO={}", grupoProduto);
            return Map.of();
        }
    }

    private Map<String, Object> buscarDadosOperacao(Integer codigoOperacao) {
        if (codigoOperacao == null) return Map.of();
        try {
            String sql = """
                SELECT * FROM masope 
                WHERE CODIGO_OPE = ?
                LIMIT 1
                """;
            return jdbcTemplate.queryForMap(sql, codigoOperacao);
        } catch (Exception e) {
            log.warn("Operação não encontrada: CODIGO_OPE={}", codigoOperacao);
            return Map.of();
        }
    }

    private Integer getIntValue(Map<String, Object> dados, String campo) {
        if (dados == null || !dados.containsKey(campo)) return 0;
        Object valor = dados.get(campo);
        if (valor == null) return 0;
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
        if (dados == null || !dados.containsKey(campo)) return ZERO;
        Object valor = dados.get(campo);
        if (valor == null) return ZERO;
        if (valor instanceof BigDecimal) return (BigDecimal) valor;
        if (valor instanceof Number) return new BigDecimal(valor.toString());
        try {
            return new BigDecimal(valor.toString());
        } catch (NumberFormatException e) {
            return ZERO;
        }
    }

    public static class DadosTributacao {
        private BigDecimal baseIcms = ZERO;
        private BigDecimal aliquotaIcms = ZERO;
        private BigDecimal valorIcms = ZERO;
        private BigDecimal baseIcmsSt = ZERO;
        private BigDecimal valorIcmsSt = ZERO;
        private BigDecimal percentualSubstituicao = ZERO;
        private BigDecimal valorIpi = ZERO;
        private BigDecimal aliquotaIpi = ZERO;
        private BigDecimal baseIpi = ZERO;
        private BigDecimal precoTotalComImpostos = ZERO;
        private BigDecimal baseIva = ZERO;
        private boolean naoTributado = false;

        public BigDecimal getBaseIcms() { return baseIcms; }
        public void setBaseIcms(BigDecimal baseIcms) { this.baseIcms = baseIcms; }
        public BigDecimal getAliquotaIcms() { return aliquotaIcms; }
        public void setAliquotaIcms(BigDecimal aliquotaIcms) { this.aliquotaIcms = aliquotaIcms; }
        public BigDecimal getValorIcms() { return valorIcms; }
        public void setValorIcms(BigDecimal valorIcms) { this.valorIcms = valorIcms; }
        public BigDecimal getBaseIcmsSt() { return baseIcmsSt; }
        public void setBaseIcmsSt(BigDecimal baseIcmsSt) { this.baseIcmsSt = baseIcmsSt; }
        public BigDecimal getValorIcmsSt() { return valorIcmsSt; }
        public void setValorIcmsSt(BigDecimal valorIcmsSt) { this.valorIcmsSt = valorIcmsSt; }
        public BigDecimal getPercentualSubstituicao() { return percentualSubstituicao; }
        public void setPercentualSubstituicao(BigDecimal percentualSubstituicao) { this.percentualSubstituicao = percentualSubstituicao; }
        public BigDecimal getValorIpi() { return valorIpi; }
        public void setValorIpi(BigDecimal valorIpi) { this.valorIpi = valorIpi; }
        public BigDecimal getAliquotaIpi() { return aliquotaIpi; }
        public void setAliquotaIpi(BigDecimal aliquotaIpi) { this.aliquotaIpi = aliquotaIpi; }
        public BigDecimal getBaseIpi() { return baseIpi; }
        public void setBaseIpi(BigDecimal baseIpi) { this.baseIpi = baseIpi; }
        public BigDecimal getPrecoTotalComImpostos() { return precoTotalComImpostos; }
        public void setPrecoTotalComImpostos(BigDecimal precoTotalComImpostos) { this.precoTotalComImpostos = precoTotalComImpostos; }
        public BigDecimal getBaseIva() { return baseIva; }
        public void setBaseIva(BigDecimal baseIva) { this.baseIva = baseIva; }
        public boolean isNaoTributado() { return naoTributado; }
        public void setNaoTributado(boolean naoTributado) { this.naoTributado = naoTributado; }
    }

    public static class DadosSt {
        private BigDecimal baseSt = ZERO;
        private BigDecimal icmsSt = ZERO;
        private BigDecimal percentualSt = ZERO;
        private BigDecimal baseIva = ZERO;

        public BigDecimal getBaseSt() { return baseSt; }
        public void setBaseSt(BigDecimal baseSt) { this.baseSt = baseSt; }
        public BigDecimal getIcmsSt() { return icmsSt; }
        public void setIcmsSt(BigDecimal icmsSt) { this.icmsSt = icmsSt; }
        public BigDecimal getPercentualSt() { return percentualSt; }
        public void setPercentualSt(BigDecimal percentualSt) { this.percentualSt = percentualSt; }
        public BigDecimal getBaseIva() { return baseIva; }
        public void setBaseIva(BigDecimal baseIva) { this.baseIva = baseIva; }
    }

    public static class ItemTributavel {
        private BigDecimal precoTotal;
        private BigDecimal desconto;
        private String ncm;
        private Integer grupoProduto;

        public BigDecimal getPrecoTotal() { return precoTotal; }
        public void setPrecoTotal(BigDecimal precoTotal) { this.precoTotal = precoTotal; }
        public BigDecimal getDesconto() { return desconto != null ? desconto : ZERO; }
        public void setDesconto(BigDecimal desconto) { this.desconto = desconto; }
        public String getNcm() { return ncm; }
        public void setNcm(String ncm) { this.ncm = ncm; }
        public Integer getGrupoProduto() { return grupoProduto; }
        public void setGrupoProduto(Integer grupoProduto) { this.grupoProduto = grupoProduto; }
    }

    public static class ContextoTributario {
        private String ufOrigem;
        private String ufDestino;
        private boolean revenda;
        private Integer filial;
        private Integer codigoTributacao;
        private Integer codigoOperacao;
        private Integer contratoCliente;
        private BigDecimal cargaMediaCliente;
        private Integer optSimplesCliente;
        private Integer naoContratadoCliente;

        public String getUfOrigem() { return ufOrigem; }
        public void setUfOrigem(String ufOrigem) { this.ufOrigem = ufOrigem; }
        public String getUfDestino() { return ufDestino; }
        public void setUfDestino(String ufDestino) { this.ufDestino = ufDestino; }
        public boolean isRevenda() { return revenda; }
        public void setRevenda(boolean revenda) { this.revenda = revenda; }
        public Integer getFilial() { return filial; }
        public void setFilial(Integer filial) { this.filial = filial; }
        public Integer getCodigoTributacao() { return codigoTributacao; }
        public void setCodigoTributacao(Integer codigoTributacao) { this.codigoTributacao = codigoTributacao; }
        public Integer getCodigoOperacao() { return codigoOperacao; }
        public void setCodigoOperacao(Integer codigoOperacao) { this.codigoOperacao = codigoOperacao; }
        public Integer getContratoCliente() { return contratoCliente; }
        public void setContratoCliente(Integer contratoCliente) { this.contratoCliente = contratoCliente; }
        public BigDecimal getCargaMediaCliente() { return cargaMediaCliente; }
        public void setCargaMediaCliente(BigDecimal cargaMediaCliente) { this.cargaMediaCliente = cargaMediaCliente; }
        public Integer getOptSimplesCliente() { return optSimplesCliente; }
        public void setOptSimplesCliente(Integer optSimplesCliente) { this.optSimplesCliente = optSimplesCliente; }
        public Integer getNaoContratadoCliente() { return naoContratadoCliente; }
        public void setNaoContratadoCliente(Integer naoContratadoCliente) { this.naoContratadoCliente = naoContratadoCliente; }
    }
}
