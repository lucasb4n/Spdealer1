package br.com.spdealer.controller.refatorado;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/refatorado/reparo")
public class ReparoController {

    @Autowired
    private JdbcTemplate jdbc;

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam(value = "codigo", required = false) String codigo,
            @RequestParam(value = "modelo", required = false) String modelo) {
        try {
            if (codigo != null && modelo != null) {
                String sql = "SELECT * FROM reparo WHERE rep_codigo = ? AND rep_modelo = ?";
                return jdbc.queryForList(sql, new Object[] { codigo.trim(), modelo.trim() });
            }
            // sem filtros: retornar algumas linhas (limit 200)
            String sql = "SELECT * FROM reparo LIMIT 200";
            return jdbc.queryForList(sql);
        } catch (Exception e) {
            // em caso de erro (tabela/coluna ausente) retornar lista vazia e logar
            System.err.println("[ReparoController.list] erro: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    @GetMapping("/importar-grupo")
    public List<Map<String, Object>> getImport(@RequestParam(value = "modelo") String modelo) {
        try {
            // Filtro solicitado: rep_modelo = modelo E rep_registro = '01'
            String sql = "SELECT * FROM reparo WHERE rep_modelo = ? AND rep_registro = '01' ORDER BY rep_descricao";
            return jdbc.queryForList(sql, new Object[] { modelo.trim() });
        } catch (Exception e) {
            System.err.println("[ReparoController.getImport] erro: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    @GetMapping("/itens-grupo")
    public List<Map<String, Object>> getItensGrupo(@RequestParam(value = "codigo") String codigo, 
                                                 @RequestParam(value = "modelo") String modelo) {
        try {
            System.out.println("[ReparoController] Buscando itens para Codigo: '" + codigo + "' e Modelo: '" + modelo + "'");
            
            // Query corrigida: O preço e estoque ficam na tabela KARDEX, não na ESTOQUE
            String sql = "SELECT r.*, e.descr_est as descricao, " +
                        "COALESCE(k.precopub_kar, k.precorep_kar, 0) as preco, " +
                        "COALESCE(k.qtde_kar, 0) as estoque_atual " +
                        "FROM reparo r " +
                        "LEFT JOIN estoque e ON (TRIM(r.rep_codprod) = TRIM(e.codprod_est) AND TRIM(r.rep_fab) = TRIM(e.fab_est)) " +
                        "LEFT JOIN kardex k ON (TRIM(k.codprod_kar) = TRIM(e.codprod_est) AND TRIM(k.fab_kar) = TRIM(e.fab_est) AND k.dep_kar = 1 AND k.registro_kar = '01') " +
                        "WHERE TRIM(r.rep_codigo) = ? AND TRIM(r.rep_modelo) = ? AND TRIM(r.rep_registro) = '02'";
            
            List<Map<String, Object>> results = jdbc.queryForList(sql, new Object[] { codigo.trim(), modelo.trim() });
            System.out.println("[ReparoController] Itens encontrados: " + (results != null ? results.size() : 0));
            
            return results;
        } catch (Exception e) {
            System.err.println("[ReparoController.getItensGrupo] erro: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @GetMapping("/descricao")
    public Object descricao(@RequestParam(value = "codigo", required = true) String codigo) {
        try {
            String sql = "SELECT rep_descricao FROM reparo WHERE rep_fab = ? OR rep_codigo = ? LIMIT 1";
            List<Map<String, Object>> rows = jdbc.queryForList(sql, new Object[] { codigo, codigo });
            if (rows != null && !rows.isEmpty()) {
                Object v = rows.get(0).get("rep_descricao");
                return java.util.Collections.singletonMap("descricao", v == null ? "" : v.toString());
            }
            return java.util.Collections.singletonMap("descricao", "");
        } catch (Exception e) {
            System.err.println("[ReparoController.descricao] erro: " + e.getMessage());
            return java.util.Collections.singletonMap("descricao", "");
        }
    }

    @PostMapping
    public Object create(@RequestBody Map<String, Object> body) {
        try {
            String codigo = body.getOrDefault("codigo", body.getOrDefault("rep_codigo", "")).toString();
            String modelo = body.getOrDefault("modelo", body.getOrDefault("rep_modelo", "")).toString();
            String tipo = body.getOrDefault("tipo", "").toString();
            String codigoProd = body.getOrDefault("codigo_prod", body.getOrDefault("rep_fab", "")).toString();
            String descr = body.getOrDefault("autoDesc", body.getOrDefault("descricao", body.getOrDefault("rep_descricao", body.getOrDefault("rep_descr", "")))).toString();
            String campo2 = body.getOrDefault("campo2", body.getOrDefault("rep_codprod", body.getOrDefault("rep_campo2", ""))).toString();
            // rep_qtde pode vir como number ou string (aceita decimais)
            Object qt = body.getOrDefault("rep_qtde", body.getOrDefault("qtde", 0));
            BigDecimal repQtde = BigDecimal.ZERO;
            try {
                if (qt instanceof Number) repQtde = new BigDecimal(((Number) qt).toString());
                else {
                    String s = qt == null ? "0" : qt.toString().trim();
                    // normalizar vírgula para ponto
                    s = s.replace(',', '.');
                    // se string estiver vazia, assume zero
                    if (s.length() == 0) s = "0";
                    repQtde = new BigDecimal(s);
                }
            } catch (Exception ex) {
                repQtde = BigDecimal.ZERO;
            }
            // definir escala padrão (4 casas decimais) e arredondar
            repQtde = repQtde.setScale(4, RoundingMode.HALF_UP);

            // preencher rep_registro (campo obrigatório no DB) com valor padrão '02' se não vier
            String repRegistro = body.getOrDefault("rep_registro", "02").toString();

            // normalizar rep_codigo para 5 dígitos: preencher com zeros à esquerda; se maior que 5, manter os 5 últimos
            String codigoRaw = codigo == null ? "" : codigo.toString().trim();
            String codigoFmt;
            try {
                int n = Integer.parseInt(codigoRaw);
                codigoFmt = String.format("%05d", n);
            } catch (Exception ex) {
                if (codigoRaw.length() > 5) codigoFmt = codigoRaw.substring(codigoRaw.length() - 5);
                else codigoFmt = String.format("%5s", codigoRaw).replace(' ', '0');
            }

            // Inserir usando a coluna rep_codprod para o campo 2; rep_qtde é DECIMAL
            String sql = "INSERT INTO reparo (rep_codigo, rep_modelo, rep_tipo, rep_fab, rep_descricao, rep_registro, rep_codprod, rep_qtde) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            jdbc.update(sql, new Object[] { codigoFmt, modelo, tipo, codigoProd, descr, repRegistro, campo2, repQtde });

            System.out.println("[ReparoController.create] salvo: codigo=" + codigoFmt + ", modelo=" + modelo + ", rep_registro=" + repRegistro + ", campo2=" + campo2 + ", rep_qtde=" + repQtde.toPlainString());

            return java.util.Collections.singletonMap("status", "ok");
        } catch (Exception e) {
            System.err.println("[ReparoController.create] erro: " + e.getMessage());
            return java.util.Collections.singletonMap("error", e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Object delete(@PathVariable("id") String id) {
        try {
            String sql = "DELETE FROM reparo WHERE rep_codigo = ? OR rep_fab = ? OR id = ?";
            int c = jdbc.update(sql, new Object[] { id, id, id });
            return java.util.Collections.singletonMap("deleted", c);
        } catch (Exception e) {
            System.err.println("[ReparoController.delete] erro: " + e.getMessage());
            return java.util.Collections.singletonMap("error", e.getMessage());
        }
    }

    @PostMapping("/log")
    public Object log(@RequestBody Map<String, Object> body) {
        try {
            // Log simples no servidor para auditoria/inspeção durante duplicação
            System.out.println("[ReparoController.log] " + java.time.OffsetDateTime.now().toString() + " - " + (body == null ? "null" : body.toString()));
            return java.util.Collections.singletonMap("status", "logged");
        } catch (Exception e) {
            System.err.println("[ReparoController.log] erro: " + e.getMessage());
            return java.util.Collections.singletonMap("error", e.getMessage());
        }
    }
}
