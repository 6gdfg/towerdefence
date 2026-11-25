# Reward Validation

## Deployment

- No new public API endpoints: the deployment still has 12 serverless functions.
- Set a NEW private `ADMIN_PASSWORD` in Vercel, at least 8 characters. Do not use
  a `VITE_` prefix or the password previously published in source code. Without
  this setting, level review is deliberately disabled; normal play is unaffected.
- Existing `AUTH_SECRET` and Neon connection settings remain required.
- Migration `020_reward_sessions` runs through the existing deployment migration
  command. It creates tables, without resetting player progress or assets.
- Deploy frontend and API together. Old browser tabs must refresh before starting
  another rewarded campaign or practice round; legacy unbound claims are rejected.
- Delete or protect old vulnerable Vercel deployments/preview URLs that can still
  access the same database. Updating the production alias does not patch old
  functions. Rotating the database credentials is another way to cut off their
  access, but update the current deployment's connection settings at the same time.

## Guarantees

- Campaign rewards require a server-issued, account-bound run. The configured
  level/difficulty and unlock rules are checked at start. Selected challenges,
  star, starting health and spawn-time lower bound are stored by the server.
- Final health and completed waves are range-checked. Stars, challenge diamonds,
  unlocks and chest/coin rewards are calculated by the server, not accepted as
  reward amounts from a client.
- Claim consumption, progress, currency and chest awards commit atomically.
  Recent successful campaign responses are cached for retries. Pruning a cached
  response does not make an old run claimable again.
- Chest opening/crafting and garden harvesting require actual inventory/crop
  consumption in the same transaction as rewards. Overlapping requests cannot
  duplicate awards. Failures roll back inventory consumption too.
- Upgrades and task claims atomically save state and debit/credit resources.
- Daily practice uses server-selected questions, submitted answer indices and
  server scoring. A completed run pays once, with a conservative 50-second minimum
  for a 50-question round. Normal repeat practice remains valid.

## Cost And Limits

- One campaign row and one practice row per player; at most 20 recent campaign
  receipts per player. No per-frame logs or permanent answer-history table.
- Campaign and daily practice each require an additional start request. Daily
  practice submits all 50 answers together, rather than making 50 scoring requests.
- These checks do not require paid infrastructure. Actual free-tier usage still
  depends on traffic, database activity and abuse; monitor Vercel and Neon usage.
- This is NOT authoritative combat simulation. A determined modified client can
  still wait out the lower bound and fabricate plausible health/wave values.
  Server replay/simulation would be a separate, substantially larger project.
- The word bank is public for browsing. Automated dictionary solving remains
  possible; server scoring prevents invented scores, not every form of botting.
- Existing fraudulent assets are not removed automatically.
