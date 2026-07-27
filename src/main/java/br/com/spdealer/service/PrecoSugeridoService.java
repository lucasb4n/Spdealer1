package br.com.spdealer.service;

import br.com.spdealer.dto.PrecoSugeridoRequest;
import br.com.spdealer.dto.PrecoSugeridoResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

@Service
public class PrecoSugeridoService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public PrecoSugeridoResponse calcular(PrecoSugeridoRequest request) {
        PrecoSugeridoResponse resp = new PrecoSugeridoResponse();
        resp.setPrecoInformado(request.getPrecoInformado());
        resp.setUfDestino(request.getUfDestino());

        Integer dep = request.getDeposito() != null ? request.getDeposito() : 1;

        String sql = """
            SELECT
                COALESCE(k.precusto_kar, 0) AS precusto_kar,
                k.margem_kar,
                COALESCE(k.precopub_kar, 0) AS precopub_kar,
                k.tabela_kar,
                k.grupo_kar,
                k.fab_kar,
                COALESCE(e.catitem_est, 0) AS catitem_est,
                COALESCE(mf.margen_fab, 0) AS margen_fab,
                mf.forast_fab,
                COALESCE(mg.perc_gru, 0) AS perc_gru,
                mg.descr_gru
            FROM kardex k
            LEFT JOIN estoque e  ON e.fab_est = k.fab_kar AND e.codprod_est = k.codprod_kar
            LEFT JOIN masfab mf   ON mf.codigo_fab = k.fab_kar
            LEFT JOIN masgru mg   ON mg.codigo_gru = e.catitem_est
            WHERE k.fab_kar = ? AND k.codprod_kar = ? AND k.dep_kar = ? AND k.registro_kar = '01'
            """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql,
                request.getFab(), request.getCodigo(), dep.toString());

        if (rows.isEmpty()) {
            resp.setSuccess(false);
            resp.setMensagem("Produto não encontrado no kardex para o depósito informado.");
            return resp;
        }

        Map<String, Object> row = rows.get(0);

        BigDecimal custo = toBigDecimal(row.get("precusto_kar"));
        BigDecimal precopub_kar = toBigDecimal(row.get("precopub_kar"));
        String tabela = (String) row.get("tabela_kar");
        BigDecimal margemProduto = toBigDecimal(row.get("margem_kar"));
        BigDecimal margenFab = toBigDecimal(row.get("margen_fab"));
        BigDecimal percGru = toBigDecimal(row.get("perc_gru"));
        String descrGru = (String) row.get("descr_gru");
        String forastFab = (String) row.get("forast_fab");

        resp.setPrecoCusto(custo);
        resp.addDetalhe("Custo do Produto: " + formatCurrency(custo));

        BigDecimal margem;
        String origem;

        if (margemProduto.compareTo(BigDecimal.ZERO) > 0) {
            margem = margemProduto;
            origem = "Produto (kardex.margem_kar) = " + margem + "%";
            resp.addDetalhe("Margem do Produto (kardex.margem_kar): " + margem + "%");
        } else if (percGru.compareTo(BigDecimal.ZERO) > 0) {
            margem = percGru;
            origem = "Grupo (masgru.perc_gru) = " + margem + "%";
            resp.addDetalhe("Margem do Grupo (masgru.perc_gru \"" + descrGru + "\"): " + margem + "%");
            if (margenFab.compareTo(BigDecimal.ZERO) > 0) {
                resp.addDetalhe("  (ignorou masfab.margen_fab = " + margenFab + "% — grupo sobrescreve)");
            }
        } else {
            margem = margenFab;
            origem = "Fabricante (masfab.margen_fab) = " + margem + "%";
            resp.addDetalhe("Margem do Fabricante (masfab.margen_fab): " + margem + "%");
        }

        if ("N".equals(forastFab)) {
            String ufCli = request.getUfDestino();
            if (ufCli != null && !ufCli.isEmpty()) {
                String ufBase = buscarUfFilial();
                if (ufBase != null && !ufBase.equalsIgnoreCase(ufCli)) {
                    BigDecimal acrescimo = buscarAcrescimoUF(ufCli);
                    if (acrescimo.compareTo(BigDecimal.ZERO) > 0) {
                        margem = margem.add(acrescimo);
                        resp.setAcrescimoUF(acrescimo);
                        resp.addDetalhe("UF destino (" + ufCli + ") difere da base (" + ufBase + "): + acres_mun " + acrescimo + "%");
                        resp.addDetalhe("  Margem final com acréscimo: " + margem + "%");
                    }
                }
            }
        }

        resp.setMargemAplicada(margem);
        resp.setOrigemMargem(origem);

        BigDecimal precoSugerido;
        if ("1".equals(tabela)) {
            precoSugerido = precopub_kar;
            resp.setTipoPreco("TABELA");
            resp.addDetalhe("Item marcado como tabelado (tabela_kar = 1) → preço fixo de tabela: " + formatCurrency(precoSugerido));
        } else {
            precoSugerido = custo.multiply(BigDecimal.ONE.add(margem.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP)));
            precoSugerido = precoSugerido.setScale(2, RoundingMode.HALF_UP);
            resp.setTipoPreco("CALCULADO");
            resp.addDetalhe("Preço calculado: " + formatCurrency(custo) + " × (1 + " + margem + "/100) = " + formatCurrency(precoSugerido));
        }

        resp.setPrecoSugerido(precoSugerido);

        BigDecimal informado = request.getPrecoInformado() != null ? request.getPrecoInformado() : BigDecimal.ZERO;
        BigDecimal diferenca = precoSugerido.subtract(informado);
        resp.setDiferenca(diferenca);

        if (informado.compareTo(BigDecimal.ZERO) == 0) {
            resp.setAbaixo(false);
            resp.addDetalhe("Preço informado é zero — sem comparação.");
        } else if (informado.compareTo(precoSugerido) <= 0) {
            resp.setAbaixo(true);
            resp.addDetalhe(" ⚠ Preço informado (" + formatCurrency(informado) + ") está ABAIXO do sugerido.");
            resp.addDetalhe("    Diferença: " + formatCurrency(diferenca));
        } else {
            resp.setAbaixo(false);
            resp.addDetalhe("Preço informado (" + formatCurrency(informado) + ") está ACIMA do sugerido.");
            resp.addDetalhe("    Diferença: " + formatCurrency(diferenca.negate()));
        }

        return resp;
    }

    private String buscarUfFilial() {
        try {
            return jdbcTemplate.queryForObject(
                "SELECT estado_fil FROM filial WHERE id_fil = 1", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    private BigDecimal buscarAcrescimoUF(String uf) {
        try {
            BigDecimal val = jdbcTemplate.queryForObject(
                "SELECT COALESCE(MAX(acres_mun), 0) FROM municip WHERE sigla_mun = ?",
                BigDecimal.class, uf);
            return val != null ? val : BigDecimal.ZERO;
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal) return (BigDecimal) value;
        if (value instanceof Number) return BigDecimal.valueOf(((Number) value).doubleValue());
        try {
            return new BigDecimal(value.toString().replace(",", "."));
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private String formatCurrency(BigDecimal value) {
        return "R$ " + value.setScale(2, RoundingMode.HALF_UP).toString().replace(".", ",");
    }
}
