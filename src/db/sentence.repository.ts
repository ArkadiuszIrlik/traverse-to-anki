import { Prisma, PrismaClient, type Sentence } from '@generated/prisma/client';

export interface ISentenceRepository {
  create: (data: Prisma.SentenceCreateInput) => Promise<Sentence>;
  findById: (id: Sentence['id']) => Promise<Sentence | null>;
}

class SentenceRepository implements ISentenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Prisma.SentenceCreateInput) {
    const sentence = await this.prisma.sentence.create({ data });
    return sentence;
  }

  async findById(id: Sentence['id']) {
    const sentence = await this.prisma.sentence.findUnique({ where: { id } });
    return sentence;
  }
}

const prismaClient = new PrismaClient();
const sentenceRepository = new SentenceRepository(prismaClient);

export default sentenceRepository;
