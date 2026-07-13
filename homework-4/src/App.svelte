<script lang="ts">
  import { submitLeaveRequest } from "./lib/leave-service.js";
  import type { LeaveSubmissionResult, LeaveType } from "./lib/types.js";
  import { LEAVE_TYPE_LABELS } from "./lib/types.js";

  const leaveTypes: LeaveType[] = ["day-off", "vacation", "sick-leave"];

  let employeeName = $state("");
  let leaveType = $state<LeaveType>("day-off");
  let startDate = $state("");
  let endDate = $state("");
  let reason = $state("");
  let managerToken = $state("");

  let errors = $state<string[]>([]);
  let submission = $state<LeaveSubmissionResult | null>(null);

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    errors = [];
    submission = null;

    const outcome = submitLeaveRequest({
      employeeName,
      leaveType,
      startDate,
      endDate,
      reason,
      managerToken,
    });

    if (!outcome.ok) {
      errors = outcome.errors;
      return;
    }

    submission = outcome.result;
  }

  function resetForm() {
    employeeName = "";
    leaveType = "day-off";
    startDate = "";
    endDate = "";
    reason = "";
    managerToken = "";
    errors = [];
    submission = null;
  }
</script>

<main class="page">
  <header class="header">
    <h1>Leave request</h1>
    <p class="subtitle">Submit day off, vacation, or sick leave for manager approval.</p>
  </header>

  {#if submission}
    <section class="card success" aria-live="polite">
      <h2>Request submitted</h2>
      <dl class="summary">
        <div>
          <dt>Reference</dt>
          <dd>{submission.id}</dd>
        </div>
        <div>
          <dt>Employee</dt>
          <dd>{submission.employeeName}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{LEAVE_TYPE_LABELS[submission.leaveType]}</dd>
        </div>
        <div>
          <dt>Dates</dt>
          <dd>{submission.startDate} → {submission.endDate}</dd>
        </div>
        <div>
          <dt>Days</dt>
          <dd>{submission.days}</dd>
        </div>
      </dl>
      <div class="reason-block">
        <h3>Reason preview</h3>
        <!-- BUG-001d: unsanitized HTML from user input -->
        {@html submission.reasonHtml}
      </div>
      <button type="button" class="btn secondary" onclick={resetForm}>Submit another</button>
    </section>
  {:else}
    <form class="card form" onsubmit={handleSubmit}>
      {#if errors.length > 0}
        <ul class="errors" role="alert">
          {#each errors as error (error)}
            <li>{error}</li>
          {/each}
        </ul>
      {/if}

      <label class="field">
        <span>Employee name</span>
        <input bind:value={employeeName} name="employeeName" autocomplete="name" required />
      </label>

      <label class="field">
        <span>Leave type</span>
        <select bind:value={leaveType} name="leaveType">
          {#each leaveTypes as type (type)}
            <option value={type}>{LEAVE_TYPE_LABELS[type]}</option>
          {/each}
        </select>
      </label>

      <div class="row">
        <label class="field">
          <span>Start date</span>
          <input bind:value={startDate} name="startDate" type="date" required />
        </label>
        <label class="field">
          <span>End date</span>
          <input bind:value={endDate} name="endDate" type="date" required />
        </label>
      </div>

      <label class="field">
        <span>Reason</span>
        <textarea bind:value={reason} name="reason" rows="4" placeholder="Brief reason for leave" required></textarea>
      </label>

      <label class="field">
        <span>Manager approval token</span>
        <input
          bind:value={managerToken}
          name="managerToken"
          type="password"
          autocomplete="off"
          placeholder="Demo: mgr-approve-2026"
          required
        />
      </label>

      <button type="submit" class="btn primary">Submit request</button>
    </form>
  {/if}

  <footer class="footer">
    <p>Homework 4 — demo app (bugs intentionally seeded for agent pipeline).</p>
  </footer>
</main>
