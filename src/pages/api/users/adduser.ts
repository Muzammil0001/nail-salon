import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { hashPassword } from "../../../../lib/authHelper";
import sendEmail from "../../../../lib/sendEmail";
import { checkConflicts, formatTime } from "../../../../utils/scheduleUtils";
import { hasInvalidTime } from "../../../../lib/checkTimeValidation";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await validateAPI(req, res, true, ["SuperAdmin", "Owner","BackOfficeUser"], "POST");
    if (!session) return;

    if (!session.user?.selected_location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "location_is_not_selected" });
    }

    const selected_location_id = session.user?.selected_location_id;
    const {
      email,
      password,
      pin,
      country,
      street,
      city,
      postcode,
      state,
      phone,
      first_name,
      last_name,
      display_color,
      personal_identification_no,
      client_language_id,
      accessrights,
      staff_accessrights,
      days,
      roles,
    } = req.body;

    const { id: client_id } = req.body.client;
    
    if (hasInvalidTime(days)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "invalid_time_slot_date_format_found",
      });
    }
    const currentPinUsage = await prisma.user.findFirst({
      where: {
        location_id: selected_location_id,
        pin: `${pin}`,
        deleted_status: false,
      },
    });

    if (currentPinUsage) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "pin_already_in_use" });
    }

    const currentUsernameUsage = await prisma.user.findFirst({
      where: {
        location_id: selected_location_id,
        username: req.body.username,
        deleted_status: false,
      },
    });

    if (currentUsernameUsage) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "username_already_in_use" });
    }

      const currentEmailUsage = await prisma.user.findFirst({
      where: {
        location_id: selected_location_id,
        email: req.body.email,
        deleted_status: false,
      },
    });

    if (currentEmailUsage) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "email_already_in_use" });
    }
    const userScheduleData = days.flatMap((day: any) =>
      day.timeSlots
        .filter((slot: any) => slot.schedule_enabled)
        .map((slot: any) => ({
          schedule_day: day.id,
          schedule_from: formatTime(slot.schedule_from),
          schedule_to: formatTime(slot.schedule_to),
          schedule_enabled: slot.schedule_enabled,
        }))
    );

    const hasConflict = days.some((day: any) => {
      const enabledTimeSlots = day.timeSlots.filter((slot: any) => slot.schedule_enabled);

      return checkConflicts(
        enabledTimeSlots.map((slot: any) => ({
          schedule_from: formatTime(slot.schedule_from),
          schedule_to: formatTime(slot.schedule_to),
        }))
      );
    });

    const hasInvalidTimeRange = days?.some((day: any) =>
      day?.timeSlots?.some(
        (slot: any) =>
          slot?.schedule_enabled &&
          formatTime(slot?.schedule_from) >= formatTime(slot?.schedule_to)
      )
    );

    if (hasInvalidTimeRange) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "schedule_from_time_cannot_be_greater_than_or_equal_to_schedule_to_time",
      });
    }

    if (hasConflict) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "conflicting_or_duplicate_schedules_found_in_time_slots_within_the_same_day.",
      });
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: password ? await hashPassword(password) : null,
        country,
        street,
        city,
        postcode,
        state,
        display_color,
        location_id: selected_location_id,
        client_id,
        phone,
        user_main: false,
        first_name,
        last_name,
        pin: `${pin}`,
        personal_identification_no,
        client_language_id,
        user_schedule: {
          create: userScheduleData,
        },
      },
    });

    await prisma.payroll.create({
      data: {
        user_id: user.id,
        salary: 0,
        hours: 0,
        commission: 0,
        total: 0,
      },
    });

    await prisma.selected_location.create({
      data: {
        user_id: user.id,
        location_id: selected_location_id,
      },
    });

    for (const role of roles) {
      await prisma.user_to_role.create({
        data: {
          user_id: user.id,
          role_id: role,
        },
      });
    }

    await prisma.accessrights.create({
      data: {
        user_id: user.id,
        controls: accessrights,
      },
    });

    await prisma.staff_accessrights.create({
      data: {
        user_id: user.id,
        ...staff_accessrights,
      },
    });

    // if (email) {
    //   let credentialsText = "";
    //   let credentialsHTML = "";

    //   if (password) {
    //     credentialsText += `Password: ${password}\n`;
    //     credentialsHTML += `<p><strong>Password:</strong> ${password}</p>`;
    //   }

    //   if (pin) {
    //     credentialsText += `PIN: ${pin}\n`;
    //     credentialsHTML += `<p><strong>PIN:</strong> ${pin}</p>`;
    //   }

    //   await sendEmail(
    //     email,
    //     "Welcome to Our Platform",
    //     `Hello ${first_name ||
    //       "User"},\n\nYour account has been successfully created.\n\nUsername: ${
    //       user.username
    //     }\n${credentialsText}\nPlease log in and update your credentials if necessary.`,
    //     `<p>Hello <strong>${first_name || "User"}</strong>,</p>
    //      <p>Your account has been successfully created.</p>
    //      <p><strong>Username:</strong> ${user.username}</p>
    //      ${credentialsHTML}
    //      <p>Please log in and update your credentials if necessary.</p>`
    //   );
    // }

    await prisma.activity_logs.create({
      data: {
        user_id: session?.user.id,
        location_id: selected_location_id,
        message: `User ${first_name} ${last_name} (${user.username}) created successfully.`,
        message_type: "success",
      },
    });

    res.status(StatusCodes.CREATED).json({ user });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
