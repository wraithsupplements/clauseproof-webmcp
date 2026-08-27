table "proof_case" {
  auth = false
  schema {
    int id
    text case_key filters=trim
    text title filters=trim
    text counterparty filters=trim
    enum status?="review" {
      values = ["review", "approved", "signature-ready", "signed"]
    }
    text document_name filters=trim
    json clauses?
    json findings?
    json evidence?
    timestamp created_at?=now
    timestamp updated_at?=now
  }
  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "case_key"}]}
    {type: "btree", field: [{name: "updated_at", op: "desc"}]}
  ]
}
