query "case/{case_key}/counterparty-evidence" verb=GET {
  api_group = "ClauseProof"
  description = "Run one bounded SerpApi counterparty evidence search and persist its structured receipt."
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

    precondition ($env.SERPAPI_API_KEY != null) {
      error_type = "standard"
      error = "SerpApi is not configured"
    }

    var $search_query {
      value = $case_record.counterparty ~ " reviews lawsuits sanctions"
    }

    api.request {
      url = "https://serpapi.com/search.json"
      method = "GET"
      params = {
        engine: "google",
        q: $search_query,
        api_key: $env.SERPAPI_API_KEY,
        num: 5
      }
      timeout = 20
    } as $serp_result

    precondition ($serp_result.response.status == 200) {
      error_type = "standard"
      error = "SerpApi evidence search failed"
    }

    db.add "evidence_check" {
      data = {
        case_key: $input.case_key,
        provider: "serpapi",
        query: $search_query,
        result: $serp_result.response.result
      }
    } as $evidence_receipt
  }
  response = {
    receipt_id: $evidence_receipt.id,
    provider: "serpapi",
    checked_at: $evidence_receipt.checked_at,
    query: $search_query,
    result: $serp_result.response.result
  }
}
