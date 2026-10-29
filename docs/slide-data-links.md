# Slide data links

Data links have two query modes. **Find** keeps the existing filter/select query.
**Aggregate** accepts a JSON pipeline for joins, computed fields, grouping, and
projections. Both modes use the same preview and monitor resolver, select explicit
output fields, and apply the outer sort, skip, and limit after the query pipeline.
An empty outer sort preserves the pipeline's own ordering.

Supported stages: `$match`, `$lookup`, `$unwind`, `$project`, `$set`, `$addFields`,
`$group`, `$sort`, `$skip`, and `$limit`. Use at most 20 stages, three lookups,
and 20 KB of pipeline JSON. Queries have a four-second execution limit, disabled
disk spilling, and return at most 100 rows. No executable expressions or write
stages are accepted.

In `$lookup`, `from` is an allowed **model name**, such as `UserProfile`; the server
resolves its collection. Supply `localField`, `foreignField`, and `as`. Custom
lookup pipelines are not supported. The server projects permitted scalar schema
fields before the main pipeline and inside each lookup. Hidden fields, credential
fields, mixed objects, maps, and arrays are excluded. `User` is available only in
Aggregate mode and exposes `_id`, `isActive`, and `_profileId`.

Relative dates such as `{ "$date": "now" }` are resolved on every data request.
The Time zone setting controls relative calendar dates such as `today`. MongoDB
date expressions have their own `timezone` argument; specify it explicitly when
the calculation depends on local time. Output field names can be computed aliases
and become `row.<field>` choices in the repeater template's Data binding section.

## Birthdays this month in an existing repeater

1. Open the slide and select its repeater in Layers, expanding its parent frames
   if needed. Open **Data link** in the properties panel.
2. Set **Query mode** to **Aggregate** and **Model** to **User**.
3. Paste this into **Pipeline (JSON array)**:

```json
[
	{ "$match": { "isActive": true } },
	{
		"$lookup": {
			"from": "UserProfile",
			"localField": "_profileId",
			"foreignField": "_id",
			"as": "profile"
		}
	},
	{ "$unwind": "$profile" },
	{
		"$set": {
			"birthday": {
				"$convert": {
					"input": "$profile.birthDate",
					"to": "date",
					"onError": null,
					"onNull": null
				}
			}
		}
	},
	{
		"$match": {
			"birthday": { "$ne": null },
			"$expr": {
				"$eq": [
					{ "$month": "$birthday" },
					{
						"$month": {
							"date": { "$date": "now" },
							"timezone": "America/New_York"
						}
					}
				]
			}
		}
	},
	{
		"$project": {
			"firstName": { "$ifNull": ["$profile.firstName", ""] },
			"lastName": { "$ifNull": ["$profile.lastName", ""] },
			"birthdayDay": { "$dayOfMonth": "$birthday" },
			"displayText": {
				"$concat": [
					{ "$ifNull": ["$profile.firstName", ""] },
					" ",
					{ "$ifNull": ["$profile.lastName", ""] },
					" — ",
					{ "$dateToString": { "format": "%m/%d", "date": "$birthday", "timezone": "UTC" } }
				]
			}
		}
	}
]
```

4. Set the remaining fields:

   | Setting       | Value                                          |
   | ------------- | ---------------------------------------------- |
   | Output fields | `displayText birthdayDay firstName lastName`   |
   | sort          | `{"birthdayDay":1,"lastName":1,"firstName":1}` |
   | Skip          | `0`                                            |
   | Max           | `100`                                          |
   | Time zone     | `America/New_York`                             |
   | Empty message | `No employee birthdays this month.`            |

5. Click **Refresh data preview**. This returns active users whose linked
   profiles have a birth date in the current month, including birthdays earlier
   in the month. Users without a linked profile or valid birth date are omitted.
6. Open the repeater's **Edit item template** control. Select its existing text element.
   In **Data binding**, change **Text data binding** from `Detail (legacy mapping)`
   to **row.displayText**. Set **Binding format** to **text**, replacing the old
   date format. Your existing styling and staggered animations remain in place.
7. Return to the slide, preview, save, and publish it.

Example card: `Nicole Acton — 08/20`. Birth years and full dates are not
included in the selected monitor fields. Birth dates are UTC calendar dates;
their month and day are read in UTC to avoid shifting a midnight birthday into
the previous day. The current month follows New York time. The query refreshes when the slide data is fetched,
so the next month takes effect without editing the slide.
