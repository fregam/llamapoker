# Hook mechanisms: lift table

## All reels

Tagged blind: 455 outliers, 456 ordinary twins (same account, closest date, 0.5–2× the account median). Lift = share among outliers ÷ share among twins; 90% interval. Called only with ≥ 8 outliers and agreement ≥ 0.7 on the double-tagged reels.

75 rows at a 90% interval: about 8 would cross 1 by chance alone, so a single row is a lead, not a law; a cluster of rows pointing the same way is stronger.

| Mechanism | Outliers | Twins | Lift | 90% interval | Agreement | Verdict |
|---|---:|---:|---:|---|---:|---|
| `raw_disclosure` | 12 (3%) | 4 (1%) | 3.01 | 1.17–7.72 | – | unverified (too few double-tags) |
| `caption_cta=save` | 1 (0%) | 0 (0%) | 3.01 | 0.21–44.03 | – | too few |
| `caption_cta=comment keyword` | 11 (2%) | 5 (1%) | 2.20 | 0.91–5.32 | 1.00 (1) | unverified (too few double-tags) |
| `format=screen recording` | 8 (2%) | 4 (1%) | 2.00 | 0.74–5.46 | 0.67 (2) | unverified (too few double-tags) |
| `visual_anomaly` | 22 (5%) | 12 (3%) | 1.84 | 1.03–3.28 | 0.50 (3) | unreliable tag |
| `format=text over a static shot` | 22 (5%) | 13 (3%) | 1.70 | 0.96–2.98 | 0.67 (2) | unverified (too few double-tags) |
| `audio=song only` | 72 (16%) | 49 (11%) | 1.47 | 1.11–1.96 | 1.00 (13) | **more in outliers** |
| `cuts_5s=3+` | 70 (15%) | 50 (11%) | 1.40 | 1.06–1.86 | 1.00 (11) | **more in outliers** |
| `text_style=dense paragraph` | 7 (2%) | 5 (1%) | 1.40 | 0.54–3.65 | – | too few |
| `pending_risk` | 18 (4%) | 13 (3%) | 1.39 | 0.77–2.50 | 0.77 (8) | no clear difference |
| `scenario_label` | 45 (10%) | 33 (7%) | 1.37 | 0.95–1.96 | 0.93 (8) | no clear difference |
| `transcript_reliable=no` | 109 (24%) | 80 (18%) | 1.37 | 1.10–1.70 | 0.95 (20) | **more in outliers** |
| `side_by_side` | 19 (4%) | 14 (3%) | 1.36 | 0.77–2.40 | 0.80 (3) | no clear difference |
| `incident_headline` | 27 (6%) | 20 (4%) | 1.35 | 0.84–2.17 | 0.80 (3) | no clear difference |
| `caption_cta=comment opinion` | 31 (7%) | 23 (5%) | 1.35 | 0.87–2.10 | 0.86 (4) | no clear difference |
| `famous_face` | 66 (15%) | 49 (11%) | 1.35 | 1.01–1.80 | 0.93 (15) | **more in outliers** |
| `magnitude_claim` | 28 (6%) | 21 (5%) | 1.34 | 0.84–2.12 | 0.77 (8) | no clear difference |
| `format=green-screen / stitch / reaction` | 60 (13%) | 45 (10%) | 1.34 | 0.98–1.81 | 0.85 (15) | no clear difference |
| `found_artifact` | 29 (6%) | 22 (5%) | 1.32 | 0.84–2.08 | 0.57 (5) | unreliable tag |
| `identity_callout` | 29 (6%) | 22 (5%) | 1.32 | 0.84–2.08 | 0.67 (4) | unreliable tag |
| `experiment_premise` | 36 (8%) | 28 (6%) | 1.29 | 0.86–1.92 | 0.91 (6) | no clear difference |
| `format=sketch / role-play` | 55 (12%) | 43 (9%) | 1.28 | 0.93–1.76 | 0.80 (12) | no clear difference |
| `n_mechanisms=3+` | 129 (28%) | 103 (23%) | 1.26 | 1.04–1.51 | 0.68 (35) | unreliable tag |
| `text_style=meme label` | 35 (8%) | 29 (6%) | 1.21 | 0.81–1.80 | 0.62 (9) | unreliable tag |
| `stakes_warning` | 12 (3%) | 10 (2%) | 1.20 | 0.60–2.41 | 0.75 (5) | no clear difference |
| `withheld_payoff` | 40 (9%) | 34 (7%) | 1.18 | 0.82–1.70 | 0.80 (9) | no clear difference |
| `fresh_news` | 27 (6%) | 23 (5%) | 1.18 | 0.75–1.85 | 0.91 (12) | no clear difference |
| `audio=in-scene dialogue` | 75 (16%) | 64 (14%) | 1.17 | 0.91–1.52 | 0.89 (20) | no clear difference |
| `named_villain` | 8 (2%) | 7 (2%) | 1.15 | 0.49–2.66 | 1.00 (1) | unverified (too few double-tags) |
| `mid_action_start` | 101 (22%) | 89 (20%) | 1.14 | 0.92–1.41 | 0.74 (27) | no clear difference |
| `language=other` | 27 (6%) | 24 (5%) | 1.13 | 0.72–1.77 | 0.73 (7) | no clear difference |
| `face_at_0s=no` | 117 (26%) | 106 (23%) | 1.11 | 0.91–1.34 | 0.81 (19) | no clear difference |
| `before_state` | 11 (2%) | 10 (2%) | 1.10 | 0.54–2.24 | 0.00 (2) | unverified (too few double-tags) |
| `text_style=persistent headline at 0 s` | 174 (38%) | 159 (35%) | 1.10 | 0.95–1.27 | 0.92 (41) | no clear difference |
| `viewer_task` | 26 (6%) | 24 (5%) | 1.09 | 0.69–1.71 | 0.00 (3) | unreliable tag |
| `cuts_5s=1` | 98 (22%) | 91 (20%) | 1.08 | 0.87–1.34 | 1.00 (18) | no clear difference |
| `format=hands or object demo` | 76 (17%) | 72 (16%) | 1.06 | 0.83–1.36 | 0.84 (11) | no clear difference |
| `result_first` | 20 (4%) | 19 (4%) | 1.05 | 0.63–1.77 | 1.00 (3) | no clear difference |
| `audio=voiceover` | 82 (18%) | 78 (17%) | 1.05 | 0.83–1.33 | 0.76 (13) | no clear difference |
| `visual_appeal` | 22 (5%) | 21 (5%) | 1.05 | 0.64–1.71 | 0.80 (9) | no clear difference |
| `counterintuitive_claim` | 49 (11%) | 47 (10%) | 1.04 | 0.76–1.44 | 0.92 (14) | no clear difference |
| `specific_figure` | 50 (11%) | 50 (11%) | 1.00 | 0.73–1.37 | 0.80 (15) | no clear difference |
| `caption_cta=follow` | 2 (0%) | 2 (0%) | 1.00 | 0.19–5.17 | – | too few |
| `cuts_5s=2` | 66 (15%) | 66 (14%) | 1.00 | 0.77–1.31 | 1.00 (22) | no clear difference |
| `annotation=yes` | 19 (4%) | 19 (4%) | 1.00 | 0.59–1.69 | 0.86 (4) | no clear difference |
| `annotation=no` | 436 (96%) | 437 (96%) | 1.00 | 0.98–1.02 | 0.99 (88) | no clear difference |
| `language=english` | 428 (94%) | 432 (95%) | 0.99 | 0.97–1.02 | 0.98 (87) | no clear difference |
| `text_style=word-by-word captions` | 106 (23%) | 108 (24%) | 0.98 | 0.81–1.20 | 0.93 (22) | no clear difference |
| `text_style=none` | 101 (22%) | 103 (23%) | 0.98 | 0.80–1.20 | 1.00 (22) | no clear difference |
| `caption_cta=none` | 402 (88%) | 410 (90%) | 0.98 | 0.95–1.02 | 0.99 (85) | no clear difference |
| `format=b-roll / tour` | 42 (9%) | 43 (9%) | 0.98 | 0.70–1.38 | 0.74 (12) | no clear difference |
| `instant_cutaway` | 69 (15%) | 71 (16%) | 0.97 | 0.75–1.26 | 0.79 (20) | no clear difference |
| `face_at_0s=yes` | 338 (74%) | 350 (77%) | 0.97 | 0.91–1.03 | 0.96 (78) | no clear difference |
| `n_mechanisms=1` | 129 (28%) | 134 (29%) | 0.96 | 0.81–1.14 | 0.68 (25) | unreliable tag |
| `audio=ambient only` | 18 (4%) | 19 (4%) | 0.95 | 0.56–1.61 | 0.80 (3) | no clear difference |
| `n_mechanisms=2` | 185 (41%) | 196 (43%) | 0.95 | 0.83–1.08 | 0.69 (55) | unreliable tag |
| `transcript_reliable=yes` | 346 (76%) | 376 (82%) | 0.92 | 0.87–0.98 | 0.99 (73) | less in outliers |
| `cuts_5s=0` | 221 (49%) | 249 (55%) | 0.89 | 0.80–0.99 | 1.00 (40) | less in outliers |
| `format=talking head` | 115 (25%) | 132 (29%) | 0.87 | 0.73–1.04 | 0.81 (32) | no clear difference |
| `audio=to-camera voice` | 206 (45%) | 242 (53%) | 0.85 | 0.76–0.95 | 0.95 (49) | less in outliers |
| `open_question` | 40 (9%) | 47 (10%) | 0.85 | 0.61–1.19 | 0.82 (10) | no clear difference |
| `format=selfie vlog / walk-and-talk` | 51 (11%) | 60 (13%) | 0.85 | 0.64–1.14 | 0.73 (14) | no clear difference |
| `format=cgi / animation with voiceover` | 9 (2%) | 11 (2%) | 0.82 | 0.39–1.70 | 0.00 (3) | unreliable tag |
| `paradox_premise` | 15 (3%) | 19 (4%) | 0.79 | 0.45–1.38 | 0.00 (2) | unverified (too few double-tags) |
| `structure_promise` | 48 (11%) | 68 (15%) | 0.71 | 0.53–0.95 | 0.87 (13) | less in outliers |
| `prop_to_lens` | 19 (4%) | 27 (6%) | 0.71 | 0.44–1.14 | 0.80 (3) | no clear difference |
| `subversion` | 17 (4%) | 27 (6%) | 0.63 | 0.38–1.04 | 0.77 (8) | no clear difference |
| `text_style=keyword pop` | 32 (7%) | 52 (11%) | 0.62 | 0.43–0.88 | 0.50 (6) | unreliable tag |
| `caption_cta=link` | 8 (2%) | 15 (3%) | 0.53 | 0.26–1.09 | 1.00 (2) | unverified (too few double-tags) |
| `n_mechanisms=0` | 12 (3%) | 23 (5%) | 0.52 | 0.29–0.93 | 0.86 (4) | less in outliers |
| `format=interview or stage clip` | 17 (4%) | 33 (7%) | 0.52 | 0.32–0.83 | 0.92 (7) | less in outliers |
| `proof_display` | 4 (1%) | 8 (2%) | 0.50 | 0.18–1.36 | 1.00 (2) | too few |
| `audio=song under voice` | 2 (0%) | 4 (1%) | 0.50 | 0.12–2.07 | 0.00 (1) | too few |
| `come_with_me` | 7 (2%) | 17 (4%) | 0.41 | 0.20–0.86 | 1.00 (3) | too few |
| `caption_cta=tag a friend` | 0 (0%) | 1 (0%) | 0.33 | 0.02–4.89 | – | too few |

## Our format only (voiceover or to-camera voice, English, readable transcript)

Tagged blind: 277 outliers, 309 ordinary twins (same account, closest date, 0.5–2× the account median). Lift = share among outliers ÷ share among twins; 90% interval. Called only with ≥ 8 outliers and agreement ≥ 0.7 on the double-tagged reels.

69 rows at a 90% interval: about 7 would cross 1 by chance alone, so a single row is a lead, not a law; a cluster of rows pointing the same way is stronger.

| Mechanism | Outliers | Twins | Lift | 90% interval | Agreement | Verdict |
|---|---:|---:|---:|---|---:|---|
| `caption_cta=save` | 1 (0%) | 0 (0%) | 3.35 | 0.23–48.95 | – | too few |
| `caption_cta=comment keyword` | 11 (4%) | 4 (1%) | 3.07 | 1.19–7.94 | 1.00 (1) | unverified (too few double-tags) |
| `raw_disclosure` | 5 (2%) | 2 (1%) | 2.79 | 0.71–10.97 | – | too few |
| `identity_callout` | 22 (8%) | 11 (4%) | 2.23 | 1.23–4.03 | 0.67 (4) | unreliable tag |
| `format=screen recording` | 4 (1%) | 2 (1%) | 2.23 | 0.54–9.21 | 0.67 (2) | too few |
| `result_first` | 16 (6%) | 11 (4%) | 1.62 | 0.86–3.05 | 1.00 (3) | no clear difference |
| `famous_face` | 42 (15%) | 29 (9%) | 1.62 | 1.11–2.35 | 0.93 (15) | **more in outliers** |
| `visual_anomaly` | 10 (4%) | 7 (2%) | 1.59 | 0.72–3.54 | 0.50 (3) | unreliable tag |
| `stakes_warning` | 11 (4%) | 8 (3%) | 1.53 | 0.72–3.25 | 0.75 (5) | no clear difference |
| `magnitude_claim` | 22 (8%) | 18 (6%) | 1.36 | 0.82–2.26 | 0.77 (8) | no clear difference |
| `cuts_5s=1` | 65 (23%) | 55 (18%) | 1.32 | 1.01–1.73 | 1.00 (18) | **more in outliers** |
| `format=b-roll / tour` | 13 (5%) | 11 (4%) | 1.32 | 0.68–2.55 | 0.74 (12) | no clear difference |
| `side_by_side` | 13 (5%) | 11 (4%) | 1.32 | 0.68–2.55 | 0.80 (3) | no clear difference |
| `n_mechanisms=3+` | 87 (31%) | 74 (24%) | 1.31 | 1.05–1.64 | 0.68 (35) | unreliable tag |
| `experiment_premise` | 22 (8%) | 19 (6%) | 1.29 | 0.79–2.12 | 0.91 (6) | no clear difference |
| `cuts_5s=3+` | 43 (16%) | 38 (12%) | 1.26 | 0.90–1.77 | 1.00 (11) | no clear difference |
| `counterintuitive_claim` | 44 (16%) | 39 (13%) | 1.26 | 0.90–1.76 | 0.92 (14) | no clear difference |
| `withheld_payoff` | 27 (10%) | 24 (8%) | 1.25 | 0.81–1.95 | 0.80 (9) | no clear difference |
| `format=green-screen / stitch / reaction` | 47 (17%) | 42 (14%) | 1.25 | 0.90–1.72 | 0.85 (15) | no clear difference |
| `caption_cta=comment opinion` | 19 (7%) | 17 (6%) | 1.25 | 0.73–2.12 | 0.86 (4) | no clear difference |
| `mid_action_start` | 30 (11%) | 28 (9%) | 1.20 | 0.79–1.80 | 0.74 (27) | no clear difference |
| `face_at_0s=no` | 58 (21%) | 55 (18%) | 1.18 | 0.89–1.55 | 0.81 (19) | no clear difference |
| `cuts_5s=2` | 43 (16%) | 41 (13%) | 1.17 | 0.84–1.63 | 1.00 (22) | no clear difference |
| `open_question` | 36 (13%) | 35 (11%) | 1.15 | 0.80–1.65 | 0.82 (10) | no clear difference |
| `audio=voiceover` | 77 (28%) | 76 (25%) | 1.13 | 0.90–1.42 | 0.76 (13) | no clear difference |
| `text_style=persistent headline at 0 s` | 107 (39%) | 106 (34%) | 1.13 | 0.94–1.35 | 0.92 (41) | no clear difference |
| `caption_cta=follow` | 2 (1%) | 2 (1%) | 1.12 | 0.22–5.75 | – | too few |
| `visual_appeal` | 5 (2%) | 5 (2%) | 1.12 | 0.40–3.13 | 0.80 (9) | too few |
| `text_style=dense paragraph` | 1 (0%) | 1 (0%) | 1.12 | 0.11–11.38 | – | too few |
| `before_state` | 7 (3%) | 7 (2%) | 1.12 | 0.47–2.66 | 0.00 (2) | too few |
| `instant_cutaway` | 51 (18%) | 52 (17%) | 1.09 | 0.82–1.47 | 0.79 (20) | no clear difference |
| `text_style=word-by-word captions` | 90 (32%) | 94 (30%) | 1.07 | 0.87–1.31 | 0.93 (22) | no clear difference |
| `fresh_news` | 22 (8%) | 23 (7%) | 1.07 | 0.67–1.71 | 0.91 (12) | no clear difference |
| `specific_figure` | 36 (13%) | 38 (12%) | 1.06 | 0.74–1.51 | 0.80 (15) | no clear difference |
| `found_artifact` | 17 (6%) | 18 (6%) | 1.05 | 0.61–1.81 | 0.57 (5) | unreliable tag |
| `format=hands or object demo` | 48 (17%) | 52 (17%) | 1.03 | 0.76–1.39 | 0.84 (11) | no clear difference |
| `annotation=no` | 271 (98%) | 296 (96%) | 1.02 | 1.00–1.05 | 0.99 (88) | no clear difference |
| `format=cgi / animation with voiceover` | 9 (3%) | 10 (3%) | 1.00 | 0.48–2.11 | 0.00 (3) | unreliable tag |
| `transcript_reliable=yes` | 277 (100%) | 309 (100%) | 1.00 | 1.00–1.00 | 0.99 (73) | no clear difference |
| `language=english` | 277 (100%) | 309 (100%) | 1.00 | 1.00–1.00 | 0.98 (87) | no clear difference |
| `format=talking head` | 112 (40%) | 125 (40%) | 1.00 | 0.85–1.18 | 0.81 (32) | no clear difference |
| `n_mechanisms=2` | 106 (38%) | 120 (39%) | 0.99 | 0.83–1.17 | 0.69 (55) | unreliable tag |
| `incident_headline` | 15 (5%) | 17 (6%) | 0.98 | 0.56–1.73 | 0.80 (3) | no clear difference |
| `face_at_0s=yes` | 219 (79%) | 254 (82%) | 0.96 | 0.90–1.03 | 0.96 (78) | no clear difference |
| `caption_cta=none` | 240 (87%) | 279 (90%) | 0.96 | 0.91–1.01 | 0.99 (85) | no clear difference |
| `audio=to-camera voice` | 200 (72%) | 233 (75%) | 0.96 | 0.88–1.04 | 0.95 (49) | no clear difference |
| `named_villain` | 5 (2%) | 6 (2%) | 0.93 | 0.35–2.49 | 1.00 (1) | too few |
| `text_style=none` | 50 (18%) | 60 (19%) | 0.93 | 0.70–1.23 | 1.00 (22) | no clear difference |
| `paradox_premise` | 13 (5%) | 16 (5%) | 0.91 | 0.50–1.65 | 0.00 (2) | unverified (too few double-tags) |
| `n_mechanisms=1` | 79 (29%) | 98 (32%) | 0.90 | 0.73–1.11 | 0.68 (25) | unreliable tag |
| `viewer_task` | 13 (5%) | 17 (6%) | 0.85 | 0.47–1.54 | 0.00 (3) | unreliable tag |
| `subversion` | 13 (5%) | 17 (6%) | 0.85 | 0.47–1.54 | 0.77 (8) | no clear difference |
| `format=selfie vlog / walk-and-talk` | 32 (12%) | 42 (14%) | 0.85 | 0.59–1.22 | 0.73 (14) | no clear difference |
| `format=sketch / role-play` | 8 (3%) | 11 (4%) | 0.81 | 0.38–1.72 | 0.80 (12) | no clear difference |
| `cuts_5s=0` | 126 (45%) | 175 (57%) | 0.80 | 0.70–0.92 | 1.00 (40) | less in outliers |
| `structure_promise` | 43 (16%) | 60 (19%) | 0.80 | 0.59–1.08 | 0.87 (13) | no clear difference |
| `caption_cta=link` | 4 (1%) | 6 (2%) | 0.74 | 0.26–2.13 | 1.00 (2) | too few |
| `format=text over a static shot` | 2 (1%) | 3 (1%) | 0.74 | 0.17–3.32 | 0.67 (2) | too few |
| `come_with_me` | 7 (3%) | 11 (4%) | 0.71 | 0.32–1.55 | 1.00 (3) | too few |
| `text_style=keyword pop` | 25 (9%) | 40 (13%) | 0.70 | 0.47–1.04 | 0.50 (6) | unreliable tag |
| `prop_to_lens` | 14 (5%) | 23 (7%) | 0.68 | 0.40–1.17 | 0.80 (3) | no clear difference |
| `scenario_label` | 7 (3%) | 12 (4%) | 0.65 | 0.30–1.41 | 0.93 (8) | too few |
| `proof_display` | 4 (1%) | 7 (2%) | 0.64 | 0.23–1.77 | 1.00 (2) | too few |
| `text_style=meme label` | 4 (1%) | 8 (3%) | 0.56 | 0.21–1.51 | 0.62 (9) | too few |
| `pending_risk` | 4 (1%) | 8 (3%) | 0.56 | 0.21–1.51 | 0.77 (8) | too few |
| `annotation=yes` | 6 (2%) | 13 (4%) | 0.51 | 0.23–1.15 | 0.86 (4) | too few |
| `caption_cta=tag a friend` | 0 (0%) | 1 (0%) | 0.37 | 0.03–5.44 | – | too few |
| `n_mechanisms=0` | 5 (2%) | 17 (6%) | 0.33 | 0.14–0.75 | 0.86 (4) | too few |
| `format=interview or stage clip` | 2 (1%) | 11 (4%) | 0.20 | 0.06–0.71 | 0.92 (7) | too few |
