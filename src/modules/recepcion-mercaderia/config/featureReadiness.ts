// Hardcoded readiness signal (Resolved Decision in design.md): no backend health/capability
// probe. Flip manually via config change + redeploy.
export interface FeatureReadiness {
  pendingTransfersReady: boolean
}

export const featureReadiness: FeatureReadiness = {
  // GET /pending-transfers + POST .../materialize confirmed working against real SAP-sourced
  // data (warehouse RL-QSS2, manually synced cache table, not a live query).
  pendingTransfersReady: true,
}
