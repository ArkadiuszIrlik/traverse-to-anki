import { Prisma, PrismaClient, type Prop } from '@generated/prisma/client';

export interface IPropRepository {
  create: (data: Prisma.PropCreateInput) => Promise<Prop>;
  findById: (id: Prop['id']) => Promise<Prop | null>;
}

class PropRepository implements IPropRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Prisma.PropCreateInput) {
    const prop = await this.prisma.prop.create({ data });
    return prop;
  }

  async findById(id: Prop['id']) {
    const prop = await this.prisma.prop.findUnique({ where: { id } });
    return prop;
  }
}

const prismaClient = new PrismaClient();
const propRepository = new PropRepository(prismaClient);

export default propRepository;
