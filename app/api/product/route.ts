import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://app.tablecrm.com/api/v1/nomenclature/?token=af1874616430e04cfd4bce30035789907e899fc7c3a1a4bb27254828ff304a77";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([body]),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "API request failed", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Product API error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
