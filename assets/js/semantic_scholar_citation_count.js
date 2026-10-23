(() => {
    const elements = Array.from(document.querySelectorAll('[data-semantic-scholar-id]'));
    const ids = [...new Set(elements.map((element) => element.dataset.semanticScholarId?.toLowerCase()).filter(Boolean))];
    if (!ids.length) return;

    const cacheMaxAge = 7 * 24 * 60 * 60 * 1000;
    const cacheKey = (id) => `semanticScholarCitationCount:${id}`;

    const readCache = (id) => {
        try {
            const cached = JSON.parse(localStorage.getItem(cacheKey(id)));
            return cached && Number.isFinite(cached.citationCount) ? cached : null;
        } catch (_) {
            return null;
        }
    };

    const writeCache = (id, paper) => {
        try {
            localStorage.setItem(cacheKey(id), JSON.stringify({
                citationCount: paper.citationCount,
                paperId: paper.paperId,
                timestamp: Date.now()
            }));
        } catch (_) {
            // Citation counts are optional; storage restrictions should not affect the page.
        }
    };

    const renderCount = (id, citationCount, paperId = id) => {
        elements
            .filter((element) => element.dataset.semanticScholarId?.toLowerCase() === id)
            .forEach((element) => {
                const link = document.createElement('a');
                link.className = 'citation-link';
                link.href = `https://www.semanticscholar.org/paper/${paperId}`;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.setAttribute(
                    'aria-label',
                    `Cited by ${citationCount.toLocaleString()} ${citationCount === 1 ? 'paper' : 'papers'} on Semantic Scholar`
                );

                const label = document.createElement('span');
                label.className = 'citation-label';
                label.textContent = 'Cited by';

                const count = document.createElement('span');
                count.className = 'citation-count';
                count.textContent = citationCount.toLocaleString();

                link.append(label, count);
                element.replaceChildren(link);
            });
    };

    const staleIds = [];
    ids.forEach((id) => {
        const cached = readCache(id);
        if (cached) renderCount(id, cached.citationCount, cached.paperId || id);
        if (!cached || Date.now() - cached.timestamp > cacheMaxAge) staleIds.push(id);
    });

    if (!staleIds.length) return;

    const fetchCounts = async () => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 8000);

        try {
            const response = await fetch('https://api.semanticscholar.org/graph/v1/paper/batch?fields=paperId,citationCount,externalIds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: staleIds }),
                signal: controller.signal
            });
            if (!response.ok) return;

            const papers = await response.json();
            papers.filter(Boolean).forEach((paper) => {
                const paperId = paper.paperId?.toLowerCase();
                const doiId = paper.externalIds?.DOI ? `doi:${paper.externalIds.DOI}`.toLowerCase() : null;
                const requestedId = staleIds.find((id) => id === paperId || id === doiId);
                if (!requestedId) return;

                writeCache(requestedId, paper);
                renderCount(requestedId, paper.citationCount, paper.paperId);
            });
        } catch (_) {
            // The page remains complete when the optional API is unavailable.
        } finally {
            window.clearTimeout(timeout);
        }
    };

    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(fetchCounts, { timeout: 2500 });
    } else {
        window.setTimeout(fetchCounts, 500);
    }
})();
