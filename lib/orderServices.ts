import { sendNotification } from './firebaseHelper';
import { handleStaffRotation } from './handleStaffRotation';
import prisma from './prisma';
import { Prisma } from '@prisma/client';
import { StatusCodes } from "http-status-codes";

interface OrderPayload {
  staff_id: string;
  userId: string;
  services: Array<{ serviceId: string; name: string; price: number; quantity: number }>;
  subtotal: number;
  discount: number;
  tip: number;
  extraCharges: Array<{ name: string; amount: number }>;
  total: number;
  paymentMethod: string;
  location_id: string;
  customer:any
}
export async function confirmOrderPayment(orderId: string, paymentIntent: any, couponCode: string = '') {
  try {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) return { success: false, message: 'order_not_found' };

    if (couponCode) {
      const giftCard = await prisma.gift_card.findFirst({
        where: {
          card_code: couponCode,
          active_status: true,
          deleted_status: false,
          OR: [
            { expiry_date: null },
            { expiry_date: { gte: new Date() } },
          ],
        },
      });

      if (!giftCard) return { success: false, message: 'gift_card_invalid_or_expired' };
      if (giftCard.times_used >= giftCard.number_of_times)
        return { success: false, message: 'gift_card_usage_limit_reached' };
      if (giftCard.amount <= 0)
        return { success: false, message: 'gift_card_balance_empty' };

      await prisma.gift_card.update({
        where: { id: giftCard.id },
        data: { times_used: { increment: 1 } },
      });
    }

    const transactionDetail = await prisma.order_transaction_details.create({
      data: {
        value: new Prisma.Decimal(paymentIntent.amount / 100),
        currency: paymentIntent.currency,
        success: paymentIntent.status === 'succeeded',
        payment_method: paymentIntent.payment_method_types?.[0] || 'unknown',
        stripe_payment_intent_id: paymentIntent.id,
        stripe_status: paymentIntent.status,
      },
    });

    const existingTransaction = await prisma.order_transaction.findFirst({
      where: { order_id: orderId },
    });

    if (existingTransaction) {
      await prisma.order_transaction.update({
        where: { id: existingTransaction.id },
        data: {
          amount: order.total_price,
          type: 'CARD',
          payment_status: 'SUCCESS',
          transaction_detail_id: transactionDetail.id,
        },
      });
    } else {
      await prisma.order_transaction.create({
        data: {
          order_id: orderId,
          amount: order.total_price,
          type: 'CARD',
          payment_status: 'SUCCESS',
          transaction_detail_id: transactionDetail.id,
        },
      });
    }

    await prisma.orders.update({
      where: { id: orderId },
      data: {
        payment_status: 'SUCCESS',
        order_status: 'CONFIRMED',
        payment_method: "CARD",
        verified: true,
      },
    });

    if (order.staff_id) {
      const staff = await prisma.user.findUnique({
        where: { id: order.staff_id },
        select: { fcm_token: true, first_name: true },
      });

      if (staff?.fcm_token) {
        await sendNotification(
          staff.fcm_token,
          'New Order Confirmed',
          `You have a new confirmed order.`,
          {
            orderId: order.id,
            total: order.total_price,
          }
        );
      }
    }

    if (order && order.staff_id && order.location_id) {
      await handleStaffRotation(order?.staff_id, order?.location_id, order?.total_price);
    }
    return { success: true, message: 'order_payment_successful' };
  } catch (error) {
    console.error('Error confirming order payment:', error);
    return { success: false, message: 'internal_server_error' };
  }
}



export async function saveOrderToDB(data: OrderPayload): Promise<{
  success: boolean;
  message?: string;
  order?: any;
}> {
  try {
    const { customer, userId } = data;

    if (!data.location_id) {
      return { success: false, message: "missing_location_id" };
    }

    if (!data.services?.length || !userId || !data.paymentMethod) {
      return { success: false, message: "missing_required_fields" };
    }

    const serviceIds = data.services.map((item) => item.serviceId);

    const existingServices = await prisma.services.findMany({
      where: { id: { in: serviceIds }, deleted_status: false },
    });

    const existingServiceIds = new Set(existingServices.map((s) => s.id));
    const invalidServices = serviceIds.filter((id) => !existingServiceIds.has(id));

    if (invalidServices.length > 0) {
      return { success: false, message: "service_not_found" };
    }

    if (data.staff_id) {
      const staff = await prisma.user.findUnique({ where: { id: data.staff_id } });
      if (!staff || staff.deleted_status) {
        return { success: false, message: "staff_not_found" };
      }
    }

    const customerInfo = await getOrderCustomerInfo(userId, customer);
    const { userAccount, isAppCustomer, orderBy, orderCustomer } = customerInfo;

    const transactionType = data.paymentMethod.toUpperCase() as "CARD" | "CASH" | "QR";

    const order = await prisma.orders.create({
      data: {
        order_number: Math.floor(100000 + Math.random() * 900000),
        staff_id: data.staff_id,
        user_id: !isAppCustomer ? userId : undefined,
        customer_id: isAppCustomer ? userId : undefined,
        order_status: isAppCustomer ? "PENDING" : "CONFIRMED",
        discount: data.discount,
        tip: data.tip,
        verified: false,
        total_price: data.total,
        payment_method: transactionType,
        location_id: data.location_id,
        is_customer: isAppCustomer,
        order_by: orderBy,
      },
    });

    await Promise.all(
      data.services.map(async (item) => {
        const service = existingServices.find((s) => s.id === item.serviceId);
        if (!service) return;

        await prisma.order_details.create({
          data: {
            order_id: order.id,
            item_id: item.serviceId,
            item_name: service.name,
            item_price: item.price,
            quantity: item.quantity,
            location_id: data.location_id,
          },
        });
      })
    );

    if (data.extraCharges?.length) {
      await prisma.extra_charge.createMany({
        data: data.extraCharges.map((charge) => ({
          order_id: order.id,
          name: charge.name,
          amount: charge.amount,
        })),
      });
    }

    return { success: true, order };
  } catch (error: any) {
    console.error("Error saving order to DB:", error);
    return { success: false, message: error.message || "internal_server_error" };
  }
}



export async function getOrderCustomerInfo(userId: string, customer: any) {
  const appCustomer = await prisma.customers.findUnique({ where: { id: userId } });

  let isAppCustomer = false;
  let orderBy: "customer" | "staff" | "admin" | "backoffice" | "unknown" = "unknown";
  let userAccount: any = null;
  let orderCustomer: any = null;

  if (customer && typeof customer === "object" && customer.email) {
    const existingOrderCustomer = await prisma.order_customer.findFirst({
      where: { email: customer.email },
    });

    if (existingOrderCustomer) {
      orderCustomer = existingOrderCustomer;
    } else {
      if (!customer.phone || !customer.name) {
        throw new Error("missing_customer_details");
      }

      orderCustomer = await prisma.order_customer.create({
        data: {
          first_name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
      });
    }
  }

  if (appCustomer) {
    userAccount = appCustomer;
    isAppCustomer = true;
    orderBy = "customer";
  } else {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_to_role: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new Error("user_not_found");
    }

    userAccount = user;

    const roleName = user.user_to_role?.[0]?.role?.name || "";
    if (roleName === "Staff") orderBy = "staff";
    else if (roleName === "BackOfficeUser") orderBy = "backoffice";
    else if (["Owner", "SuperAdmin"].includes(roleName)) orderBy = "admin";
  }

  return {
    userAccount,
    orderBy,
    isAppCustomer,
    orderCustomer,
  };
}