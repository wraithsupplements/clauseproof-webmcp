query "demo/bootstrap" verb=POST {
  api_group = "ClauseProof"
  description = "Idempotently create the one synthetic public demonstration case without accepting document content."
  input {}
  stack {
    db.get "proof_case" {
      field_name = "case_key"
      field_value = "PR-260826-01"
    } as $case_record

    var $case_created { value = false }
    var $result_case { value = $case_record }

    conditional {
      if ($case_record == null) {
        db.add "proof_case" {
          data = {
            case_key: "PR-260826-01",
            title: "Northstar supply agreement",
            counterparty: "Northstar Components",
            status: "review",
            document_name: "Northstar_Services_Agreement.pdf"
          }
        } as $created_case

        var.update $result_case { value = $created_case }
        var.update $case_created { value = true }
      }
    }
  }
  response = {
    case_key: $result_case.case_key,
    created: $case_created,
    synthetic_only: true,
    document_bytes_stored: false
  }
}
