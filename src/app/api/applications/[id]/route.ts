import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@prisma/client";

function cors(res: NextResponse) {
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "PATCH,DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return res;
}

export async function OPTIONS() {
    return cors(new NextResponse(null, { status: 204 }));
}

function coerceStatus(input: unknown): ApplicationStatus | null {
    if (input == null) return null;
    const raw = String(input).trim();

    // Accept friendly UI labels just in case
    if (raw.toLowerCase() === "follow-up needed" || raw.toLowerCase() === "follow up needed") {
        return ApplicationStatus.FollowUp;
    }


    const values = Object.values(ApplicationStatus) as string[];
    return values.includes(raw) ? (raw as ApplicationStatus) : null;
}


type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;

        if (!id) {
            return cors(NextResponse.json({ error: "Missing id" }, { status: 400 }));
        }

        await prisma.application.delete({ where: { id } });

        return cors(NextResponse.json({ ok: true }));
    } catch (err: any) {
        const code = err?.code;
        if (code === "P2025") {
            return cors(NextResponse.json({ error: "Not found" }, { status: 404 }));
        }
        console.error("DELETE /api/applications/[id] failed:", err);
        return cors(NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 }));
    }
}

export async function PATCH(req: Request, ctx: Ctx) {
    const body = await req.json();
    const { id } = await ctx.params;

    if (!id) {
        return cors(NextResponse.json({ error: "Missing id" }, { status: 400 }));
    }

    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
        return cors(NextResponse.json({ error: "Not found" }, { status: 404 }));
    }

    const nextStatus = coerceStatus(body.status) ?? existing.status;

    const stampApplied =
        nextStatus === ApplicationStatus.Applied && existing.dateApplied == null;

    const updated = await prisma.application.update({
        where: { id },
        data: {
            status: coerceStatus(body.status) ?? undefined,
            notes: body.notes ?? undefined,
            dateApplied: stampApplied ? new Date() : undefined,
        },
    });

    return cors(NextResponse.json(updated));
}
