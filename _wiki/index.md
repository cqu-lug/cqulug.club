---
title: "LUG Wiki"
layout: single
permalink: /wiki/
header:
  overlay_color: "#0a4a83"
  overlay_filter: "0.2"
  overlay_image: /assets/images/splash-bg.svg
author_profile: false
---

{% assign wiki_pages = site.wiki | sort: "title" %}
<h2>文档目录</h2>
<ul>
  {% for page in wiki_pages %}
    {% unless page.url == "/wiki/" %}
      <li><a href="{{ page.url | relative_url }}">{{ page.title }}</a></li>
    {% endunless %}
  {% endfor %}
</ul>
