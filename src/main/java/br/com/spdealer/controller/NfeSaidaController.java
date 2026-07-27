package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/financeiro")
public class NfeSaidaController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Lista cabeçalhos de notas entre duas datas (inclusive)
    @GetMapping("/nfe_saida")
    public List<Map<String, Object>> listNfeSaida(@RequestParam("dataini") String dataini,
                                                   @RequestParam("datafim") String datafim,
                                                   HttpSession session) {
        // obter filial da sessao
        Object idFilObj = session.getAttribute("id_fil");
        String filial = idFilObj != null ? String.valueOf(idFilObj) : null;

        String sql = "SELECT n.filial_not AS filial, n.emissaoi_not AS DtEmissao, n.serie_not AS Serie, n.numero_not AS Numero, n.cgccpf_not AS Dpcumento, n.nome_not AS Cliente, n.dpto_not AS Dpto, m.descr_paga AS CondPgto, n.vendedor_not AS Vend, n.vlrmerc_not AS VlrMerc, n.vlrdesc_not AS Desconto, n.vlrnot_not AS VlrNota, n.tipo_not, n.condpag_not " +
                "FROM notascab n " +
                "LEFT JOIN maspag m ON m.filial_paga = ? AND LPAD(n.condpag_not,3,'0') = m.codigo_paga " +
                "WHERE n.emissaoi_not BETWEEN ? AND ? " +
                "ORDER BY n.emissaoi_not, n.serie_not, n.numero_not";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, new Object[]{filial, dataini, datafim});

        // mascarar documento (CNPJ/CPF)
        for (Map<String, Object> r : rows) {
            Object doc = r.get("Dpcumento");
            r.put("Dpcumento", maskDocumento(doc != null ? String.valueOf(doc) : null));
        }
        return rows;
    }

    private String maskDocumento(String raw) {
        if (raw == null) return "";
        String digits = raw.replaceAll("\\D", "");
        if (digits.length() == 11) {
            // CPF -> 000.***.***-00
            String a = digits.substring(0,3);
            String b = digits.substring(9);
            return a + "******" + b;
        } else if (digits.length() == 14) {
            // CNPJ -> 00.***.***/0001-00
            String a = digits.substring(0,2);
            String b = digits.substring(12);
            return a + "********" + b;
        }
        if (raw.length() <= 6) return raw;
        return raw.substring(0,3) + "****" + raw.substring(raw.length()-3);
    }

    @GetMapping("/nfe_saida/items")
    public List<Map<String, Object>> listNfeItems(@RequestParam("filial") String filial,
                                                   @RequestParam("emissaoi") String emissaoi,
                                                   @RequestParam("tipo") String tipo,
                                                   @RequestParam("serie") String serie,
                                                   @RequestParam("numero") String numero) {
        String sql = "SELECT d.fab_not AS Categoria, d.produto_not AS Produto, d.descprod_not AS Descricao, d.quant_not AS Qtde, d.devol_not AS Devolvido, d.valoruni_not AS VlrUni, d.desconto_not AS Desconto, d.vlrfret_not AS frete, d.valortot_not AS VlrTotal " +
                "FROM notasdet d " +
                "WHERE d.filial_not = ? AND d.emissaoi_not = ? AND d.tipo_not = ? AND d.serie_not = ? AND d.numero_not = ?";

        return jdbcTemplate.queryForList(sql, new Object[]{filial, emissaoi, tipo, serie, numero});
    }
}
