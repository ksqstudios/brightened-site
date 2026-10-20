# brightened-site

Website for Brightened, brightened.app.

Static HTML/CSS, deployed via Cloudflare Pages with GitHub auto-deploy on push to `main`.

Cream paper and the app's five stage gradients, set in Instrument Serif and Instrument Sans. On the home page an example week rises day by day and the panel moves through the stages as the average passes each quarter of the goal, the app's own rule; any day can be dragged. Further down, a sun crosses the day's arc and lights the stretches spent outside.

```
.
├── index.html         # home page
├── privacy.html       # privacy policy
├── support.html       # support page
├── event/duo.html     # 1.1 In-App Event page (deep link target)
├── styles.css         # shared stylesheet
├── scripts.js         # the example week and the day's arc
├── _headers           # Cloudflare Pages headers
├── .well-known/       # apple-app-site-association for universal links
└── images/            # app screenshots and the iPhone Duo image
```

## Analytics

None. The privacy policy says the site collects nothing: no analytics, no cookies, no third-party scripts. Keep it that way.
