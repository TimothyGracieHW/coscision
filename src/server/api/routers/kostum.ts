import { z } from "zod";
import { adminProcedure, createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { rename, stat, } from "fs/promises";
import { join } from "path";
import { env } from "~/env";

export const kostumRouter = createTRPCRouter({
	addKostum: adminProcedure.input(z.object({
		name: z.string(),
		image: z.string().refine(async (name) => {
			try {
				if (env.UPLOAD_STORAGE.startsWith("local-")) {
					const file = await stat(join(process.cwd(), `public/upload/${name}`));
					if (file.isFile()) return true;
					else return false;
				}
			} catch (e) {
				return false;
			}
		}, {
			message: "upload file not found or error",
		}),
		link: z.string(),
		origin: z.string(),
		preference: z.enum(["Game", "Anime", "Vtuber"]),
		kset: z.string(),
	})).mutation(async ({ ctx: { db }, input: { kset, ...input } }) => {
		if (env.UPLOAD_STORAGE.startsWith("local-")) {
			await rename(join(process.cwd(), "public/upload/temp", input.image), join(process.cwd(), "public/upload", input.image))
		}

		return await db.kostum.create({
			data: {
				...input,
				kset: JSON.stringify(kset),
			},
		});
	}),
	updateKostum: adminProcedure.input(z.object({
		id: z.number(),
		name: z.string().optional(),
		image: z.string().refine(async (name) => {
			try {
				const file = await stat(join(process.cwd(), `public/upload/${name}`));
				if (file.isFile()) return true;
				else return false;
			} catch (e) {
				return false;
			}
		}, {
			message: "upload file not found",
		}).optional(),
		link: z.string().optional(),
		origin: z.string().optional(),
		preference: z.enum(["Game", "Anime", "Vtuber"]).optional(),
		kset: z.string().optional(),
	})).mutation(async ({ ctx: { db }, input: { id, kset, ...input } }) => {
			if (input.image && env.UPLOAD_STORAGE.startsWith("local-")) {
				await rename(join(process.cwd(), "public/upload/temp", input.image), join(process.cwd(), "public/upload", input.image))
		}

            return await db.kostum.update({
                where: { id, },
                data: {
                    ...input,
                    kset: kset ? JSON.stringify(kset) : undefined,
                },
            })
        }),
    deleteKostum: adminProcedure.input(z.number())
        .mutation(({ ctx: { db }, input }) => db.kostum.delete({
            where: { id: input, },
        })),
    getKostum: publicProcedure.input(z.number())
        .query(({ ctx: { db }, input }) => db.kostum.findFirstOrThrow({
            where: { id: input, },
        })),
    getKostums: publicProcedure.input(z.object({
            rank: z.boolean().default(false),
            name: z.string().optional(),
            link: z.string().optional(),
            origin: z.string().optional(),
        }).default({}))
        .query(({ ctx: { db }, }) => db.kostum.findMany({
            //
        })),
});