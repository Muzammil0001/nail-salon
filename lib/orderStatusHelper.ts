export const getOrderStatus = (
  order_kitchen_status: string,
  order_bar_status: string
) => {
  if (!order_kitchen_status) {
    return order_bar_status;
  } else if (!order_bar_status) {
    return order_kitchen_status;
  } else if (
    order_kitchen_status === "canceled_by_waiter" &&
    order_bar_status === "canceled_by_waiter"
  ) {
    return "canceled_by_waiter";
  } else if (
    order_kitchen_status === "canceled_by_admin" &&
    order_bar_status === "canceled_by_admin"
  ) {
    return "canceled_by_admin";
  } else if (
    order_kitchen_status === "canceled_by_kitchen" &&
    order_bar_status !== "canceled_by_bar"
  ) {
    return order_bar_status;
  } else if (
    order_kitchen_status !== "canceled_by_kitchen" &&
    order_bar_status === "canceled_by_bar"
  ) {
    return order_kitchen_status;
  } else {
    return order_kitchen_status || order_bar_status;
  }
};
import moment from "moment/moment";
export const formattedDate = (dateString: string) => {
  return moment(dateString).format("DD/MM/YYYY h:mm A");
};
