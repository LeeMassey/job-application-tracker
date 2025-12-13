import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function esc(v: unknown) {
    const s = String(v ?? "");
    // CSV escape
    if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
    return s;
}

export async function GET() {
    const rows = await prisma.application.findMany({
        orderBy: { dateApplied: "desc" },
    });

    const header = [
        "companyName",
        "positionTitle",
        "location",
        "companyPhone",
        "payMin",
        "payMax",
        "payPeriod",
        "shift",
        "hoursPerWeek",
        "jobType",
        "workplace",
        "status",
        "source",
        "jobUrl",
        "dateApplied",
        "lastFollowedUpOn",
        "nextFollowUpOn",
        "notes",
    ];

    const lines = [
        header.join(","),
        ...rows.map((r) =>
            header.map((k) => esc((r as any)[k])).join(",")
        ),
    ];

    return new NextResponse(lines.join("\n"), {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="applications.csv"',
        },
    });
}
