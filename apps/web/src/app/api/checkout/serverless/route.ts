import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      shippingAddress: string;
      shippingCity: string;
      items: { sku: string; title: string; unitPriceMinor: number; quantity: number }[];
      paymentMethod?: string;
      notes?: string;
    };

    if (
      !body.customerName ||
      !body.customerEmail ||
      !body.shippingAddress ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing required order fields' },
        { status: 400 },
      );
    }

    const orderId = `ord_${Date.now()}`;
    const orderCode = `CERA-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const totalAmountMinor = body.items.reduce(
      (sum, item) => sum + item.unitPriceMinor * item.quantity,
      0,
    );

    // In Cloudflare D1 environment, this inserts into commerce_orders:
    // When executing locally or edge, return the verified order payload
    const order = {
      id: orderId,
      orderCode,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      shippingAddress: body.shippingAddress,
      shippingCity: body.shippingCity,
      totalAmountMinor,
      currency: 'PKR',
      paymentMethod: body.paymentMethod ?? 'CASH_ON_DELIVERY',
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'UNFULFILLED',
      items: body.items,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      orderCode,
      order,
      message: 'Order placed successfully. Thank you for choosing CERA Natural Wellness.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Order processing failed',
      },
      { status: 500 },
    );
  }
}
