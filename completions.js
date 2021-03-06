const { keys } = require("./conf.priv.js")

function escape(str) {
  return String(str).replace(/[&<>"'`=/]/g, s => ({
    "&":  "&amp;",
    "<":  "&lt;",
    ">":  "&gt;",
    "\"": "&quot;",
    "'":  "&#39;",
    "/":  "&#x2F;",
    "`":  "&#x60;",
    "=":  "&#x3D;",
  }[s]))
}

function createSuggestionItem(html, props = {}) {
  const li = document.createElement("li")
  li.innerHTML = html
  return { html: li.outerHTML, props }
}

function createURLItem(title, url, sanitize = true) {
  let t = title
  let u = url
  if (sanitize) {
    t = escape(t)
    u = new URL(u).toString()
  }
  return createSuggestionItem(`
      <div class="title">${t}</div>
      <div class="url">${u}</div>
    `, { url: u })
}

// ****** Helper Functions ****** //
function googleCxCallback(response) {
  const res = JSON.parse(response.text).items
  return res.map(s => createSuggestionItem(`
      <div>
        <div class="title"><strong>${s.htmlTitle}</strong></div>
        <div>${s.htmlSnippet}</div>
      </div>
    `, { url: s.link }))
}

function googleCxURL(alias) {
  const key = `google_cx_${alias}`
  return `https://www.googleapis.com/customsearch/v1?key=${keys.google_cs}&cx=${keys[key]}&q=`
}

function googleCxPublicURL(alias) {
  const key = `google_cx_${alias}`
  return `https://cse.google.com/cse/publicurl?cx=${keys[key]}&q=`
}

// ****** Completions ****** //
const completions = {}

// ****** Arch Linux ****** //

// Arch Linux official repos
completions.al = {
  alias:    "al",
  name:     "archlinux",
  search:   "https://www.archlinux.org/packages/?arch=x86_64&q=",
  compl:    googleCxURL("al"),
  callback: googleCxCallback,
}

// Arch Linux AUR
completions.au = {
  alias:  "au",
  name:   "AUR",
  search: "https://aur.archlinux.org/packages/?O=0&SeB=nd&outdated=&SB=v&SO=d&PP=100&do_Search=Go&K=",
  compl:  "https://aur.archlinux.org/rpc?type=suggest&arg=",
}

completions.au.callback = (response) => {
  const res = JSON.parse(response.text)
  return res.map(s => createURLItem(s, `https://aur.archlinux.org/packages/${s}`))
}

// Arch Linux Wiki
completions.aw = {
  alias:  "aw",
  name:   "archwiki",
  search: "https://wiki.archlinux.org/index.php?go=go&search=",
  compl:  "https://wiki.archlinux.org/api.php?action=opensearch&format=json&formatversion=2&namespace=0&limit=10&suggest=true&search=",
}

completions.aw.callback = response => JSON.parse(response.text)[1]

// Arch Linux Forums
completions.af = {
  alias:    "af",
  name:     "archforums",
  search:   googleCxPublicURL("af"),
  compl:    googleCxURL("af"),
  callback: googleCxCallback,
}

// ****** Technical Resources ****** //

// Chrome Webstore
completions.cs = {
  alias:    "cs",
  name:     "chromestore",
  search:   "https://chrome.google.com/webstore/search/",
  compl:    googleCxURL("cs"),
  callback: googleCxCallback,
}

// OWASP Wiki
completions.ow = {
  alias:  "ow",
  name:   "owasp",
  search: "https://www.owasp.org/index.php?go=go&search=",
  compl:  "https://www.owasp.org/api.php?action=opensearch&format=json&formatversion=2&namespace=0&limit=10&suggest=true&search=",
}

completions.ow.callback = response => JSON.parse(response.text)[1]

// StackOverflow
completions.so = {
  alias:  "so",
  name:   "stackoverflow",
  search: "https://stackoverflow.com/search?q=",
  compl:  "https://api.stackexchange.com/2.2/search/advanced?pagesize=10&order=desc&sort=relevance&site=stackoverflow&q=",
}

completions.so.callback = response =>
  JSON.parse(response.text).items.map(s => createURLItem(`[${s.score}] ${s.title}`, s.link))

// DockerHub repo search
completions.dh = {
  alias:  "dh",
  name:   "dockerhub",
  search: "https://hub.docker.com/search/?page=1&q=",
  compl:  "https://hub.docker.com/v2/search/repositories/?page_size=20&query=",
}

completions.dh.callback = response => JSON.parse(response.text).results.map((s) => {
  let meta = ""
  let repo = escape(s.repo_name)
  meta += `[★${escape(s.star_count)}] `
  meta += `[↓${escape(s.pull_count)}] `
  if (repo.indexOf("/") === -1) {
    repo = `_/${repo}`
  }
  return createSuggestionItem(`
      <div>
        <div class="title"><strong>${escape(s.repo_name)}</strong></div>
        <div>${meta}</div>
        <div>${escape(s.short_description)}</div>
      </div>
    `, { url: `https://hub.docker.com/r/${repo}` })
})

// GitHub
completions.gh = {
  alias:  "gh",
  name:   "github",
  search: "https://github.com/search?q=",
  compl:  "https://api.github.com/search/repositories?sort=stars&order=desc&q=",
}

completions.gh.callback = response => JSON.parse(response.text).items.map((s) => {
  let prefix = ""
  if (s.stargazers_count) {
    prefix += `[★${s.stargazers_count}] `
  }
  return createURLItem(prefix + s.full_name, s.html_url)
})

// Domainr domain search
completions.do = {
  alias:  "do",
  name:   "domainr",
  search: "https://domainr.com/?q=",
  compl:  `https://domainr.p.mashape.com/v2/search?mashape-key=${keys.domainr}&query=%s`,
}

completions.do.callback = response => JSON.parse(response.text).results
  .map(d => createSuggestionItem(
    `<div><div class="title"><strong>${escape(d.domain)}</strong></div></div>`,
    { url: `https://domainr.com/${d.domain}` }
  ))

// Vim Wiki
completions.vw = {
  alias:  "vw",
  name:   "vimwikia",
  search: "https://vim.wikia.com/wiki/Special:Search?query=",
  compl:  "https://vim.wikia.com/api.php?action=opensearch&format=json&formatversion=2&namespace=0&limit=10&suggest=true&search=",
}

completions.vw.callback = response => JSON.parse(response.text)[1]
  .map(r => createURLItem(r, `https://vim.wikia.com/wiki/${r}`))

// ****** Shopping & Food ****** //

// Amazon
completions.az = {
  alias:  "az",
  name:   "amazon",
  search: "https://smile.amazon.com/s/?field-keywords=",
  compl:  "https://completion.amazon.com/search/complete?method=completion&mkt=1&search-alias=aps&q=",
}

completions.az.callback = response => JSON.parse(response.text)[1]

// Craigslist
completions.cl = {
  alias:  "cl",
  name:   "craigslist",
  search: "https://craigslist.org/search/sss?query=",
  compl:  "https://craigslist.org/suggest?v=12&type=search&cat=sss&area=1&term=",
}

completions.cl.callback = response => JSON.parse(response.text)

// EBay
completions.eb = {
  alias:  "eb",
  name:   "ebay",
  search: "https://www.ebay.com/sch/i.html?_nkw=",
  compl:  "https://autosug.ebay.com/autosug?callback=0&sId=0&kwd=",
}

completions.eb.callback = response => JSON.parse(response.text).res.sug

// Yelp
completions.yp = {
  alias:  "yp",
  name:   "yelp",
  search: "https://www.yelp.com/search?find_desc=",
  compl:  "https://www.yelp.com/search_suggest/v2/prefetch?prefix=",
}

completions.yp.callback = (response) => {
  const res = JSON.parse(response.text).response
  const words = []
  res.forEach((r) => {
    r.suggestions.forEach((s) => {
      const w = s.query
      if (words.indexOf(w) === -1) {
        words.push(w)
      }
    })
  })
  return words
}

// ****** General References, Calculators & Utilities ****** //

// Dictionary
completions.de = {
  alias:  "de",
  name:   "define",
  search: "http://onelook.com/?w=",
  compl:  "https://api.datamuse.com/words?md=d&sp=%s*",
}

completions.de.callback = (response) => {
  const res = JSON.parse(response.text)
  const defs = []
  res.forEach((r) => {
    if (!r.defs || r.defs.length === 0) {
      defs.push([r.word, "", ""])
      return
    }
    r.defs.forEach((d) => {
      const ds = d.split("\t")
      const sp = `(${ds[0]})`
      const def = ds[1]

      defs.push([r.word, sp, def])
    })
  })
  return defs.map((d) => {
    const word = escape(d[0])
    const pos = escape(d[1])
    const def = escape(d[2])
    return createSuggestionItem(
      `<div class="title"><strong>${word}</strong> <em>${pos}</em> ${def}</div>`,
      { url: `http://onelook.com/?w=${encodeURIComponent(d[0])}` }
    )
  })
}

// Thesaurus
completions.th = {
  alias:  "th",
  name:   "thesaurus",
  search: "https://www.onelook.com/thesaurus/?s=",
  compl:  "https://api.datamuse.com/words?md=d&ml=%s",
}

completions.th.callback = (response) => {
  const res = JSON.parse(response.text)
  const defs = []
  res.forEach((r) => {
    if (!r.defs || r.defs.length === 0) {
      defs.push([escape(r.word), "", ""])
      return
    }
    r.defs.forEach((d) => {
      const ds = d.split("\t")
      const sp = `(${escape(ds[0])})`
      const def = escape(ds[1])
      defs.push([escape(r.word), sp, def])
    })
  })
  return defs.map(d => createSuggestionItem(
    `<div class="title"><strong>${d[0]}</strong> <em>${d[1]}</em> ${d[2]}</div>`,
    { url: `http://onelook.com/thesaurus/?s=${d[0]}` }
  ))
}

// Wikipedia
completions.wp = {
  alias:  "wp",
  name:   "wikipedia",
  search: "https://en.wikipedia.org/w/index.php?search=",
  compl:  "https://en.wikipedia.org/w/api.php?action=query&format=json&generator=prefixsearch&prop=info|pageprops%7Cpageimages%7Cdescription&redirects=&ppprop=displaytitle&piprop=thumbnail&pithumbsize=100&pilimit=6&inprop=url&gpssearch=",
}

const wpNoimg = "data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2056%2056%22%20enable-background%3D%22new%200%200%2056%2056%22%3E%0A%20%20%20%20%3Cpath%20fill%3D%22%23eee%22%20d%3D%22M0%200h56v56h-56z%22%2F%3E%0A%20%20%20%20%3Cpath%20fill%3D%22%23999%22%20d%3D%22M36.4%2013.5h-18.6v24.9c0%201.4.9%202.3%202.3%202.3h18.7v-25c.1-1.4-1-2.2-2.4-2.2zm-6.2%203.5h5.1v6.4h-5.1v-6.4zm-8.8%200h6v1.8h-6v-1.8zm0%204.6h6v1.8h-6v-1.8zm0%2015.5v-1.8h13.8v1.8h-13.8zm13.8-4.5h-13.8v-1.8h13.8v1.8zm0-4.7h-13.8v-1.8h13.8v1.8z%22%2F%3E%0A%3C%2Fsvg%3E%0A"

completions.wp.callback = response => Object.values(JSON.parse(response.text).query.pages)
  .map((p) => {
    const img = p.thumbnail ? p.thumbnail.source : wpNoimg
    return createSuggestionItem(
      `
      <div style="padding:5px;display:grid;grid-template-columns:60px 1fr;grid-gap:15px">
        <img style="width:60px" src="${img}" alt="${p.title}">
        <div>
          <div class="title"><strong>${p.title}</strong></div>
          <div class="title">${p.description}</div>
        </div>
      </div>
    `,
      { url: p.fullurl }
    )
  })

// Wikipedia - Simple English version
completions.ws = {
  alias:    "ws",
  name:     "wikipedia-simple",
  search:   "https://simple.wikipedia.org/w/index.php?search=",
  compl:    "https://simple.wikipedia.org/w/api.php?action=query&format=json&generator=prefixsearch&prop=info|pageprops%7Cpageimages%7Cdescription&redirects=&ppprop=displaytitle&piprop=thumbnail&pithumbsize=100&pilimit=6&inprop=url&gpssearch=",
  callback: completions.wp.callback,
}

// WolframAlpha
completions.wa = {
  alias:  "wa",
  name:   "wolframalpha",
  search: "http://www.wolframalpha.com/input/?i=",
  compl:  `http://api.wolframalpha.com/v2/query?appid=${keys.wolframalpha}&format=plaintext&output=json&reinterpret=true&input=%s`,
}

completions.wa.callback = (response) => {
  const res = JSON.parse(response.text).queryresult

  if (res.error) {
    return [createSuggestionItem(`
      <div>
        <div class="title"><strong>Error</strong> (Code ${escape(res.error.code)})</div>
        <div class="title">${escape(res.error.msg)}</div>
      </div>`, { url: "https://www.wolframalpha.com/" })]
  }

  if (!res.success) {
    if (res.tips) {
      return [createSuggestionItem(`
        <div>
          <div class="title"><strong>No Results</strong></div>
          <div class="title">${escape(res.tips.text)}</div>
        </div>`, { url: "https://www.wolframalpha.com/" })]
    }
    if (res.didyoumeans) {
      return res.didyoumeans.map(s => createSuggestionItem(`
        <div>
            <div class="title"><strong>Did you mean...?</strong></div>
            <div class="title">${escape(s.val)}</div>
        </div>`, { url: "https://www.wolframalpha.com/" }))
    }
    return [createSuggestionItem(`
      <div>
        <div class="title"><strong>Error</strong></div>
        <div class="title">An unknown error occurred.</div>
      </div>`, { url: "https://www.wolframalpha.com/" })]
  }

  const results = []
  res.pods.forEach((p) => {
    const result = {
      title:  escape(p.title),
      values: [],
      url:    "http://www.wolframalpha.com/input/?i=",
    }
    if (p.numsubpods > 0) {
      result.url += encodeURIComponent(p.subpods[0].plaintext)
      p.subpods.forEach((sp) => {
        if (!sp.plaintext) return
        let v = ""
        if (sp.title) {
          v += `<strong>${escape(sp.title)}</strong>: `
        }
        v += escape(sp.plaintext)
        result.values.push(`<div class="title">${v}</div>`)
      })
    }
    if (result.values.length > 0) {
      results.push(result)
    }
  })

  return results.map(r => createSuggestionItem(`
    <div>
      <div class="title"><strong>${r.title}</strong></div>
      ${r.values.join("\n")}
    </div>`, { url: r.url }))
}

// ****** Business Utilities & References ****** //

// This is a base64-encoded image used as a placeholder for
// the crunchbase Omnibar results if they don't have an image
const blank = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAAAAAByaaZbAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAACYktHRAD/h4/MvwAAAAlwSFlzAAAOwwAADsMBx2+oZAAAAAd0SU1FB+EICxEMErRVWUQAAABOdEVYdFJhdyBwcm9maWxlIHR5cGUgZXhpZgAKZXhpZgogICAgICAyMAo0NTc4Njk2NjAwMDA0OTQ5MmEwMDA4MDAwMDAwMDAwMDAwMDAwMDAwCnwMkD0AAAGXSURBVEjH1ZRvc4IwDMb7/T8dbVr/sEPlPJQd3g22GzJdmxVOHaQa8N2WN7wwvyZ5Eh/hngzxTwDr0If/TAK67POxbqxnpgCIx9dkrkEvswYnAFiutFSgtQapS4ejwFYqbXQXBmC+QxawuI/MJb0LiCq0DICNHoZRKQdYLKQZEhATcQmwDYD5GR8DDtfqaYAMActvTiVMaUvqhZPVYhYAK2SBAwGMTHngnc4wVmFPW9L6k1PJxbSCkfvhqolKSQhsWSClizNyxwAWdzIADixQRXRmdWSHthsg+TknaztFMZgC3vh/nG/qo68TLAKrCSrUg1ulp3cH+BpItBp3DZf0lFXVOIDnBdwKkLO4D5Q3QMO6HJ+hUb1NKNWMGJn3jf4ejPKn99CXOtsuyab95obGL/rpdZ7oIJK87iPiumG01drbdggoCZuq/f0XaB8/FbG62Ta5cD97XJwuZUT7ONbZTIK5m94hBuQs8535MsL5xxPw6ZoNj0DiyzhhcyMf9BJ0Jk1uRRpNyb4y0UaM9UI7E8+kt/EHgR/R6042JzmiwgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxNy0wOC0xMVQxNzoxMjoxOC0wNDowMLy29LgAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTctMDgtMTFUMTc6MTI6MTgtMDQ6MDDN60wEAAAAAElFTkSuQmCC"

const parseCrunchbase = (response, parse) => {
  const res = JSON.parse(response.text).data.items
  if (res.length === 0) {
    return [createSuggestionItem(`
      <div>
        <div class="title"><strong>No Results</strong></div>
        <div class="title">Nothing matched your query</div>
      </div>`, { url: "https://www.crunchbase.com/" })]
  }
  const objs = res.map(obj => parse(obj))
  return objs.map((p) => {
    const domain = p.domain ? ` | <a href="https://${p.domain}" target="_blank">${p.domain}</a>` : ""
    const location = p.loc ? ` located in <em>${p.loc}</em>` : ""
    return createSuggestionItem(`
      <div style="padding:5px;display:grid;grid-template-columns:60px 1fr;grid-gap:15px">
        <img style="width:60px" src="${p.img}" alt="${p.name}">
        <div style="display:grid;grid-template-rows:1fr 1fr 0.8fr">
          <div class="title"><strong style="font-size: 1.2em">${p.name}</strong></div>
          <div class="title" style="font-size: 1.2em">${p.desc}</div>
          <div class="title"><em>${p.role}</em>${location}${domain}</div>
        </div>
      </div>`, { url: p.url })
  })
}

// Crunchbase Organization Search
completions.co = {
  alias:  "co",
  name:   "crunchbase-orgs",
  search: "https://www.crunchbase.com/textsearch?q=",
  compl:  `https://api.crunchbase.com/v/3/odm_organizations?user_key=${keys.crunchbase}&query=%s`,
}

completions.co.callback = response => parseCrunchbase(response, (org) => {
  const r = org.properties
  const p = {
    name:   escape(r.name),
    domain: r.domain !== null ? escape(r.domain).replace(/\/$/, "") : null,
    desc:   escape(r.short_description),
    role:   escape(r.primary_role),
    img:    blank,
    loc:    "",
    url:    `https://www.crunchbase.com/${r.web_path}`,
  }

  p.loc += (r.city_name !== null) ? escape(r.city_name) : ""
  p.loc += (r.region_name !== null && p.loc !== "") ? ", " : ""
  p.loc += (r.region_name !== null) ? escape(r.region_name) : ""
  p.loc += (r.country_code !== null && p.loc !== "") ? ", " : ""
  p.loc += (r.country_code !== null) ? escape(r.country_code) : ""

  if (r.profile_image_url !== null) {
    const u = r.profile_image_url
    const img = u.slice(u.indexOf("t_api_images") + "t_api_images".length + 1)
    p.img = `https://res-4.cloudinary.com/crunchbase-production/image/upload/c_lpad,h_100,w_100,f_auto,b_white,q_auto:eco/${img}`
  }

  return p
})

// Crunchbase People Search
completions.cp = {
  alias:  "cp",
  name:   "crunchbase-people",
  search: "https://www.crunchbase.com/app/search/?q=",
  compl:  `https://api.crunchbase.com/v/3/odm_people?user_key=${keys.crunchbase}&query=%s`,
}

completions.cp.callback = response => parseCrunchbase(response, (person) => {
  const r = person.properties
  const p = {
    name: `${escape(r.first_name)} ${escape(r.last_name)}`,
    desc: "",
    img:  blank,
    role: "",
    loc:  "",
    url:  `https://www.crunchbase.com/${r.web_path}`,
  }

  p.desc += (r.title !== null) ? escape(r.title) : ""
  p.desc += (r.organization_name !== null && p.desc !== "") ? ", " : ""
  p.desc += (r.organization_name !== null) ? escape(r.organization_name) : ""

  p.loc += (r.city_name !== null) ? escape(r.city_name) : ""
  p.loc += (r.region_name !== null && p.loc !== "") ? ", " : ""
  p.loc += (r.region_name !== null) ? escape(r.region_name) : ""
  p.loc += (r.country_code !== null && p.loc !== "") ? ", " : ""
  p.loc += (r.country_code !== null) ? escape(r.country_code) : ""

  if (r.profile_image_url !== null) {
    const url = r.profile_image_url
    const path = url.split("/")
    const img = encodeURIComponent(path[path.length - 1])
    p.img = `http://public.crunchbase.com/t_api_images/v1402944794/c_pad,h_50,w_50/${img}`
  }

  return p
})

// ****** Search Engines ****** //

// DuckDuckGo
completions.dg = {
  alias:  "dg",
  name:   "duckduckgo",
  search: "https://duckduckgo.com/?q=",
  compl:  "https://duckduckgo.com/ac/?q=",
}

completions.dg.callback = response => JSON.parse(response.text).map(r => r.phrase)

// Google
completions.go = {
  alias:  "go",
  name:   "google",
  search: "https://www.google.com/search?q=",
  compl:  "https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext&oit=1&cp=1&pgcl=7&q=",
}

completions.go.callback = response => JSON.parse(response.text)[1]

// Google Images
completions.gi = {
  alias:  "gi",
  name:   "google-images",
  search: "https://www.google.com/search?tbm=isch&q=",
  compl:  "https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext&oit=1&cp=1&pgcl=7&ds=i&q=",
}

completions.gi.callback = response => JSON.parse(response.text)[1]

// Google - I'm Feeling Lucky
completions.gl = {
  alias:  "gl",
  name:   "google-lucky",
  search: "https://www.google.com/search?btnI=1&q=",
  compl:  "https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext&oit=1&cp=1&pgcl=7&q=",
}

completions.gl.callback = response => JSON.parse(response.text)[1]

//  ****** Elixir ****** //

// Hex.pm
completions.hx = {
  alias:  "hx",
  name:   "hex",
  search: "https://hex.pm/packages?sort=downloads&search=",
  compl:  "https://hex.pm/api/packages?sort=downloads&hx&search=",
}

completions.hx.callback = response => JSON.parse(response.text).map((s) => {
  let dls = ""
  let desc = ""
  let liscs = ""
  if (s.downloads && s.downloads.all) {
    dls = `[↓${escape(s.downloads.all)}] `
  }
  if (s.meta) {
    if (s.meta.description) {
      desc = escape(s.meta.description)
    }
    if (s.meta.licenses) {
      s.meta.licenses.forEach((l) => {
        liscs += `[&copy;${escape(l)}] `
      })
    }
  }
  return createSuggestionItem(`
    <div>
      <div class="title">${escape(s.repository)}/<strong>${escape(s.name)}</strong></div>
      <div>${dls}${liscs}</div>
      <div>${desc}</div>
    </div>
  `, { url: s.html_url })
})

// hexdocs
// Same as hex but links to documentation pages
completions.hd = {
  alias:  "hd",
  name:   "hexdocs",
  search: "https://hex.pm/packages?sort=downloads&search=",
  compl:  "https://hex.pm/api/packages?sort=downloads&hd&search=",
}

completions.hd.callback = response => JSON.parse(response.text).map((s) => {
  let dls = ""
  let desc = ""
  if (s.downloads && s.downloads.all) {
    dls = `[↓${escape(s.downloads.all)}]`
  }
  if (s.meta) {
    if (s.meta.description) {
      desc = escape(s.meta.description)
    }
  }
  return createSuggestionItem(`
      <div>
        <div class="title">${escape(s.repository)}/<strong>${escape(s.name)}</strong>${dls}</div>
        <div></div>
        <div>${desc}</div>
      </div>
    `, { url: `https://hexdocs.pm/${encodeURIComponent(s.name)}` })
})

// Exdocs
// Similar to `hd` but searches inside docs using Google Custom Search
completions.ex = {
  alias:  "ex",
  name:   "exdocs",
  search: "https://hex.pm/packages?sort=downloads&ex&search=",
  compl:  googleCxURL("ex"),
}

completions.ex.callback = response => JSON.parse(response.text).items.map((s) => {
  let hash = ""

  const snippet = s.htmlSnippet
  const openTag = "<b>"
  const closeTag = "</b>"
  const openArgs = "("
  const closeArgs = ")"

  let f1 = snippet.indexOf(openTag)
  if (f1 === -1) {
    return null
  }
  const f2 = snippet.indexOf(closeTag)
  if (f2 === -1) {
    return null
  }

  f1 += openTag.length
  const f3 = f2 + closeTag.length
  const fname = snippet.slice(f1, f2)
  const snippetEnd = snippet.slice(f3)

  const a1 = snippetEnd.indexOf(openArgs)
  if (a1 !== 0) {
    return null
  }
  let a2 = snippetEnd.indexOf(closeArgs)
  if (a2 === -1) {
    return null
  }

  a2 += closeArgs.length
  const fargs = snippetEnd.slice(a1, a2)
  const fary = fargs.replace(new RegExp(openArgs + closeArgs), "").split(",").length
  hash = escape(`${fname}/${fary}`)

  const moduleName = escape(s.title).split(" –")[0]

  let subtitle = ""
  if (hash) {
    subtitle = `
        <div style="font-size:1.1em; line-height:1.25em">
          <em>${moduleName}</em>.<strong>${hash}</strong>
        </div>`
  }
  return createSuggestionItem(`
      <div>
        <div class="title"><strong>${s.htmlTitle}</strong></div>
        ${subtitle}
        <div>${s.htmlSnippet}</div>
      </div>
    `, { url: `${s.link}#${hash}` })
}).filter(s => s !== null)

// ****** Golang ****** //

// Golang Docs (Google CSE)
completions.gg = {
  alias:    "gg",
  name:     "golang",
  search:   googleCxPublicURL("gg"),
  compl:    googleCxURL("gg"),
  callback: googleCxCallback,
}

// Godoc
completions.gd = {
  alias:  "gd",
  name:   "godoc",
  search: "https://godoc.org/?q=",
  compl:  "https://api.godoc.org/search?q=",
}

completions.gd.callback = response => JSON.parse(response.text).results.map((s) => {
  let prefix = ""
  if (s.import_count) {
    prefix += `[↓${s.import_count}] `
  }
  if (s.stars) {
    prefix += `[★${s.stars}] `
  }
  return createURLItem(prefix + s.path, `https://godoc.org/${s.path}`)
})

// Gowalker
completions.gw = {
  alias:  "gw",
  name:   "gowalker",
  search: "https://gowalker.org/search?auto_redirect=true&q=",
  compl:  "https://gowalker.org/search/json?q=",
}

completions.gw.callback = response => JSON.parse(response.text).results.map((s) => {
  const title = escape(s.title)
  const desc = escape(s.description)
  return createSuggestionItem(`
    <div>
      <div class="title"><strong>${title}</strong></div>
      <div>${desc}</div>
    </div>
  `, { url: `https://golang.org/doc/${encodeURIComponent(s.url)}` })
})


// Go-Search
completions.gs = {
  alias:  "gs",
  name:   "go-search",
  search: "http://go-search.org/search?q=",
  compl:  "http://go-search.org/api?action=search&q=",
}

completions.gs.callback = response => JSON.parse(response.text).hits
  .map(r => r.package)


// ****** Haskell ****** //

// Hackage
completions.ha = {
  alias:  "ha",
  name:   "hackage",
  search: "https://hackage.haskell.org/packages/search?terms=",
  compl:  "https://hackage.haskell.org/packages/search.json?terms=",
}

completions.ha.callback = response => JSON.parse(response.text)
  .map(s => createURLItem(s.name, `https://hackage.haskell.org/package/${s.name}`))

// Hoogle
completions.ho = {
  alias:  "ho",
  name:   "hoogle",
  search: `https://www.haskell.org/hoogle/?hoogle=${
    encodeURIComponent("+platform +xmonad +xmonad-contrib ")}`, // This tells Hoogle to include these modules in the search - encodeURIComponent is only used for better readability
  compl:  `https://www.haskell.org/hoogle/?mode=json&hoogle=${
    encodeURIComponent("+platform +xmonad +xmonad-contrib ")}`,
}

completions.ho.callback = response => JSON.parse(response.text).results
  .map(s => createURLItem(s.self, s.location))

// Haskell Wiki
completions.hw = {
  alias:  "hw",
  name:   "haskellwiki",
  search: "https://wiki.haskell.org/index.php?go=go&search=",
  compl:  "https://wiki.haskell.org/api.php?action=opensearch&format=json&formatversion=2&namespace=0&limit=10&suggest=true&search=",
}

completions.hw.callback = response => JSON.parse(response.text)[1]

// Hayoo
completions.hy = {
  alias:  "hy",
  name:   "hayoo",
  search: "http://hayoo.fh-wedel.de/?query=",
  compl:  "http://hayoo.fh-wedel.de/json?query=",
}

completions.hy.callback = response => JSON.parse(response.text).result
  .map(s => createURLItem(`[${s.resultType}] ${s.resultName}`, s.resultUri))

// ****** HTML, CSS, JavaScript, NodeJS, ... ****** //

// jQuery API documentation
completions.jq = {
  alias:    "jq",
  name:     "jquery",
  search:   googleCxPublicURL("jq"),
  compl:    googleCxURL("jq"),
  callback: googleCxCallback,
}

// NodeJS standard library documentation
completions.no = {
  alias:    "no",
  name:     "node",
  search:   googleCxPublicURL("no"),
  compl:    googleCxURL("no"),
  callback: googleCxCallback,
}

// Mozilla Developer Network (MDN)
completions.md = {
  alias:  "md",
  name:   "mdn",
  search: "https://developer.mozilla.org/en-US/search?q=",
  compl:  "https://developer.mozilla.org/en-US/search.json?q=",
}

completions.md.callback = (response) => {
  const res = JSON.parse(response.text)
  return res.documents.map((s) => {
    let excerpt = escape(s.excerpt)
    if (excerpt.length > 240) {
      excerpt = `${excerpt.slice(0, 240)}…`
    }
    res.query.split(" ").forEach((q) => {
      excerpt = excerpt.replace(new RegExp(q, "gi"), "<strong>$&</strong>")
    })
    const title = escape(s.title)
    const slug = escape(s.slug)
    return createSuggestionItem(`
      <div>
        <div class="title"><strong>${title}</strong></div>
        <div style="font-size:0.8em"><em>${slug}</em></div>
        <div>${excerpt}</div>
      </div>
    `, { url: s.url })
  })
}

// NPM registry search
completions.np = {
  alias:  "np",
  name:   "npm",
  search: "https://www.npmjs.com/search?q=",
  compl:  "https://api.npms.io/v2/search/suggestions?size=20&q=",
}

completions.np.callback = response => JSON.parse(response.text)
  .map((s) => {
    let flags = ""
    let desc = ""
    let stars = ""
    let score = ""
    if (s.package.description) {
      desc = escape(s.package.description)
    }
    if (s.score) {
      if (s.score.final) {
        score = Math.round(Number(s.score.final) * 5)
        stars = "★".repeat(score) + "☆".repeat(5 - score)
      }
    }
    if (s.flags) {
      Object.keys(s.flags).forEach((f) => {
        flags += `[<span style='color:#ff4d00'>⚑</span> ${escape(f)}] `
      })
    }
    return createSuggestionItem(`
      <div>
        <style>
          .title>em {
            font-weight: bold;
          }
        </style>
        <div class="title">${s.highlight}</div>
        <div>
          <span style="font-size:2em;line-height:0.5em">${stars}</span>
          <span>${flags}</span>
        </div>
        <div>${desc}</div>
      </div>
    `, { url: s.package.links.npm })
  })

// ****** Social Media & Entertainment ****** //

// Hacker News (YCombinator)
completions.hn = {
  alias:  "hn",
  name:   "hackernews",
  search: "https://hn.algolia.com/?query=",
  compl:  "https://hn.algolia.com/api/v1/search?tags=(story,comment)&query=",
}

completions.hn.callback = (response) => {
  const res = JSON.parse(response.text)
  return res.hits.map((s) => {
    let title = ""
    let prefix = ""
    if (s.points) {
      prefix += `[↑${s.points}] `
    }
    if (s.num_comments) {
      prefix += `[↲${s.num_comments}] `
    }
    switch (s._tags[0]) { // eslint-disable-line no-underscore-dangle
    case "story":
      title = s.title // eslint-disable-line prefer-destructuring
      break
    case "comment":
      title = s.comment_text
      break
    default:
      title = s.objectID
    }
    const re = new RegExp(`(${res.query.split(" ").join("|")})`, "ig")
    title = title.replace(re, "<strong>$&</strong>")
    const url = `https://news.ycombinator.com/item?id=${s.objectID}`
    return createSuggestionItem(`
      <div>
        <div class="title">${prefix + title}</div>
        <div class="url">${url}</div>
      </div>
    `, { url })
  })
}

// Reddit
completions.re = {
  alias:  "re",
  name:   "reddit",
  search: "https://www.reddit.com/search?sort=relevance&t=all&q=",
  compl:  "https://api.reddit.com/search?syntax=plain&sort=relevance&limit=20&q=",
}

completions.re.callback = response => JSON.parse(response.text).data.children
  .map(s => createURLItem(`[${s.data.score}] ${s.data.title}`, `https://reddit.com${s.data.permalink}`))

// YouTube
completions.yt = {
  alias:  "yt",
  name:   "youtube",
  search: "https://www.youtube.com/search?q=",
  compl:  `https://www.googleapis.com/youtube/v3/search?maxResults=20&part=snippet&type=video,channel&key=${keys.google_yt}&safeSearch=none&q=`,
}

completions.yt.callback = response => JSON.parse(response.text).items
  .map((s) => {
    switch (s.id.kind) {
    case "youtube#channel":
      return createURLItem(
        `${s.snippet.channelTitle}: ${s.snippet.description}`,
        `https://youtube.com/channel/${s.id.channelId}`,
      )
    case "youtube#video":
      return createURLItem(
        ` ▶ ${s.snippet.title}`,
        `https://youtu.be/${s.id.videoId}`,
      )
    default:
      return null
    }
  }).filter(s => s !== null)

module.exports = completions
