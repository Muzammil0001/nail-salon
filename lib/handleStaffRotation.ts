import prisma from "./prisma";

export async function handleStaffRotation(staff_id: string, location_id: string, amount: number) {
  try {
    if (!staff_id || !location_id || typeof amount !== 'number') {
      throw new Error("missing_required_fields_to_update_staff_turns");
    }

    const THRESHOLD =
      (
        await prisma.reservation_rotation_threshold.findFirst({
          where: { location_id },
        })
      )?.reservation_threshold ?? 50;

    const pointToAdd = amount >= THRESHOLD ? 1 : 0.5;

    const staffList = await prisma.user.findMany({
      where: { location_id, deleted_status: false },
      select: { id: true },
    });

    const allRotationsRaw = await prisma.staff_service_rotation.findMany({
      where: { user_id: { in: staffList.map((s) => s.id) } },
    });

    const rotationMap = new Map(allRotationsRaw.map((r) => [r.user_id, r]));

    for (const staff of staffList) {
      if (!rotationMap.has(staff.id)) {
        const newRotation = await prisma.staff_service_rotation.create({
          data: { user_id: staff.id, points: 0 },
        });
        rotationMap.set(staff.id, newRotation);
      }
    }

    const allRotations = Array.from(rotationMap.values());

    const currentTurn = allRotations.reduce((min, curr) =>
      curr.points < min.points ? curr : min
    );

    const staffRotation = rotationMap.get(staff_id);
    if (!staffRotation) {
      throw new Error(`Rotation entry not found for staff_id: ${staff_id}`);
    }

    const updatedPoints = staffRotation.points + pointToAdd;

    await prisma.staff_service_rotation.update({
      where: { user_id: staff_id },
      data: { points: updatedPoints },
    });

    const isLowest = staff_id === currentTurn.user_id;

    if (isLowest) {
      const updatedAllRotations = await prisma.staff_service_rotation.findMany({
        where: {
          user_id: { in: staffList.map((s) => s.id) },
        },
      });

      const thresholdLimit = Math.floor(currentTurn.points) + 1;

      const allReachedThreshold = updatedAllRotations.every(
        (r) => r.points >= thresholdLimit
      );

      const canSubtract = updatedAllRotations.every((r) => r.points - 1 >= 0);

      if (allReachedThreshold && canSubtract) {
        await Promise.all(
          updatedAllRotations.map((r) =>
            prisma.staff_service_rotation.update({
              where: { user_id: r.user_id },
              data: { points: r.points - 1 },
            })
          )
        );
      }
    }

    return {
      message: "rotation_updated",
      updatedPoints,
      staff_id,
      pointToAdd,
      isLowest,
      currentTurn: {
        user_id: currentTurn.user_id,
        points: currentTurn.points,
      },
    };
  } catch (error) {
    console.error("Staff Rotation Error:", error);
    return {
      message: "rotation_failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
