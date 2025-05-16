package com.eformsign.demo.model;

import lombok.Data;
import java.util.List;



@Data
public class DocumentRequest {
    private String webhook_id;
    private String webhook_name;
    private String company_id;
    private String event_type;
    private Document document;
    private ReadyDocumentPdf ready_document_pdf;

    @Data
    public static class Document {
        private String id;
        private String document_title;
        private String template_id;
        private String template_name;
        private int workflow_seq;
        private String workflow_name;
        private String template_version;
        private String history_id;
        private String status;
        private String editor_id;
        private String outside_token;
        private long updated_date;
        private String mass_job_request_id;
        private String comment;
    }
    @Data
    public static class ReadyDocumentPdf {
        private String document_id;
        private String document_title;
        private int workflow_seq;
        private String workflow_name;
        private String template_id;
        private String template_name;
        private String template_version;
        private String document_status;
        private String document_history_id;
        private List<String> export_ready_list;
        private String mass_job_request_id;
    }
}
