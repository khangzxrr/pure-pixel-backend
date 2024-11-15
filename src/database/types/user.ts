import { Prisma } from "@prisma/client";

export type UserInReport = Prisma.UserGetPayload<{
  include: {
    upgradeOrders: true;
  }
}>
