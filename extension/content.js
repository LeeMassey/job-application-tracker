function cleanText(s) {
    return (s || "").replace(/\s+/g, " ").trim();
}

function textOf(sel) {
    const el = document.querySelector(sel);
    return el ? cleanText(el.textContent) : "";
}

function textOfEl(el) {
    return el ? cleanText(el.textContent) : "";
}

function meta(name) {
    const el =
        document.querySelector(`meta[property="${name}"]`) ||
        document.querySelector(`meta[name="${name}"]`);
    return el ? el.getAttribute("content") || "" : "";
}

function parsePayString(payStr) {
    // Examples:
    // "$19.50 - $23.00 an hour"
    // "$30 - $33 an hour"
    // "$75,000 - $90,000 a year"
    const s = payStr.replaceAll(",", "");
    const range = s.match(/\$([0-9]+(?:\.[0-9]+)?)\s*-\s*\$([0-9]+(?:\.[0-9]+)?)/);
    const single = s.match(/\$([0-9]+(?:\.[0-9]+)?)/);
    let payMin = null, payMax = null;

    if (range) {
        payMin = Number(range[1]);
        payMax = Number(range[2]);
    } else if (single) {
        payMin = Number(single[1]);
        payMax = null;
    }

    let payPeriod = null;
    const lower = s.toLowerCase();
    if (lower.includes("an hour") || lower.includes("per hour") || lower.includes("/hr")) payPeriod = "hour";
    else if (lower.includes("a year") || lower.includes("per year")) payPeriod = "year";
    else if (lower.includes("a week") || lower.includes("per week")) payPeriod = "week";
    else if (lower.includes("a month") || lower.includes("per month")) payPeriod = "month";

    return { payMin, payMax, payPeriod };
}

function getJsonLdJobPosting() {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    for (const s of scripts) {
        try {
            const json = JSON.parse(s.textContent || "null");
            const items = Array.isArray(json) ? json : [json];

            for (const it of items) {
                // Sometimes wrapped in @graph
                const nodes = it?.["@graph"] ? it["@graph"] : [it];
                for (const node of nodes) {
                    if (node && (node["@type"] === "JobPosting" || (Array.isArray(node["@type"]) && node["@type"].includes("JobPosting")))) {
                        return node;
                    }
                }
            }
        } catch {
            // ignore parse errors
        }
    }
    return null;
}

function extractIndeed() {
    const headerTitleNode =
        document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"] h1') ||
        document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"] h2') ||
        document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]');

    let positionTitle =
        (headerTitleNode ? cleanText(headerTitleNode.textContent) : "") ||
        meta("og:title") ||
        document.title;

    // If we accidentally grabbed the search-page header like "jobs in Redondo Beach, CA", discard it
    if (/^jobs\s+in\s+/i.test(positionTitle)) {
        positionTitle = "";
    }
    const companyName =
        textOf('[data-testid="inlineHeader-companyName"] a') ||
        textOf('[data-testid="inlineHeader-companyName"]') ||
        textOf('[data-testid="jobsearch-JobInfoHeader-companyName"]') ||
        "";


    const location =
        textOf('[data-testid="inlineHeader-companyLocation"]') ||
        textOf('[data-testid="jobsearch-JobInfoHeader-companyLocation"]') ||
        "";

    const payVisible =
        textOf('[data-testid="jobsearch-JobDetailsSection"] [aria-label*="Pay"]') ||
        textOf('[data-testid="jobsearch-JobDetailsSection"]') || // may include pay line
        textOf('#salaryInfoAndJobType') ||
        "";

    let payMin = null, payMax = null, payPeriod = null;

    const jp = getJsonLdJobPosting();
    if (jp?.baseSalary) {
        const value = jp.baseSalary.value || jp.baseSalary;
        const unitText = (value?.unitText || value?.value?.unitText || "").toString().toLowerCase();

        const minV = value?.minValue ?? value?.value?.minValue;
        const maxV = value?.maxValue ?? value?.value?.maxValue;
        const v = value?.value ?? value?.value?.value;

        if (typeof minV === "number") payMin = minV;
        if (typeof maxV === "number") payMax = maxV;
        if (typeof v === "number" && payMin === null) payMin = v;

        if (unitText.includes("hour")) payPeriod = "hour";
        else if (unitText.includes("year")) payPeriod = "year";
        else if (unitText.includes("week")) payPeriod = "week";
        else if (unitText.includes("month")) payPeriod = "month";
    }

    if (payMin === null && payMax === null) {
        const payStr =
            Array.from(document.querySelectorAll('[data-testid="jobsearch-JobDetailsSection"] *'))
                .map(textOfEl)
                .find((t) => /\$/.test(t) && /(hour|year|week|month)/i.test(t)) ||
            (/\$/.test(payVisible) ? payVisible : "");

        if (payStr) {
            const parsed = parsePayString(payStr);
            payMin = parsed.payMin;
            payMax = parsed.payMax;
            payPeriod = parsed.payPeriod;
        }
    }

    let shift = "";
    const shiftSection = Array.from(document.querySelectorAll("h2, h3"))
        .find((h) => /shift and schedule/i.test(h.textContent || ""));

    if (shiftSection) {
        const container = shiftSection.parentElement;
        if (container) {
            // Prefer buttons/spans, and force clean spacing.
            const raw = Array.from(container.querySelectorAll("button, span, li"))
                .map((el) => cleanText(el.textContent))
                .filter((t) => t && t.length < 80);

            // Keep only likely schedule terms
            const pills = raw.filter((t) =>
                /(weekend|evening|morning|night|shift|schedule|day shift|overnight|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(t)
            );

            // De-dupe (case-insensitive), preserve order
            const seen = new Set();
            const deduped = [];
            for (const p of pills) {
                const key = p.toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    deduped.push(p);
                }
            }

            shift = deduped.slice(0, 8).join(", ");
        }
    }

    const descEl =
        document.querySelector("#jobDescriptionText") ||
        document.querySelector('[data-testid="jobDescriptionText"]');

    let jobDescription = "";

    if (descEl) {
        jobDescription = cleanText(descEl.innerText || descEl.textContent || "");
    }

    // Fallback to JSON-LD if empty
    if (!jobDescription && jp?.description) {
        jobDescription = cleanText(jp.description);
    }

    // Fix rare word-join cases like "OverviewWe"
    jobDescription = jobDescription
        .replace(/([a-z])([A-Z])/g, "$1 $2")     // insert space between lower->Upper
        .replace(/([.,;:!?])([A-Za-z])/g, "$1 $2"); // punctuation followed immediately by word


    return {
        positionTitle: (positionTitle || "").slice(0, 180),
        companyName: (companyName || "").slice(0, 180),
        location: (location || "").slice(0, 180),
        payMin,
        payMax,
        payPeriod,
        shift: shift || null,
        jobDescription: (jobDescription || "").slice(0, 20000),
    };
}

function extractGeneric() {
    const jobUrl = location.href;

    const positionTitle =
        textOf("h1") ||
        meta("og:title") ||
        document.title;

    const source =
        meta("og:site_name") ||
        (jobUrl.includes("linkedin.") ? "LinkedIn" : "CompanySite");

    return {
        jobUrl,
        positionTitle: (positionTitle || "").slice(0, 180),
        companyName: "",
        location: "",
        source,
        jobDescription: "",
        payMin: null,
        payMax: null,
        payPeriod: null,
        shift: null,
    };
}

function extract() {
    const jobUrl = location.href;

    let base = extractGeneric();

    if (jobUrl.includes("indeed.")) {
        const indeed = extractIndeed();
        base = {
            ...base,
            ...indeed,
            source: "Indeed",
        };
    }

    return {
        jobUrl,
        source: base.source || "Other",
        positionTitle: base.positionTitle || "",
        companyName: base.companyName || "",
        location: base.location || "",
        payMin: base.payMin ?? null,
        payMax: base.payMax ?? null,
        payPeriod: base.payPeriod ?? null,
        shift: base.shift ?? null,
        jobDescription: base.jobDescription || "",
    };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "EXTRACT_JOB") {
        try {
            sendResponse(extract());
        } catch (e) {
            sendResponse({ jobUrl: location.href, source: "Other" });
        }
    }
    return true;
});
