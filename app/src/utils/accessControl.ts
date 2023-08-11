import { ProjectUserRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { type TRPCContext } from "~/server/api/trpc";
import { prisma } from "~/server/db";

const isAdmin = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, role: "ADMIN" },
  });

  return !!user;
};

// No-op method for protected routes that really should be accessible to anyone.
export const requireNothing = (ctx: TRPCContext) => {
  ctx.markAccessControlRun();
};

export const requireIsProjectAdmin = async (projectId: string, ctx: TRPCContext) => {
  const userId = ctx.session?.user.id;
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const isAdmin = await prisma.projectUser.findFirst({
    where: {
      userId,
      projectId,
      role: "ADMIN",
    },
  });

  if (!isAdmin) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  ctx.markAccessControlRun();
};

export const requireCanViewProject = async (projectId: string, ctx: TRPCContext) => {
  const userId = ctx.session?.user.id;
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const canView = await prisma.projectUser.findFirst({
    where: {
      userId,
      projectId,
    },
  });

  if (!canView) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  ctx.markAccessControlRun();
};

export const requireCanModifyProject = async (projectId: string, ctx: TRPCContext) => {
  const userId = ctx.session?.user.id;
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const canModify = await prisma.projectUser.findFirst({
    where: {
      userId,
      projectId,
      role: { in: [ProjectUserRole.ADMIN, ProjectUserRole.MEMBER] },
    },
  });

  if (!canModify) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  ctx.markAccessControlRun();
};

export const requireCanViewDataset = async (datasetId: string, ctx: TRPCContext) => {
  const dataset = await prisma.dataset.findFirst({
    where: {
      id: datasetId,
      project: {
        projectUsers: {
          some: {
            role: { in: [ProjectUserRole.ADMIN, ProjectUserRole.MEMBER] },
            userId: ctx.session?.user.id,
          },
        },
      },
    },
  });

  if (!dataset) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  ctx.markAccessControlRun();
};

export const requireCanModifyDataset = async (datasetId: string, ctx: TRPCContext) => {
  // Right now all users who can view a dataset can also modify it
  await requireCanViewDataset(datasetId, ctx);
};

export const requireCanViewExperiment = async (experimentId: string, ctx: TRPCContext) => {
  await prisma.experiment.findFirst({
    where: { id: experimentId },
  });

  // Right now all experiments are publicly viewable, so this is a no-op.
  ctx.markAccessControlRun();
};

export const canModifyExperiment = async (experimentId: string, userId: string) => {
  const [adminUser, experiment] = await Promise.all([
    isAdmin(userId),
    prisma.experiment.findFirst({
      where: {
        id: experimentId,
        project: {
          projectUsers: {
            some: {
              role: { in: [ProjectUserRole.ADMIN, ProjectUserRole.MEMBER] },
              userId,
            },
          },
        },
      },
    }),
  ]);

  return adminUser || !!experiment;
};

export const requireCanModifyExperiment = async (experimentId: string, ctx: TRPCContext) => {
  const userId = ctx.session?.user.id;
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!(await canModifyExperiment(experimentId, userId))) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  ctx.markAccessControlRun();
};