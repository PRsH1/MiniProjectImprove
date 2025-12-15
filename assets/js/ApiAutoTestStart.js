window.onload = function() {
    renderApiList();
};

function renderApiList() {
    const apiData = [
        { code: "OPA 003", method: "GET", name: "문서 정보 조회" },
        { code: "OPA 004", method: "GET", name: "문서 파일 다운로드" },
        { code: "OPA 005", method: "POST", name: "새 문서 작성 (내부)" },
        { code: "OPA 006", method: "GET", name: "문서 첨부 파일 다운로드" },
        { code: "OPA 007", method: "POST", name: "새 문서 작성 (외부)" },
        { code: "OPA 008", method: "POST", name: "문서 목록 조회" },
        { code: "OPA 009", method: "DELETE", name: "문서 삭제" },
        { code: "OPA 010", method: "GET", name: "멤버 목록 조회" },
        { code: "OPA 011", method: "POST", name: "멤버 추가" },
        { code: "OPA 012", method: "PATCH", name: "멤버 수정" },
        { code: "OPA 013", method: "DELETE", name: "멤버 삭제" },
        { code: "OPA 014", method: "POST", name: "수신자 문서 재요청" },
        { code: "OPA 015", method: "GET", name: "작성 가능한 템플릿 목록" },
        { code: "OPA 016", method: "POST", name: "문서 일괄 작성" },
        { code: "OPA 017", method: "GET", name: "그룹 목록 조회" },
        { code: "OPA 018", method: "POST", name: "그룹 추가" },
        { code: "OPA 019", method: "PATCH", name: "그룹 수정" },
        { code: "OPA 020", method: "DELETE", name: "그룹 삭제" },
        { code: "OPA 021", method: "POST", name: "문서 일괄 작성 (멀티)" },
        { code: "OPA 022", method: "GET", name: "회사 도장 목록 조회" },
        { code: "OPA 023", method: "GET", name: "회사 도장 정보 조회" },
        { code: "OPA 030", method: "POST", name: "멤버 일괄 추가" },
        { code: "OPA 037", method: "POST", name: "일괄 완료 문서 PDF 전송" },
        { code: "OPA 040", method: "POST", name: "문서 파일 일괄 다운로드" },
        { code: "OPA 042", method: "POST", name: "문서 취소" },
        // [NEW] OPA 045 Added
        { code: "OPA 045", method: "POST", name: "완료 토큰 기한 연장" }
    ].sort((a, b) => a.code.localeCompare(b.code));

    const container = document.getElementById('apiListContainer');
    let html = "";
    
    apiData.forEach(api => {
        let badgeClass = "bg-secondary";
        if(api.method === "GET") badgeClass = "bg-primary";
        else if(api.method === "POST") badgeClass = "bg-success";
        else if(api.method === "PATCH") badgeClass = "bg-warning text-dark";
        else if(api.method === "DELETE") badgeClass = "bg-danger";

        html += `
            <div class="col-md-4 col-sm-6">
                <div class="opa-badge">
                    <span class="badge ${badgeClass} method-badge">${api.method}</span>
                    <div>
                        <span class="opa-code">${api.code}</span>
                        <span class="opa-name">${api.name}</span>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// [UI Helper]
function addFieldRow(containerId = 'fieldsContainer') {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = 'field-row row g-2 align-items-center';
    div.innerHTML = `
        <div class="col-5"><input type="text" class="form-control form-control-sm field-id" placeholder="ID"></div>
        <div class="col-6"><input type="text" class="form-control form-control-sm field-value" placeholder="Value"></div>
        <div class="col-1 text-center"><button class="btn btn-sm btn-close" onclick="this.closest('.field-row').remove()"></button></div>
    `;
    container.appendChild(div);
}

function getFieldsArray(containerId = 'fieldsContainer') {
    const container = document.getElementById(containerId);
    if (!container) return [];
    const rows = container.querySelectorAll('.field-row');
    const fields = [];
    rows.forEach(row => {
        const id = row.querySelector('.field-id').value;
        const value = row.querySelector('.field-value').value;
        if(id) fields.push({ "id": id, "value": value });
    });
    return fields;
}

// [Logic] 데이터 수집
const getDynamicData = () => {
    return {
        email: document.getElementById('targetEmail').value,
        name: document.getElementById('targetName').value,
        phone: document.getElementById('targetPhone').value,
        templateId: document.getElementById('targetTemplateId').value,
        companyId: document.getElementById('companyId').value,
        extTemplateId: document.getElementById('extTemplateId').value,
        companyApiKey: document.getElementById('companyApiKey').value,
        downloadDocId: document.getElementById('downloadDocId').value,
        attachDocId: document.getElementById('attachDocId').value,
        memberId: document.getElementById('memberId').value,
        templateId2: document.getElementById('targetTemplateId2').value,
        email2: document.getElementById('targetEmail2').value,
        name2: document.getElementById('targetName2').value,
        phone2: document.getElementById('targetPhone2').value,
        pdfName: document.getElementById('pdfTargetName').value,
        pdfEmail: document.getElementById('pdfTargetEmail').value,
        pdfPhone: document.getElementById('pdfTargetPhone').value
    };
};

// [Refactoring] 문서 내부 데이터 생성
const getInnerDocumentData = (email, name, phone, fieldsArr) => {
    let recipientsList = [];
    const hasRecipientInfo = (email && email.trim() !== "") || (name && name.trim() !== "") || (phone && phone.trim() !== "");
    if (hasRecipientInfo) {
        recipientsList.push({
            "step_type": "05", "use_mail": true, "use_sms": true,
            "member": { "id": email, "name": name, "sms": { "country_code": "82", "phone_number": phone } },
            "auth": { "password": "", "valid": { "day": 0, "hour": 0 } }
        });
    }
    return { "fields": fieldsArr, "recipients": recipientsList, "parameters": [], "notification": [] };
};

const generateDocumentBody = () => {
    const data = getDynamicData();
    const commonFields = getFieldsArray('fieldsContainer');
    return { "document": getInnerDocumentData(data.email, data.name, data.phone, commonFields) };
};

const generateMassDocumentBody = () => {
    const data = getDynamicData();
    const commonFields = getFieldsArray('fieldsContainer');
    const innerData = getInnerDocumentData(data.email, data.name, data.phone, commonFields);
    return { "documents": [ { ...innerData, "select_group_name": "" }, { ...innerData, "select_group_name": "" } ] };
};

const generateMassMultiDocumentBody = () => {
    const data = getDynamicData();
    const doc1Fields = getFieldsArray('fieldsContainer');
    const doc1 = { "template_id": data.templateId, ...getInnerDocumentData(data.email, data.name, data.phone, doc1Fields) };
    const doc2Fields = getFieldsArray('fieldsContainer2');
    const doc2 = { "template_id": data.templateId2, ...getInnerDocumentData(data.email2, data.name2, data.phone2, doc2Fields) };
    const docs = [doc1];
    if(data.templateId2) docs.push(doc2);
    return { "documents": docs };
};

const generateBulkMemberBody = () => {
    const data = getDynamicData();
    if(!data.memberId) throw new Error("멤버 ID가 필요합니다.");
    const bulkId1 = `bulk1_${data.memberId}`;
    const bulkId2 = `bulk2_${data.memberId}`;
    sharedData.bulkMemberIds = [bulkId1, bulkId2];
    return [
        { "id": bulkId1, "password": "forcs1321!@", "name": "김테스트", "contact": { "tel": "0233334444", "number": "01022223333", "country_number": "+82" }, "department": "연구소", "position": "연구원", "role": ["template_manager"] },
        { "id": bulkId2, "password": "forcs1321!@", "name": "유테스트", "contact": { "tel": "0312223333", "number": "01023456789", "country_number": "+82" }, "department": "경영기획실", "position": "사원", "role": ["template_manager"] }
    ];
};

const generateSendPdfBody = () => {
    const data = getDynamicData();
    
    if(!sharedData.completedDocIds || sharedData.completedDocIds.length === 0) throw new Error("완료된 문서(003)가 없어 PDF를 전송할 수 없습니다. (OPA 008 확인 필요)");
    if(!data.companyId) throw new Error("Company ID가 필요합니다 (URL 파라미터용).");

    const targetIds = sharedData.completedDocIds.slice(0, 2); 
    const sendPdfs = [];

    targetIds.forEach((docId, index) => {
        const pdfInfos = [];
        if (index === 0 && data.pdfEmail) {
            pdfInfos.push({ "name": data.pdfName || "수신자", "method": "email", "method_info": data.pdfEmail, "sms_option": {} });
        } else if (index === 1 && data.pdfPhone) {
            pdfInfos.push({ "name": data.pdfName || "수신자", "method": "sms", "method_info": data.pdfPhone, "code": "+82", "sms_option": {} });
        }
        if (pdfInfos.length > 0) {
            sendPdfs.push({ "document_id": docId, "pdf_send_infos": pdfInfos });
        }
    });

    if (sendPdfs.length === 0) throw new Error("SKIP_OPA037");
    return { "input": { "send_pdfs": sendPdfs } };
};

const generateMultiDownloadBody = () => {
    if(!sharedData.completedDocIds || sharedData.completedDocIds.length === 0) {
        throw new Error("완료된 문서가 없어 다운로드할 수 없습니다. (OPA 008 선행 필수)");
    }
    const targetIds = sharedData.completedDocIds.slice(0, 2);
    return {
        "document_ids": targetIds,
        "file_type": ["document", "audit_trail"]
    };
};

const generateReRequestBody = () => {
    const data = getDynamicData();
    if (!data.email && !data.name && !data.phone) return null;
    return { "input": { "next_steps": [{ "step_type": "05", "step_seq": "2", "recipients": [{ "member": { "name": data.name, "id": data.email, "sms": { "country_code": "+82", "phone_number": data.phone } }, "use_mail": true, "use_sms": true }], "comment": "재요청 API 테스트입니다." }] } };
};
const generateListBody = () => { return { "type": "04", "title_and_content": "", "title": "", "content": "", "limit": "100", "skip": "0" }; };

// [Store]
let sharedData = {
    lastCreatedId: null,
    createdIdList: [],
    createdGroupId: null,
    companyStampId: null,
    bulkMemberIds: [],
    completedDocIds: []
};

// [TEST LIST]
const testList = [
    // 1. OPA 005
    {
        name: "새 문서 작성 (OPA 005 - 내부)",
        method: "POST",
        path: () => {
            const data = getDynamicData();
            if (!data.templateId) throw new Error("내부용 Template ID 누락");
            return `/v2.0/api/documents?template_id=${data.templateId}`;
        },
        body: generateDocumentBody,
        expectedStatus: 200,
        afterRequest: (json) => {
            if (json && json.document && json.document.id) {
                sharedData.lastCreatedId = json.document.id;
                sharedData.createdIdList.push(json.document.id);
            }
        }
    },
    // 2. OPA 003 Basic
    {
        name: "문서 정보 조회 - 기본 (OPA 003)",
        method: "GET",
        path: () => {
            if (!sharedData.lastCreatedId) throw new Error("작성된 문서 없음");
            return `/v2.0/api/documents/${sharedData.lastCreatedId}`;
        },
        body: null,
        expectedStatus: 200
    },
    // 3. OPA 003 Detail
    {
        name: "문서 정보 조회 - 상세 (OPA 003)",
        method: "GET",
        path: () => {
            if (!sharedData.lastCreatedId) throw new Error("작성된 문서 없음");
            return `/v2.0/api/documents/${sharedData.lastCreatedId}?include_fields=true&include_histories=true&include_previous_status=true&include_next_status=true&include_external_token=true&include_detail_template_info=true`;
        },
        body: null,
        expectedStatus: 200
    },
    // 4. OPA 004
    {
        name: "문서 파일 다운로드 (OPA 004)",
        method: "GET",
        path: () => {
            const data = getDynamicData();
            if (!data.downloadDocId) throw new Error("다운로드용 ID 누락");
            return `/v2.0/api/documents/${data.downloadDocId}/download_files?file_type=document,audit_trail`;
        },
        body: null,
        expectedStatus: 200
    },
    // 5. OPA 006
    {
        name: "문서 첨부 파일 다운로드 (OPA 006)",
        method: "GET",
        path: () => {
            const data = getDynamicData();
            if (!data.attachDocId) throw new Error("첨부파일용 ID 누락");
            return `/v2.0/api/documents/${data.attachDocId}/download_attach_files`;
        },
        body: null,
        expectedStatus: 200
    },
    // 6. OPA 014
    {
        name: "수신자 문서 재요청 (OPA 014)",
        method: "POST",
        path: () => {
            if (!sharedData.lastCreatedId) throw new Error("앞서 생성된 문서가 없어 재요청 불가");
            return `/v2.0/api/documents/${sharedData.lastCreatedId}/re_request_outsider`;
        },
        body: generateReRequestBody,
        expectedStatus: 200
    },
    // 7. OPA 007
    {
        name: "새 문서 작성 (OPA 007 - 외부)",
        method: "POST",
        path: () => {
            const data = getDynamicData();
            if (!data.companyId || !data.extTemplateId) throw new Error("외부용 필수값 누락");
            return `/v2.0/api/documents/external?company_id=${data.companyId}&template_id=${data.extTemplateId}`;
        },
        headers: () => {
            const data = getDynamicData();
            if (!data.companyApiKey) throw new Error("API Key 누락");
            return { "Authorization": `Bearer ${btoa(data.companyApiKey)}` };
        },
        body: generateDocumentBody,
        expectedStatus: 200,
        afterRequest: (json) => {
            if (json && json.document && json.document.id) {
                sharedData.lastCreatedId = json.document.id;
                sharedData.createdIdList.push(json.document.id);
            }
        }
    },
    // 8. OPA 008 Basic (Data Prep)
    {
        name: "문서 목록 조회 - 기본 (OPA 008)",
        method: "POST",
        path: "/v2.0/api/list_document",
        body: generateListBody,
        expectedStatus: 200,
        afterRequest: (json) => {
            if (json && json.documents && Array.isArray(json.documents)) {
                // 완료된 문서(003) 수집 for OPA 037, 040, 045
                const completedDocs = json.documents.filter(doc => doc.current_status && doc.current_status.status_type === '003');
                sharedData.completedDocIds = completedDocs.map(doc => doc.id);
                console.log(`[OPA 008] Collected ${sharedData.completedDocIds.length} completed docs.`);
            }
        }
    },
    // 9. OPA 008 Detail
    {
        name: "문서 목록 조회 - 상세 (OPA 008)",
        method: "POST",
        path: "/v2.0/api/list_document?include_fields=true&include_histories=true&include_previous_status=true&include_next_status=true&include_external_token=true&include_detail_template_info=true",
        body: generateListBody,
        expectedStatus: 200
    },
    // 10. OPA 015
    {
        name: "작성 가능한 템플릿 목록 조회 (OPA 015)",
        method: "GET",
        path: "/v2.0/api/forms",
        body: null,
        expectedStatus: 200
    },
    // 11. OPA 016 Mass Create
    {
        name: "문서 일괄 작성 (OPA 016)",
        method: "POST",
        path: () => {
            const data = getDynamicData();
            if (!data.templateId) throw new Error("내부용 Template ID 누락");
            return `/v2.0/api/forms/mass_documents?template_id=${data.templateId}`;
        },
        body: generateMassDocumentBody,
        expectedStatus: 200,
        afterRequest: (json) => {
            if (json && json.documents && Array.isArray(json.documents)) {
                json.documents.forEach(doc => {
                    if (doc.id) sharedData.createdIdList.push(doc.id);
                });
                console.log(`[OPA 016] ${json.documents.length} created IDs added to cleanup list.`);
            }
        }
    },
    // 12. OPA 021 Multi-Mass Create
    {
        name: "문서 일괄 작성 - 멀티 템플릿 (OPA 021)",
        method: "POST",
        path: "/v2.0/api/forms/mass_multi_documents",
        body: generateMassMultiDocumentBody,
        expectedStatus: 200,
        afterRequest: (json) => {
            if (json && json.documents && Array.isArray(json.documents)) {
                json.documents.forEach(doc => {
                    if (doc.id) sharedData.createdIdList.push(doc.id);
                });
                console.log(`[OPA 021] ${json.documents.length} created IDs added to cleanup list.`);
            }
        }
    },
    // 13. OPA 029
    {
        name: "회사 도장 목록 조회 (OPA 029)",
        method: "GET",
        path: "/v2.0/api/company_stamp",
        body: null,
        expectedStatus: 200,
        afterRequest: (json) => {
            if (json && json.company_stamps && json.company_stamps.length > 0) {
                sharedData.companyStampId = json.company_stamps[0].id;
                console.log("Captured Stamp ID:", sharedData.companyStampId);
            }
        }
    },
    // 14. OPA 025
    {
        name: "회사 도장 정보 조회 (OPA 025)",
        method: "GET",
        path: () => {
            if (!sharedData.companyStampId) throw new Error("조회할 도장 ID가 없습니다.");
            return `/v2.0/api/company_stamp/${sharedData.companyStampId}`;
        },
        body: null,
        expectedStatus: 200
    },
    // 15. Member Create (OPA 011)
    {
        name: "멤버 추가 (OPA 011)",
        method: "POST",
        path: "/v2.0/api/members?mailOption=false",
        body: () => {
            const data = getDynamicData();
            if (!data.memberId) throw new Error("멤버 ID를 입력해주세요.");
            return {
                "account": {
                    "id": data.memberId,
                    "password": "forcs0421!@",
                    "first_name": "테스터",
                    "external_sso_info": { "uuid": "123", "account_id": "test" }
                }
            };
        },
        expectedStatus: 200
    },
    // 16. Member List (OPA 010)
    {
        name: "멤버 목록 조회 (OPA 010)",
        method: "GET",
        path: "/v2.0/api/members",
        body: null,
        expectedStatus: 200
    },
    // 17. Member Update (OPA 012)
    {
        name: "멤버 수정 (OPA 012)",
        method: "PATCH",
        path: () => {
            const data = getDynamicData();
            if (!data.memberId) throw new Error("멤버 ID 누락");
            return `/v2.0/api/members/${data.memberId}`;
        },
        body: () => {
            const data = getDynamicData();
            return {
                "account": {
                    "id": data.memberId,
                    "name": "테스터수정",
                    "enabled": true,
                    "contact": { "number": "010-1111-1111", "tel": "010-1234-5678" },
                    "department": "연구소",
                    "position": "전임연구원",
                    "role": ["template_manager"]
                }
            };
        },
        expectedStatus: 200
    },
    // 18. Member Delete (OPA 013)
    {
        name: "멤버 삭제 (OPA 013)",
        method: "DELETE",
        path: () => {
            const data = getDynamicData();
            if (!data.memberId) throw new Error("멤버 ID 누락");
            return `/v2.0/api/members/${data.memberId}`;
        },
        body: null,
        expectedStatus: 200
    },
    // 19. Group List (OPA 017)
    {
        name: "그룹 목록 조회 (OPA 017)",
        method: "GET",
        path: "/v2.0/api/groups",
        body: null,
        expectedStatus: 200
    },
    // 20. Group Create (OPA 018)
    {
        name: "그룹 추가 (OPA 018)",
        method: "POST",
        path: "/v2.0/api/groups",
        body: () => {
            const data = getDynamicData();
            if (!data.memberId) throw new Error("멤버 ID 누락");
            return {
                "group": {
                    "name": "테스트그룹",
                    "description": "클라우드팀",
                    "members": [data.memberId]
                }
            };
        },
        expectedStatus: 200,
        afterRequest: (json) => {
            if (json && json.group && json.group.id) {
                sharedData.createdGroupId = json.group.id;
            }
        }
    },
    // 21. Group Update (OPA 019)
    {
        name: "그룹 수정 (OPA 019)",
        method: "PATCH",
        path: () => {
            if (!sharedData.createdGroupId) throw new Error("그룹 ID 없음");
            return `/v2.0/api/groups/${sharedData.createdGroupId}`;
        },
        body: () => {
            const data = getDynamicData();
            return {
                "group": {
                    "name": "테스트그룹2",
                    "description": "클라우드2팀",
                    "members": [data.memberId]
                }
            };
        },
        expectedStatus: 200
    },
    // 22. Group Delete (OPA 020)
    {
        name: "그룹 삭제 (OPA 020)",
        method: "DELETE",
        path: "/v2.0/api/groups",
        body: () => {
            if (!sharedData.createdGroupId) throw new Error("삭제할 그룹 ID 없음");
            return { "group_ids": [sharedData.createdGroupId] };
        },
        expectedStatus: 200
    },
    // 23. Member Bulk Add (OPA 030)
    {
        name: "멤버 일괄 추가 (OPA 030)",
        method: "POST",
        path: "/v2.0/api/list_members",
        body: generateBulkMemberBody,
        expectedStatus: 200
    },
    // 24. Send PDF (OPA 037)
    {
        name: "일괄 완료 문서 PDF 전송 (OPA 037)",
        method: "POST",
        path: () => {
            const data = getDynamicData();
            if (!data.companyId) throw new Error("Company ID 누락");
            return `/v2.0/api/companies/${data.companyId}/send_multiple_completed_document`;
        },
        body: generateSendPdfBody,
        expectedStatus: 200
    },
    // 25. Multi File Download (OPA 040)
    {
        name: "문서 파일 일괄 다운로드 (OPA 040)",
        method: "POST",
        path: "/v2.0/api/documents/download_multi_files",
        body: generateMultiDownloadBody,
        expectedStatus: 200
    },
    // 26. [NEW] Refresh Complete Token (OPA 045)
    {
        name: "완료 토큰 기한 연장 (OPA 045)",
        method: "POST",
        path: () => {
            // "complete" token implies we should use a completed document.
            // Pick randomly from the collected completedDocIds.
            if (!sharedData.completedDocIds || sharedData.completedDocIds.length === 0) {
                throw new Error("완료된 문서가 없어 토큰을 연장할 수 없습니다.");
            }
            const randomId = sharedData.completedDocIds[Math.floor(Math.random() * sharedData.completedDocIds.length)];
            return `/v2.0/api/documents/${randomId}/refresh_complete_token`;
        },
        body: { "step_seq": [] },
        expectedStatus: 200
    },
    // 27. Cleanup Bulk 1
    {
        name: "일괄 추가된 멤버 1 삭제 (Cleanup)",
        method: "DELETE",
        path: () => {
            if (!sharedData.bulkMemberIds || sharedData.bulkMemberIds.length < 1) throw new Error("삭제할 일괄 멤버 ID가 없습니다.");
            return `/v2.0/api/members/${sharedData.bulkMemberIds[0]}`;
        },
        body: null,
        expectedStatus: 200
    },
    // 28. Cleanup Bulk 2
    {
        name: "일괄 추가된 멤버 2 삭제 (Cleanup)",
        method: "DELETE",
        path: () => {
            if (!sharedData.bulkMemberIds || sharedData.bulkMemberIds.length < 2) throw new Error("삭제할 일괄 멤버 ID가 없습니다.");
            return `/v2.0/api/members/${sharedData.bulkMemberIds[1]}`;
        },
        body: null,
        expectedStatus: 200
    },
    // 29. Cleanup Doc Cancel (OPA 42)
    {
        name: "문서 취소 (OPA 042 - Cleanup)",
        method: "POST",
        path: "/v2.0/api/documents/cancel",
        body: () => {
            if (sharedData.createdIdList.length === 0) throw new Error("취소할 문서 ID 없음");
            return { "input": { "document_ids": sharedData.createdIdList } };
        },
        expectedStatus: 200
    },
    // 30. Cleanup Doc Delete (OPA 009)
    {
        name: "문서 삭제 (OPA 009 - Cleanup)",
        method: "DELETE",
        path: "/v2.0/api/documents",
        body: () => {
            if (sharedData.createdIdList.length === 0) throw new Error("삭제할 문서 ID 없음");
            return { "document_ids": sharedData.createdIdList };
        },
        expectedStatus: 200
    }
];

async function runAllTests() {
    const baseUrl = document.getElementById('baseUrl').value.replace(/\/$/, "");
    const commonToken = document.getElementById('accessToken').value;
    const tbody = document.getElementById('resultTableBody');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    tbody.innerHTML = "";
    sharedData = { lastCreatedId: null, createdIdList: [], createdGroupId: null, companyStampId: null, bulkMemberIds: [], completedDocIds: [] };
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < testList.length; i++) {
        const test = testList[i];
        let url = "";
        let bodyData = null;
        let errorMessage = "";
        let responseJson = null;

        const percent = Math.round(((i + 1) / testList.length) * 100);
        progressBar.style.width = `${percent}%`;
        progressText.innerText = `Testing... ${test.name}`;

        try {
            const pathStr = typeof test.path === 'function' ? test.path() : test.path;
            url = `${baseUrl}${pathStr}`;
            if (test.body) {
                const generatedBody = typeof test.body === 'function' ? test.body() : test.body;
                if (generatedBody === null && (test.name.includes("OPA 014") || test.name.includes("OPA 037"))) {
                    throw new Error("SKIP_ACTION");
                }
                bodyData = generatedBody;
            }
        } catch (err) { errorMessage = err.message; }

        if (errorMessage === "SKIP_OPA14" || errorMessage === "SKIP_OPA037" || errorMessage === "SKIP_ACTION") {
            const rowId = `log-${i}`;
            tbody.insertAdjacentHTML('beforeend', `<tr class="table-warning"><td class="text-center fw-bold">${i+1}</td><td><div class="fw-bold">${test.name}</div></td><td class="text-center"><span class="badge bg-secondary">${test.method}</span></td><td class="text-center status-skip">SKIPPED</td><td class="text-center">-</td><td class="text-center"><button class="btn btn-sm btn-outline-secondary" onclick="toggleLog('${rowId}')">결과보기</button></td></tr><tr><td colspan="6" class="p-0 border-0"><div id="${rowId}" class="log-box">Skipped due to missing data (수신자 정보 또는 완료 문서 ID 등)</div></td></tr>`);
            continue;
        }

        let requestHeaders = { "Content-Type": "application/json", ...(commonToken ? { "Authorization": `Bearer ${commonToken}` } : {}) };
        if (test.headers) { try { requestHeaders = { ...requestHeaders, ...test.headers() }; } catch (e) { errorMessage = e.message; } }

        const options = { method: test.method, headers: requestHeaders };
        if (bodyData) options.body = JSON.stringify(bodyData);

        const startTime = performance.now();
        let resultStatus = "ERROR", resultClass = "status-fail", rowColor = "table-danger", responseText = errorMessage, duration = "-";

        if (!errorMessage) {
            try {
                const response = await fetch(url, options);
                const endTime = performance.now();
                duration = (endTime - startTime).toFixed(0) + "ms";
                const contentType = response.headers.get("content-type");
                
                if (contentType && (contentType.includes("pdf") || contentType.includes("zip") || contentType.includes("octet-stream") || contentType.includes("image"))) {
                    const blob = await response.blob();
                    responseText = `[Binary File] Type: ${contentType}, Size: ${blob.size} bytes`;
                } else {
                    const text = await response.text();
                    responseText = text;
                    try { responseJson = JSON.parse(text); responseText = JSON.stringify(responseJson, null, 2); } catch(e) {}
                }

                let isPass = (response.status === test.expectedStatus);
                // OPA 030 Check
                if (isPass && test.name.includes("OPA 030") && responseJson && responseJson.members) {
                    const failed = responseJson.members.filter(m => m.success === false);
                    if (failed.length > 0) { isPass = false; responseText = "⚠️ [Business Logic Failure] 'success': false detected.\n\n" + responseText; }
                }

                if (isPass) {
                    resultStatus = "PASS"; resultClass = "status-pass"; rowColor = ""; successCount++;
                    if(test.afterRequest && responseJson) test.afterRequest(responseJson);
                } else {
                    resultStatus = `FAIL (${response.status})`; failCount++; rowColor = "table-danger";
                }
            } catch (networkError) {
                responseText = `Network Error: ${networkError.message}`; failCount++;
            }
        } else { failCount++; }

        const rowId = `log-${i}`;
        const row = `
            <tr class="${rowColor}">
                <td class="text-center fw-bold">${i + 1}</td>
                <td><div class="fw-bold">${test.name}</div><div class="small text-muted text-break">${url}</div></td>
                <td class="text-center"><span class="badge bg-secondary">${test.method}</span></td>
                <td class="text-center ${resultClass}">${resultStatus}</td>
                <td class="text-center">${duration}</td>
                <td class="text-center"><button class="btn btn-sm btn-outline-secondary" onclick="toggleLog('${rowId}')">결과보기</button></td>
            </tr>
            <tr><td colspan="6" class="p-0 border-0"><div id="${rowId}" class="log-box"><div class="text-primary fw-bold">[Request Body]</div>${bodyData ? JSON.stringify(bodyData, null, 2) : "(Empty)"}<hr class="my-1"><div class="text-success fw-bold">[Response]</div>${responseText}</div></td></tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
        await new Promise(r => setTimeout(r, 500));
    }
    progressText.innerText = `완료! (성공: ${successCount} / 실패: ${failCount})`;
    progressBar.classList.remove('progress-bar-animated');
    progressBar.classList.add(failCount > 0 ? 'bg-danger' : 'bg-success');
}

function toggleLog(id) { const box = document.getElementById(id); box.style.display = (box.style.display === "block") ? "none" : "block"; }