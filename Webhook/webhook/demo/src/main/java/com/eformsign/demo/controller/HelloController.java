package com.eformsign.demo.controller;

import com.eformsign.demo.service.*;
import com.eformsign.demo.model.DocumentRequest;

import com.eformsign.demo.model.DocumentVersionOneReq;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Map;

@Controller
public class HelloController {

    private final DisplayDocumentService displayDocumentService;
    private final DisplayPdfService displayPdfService;

    public HelloController(DisplayDocumentService displayDocumentService, DisplayPdfService displayPdfService) {
        this.displayDocumentService = displayDocumentService;
        this.displayPdfService = displayPdfService;
    }

    @GetMapping("/display/v2/document")
    public String displayDocument(Model model) {
        DocumentRequest documentRequest = displayDocumentService.getDocumentRequest();
        Map<String, String> headers = displayDocumentService.getHeaders(); // 추가: 헤더 값 가져오기
        model.addAttribute("document", documentRequest);
        model.addAttribute("headers", headers); // 추가: 헤더 값을 모델에 추가
        return "display_document";
    }

    @GetMapping("/display/v1/document")
    public String displayDocumentVerOne(Model model) {
        DocumentVersionOneReq documentRequest = displayDocumentService.getDocumentVersionOneReq();
        Map<String, String> headers = displayDocumentService.getHeaders(); // 추가: 헤더 값 가져오기
        model.addAttribute("document", documentRequest);
        model.addAttribute("headers", headers); // 추가: 헤더 값을 모델에 추가
        return "display_document";
    }

    @GetMapping("/display/pdf")
    public String displayPdf(Model model) {
        DocumentRequest request = displayPdfService.getPdf();
        Map<String, String> headers = displayPdfService.getHeaders(); // 추가: 헤더 값 가져오기
        model.addAttribute("pdf", request);
        model.addAttribute("headers", headers);
        
        return "display_pdf";
    }

    @GetMapping("/")
    public String index() {
        return "index";
    }
}
