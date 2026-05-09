import "../styles/weekreview.css";
import { useEffect, useState } from "react";
import apiClient, { reviewApi } from "../api/client";
import { useToast } from "../toast";
const getWeekRangeString = (start: Date, end: Date) => {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
};

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const WeekReviewPage = () => {
  const [stats, setStats] = useState({
    total: "—",
    completed: "—",
    pending: "—",
    rate: "—",
  });
  const [weekRange, setWeekRange] = useState("");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const toast = useToast();

  useEffect(() => {
    console.log("Fetching weekly summary with timezone:", timezone);
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(
          `/todos/stats?timezone=${encodeURIComponent(timezone)}`,
        );
        const data = res.data;
        console.log("weekly-summary data:", data);
        setStats({
          total: String(data.total),
          completed: String(data.completed),
          pending: String(data.total - data.completed),
          rate: String(data.rate) + "%",
        });
        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        const day = today.getDay();

        const monday = new Date(today);
        monday.setDate(today.getDate() - ((day + 6) % 7));
        setWeekRange(getWeekRangeString(monday, today));
      } catch (e) {
        setStats({ total: "—", completed: "—", pending: "—", rate: "—" });
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  return (
    <div className="wr-layout">
      {/* ── Left panel ── */}
      <div className="wr-left">
        {/* Week selector — no arrows per design */}
        <div className="wr-card">
          <span className="wr-section-label">Week</span>
          <div className="wr-week-display">
            <span className="wr-week-range">{weekRange}</span>
            <span className="wr-week-sub">This week</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="wr-card">
          <span className="wr-section-label">This week's data</span>
          <div className="wr-stats-grid">
            <div className="wr-stat-box">
              <span className="wr-stat-value">{stats.total}</span>
              <span className="wr-stat-label">Todos</span>
            </div>
            <div className="wr-stat-box">
              <span className="wr-stat-value">{stats.completed}</span>
              <span className="wr-stat-label">Completed</span>
            </div>
            <div className="wr-stat-box">
              <span className="wr-stat-value">{stats.pending}</span>
              <span className="wr-stat-label">Pending</span>
            </div>
            <div className="wr-stat-box">
              <span className="wr-stat-value">{stats.rate}</span>
              <span className="wr-stat-label">Rate</span>
            </div>
          </div>
          {loading && <div className="wr-loading">Loading...</div>}
        </div>

        {/* Tags */}
        {/* <div className="wr-card">
          <span className="wr-section-label">Tags this week</span>
          {TAGS.length > 0 ? (
            <div className="wr-tags">
              {TAGS.map((t) => (
                <span key={t} className="wr-tag">
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <p className="wr-empty">No tags yet.</p>
          )}
        </div> */}

        {/* Past reviews
        <div className="wr-card wr-card--grow">
          <span className="wr-section-label">Past reviews</span>
          <div className="wr-past-list">
            {PAST_REVIEWS.map((r) => (
              <div key={r.range} className="wr-past-item">
                <div>
                  <div className="wr-past-range">{r.range}</div>
                  <div className="wr-past-generated">{r.generated}</div>
                </div>
                <button className="wr-view-btn">View</button>
              </div>
            ))}
          </div>
        </div> */}

        {/* Generate button */}
        <button
          className="wr-generate-btn"
          disabled={generating}
          onClick={async () => {
            setGenerating(true);
            try {
              const res = await reviewApi.performWeekReview();
              setSummary(res.data.summary);
              toast.success("Weekly review generated.");
            } catch {
              toast.error(
                "Failed to generate weekly review. Please try again.",
              );
            } finally {
              setGenerating(false);
            }
          }}
        >
          {generating ? "Generating…" : "Generate this week's review ↗"}
        </button>
      </div>

      {/* ── Right panel ── */}
      <div className="wr-right">
        <span className="wr-section-label">Week Review</span>
        <div className="wr-review-body">
          {summary ? (
            summary.split("\n").map((line, i) => <p key={i}>{line}</p>)
          ) : (
            <p className="wr-review-placeholder">
              No review generated yet.
              <br />
              Click <strong>Generate this week's review</strong> to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
