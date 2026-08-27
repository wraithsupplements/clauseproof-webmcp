table "evidence_check" {
  auth = false
  schema {
    int id
    text case_key filters=trim
    enum provider {
      values = ["serpapi"]
    }
    text query filters=trim
    json result
    timestamp checked_at?=now
  }
  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "case_key"}, {name: "checked_at", op: "desc"}]}
  ]
}
