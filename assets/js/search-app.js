(function () {
  'use strict';

  if (!window.lunr || !window.store) return;
  var input = document.getElementById('search');
  var results = document.getElementById('results');
  if (!input || !results) return;

  var index = window.lunr(function () {
    this.field('title');
    this.field('excerpt');
    this.field('categories');
    this.field('tags');
    this.ref('id');
    this.pipeline.remove(window.lunr.trimmer);
    window.store.forEach(function (item, id) {
      this.add({
        title: item.title,
        excerpt: item.excerpt,
        categories: item.categories,
        tags: item.tags,
        id: id
      });
    }, this);
  });

  function resultItem(item) {
    var wrapper = document.createElement('div');
    wrapper.className = 'list__item';
    var article = document.createElement('article');
    article.className = 'archive__item';
    var heading = document.createElement('h2');
    heading.className = 'archive__item-title';
    var link = document.createElement('a');
    link.href = item.url;
    link.rel = 'permalink';
    link.textContent = item.title;
    heading.appendChild(link);
    var excerpt = document.createElement('p');
    excerpt.className = 'archive__item-excerpt';
    excerpt.textContent = String(item.excerpt || '').split(/\s+/).slice(0, 20).join(' ') + '…';
    article.appendChild(heading);
    article.appendChild(excerpt);
    wrapper.appendChild(article);
    return wrapper;
  }

  input.addEventListener('input', function () {
    var query = input.value.trim().toLowerCase();
    results.replaceChildren();
    if (!query) return;

    var matches = index.query(function (builder) {
      query.split(window.lunr.tokenizer.separator).filter(Boolean).forEach(function (term) {
        builder.term(term, { boost: 100 });
        builder.term(term, { usePipeline: false, wildcard: window.lunr.Query.wildcard.TRAILING, boost: 10 });
        builder.term(term, { usePipeline: false, editDistance: 1, boost: 1 });
      });
    });

    var count = document.createElement('p');
    count.className = 'results__found';
    count.textContent = matches.length + ' 条记录匹配';
    results.appendChild(count);
    matches.forEach(function (match) {
      var item = window.store[Number(match.ref)];
      if (item) results.appendChild(resultItem(item));
    });
  });
}());
