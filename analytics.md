# Workers Analytics Engine Queries

All events

``` sql
SELECT
blob1 AS 'start',
blob2 AS 'end',
blob3 AS 'key',
blob4 AS 'sheetVersion',
blob5 AS 'method',
double1 AS 'distance',
double2 AS 'duration',
timestamp
FROM magic_travel_analytics
ORDER BY timestamp DESC
```

Fetch method in the past day

``` sql
SELECT
COUNT() AS 'count',
blob5 AS 'method'
FROM magic_travel_analytics
WHERE toUnixTimestamp(timestamp) > toUnixTimestamp(now()) - (60 * 60 * 24)
GROUP BY blob5;
```
