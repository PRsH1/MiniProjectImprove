package com.eformsign.demo.controller;

import com.eformsign.demo.model.DocumentRequest;
import com.eformsign.demo.model.DocumentVersionOneReq;
import com.eformsign.demo.service.DisplayDocumentService;
import com.eformsign.demo.service.DisplayPdfService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.Map;

@RestController
@Slf4j
public class DocumentController {

    private final DisplayDocumentService displayDocumentService;
    private final DisplayPdfService displayPdfService;

    public DocumentController(DisplayDocumentService displayDocumentService, DisplayPdfService displayPdfService) {
        this.displayDocumentService = displayDocumentService;
        this.displayPdfService = displayPdfService;
    }

    @PostMapping("/webhook/v2/document")
    public ResponseEntity<String> handleWebhookDocument(
            @RequestBody DocumentRequest documentRequest,
            @RequestHeader Map<String, String> headers) {
        log.info("Webhook API 호출");

        // Log header values
        headers.forEach((key, value) -> {
            log.info("Header '{}' = {}", key, value);
            System.out.println("Header '" + key + "' = " + value);
        });

        System.out.println("Received webhook ID: " + documentRequest.getWebhook_id());
        System.out.println("Received event type: " + documentRequest.getEvent_type());
        System.out.println("Received company ID: " + documentRequest.getCompany_id());
        System.out.println("Document ID: " + documentRequest.getDocument());
        

        // 분기 처리: event_type에 따라 다른 서비스 호출
        if ("document".equals(documentRequest.getEvent_type())) {
            displayDocumentService.setDocumentRequest(documentRequest);
            System.out.println("Handling document event type...");
        } else if ("ready_document_pdf".equals(documentRequest.getEvent_type())) {
            
            displayPdfService.setPdfRequest(documentRequest);
            
            System.out.println("Handling ready_document_pdf event type...");
        } else {
            System.out.println("Unhandled event type: " + documentRequest.getEvent_type());
        }

        displayDocumentService.setHeaders(headers); // 추가: 헤더 값 저장
        displayPdfService.setHeaders(headers);

        return new ResponseEntity<>("Webhook processed successfully. Headers: " + headers, HttpStatus.OK);
    }

    @PostMapping("/webhook/v1/document")
    public ResponseEntity<String> handleWebhookDocumentVerOne(
            @RequestBody DocumentVersionOneReq documentRequest,
            @RequestHeader Map<String, String> headers) {
        log.info("Webhook API 호출");

        // Log header values
        headers.forEach((key, value) -> {
            log.info("Header '{}' = {}", key, value);
            System.out.println("Header '" + key + "' = " + value);
        });

        System.out.println("Received webhook ID: " + documentRequest.getWebhook_id());
        System.out.println("Received event type: " + documentRequest.getEvent_type());
        System.out.println("Received company ID: " + documentRequest.getCompany_id());
        System.out.println("Document ID: " + (documentRequest.getDocument() != null ? documentRequest.getDocument().getId() : ""));

        // 분기 처리: event_type에 따라 다른 서비스 호출
        if ("document".equals(documentRequest.getEvent_type())) {
            displayDocumentService.setDocumentVersionOneReq(documentRequest);
        } else if ("ready_document_pdf".equals(documentRequest.getEvent_type())) {
           
            // displayPdfService.setPdfRequest(pdfRequest);
            
            System.out.println("Handling ready_document_pdf event type...");
        } else {
            System.out.println("Unhandled event type: " + documentRequest.getEvent_type());
        }

        displayDocumentService.setHeaders(headers); // 추가: 헤더 값 저장
        displayPdfService.setHeaders(headers);

        return new ResponseEntity<>("Webhook processed successfully. Headers: " + headers, HttpStatus.OK);
    }
}
