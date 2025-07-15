  // 고정 URL 매핑
    const tokenUrlMap = {
      "op_saas": "https://kr-api.eformsign.com/v2.0/api_auth/access_token",
      "csap": "https://www.gov-eformsign.com/Service/v2.0/api_auth/access_token"
    };
    const memberUrlMap = {
      "op_saas": "https://kr-api.eformsign.com/v2.0/api/members",
      "csap": "https://www.gov-eformsign.com/Service/v2.0/api/members"
    };

    // 섹션 토글
   function showSection(id) {
 
  const toggleIds = [
    'memberAddSection','memberDeleteSection','memberUpdateSection','memberListSection',
    'groupAddSection','groupUpdateSection','groupDeleteSection','groupListSection'
  ];
  toggleIds.forEach(sec => {
    document.getElementById(sec).style.display = 'none';
  });
  document.getElementById(id).style.display = 'block';
}

    // URL 표시 및 custom 필드
    function updateUrlDisplay() {
      const env = $('#envSelection').val();
      let tokenUrl, memberUrl;
      if (env === 'custom') {
        const base = $('#customEnvUrl').val().trim().replace(/\/$/, '');
        tokenUrl = base ? `${base}/v2.0/api_auth/access_token` : '(Base URL 입력 필요)';
        memberUrl = base ? `${base}/v2.0/api/members` : '(Base URL 입력 필요)';
      } else {
        tokenUrl = tokenUrlMap[env];
        memberUrl = memberUrlMap[env];
      }
      $('#urlDisplay').html(`Access Token URL: ${tokenUrl}<br>멤버 API URL: ${memberUrl}`);
    }

    $(document).ready(function () {
      // 초기 세팅
      updateUrlDisplay();
      // 환경 선택 변경
      $('#envSelection').on('change', function () {
        if (this.value === 'custom') $('#customEnvUrlField').slideDown();
        else $('#customEnvUrlField').slideUp();
        updateUrlDisplay();
      });
      $('#customEnvUrl').on('input', updateUrlDisplay);
      // secretKey 방식 토글
      $('input[name="secretKeyMethod"]').change(function () {
        if (this.value === 'signature') {
          $('#secretKeyLabel').text('비밀 키 (Secret key, Hex):');
          $('#privateKeyHex').attr('placeholder', '예: 30... (Signature 방식)');
        } else {
          $('#secretKeyLabel').text('비밀 토큰:');
          $('#privateKeyHex').attr('placeholder', '예: test (Bearer token 방식)');
        }
      });
      // 옵션 토글
      $('#toggleOptionalBtn').click(function () {
        $('#optionalFields').slideToggle();
        $(this).text($(this).text() === '추가 옵션 보기' ? '추가 옵션 숨기기' : '추가 옵션 보기');
      });
      $('#toggleExcelUploadBtn').click(function () {
        $('#excelUploadSection').slideToggle();
        $(this).text($(this).text() === '엑셀 파일 업로드 보기' ? '엑셀 파일 업로드 숨기기' : '엑셀 파일 업로드 보기');
      });
      $('#toggleExcelDeleteUploadBtn').click(function () {
        $('#excelDeleteUploadSection').slideToggle();
        $(this).text($(this).text() === '엑셀 파일 업로드 보기 (삭제)' ? '엑셀 파일 업로드 숨기기 (삭제)' : '엑셀 파일 업로드 보기 (삭제)');
      });
      $('#toggleExcelUpdateUploadBtn').click(function () {
        $('#excelUpdateUploadSection').slideToggle();
        $(this).text($(this).text() === '엑셀 파일 업로드 보기 (수정)' ? '엑셀 파일 업로드 숨기기 (수정)' : '엑셀 파일 업로드 보기 (수정)');
      });
      // updateMemberId 자동 복사
      $('#updateMemberId').on('change', () => {
        $('#updateAccountId').val($('#updateMemberId').val().trim());
      });
      $('#toggleGroupExcelBtn').click(function () {
        $('#excelGroupUploadSection').slideToggle();
        const showing = $('#excelGroupUploadSection').is(':visible');
        $(this).text(showing ? '엑셀 업로드 숨기기' : '엑셀 업로드 보기');
      });
      $('#toggleGroupUpdateExcelBtn').click(function () {
        $('#excelGroupUpdateSection').slideToggle();
        const showing = $('#excelGroupUpdateSection').is(':visible');
        $(this).text(showing
          ? '엑셀 업로드 숨기기 (수정)'
          : '엑셀 업로드 보기 (수정)');
      });
      $('#toggleGroupExcelDeleteBtn').click(function () {
        $('#excelGroupDeleteSection').slideToggle();
        const showing = $('#excelGroupDeleteSection').is(':visible');
        $(this).text(showing ? '엑셀 업로드 숨기기 (삭제)' : '엑셀 업로드 보기 (삭제)');
      });
      // 기본 영역
      // 토글 버튼 클릭 핸들러
      $('#toggleIncludeMember').click(function () {
        $(this).toggleClass('on off')
          .text($(this).hasClass('on') ? 'ON' : 'OFF');
      });
      $('#toggleIncludeField').click(function () {
        $(this).toggleClass('on off')
          .text($(this).hasClass('on') ? 'ON' : 'OFF');
      });
      showSection('memberAddSection');
    });

    // === Access Token 발급 ===
    function getAccessToken() {
      const env = $('#envSelection').val();
      let requestURL;
      if (env === 'custom') {
        const base = $('#customEnvUrl').val().trim().replace(/\/$/, '');
        if (!base) return alert('사용자 지정 Base URL을 입력하세요.');
        requestURL = `${base}/v2.0/api_auth/access_token`;
      } else {
        requestURL = tokenUrlMap[env];
      }

      const execution_time = Date.now() + '';
      const privateKeyInput = $('#privateKeyHex').val().trim();
      const user_id = $('#user_id_token').val().trim();
      const apiKey = $('#apiKey').val().trim();
      if (!privateKeyInput || !user_id || !apiKey)
        return alert('API-KEY, 비밀 키/토큰, User ID 모두 입력해주세요.');

      let signatureValue = '';
      const method = $('input[name="secretKeyMethod"]:checked').val();
      if (method === 'signature') {
        try {
          const privateKey = KEYUTIL.getKeyFromPlainPrivatePKCS8Hex(privateKeyInput);
          const s_sig = new KJUR.crypto.Signature({ alg: 'SHA256withECDSA' });
          s_sig.init(privateKey);
          s_sig.updateString(execution_time);
          signatureValue = s_sig.sign();
        } catch (e) {
          return alert('서명 생성 중 오류: ' + e);
        }
      } else {
        signatureValue = 'Bearer ' + privateKeyInput;
      }

      const requestBody = { execution_time: parseInt(execution_time), member_id: user_id };
      $('#tokenResult').html('Access Token 발급 요청 중...');

      $.ajax({
        url: requestURL,
        type: 'POST',
        contentType: 'application/json; charset=UTF-8',
        data: JSON.stringify(requestBody),
        beforeSend: req => {
          req.setRequestHeader('Authorization', 'Bearer ' + btoa(apiKey));
          req.setRequestHeader('eformsign_signature', signatureValue);
        },
        success: data => {
          $('#accessToken').val(data.oauth_token.access_token);
          $('#refreshToken').val(data.oauth_token.refresh_token);
          $('#companyId').val(data.api_key.company.company_id);
          $('#tokenResult').html('Access Token 발급 성공.\n' + JSON.stringify(data, null, 2));
        },
        error: (jqXHR, textStatus, errorThrown) => {
          let resp;
          try { resp = JSON.parse(jqXHR.responseText); }
          catch { resp = { message: '파싱 오류' }; }
          const code = resp.code || jqXHR.status || 'Unknown';
          const msg = resp.ErrorMessage || errorThrown;
          alert(`발급 실패:\n코드: ${code}\n메시지: ${msg}`);
          $('#tokenResult').html(`Access Token 발급 실패.\n코드: ${code}\n응답:\n${JSON.stringify(resp, null, 2)}`);
        }
      });
    }

    // === 멤버 추가 ===
    function addMember() {
      const token = $('#accessToken').val().trim();
      if (!token) return alert('먼저 Access Token 발급해주세요.');

      const id = $('#accountId').val().trim();
      const pw = $('#accountPassword').val().trim();
      const fn = $('#accountFirstName').val().trim();
      if (!id || !pw || !fn) return alert('id, password, first_name은 필수 입력입니다.');

      let account = { id, password: pw, first_name: fn };
      // 연락처
      const tel = $('#contactTel').val().trim();
      const num = $('#contactNumber').val().trim();
      const ccn = $('#contactCountryNumber').val().trim();
      let contact = {};
      if (tel) contact.tel = tel;
      if (num) contact.number = num;
      if (ccn) contact.country_number = ccn;
      if (Object.keys(contact).length) account.contact = contact;
      // 부서/직책
      const dept = $('#department').val().trim(); if (dept) account.department = dept;
      const pos = $('#position').val().trim(); if (pos) account.position = pos;
      // 마케팅 동의
      if ($('#agreementMarketing').is(':checked')) account.agreement = { marketing: true };
      // 권한
      const roles = $('#role').val().trim();
      if (roles) account.role = roles.split(',').map(r => r.trim()).filter(r => r);
      // external_sso_info
      let external = {};
      const extUuid = $('#externalUuid').val().trim();
      const extAcc = $('#externalAccountId').val().trim();
      if (extUuid) external.uuid = extUuid;
      if (extAcc) external.account_id = extAcc;
      if (Object.keys(external).length) account.external_sso_info = external;

      const requestBody = { account };
      const env = $('#envSelection').val();
      let baseUrl;
      if (env === 'custom') {
        const b = $('#customEnvUrl').val().trim().replace(/\/$/, '');
        if (!b) return alert('사용자 지정 Base URL을 입력하세요.');
        baseUrl = `${b}/v2.0/api/members`;
      } else {
        baseUrl = memberUrlMap[env];
      }
      let url = baseUrl;
      if ($('input[name="mailOption"]:checked').val() === 'false') url += '?mailOption=false';

      $('#result').html(`실행 URL: ${url}\n멤버 추가 중...`);
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(requestBody)
      })
        .then(res => {
          if (!res.ok) return res.text().then(t => { throw new Error(`${res.status}: ${t}`) });
          return res.json();
        })
        .then(data => {
          $('#result').html('멤버 추가 성공.\n' + JSON.stringify(data, null, 2));
        })
        .catch(err => {
          $('#result').html('Error: ' + err);
        });
    }

    // === 멤버 삭제 ===
    function deleteMember() {
      const token = $('#accessToken').val().trim();
      if (!token) return alert('먼저 Access Token 발급해주세요.');

      const memberId = $('#deleteMemberId').val().trim();
      if (!memberId) return alert('삭제할 member_id를 입력해주세요.');

      const env = $('#envSelection').val();
      let baseUrl;
      if (env === 'custom') {
        const b = $('#customEnvUrl').val().trim().replace(/\/$/, '');
        if (!b) return alert('사용자 지정 Base URL을 입력하세요.');
        baseUrl = `${b}/v2.0/api/members`;
      } else {
        baseUrl = memberUrlMap[env];
      }
      let url = `${baseUrl}/${encodeURIComponent(memberId)}`;
      if ($('input[name="mailOptionDelete"]:checked').val() === 'false') url += '?mailOption=false';

      $('#deleteResult').html(`실행 URL: ${url}\n삭제 중...`);
      fetch(url, {
        method: 'DELETE',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({})
      })
        .then(res => {
          if (!res.ok) return res.text().then(t => { throw new Error(`${res.status}: ${t}`) });
          return res.text().then(t => t ? JSON.parse(t) : {});
        })
        .then(data => {
          $('#deleteResult').html('삭제 성공.\n' + JSON.stringify(data, null, 2));
        })
        .catch(err => {
          $('#deleteResult').html('Error: ' + err);
        });
    }

    // === 멤버 수정 ===
    function updateMember() {
      const token = $('#accessToken').val().trim();
      if (!token) return alert('먼저 Access Token 발급해주세요.');

      const memberId = $('#updateMemberId').val().trim();
      if (!memberId) return alert('수정할 member_id를 입력해주세요.');

      let account = { id: memberId };
      const name = $('#updateName').val().trim(); if (name) account.name = name;
      account.enabled = ($('#updateEnabled').val() === 'true');
      const num = $('#updateContactNumber').val().trim();
      const tel = $('#updateContactTel').val().trim();
      if (num || tel) {
        account.contact = {};
        if (num) account.contact.number = num;
        if (tel) account.contact.tel = tel;
      }
      const dept = $('#updateDepartment').val().trim(); if (dept) account.department = dept;
      const pos = $('#updatePosition').val().trim(); if (pos) account.position = pos;
      const roles = $('#updateRole').val().trim();
      if (roles) account.role = roles.split(',').map(r => r.trim()).filter(r => r);

      const requestBody = { account };
      const env = $('#envSelection').val();
      let baseUrl;
      if (env === 'custom') {
        const b = $('#customEnvUrl').val().trim().replace(/\/$/, '');
        if (!b) return alert('사용자 지정 Base URL을 입력하세요.');
        baseUrl = `${b}/v2.0/api/members`;
      } else {
        baseUrl = memberUrlMap[env];
      }
      const url = `${baseUrl}/${encodeURIComponent(memberId)}`;

      $('#updateResult').html(`실행 URL: ${url}\n수정 중...`);
      fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(requestBody)
      })
        .then(res => {
          if (!res.ok) return res.text().then(t => { throw new Error(`${res.status}: ${t}`) });
          return res.json();
        })
        .then(data => {
          $('#updateResult').html('수정 성공.\n' + JSON.stringify(data, null, 2));
        })
        .catch(err => {
          $('#updateResult').html('Error: ' + err);
        });
    }

    // === 구성원 목록 조회 ===
    function listMembers(viewType) {
      const token = $('#accessToken').val().trim();
      if (!token) return alert('먼저 Access Token 발급해주세요.');

      const env = $('#envSelection').val();
      let baseUrl;
      if (env === 'custom') {
        const b = $('#customEnvUrl').val().trim().replace(/\/$/, '');
        if (!b) return alert('사용자 지정 Base URL을 입력하세요.');
        baseUrl = `${b}/v2.0/api/members`;
      } else {
        baseUrl = memberUrlMap[env];
      }
      const url = baseUrl;

      if (viewType === 'json') {
        $('#jsonContainer').show();
        $('#tableContainer').hide();
      } else {
        $('#jsonContainer').hide();
        $('#tableContainer').show();
      }

      $('#listResultJson').text('조회 중...');
      $('#listResultTable tbody').empty();

      fetch(url, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
      })
        .then(res => res.json())
        .then(data => {
          $('#listResultJson').text(JSON.stringify(data, null, 2));
          if (viewType === 'table') {
            data.members.forEach(m => {
              const date = new Date(m.create_date).toLocaleString();
              $('#listResultTable tbody').append(`
              <tr>
                <td>${m.id}</td>
                <td>${m.name}</td>
                <td>${m.department || '-'}</td>
                <td>${m.position || '-'}</td>
                <td>${date}</td>
                <td>${m.enabled}</td>
              </tr>
            `);
            });
          }
        })
        .catch(err => {
          $('#listResultJson').text('조회 실패: ' + err);
        });
    }
    // === 그룹 추가 (수동) ===
    function addGroup() {
      const token = document.getElementById("accessToken").value.trim();
      if (!token) {
        alert("먼저 Access Token을 발급받아주세요.");
        return;
      }

      // Base URL 결정 (custom 포함)
      let baseUrl;
      const env = document.getElementById("envSelection").value;
      if (env === "custom") {
        const b = document.getElementById("customEnvUrl").value.trim().replace(/\/$/, "");
        if (!b) {
          alert("사용자 지정 Base URL을 입력해주세요.");
          return;
        }
        baseUrl = b + "/v2.0/api/groups";
      } else {
        // SaaS / CSAP 환경
        baseUrl = env === "op_saas"
          ? "https://kr-api.eformsign.com/v2.0/api/groups"
          : "https://www.gov-eformsign.com/Service/v2.0/api/groups";
      }

      // 폼 입력 값 수집
      const name = document.getElementById("groupName").value.trim();
      if (!name) {
        alert("그룹 이름을 입력해주세요.");
        return;
      }
      const description = document.getElementById("groupDescription").value.trim();
      const membersText = document.getElementById("groupMembers").value.trim();
      const members = membersText
        ? membersText.split(",").map(s => s.trim()).filter(s => s)
        : [];

      const body = {
        group: {
          name: name,
          description: description,
          members: members
        }
      };

      // 호출 및 결과 표시
      document.getElementById("groupResult").innerText = "그룹 추가 중...";
      fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify(body)
      })
        .then(res => {
          if (!res.ok) {
            // 에러 메시지도 최대한 살려서
            return res.text().then(txt => {
              throw new Error(txt || `HTTP ${res.status}`);
            });
          }
          return res.json();    // 여기서 실제 JSON 파싱
        })
        .then(json => {
          const out = {
            message: "그룹 추가 성공",
            response: json    // 이제 실제 response body
          };
          $('#groupResult').text(JSON.stringify(out, null, 2));
        })
        .catch(err => {
          const out = {
            message: "그룹 추가 실패",
            error: err.toString()
          };
          $('#groupResult').text(JSON.stringify(out, null, 2));
        });
    }
    function updateGroup() {
      const token = $('#accessToken').val().trim();
      if (!token) return alert('먼저 Access Token을 발급받아주세요.');
      // Base URL
      let env = $('#envSelection').val(),
        base = env === 'custom'
          ? $('#customEnvUrl').val().trim().replace(/\/$/, '')
          : env === 'op_saas'
            ? 'https://kr-api.eformsign.com'
            : 'https://www.gov-eformsign.com/Service';
      const url = `${base}/v2.0/api/groups/${encodeURIComponent($('#updGroupId').val().trim())}`;
      // Body 조립
      const members = $('#updGroupMembers').val().split(',').map(s => s.trim()).filter(s => s);
      const body = {
        group: {
          name: $('#updGroupName').val().trim(),
          description: $('#updGroupDescription').val().trim(),
          members
        }
      };
      $('#groupUpdateResult').text('수정 중...');
      fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(body)
      })
        .then(res => {
          if (!res.ok) return res.text().then(t => { throw new Error(t || `HTTP ${res.status}`) });
          return res.json();
        })
        .then(json => {
          $('#groupUpdateResult').text(JSON.stringify({
            message: '그룹 수정 성공',
            response: json
          }, null, 2));
        })
        .catch(err => {
          $('#groupUpdateResult').text(JSON.stringify({
            message: '그룹 수정 실패',
            error: err.toString()
          }, null, 2));
        });
    }
    // ③ 엑셀 템플릿 다운로드 (수정)
    function downloadGroupUpdateTemplate() {
      const wb = XLSX.utils.book_new();
      const wsData = [
        ['group_id', 'name', 'description', 'members'],
        ['a1b1f52d896044f6a651624f0f5114ab', '테스트그룹2', '클라우드2팀', 'test1@forcs.com,test2@forcs.com']
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'UpdateTemplate');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      function s2ab(s) {
        const buf = new ArrayBuffer(s.length), view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
      }
      const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob),
        a = document.createElement('a');
      a.href = url; a.download = 'group_update_template.xlsx';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    // ④ 엑셀 검증 (수정)
    let validGroupUpdateRows = [], invalidGroupUpdateRows = [];
    function validateExcelGroupUpdateFile() {
      const input = document.getElementById('excelGroupUpdateFileInput');
      if (!input.files.length) return alert('파일을 선택해주세요.');
      const reader = new FileReader();
      reader.onload = e => {
        const wb = XLSX.read(e.target.result, { type: 'binary' });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        validGroupUpdateRows = []; invalidGroupUpdateRows = [];
        rows.forEach((r, i) => {
          if (r.group_id && r.name && r.members) {
            validGroupUpdateRows.push(r.group_id.split(',').length > 1 ? // members만 CSV
              { group_id: r.group_id, name: r.name, description: r.description || '', members: r.members.split(',').map(s => s.trim()) }
              : {
                group_id: r.group_id, name: r.name, description: r.description || '', members: r.members.split(',').map(s => s.trim())
              });
          } else invalidGroupUpdateRows.push(i + 2);
        });
        let msg = `검증 완료\n총:${rows.length} 유효:${validGroupUpdateRows.length} 오류:${invalidGroupUpdateRows.length}`;
        if (invalidGroupUpdateRows.length) msg += `\n오류행:${invalidGroupUpdateRows.join(',')}`;
        $('#excelGroupUpdateResult').text(msg);
        $('#excelGroupUpdateExecuteSection').toggle(validGroupUpdateRows.length > 0);
      };
      reader.readAsBinaryString(input.files[0]);
    }

    // ⑤ 엑셀로 그룹 수정 실행
    function executeExcelGroupUpdate() {
      const token = $('#accessToken').val().trim();
      if (!token) return alert('먼저 Access Token을 발급받아주세요.');
      // Base URL
      let env = $('#envSelection').val(),
        base = env === 'custom'
          ? $('#customEnvUrl').val().trim().replace(/\/$/, '')
          : env === 'op_saas'
            ? 'https://kr-api.eformsign.com'
            : 'https://www.gov-eformsign.com/Service';
      const promises = validGroupUpdateRows.map(r => {
        const url = `${base}/v2.0/api/groups/${encodeURIComponent(r.group_id)}`;
        return fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            group: {
              name: r.name,
              description: r.description,
              members: r.members
            }
          })
        })
          .then(res => {
            if (!res.ok) return res.text().then(t => { throw new Error(t || `HTTP ${res.status}`) });
            return res.json();
          })
          .then(json => ({ success: true, row: r, response: json }))
          .catch(err => ({ success: false, row: r, error: err.toString() }));
      });
      Promise.all(promises).then(results => {
        const ok = results.filter(r => r.success).length,
          fail = results.length - ok;
        $('#excelGroupUpdateResult').text(JSON.stringify({
          summary: `엑셀 그룹 수정 완료 (성공 ${ok}건, 실패 ${fail}건)`,
          details: results
        }, null, 2));
      });
    }
    // == 수동 그룹 삭제 ===
    function deleteGroups() {
      const token = $('#accessToken').val().trim();
      if (!token) return alert('먼저 Access Token을 발급받아주세요.');

      // Base URL 결정 (custom 포함)
      let baseUrl;
      const env = $('#envSelection').val();
      if (env === 'custom') {
        const b = $('#customEnvUrl').val().trim().replace(/\/$/, '');
        if (!b) return alert('사용자 지정 Base URL을 입력해주세요.');
        baseUrl = b + '/v2.0/api/groups';
      } else {
        baseUrl = env === 'op_saas'
          ? 'https://kr-api.eformsign.com/v2.0/api/groups'
          : 'https://www.gov-eformsign.com/Service/v2.0/api/groups';
      }

      // IDs
      const ids = $('#delGroupIds').val().split(',').map(s => s.trim()).filter(s => s);
      if (!ids.length) return alert('삭제할 그룹 ID를 입력해주세요.');

      const body = { group_ids: ids };
      $('#groupDeleteResult').text('삭제 중...');

      fetch(baseUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(body)
      })
        .then(res => {
          if (!res.ok) return res.text().then(txt => { throw new Error(txt || `HTTP ${res.status}`) });
          return res.json();
        })
        .then(json => {
          const out = { message: '그룹 삭제 성공', response: json };
          $('#groupDeleteResult').text(JSON.stringify(out, null, 2));
        })
        .catch(err => {
          const out = { message: '그룹 삭제 실패', error: err.toString() };
          $('#groupDeleteResult').text(JSON.stringify(out, null, 2));
        });
    }

    // === 엑셀 템플릿 다운로드 ===
    function downloadTemplate() {
      var wb = XLSX.utils.book_new();
      var ws_data = [
        ["id", "password", "first_name", "contact_tel", "contact_number", "contact_country_number", "department", "position", "agreement_marketing", "role", "external_uuid", "external_account_id"],
        ["example@forcs.com", "1111", "Example", "01012345678", "01087654321", "+82", "연구소", "연구원", "true", "company_manager,template_manager", "123456", "example@sso.com"]
      ];
      var ws = XLSX.utils.aoa_to_sheet(ws_data);
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      function s2ab(s) { var buf = new ArrayBuffer(s.length), view = new Uint8Array(buf); for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; return buf; }
      var blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a"); a.href = url; a.download = "멤버추가_템플릿.xlsx"; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    function downloadDeleteTemplate() {
      var wb = XLSX.utils.book_new();
      var ws_data = [["id"], ["example@forcs.com"]];
      var ws = XLSX.utils.aoa_to_sheet(ws_data);
      XLSX.utils.book_append_sheet(wb, ws, "DeleteTemplate");
      var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      function s2ab(s) { var buf = new ArrayBuffer(s.length), view = new Uint8Array(buf); for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; return buf; }
      var blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a"); a.href = url; a.download = "멤버삭제_템플릿.xlsx"; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    function downloadUpdateTemplate() {
      var wb = XLSX.utils.book_new();
      var ws_data = [
        ["id", "name", "enabled", "contact_number", "contact_tel", "department", "position", "role"],
        ["example@forcs.com", "홍길동", "true", "01023456789", "01012345678", "연구소", "연구원", "company_manager,template_manager"]
      ];
      var ws = XLSX.utils.aoa_to_sheet(ws_data);
      XLSX.utils.book_append_sheet(wb, ws, "UpdateTemplate");
      var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      function s2ab(s) { var buf = new ArrayBuffer(s.length), view = new Uint8Array(buf); for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; return buf; }
      var blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a"); a.href = url; a.download = "멤버수정_템플릿.xlsx"; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    // === 엑셀 파일 검증 / 실행 ===
    // (추가)
    function validateExcelFile() {
      const fileInput = document.getElementById("excelFileInput");
      if (!fileInput.files || fileInput.files.length === 0) {
        alert("엑셀 파일을 선택해주세요.");
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        let workbook;
        try { workbook = XLSX.read(e.target.result, { type: 'binary' }); }
        catch (err) { alert("파싱 오류: " + err); return; }
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        if (rows.length === 0) { alert("데이터 없음"); return; }
        validExcelRows = []; invalidExcelRows = [];
        rows.forEach((row, i) => {
          const id = row['id'] || row['account_id'] || "";
          const pw = row['password'] || "";
          const fn = row['first_name'] || "";
          if (id && pw && fn) validExcelRows.push(row);
          else invalidExcelRows.push({ rowNumber: i + 2, row });
        });
        let summary = `검증 완료\n총:${rows.length} 유효:${validExcelRows.length} 오류:${invalidExcelRows.length}\n`;
        if (invalidExcelRows.length) {
          summary += "오류행:\n";
          invalidExcelRows.forEach(x => {
            let missing = [];
            if (!x.row['id'] && !x.row['account_id']) missing.push("id");
            if (!x.row['password']) missing.push("password");
            if (!x.row['first_name']) missing.push("first_name");
            summary += `행 ${x.rowNumber}: ${missing.join(",")}\n`;
          });
        }
        document.getElementById("excelResult").innerText = summary;
        document.getElementById("excelExecuteSection").style.display = validExcelRows.length > 0 ? "block" : "none";
      };
      reader.onerror = err => alert("읽기 오류: " + err);
      reader.readAsBinaryString(fileInput.files[0]);
    }

    function executeExcelMemberAddition() {
      const token = $('#accessToken').val().trim();
      if (!token) { alert("먼저 Access Token 발급해주세요."); return; }
      const env = $('#envSelection').val();
      let baseUrl = env === 'custom'
        ? `${$('#customEnvUrl').val().trim().replace(/\/$/, '')}/v2.0/api/members`
        : memberUrlMap[env];
      if ($('input[name="mailOption"]:checked').val() === 'false') baseUrl += '?mailOption=false';
      Promise.all(validExcelRows.map(row => {
        let account = {
          id: row['id'] || row['account_id'] || "",
          password: row['password'] || "",
          first_name: row['first_name'] || ""
        };
        if (row['contact_tel']) account.contact = { tel: row['contact_tel'] };
        if (row['contact_number']) account.contact = Object.assign(account.contact || {}, { number: row['contact_number'] });
        if (row['contact_country_number']) account.contact = Object.assign(account.contact || {}, { country_number: row['contact_country_number'] });
        if (row['department']) account.department = row['department'];
        if (row['position']) account.position = row['position'];
        if (row['agreement_marketing'] === "true" || row['agreement_marketing'] === true) account.agreement = { marketing: true };
        if (row['role']) account.role = row['role'].split(",").map(s => s.trim());
        if (row['external_uuid']) account.external_sso_info = Object.assign(account.external_sso_info || {}, { uuid: row['external_uuid'] });
        if (row['external_account_id']) account.external_sso_info = Object.assign(account.external_sso_info || {}, { account_id: row['external_account_id'] });

        return fetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ account })
        })
          .then(res => {
            if (!res.ok) return res.text().then(t => ({ error: `${res.status}`, response: t, row }));
            return res.json().then(data => ({ success: true, data, row }));
          })
          .catch(err => ({ error: err.toString(), row }));
      }))
        .then(results => {
          const successCount = results.filter(r => r.success).length;
          const errorCount = results.length - successCount;
          let summary = `엑셀 처리 완료 (추가) 성공:${successCount} 실패:${errorCount}\n\n`;
          summary += JSON.stringify(results, null, 2);
          document.getElementById("excelResult").innerText = summary;
        });
    }

    function validateExcelFileForDeletion() {
      const fileInput = document.getElementById("excelFileDeleteInput");
      if (!fileInput.files || !fileInput.files.length) { alert("파일 선택"); return; }
      const reader = new FileReader();
      reader.onload = e => {
        let wb;
        try { wb = XLSX.read(e.target.result, { type: 'binary' }); }
        catch (err) { alert("파싱 오류:" + err); return; }
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        validDeleteRows = []; invalidDeleteRows = [];
        rows.forEach((row, i) => {
          const id = row['id'] || row['account_id'] || "";
          if (id) validDeleteRows.push(row);
          else invalidDeleteRows.push({ rowNumber: i + 2 });
        });
        let s = `검증 완료 삭제\n총:${rows.length} 유효:${validDeleteRows.length} 오류:${invalidDeleteRows.length}\n`;
        if (invalidDeleteRows.length) {
          s += "오류 행 번호:\n" + invalidDeleteRows.map(x => `행 ${x.rowNumber}`).join("\n");
        }
        document.getElementById("excelDeleteResult").innerText = s;
        document.getElementById("excelDeleteExecuteSection").style.display = validDeleteRows.length > 0 ? "block" : "none";
      };
      reader.onerror = err => alert("읽기 오류:" + err);
      reader.readAsBinaryString(fileInput.files[0]);
    }

    function executeExcelMemberDeletion() {
      const token = $('#accessToken').val().trim();
      if (!token) { alert("먼저 Access Token 발급해주세요."); return; }
      const env = $('#envSelection').val();
      const baseUrl = env === 'custom'
        ? `${$('#customEnvUrl').val().trim().replace(/\/$/, '')}/v2.0/api/members`
        : memberUrlMap[env];
      const mailOpt = $('input[name="mailOptionDeleteExcel"]:checked').val();
      Promise.all(validDeleteRows.map(row => {
        let url = `${baseUrl}/${encodeURIComponent(row['id'] || row['account_id'])}`;
        if (mailOpt === 'false') url += '?mailOption=false';
        return fetch(url, {
          method: 'DELETE',
          headers: { 'accept': '*/*', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({})
        })
          .then(res => {
            if (!res.ok) return res.text().then(t => ({ error: `${res.status}`, response: t, row }));
            return res.text().then(t => t ? JSON.parse(t) : {}).then(data => ({ success: true, data, row }));
          })
          .catch(err => ({ error: err.toString(), row }));
      }))
        .then(results => {
          const successCount = results.filter(r => r.success).length;
          const errorCount = results.length - successCount;
          let summary = `엑셀 처리 완료 (삭제) 성공:${successCount} 실패:${errorCount}\n\n` + JSON.stringify(results, null, 2);
          document.getElementById("excelDeleteResult").innerText = summary;
        });
    }

    function validateExcelFileForUpdate() {
      const fileInput = document.getElementById("excelFileUpdateInput");
      if (!fileInput.files || !fileInput.files.length) { alert("파일 선택"); return; }
      const reader = new FileReader();
      reader.onload = e => {
        let wb;
        try { wb = XLSX.read(e.target.result, { type: 'binary' }); }
        catch (err) { alert("파싱 오류:" + err); return; }
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        validUpdateRows = []; invalidUpdateRows = [];
        rows.forEach((row, i) => {
          const id = row['id'] || "";
          const hasField = row['name'] || row['enabled'] || row['contact_number'] || row['contact_tel'] || row['department'] || row['position'] || row['role'];
          if (id && hasField) validUpdateRows.push(row);
          else invalidUpdateRows.push({ rowNumber: i + 2 });
        });
        let s = `검증 완료 수정\n총:${rows.length} 유효:${validUpdateRows.length} 오류:${invalidUpdateRows.length}\n`;
        if (invalidUpdateRows.length) {
          s += "오류 행 번호:\n" + invalidUpdateRows.map(x => `행 ${x.rowNumber}`).join("\n");
        }
        document.getElementById("excelUpdateResult").innerText = s;
        document.getElementById("excelUpdateExecuteSection").style.display = validUpdateRows.length > 0 ? "block" : "none";
      };
      reader.onerror = err => alert("읽기 오류:" + err);
      reader.readAsBinaryString(fileInput.files[0]);
    }

    function executeExcelMemberUpdate() {
      const token = $('#accessToken').val().trim();
      if (!token) { alert("먼저 Access Token 발급해주세요."); return; }
      const env = $('#envSelection').val();
      const baseUrl = env === 'custom'
        ? `${$('#customEnvUrl').val().trim().replace(/\/$/, '')}/v2.0/api/members`
        : memberUrlMap[env];
      Promise.all(validUpdateRows.map(row => {
        let id = row['id'] || "";
        let updateObj = { id };
        if (row['name']) updateObj.name = row['name'];
        if (row['enabled']) updateObj.enabled = (row['enabled'].toString().toLowerCase() === 'true');
        if (row['contact_number']) updateObj.contact = Object.assign(updateObj.contact || {}, { number: row['contact_number'] });
        if (row['contact_tel']) updateObj.contact = Object.assign(updateObj.contact || {}, { tel: row['contact_tel'] });
        if (row['department']) updateObj.department = row['department'];
        if (row['position']) updateObj.position = row['position'];
        if (row['role']) updateObj.role = row['role'].split(',').map(s => s.trim());

        const requestBody = { account: updateObj };
        const url = `${baseUrl}/${encodeURIComponent(id)}`;

        return fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify(requestBody)
        })
          .then(res => {
            if (!res.ok) return res.text().then(t => ({ error: `${res.status}`, response: t, row }));
            return res.json().then(data => ({ success: true, data, row }));
          })
          .catch(err => ({ error: err.toString(), row }));
      }))
        .then(results => {
          const successCount = results.filter(r => r.success).length;
          const errorCount = results.length - successCount;
          let summary = `엑셀 처리 완료 (수정) 성공:${successCount} 실패:${errorCount}\n\n` + JSON.stringify(results, null, 2);
          document.getElementById("excelUpdateResult").innerText = summary;
        });
    }
    function downloadGroupTemplate() {
      // 엑셀 템플릿 생성 (name, description, members)
      var wb = XLSX.utils.book_new();
      var wsData = [
        ["name", "description", "members"],
        ["테스트그룹", "클라우드팀", "test1@forcs.com,test2@forcs.com"]
      ];
      var ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, "GroupTemplate");
      var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      function s2ab(s) {
        var buf = new ArrayBuffer(s.length), view = new Uint8Array(buf);
        for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
      }
      var blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = "group_template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    var validGroupRows = [], invalidGroupRows = [];
    function validateExcelGroupFile() {
      var fileInput = document.getElementById("excelGroupFileInput");
      if (!fileInput.files || !fileInput.files.length) {
        alert("엑셀 파일을 선택해주세요.");
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        var wb = XLSX.read(e.target.result, { type: 'binary' });
        var rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        validGroupRows = []; invalidGroupRows = [];
        rows.forEach(function (row, idx) {
          if (row.name && row.members) {
            validGroupRows.push(row);
          } else {
            invalidGroupRows.push(idx + 2);
          }
        });
        var msg = "검증 완료\n총 행: " + rows.length +
          "\n유효 행: " + validGroupRows.length +
          "\n오류 행: " + invalidGroupRows.length;
        if (invalidGroupRows.length) {
          msg += "\n오류 행 번호: " + invalidGroupRows.join(", ");
        }
        document.getElementById("excelGroupResult").innerText = msg;
        document.getElementById("excelGroupExecuteSection").style.display = validGroupRows.length ? "block" : "none";
      };
      reader.readAsBinaryString(fileInput.files[0]);
    }

    function executeExcelGroupAddition() {
      const token = document.getElementById("accessToken").value.trim();
      if (!token) return alert("먼저 Access Token을 발급받아주세요.");

      // ① Base URL 결정 (custom 포함)
      let baseUrl;
      const env = document.getElementById("envSelection").value;
      if (env === "custom") {
        const b = document.getElementById("customEnvUrl").value.trim().replace(/\/$/, "");
        if (!b) return alert("사용자 지정 Base URL을 입력해주세요.");
        baseUrl = b + "/v2.0/api/groups";
      } else {
        baseUrl = env === "op_saas"
          ? "https://kr-api.eformsign.com/v2.0/api/groups"
          : "https://www.gov-eformsign.com/Service/v2.0/api/groups";
      }

      // ② 모든 행에 대해 fetch → JSON 파싱 → 성공/실패 객체 생성
      const promises = validGroupRows.map(row => {
        const membersArray = row.members.split(",").map(s => s.trim());
        const body = { group: { name: row.name, description: row.description || "", members: membersArray } };

        return fetch(baseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify(body)
        })
          .then(res => {
            if (!res.ok) {
              // 실패 시 서버가 남긴 메시지를 텍스트로 읽어서 에러로 던져줍니다
              return res.text().then(txt => { throw new Error(txt || `HTTP ${res.status}`) });
            }
            // 성공 시 JSON body 로 파싱
            return res.json();
          })
          .then(json => {
            return { success: true, row: row, response: json };
          })
          .catch(err => {
            return { success: false, row: row, error: err.toString() };
          });
      });

      // ③ 모든 요청이 끝나면 결과 요약 + 디테일 출력
      Promise.all(promises).then(results => {
        const successCount = results.filter(r => r.success).length;
        const errorCount = results.length - successCount;
        const out = {
          summary: `엑셀 그룹 추가 완료 (성공 ${successCount}건, 실패 ${errorCount}건)`,
          details: results
        };
        // <pre> 태그 안에 들여쓰기 있는 JSON 으로 출력
        $('#excelGroupResult').text(JSON.stringify(out, null, 2));
      });
    }
    // === 엑셀 템플릿 다운로드 (삭제) ===
    function downloadGroupDeleteTemplate() {
      const wb = XLSX.utils.book_new();
      const wsData = [
        ['group_ids'],
        ['a1b1f52d896044f6a651624f0f5114ab,b2c2d63e907155g7h762735g1h6225bc']
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'DeleteTemplate');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      function s2ab(s) {
        const buf = new ArrayBuffer(s.length), view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
      }
      const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'group_delete_template.xlsx';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    // === 엑셀 검증 (삭제) ===
    let validGroupDeleteRows = [], invalidGroupDeleteRows = [];
    function validateExcelGroupDeleteFile() {
      const input = document.getElementById('excelGroupDeleteFileInput');
      if (!input.files.length) return alert('파일을 선택해주세요.');
      const reader = new FileReader();
      reader.onload = e => {
        const wb = XLSX.read(e.target.result, { type: 'binary' });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        validGroupDeleteRows = []; invalidGroupDeleteRows = [];
        rows.forEach((r, i) => {
          if (r.group_ids) validGroupDeleteRows.push(r.group_ids.split(',').map(s => s.trim()).filter(s => s));
          else invalidGroupDeleteRows.push(i + 2);
        });
        let msg = `검증 완료\n총행:${rows.length} 유효행:${validGroupDeleteRows.length} 오류행:${invalidGroupDeleteRows.length}`;
        if (invalidGroupDeleteRows.length) msg += `\n오류행 번호: ${invalidGroupDeleteRows.join(',')}`;
        $('#excelGroupDeleteResult').text(msg);
        $('#excelGroupDeleteExecuteSection').toggle(validGroupDeleteRows.length > 0);
      };
      reader.readAsBinaryString(input.files[0]);
    }

    // === 엑셀로 그룹 삭제 실행 ===
    function executeExcelGroupDeletion() {
      const token = $('#accessToken').val().trim();
      if (!token) return alert('먼저 Access Token을 발급받아주세요.');

      // Base URL 결정 (위 deleteGroups와 동일)
      let baseUrl, env = $('#envSelection').val();
      if (env === 'custom') {
        const b = $('#customEnvUrl').val().trim().replace(/\/$/, '');
        if (!b) return alert('사용자 지정 Base URL을 입력해주세요.');
        baseUrl = b + '/v2.0/api/groups';
      } else {
        baseUrl = env === 'op_saas'
          ? 'https://kr-api.eformsign.com/v2.0/api/groups'
          : 'https://www.gov-eformsign.com/Service/v2.0/api/groups';
      }

      const promises = validGroupDeleteRows.map(ids => {
        const body = { group_ids: ids };
        return fetch(baseUrl, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(body)
        })
          .then(res => {
            if (!res.ok) return res.text().then(txt => { throw new Error(txt || `HTTP ${res.status}`) });
            return res.json();
          })
          .then(json => ({ success: true, ids, response: json }))
          .catch(err => ({ success: false, ids, error: err.toString() }));
      });

      Promise.all(promises).then(results => {
        const ok = results.filter(r => r.success).length, fail = results.length - ok;
        const out = {
          summary: `엑셀 그룹 삭제 완료 (성공 ${ok}건, 실패 ${fail}건)`,
          details: results
        };
        $('#excelGroupDeleteResult').text(JSON.stringify(out, null, 2));
      });
    }
    function listGroups(viewType) {
      const token = $('#accessToken').val().trim();
      if (!token) return alert('먼저 Access Token을 발급받아주세요.');

      // Base URL 결정
      const env = $('#envSelection').val();
      let base = env === 'custom'
        ? $('#customEnvUrl').val().trim().replace(/\/$/, '')
        : env === 'op_saas'
          ? 'https://kr-api.eformsign.com'
          : 'https://www.gov-eformsign.com/Service';
      let url = `${base}/v2.0/api/groups`;

      // 쿼리스트링
       const params = [];
  if ($('#toggleIncludeMember').hasClass('on')) params.push('include_member=true');
  if ($('#toggleIncludeField').hasClass('on'))  params.push('include_field=true');
  if (params.length) url += '?' + params.join('&');

      // 뷰 토글
      if (viewType === 'json') {
        $('#groupJsonContainer').show();
        $('#groupTableContainer').hide();
      } else {
        $('#groupJsonContainer').hide();
        $('#groupTableContainer').show();
      }

      $('#groupListResultJson').text('조회 중...');
      $('#groupListResultTable tbody').empty();

      fetch(url, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
      })
        .then(res => res.json())
        .then(data => {
          // JSON
          $('#groupListResultJson').text(JSON.stringify(data, null, 2));

          if (viewType === 'table') {
            (data.groups || []).forEach(g => {
              const date = new Date(g.create_date).toLocaleString();
              const memberCount = Array.isArray(g.members) ? g.members.length : '-';
              $('#groupListResultTable tbody').append(`
          <tr>
            <td>${g.id}</td>
            <td>${g.name}</td>
            <td>${g.description || '-'}</td>
            <td>${memberCount}</td>
            <td>${date}</td>
          </tr>
        `);
            });
          }
        })
        .catch(err => {
          $('#groupListResultJson').text('조회 실패: ' + err);
        });
    }