table "audit_event" {
  auth = false
  schema {
    int id
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
    timestamp created_at?=now
  }
  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "case_key"}, {name: "created_at", op: "desc"}]}
    {type: "btree", field: [{name: "session_id"}]}
  ]
}
