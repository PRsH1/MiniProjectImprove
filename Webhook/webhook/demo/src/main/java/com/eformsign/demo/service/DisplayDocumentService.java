package com.eformsign.demo.service;

import com.eformsign.demo.model.DocumentRequest;
import com.eformsign.demo.model.DocumentVersionOneReq;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class DisplayDocumentService {

    private DocumentRequest documentRequest;
    private DocumentVersionOneReq documentVersionOneReq;
    private Map<String, String> headers; // 추가: 헤더 값을 저장할 필드

    public DocumentRequest getDocumentRequest() {
        return documentRequest;
    }
    
    public DocumentVersionOneReq getDocumentVersionOneReq() {
        return documentVersionOneReq;
    }

    public Map<String, String> getHeaders() { // 추가: 헤더 값을 반환하는 메서드
        return headers;
    }

    public void setDocumentRequest(DocumentRequest documentRequest) {
        this.documentRequest = documentRequest;
    }

    public void setDocumentVersionOneReq(DocumentVersionOneReq documentVersionOneReq) {
        this.documentVersionOneReq = documentVersionOneReq;
    }

    public void setHeaders(Map<String, String> headers) { // 추가: 헤더 값을 설정하는 메서드
        this.headers = headers;
    }
}
