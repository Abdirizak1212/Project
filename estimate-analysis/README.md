# Estimate Dataset Analysis

Synthetic software-project effort-estimation dataset and a Python analysis
of estimation accuracy.

## Files

- `generate_dataset.py` — generates `estimate_dataset.csv` (500 tasks with
  `estimated_hours` vs `actual_hours`, plus `task_type`,
  `developer_seniority`, `complexity`, and `team_size`).
- `estimate_dataset.csv` — the generated dataset.
- `analyze_dataset.py` — computes accuracy metrics (MAE, RMSE, MAPE, mean
  bias) overall and broken down by task type / seniority / complexity, and
  saves charts + a text report to `output/`.
- `output/` — generated charts (`estimated_vs_actual.png`,
  `error_distribution.png`, `mape_by_task_type.png`,
  `mape_by_seniority.png`) and `report.txt`.

## Usage

```bash
pip install pandas numpy matplotlib
python3 generate_dataset.py   # regenerate estimate_dataset.csv
python3 analyze_dataset.py    # regenerate charts + report.txt in output/
```

## Key findings (from the generated run)

- Estimates were systematically low: actual effort exceeded estimated
  effort by ~35% in total, with ~77% of tasks running over budget.
- `integration` and `new_feature` tasks had the worst estimation accuracy
  (MAPE ~58%); `ui_design` and `refactor` tasks were estimated most
  reliably.
- Estimation accuracy improved with developer seniority: junior-authored
  estimates had the highest MAPE (~55%), senior the lowest (~36%).
