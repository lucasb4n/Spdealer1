package br.com.spdealer.controller;

import br.com.spdealer.formbuilder.dto.SaveFilesRequest;
import br.com.spdealer.formbuilder.dto.SaveFilesResponse;
import br.com.spdealer.service.FormBuilderRefatoradoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/formbuilder")
public class FormBuilderController {

    @Autowired
    private FormBuilderRefatoradoService refatoradoService;

    @PostMapping("/save-to-refatorado")
    public ResponseEntity<SaveFilesResponse> saveToRefatorado(@RequestBody SaveFilesRequest request) {
        try {
            SaveFilesResponse resp = refatoradoService.saveFiles(request);
            if (resp.isSuccess()) return ResponseEntity.ok(resp);
            return ResponseEntity.status(500).body(resp);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new SaveFilesResponse(false, null, e.getMessage()));
        }
    }
}
