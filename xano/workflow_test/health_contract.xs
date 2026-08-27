workflow_test "health_contract" {
  stack {
    api.call "health" verb=GET {
      api_group = "ClauseProof"
    } as $health

    expect.to_be_defined ($health)
  }
  tags = ["clauseproof", "contract"]
}
