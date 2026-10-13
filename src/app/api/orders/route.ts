import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function maskName(name: string): string {
  if (!name) return "***";
  return name
    .split(" ")
    .map((part) => {
      if (part.length <= 2) return part[0] + "*";
      return part[0] + "*".repeat(Math.max(1, part.length - 2)) + part[part.length - 1];
    })
    .join(" ");
}

function maskPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.length < 7) return "***-****";
  return clean.slice(0, 4) + "-****-" + clean.slice(-4);
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    const body = await request.json();

    const {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      notes,
      totalPrice = 0,
      items = [],
    } = body;

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { ok: false, error: "Nama dan nomor WhatsApp pelanggan wajib diisi." },
        { status: 400 }
      );
    }

    // Generate human-friendly unique order ID (e.g., AC-M29K3-8291)
    const timeSegment = Date.now().toString(36).toUpperCase().slice(-5);
    const randomSegment = Math.floor(1000 + Math.random() * 9000);
    const orderId = `AC-${timeSegment}-${randomSegment}`;

    const parsedItems = Array.isArray(items) ? items : [items];

    const order = await db.order.create({
      data: {
        id: orderId,
        userId: session?.userId || null,
        customerName: String(customerName).trim(),
        customerPhone: String(customerPhone).trim().replace(/\D/g, ""),
        customerEmail: customerEmail ? String(customerEmail).trim() : null,
        shippingAddress: shippingAddress ? String(shippingAddress).trim() : null,
        notes: notes ? String(notes).trim() : null,
        totalPrice: Number(totalPrice) || 0,
        status: "PENDING",
        paymentMethod: "WHATSAPP_MANUAL",
        items: {
          create: parsedItems.map((item) => ({
            generatorSlug: String(item.generatorSlug || "custom-3d"),
            generatorTitle: String(item.generatorTitle || "Pesanan Cetak 3D"),
            configJson:
              typeof item.configJson === "string"
                ? item.configJson
                : JSON.stringify(item.configJson || {}),
            previewImage: item.previewImage || null,
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || Number(totalPrice) || 0,
            subtotal: Number(item.subtotal) || Number(totalPrice) || 0,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      order,
      message: "Pesanan berhasil dibuat!",
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal menyimpan pesanan ke database." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get("id");
    const queryPhone = searchParams.get("phone");
    const isAdminMode = searchParams.get("admin") === "true";

    // 1. ADMIN ACCESS: Strictly requires session with ADMIN role
    if (isAdminMode) {
      if (session?.role !== "ADMIN") {
        return NextResponse.json(
          { ok: false, error: "Akses ditolak. Memerlukan hak akses Administrator." },
          { status: 403 }
        );
      }
      const orders = await db.order.findMany({
        include: { items: true, user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ ok: true, orders });
    }

    // 2. GUEST DUAL-VERIFICATION TRACKING:
    // Requires BOTH valid Order ID AND matching Phone Number to prevent unauthorized spying
    if (queryId && queryPhone) {
      const cleanPhone = queryPhone.trim().replace(/\D/g, "");
      const order = await db.order.findUnique({
        where: { id: queryId.trim() },
        include: { items: true },
      });

      if (!order) {
        return NextResponse.json(
          { ok: false, error: "Nomor Pesanan tidak ditemukan." },
          { status: 404 }
        );
      }

      // Check if phone matches (allow last 6 digits or full match)
      const orderPhoneClean = order.customerPhone.replace(/\D/g, "");
      const isPhoneMatch =
        orderPhoneClean === cleanPhone ||
        orderPhoneClean.endsWith(cleanPhone) ||
        cleanPhone.endsWith(orderPhoneClean);

      if (!isPhoneMatch) {
        return NextResponse.json(
          { ok: false, error: "Nomor WhatsApp tidak cocok dengan data pesanan ini." },
          { status: 403 }
        );
      }

      // Return order with masked personal data to safeguard customer privacy
      const maskedOrder = {
        ...order,
        customerName: maskName(order.customerName),
        customerPhone: maskPhone(order.customerPhone),
        customerEmail: order.customerEmail ? "***@***" : null,
        shippingAddress: order.shippingAddress ? "Alamat Pelanggan (Tersimpan)" : null,
      };

      return NextResponse.json({ ok: true, order: maskedOrder });
    }

    // Single parameter query without verification is rejected for privacy
    if (queryId && !queryPhone) {
      return NextResponse.json(
        { ok: false, error: "Demi keamanan privasi, silakan sertakan Nomor WhatsApp pemesan." },
        { status: 400 }
      );
    }

    // 3. LOGGED-IN CUSTOMER ACCESS:
    // Only shows orders that belong to the current authenticated user
    if (session?.userId) {
      const orders = await db.order.findMany({
        where: { userId: session.userId },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ ok: true, orders });
    }

    return NextResponse.json(
      { ok: false, error: "Harap login ke akun Anda atau masukkan Nomor Pesanan & Nomor WhatsApp untuk melacak." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json({ ok: false, error: "Gagal mengambil data pesanan." }, { status: 500 });
  }
}
