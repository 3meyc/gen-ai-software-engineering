<script lang="ts">
  import {
    fetchResults,
    fetchSummary,
    runPipeline,
    type PipelineSummary,
    type TransactionResult,
  } from "./lib/api.js";

  let loading = $state(false);
  let error = $state<string | null>(null);
  let summary = $state<PipelineSummary | null>(null);
  let results = $state<TransactionResult[]>([]);

  function displayStatus(row: TransactionResult): string {
    return row.final_status ?? row.status ?? "—";
  }

  async function loadData() {
    error = null;
    try {
      summary = await fetchSummary();
      results = await fetchResults();
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load data";
    }
  }

  async function handleRunPipeline() {
    loading = true;
    error = null;
    try {
      summary = await runPipeline();
      results = await fetchResults();
    } catch (err) {
      error = err instanceof Error ? err.message : "Pipeline run failed";
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    loadData();
  });
</script>

<main class="page">
  <header class="header">
    <h1>Transaction Pipeline</h1>
    <p class="subtitle">
      Run the validation → fraud detection → compliance pipeline and inspect results.
    </p>
  </header>

  <div class="toolbar">
    <button type="button" onclick={handleRunPipeline} disabled={loading}>
      {loading ? "Running…" : "Run Pipeline"}
    </button>
    <button type="button" class="secondary" onclick={loadData} disabled={loading}>
      Refresh
    </button>
  </div>

  {#if error}
    <div class="error" role="alert">{error}</div>
  {/if}

  {#if summary}
    <section class="cards" aria-label="Pipeline summary">
      <div class="card">
        <div class="label">Total</div>
        <div class="value">{summary.total}</div>
      </div>
      <div class="card">
        <div class="label">Approved</div>
        <div class="value">{summary.approved}</div>
      </div>
      <div class="card">
        <div class="label">Fraud review</div>
        <div class="value">{summary.fraud_review}</div>
      </div>
      <div class="card">
        <div class="label">Rejected</div>
        <div class="value">{summary.rejected}</div>
      </div>
      <div class="card">
        <div class="label">Compliance flagged</div>
        <div class="value">{summary.compliance_flagged}</div>
      </div>
    </section>
  {:else if !loading && !error}
    <p class="empty">No pipeline summary yet. Click Run Pipeline to process transactions.</p>
  {/if}

  <section class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Transaction ID</th>
          <th>Status</th>
          <th>Risk score</th>
          <th>Compliance</th>
          <th>Amount</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody>
        {#if results.length === 0}
          <tr>
            <td colspan="6">No results yet.</td>
          </tr>
        {:else}
          {#each results as row (row.transaction_id)}
            <tr>
              <td>{row.transaction_id}</td>
              <td>
                <span class="status {displayStatus(row)}">{displayStatus(row)}</span>
              </td>
              <td>{row.risk_score ?? "—"}</td>
              <td>{row.compliance_status ?? "—"}</td>
              <td>
                {#if row.amount && row.currency}
                  {row.amount} {row.currency}
                {:else}
                  —
                {/if}
              </td>
              <td>{row.reason ?? "—"}</td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </section>
</main>
