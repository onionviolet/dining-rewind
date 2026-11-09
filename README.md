# Dining Rewind

[Open the site](https://onionviolet.github.io/dining-rewind/). This independent student project archives dated W&L dining menus and lets visitors reconstruct a meal. Meal logs stay in each visitor's browser. The public site serves the same menu data to everyone and has no login, analytics, or log uploads.

## Coverage

The initial [W&L weekly menu](https://www.wlu.edu/dining-services/campus-dining-venues-and-menus/the-marketplace) snapshot covers November 9–15, 2026. There is no snapshot for November 8 or earlier. It includes Marketplace, Café 77, and Sorority Dining where listed. A published menu can change, and the weekly feed does not list every venue or every item. It includes no nutrition fields.

Six November 9 Marketplace breakfast labels were manually checked in [W&L NetNutrition](https://netnutrition.cbord.com/nn-prod/WLU). Values belong to those dated entries. The Belgian Waffles entry matches the singular Belgian Waffle label. Missing values in either source are left blank. Visitors can enter other label values or their own estimates per serving; unknown amounts are flagged separately in totals.

## Updating the shared archive

Ask Codex to “refresh Dining Rewind” to have it inspect the current W&L feed, preview the import, publish, and verify that the new dates are live. Ask for specific dishes if you also want NetNutrition labels checked.

For a self-service update, open the [archive updater](https://onionviolet.github.io/dining-rewind/update.html). Repository collaborators with write access can publish from the [GitHub workflow](https://github.com/onionviolet/dining-rewind/actions/workflows/pages.yml).

1. Copy the [current weekly menu JSON](https://mga1.wlu.edu/campusnotices/feeds/menus.php) while that week is still available. In GitHub, choose **Run workflow** on the `main` branch and paste it into **Weekly menu JSON**.
2. Run with **Preview only** checked to validate and see counts without making changes. When ready to save and publish, run again with **Preview only** unchecked.
3. To add labels, use the updater's date and dish picker, enter values checked in NetNutrition, then copy the prepared JSON into **Verified NetNutrition labels JSON**. The weekly menu field can stay blank for a labels-only update.

An import adds new dates, refreshes current and future menus, and preserves existing past menus. It can backfill a missing date only if you supply an authentic snapshot for that date. Label imports can add or correct nutrition for an existing past menu item. GitHub stores the revised archive in version history and publishes it to Pages. Use the GitHub run summary to see what changed.

For terminal updates, run `node scripts/import-menu.mjs /path/to/menu.json [verified-labels.json]`. Pass `-` in place of the menu path for labels only. Commit the reviewed change to `site/data/archive.json` and push to `main`.

The W&L feed host and CBORD both disallow automated crawling in their robots files. This repository has no scheduled collector. A recurring import needs a source approved for automated access by the provider. Local preview: `python3 -m http.server 8765 --bind 127.0.0.1 --directory site`.
