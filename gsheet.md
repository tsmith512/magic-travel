# Google Sheet Template Changelog

## v2.0-beta2

**Summary:**

- Update domain name
- Remove API key from status callers, which drops 2 D1 database reads

Getting Route Overview (Column E)

```
=IF(AND( NOT(ISBLANK($C2)), NOT(ISBLANK($D2)), NOT($C2=$D2) ), TRANSPOSE(IMPORTXML("https://magic-travel.tsmith.net/api/v1/directions/" & C2 & "/" & D2 & "/?key=" & APIKEY & "&sheet_version=" & SHEET_VERSION, "//*[position()=3 or position()=4 or position()=5]")), 0)
```

Auth check

```
=IF(IMPORTXML("https://magic-travel.tsmith.net/api/v1/status?key=" & APIKEY, "//auth") = TRUE, "Key is authorized; let's drive!", "This key is not authorized.")
```

Server Information

```
=IMPORTXML("https://magic-travel.tsmith.net/api/v1/status?sheet_version=" & SHEET_VERSION, "//message")
```

Server Version

```
=IMPORTXML("https://magic-travel.tsmith.net/api/v1/status?sheet_version=" & SHEET_VERSION, "//version")
```


## v2.0-beta

**Summary:**

- "Request coalescing" in the sheet itself by doing one column to fetch three
  columns of directions info (minutes, meters, and route summary) split into
  columns that can be referenced and formatted by in-sheet references.
  - Cuts API requests in half.
  - Greatly simplifies the Hours and Miles column formulas.
- These "intermediate" columns will be hidden
- Column E, the overview, returns 0 instead of an empty string in its results if
  there's no route needed for a 0, because an empty string is _not_ blank per
  the gsheets `ISBLANK()` formula.

Getting Route Overview (Column E)

```
=IF(AND( NOT(ISBLANK($C2)), NOT(ISBLANK($D2)), NOT($C2=$D2) ), TRANSPOSE(IMPORTXML("https://magic-travel.tsmithcreative.workers.dev/api/v1/directions/" & C2 & "/" & D2 & "/?key=" & APIKEY & "&sheet_version=" & SHEET_VERSION, "//*[position()=4 or position()=5 or position()=6]")), 0)
```

Getting Estimated Hours (Col H)

```
=IF($E2>0, ROUND($E2/60/60*1.1, 1), "")
```

Getting Estimated Miles (Col I)

```
=IF(NOT(ISBLANK($F2)), ROUND($F2/1609, 1), "")
```

## v2.0-alpha

**Summary:**

- Changed all `IMPORTXML` formulas to point to my Worker
- Replaced the Google API Key with an authorized key in this project's DB
- Added some sheet and server/status information

Getting Drive Time

```
=IF(AND( NOT(ISBLANK($C2)), NOT(ISBLANK($D2)), NOT($C2=$D2) ), ROUND(IMPORTXML("https://magic-travel.tsmithcreative.workers.dev/api/v1/directions/" & $C2 &"/"& $D2 &"/?key=" & APIKEY & "&sheet_version=" & SHEET_VERSION, "//duration")/60/60*1.1, 1), "")
```

Getting Drive Distance

```
=IF(AND( NOT(ISBLANK($C2)), NOT(ISBLANK($D2)), NOT($C2=$D2) ), ROUND(IMPORTXML("https://magic-travel.tsmithcreative.workers.dev/api/v1/directions/" & $C2 &"/"& $D2 &"/?key=" & APIKEY & "&sheet_version=" & SHEET_VERSION, "//distance")/1609, 1), "")
```

Check if Key is authoried

```
=IF(IMPORTXML("https://magic-travel.tsmithcreative.workers.dev/api/v1/status?key=" & APIKEY, "//auth") = TRUE, "Key is authorized; let's drive!", "This key has expired.")
```

Get service status message

```
=IMPORTXML("https://magic-travel.tsmithcreative.workers.dev/api/v1/status?key=" & APIKEY & "&sheet_version=" & SHEET_VERSION, "//message")
```

Get server deployment tag

```
=IMPORTXML("https://magic-travel.tsmithcreative.workers.dev/api/v1/status?key=" & APIKEY & "&sheet_version=" & SHEET_VERSION, "//version")
```

## v1.3

Starting from the template shared on the original post

- https://tsmith.com/blog/2020/magic-travel-spreadsheet/
- https://docs.google.com/spreadsheets/d/1F8YS9itFJX2BhPECK2mDxnQXQ03g05iL3ypN2ftldJo/copy?usp=sharing
