import { NextResponse } from "next/server";

const TOKEN = "af1874616430e04cfd4bce30035789907e899fc7c3a1a4bb27254828ff304a77";
const BASE_URL = `https://app.tablecrm.com/api/v1/nomenclature/?token=${TOKEN}`;
const LIMIT = 100;

export async function GET() {
  try {
    // Fetch first page to get total count
    const firstRes = await fetch(`${BASE_URL}&limit=${LIMIT}&offset=0`, { cache: "no-store" });
    if (!firstRes.ok) {
      return NextResponse.json({ error: "Failed to fetch products" }, { status: firstRes.status });
    }

    const firstData = await firstRes.json();
    const total: number = firstData?.result?.count ?? firstData?.count ?? 0;
    const firstItems: unknown[] = firstData?.result?.result ?? firstData?.result ?? [];

    if (total <= LIMIT) {
      return NextResponse.json({ success: true, data: { result: firstItems, count: firstItems.length } });
    }

    // Fetch remaining pages in parallel
    const remainingOffsets: number[] = [];
    for (let offset = LIMIT; offset < total; offset += LIMIT) {
      remainingOffsets.push(offset);
    }

    const remainingResults = await Promise.all(
      remainingOffsets.map((offset) =>
        fetch(`${BASE_URL}&limit=${LIMIT}&offset=${offset}`, { cache: "no-store" })
          .then((r) => r.json())
          .then((d) => d?.result?.result ?? d?.result ?? [])
      )
    );

    const allItems = [firstItems, ...remainingResults].flat();
    return NextResponse.json({ success: true, data: { result: allItems, count: allItems.length } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
