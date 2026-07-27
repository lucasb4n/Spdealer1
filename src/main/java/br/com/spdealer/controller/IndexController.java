package br.com.spdealer.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class IndexController {

    @GetMapping("/")
    public String index() {
        return "forward:/index.html";
    }

    // Para lidar com rotas do React (SPA) e redirecionar para o index
    @GetMapping({"/login", "/dashboard", "/vendas/**", "/financeiro/**", "/configuracoes/**", "/cadastros/**", "/parametros/**", "/servico/**", "/demo/**", "/pecas/**", "/estoque/**"})
    public String forward() {
        return "forward:/index.html";
    }
}
