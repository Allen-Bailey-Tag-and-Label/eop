# Seven-day forecast for ZIP 14423

This setup uses the National Weather Service's Caledonia, NY grid forecast,
Fahrenheit temperatures, and America/New_York calendar days. It uses the existing
Data dialog and normal property bindings, with no weather-specific slide element.

The NWS point lookup for approximately 42.9438, -77.8279 returned this endpoint:

`https://api.weather.gov/gridpoints/BUF/71,54/forecast?units=us`

The API is free and needs no API key. It requires an application User-Agent.
See the [official NWS documentation](https://www.weather.gov/documentation/services-web-api).

## Create the API connection

1. Open your slide, click **Data**, and choose **API connections**.
2. Enter these settings and click **Save connection**:

   | Setting                | Value                              |
   | ---------------------- | ---------------------------------- |
   | Title                  | National Weather Service           |
   | Base URL               | `https://api.weather.gov`          |
   | Allowed endpoint paths | `/gridpoints/BUF/71,54/forecast`   |
   | Authentication         | `none`                             |
   | User-Agent             | `EmployeeOnlinePortal-Weather/1.0` |
   | Timeout                | `10000`                            |

   You can append your company website or contact email to the User-Agent. This
   is application identification, not an API credential.

## Create the data link

1. Choose **Shared library**, then **Create data link**. Name it
   **Caledonia seven-day forecast**.
2. Click **Import workflow**, then select
   [weather-14423-workflow.json](../weather-14423-workflow.json) from the project root.
   Import changes only the draft; it does not save or publish it.
3. Find the **forecast** API node and choose **National Weather Service** in its
   API connection dropdown. The file contains a placeholder connection ID because
   database IDs differ between installations.
4. Click **Preview workflow**. Choose the **daily** preview node to inspect the
   final rows. The named output is **forecast**.
5. The imported cache settings use **900 seconds** between fetches, shared across
   monitors. **3600 seconds** of stale fallback allows the last successful result
   during a temporary outage. Adjust or disable that fallback if desired.
6. Click **Publish source**.

The API node reads `properties.periods`. It maps number, name, startTime,
isDaytime, temperature, temperatureUnit, shortForecast, windSpeed, windDirection,
and probabilityOfPrecipitation.value into primitive output fields. The remaining
nodes pair daytime highs with the following night's low for each local date.
An early overnight period is not accidentally paired instead of that evening.

## Bind the slide

1. Add a repeater and set **Items** to **Data-link output**.
2. Choose **Caledonia seven-day forecast**, output **forecast**.
3. Set **Columns** to **7**. Size the repeater and its template so all seven
   cards fit; set overflow to **clip** if you want one static row rather than paging.
4. In **Edit item template**, add text elements and set their **Bind text** fields:

   | Content               | Binding                                |
   | --------------------- | -------------------------------------- |
   | Day name              | `row.day`                              |
   | High / low with units | `row.temperatureText`                  |
   | Conditions            | `row.condition`                        |
   | Wind                  | `row.windSpeed` or `row.windDirection` |
   | Precipitation chance  | `row.precipitationChance`              |

   Add a separate percent sign or a Map expression if displaying precipitationChance.
   Available fields also include date, high, low, and unit. Use **text** format
   for temperatureText; date formatting is available for the date field.

5. Return to the slide, preview, save, and publish it.

NWS provides a rolling seven-day window in day/night periods. At night, the first
daytime card is generally the following day. The final day's night may lie beyond
the published window; its low is then null and temperatureText displays a dash.
The workflow does not invent a missing temperature. Fewer cards can appear if
the provider publishes an incomplete forecast.

This setup uses text conditions. Image elements currently bind uploaded asset
IDs, so an NWS icon URL cannot be used as an image asset ID directly.

NWS notes that grid mappings can occasionally change. If this endpoint stops
working, repeat the point lookup at
`https://api.weather.gov/points/42.9438,-77.8279` and update both the connection's
allowed path and the API node's path using its properties.forecast URL.
