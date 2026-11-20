# 03 Page text

Status: ready-for-agent
Type: task
Blocked by: 01, 02

Only for the pilot's sampled pages (about 10,000 in total; never the whole corpus).

Take the body from the MS MARCO documents. If ticket 01 found the body is flat text, also fetch
each page's HTML from a Common Crawl snapshot of 2019 to 2020 (index lookup, byte-range fetch; no
visits to the sites), because headings, lists, tables and images are needed by ticket 04; record
what share of pages the snapshots cover. Extract the main text (menus, cookie banners, comments
and footers out; structure kept). Before anything is measured, hand-read 50 extractions against
their originals and record the failure rate in the README; fix or drop page types that extract
badly.
