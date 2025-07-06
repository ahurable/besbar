import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { status } = await request.json();

    // 1) Run UPDATE query
    const updateResult = await query(
      "UPDATE freight_requests SET status = ? WHERE id = ?",
      [status, id]
    );

    // updateResult.rows[0] contains ResultSetHeader with affectedRows
    const affectedRows = (updateResult.rows[0] as any).affectedRows;

    if (affectedRows === 0) {
      return NextResponse.json(
        { error: "Freight request not found" },
        { status: 404 }
      );
    }

    // 2) Fetch updated row after update
    const selectResult = await query(
      "SELECT * FROM freight_requests WHERE id = ?",
      [id]
    );

    const rows = selectResult.rows;
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "Failed to retrieve updated request" },
        { status: 500 }
      );
    }

    // 3) Return the updated row
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update freight request" },
      { status: 500 }
    );
  }
}
