query "audit" verb=POST {
  api_group = "ClauseProof"
  description = "Append a constrained receipt for a synthetic demonstration action; never stores uploaded document bytes."
  input {
    text case_key filters=trim
    text session_id filters=trim
    enum actor {
      values = ["human", "agent", "system", "integration"]
    }
    text action filters=trim
    enum outcome {
      values = ["completed", "blocked", "proposed"]
    }
    text detail filters=trim
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

    db.add "audit_event" {
      data = {
        case_key: $input.case_key,
        session_id: $input.session_id,
        actor: $input.actor,
        action: $input.action,
        outcome: $input.outcome,
        detail: $input.detail
      }
    } as $receipt
  }
  response = {
    receipt_id: $receipt.id,
    recorded: true,
    document_bytes_stored: false,
    external_action_executed: false
  }
}
