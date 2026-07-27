package br.com.spdealer.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {
    // Forward non-API and non-static requests to index.html for SPA routing.
    // Exclude paths that contain a dot (files with extensions) to allow static assets
    // such as manifest.json, favicon.ico, *.js, *.css to be served normally.
    @RequestMapping(value = "/{path:^(?!api|static|index\\.html|.*\\..*).*$}")
    public String redirect() {
        return "forward:/index.html";
    }
}
