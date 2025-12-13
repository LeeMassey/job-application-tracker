import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@prisma/client";

function cors(res: NextResponse) {
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return res;
}

export async function OPTIONS() {
    return cors(new NextResponse(null, { status: 204 }));
}

export async function GET() {
    const rows = await prisma.application.findMany({
        orderBy: [{ dateApplied: "desc" }, { createdAt: "desc" }],
    });
    return cors(NextResponse.json(rows));
}

function coerceStatus(input: unknown): ApplicationStatus {
    const raw = String(input ?? "Interested");
    const values = Object.values(ApplicationStatus) as string[];
    return values.includes(raw) ? (raw as ApplicationStatus) : ApplicationStatus.Interested;
}

export async function POST(req: Request) {
    const body = await req.json();

    const status = coerceStatus(body.status);

    const data = {
        status,
        source: body.source ?? "Other",
        jobUrl: String(body.jobUrl ?? ""),
        companyName: String(body.companyName ?? ""),
        positionTitle: String(body.positionTitle ?? ""),
        location: String(body.location ?? ""),

        companyPhone: body.companyPhone ?? null,
        payMin: body.payMin ?? null,
        payMax: body.payMax ?? null,
        payPeriod: body.payPeriod ?? null,
        shift: body.shift ?? null,
        hoursPerWeek: body.hoursPerWeek ?? null,
        jobType: body.jobType ?? null,
        workplace: body.workplace ?? null,

        datePosted: body.datePosted ? new Date(body.datePosted) : null,

        dateApplied:
            status === ApplicationStatus.Applied
                ? body.dateApplied
                    ? new Date(body.dateApplied)
                    : new Date()
                : null,

        lastFollowedUpOn: body.lastFollowedUpOn ? new Date(body.lastFollowedUpOn) : null,
        nextFollowUpOn: body.nextFollowUpOn ? new Date(body.nextFollowUpOn) : null,

        contactName: body.contactName ?? null,
        contactEmail: body.contactEmail ?? null,
        jobDescription: body.jobDescription ?? null,
        resumeVersion: body.resumeVersion ?? null,
        coverLetterVersion: body.coverLetterVersion ?? null,
        notes: body.notes ?? null,
    };

    const created = await prisma.application.create({ data });

    return cors(NextResponse.json(created, { status: 201 }));
}
