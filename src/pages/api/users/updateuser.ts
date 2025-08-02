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
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "location_is_not_selected" });
    }

    const {
      id,
      pin,
      password,
      display_color,
      waiter_accessrights,
      roles,
      accessrights,
      days,
    } = req.body;

    if (hasInvalidTime(days)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "invalid_time_slot_date_format_found",
      });
    }
    const currentUser = await prisma.user.findUnique({
      where: { id , deleted_status: false},
      select: { pin: true, username: true, email: true },
    });
    if (!currentUser) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "user_not_found" });
    }

    if (currentUser.pin !== pin) {
      const pinInUse = await prisma.user.findFirst({
        where: {
          pin: `${pin}`,
          id: { not: id },
          deleted_status: false,
        },
      });
      if (pinInUse) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "pin_already_in_use" });
      }
    }

    if (currentUser.username !== req.body.username) {
      const usernameInUse = await prisma.user.findFirst({
        where: {
          username: req.body.username,
          id: { not: id },
          deleted_status: false,
        },
      });
      if (usernameInUse) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "username_already_in_use" });
      }
    }


    const hasConflict = days?.some((day: any) => {
      const enabledTimeSlots = day?.timeSlots?.filter((slot: any) => slot.schedule_enabled);
      return checkConflicts(
        enabledTimeSlots?.map((slot: any) => ({
          schedule_from: formatTime(slot.schedule_from),
          schedule_to: formatTime(slot.schedule_to),
        }))
      );
    });
    

    const hasInvalidTimeRange = days?.some((day: any) =>
      day?.timeSlots?.some(
        (slot: any) =>
          slot?.schedule_enabled &&
          formatTime(slot.schedule_from) >= formatTime(slot.schedule_to)
      )
    );

    if (hasInvalidTimeRange) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error:
          "schedule_from_time_cannot_be_greater_than_or_equal_to_schedule_to_time",
      });
    }

    if (hasConflict) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error:
          "conflicting_or_duplicate_schedules_found_in_time_slots_within_the_same_day",
      });
    }

    const userScheduleData = days?.flatMap((day: any) =>
      day.timeSlots
        ?.filter((slot: any) => slot.schedule_enabled)
        ?.map((slot: any) => ({
          schedule_day: day.id,
          schedule_enabled: true,
          schedule_from: formatTime(slot.schedule_from),
          schedule_to: formatTime(slot.schedule_to),
        })) || []
    );

    await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          email: req.body.email,
          country: req.body.country,
          street: req.body.street,
          city: req.body.city,
          postcode: req.body.postcode,
          state: req.body.state,
          location_id: session.user?.selected_location_id,
          client_id: session.user.id,
          phone: req.body.phone,
          user_main: false,
          display_color:req.body?.display_color,
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          pin: `${req.body.pin}`,
          client_language_id: req.body.client_language_id,
        },
      });

      await tx.user_schedule.deleteMany({ where: { user_id: id } });
      if (userScheduleData?.length > 0) {
        await tx.user_schedule.createMany({
          data: userScheduleData?.map((schedule: any) => ({
            ...schedule,
            user_id: id,
          })),
        });
      }

      if (password) {
        await tx.user.update({
          where: { id },
          data: { password: await hashPassword(password) },
        });
      }

      await tx.user_to_role.deleteMany({ where: { user_id: id } });
      for (const role of roles) {
        await tx.user_to_role.create({
          data: {
            user_id: id,
            role_id: role,
          },
        });
      }

      await tx.accessrights.upsert({
        where: { user_id: id },
        create: { user_id: id, controls: accessrights },
        update: { controls: accessrights },
      });
    });

    if (currentUser.email && (currentUser.pin !== pin || password)) {
      let credentialsText = "";
      let credentialsHTML = "";

      if (password) {
        credentialsText += `Password: ${password}\n`;
        credentialsHTML += `<p><strong>Password:</strong> ${password}</p>`;
      }
      if (currentUser.pin !== pin) {
        credentialsText += `PIN: ${pin}\n`;
        credentialsHTML += `<p><strong>PIN:</strong> ${pin}</p>`;
      }

      // await sendEmail(
      //   currentUser.email,
      //   "Your Account Credentials Have Been Updated",
      //   `Hello ${req.body.first_name || "User"},\n\nYour account credentials have been updated:\n\n${credentialsText}\nIf you did not make these changes, please contact support immediately.`,
      //   `<p>Hello <strong>${req.body.first_name || "User"}</strong>,</p>
      //    <p>Your account credentials have been updated:</p>
      //    ${credentialsHTML}
      //    <p>If you did not make these changes, please contact support immediately.</p>`
      // );
    }

    const actionMsgs = [];
    if (password) actionMsgs.push("password updated");
    if (currentUser.pin !== pin) actionMsgs.push("PIN updated");
    if (actionMsgs.length === 0) actionMsgs.push("user info updated");

    const updatedUser = await prisma.user.findUnique({ where: { id } });

    await prisma.activity_logs.create({
      data: {
        user_id:session.user.roles.includes("Owner")
        ? session.user.id
        : session.user.client_id,
        location_id: session.user.selected_location_id || null,
        message: `User ${updatedUser?.first_name} ${updatedUser?.last_name} has been updated: ${actionMsgs.join(", ")}`,
        message_type: "info",
      },
    });

    res.status(StatusCodes.OK).json({ user: updatedUser });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
