# Australia Recession Monitor

A dashboard answering “Are we in a recession?” using the latest published Australian Bureau of Statistics data.

## Run

Requires Node.js 22.13+ and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by the server. Data refreshes when opened; the Refresh data button fetches again. No API key is required.

```sh
npm run build
```

The existing Sites configuration targets a Cloudflare Worker. The site is registered but publication was blocked by this session's approval policy.

## Rules

- **Technical recession**: the latest two consecutive quarterly real GDP growth rates are both below zero. This alone determines the headline answer.
- **Australian Sahm signal**: latest three-month mean seasonally adjusted unemployment minus the minimum of the previous 12 monthly three-month means is at least 0.75 percentage points.
- **Per capita recession**: the latest two consecutive quarterly real GDP per capita growth rates are below zero.
- **Original Sahm signal**: the same Australian unemployment calculation reaches 0.50 percentage points. This original US threshold is shown for comparison and is not calibrated for Australia.

Missing or nonconsecutive observations produce Unknown. Quarterly data older than 180 days and monthly data older than 75 days also produce Unknown. A source failure affects its own checks; the other source can still return results. API responses are not cached. ABS revisions can change previous calculations. Rounded screen values do not determine thresholds.

GDP and unemployment refer to different observation periods and arrive with a publication delay. There is no claim that the headline is an official recession declaration. The Sahm variants are closely related signals, not independent votes.

## Sources

- ABS national accounts: https://data.api.abs.gov.au/rest/data/ABS,ANA_AGG/M1.GPM+GPM_PCA.20.AUS.Q?startPeriod=2018
- ABS unemployment: https://data.api.abs.gov.au/rest/data/ABS,LF/M13.3.1599.20.AUS.M?startPeriod=2018
- RBA recession explainer: https://www.rba.gov.au/education/resources/explainers/recession.html
- RBA Australian Sahm adaptation: https://www.rba.gov.au/publications/rdp/2024/2024-04/monitoring-activity-using-a-combination-of-targeted-monthly-indicators.html
- Original Sahm rule: https://fred.stlouisfed.org/series/SAHMREALTIME

## Validation

TypeScript check passed. Live local API responses and dashboard refresh were verified against ABS. Calculation checks covered quarter/year transitions, zero growth, missing months/quarters, flat unemployment, and the 0.75 pp boundary.

## Working people panel

The household picture now appears above the recession checklist. It covers:

- Wage purchasing power: original WPI hourly pay excluding bonuses divided by the employee household living-cost index. Annual change uses the latest common quarter and the same quarter a year earlier. Long-term change is relative to Q4 2019. This benchmark is before tax, not disposable income or individual take-home pay.
- Rents: original CPI rent index for the weighted eight-capital-city average.
- Mortgage interest: employee household living-cost component; not total repayments or an individual borrower's bill.
- Underemployment: national, all-person, seasonally adjusted headline rate; annual change in percentage points.
- Output per person: seasonally adjusted real GDP per capita, distinct from household income and distribution.

Each signal shows its period, source, and recent direction. Housing costs falling, wage purchasing power rising, and underemployment falling are labelled Improving. Unknown is used when the required observation is missing or stale. These labels indicate direction, not affordability. The household summary uses purchasing power, rents, mortgage interest, and underemployment and is separate from the recession verdict.

Official API endpoints:

- https://data.api.abs.gov.au/rest/data/ABS,WPI/1.THRPEB.7.TOT.10.AUS.Q?startPeriod=2019
- https://data.api.abs.gov.au/rest/data/ABS,LCI/1.10001+131278.P1.50.Q?startPeriod=2019
- https://data.api.abs.gov.au/rest/data/ABS,CPI/1.115522.10.50.Q?startPeriod=2019
- https://data.api.abs.gov.au/rest/data/ABS,LF_UNDER/M23.3.1599.20.AUS.M?startPeriod=2019

The expanded panel's calculation checks cover ratio-based purchasing power, missing base periods, unmatched quarters, and the distinction between annual recovery and cumulative loss. All six API fetches succeeded during local verification. Production build and TypeScript checks passed.
