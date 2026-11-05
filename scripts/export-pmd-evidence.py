"""Export only frozen public PMD outputs. No fitting, sampling or model calls.
Usage: python scripts/export-pmd-evidence.py /path/to/preference-modeling-diagnostics
"""
import csv, hashlib, json, pathlib, subprocess, sys
root = pathlib.Path(sys.argv[1]).resolve()
revision = subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], text=True).strip()
expected = 'd232327047a206b8d4f16b5c6f7a5e508ad43146'
if revision != expected:
    raise SystemExit('Expected frozen PMD revision ' + expected)
paths = ['results/day2b_test_summary.json', 'results/day2b_wrong_user_control.json', 'results/day2b_shuffled_id_control.json', 'results/day2c_curve.csv', 'figures/day2b_user_effects.png']
for path in paths:
    subprocess.run(['git', '-C', str(root), 'diff', '--exit-code', 'HEAD', '--', path], check=True, stdout=subprocess.DEVNULL)
s = json.loads((root / paths[0]).read_text())
w = json.loads((root / paths[1]).read_text())
h = json.loads((root / paths[2]).read_text())
curve = []
for row in csv.DictReader((root / paths[3]).open()):
    curve.append({k: row[k] if k == 'history_level' else float(row[k]) for k in ['history_level', 'nll', 'delta_nll', 'gain_fraction_of_all_available', 'mean_within_user_sd_delta_nll']})
output = {
 'source': {'repository': 'https://github.com/GBX-Max1220/preference-modeling-diagnostics', 'revision': revision, 'files': {p: hashlib.sha256((root / p).read_bytes()).hexdigest() for p in paths}},
 'scope': {'users': s['users'], 'median_train_contexts': s['median_train_contexts'], 'median_test_contexts': s['median_test_contexts'], 'weighting': 'equal-user', 'dataset': 'Community Alignment v1.1 bounded wave-1 subset', 'data_license': 'CC BY 4.0; derived results from Zhang et al.; filtered and transformed by Baixin Guo'},
 'arms': [{'id': 'pooled', 'label': 'Pooled baseline', 'nll': s['pooled']['nll']}, {'id': 'correct', 'label': 'Correct-user adaptation', 'nll': s['personalized']['nll']}, {'id': 'wrong', 'label': 'Wrong-user control', 'nll': w['mean_wrong_user_nll'], 'repetitions': w['repetitions']}, {'id': 'shuffled', 'label': 'Shuffled-ID control', 'nll': h['mean_shuffled_id_nll'], 'repetitions': h['repetitions']}],
 'effects': {'improved': s['delta']['users_improved'], 'worsened': s['delta']['users_worsened'], 'tied': s['delta']['users_tied'], 'mean_delta_nll': s['delta']['mean_delta_nll'], 'median_delta_nll': s['delta']['median_delta_nll'], 'bootstrap_ci_95': s['delta']['bootstrap_ci_95']},
 'history': curve,
 'per_user_rows_available': False
}
dest = pathlib.Path(__file__).resolve().parents[1] / 'public/data/pmd'
dest.mkdir(parents=True, exist_ok=True)
(dest / 'evidence.json').write_text(json.dumps(output, indent=2) + '\n')
(dest / 'history-curve.csv').write_bytes((root / paths[3]).read_bytes())
image = dest.parents[1] / 'images/pmd/user-effects.png'
image.parent.mkdir(parents=True, exist_ok=True)
image.write_bytes((root / paths[4]).read_bytes())
print(f'Exported {len(output["arms"])} arms, {len(curve)} history levels; all from {revision}')
