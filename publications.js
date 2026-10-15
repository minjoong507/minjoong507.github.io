/* ── Author homepage registry ── */
const authorLinks = {
    'Byoung-Tak Zhang':  'https://bi.snu.ac.kr/~btzhang/',
    'Lorenzo Torresani': 'https://ltorresa.github.io/home.html',
    'Junbin Xiao':       'https://doc-doc.github.io/cv/',
    'Junghyun Kim':      'https://jhkim-snu.github.io/',
    'Angela Yao':        'https://www.comp.nus.edu.sg/~ayao/',
    'Youwon Jang':       'https://www.linkedin.com/in/you-won-jang-greeksharifa/',
    'Seongho Choi':      'https://scholar.google.com/citations?user=DmwlIIPaSlMC&hl=ko',
    'Joochan Kim':       'https://tikatoka.github.io/',
    'Jin-Hwa Kim':       'http://wityworks.com/',
    'Seung-Hyun Lee':    'https://lsh3163.github.io/seunghyunlee/',
    'Junseok Kwon':      'https://sites.google.com/view/cau-cvml/cvmlcau/junseokkwon?authuser=0',
    'Woo Suk Choi':      'https://cws7777.github.io/',
    'Minsu Lee':         'https://amilab-sswu.github.io/#people',
    'Gi-Cheon Kang':     'https://gicheonkang.com/',
    'Jaein Kim':         'https://scholar.google.com/citations?user=6xSSU-8AAAAJ&hl=ko',
    'Yu-Jung Heo':       'https://yujungheo.github.io/',
};

function setPubView(view) {
    document.getElementById('papers-all').classList.toggle('list-view', view === 'list');
    document.querySelectorAll('.view-toggle button').forEach(function(button) {
        button.classList.toggle('active', button.dataset.view === view);
    });
}


document.addEventListener('DOMContentLoaded', function () {
    setPubView('list');

    // Auto-populate hrefs for author links from the registry above
    document.querySelectorAll('.author-list a').forEach(function(a) {
        var name = a.textContent.replace(/[*,]/g, '').trim();
        if (authorLinks[name]) a.href = authorLinks[name];
    });

    var iconMap = {
        'paper':        'fa-solid fa-file',
        'code':         'fa-solid fa-code',
        'project page': 'fa-solid fa-globe',
        'video':        'fa-solid fa-video',
        'demo':         'fa-solid fa-play',
        'slides':       'fa-solid fa-chalkboard',
        'poster':       'fa-solid fa-image',
        'dataset':       'fa-solid fa-dataset'
    };

    document.querySelectorAll('.text-container').forEach(function (container) {
        // ── Upgrade resource links to pill badges ──
        var italic = container.querySelector('p[style*="italic"]');
        if (italic) {
            // Build a compact "VENUE '26" badge (used by list view) from the venue line,
            // i.e. everything in the paragraph before the first <br>.
            var venueNodes = [];
            for (var n = italic.firstChild; n; n = n.nextSibling) {
                if (n.nodeType === 1 && n.tagName === 'BR') break;
                venueNodes.push(n);
            }
            var venueText = venueNodes.map(function (n) { return n.textContent; }).join('').replace(/\s+/g, ' ').trim();
            var yearMatch = venueText.match(/(\d{4})/);
            var parenMatch = venueText.match(/\(([^)]+)\)/);
            var abbr = parenMatch ? parenMatch[1] : venueText.split(/[\s,]+/)[0];
            var badge = document.createElement('div');
            badge.className = 'venue-badge';
            var subtype = /workshop/i.test(venueText) ? 'Workshop'
                        : /symposium/i.test(venueText) ? 'Symposium'
                        : /findings/i.test(venueText) ? 'Findings'
                        : '';
            badge.innerHTML = abbr + (yearMatch ? " '" + yearMatch[1].slice(2) : '') + (subtype ? '<br>' + subtype : '');
            var card = container.closest('.pub-card');
            card.insertBefore(badge, card.firstChild);

            var anchors = Array.from(italic.childNodes).filter(function (n) {
                return n.nodeType === 1 && n.tagName === 'A';
            });
            if (anchors.length > 0) {
                // Remove the <a> nodes and " / " text separators from the paragraph
                var toRemove = new Set(anchors);
                italic.childNodes.forEach(function (n) {
                    if (n.nodeType === 3 && n.textContent.includes('/')) toRemove.add(n);
                });
                toRemove.forEach(function (n) { italic.removeChild(n); });

                // Build pill container
                var linksDiv = document.createElement('div');
                linksDiv.className = 'paper-links';
                anchors.forEach(function (a) {
                    var label = a.textContent.trim();
                    var iconClass = iconMap[label.toLowerCase()] || 'fa-solid fa-link';
                    var hasHref = a.getAttribute('href') && a.getAttribute('href').length > 0;
                    a.innerHTML = '<i class="' + iconClass + '"></i> ' + label;
                    if (!hasHref) a.classList.add('unavailable');
                    linksDiv.appendChild(a);
                });
                italic.parentNode.insertBefore(linksDiv, italic.nextSibling);
            }
        }

        // ── Move desc out of pub-card into its own hover box ──
        var desc = container.querySelector('.paper-desc');
        if (!desc) return;
        var card = container.closest('.pub-card');
        var box  = document.createElement('div');
        box.className = 'desc-box';

        // "Abstract" section label
        var label = document.createElement('p');
        label.className = 'desc-box-label';
        label.textContent = 'Abstract';
        box.appendChild(label);

        desc.parentNode.removeChild(desc);
        box.appendChild(desc);
        card.parentNode.insertBefore(box, card.nextSibling);
    });
});
