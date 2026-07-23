package br.com.spdealer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = { SecurityAutoConfiguration.class, UserDetailsServiceAutoConfiguration.class })
@EnableScheduling
@ComponentScan(basePackages = { "br.com.spdealer", "br.com.spdealer.nfe" })
@EntityScan(basePackages = { "br.com.spdealer.model", "br.com.spdealer.entity", "br.com.spdealer.refatorado",
        "br.com.spdealer.nfe.model" })
public class SpdealerApplication {



    public static void main(String[] args) {
        SpringApplication.run(SpdealerApplication.class, args);
    }
}