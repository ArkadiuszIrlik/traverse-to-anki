import {
  Prisma,
  PrismaClient,
  type ScrapedDeck,
} from '@generated/prisma/client';

export interface IScrapedDeckRepository {
  create: (data: Prisma.ScrapedDeckCreateInput) => Promise<ScrapedDeck>;
  findById: (id: ScrapedDeck['id']) => Promise<ScrapedDeck | null>;
}

class ScrapedDeckRepository implements IScrapedDeckRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Prisma.ScrapedDeckCreateInput) {
    const scrapedDeck = await this.prisma.scrapedDeck.create({ data });
    return scrapedDeck;
  }

  async findById(id: ScrapedDeck['id']) {
    const scrapedDeck = await this.prisma.scrapedDeck.findUnique({
      where: { id },
    });
    return scrapedDeck;
  }
}

const prismaClient = new PrismaClient();
const scrapedDeckRepository = new ScrapedDeckRepository(prismaClient);

export default scrapedDeckRepository;
