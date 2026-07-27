package br.com.spdealer.service;

import br.com.spdealer.formbuilder.dto.FilePayload;
import br.com.spdealer.formbuilder.dto.SaveFilesRequest;
import br.com.spdealer.formbuilder.dto.SaveFilesResponse;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Service
public class FormBuilderRefatoradoService {

    public SaveFilesResponse saveFiles(SaveFilesRequest request) {
        List<String> created = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        try {
            if (request == null || request.getFiles() == null) {
                return new SaveFilesResponse(false, created, "No files provided");
            }

            // Base directory: <projectRoot>/src/refatorado
            String projectRoot = System.getProperty("user.dir");
            Path base = Paths.get(projectRoot, "src", "refatorado").toAbsolutePath().normalize();
            if (!Files.exists(base)) {
                Files.createDirectories(base);
            }

            for (FilePayload fp : request.getFiles()) {
                String rel = fp.getPath();
                if (rel == null || rel.trim().isEmpty()) {
                    errors.add("empty-path");
                    continue;
                }

                // Resolve target inside base to prevent path traversal / absolute path writes
                Path target = base.resolve(rel).toAbsolutePath().normalize();
                if (!target.startsWith(base)) {
                    errors.add(rel + ": forbidden path");
                    continue;
                }

                try {
                    Path parent = target.getParent();
                    if (parent != null && !Files.exists(parent)) {
                        Files.createDirectories(parent);
                    }
                    Files.write(target, fp.getContent() == null ? new byte[0] : fp.getContent().getBytes(StandardCharsets.UTF_8));
                    created.add(base.relativize(target).toString().replace('\\', '/'));
                } catch (IOException ioe) {
                    errors.add(rel + ": " + ioe.getMessage());
                }
            }

            String errMsg = null;
            if (!errors.isEmpty()) {
                errMsg = String.join("; ", errors);
            }
            boolean success = !created.isEmpty();
            return new SaveFilesResponse(success, created, errMsg);
        } catch (IOException e) {
            return new SaveFilesResponse(false, created, e.getMessage());
        }
    }
}
