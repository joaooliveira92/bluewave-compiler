**Type:** task
**Status:** resolved

Contract rollup plan confirmed:

The 15 `*_v1` contracts listed in the question are correct and sufficient. All follow D-1 naming convention. Validate function: `validateAllCarrierOperationsContracts` fail-closed. Additional consideration: a single `SHIPPED_CARRIER_OPERATIONS_CONTRACT` constant may reference all 15 for central validation — confirm during IMPL if this pattern is preferred or if individual `*_v1` exports suffice (follow what D-1 INC-9 did).