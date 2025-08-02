import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { sendNotification } from "../../../../lib/firebaseHelper";
import validateAPI from "../../../../lib/valildateApi";
import { handleStaffRotation } from "../../../../lib/handleStaffRotation";
import { app } from "firebase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
  }

  try {
    let {
      userId,
      staff_id,
      services,
      extraCharges,
      tip,
      discount,
      location_id,
      paymentMethod = "cash",
      total,
      paymentIntent,
      customer,
    } = req.body;

    if (!userId || !services?.length || !paymentMethod || !total) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_required_fields" });
    }

    let locationId = location_id;
    if (!locationId) {
      const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      locationId = session.user?.selected_location_id;
    }

    if (!locationId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_location_id" });
    }

    const appCustomer = await prisma.customers.findUnique({ where: { id: userId } });

    let isAppCustomer = false;
    let orderBy: "customer" | "staff" | "admin" | "backoffice" | "unknown" = "unknown";
    let userAccount: any = null;
    let orderCustomer;

    if (customer && typeof customer === "object" && customer.email) {
      const existingOrderCustomer = await prisma.order_customer.findFirst({
        where: { email: customer.email },
      });
    
      if (existingOrderCustomer) {
        orderCustomer = existingOrderCustomer;
      } else {
        if (!customer.phone || !customer.name) {
          return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_customer_details" });
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
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: "user_not_found" });
      }

      userAccount = user;

      const roleName = user.user_to_role?.[0]?.role?.name || "";
      if (roleName === "Staff") orderBy = "staff";
      else if (roleName === "BackOfficeUser") orderBy = "backoffice";
      else if (["Owner", "SuperAdmin"].includes(roleName)) orderBy = "admin";
    }

    const serviceIds = services.map((item: any) => item.serviceId);
    const validItems = await prisma.services.findMany({
      where: { id: { in: serviceIds }, deleted_status: false },
    });

    const validItemIds = new Set(validItems.map((s) => s.id));
    const invalidItems = serviceIds.filter((id: string) => !validItemIds.has(id));

    if (invalidItems.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "invalid_services",
        invalidItems,
      });
    }

    let paymentStatus: "PENDING" | "SUCCESS" | "FAILED" = "PENDING";
    let transactionDetailId: string | null = null;
    const transactionType = paymentMethod.toUpperCase();

    if (transactionType === "CARD" && paymentIntent?.id) {
      const amountValue = parseFloat(String(paymentIntent.amount / 100));
      const currencyValue = paymentIntent.currency || "usd";
      const paymentMethodValue = paymentIntent.payment_method_types?.[0] || "unknown";
      const stripeStatus = paymentIntent.status.toLowerCase();
      const isSuccess = stripeStatus === "succeeded";

      const transactionDetail = await prisma.order_transaction_details.create({
        data: {
          customer_id: isAppCustomer ? userId : undefined,
          user_id: !isAppCustomer ? userId : undefined,
          value: amountValue,
          currency: currencyValue,
          success: isSuccess,
          payment_method: paymentMethodValue,
          stripe_payment_intent_id: paymentIntent.id,
          stripe_status: stripeStatus,
        },
      });

      transactionDetailId = transactionDetail.id;
      paymentStatus = isSuccess ? "SUCCESS" : "FAILED";
    }

    const orderNumber = Math.floor(100000 + Math.random() * 900000);

    const order = await prisma.orders.create({
      data: {
        order_number: orderNumber,
        customer_id: isAppCustomer ? userId : undefined,
        user_id: !isAppCustomer ? userId : undefined,
        location_id: locationId,
        total_price: total,
        payment_method: transactionType,
        payment_status: paymentStatus,
        order_status: isAppCustomer ? "PENDING" : "CONFIRMED",
        is_customer: isAppCustomer,
        staff_id,
        tip,
        discount,
        order_by: orderBy,
      },
    });

    await Promise.all(
      services.map(async (item: any) => {
        await prisma.order_details.create({
          data: {
            order_id: order.id,
            item_id: item.serviceId,
            item_name: item.name,
            item_price: item.price,
            quantity: item.quantity || 1,
            location_id: locationId,
          },
        });
      })
    );

    if (transactionType === "CARD" && transactionDetailId) {
      await prisma.order_transaction.create({
        data: {
          order_id: order.id,
          amount: total,
          type: transactionType,
          payment_status: paymentStatus,
          transaction_detail_id: transactionDetailId,
          invoice_number: `INV-${Date.now()}`,
        },
      });
    }

    if (extraCharges?.length > 0) {
      await prisma.extra_charge.createMany({
        data: extraCharges.map((charge: any) => ({
          order_id: order.id,
          name: charge.name,
          amount: charge.amount,
        })),
      });
    }

    if (isAppCustomer && appCustomer?.fcm_token) {
      try {
        await sendNotification(
          appCustomer.fcm_token,
          "Order Placed",
          "Your order has been placed successfully!",
          {
            orderId: order.id,
            totalAmount: total,
            paymentMethod,
          }
        );
      } catch (err) {
        console.error("FCM notification error (customer):", err);
      }
    }

    if (staff_id) {
      try {
        const staffUser = await prisma.user.findUnique({ where: { deleted_status: false, id: staff_id } });
        if (staffUser?.id !== userId && staffUser?.fcm_token) {
          await sendNotification(
            staffUser.fcm_token,
            "New Service Assigned",
            "You have been assigned a new service order.",
            {
              orderId: order.id,
              assignedBy: `${userAccount?.first_name ?? "System"} ${userAccount?.last_name ?? ""}`,
            }
          );
        }
      } catch (err) {
        console.error("FCM notification error (staff):", err);
      }
    }

    if (locationId) {
      await handleStaffRotation(staff_id, locationId, total);
    }

    return res.status(StatusCodes.CREATED).json({
      message: "order_created_successfully",
      order,
    });
  } catch (err) {
    console.error("Order Creation Error:", err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
