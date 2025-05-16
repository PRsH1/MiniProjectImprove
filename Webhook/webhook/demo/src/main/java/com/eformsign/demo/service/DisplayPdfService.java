package com.eformsign.demo.service;

import com.eformsign.demo.model.DocumentRequest;

import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class DisplayPdfService {

    private DocumentRequest request;
    private Map<String, String> headers; // 추가: 헤더 값을 저장할 필드

    public DocumentRequest getPdf() {
        return request;
    }

    public void setPdfRequest(DocumentRequest request) {
        this.request = request;
      
    }
    public Map<String, String> getHeaders() { // 추가: 헤더 값을 반환하는 메서드
        return headers;
    }
    public void setHeaders(Map<String, String> headers) { // 추가: 헤더 값을 설정하는 메서드
        this.headers = headers;
    }

}