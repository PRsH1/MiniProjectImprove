package com.eformsign.demo.model;


import lombok.Data;

@Data
public class DocumentVersionOneReq {
    private String webhook_id;
    private String webhook_name;
    private String company_id;
    private String event_type;
    private Document document;

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
}
