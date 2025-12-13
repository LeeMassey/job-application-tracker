const $ = (id) => document.getElementById(id);

function setMsg(text, isError = false) {
    const el = $("status");
    el.textContent = text;
    el.style.color = isError ? "crimson" : "green";
}

async function getActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
}

async function extractFromPage() {
    const tab = await getActiveTab();
    if (!tab?.id) throw new Error("No active tab.");

    const resp = await chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_JOB" });
    return resp;
}

function fillForm(data) {
    $("jobUrl").value = data.jobUrl || "";
    $("companyName").value = data.companyName || "";
    $("positionTitle").value = data.positionTitle || "";
    $("location").value = data.location || "";
    $("payMin").value = data.payMin ?? "";
    $("payMax").value = data.payMax ?? "";
    $("payPeriod").value = data.payPeriod || "";
    $("shift").value = data.shift || "";
    $("source").value = data.source || guessSource(data.jobUrl || "");
    $("jobDescription").value = data.jobDescription || "";
}

function guessSource(url) {
    if (url.includes("indeed.")) return "Indeed";
    if (url.includes("linkedin.")) return "LinkedIn";
    return "CompanySite";
}

function payloadFromForm() {
    return {
        jobUrl: $("jobUrl").value.trim(),
        companyName: $("companyName").value.trim(),
        positionTitle: $("positionTitle").value.trim(),
        location: $("location").value.trim(),
        payMin: $("payMin").value ? Number($("payMin").value) : null,
        payMax: $("payMax").value ? Number($("payMax").value) : null,
        payPeriod: $("payPeriod").value || null,
        shift: $("shift").value.trim() || null,
        status: $("statusSelect").value,
        source: $("source").value.trim() || "Other",
        jobDescription: $("jobDescription").value.trim() || null,
        notes: $("notes").value.trim() || null,
        dateApplied: $("statusSelect").value === "Applied" ? new Date().toISOString() : null
    };
}

async function save() {
    const body = payloadFromForm();

    if (!body.jobUrl || !body.companyName || !body.positionTitle || !body.location) {
        setMsg("Missing required fields.", true);
        return;
    }

    setMsg("Saving…");

    const r = await fetch("http://localhost:3000/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!r.ok) {
        const msg = await r.text();
        throw new Error(msg || `HTTP ${r.status}`);
    }

    setMsg("Saved ✔");

    setTimeout(() => {
        window.close();
    }, 2000);
}

document.addEventListener("DOMContentLoaded", () => {

    (async function init() {
        try {
            setMsg("Extracting…");
            const data = await extractFromPage();
            fillForm(data || {});
            setMsg("Ready.");
        } catch (e) {
            console.error(e);
            setMsg("Could not auto-extract. You can fill manually.", true);

            try {
                const tab = await getActiveTab();
                $("jobUrl").value = tab?.url || "";
                $("source").value = guessSource(tab?.url || "");
            } catch { }
        }

        $("save").addEventListener("click", async () => {
            try {
                await save();
            } catch (e) {
                console.error(e);
                setMsg(String(e.message || e), true);
            }
        });
    })();
});

