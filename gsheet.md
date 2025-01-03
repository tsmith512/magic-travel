# Google Sheet Template Changelog

## v2.0-rc2

**Summary:**

- With new segment-level error reporting from backend, report in itinerary rows
- Clean up / standardize some formulas

```
Column E: Unchanged

Column H: Est Hrs
=IF($E2>0, ROUND($E2/60/60*1.1, 1), )

Column I: Est Mi (stop showing 0 when it should be blank)
=IF($F2>0, ROUND($F2/1609, 1), )

Column J: That map link. Now _also_ provide an error message if there is one
=IF(
  0<$F2,
  IF(NOT(ISBLANK($G2)),
    HYPERLINK("https://www.google.com/maps/dir/" & $C2 & "/" & $D2 & "/", "Map to " & $D2 & " via " & $G2),
    HYPERLINK("https://www.google.com/maps/dir/" & $C2 & "/" & $D2 & "/", "Map " & $C2 & " to " & $D2)
  ),
  IF(
    $F2<0,
    $G2, // use description as a plaintext value
    // blank
  )
)

```

## v2.0-rc1

**Summary:**

- Updated the itinerary header row to do a status and key check

Header status and key check

```
A1:
=IF(AND(IMPORTXML("https://magic-travel.tsmith.net/api/v1/status", "//ready") = TRUE, IMPORTXML("https://magic-travel.tsmith.net/api/v1/status?key=" & APIKEY, "//auth") = TRUE), "Day", "🔴")

B1:
=IF(NOT(A1="Day"), "Error: check the", "Drive Date")

C1:
=IF(NOT(A1="Day"), "'Options & Info' tab", "Start")

D1:
=IF(NOT(A1="Day"), "for more info.", "End/Overnight")

H1:
=IF(NOT(A1="Day"), , "Est. Hours (" & SUM(H2:H) & "hrs)")

I1:
=IF(NOT(A1="Day"), , "Est. Miles (" & SUM(I2:I) & "mi)")
```

and adjusted the Conditional Formatting for `A1:G1` to show pink background / red
foreground when custom formula `=NOT(INDIRECT("A1")="Day")` is true.

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

## v2.0-rc1

**Summary:**

- Changed "Config" tab to "Options and Info" with more friendly labels and grouping:

| 🔑 Access Key for Magic Travel: | ((KEY)) | ((KEY STATUS)) |
|:---|:---|---:|
|  |  |  |
| 📝 Options you set: | Your ideal drive miles? | 250 |
|  | Max drive miles? | 500 |
|  | Ideal drive hours? | 4 |
|  | Max drive hours? | 7 |
|  |  |  |
| 🚦System information: | Status message | ((STATUS MESSAGE)) |
|  | Server version | ((VERSION)) |
|  | This template version | v2.0-rc1 |
|  |  |  |
| ℹ️ About and credits: | [How this spreadsheet works](https://tsmith.com/blog/2020/magic-travel-spreadsheet/?utm_source=travel-spreadsheet-template&utm_medium=website&utm_campaign=travel-spreadsheet-template) |  |
|  | [Created by Taylor Smith](https://tsmith.com/?utm_source=travel-spreadsheet-template&utm_medium=website&utm_campaign=travel-spreadsheet-template) |  |


Key Status:

```
=IF(ISBLANK(B1), "🔐 Please enter an access key in B1.", IF(IMPORTXML("https://magic-travel.tsmith.net/api/v1/status?key=" & APIKEY, "//auth") = TRUE, "🟢 Authorized. Let's drive!", "🔴 Not authorized. Look for messages below."))
```

_With conditional formatting to highlight an empty cell._

Status Message:

```
=IF(IMPORTXML("https://magic-travel.tsmith.net/api/v1/status", "//ready") = TRUE, "🟢 ", "🔴 ") & IMPORTXML("https://magic-travel.tsmith.net/api/v1/status", "//message")
```

Version:

```
=IMPORTXML("https://magic-travel.tsmith.net/api/v1/status?sheet_version=" & SHEET_VERSION, "//version")
```

This removes the `key` query arg from all cells except the key check.

This removes the `sheet_version` query arg from all cells except the server version fetch.

This does make a bunch of requests to the status endpoint but without a key or
sheet version, at least they're pretty lightweight to process.

Named and protected ranges have been adjusted accordingly.

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
