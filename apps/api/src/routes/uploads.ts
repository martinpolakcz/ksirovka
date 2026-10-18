import type { FastifyInstance } from "fastify";
import { getCourseHoleImage } from "../lib/course.js";
import { gameTypes, type GameType } from "../schemas/scorecard.js";

function isGameType(value: string): value is GameType {
  return (gameTypes as readonly string[]).includes(value);
}

export async function uploadRoutes(app: FastifyInstance) {
  app.get("/uploads/holes/:gameType/:hole", async (request, reply) => {
    const params = request.params as { gameType: string; hole: string };
    const hole = Number(params.hole);
    if (!isGameType(params.gameType) || !Number.isInteger(hole) || hole < 1 || hole > 20) {
      return reply.status(400).send({ error: "Neplatná jamka" });
    }
    const image = await getCourseHoleImage(params.gameType, hole);
    if (!image) {
      return reply.status(404).send({ error: "not_found" });
    }
    return reply
      .header("Cache-Control", "public, max-age=300")
      .type(image.mime)
      .send(image.data);
  });
}
