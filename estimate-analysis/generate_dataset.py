"""Generate a synthetic software-project effort-estimation dataset.

Each row is one development task with an *estimated* effort (made at
planning time) and the *actual* effort it took to complete, plus a few
features that plausibly influence estimation error (task type, developer
seniority, complexity, team size).
"""
import numpy as np
import pandas as pd

RNG_SEED = 42
N_ROWS = 500

TASK_TYPES = ["bug_fix", "new_feature", "refactor", "integration", "ui_design"]
SENIORITY = ["junior", "mid", "senior"]

# Rough base effort (hours) and how much each task type tends to be
# under/over-estimated in practice.
TASK_TYPE_BASE_HOURS = {
    "bug_fix": 6,
    "new_feature": 24,
    "refactor": 16,
    "integration": 20,
    "ui_design": 12,
}
TASK_TYPE_BIAS = {  # >1 means actual tends to exceed estimate
    "bug_fix": 1.15,
    "new_feature": 1.35,
    "refactor": 1.10,
    "integration": 1.45,
    "ui_design": 1.05,
}
SENIORITY_ACCURACY_NOISE = {  # relative std-dev of estimation error
    "junior": 0.45,
    "mid": 0.28,
    "senior": 0.15,
}


def generate(n_rows: int = N_ROWS, seed: int = RNG_SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    task_type = rng.choice(TASK_TYPES, size=n_rows)
    seniority = rng.choice(SENIORITY, size=n_rows, p=[0.35, 0.4, 0.25])
    complexity = rng.integers(1, 6, size=n_rows)  # 1 (trivial) - 5 (very complex)
    team_size = rng.integers(1, 5, size=n_rows)

    base_hours = np.array([TASK_TYPE_BASE_HOURS[t] for t in task_type])
    bias = np.array([TASK_TYPE_BIAS[t] for t in task_type])
    noise_scale = np.array([SENIORITY_ACCURACY_NOISE[s] for s in seniority])

    complexity_multiplier = 1 + (complexity - 1) * 0.35
    estimated_hours = np.round(
        base_hours * complexity_multiplier * rng.normal(1.0, 0.1, size=n_rows), 1
    )
    estimated_hours = np.clip(estimated_hours, 1, None)

    coordination_overhead = 1 + (team_size - 1) * 0.08
    noise = rng.normal(1.0, noise_scale, size=n_rows)
    actual_hours = np.round(
        estimated_hours * bias * coordination_overhead * noise, 1
    )
    actual_hours = np.clip(actual_hours, 1, None)

    df = pd.DataFrame(
        {
            "task_id": [f"T{i + 1:04d}" for i in range(n_rows)],
            "task_type": task_type,
            "developer_seniority": seniority,
            "complexity": complexity,
            "team_size": team_size,
            "estimated_hours": estimated_hours,
            "actual_hours": actual_hours,
        }
    )
    df["error_hours"] = np.round(df["actual_hours"] - df["estimated_hours"], 1)
    df["pct_error"] = np.round(100 * df["error_hours"] / df["estimated_hours"], 1)
    return df


if __name__ == "__main__":
    dataset = generate()
    out_path = "estimate-analysis/estimate_dataset.csv"
    dataset.to_csv(out_path, index=False)
    print(f"Wrote {len(dataset)} rows to {out_path}")
    print(dataset.head())
