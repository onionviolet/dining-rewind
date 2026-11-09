# Dining Rewind

[Open the site](https://onionviolet.github.io/dining-rewind/). This independent student project archives dated W&L dining menus and lets visitors reconstruct a meal. Meal logs stay in each visitor's browser. The public site serves the same menu data to everyone and has no login, analytics, or log uploads.

## Coverage

The initial [W&L weekly menu](https://www.wlu.edu/dining-services/campus-dining-venues-and-menus/the-marketplace) snapshot covers November 9–15, 2026. There is no snapshot for November 8 or earlier. It includes Marketplace, Café 77, and Sorority Dining where listed. A published menu can change, and the weekly feed does not list every venue or every item. It includes no nutrition fields.

Six November 9 Marketplace breakfast labels were manually checked in [W&L NetNutrition](https://netnutrition.cbord.com/nn-prod/WLU). Values belong to those dated entries. The Belgian Waffles entry matches the singular Belgian Waffle label. Missing values in either source are left blank. Visitors can enter other label values or their own estimates per serving; unknown amounts are flagged separately in totals.

## Updating the shared archive

1. Save a current copy of the [weekly menu JSON](https://mga1.wlu.edu/campusnotices/feeds/menus.php) manually. It maps date → menu → station → food names.
2. Run `node scripts/import-menu.mjs /path/to/menu.json`. Import refreshes dates from today onward in Eastern time and keeps earlier snapshots. If the feed has already rolled forward without a date ever being captured, leave that date missing.
3. To add manually checked NetNutrition labels, pass an optional second file. It contains a JSON array with `date`, `group`, `station`, `name`, `serving`, and per-serving `kcal`, `protein`, `carbs`, and `fat`. Use `null` for unknown values. Match the date and names in the archive; check that the underlying dishes and serving sizes agree before entering values.
4. Review the changes to `site/data/archive.json`. Push a reviewed update to `main` to publish it via GitHub Actions.

The W&L feed host and CBORD both disallow automated crawling in their robots files. This repository has no scheduled collector. A recurring import needs a source approved for automated access by the provider. Local preview: `python3 -m http.server 8765 --bind 127.0.0.1 --directory site`.
