const completions = require("./completions")
const { isElementInViewport } = require("./util")
// -----------------------------------------------------------------------------------------------------------------------
// // Surfingkeys: https://github.com/brookhong/Surfingkeys
// // Config Originally From: https://github.com/b0o/surfingkeys-conf
// // Dracula Theme: https://github.com/dracula/dracula-theme#color-palette
// -----------------------------------------------------------------------------------------------------------------------
// Map Keys
// -----------------------------------------------------------------------------------------------------------------------
// Unmap undesired defaults
const unmaps = [
  "sb", "sw", "ob",
  "ow", "cp", ";cp",
  ";ap", "spa", "spb",
  "spd", "sps", "spc",
  "spi", "sfr", "zQ",
  "zz", "zR", "ab",
  "Q", "q", "ag",
  ";s", "yp", "og", "oy"
]
unmaps.forEach((u) => {
  unmap(u);
})
const rmSearchAliases =
  {
    s: ["b"],
  }

Object.keys(rmSearchAliases).forEach((k) => {
  rmSearchAliases[k].forEach((v) => {
    removeSearchAliasX(v, k);
  })
})

const vimEditURL = () => Front
  .showEditor(window.location.href, (data) => {
    window.location.href = data
  }, "url")

const domainDossier = "http://centralops.net/co/DomainDossier.aspx"

const whois = () =>
  tabOpenLink(`${domainDossier}?dom_whois=true&addr=${window.location.hostname}`)

const dns = () =>
  tabOpenLink(`${domainDossier}?dom_dns=true&addr=${window.location.hostname}`)

const dnsVerbose = () =>
  tabOpenLink(`${domainDossier}?dom_whois=true&dom_dns=true&traceroute=true&net_whois=true&svc_scan=true&addr=${window.location.hostname}`)

const togglePdfViewer = () =>
  chrome.storage.local.get("noPdfViewer", (resp) => {
    if (!resp.noPdfViewer) {
      chrome.storage.local.set({ noPdfViewer: 1 }, () => {
        Front.showBanner("PDF viewer disabled.")
      })
    } else {
      chrome.storage.local.remove("noPdfViewer", () => {
        Front.showBanner("PDF viewer enabled.")
      })
    }
  })

const getURLPath = (count, domain) => {
  let path = window.location.pathname.slice(1)
  if (count) {
    path = path.split("/").slice(0, count).join("/")
  }
  if (domain) {
    path = `${window.location.hostname}/${path}`
  }
  return path
}

const copyURLPath = (count, domain) => () => Clipboard.write(getURLPath(count, domain))

const editSettings = () => tabOpenLink("/pages/options.html")

const Hint = (selector, action = Hints.dispatchMouseClick) => () => Hints.create(selector, action)

// ---- Mapkeys ----//
const ri = { repeatIgnore: true }

// --- Global mappings ---//
//  0: Help
//  1: Mouse Click
//  2: Scroll Page / Element
//  3: Tabs
//  4: Page Navigation
mapkey("gi", "#4Edit current URL with vim editor", vimEditURL, ri)
mapkey("gI", "#4View image in new tab", Hint("img", i => tabOpenLink(i.src)), ri)
//  5: Sessions
//  6: Search selected with
//  7: Clipboard
mapkey("yp", "#7Copy URL path of current page", copyURLPath(), ri)
mapkey("yI", "#7Copy Image URL", Hint("img", i => Clipboard.write(i.src)), ri)
//  8: Omnibar
//  9: Visual Mode
// 10: vim-like marks
// 11: Settings
mapkey(";se", "#11Edit Settings", editSettings, ri)
// 12: Chrome URLs
mapkey("gS", "#12Open Chrome settings", () => tabOpenLink("chrome://settings/"))
// 13: Proxy
// 14: Misc
mapkey("=w", "#14Lookup whois information for domain", whois, ri)
mapkey("=d", "#14Lookup dns information for domain", dns, ri)
mapkey("=D", "#14Lookup all information for domain", dnsVerbose, ri)
mapkey(";pd", "#14Toggle PDF viewer from SurfingKeys", togglePdfViewer, ri)
// 15: Insert Mode

// --- Site-specific mappings ---//
const siteleader = "<Space>"

function mapsitekey(domainRegex, key, desc, f, opts = {}) {
  const o = Object.assign({}, {
    leader: siteleader,
  }, opts)
  mapkey(`${o.leader}${key}`, desc, f, { domain: domainRegex })
}

function mapsitekeys(d, maps, opts = {}) {
  const domain = d.replace(".", "\\.")
  const domainRegex = new RegExp(`^http(s)?://(([a-zA-Z0-9-_]+\\.)*)(${domain})(/.*)?`)
  maps.forEach((map) => {
    const [
      key,
      desc,
      f,
      subOpts = {},
    ] = map
    mapsitekey(domainRegex, key, desc, f, Object.assign({}, opts, subOpts))
  })
}

const fakeSpot = () => tabOpenLink(`http://fakespot.com/analyze?url=${window.location.href}`)

mapsitekeys("amazon.com", [
  ["fs", "Fakespot", fakeSpot],
])

mapsitekeys("yelp.com", [
  ["fs", "Fakespot", fakeSpot],
])

const ytFullscreen = () => document
  .querySelector(".ytp-fullscreen-button.ytp-button")
  .click()

mapsitekeys("youtube.com", [
  ["A", "Open video", Hint("*[id='video-title']")],
  ["C", "Open channel", Hint("*[id='byline']")],
  ["gH", "Goto homepage", () => window.location.assign("https://www.youtube.com/feed/subscriptions?flow=2")],
  ["F", "Toggle fullscreen", ytFullscreen],
  ["<Space>", "Play/pause", Hint(".ytp-play-button")],
], { leader: "" })


const vimeoFullscreen = () => document
  .querySelector(".fullscreen-icon")
  .click()

mapsitekeys("vimeo.com", [
  ["F", "Toggle fullscreen", vimeoFullscreen],
])

const ghStar = toggle => () => {
  const repo = window.location.pathname.slice(1).split("/").slice(0, 2).join("/")
  const container = document.querySelector("div.starring-container")
  const status = container.classList.contains("on")

  let star = "★"
  let statusMsg = "starred"
  let verb = "is"

  if ((status && toggle) || (!status && !toggle)) {
    statusMsg = `un${statusMsg}`
    star = "☆"
  }

  if (toggle) {
    verb = "has been"
    if (status) {
      container.querySelector(".starred>button").click()
    } else {
      container.querySelector(".unstarred>button").click()
    }
  }

  Front.showBanner(`${star} Repository ${repo} ${verb} ${statusMsg}!`)
}

const viewGodoc = () => tabOpenLink(`https://godoc.org/${getURLPath(2, true)}`)

mapsitekeys("github.com", [
  ["s", "Toggle Star", ghStar(true)],
  ["S", "Check Star", ghStar(false)],
  ["y", "Copy Project Path", copyURLPath(2)],
  ["Y", "Copy Project Path (including domain)", copyURLPath(2, true)],
  ["D", "View GoDoc for Project", viewGodoc],
])

const glToggleStar = () => {
  const repo = window.location.pathname.slice(1).split("/").slice(0, 2).join("/")
  const btn = document.querySelector(".btn.star-btn > span")
  btn.click()
  const action = `${btn.textContent.toLowerCase()}red`
  let star = "☆"
  if (action === "starred") {
    star = "★"
  }
  Front.showBanner(`${star} Repository ${repo} ${action}`)
}

mapsitekeys("gitlab.com", [
  ["s", "Toggle Star", glToggleStar],
  ["y", "Copy Project Path", copyURLPath(2)],
  ["Y", "Copy Project Path (including domain)", copyURLPath(2, true)],
  ["D", "View GoDoc for Project", viewGodoc],
])

mapsitekeys("twitter.com", [
  ["f", "Follow user", Hint(".follow-button")],
  ["s", "Like tweet", Hint(".js-actionFavorite")],
  ["R", "Retweet", Hint(".js-actionRetweet")],
  ["c", "Comment/Reply", Hint(".js-actionReply")],
  ["t", "New tweet", Hint(".js-global-new-tweet")],
  ["T", "Tweet to", Hint(".NewTweetButton")],
  ["r", "Load new tweets", Hint(".new-tweets-bar")],
  ["g", "Goto user", Hint(".js-user-profile-link")],
])

const redditCollapseNextComment = () => {
  const vis = Array.from(document.querySelectorAll(".noncollapsed.comment"))
    .filter(e => isElementInViewport(e))
  if (vis.length > 0) {
    vis[0].querySelector(".expand").click()
  }
}

mapsitekeys("reddit.com", [
  ["x", "Collapse comment", Hint(".expand")],
  ["X", "Collapse next comment", redditCollapseNextComment],
  ["s", "Upvote", Hint(".arrow.up")],
  ["S", "Downvote", Hint(".arrow.down")],
  ["e", "Expand expando", Hint(".expando-button")],
  ["a", "View post (link)", Hint(".title")],
  ["c", "View post (comments)", Hint(".comments")],
])

const hnGoParent = () => {
  const par = document.querySelector(".par>a")
  if (!par) {
    return
  }
  window.location.assign(par.href)
}

const hnCollapseNextComment = () => {
  const vis = Array.from(document.querySelectorAll("a.togg"))
    .filter(e => e.innerText === "[-]" && isElementInViewport(e))
  if (vis.length > 0) {
    vis[0].click()
  }
}

mapsitekeys("news.ycombinator.com", [
  ["x", "Collapse comment", Hint(".togg")],
  ["X", "Collapse next comment", hnCollapseNextComment],
  ["s", "Upvote", Hint(".votearrow[title='upvote']")],
  ["S", "Downvote", Hint(".votearrow[title='downvote']")],
  ["a", "View post (link)", Hint(".storylink")],
  ["c", "View post (comments)", Hint("td > a[href*='item']:not(.storylink)")],
  ["p", "Go to parent", hnGoParent],
])

const wpToggleSimple = () => {
  window.location.hostname = window.location.hostname.split(".")
    .map((s, i) => {
      if (i === 0) {
        return s === "simple" ? "" : "simple"
      }
      return s
    }).filter(s => s !== "").join(".")
}

mapsitekeys("wikipedia.org", [
  ["s", "Toggle simple version of current article", wpToggleSimple],
])

// ---- Search & completion ----//
// Search leader
const sl = "o"

// Register Search Engine Completions
// The `completions` variable is defined in `completions.js` and
// is prepended to this file by gulp-concat.
Object.keys(completions).forEach((k) => {
  const s = completions[k] // Search Engine object
  const la = sl + s.alias // Search leader + alias

  addSearchAliasX(s.alias, s.name, s.search, sl, s.compl, s.callback)
  mapkey(la, `#8Search ${s.name}`, () => Front.openOmnibar({ type: "SearchEngine", extra: s.alias }))
})

// -----------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------------
cmap('<Ctrl-j>', '<Tab>');
cmap('<Ctrl-k>', '<Shift-Tab>');
unmap('w'); // By default this opens current tab in a new window, which I don't like
map('w', 'cs'); // Instead this focuses the main pane
map('oo', 'ago'); // 'oo' is now like 'o' in vimium, open in this tab
map('O', 'ago'); // 'oo' is now like 'o' in vimium, open in this tab
// map('b', 'T'); // Go through buffers (tabs)
// map('B', 'b'); // Go through bookmarks
map('<Ctrl-d>', 'd'); // scroll half-page down
map('<Ctrl-u>', 'e'); // scroll half-page up
map('h', 'S'); // go back in history
map('l', 'D'); // go forward in history
map('<Ctrl-l>', 'R'); // next tab
map('<Ctrl-h>', 'E'); // previous tab
map('l', 'R'); // next tab
map('h', 'E'); // previous tab
map('u', 'X'); // restore closed tab
// -----------------------------------------------------------------------------------------------------------------------
// Settings
// -----------------------------------------------------------------------------------------------------------------------
settings.useLocalMarkdownAPI = false;
settings.hintAlign = "left";
settings.focusFirstCandidate = true;
settings.modeAfterYank = "Normal";
settings.scrollStepSize = 140;
settings.focusAfterClosed = "left";
settings.richHintsForKeystroke = 1;
settings.newTabPosition = "last";
// -----------------------------------------------------------------------------------------------------------------------
// ACE Vim
// -----------------------------------------------------------------------------------------------------------------------
aceVimMap('ZQ', ':q!', 'normal');
aceVimMap('ZZ', ':wq', 'normal');
aceVimMap('Y', 'y$', 'insert');
// -----------------------------------------------------------------------------------------------------------------------
// Change hints styles
// -----------------------------------------------------------------------------------------------------------------------
// Hints.characters = '1234567890';
Hints.characters = "asdfgqwertvbn";
Hints.style('border: solid 1px #ff79c6; color:#44475a; background: #f1fa8c; background-color: #f1fa8c; font-size: 10pt; font-family: "Fira Code"');
Hints.style('border: solid 8px #ff79c6;padding: 1px;background: #f1fa8c; font-family: "Fira Code"', "text");
// -----------------------------------------------------------------------------------------------------------------------
// Change search marks and cursor
// -----------------------------------------------------------------------------------------------------------------------
Visual.style('marks', 'background-color: #f1fa8c;');
Visual.style('cursor', 'background-color: #6272a4; color: #f8f8f2');
// -----------------------------------------------------------------------------------------------------------------------
// Change theme
// -----------------------------------------------------------------------------------------------------------------------
settings.theme = `
/* Disable RichHints CSS animation */
.expandRichHints {
    animation: 0s ease-in-out 1 forwards expandRichHints;
}
.collapseRichHints {
    animation: 0s ease-in-out 1 forwards collapseRichHints;
}
.sk_theme input {
    font-family: "Fira Code";
}
.sk_theme .url {
    font-size: 10px;
}
#sk_omnibarSearchResult li div.url {
    font-weight: normal;
}
.sk_theme .omnibar_timestamp {
    font-size: 11px;
    font-weight: bold;
}
.sk_theme .omnibar_visitcount {
    font-size: 11px;
    font-weight: bold;
}
body {
    font-family: "Fira Code", Consolas, "Liberation Mono", Menlo, Courier, monospace;
    font-size: 14px;
}
kbd {
    font: 11px "Fira Code", Consolas, "Liberation Mono", Menlo, Courier, monospace;
}
#sk_omnibarSearchArea .prompt, #sk_omnibarSearchArea .resultPage {
    font-size: 12px;
}
.sk_theme {
    background: #282a36;
    color: #f8f8f2;
}
.sk_theme tbody {
    color: #ff5555;
}
.sk_theme input {
    color: #ffb86c;
}
.sk_theme .url {
    color: #6272a4;
}
#sk_omnibarSearchResult>ul>li {
    background: #282a36;
}
#sk_omnibarSearchResult>ul>li:nth-child(odd) {
    background: #282a36;
}
.sk_theme .annotation {
    color: #6272a4;
}
.sk_theme .focused {
    background: #44475a !important;
}
.sk_theme kbd {
    background: #f8f8f2;
    color: #44475a;
}
.sk_theme .frame {
    background: #8178DE9E;
}
.sk_theme .omnibar_highlight {
    color: #8be9fd;
}
.sk_theme .omnibar_folder {
    color: #ff79c6;
}
.sk_theme .omnibar_timestamp {
    color: #bd93f9;
}
.sk_theme .omnibar_visitcount {
    color: #f1fa8c;
}
.sk_theme #sk_omnibarSearchResult>ul>li:nth-child(odd) {
    background: #282a36;
}
.sk_theme .prompt, .sk_theme .resultPage {
    color: #50fa7b;
}
.sk_theme .feature_name {
    color: #ff5555;
}
.sk_omnibar_middle #sk_omnibarSearchArea {
    border-bottom: 1px solid #282a36;
}
#sk_status {
    border: 1px solid #282a36;
}
#sk_richKeystroke {
    background: #282a36;
    box-shadow: 0px 2px 10px rgba(40, 42, 54, 0.8);
}
#sk_richKeystroke kbd>.candidates {
    color: #ff5555;
}
#sk_keystroke {
    background-color: #282a36;
    color: #f8f8f2;
}
kbd {
    border: solid 1px #f8f8f2;
    border-bottom-color: #f8f8f2;
    box-shadow: inset 0 -1px 0 #f8f8f2;
}
#sk_frame {
    border: 4px solid #ff5555;
    background: #8178DE9E;
    box-shadow: 0px 0px 10px #DA3C0DCC;
}
#sk_banner {
    border: 1px solid #282a36;
    background: rgb(68, 71, 90);
}
div.sk_tabs_bg {
    background: #f8f8f2;
}
div.sk_tab {
    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#6272a4), color-stop(100%,#44475a));
}
div.sk_tab_title {
    color: #f8f8f2;
}
div.sk_tab_url {
    color: #8be9fd;
}
div.sk_tab_hint {
    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#f1fa8c), color-stop(100%,#ffb86c));
    color: #282a36;
    border: solid 1px #282a36;
}
#sk_bubble {
    border: 1px solid #f8f8f2;
    color: #282a36;
    background-color: #f8f8f2;
}
#sk_bubble * {
    color: #282a36 !important;
}
div.sk_arrow[dir=down]>div:nth-of-type(1) {
    border-top: 12px solid #f8f8f2;
}
div.sk_arrow[dir=up]>div:nth-of-type(1) {
    border-bottom: 12px solid #f8f8f2;
}
div.sk_arrow[dir=down]>div:nth-of-type(2) {
    border-top: 10px solid #f8f8f2;
}
div.sk_arrow[dir=up]>div:nth-of-type(2) {
    border-bottom: 10px solid #f8f8f2;
}
}`

