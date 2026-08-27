query "health" verb=GET {
  api_group = "ClauseProof"
  description = "Return a deterministic health and capability receipt."
  input {}
  stack {
    var $service_status { value = "ok" }
  }
  response = {
    status: $service_status,
    service: "clauseproof",
    durable_case_store: true,
    audit_receipts: true,
    live_evidence_provider: "serpapi"
  }
}
