"""Analyze the synthetic effort-estimation dataset.

Computes standard estimation-accuracy metrics (MAE, RMSE, MAPE, bias),
breaks them down by task type and developer seniority, and saves a few
charts plus a text summary report.
"""
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

DATA_PATH = "estimate-analysis/estimate_dataset.csv"
OUTPUT_DIR = "estimate-analysis/output"


def load_data(path: str = DATA_PATH) -> pd.DataFrame:
    return pd.read_csv(path)


def overall_metrics(df: pd.DataFrame) -> dict:
    error = df["actual_hours"] - df["estimated_hours"]
    abs_error = error.abs()
    pct_error = 100 * error / df["estimated_hours"]

    return {
        "n_tasks": len(df),
        "mae_hours": abs_error.mean(),
        "rmse_hours": np.sqrt((error**2).mean()),
        "mape_pct": pct_error.abs().mean(),
        "mean_bias_hours": error.mean(),  # positive => systematic under-estimation
        "pct_over_budget": (error > 0).mean() * 100,
        "total_estimated_hours": df["estimated_hours"].sum(),
        "total_actual_hours": df["actual_hours"].sum(),
    }


def breakdown_by(df: pd.DataFrame, column: str) -> pd.DataFrame:
    grouped = df.groupby(column).apply(
        lambda g: pd.Series(
            {
                "n_tasks": len(g),
                "mae_hours": (g["actual_hours"] - g["estimated_hours"]).abs().mean(),
                "mean_bias_hours": (g["actual_hours"] - g["estimated_hours"]).mean(),
                "mape_pct": (100 * (g["actual_hours"] - g["estimated_hours"]) / g["estimated_hours"])
                .abs()
                .mean(),
            }
        ),
        include_groups=False,
    )
    return grouped.round(2).sort_values("mape_pct", ascending=False)


def make_charts(df: pd.DataFrame, out_dir: str) -> None:
    os.makedirs(out_dir, exist_ok=True)

    # 1. Estimated vs actual scatter
    fig, ax = plt.subplots(figsize=(6, 6))
    ax.scatter(df["estimated_hours"], df["actual_hours"], alpha=0.5, s=20)
    lim = max(df["estimated_hours"].max(), df["actual_hours"].max()) * 1.05
    ax.plot([0, lim], [0, lim], "r--", label="perfect estimate")
    ax.set_xlabel("Estimated hours")
    ax.set_ylabel("Actual hours")
    ax.set_title("Estimated vs Actual Effort")
    ax.legend()
    fig.tight_layout()
    fig.savefig(os.path.join(out_dir, "estimated_vs_actual.png"), dpi=150)
    plt.close(fig)

    # 2. Error distribution histogram
    fig, ax = plt.subplots(figsize=(6, 4))
    ax.hist(df["pct_error"], bins=30, color="steelblue", edgecolor="white")
    ax.axvline(0, color="black", linewidth=1)
    ax.set_xlabel("Percent error ((actual - estimated) / estimated * 100)")
    ax.set_ylabel("Number of tasks")
    ax.set_title("Distribution of Estimation Error")
    fig.tight_layout()
    fig.savefig(os.path.join(out_dir, "error_distribution.png"), dpi=150)
    plt.close(fig)

    # 3. MAPE by task type
    by_type = breakdown_by(df, "task_type")
    fig, ax = plt.subplots(figsize=(6, 4))
    ax.bar(by_type.index, by_type["mape_pct"], color="darkorange")
    ax.set_ylabel("Mean absolute percent error (%)")
    ax.set_title("Estimation Error by Task Type")
    ax.tick_params(axis="x", rotation=30)
    fig.tight_layout()
    fig.savefig(os.path.join(out_dir, "mape_by_task_type.png"), dpi=150)
    plt.close(fig)

    # 4. MAPE by developer seniority
    by_seniority = breakdown_by(df, "developer_seniority")
    fig, ax = plt.subplots(figsize=(6, 4))
    order = ["junior", "mid", "senior"]
    by_seniority = by_seniority.reindex(order)
    ax.bar(by_seniority.index, by_seniority["mape_pct"], color="seagreen")
    ax.set_ylabel("Mean absolute percent error (%)")
    ax.set_title("Estimation Error by Developer Seniority")
    fig.tight_layout()
    fig.savefig(os.path.join(out_dir, "mape_by_seniority.png"), dpi=150)
    plt.close(fig)


def write_report(df: pd.DataFrame, out_dir: str) -> None:
    metrics = overall_metrics(df)
    by_type = breakdown_by(df, "task_type")
    by_seniority = breakdown_by(df, "developer_seniority")
    by_complexity = breakdown_by(df, "complexity")

    lines = []
    lines.append("Effort Estimation Analysis Report")
    lines.append("=" * 40)
    lines.append("")
    lines.append(f"Tasks analyzed: {metrics['n_tasks']}")
    lines.append(f"Total estimated hours: {metrics['total_estimated_hours']:.1f}")
    lines.append(f"Total actual hours:    {metrics['total_actual_hours']:.1f}")
    lines.append(
        f"Overall schedule variance: "
        f"{metrics['total_actual_hours'] - metrics['total_estimated_hours']:.1f} hours "
        f"({100 * (metrics['total_actual_hours'] / metrics['total_estimated_hours'] - 1):.1f}%)"
    )
    lines.append("")
    lines.append("Accuracy metrics:")
    lines.append(f"  MAE  (mean absolute error):        {metrics['mae_hours']:.2f} hours")
    lines.append(f"  RMSE (root mean squared error):    {metrics['rmse_hours']:.2f} hours")
    lines.append(f"  MAPE (mean absolute % error):      {metrics['mape_pct']:.2f}%")
    lines.append(
        f"  Mean bias (actual - estimated):    {metrics['mean_bias_hours']:.2f} hours "
        f"({'under-estimation' if metrics['mean_bias_hours'] > 0 else 'over-estimation'} on average)"
    )
    lines.append(f"  Tasks that ran over estimate:      {metrics['pct_over_budget']:.1f}%")
    lines.append("")
    lines.append("Breakdown by task type (worst MAPE first):")
    lines.append(by_type.to_string())
    lines.append("")
    lines.append("Breakdown by developer seniority:")
    lines.append(by_seniority.reindex(["junior", "mid", "senior"]).to_string())
    lines.append("")
    lines.append("Breakdown by complexity rating:")
    lines.append(by_complexity.sort_index().to_string())
    lines.append("")

    report = "\n".join(lines)
    os.makedirs(out_dir, exist_ok=True)
    report_path = os.path.join(out_dir, "report.txt")
    with open(report_path, "w") as f:
        f.write(report)

    print(report)
    print(f"\nSaved report to {report_path}")


if __name__ == "__main__":
    data = load_data()
    make_charts(data, OUTPUT_DIR)
    write_report(data, OUTPUT_DIR)
