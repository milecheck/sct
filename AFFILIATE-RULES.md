# Affiliate rules for this site

Written 2026-08-31 after an audit found the packing page naming a brand that
does not exist. These are the rules that keep the page worth reading. Money
is worth less than that, and by a wide margin — see the last section.

## The one rule

**A link may only go on gear Leah actually carried.** Not gear she would
consider, not the obvious replacement, not the best-reviewed version of a
thing she owned. If the page cannot source the claim, there is no link.

The disclosure now states this outright ("Each linked item is gear I
carried"), so the written standard and the real one match.

## Never do these

Each will look like an obvious win to whoever greps this page next.

1. **Never link the pad.** `packing/index.html` says her pad was heavy and
   loud and she would replace it. That sentence creates the sharpest buying
   intent on the site, and the replacement is gear she has never owned.
2. **Never link the four items she carried and did not use** — gaiters, the
   second cook pot, town clothes, the hammock. They surface in any grep for
   "I carried" and they are the page's honesty working, not an opportunity.
3. **Never put an affiliate link in the app, an email, or a handed-over
   file.** The Associates Operating Agreement bars Special Links from
   applications, email and offline documents. This project has three
   channels that will test it: TestFlight invite emails, the qPAWS email
   draft, and the per-build Field Check HTML handed over as artifacts. The
   app is currently clean — no Amazon strings anywhere in `SCTAPP/src`.
4. **Never route a link through `/go/` or a shortener.** That is cloaking
   under the Operating Agreement. It will be proposed one day because it
   looks like tidy engineering.
5. **No links in the checklist.** That section is advice to the reader, not
   a record of her pack.
6. **No product images.** The per-page CSP is `img-src 'self' data:`, which
   blocks Amazon-hosted images. Product images must come from SiteStripe or
   PA-API, never scraped — so this is a deliberate decision across eight
   files, not a CSP bug to fix.

## What is checked automatically

`node sct-site-qa.mjs` fails the build if a page carries `tag=trailapps-20`
without the verbatim disclosure, claims nothing is sponsored while carrying
links, or routes a link through a redirect. Mutation-tested 2026-08-31.

The script's root was hardcoded to a scratch directory for its whole life
before that date, so it had never once run.

## Known open questions

- **The pack link.** `B0F1CYKNH6` is an IX INOXTO 55 L. The anchor text says
  only "55 L pack", so the reader infers it is hers from placement. Nobody
  has confirmed it is. If Leah cannot confirm, the link comes out.
- **The wax.** `B0CST721R1` is Rhino Wax. The page said "Trail Paws", which
  is not a company. Corrected to the real brand — but if she carried a
  different wax, the link is wrong, not just the name.
- **US tag, Canadian audience.** All links are amazon.com with a US tag. The
  audience hikes a trail in British Columbia. A Canadian is redirected to
  amazon.ca, a separate program, and a US tag earns nothing there. Fixing it
  needs an amazon.ca Associates account and OneLink — both require her login.

## On scale, so nobody oversells this

A few hundred people thru-hike the Sunshine Coast Trail in a year. Outdoor
gear pays about 3%. Realistically this is single-digit dollars a month in
season and near zero outside it. Thirteen more links multiply a very small
number.

That is not a reason to do it badly. It is a reason not to trade the page's
credibility for it, because the credibility is worth more than the money by
some orders of magnitude.
