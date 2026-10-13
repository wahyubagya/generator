import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    console.error("Fetch order detail error:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal mengambil data pesanan." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await request.json();
    const { status, notes, shippingAddress } = body;

    const existing = await db.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    // Update order
    const updated = await db.order.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(shippingAddress !== undefined ? { shippingAddress } : {}),
      },
      include: { items: true },
    });

    return NextResponse.json({
      ok: true,
      order: updated,
      message: `Status pesanan berhasil diperbarui menjadi ${status || existing.status}.`,
    });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal memperbarui status pesanan." },
      { status: 500 }
    );
  }
}
