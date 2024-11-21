# Google Sheet Template Changelog

## v1.3

Starting from the template shared on the original post

- https://tsmith.com/blog/2020/magic-travel-spreadsheet/
- https://docs.google.com/spreadsheets/d/1F8YS9itFJX2BhPECK2mDxnQXQ03g05iL3ypN2ftldJo/copy?usp=sharing

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
