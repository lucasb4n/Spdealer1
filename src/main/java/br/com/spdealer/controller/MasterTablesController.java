package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;
import br.com.spdealer.util.SessionHelper;

import java.util.List;
import java.util.Map;

/**
 * Controller para fornecer dados das tabelas mestre (master data)
 * Tabelas: masdoc, masdep, mascob, maspag
 */
@RestController
@RequestMapping("/api")
public class MasterTablesController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * GET /api/masdoc - Retorna tipos de documento
     * Tabela: masdoc
     * Campos: codigo_doc (PK), descr_doc
     */
    @GetMapping("/masdoc")
    public List<Map<String, Object>> getTiposDocumento() {
        String sql = "SELECT codigo_doc as codigo, descr_doc as descricao FROM masdoc ORDER BY descr_doc";
        return jdbcTemplate.queryForList(sql);
    }

    /**
     * GET /api/masdep - Retorna departamentos
     * Tabela: masdep
     * Campos: codigo_dep (PK), descr_dep, filial_dep
     */
    @GetMapping("/masdep")
    public List<Map<String, Object>> getDepartamentos(HttpSession session) {
        Integer idFil = SessionHelper.getIdFilFromSessionOrDefault(session, 1);
        String filial = String.format("%03d", idFil);
        String sql = "SELECT codigo_dep as codigo, descr_dep as descricao FROM masdep WHERE filial_dep = ? ORDER BY descr_dep";
        return jdbcTemplate.queryForList(sql, new Object[]{filial});
    }

    /**
     * GET /api/mascob - Retorna tipos de cobrança
     * Tabela: mascob
     * Campos: codigo_cob (PK), descr_cob
     */
    @GetMapping("/mascob")
    public List<Map<String, Object>> getTiposCobranca() {
        String sql = "SELECT codigo_cob as codigo, descr_cob as descricao FROM mascob ORDER BY descr_cob";
        return jdbcTemplate.queryForList(sql);
    }

    /**
     * GET /api/maspag - Retorna condições de pagamento
     * Tabela: maspag
     * Campos: codigo_paga (PK), descr_paga, filial_paga
     */
    @GetMapping("/maspag")
    public List<Map<String, Object>> getCondicoesPagamento() {
        String sql = "SELECT codigo_paga as codigo, descr_paga as descricao, nivel_paga FROM maspag WHERE filial_paga = '001' ORDER BY descr_paga";
        return jdbcTemplate.queryForList(sql);
    }
    
    /**
     * NOTA: GET /api/bancos foi movido para BancosController (controller dedicado)
     * Para listar bancos, use BancosController.listarBancos()
     */
    
    /**
     * GET /api/masdocp - Retorna tipos de documento para PAGAR
     * Tabela: masdocp (specific to pagar)
     * Campos: codigo_docp (PK), descr_docp
     */
    @GetMapping("/masdocp")
    public List<Map<String, Object>> getTiposDocumentoPagar() {
        String sql = "SELECT codigo_docp as codigo, descr_docp as descricao FROM masdocp ORDER BY descr_docp";
        return jdbcTemplate.queryForList(sql);
    }
    
    /**
     * GET /api/mascobp - Retorna tipos de cobrança para PAGAR
     * Tabela: mascobp (specific to pagar)
     * Campos: codigo_cobp (PK), descr_cobp
     */
    @GetMapping("/mascobp")
    public List<Map<String, Object>> getTiposCobrancaPagar() {
        String sql = "SELECT codigo_cobp as codigo, descr_cobp as descricao FROM mascobp ORDER BY descr_cobp";
        return jdbcTemplate.queryForList(sql);
    }
}
