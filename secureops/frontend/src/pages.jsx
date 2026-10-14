import { useApi, Card, Status, Table, Empty, SampleBadge, LineChart } from "./ui.jsx";

const Loading = ({ state }) =>
  state.error ? <Card><p className="text-red-500">{state.error}</p></Card> : <Empty>Loading…</Empty>;

const sha = (s) => <code className="text-xs">{(s || "").slice(0, 7)}</code>;

export function Overview() {
  const s = useApi("/api/overview");
  if (!s.data) return <Loading state={s} />;
  const d = s.data;
  return (
    <div className="space-y-4">
      {d.hasSampleData && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          Some rows are labelled sample data. Remove them with <code>npm run seed:sample -- --clear</code>.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Pipeline"><Status value={d.pipeline?.status} /><p className="mt-1 text-xs text-slate-500">{d.pipeline ? `commit ${d.pipeline.commit_sha.slice(0, 7)}` : "No runs yet"}</p></Card>
        <Card title="Current version"><p className="text-2xl font-semibold">{d.currentVersion || "none"}</p></Card>
        <Card title="Application health">
          {d.health ? <><Status value={d.health.ok ? "healthy" : "unhealthy"} /><p className="mt-1 text-xs text-slate-500">{d.health.responseMs} ms</p></> : <Status value="unknown" />}
        </Card>
        <Card title="Security gate"><Status value={d.gate.gate} /><p className="mt-1 text-xs text-slate-500">{d.gate.reason}</p></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Recent deployments">
          <Table empty="No deployments yet." rows={d.recentDeployments} columns={[
            { label: "Version", render: (r) => <>{r.version}<SampleBadge source={r.source} /></> },
            { label: "Status", render: (r) => <Status value={r.status} /> },
            { label: "When", render: (r) => r.created_at }]} />
        </Card>
        <Card title="Incidents">
          <Table empty="No incidents." rows={d.incidents} columns={[
            { label: "Title", render: (r) => <>{r.title}<SampleBadge source={r.source} /></> },
            { label: "Status", render: (r) => <Status value={r.status} /> },
            { label: "Opened", render: (r) => r.created_at }]} />
        </Card>
      </div>
    </div>
  );
}

export function Pipeline() {
  const s = useApi("/api/pipeline");
  if (!s.data) return <Loading state={s} />;
  return (
    <Card title="Workflow runs">
      <Table empty="No pipeline runs recorded yet. They appear after CI results are ingested (next stage)." rows={s.data} columns={[
        { label: "Commit", render: (r) => <>{sha(r.commit_sha)}<SampleBadge source={r.source} /></> },
        { label: "Branch", render: (r) => r.branch || "-" },
        { label: "Status", render: (r) => <Status value={r.status} /> },
        { label: "Tests", render: (r) => <Status value={r.tests_status} /> },
        { label: "Security", render: (r) => <Status value={r.security_status} /> },
        { label: "Workflow", render: (r) => r.workflow_url ? <a className="text-teal-600 underline dark:text-teal-400" href={r.workflow_url} target="_blank" rel="noreferrer">open</a> : "-" }]} />
    </Card>
  );
}

export function Security() {
  const s = useApi("/api/security");
  if (!s.data) return <Loading state={s} />;
  return (
    <div className="space-y-4">
      <Card title="Release gate"><Status value={s.data.gate} /><p className="mt-1 text-sm text-slate-500">{s.data.reason}</p></Card>
      <Card title="Trivy and Gitleaks findings">
        <Table empty="No findings recorded." rows={s.data.findings} columns={[
          { label: "Tool", render: (r) => r.tool },
          { label: "Severity", render: (r) => <Status value={["CRITICAL", "HIGH"].includes(r.severity) ? "failed" : "unknown"} /> },
          { label: "Level", render: (r) => r.severity },
          { label: "Finding", render: (r) => <>{r.title}<SampleBadge source={r.source} /></> }]} />
      </Card>
    </div>
  );
}

export function Monitoring() {
  const s = useApi("/api/monitoring");
  if (!s.data) return <Loading state={s} />;
  const { summary, records, alerts } = s.data;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Checks (last 60)"><p className="text-2xl font-semibold">{summary.checks}</p></Card>
        <Card title="Error rate"><p className="text-2xl font-semibold">{summary.errorRatePct}%</p></Card>
        <Card title="Avg response"><p className="text-2xl font-semibold">{summary.avgResponseMs ?? "-"} ms</p></Card>
      </div>
      <Card title="Response time (ms), measured by the backend"><LineChart values={records.map((r) => r.response_ms)} /></Card>
      <Card title="Active alerts">
        <Table empty="No active alerts." rows={alerts} columns={[
          { label: "Alert", render: (r) => r.title }, { label: "Since", render: (r) => r.created_at }]} />
      </Card>
    </div>
  );
}

export function Deployments() {
  const s = useApi("/api/deployments");
  if (!s.data) return <Loading state={s} />;
  return (
    <Card title="Version history">
      <Table empty="No deployments yet. The deployer arrives in the next stage." rows={s.data} columns={[
        { label: "Version", render: (r) => <>{r.version}<SampleBadge source={r.source} /></> },
        { label: "Commit", render: (r) => sha(r.commit_sha) },
        { label: "Status", render: (r) => <Status value={r.status} /> },
        { label: "Health", render: (r) => r.health_result || "-" },
        { label: "When", render: (r) => r.created_at }]} />
    </Card>
  );
}

export function Rollback() {
  const s = useApi("/api/rollbacks");
  if (!s.data) return <Loading state={s} />;
  return (
    <Card title="Rollback history">
      <Table empty="No rollbacks have happened." rows={s.data} columns={[
        { label: "From", render: (r) => <>{r.from_version}<SampleBadge source={r.source} /></> },
        { label: "To", render: (r) => r.to_version },
        { label: "Reason", render: (r) => r.reason },
        { label: "Recovery verified", render: (r) => <Status value={r.recovery_verified ? "passed" : "failed"} /> },
        { label: "When", render: (r) => r.created_at }]} />
    </Card>
  );
}
