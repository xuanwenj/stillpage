import "../styles/weekreview.css";

// --- Placeholder data (replace with real state/props later) ---
const WEEK_RANGE = "Apr 21 – Apr 27";
const WEEK_SUBLABEL = "This week";

const STATS = [
  { value: "—", label: "Notes" },
  { value: "—", label: "Todos" },
  { value: "—", label: "Completed" },
  { value: "—", label: "Rate" },
];

const TAGS: string[] = [];

const PAST_REVIEWS = [
  { range: "Apr 14 – Apr 20", generated: "Generated Apr 21" },
  { range: "Apr 7 – Apr 13", generated: "Generated Apr 14" },
];

// ---------------------------------------------------------------

export const WeekReviewPage = () => {
  return (
    <div className="wr-layout">
      {/* ── Left panel ── */}
      <div className="wr-left">
        {/* Week selector — no arrows per design */}
        <div className="wr-card">
          <span className="wr-section-label">Week</span>
          <div className="wr-week-display">
            <span className="wr-week-range">{WEEK_RANGE}</span>
            <span className="wr-week-sub">{WEEK_SUBLABEL}</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="wr-card">
          <span className="wr-section-label">This week's data</span>
          <div className="wr-stats-grid">
            {STATS.map((s) => (
              <div key={s.label} className="wr-stat-box">
                <span className="wr-stat-value">{s.value}</span>
                <span className="wr-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="wr-card">
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
        </div>

        {/* Past reviews */}
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
        </div>

        {/* Generate button */}
        <button className="wr-generate-btn">
          Generate this week's review&nbsp;↗
        </button>
      </div>

      {/* ── Right panel ── */}
      <div className="wr-right">
        <span className="wr-section-label">Week Review</span>
        <div className="wr-review-body">
          <p className="wr-review-placeholder">
            No review generated yet.
            <br />
            Click <strong>Generate this week's review</strong> to get started.
          </p>
        </div>
      </div>
    </div>
  );
};
