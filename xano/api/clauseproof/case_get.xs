query "case/{case_key}" verb=GET {
  api_group = "ClauseProof"
  description = "Read one durable ClauseProof case and its bounded recent audit receipts."
  input {
    text case_key filters=trim
  }
  stack {
    db.get "proof_case" {
      field_name = "case_key"
      field_value = $input.case_key
    } as $case_record

    precondition ($case_record != null) {
      error_type = "notfound"
      error = "ClauseProof case not found"
    }

    db.query "audit_event" {
      where = $db.audit_event.case_key == $input.case_key
      sort = {created_at: "desc"}
      return = {type: "list", paging: {page: 1, per_page: 25}}
    } as $audit_records
  }
  response = {case: $case_record, audit: $audit_records}
}
