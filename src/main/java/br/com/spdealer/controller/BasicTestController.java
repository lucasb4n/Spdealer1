package br.com.spdealer.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.stereotype.Controller;
import org.springframework.web.context.request.WebRequest;
import org.springframework.beans.factory.annotation.Autowired;
import br.com.spdealer.service.MenuPermissionService;
import br.com.spdealer.dto.MenuPermissionDTO;

@Controller
@RequestMapping("")
public class BasicTestController {

	@Autowired
	private MenuPermissionService menuPermissionService;

	// Endpoint de teste simples
	@GetMapping("/test")
	@ResponseBody
	public String simpleTest() {
		return "✅ Controller funcionando - " + System.currentTimeMillis();
	}

	// DESCONTINUADO: Endpoints Thymeleaf legados - usar /api/auth/login (JSON) em vez disso
	// BasicTestController é apenas para testes, não para autenticação de produção
	
	/*
	@GetMapping("/auth")
	public String showLoginForm() {
		return "login";
	}

	@PostMapping("/auth/login")
	public String processLogin(@RequestParam String username, @RequestParam String password, WebRequest request) {
		if ("admin".equals(username) && "admin".equals(password)) {
			request.setAttribute("loggedIn", true, WebRequest.SCOPE_SESSION);
			request.setAttribute("username", username, WebRequest.SCOPE_SESSION);
			request.setAttribute("name", "Administrador do Sistema", WebRequest.SCOPE_SESSION);
			request.setAttribute("role", "ADMIN", WebRequest.SCOPE_SESSION);
			request.setAttribute("loginTime", System.currentTimeMillis(), WebRequest.SCOPE_SESSION);
			return "redirect:/dashboard";
		} else {
			return "redirect:/auth?error=true";
		}
	}
	
	@GetMapping("/auth/login")
	public String loginGet() {
		return "login";
	}

	@GetMapping("/dashboard")
	public String dashboard(WebRequest request, org.springframework.ui.Model model) {
		Boolean loggedIn = (Boolean) request.getAttribute("loggedIn", WebRequest.SCOPE_SESSION);
		if (loggedIn == null || !loggedIn) {
			return "redirect:/auth";
		}
		String username = (String) request.getAttribute("username", WebRequest.SCOPE_SESSION);
		String name = (String) request.getAttribute("name", WebRequest.SCOPE_SESSION);
		String role = (String) request.getAttribute("role", WebRequest.SCOPE_SESSION);
		Long loginTime = (Long) request.getAttribute("loginTime", WebRequest.SCOPE_SESSION);
		String loginDate = (loginTime != null) ? new java.util.Date(loginTime).toString() : "-";
		model.addAttribute("usuario", username);
		model.addAttribute("nome", name);
		model.addAttribute("cargo", role);
		model.addAttribute("loginDate", loginDate);
		return "dashboard";
	}

	@GetMapping("/logout")
	public String logout(WebRequest request) {
		request.removeAttribute("loggedIn", WebRequest.SCOPE_SESSION);
		request.removeAttribute("username", WebRequest.SCOPE_SESSION);
		request.removeAttribute("name", WebRequest.SCOPE_SESSION);
		request.removeAttribute("role", WebRequest.SCOPE_SESSION);
		request.removeAttribute("loginTime", WebRequest.SCOPE_SESSION);
		return "redirect:/auth?logout=true";
	}
	*/

	// Endpoint REST para menu dinâmico
	@GetMapping("/api/menu")
	@ResponseBody
	public MenuPermissionDTO getMenu(WebRequest request) {
		Boolean loggedIn = (Boolean) request.getAttribute("loggedIn", WebRequest.SCOPE_SESSION);
		if (loggedIn == null || !loggedIn) {
			return null;
		}
		// Buscar id real do usuário logado se disponível
		Object usernameObj = request.getAttribute("username", WebRequest.SCOPE_SESSION);
		Long userId = 1L;
		if (usernameObj != null) {
			// Exemplo: buscar id do usuário pelo username
			if ("admin".equals(usernameObj)) userId = 1L;
			// TODO: Integrar com UserService para buscar id real
		}
		return menuPermissionService.getUserPermissions(userId);
	}

}
